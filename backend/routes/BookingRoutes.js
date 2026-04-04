const express = require('express')
const router  = express.Router()
const auth    = require('../middleware/authMiddleware')   // ← fixed: was '../middleware/auth'
const ctrl    = require('../controllers/BookingController') // ← fixed: was './booking.controller'

// Customer routes
router.post('/',        auth, ctrl.createBooking)     // POST   /api/bookings
router.get('/',         auth, ctrl.getMyBookings)     // GET    /api/bookings
router.get('/active',   auth, ctrl.getActiveBooking)  // GET    /api/bookings/active  (must be before /:id)
router.get('/:id',      auth, ctrl.getBookingById)    // GET    /api/bookings/:id

// Porter routes
router.put('/:id',      auth, ctrl.updateBookingStatus) // PUT  /api/bookings/:id

module.exports = router