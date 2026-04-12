require('dotenv').config()

const express        = require('express')
const cors           = require('cors')
const app            = express()
const authRoutes     = require('./routes/authRoutes')
const paymentRoutes  = require('./routes/paymentRoutes')
const authMiddleware = require('./middleware/authMiddleware')
const pool           = require('./config/db')

app.use(cors())
app.use(express.json())

app.use('/api/auth',    authRoutes)
app.use('/api/payment', paymentRoutes)

// ── GET PORTERS (public) ──────────────────────────────────────────────────────
app.get('/api/porters', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, rating, is_available, station,
              COALESCE((SELECT MIN(price) FROM porter_routes WHERE porter_id = users.id),100) AS price
       FROM users WHERE role = 'porter' AND is_available = true ORDER BY rating DESC LIMIT 10`
    )
    res.json(result.rows)
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

// ── GET CURRENT USER PROFILE ──────────────────────────────────────────────────
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, role, coolie_num, mobile, city, station, is_available
       FROM users WHERE id = $1`,
      [req.user.id]
    )
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' })
    res.json(result.rows[0])
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

// ── CREATE BOOKING ────────────────────────────────────────────────────────────
app.post('/api/bookings', authMiddleware, async (req, res) => {
  try {
    const { from_loc, to_loc, bags, price_min, price_max, service_type, pnr, train_no, coach, station } = req.body

    if (!from_loc || !to_loc || !price_min || !price_max)
      return res.status(400).json({ error: 'from_loc, to_loc, price_min and price_max are required' })

    // Get customer info for fallback station
    const userResult = await pool.query('SELECT mobile, name, station AS cust_station FROM users WHERE id = $1', [req.user.id])
    const customer = userResult.rows[0]
    const bookingStation = station || customer?.cust_station || null

    const result = await pool.query(
      `INSERT INTO bookings
        (customer_id, from_loc, to_loc, bags, price_min, price_max,
         service_type, pnr, train_no, coach, station, status, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'pending', NOW())
       RETURNING *`,
      [req.user.id, from_loc, to_loc, bags || 1, price_min, price_max,
       service_type || 'luggage', pnr || null, train_no || null, coach || null, bookingStation]
    )

    const booking = result.rows[0]
    res.status(201).json({ ...booking, customer_name: customer?.name, customer_mobile: customer?.mobile })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

// ── GET BOOKINGS LIST ─────────────────────────────────────────────────────────
app.get('/api/bookings', authMiddleware, async (req, res) => {
  try {
    const { id, role } = req.user
    let result

    if (role === 'porter') {
      // Get porter's station
      const porterRes = await pool.query('SELECT station FROM users WHERE id = $1', [id])
      const porterStation = porterRes.rows[0]?.station

      // Porter sees:
      // 1. All pending bookings at their station (new requests to accept)
      // 2. All bookings already assigned to them (their own jobs)
      result = await pool.query(
        `SELECT b.*, u.name AS customer_name, u.mobile AS customer_mobile
         FROM bookings b
         JOIN users u ON u.id = b.customer_id
         WHERE b.porter_id = $1
            OR (b.status = 'pending' AND (b.station = $2 OR (b.station IS NULL AND u.station = $2)))
         ORDER BY b.created_at DESC`,
        [id, porterStation]
      )
    } else {
      result = await pool.query(
        `SELECT b.*, u.name AS porter_name, u.mobile AS porter_mobile
         FROM bookings b
         LEFT JOIN users u ON u.id = b.porter_id
         WHERE b.customer_id = $1
         ORDER BY b.created_at DESC`,
        [id]
      )
    }
    res.json(result.rows)
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

// ── GET ACTIVE BOOKING ───────────────────────────────────────────────────────
app.get('/api/bookings/active', authMiddleware, async (req, res) => {
  try {
    const { id, role } = req.user
    let result

    if (role === 'porter') {
      result = await pool.query(
        `SELECT b.*,
                cu.name   AS customer_name,
                cu.mobile AS customer_mobile
         FROM bookings b
         JOIN users cu ON cu.id = b.customer_id
         WHERE b.porter_id = $1 AND b.status = 'confirmed'
         ORDER BY b.created_at DESC LIMIT 1`,
        [id]
      )
    } else {
      result = await pool.query(
        `SELECT b.*,
                pu.name       AS porter_name,
                pu.mobile     AS porter_mobile,
                pu.coolie_num AS porter_coolie_num
         FROM bookings b
         LEFT JOIN users pu ON pu.id = b.porter_id
         WHERE b.customer_id = $1 AND b.status IN ('pending','confirmed')
         ORDER BY b.created_at DESC LIMIT 1`,
        [id]
      )
    }

    if (!result.rows.length)
      return res.status(404).json({ error: 'No active booking found' })

    res.json(result.rows[0])
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

// ── GET SINGLE BOOKING BY ID ──────────────────────────────────────────────────
app.get('/api/bookings/:id', authMiddleware, async (req, res) => {
  try {
    const { id }               = req.params
    const { id: userId, role } = req.user

    const result = await pool.query(
      `SELECT b.*,
              cu.name       AS customer_name,
              cu.mobile     AS customer_mobile,
              pu.name       AS porter_name,
              pu.mobile     AS porter_mobile,
              pu.coolie_num AS porter_coolie_num
       FROM bookings b
       JOIN  users cu ON cu.id = b.customer_id
       LEFT JOIN users pu ON pu.id = b.porter_id
       WHERE b.id = $1`,
      [id]
    )

    if (!result.rows.length)
      return res.status(404).json({ error: 'Booking not found' })

    const booking    = result.rows[0]
    const isCustomer = booking.customer_id === userId
    const isPorter   = booking.porter_id   === userId
    const isAdmin    = role === 'admin'

    if (!isCustomer && !isPorter && !isAdmin)
      return res.status(403).json({ error: 'Not authorized' })

    const porter = booking.porter_id ? {
      id:         booking.porter_id,
      name:       booking.porter_name,
      mobile:     booking.porter_mobile,
      coolie_num: booking.porter_coolie_num,
    } : null

    res.json({ ...booking, porter })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

// ── UPDATE BOOKING STATUS ─────────────────────────────────────────────────────
app.put('/api/bookings/:id', authMiddleware, async (req, res) => {
  try {
    const { id }     = req.params
    const { status } = req.body
    const { role, id: userId } = req.user

    const validStatuses = ['confirmed', 'rejected', 'completed', 'cancelled']
    if (!validStatuses.includes(status))
      return res.status(400).json({ error: 'Invalid status' })

    const bookingRes = await pool.query('SELECT * FROM bookings WHERE id = $1', [id])
    if (!bookingRes.rows.length)
      return res.status(404).json({ error: 'Booking not found' })

    const booking = bookingRes.rows[0]

    if (status === 'cancelled') {
      const isOwnerCustomer = role === 'customer' && booking.customer_id === userId
      const isOwnerPorter   = role === 'porter'   && (booking.porter_id === userId || booking.porter_id === null)
      if (!isOwnerCustomer && !isOwnerPorter)
        return res.status(403).json({ error: 'Not authorized to cancel this booking' })
      if (!['pending', 'confirmed'].includes(booking.status))
        return res.status(400).json({ error: 'Can only cancel pending or confirmed bookings' })
    } else {
      if (role !== 'porter')
        return res.status(403).json({ error: 'Only porters can update booking status' })
    }

const result = await pool.query(
  `UPDATE bookings
   SET status     = $1::varchar,
       porter_id  = CASE WHEN $1::varchar = 'confirmed' THEN $2::integer ELSE porter_id END,
       updated_at = NOW()
   WHERE id = $3::integer
   RETURNING *`,
  [status, userId, id]
)

    res.json(result.rows[0])
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

// ── TOGGLE PORTER AVAILABILITY ────────────────────────────────────────────────
app.put('/api/porter/availability', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'porter')
      return res.status(403).json({ error: 'Porters only' })
    const { is_available } = req.body
    await pool.query('UPDATE users SET is_available = $1 WHERE id = $2', [is_available, req.user.id])
    res.json({ success: true, is_available })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

// ── PORTER PRICE ROUTES ───────────────────────────────────────────────────────
app.get('/api/porter-routes', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM porter_routes WHERE porter_id = $1 ORDER BY id', [req.user.id])
    res.json(result.rows)
  } catch (err) { res.status(500).json({ error: 'Server error' }) }
})

app.post('/api/porter-routes', authMiddleware, async (req, res) => {
  try {
    const { routes } = req.body
    await pool.query('DELETE FROM porter_routes WHERE porter_id = $1', [req.user.id])
    for (const r of routes) {
      await pool.query(
        'INSERT INTO porter_routes (porter_id, from_loc, to_loc, price) VALUES ($1,$2,$3,$4)',
        [req.user.id, r.from_loc, r.to_loc, r.price]
      )
    }
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: 'Server error' }) }
})

// ── ADMIN: GET ALL USERS ──────────────────────────────────────────────────────
app.get('/api/admin/users', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admins only' })
    const result = await pool.query(
      `SELECT id, name, email, role, coolie_num, city, station, mobile, created_at FROM users ORDER BY created_at DESC`
    )
    res.json(result.rows)
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

// ── ADMIN: DELETE USER ────────────────────────────────────────────────────────
app.delete('/api/admin/users/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admins only' })
    await pool.query('DELETE FROM users WHERE id = $1', [req.params.id])
    res.json({ success: true })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

// ── ADMIN: GET ALL BOOKINGS ───────────────────────────────────────────────────
app.get('/api/admin/bookings', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admins only' })
    const result = await pool.query(
      `SELECT b.*, cu.name AS customer_name, pu.name AS porter_name
       FROM bookings b
       JOIN  users cu ON cu.id = b.customer_id
       LEFT JOIN users pu ON pu.id = b.porter_id
       ORDER BY b.created_at DESC`
    )
    res.json(result.rows)
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

// ── START SERVER ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`))