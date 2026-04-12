const express    = require('express')
const Razorpay   = require('razorpay')
const crypto     = require('crypto')
const router     = express.Router()
const authMiddleware = require('../middleware/authMiddleware')
const pool       = require('../config/db')

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

// ── CREATE ORDER ──
// Called when customer clicks "Pay Now"
// Creates a Razorpay order and returns order_id to frontend
router.post('/create-order', authMiddleware, async (req, res) => {
  try {
    const { amount, booking_id } = req.body
    // amount must be in paise (₹1 = 100 paise)
    const order = await razorpay.orders.create({
      amount:   Math.round(amount * 100),
      currency: 'INR',
      receipt:  `booking_${booking_id}`,
      notes:    { booking_id, customer_id: req.user.id },
    })
    res.json({ order_id: order.id, amount: order.amount, currency: order.currency })
  } catch (err) {
    console.error('Razorpay create order error:', err)
    res.status(500).json({ error: 'Could not create payment order' })
  }
})

// ── VERIFY PAYMENT ──
// Called after user completes payment on Razorpay popup
// Verifies signature and marks booking as paid
router.post('/verify', authMiddleware, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, booking_id } = req.body

    // Verify signature
    const body      = razorpay_order_id + '|' + razorpay_payment_id
    const expected  = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex')

    if (expected !== razorpay_signature) {
      return res.status(400).json({ error: 'Payment verification failed' })
    }

    // Mark booking as paid in DB
    await pool.query(
      `UPDATE bookings SET status='confirmed', payment_id=$1, payment_status='paid' WHERE id=$2`,
      [razorpay_payment_id, booking_id]
    )

    res.json({ success: true, payment_id: razorpay_payment_id })
  } catch (err) {
    console.error('Razorpay verify error:', err)
    res.status(500).json({ error: 'Payment verification error' })
  }
})

module.exports = router