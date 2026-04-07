import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Chatbot.css'

const QUICK_REPLIES = [
  { label: '📦 How to book?',       id: 'how_book'     },
  { label: '💰 Pricing info',       id: 'pricing'      },
  { label: '🧳 Who are porters?',   id: 'who_porter'   },
  { label: '⭐ Ratings & reviews',  id: 'ratings'      },
  { label: '❌ Cancel booking',     id: 'cancel'       },
  { label: '💳 Payment methods',    id: 'payment'      },
  { label: '🆘 Need help',          id: 'help'         },
]

const RESPONSES = {
  how_book: {
    text: `Booking a porter is super easy! 🎉\n\n1. Go to **Book a Porter**\n2. Enter your pickup & drop point\n3. Choose a porter from the list\n4. Tap **Confirm Booking**\n\nThe porter will accept within minutes!`,
    action: { label: 'Book Now →', route: '/booking' },
  },
  pricing: {
    text: `Prices are set by porters per route 💸\n\nTypical rates at NDLS:\n• Platform → Exit Gate: ₹80–₹120\n• Platform → Parking: ₹150–₹200\n• Platform → Platform: ₹60–₹100\n\nNo hidden charges. What you see is what you pay!`,
  },
  who_porter: {
    text: `PorterSaathi porters are 🏛️ government-registered coolies with official coolie numbers.\n\nEvery porter is:\n✅ Govt. verified\n✅ Rated by real customers\n✅ Insured for your luggage\n✅ Trained & background checked`,
  },
  ratings: {
    text: `After every trip, customers can rate their porter ⭐\n\nRatings are 1–5 stars with written reviews. Only verified bookings can leave reviews — so all ratings are genuine!\n\nYou can see each porter's rating before booking.`,
  },
  cancel: {
    text: `To cancel a booking 🚫\n\n• Go to **My Bookings**\n• Find your booking\n• Tap Cancel (only available before porter confirms)\n\nOnce confirmed, please contact the porter directly. Cancellation after confirmation may incur a small fee.`,
    action: { label: 'My Bookings →', route: '/booking' },
  },
  payment: {
    text: `We support multiple payment methods 💳\n\n• UPI (GPay, PhonePe, Paytm)\n• Debit / Credit Card\n• Net Banking\n• Cash on delivery\n\nAll digital payments are 100% secure and logged.`,
  },
  help: {
    text: `Need more help? 🆘\n\nYou can:\n• Email us: support@portersaathi.in\n• Call: 1800-XXX-XXXX (9AM–9PM)\n• WhatsApp: +91 98765 00000\n\nWe usually respond within 30 minutes!`,
  },
}

const WELCOME = `👋 Hi! I'm **PorterBot**.\n\nI can help you with bookings, pricing, and any questions about PorterSaathi.\n\nWhat would you like to know?`

export default function Chatbot() {
  const navigate               = useNavigate()
  const [open, setOpen]        = useState(false)
  const [messages, setMessages] = useState([
    { from: 'bot', text: WELCOME }
  ])
  const [hasNew, setHasNew]    = useState(true)
  const bottomRef              = useRef(null)

  useEffect(() => {
    if (open) {
      setHasNew(false)
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [open, messages])

  const sendUserMessage = (label, id) => {
    const userMsg = { from: 'user', text: label }
    const response = RESPONSES[id]
    const botMsg   = { from: 'bot', text: response.text, action: response.action }
    setMessages(prev => [...prev, userMsg, botMsg])
  }

  const reset = () => setMessages([{ from: 'bot', text: WELCOME }])

  // parse **bold** in text
  const renderText = (text) => {
    return text.split('\n').map((line, i) => {
      const parts = line.split(/\*\*(.*?)\*\*/g)
      return (
        <p key={i} style={{ margin: '2px 0' }}>
          {parts.map((part, j) =>
            j % 2 === 1 ? <strong key={j}>{part}</strong> : part
          )}
        </p>
      )
    })
  }

  return (
    <>
      {/* FLOATING BUBBLE */}
      <button className="chat-bubble" onClick={() => setOpen(o => !o)}>
        {open ? '✕' : '💬'}
        {hasNew && !open && <span className="chat-badge" />}
      </button>

      {/* CHAT WINDOW */}
      {open && (
        <div className="chat-window">
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-left">
              <div className="chat-avatar">🤖</div>
              <div>
                <strong>PorterBot</strong>
                <span className="chat-online">● Online</span>
              </div>
            </div>
            <button className="chat-reset" onClick={reset} title="Restart">↺</button>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-msg ${msg.from}`}>
                <div className="chat-bubble-msg">
                  {renderText(msg.text)}
                  {msg.action && (
                    <button
                      className="chat-action-btn"
                      onClick={() => { navigate(msg.action.route); setOpen(false) }}
                    >
                      {msg.action.label}
                    </button>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Quick Replies */}
          <div className="chat-quick">
            <p className="chat-quick-label">Quick questions:</p>
            <div className="chat-quick-grid">
              {QUICK_REPLIES.map(q => (
                <button
                  key={q.id}
                  className="chat-quick-btn"
                  onClick={() => sendUserMessage(q.label, q.id)}
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}