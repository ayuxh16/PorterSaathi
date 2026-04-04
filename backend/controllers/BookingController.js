const pool = require('../config/db')

/* ─────────────────────────────────────────────
   POST /api/bookings
   Customer creates a new booking request
───────────────────────────────────────────── */
exports.createBooking = async (req, res) => {
  try {
    const userId = req.user.id
    const {
      from_loc,
      to_loc,
      bags,
      price_min,
      price_max,
      service_type,
      pnr,
      train_no,
      coach,
      station,
    } = req.body

    if (!from_loc || !to_loc || !price_min || !price_max) {
      return res.status(400).json({ error: 'from_loc, to_loc, price_min and price_max are required' })
    }

    // Get customer mobile to share with porter after match
    const userResult = await pool.query('SELECT mobile, name FROM users WHERE id = $1', [userId])
    const customer   = userResult.rows[0]

    const result = await pool.query(
      `INSERT INTO bookings
        (customer_id, from_loc, to_loc, bags, price_min, price_max,
         service_type, pnr, train_no, coach, station, status, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'pending', NOW())
       RETURNING *`,
      [
        userId,
        from_loc,
        to_loc,
        bags        || 1,
        price_min,
        price_max,
        service_type || 'luggage',
        pnr          || null,
        train_no     || null,
        coach        || null,
        station      || null,
      ]
    )

    const booking = result.rows[0]

    // Return with customer info attached
    res.status(201).json({
      ...booking,
      customer_name:   customer?.name,
      customer_mobile: customer?.mobile,
    })
  } catch (err) {
    console.error('createBooking error:', err)
    res.status(500).json({ error: 'Server error' })
  }
}

/* ─────────────────────────────────────────────
   GET /api/bookings
   Returns all bookings for the logged-in user
   (customer sees their own, porter sees assigned to them)
───────────────────────────────────────────── */
exports.getMyBookings = async (req, res) => {
  try {
    const userId   = req.user.id
    const userRole = req.user.role

    let result

    if (userRole === 'porter') {
      // Porter sees bookings assigned to them OR pending at their station
      const porterResult = await pool.query(
        'SELECT station FROM users WHERE id = $1', [userId]
      )
      const porterStation = porterResult.rows[0]?.station

      result = await pool.query(
        `SELECT b.*,
                cu.name   AS customer_name,
                cu.mobile AS customer_mobile
         FROM bookings b
         JOIN users cu ON cu.id = b.customer_id
        WHERE (b.porter_id = $1 OR (b.status = 'pending' AND cu.station = $2))
         ORDER BY b.created_at DESC`,
        [userId, porterStation]
      )
    } else {
      // Customer sees their own bookings with porter info
      result = await pool.query(
        `SELECT b.*,
                pu.name       AS porter_name,
                pu.mobile     AS porter_mobile,
                pu.coolie_num AS porter_coolie_num,
                pu.id         AS porter_user_id
         FROM bookings b
         LEFT JOIN users pu ON pu.id = b.porter_id
         WHERE b.customer_id = $1
         ORDER BY b.created_at DESC`,
        [userId]
      )
    }

    res.json(result.rows)
  } catch (err) {
    console.error('getMyBookings error:', err)
    res.status(500).json({ error: 'Server error' })
  }
}

/* ─────────────────────────────────────────────
   GET /api/bookings/active
   Returns the single currently active booking
   Used by the map page to load booking info
───────────────────────────────────────────── */
exports.getActiveBooking = async (req, res) => {
  try {
    const userId   = req.user.id
    const userRole = req.user.role

    let result

    if (userRole === 'porter') {
      result = await pool.query(
        `SELECT b.*,
                cu.name   AS customer_name,
                cu.mobile AS customer_mobile
         FROM bookings b
         JOIN users cu ON cu.id = b.customer_id
         WHERE b.porter_id = $1 AND b.status = 'confirmed'
         ORDER BY b.created_at DESC
         LIMIT 1`,
        [userId]
      )
    } else {
      result = await pool.query(
        `SELECT b.*,
                pu.name       AS porter_name,
                pu.mobile     AS porter_mobile,
                pu.coolie_num AS porter_coolie_num
         FROM bookings b
         LEFT JOIN users pu ON pu.id = b.porter_id
         WHERE b.customer_id = $1 AND b.status IN ('pending', 'confirmed')
         ORDER BY b.created_at DESC
         LIMIT 1`,
        [userId]
      )
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No active booking found' })
    }

    res.json(result.rows[0])
  } catch (err) {
    console.error('getActiveBooking error:', err)
    res.status(500).json({ error: 'Server error' })
  }
}

/* ─────────────────────────────────────────────
   GET /api/bookings/:id          ← THE MISSING ROUTE
   Returns a single booking by ID
   Used by frontend polling to check status
───────────────────────────────────────────── */
exports.getBookingById = async (req, res) => {
  try {
    const { id }   = req.params
    const userId   = req.user.id
    const userRole = req.user.role

    const result = await pool.query(
      `SELECT b.*,
              cu.name       AS customer_name,
              cu.mobile     AS customer_mobile,
              pu.name       AS porter_name,
              pu.mobile     AS porter_mobile,
              pu.coolie_num AS porter_coolie_num
       FROM bookings b
       JOIN users cu ON cu.id = b.customer_id
       LEFT JOIN users pu ON pu.id = b.porter_id
       WHERE b.id = $1`,
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' })
    }

    const booking = result.rows[0]

    // Security: only the customer or assigned porter can view this booking
    const isCustomer = booking.customer_id === userId
    const isPorter   = booking.porter_id   === userId
    const isAdmin    = userRole === 'admin'

    if (!isCustomer && !isPorter && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized to view this booking' })
    }

    // Build porter object for frontend matchedPorter state
    const porter = booking.porter_id ? {
      id:         booking.porter_id,
      name:       booking.porter_name,
      mobile:     booking.porter_mobile,
      coolie_num: booking.porter_coolie_num,
    } : null

    res.json({ ...booking, porter })
  } catch (err) {
    console.error('getBookingById error:', err)
    res.status(500).json({ error: 'Server error' })
  }
}

/* ─────────────────────────────────────────────
   PUT /api/bookings/:id
   Porter accepts or rejects a booking
───────────────────────────────────────────── */
exports.updateBookingStatus = async (req, res) => {
  try {
    const { id }     = req.params
    const { status } = req.body
    const userId     = req.user.id

    if (!['confirmed', 'rejected', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' })
    }

    // If porter is confirming, assign themselves
    const result = await pool.query(
      `UPDATE bookings
       SET status    = $1,
           porter_id = CASE WHEN $1 = 'confirmed' THEN $2 ELSE porter_id END,
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [status, userId, id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' })
    }

    res.json(result.rows[0])
  } catch (err) {
    console.error('updateBookingStatus error:', err)
    res.status(500).json({ error: 'Server error' })
  }
}