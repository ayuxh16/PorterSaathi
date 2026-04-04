require('dotenv').config()

const express = require('express')
const cors    = require('cors')
const app     = express()

const authRoutes     = require('./routes/authRoutes')
const bookingRoutes  = require('./routes/BookingRoutes')   // ← ADD THIS
const authMiddleware = require('./middleware/authMiddleware')
const pool           = require('./config/db')

app.use(cors())
app.use(express.json())

// ── AUTH ROUTES ──
app.use('/api/auth', authRoutes)

// ── BOOKING ROUTES (all /api/bookings/* handled here) ──
app.use('/api/bookings', bookingRoutes)   // ← THIS IS WHAT WAS MISSING

// ── ADMIN MIDDLEWARE ──
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' })
  next()
}

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

// ══════════════════════════════════════
// ── ADMIN ROUTES ──
// ══════════════════════════════════════

// GET all users
app.get('/api/admin/users', authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, coolie_num, mobile, city, station, created_at FROM users ORDER BY created_at DESC'
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// DELETE a user
app.delete('/api/admin/users/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params
    if (parseInt(id) === req.user.id) return res.status(400).json({ error: 'Cannot delete your own account' })
    await pool.query('DELETE FROM bookings WHERE customer_id=$1 OR porter_id=$1', [id])
    await pool.query('DELETE FROM porter_routes WHERE porter_id=$1', [id])
    await pool.query('DELETE FROM users WHERE id=$1', [id])
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// GET all bookings (admin)
app.get('/api/admin/bookings', authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, c.name AS customer_name, p.name AS porter_name
       FROM bookings b
       JOIN users c ON c.id = b.customer_id
       LEFT JOIN users p ON p.id = b.porter_id
       ORDER BY b.created_at DESC`
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// ══════════════════════════════════════
// ── PORTER / CUSTOMER ROUTES ──
// ══════════════════════════════════════

// GET available porters — filtered by station
app.get('/api/porters', async (req, res) => {
  try {
    const { station } = req.query   // ← honour station filter from frontend
    const params = []
    let where = `WHERE role = 'porter' AND is_available = true`

    if (station) {
      params.push(station)
      where += ` AND station = $${params.length}`
    }

    const result = await pool.query(
      `SELECT id, name, rating, is_available, station, coolie_num,
              COALESCE((SELECT MIN(price) FROM porter_routes WHERE porter_id = users.id), 100) AS price
       FROM users
       ${where}
       ORDER BY rating DESC
       LIMIT 20`,
      params
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// GET porter routes
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

// SAVE porter routes
app.post('/api/porter-routes', authMiddleware, async (req, res) => {
  try {
    const { routes } = req.body
    await pool.query('DELETE FROM porter_routes WHERE porter_id=$1', [req.user.id])
    for (const r of routes) {
      await pool.query(
        'INSERT INTO porter_routes (porter_id, from_loc, to_loc, price) VALUES ($1,$2,$3,$4)',
        [req.user.id, r.from_loc, r.to_loc, r.price]
      )
    }
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`))