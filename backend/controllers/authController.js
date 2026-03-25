const bcrypt = require('bcrypt')
const jwt    = require('jsonwebtoken')
const pool   = require('../config/db')

const JWT_SECRET = process.env.JWT_SECRET

// ── SIGNUP ──
exports.signup = async (req, res) => {
  try {
    const { name, email, password, role, coolie_num, coolieNum, mobile, city, station } = req.body

    const coolieNumber = coolie_num || coolieNum

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password and role are required' })
    }

    // Check existing user
    const existing = await pool.query('SELECT id FROM users WHERE email=$1', [email])
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' })
    }

    // Porter must provide coolie number
    if (role === 'porter' && !coolieNumber) {
      return res.status(400).json({ error: 'Coolie registration number is required for porters' })
    }

    const hashed = await bcrypt.hash(password, 10)

    const result = await pool.query(
      `INSERT INTO users (name, email, password, role, coolie_num, mobile, city, station)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, name, email, role`,
      [name, email, hashed, role, coolieNumber || null, mobile || null, city || null, station || null]
    )

    res.json({ message: 'Signup successful', user: result.rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
}

// ── LOGIN ──
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const result = await pool.query('SELECT * FROM users WHERE email=$1', [email])
    const user   = result.rows[0]

    if (!user) {
      return res.status(400).json({ error: 'No account found with this email' })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect password' })
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      token,
      user: { id: user.id, name: user.name, role: user.role }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
}