require('dotenv').config()

const express = require('express')
const cors    = require('cors')
const app     = express()

const authRoutes     = require('./routes/authRoutes')
const authMiddleware = require('./middleware/authMiddleware')
const pool           = require('./config/db')

// ── MIDDLEWARE ──
app.use(cors())
app.use(express.json())

// ── AUTH ROUTES ──
app.use('/api/auth', authRoutes)

// ── GET CURRENT USER PROFILE ──
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, coolie_num, mobile, city, station, rating, is_available FROM users WHERE id=$1',
      [req.user.id]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' })
    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// ── GET PORTERS (public) ──
app.get('/api/porters', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, rating, is_available, station,
              COALESCE(
                (SELECT MIN(price) FROM porter_routes WHERE porter_id = users.id),
                100
              ) AS price
       FROM users
       WHERE role = 'porter' AND is_available = true
       ORDER BY rating DESC
       LIMIT 10`
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// ── CREATE BOOKING (protected) ──
app.post('/api/bookings', authMiddleware, async (req, res) => {
  try {
    const { porter_id, from_loc, to_loc, bags, price } = req.body
    const customer_id = req.user.id

    const result = await pool.query(
      `INSERT INTO bookings (customer_id, porter_id, from_loc, to_loc, bags, price, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING *`,
      [customer_id, porter_id, from_loc, to_loc, bags || 1, price]
    )
    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// ── GET BOOKINGS (protected) ──
app.get('/api/bookings', authMiddleware, async (req, res) => {
  try {
    const { id, role } = req.user
    let result

    if (role === 'porter') {
      result = await pool.query(
        `SELECT b.*, u.name AS customer_name
         FROM bookings b
         JOIN users u ON u.id = b.customer_id
         WHERE b.porter_id = $1
         ORDER BY b.created_at DESC`,
        [id]
      )
    } else {
      result = await pool.query(
        `SELECT b.*, u.name AS porter_name
         FROM bookings b
         LEFT JOIN users u ON u.id = b.porter_id
         WHERE b.customer_id = $1
         ORDER BY b.created_at DESC`,
        [id]
      )
    }
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// ── UPDATE BOOKING STATUS (porter only) ──
app.put('/api/bookings/:id', authMiddleware, async (req, res) => {
  try {
    const { id }     = req.params
    const { status } = req.body

    if (req.user.role !== 'porter') {
      return res.status(403).json({ error: 'Only porters can update bookings' })
    }

    const booking = await pool.query('SELECT * FROM bookings WHERE id=$1', [id])
    if (booking.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' })
    }
    if (booking.rows[0].porter_id !== req.user.id) {
      return res.status(403).json({ error: 'Not your booking' })
    }

    await pool.query('UPDATE bookings SET status=$1 WHERE id=$2', [status, id])
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// ── GET PORTER ROUTES/PRICING (protected) ──
app.get('/api/porter-routes', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM porter_routes WHERE porter_id=$1 ORDER BY id',
      [req.user.id]
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// ── SAVE PORTER ROUTES/PRICING (protected) ──
app.post('/api/porter-routes', authMiddleware, async (req, res) => {
  try {
    const { routes } = req.body
    const porter_id  = req.user.id

    await pool.query('DELETE FROM porter_routes WHERE porter_id=$1', [porter_id])

    for (const r of routes) {
      await pool.query(
        'INSERT INTO porter_routes (porter_id, from_loc, to_loc, price) VALUES ($1,$2,$3,$4)',
        [porter_id, r.from_loc, r.to_loc, r.price]
      )
    }
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// ── START ──
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`server running on http://localhost:${PORT}`)
})