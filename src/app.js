const express     = require('express')
const cors        = require('cors')

const authRoutes    = require('./routes/authRoutes')
const porterRoutes  = require('./modules/porters/porter.routes')
const bookingRoutes = require('./routes/booking.routes')

const app = express()

app.use(cors())
app.use(express.json())

// ── Routes ──
app.use('/api/auth',     authRoutes)
app.use('/api/porters',  porterRoutes)
app.use('/api/bookings', bookingRoutes)   // ← ALL booking routes now active

// ── Health check ──
app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

module.exports = app