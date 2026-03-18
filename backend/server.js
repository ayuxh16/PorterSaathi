const express = require('express')
const cors = require('cors')

const app = express()

app.use(cors())
app.use(express.json())

let bookings = []   // temporary storage

// ✅ CREATE BOOKING
app.post('/api/bookings', (req, res) => {
  const booking = req.body
  bookings.push(booking)

  console.log('New Booking:', booking)

  res.json({ success: true })
})

// ✅ GET BOOKINGS (for porter)
app.get('/api/bookings', (req, res) => {
  res.json(bookings)
})

app.listen(5000, () => console.log('Server running on port 5000'))