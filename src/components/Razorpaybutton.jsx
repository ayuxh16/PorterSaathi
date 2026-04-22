import { useEffect } from 'react'

const API = 'https://portersaathi-1.onrender.com'

export default function RazorpayButton({ bookingId, amount, onSuccess, onFailure }) {
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)
    return () => document.body.removeChild(script)
  }, [])

  const handlePayment = async () => {
    try {
      const res = await fetch(`${API}/api/payment/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, bookingId }),
      })
      const order = await res.json()

      if (!order.id) {
        onFailure && onFailure('Failed to create payment order')
        return
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'PorterSaathi',
        description: `Booking #${bookingId}`,
        order_id: order.id,
        handler: async (response) => {
          try {
            const verifyRes = await fetch(`${API}/api/payment/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature:  response.razorpay_signature,
                bookingId,
              }),
            })
            const result = await verifyRes.json()
            if (result.success) {
              onSuccess && onSuccess(response.razorpay_payment_id)
            } else {
              onFailure && onFailure('Payment verification failed')
            }
          } catch {
            onFailure && onFailure('Verification error')
          }
        },
        prefill: { name: '', email: '', contact: '' },
        theme: { color: '#E8341C' },
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', (response) => {
        onFailure && onFailure(response.error.description)
      })
      rzp.open()
    } catch {
      onFailure && onFailure('Could not connect to server')
    }
  }

  return (
    <button
      onClick={handlePayment}
      style={{
        width: '100%',
        padding: '12px 24px',
        borderRadius: 10,
        background: 'linear-gradient(135deg,#E8341C,#F5A623)',
        border: 'none',
        color: '#fff',
        fontWeight: 700,
        fontSize: 15,
        cursor: 'pointer',
        boxShadow: '0 4px 14px rgba(232,52,28,0.35)',
      }}
    >
      💳 Pay ₹{amount} Now
    </button>
  )
}
