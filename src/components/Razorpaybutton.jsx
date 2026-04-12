import { useState } from 'react'

// Loads Razorpay script dynamically
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (document.getElementById('razorpay-script')) return resolve(true)
    const script = document.createElement('script')
    script.id  = 'razorpay-script'
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload  = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function RazorpayButton({ bookingId, amount, onSuccess, onFailure }) {
  const [loading, setLoading] = useState(false)

  const handlePayment = async () => {
    setLoading(true)
    try {
      const loaded = await loadRazorpayScript()
      if (!loaded) {
        alert('Failed to load payment gateway. Check your internet connection.')
        setLoading(false)
        return
      }

      const token = localStorage.getItem('token')
      const user  = JSON.parse(localStorage.getItem('user') || '{}')

      // Step 1 — Create order on backend
      const res  = await fetch('http://localhost:5000/api/payment/create-order', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ amount, booking_id: bookingId }),
      })
      const order = await res.json()

      if (!order.order_id) {
        alert('Could not initiate payment. Please try again.')
        setLoading(false)
        return
      }

      // Step 2 — Open Razorpay checkout popup
      const options = {
        key:         import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount:      order.amount,
        currency:    order.currency,
        name:        'PorterSaathi',
        description: `Booking #${bookingId}`,
        image:       '/favicon.ico',
        order_id:    order.order_id,

        handler: async (response) => {
          // Step 3 — Verify payment on backend
          const verifyRes = await fetch('http://localhost:5000/api/payment/verify', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              booking_id:          bookingId,
            }),
          })
          const result = await verifyRes.json()
          if (result.success) {
            onSuccess?.(result.payment_id)
          } else {
            onFailure?.('Payment verification failed')
          }
        },

        prefill: {
          name:  user.name  || '',
          email: user.email || '',
        },

        theme: { color: '#E8341C' },

        modal: {
          ondismiss: () => {
            setLoading(false)
            onFailure?.('Payment cancelled')
          },
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', (response) => {
        onFailure?.(response.error.description)
        setLoading(false)
      })
      rzp.open()
    } catch (err) {
      console.error('Payment error:', err)
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      className="btn-primary"
      onClick={handlePayment}
      disabled={loading}
      style={{ display: 'flex', alignItems: 'center', gap: 8 }}
    >
      {loading ? (
        <>⏳ Processing…</>
      ) : (
        <>💳 Pay ₹{amount}</>
      )}
    </button>
  )
}


