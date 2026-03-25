import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { useToast } from '../components/Toast'
import './BookingPage.css'

/* ── STATUS BADGE ── */
function StatusBadge({ status }) {
  const map = {
    pending:   ['var(--amber)', 'rgba(245,166,35,0.12)'],
    confirmed: ['var(--green)', 'rgba(34,197,94,0.12)'],
    completed: ['var(--muted)', 'rgba(255,255,255,0.06)'],
    rejected:  ['var(--red)',   'rgba(232,52,28,0.12)'],
  }
  const [color, bg] = map[status] || map.pending
  return (
    <span style={{ fontSize:12, fontWeight:600, padding:'4px 12px', borderRadius:999,
                   color, background:bg, fontFamily:"'Syne',sans-serif", textTransform:'capitalize' }}>
      {status}
    </span>
  )
}

/* ── GET INITIALS ── */
function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

const AVATAR_COLORS = [
  'linear-gradient(135deg,#E8341C,#F5A623)',
  'linear-gradient(135deg,#22c55e,#16a34a)',
  'linear-gradient(135deg,#F5A623,#e67e22)',
  'linear-gradient(135deg,#6366f1,#8b5cf6)',
]

/* ══════════════════════════════════════════════ */
export default function BookingPage() {
  const navigate  = useNavigate()
  const showToast = useToast()

  // Read logged-in user from localStorage
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
  const token      = localStorage.getItem('token')
  const isPorter   = storedUser.role === 'porter'

  const [tab, setTab]                       = useState(isPorter ? 'requests' : 'book')
  const [porters, setPorters]               = useState([])
  const [loadingPorters, setLoadingPorters] = useState(true)
  const [selectedPorter, setSelectedPorter] = useState(null)
  const [form, setForm]                     = useState({ from:'', to:'', bags:'1', date:'' })
  const [bookings, setBookings]             = useState([])
  const [requests, setRequests]             = useState([])
  const [available, setAvailable]           = useState(true)
  const [routes, setRoutes]                 = useState([])
  const [liveStatus, setLiveStatus]         = useState(null)

  // Redirect if not logged in
  useEffect(() => {
    if (!token) navigate('/login')
  }, [token])

  // Fetch available porters (for customers)
  useEffect(() => {
    if (isPorter) return
    setLoadingPorters(true)
    fetch('http://localhost:5000/api/porters')
      .then(r => r.ok ? r.json() : [])
      .then(data => { setPorters(data); setLoadingPorters(false) })
      .catch(() => { setLoadingPorters(false) })
  }, [isPorter])

  // Fetch bookings
  useEffect(() => {
    if (!token) return
    fetch('http://localhost:5000/api/bookings', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (isPorter) {
          // For porter: pending bookings are "requests"
          setRequests(data.filter(b => b.status === 'pending'))
          setBookings(data)
        } else {
          setBookings(data)
        }
      })
      .catch(() => {})
  }, [token, isPorter])

  // Fetch porter's saved routes
  useEffect(() => {
    if (!isPorter || !token) return
    fetch('http://localhost:5000/api/porter-routes', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => setRoutes(data.length ? data : [{ from:'', to:'', price:'' }]))
      .catch(() => {})
  }, [isPorter, token])

  /* ── Book a porter ── */
  const handleBook = async () => {
    if (!selectedPorter) return showToast('Select a porter first', '', '⚠️')
    if (!form.from || !form.to) return showToast('Enter pickup & drop', '', '⚠️')

    const porter = porters.find(p => p.id === selectedPorter)
    try {
      const res = await fetch('http://localhost:5000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
        body: JSON.stringify({
          porter_id: selectedPorter,
          from_loc:  form.from,
          to_loc:    form.to,
          bags:      parseInt(form.bags),
          price:     porter.price,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setBookings(prev => [data, ...prev])
        setLiveStatus(data)
        showToast('Booking Confirmed!', `${porter.name} has been notified.`)
        setTab('status')
      } else {
        showToast('Booking failed', data.error, '❌')
      }
    } catch {
      showToast('Could not connect to server', '', '❌')
    }
  }

  /* ── Porter: accept/reject ── */
  const handleRequest = async (id, action) => {
    const status = action === 'accept' ? 'confirmed' : 'rejected'
    try {
      await fetch(`http://localhost:5000/api/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
        body: JSON.stringify({ status }),
      })
      setRequests(prev => prev.filter(r => r.id !== id))
      showToast(
        action === 'accept' ? 'Request Accepted!' : 'Request Declined',
        action === 'accept' ? 'Head to the customer now.' : '',
        action === 'accept' ? '✅' : '❌',
      )
    } catch {
      showToast('Could not update request', '', '❌')
    }
  }

  /* ── Save porter routes ── */
  const saveRoutes = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/porter-routes', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
        body: JSON.stringify({ routes }),
      })
      if (res.ok) showToast('Prices Saved!', 'Your route pricing is updated.')
      else showToast('Failed to save', '', '❌')
    } catch {
      showToast('Could not connect to server', '', '❌')
    }
  }

  /* ── Update route locally ── */
  const updateRoute = (i, field, val) => {
    setRoutes(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r))
  }

  /* ─────────────────────────────────── RENDER ─── */
  return (
    <div className="dashboard-layout">
      <Sidebar
        role={isPorter ? 'porter' : 'customer'}
        activeTab={tab}
        onTabChange={setTab}
      />

      <div className="main-content page-enter">

        {/* ══ CUSTOMER: BOOK ══ */}
        {!isPorter && tab === 'book' && (
          <>
            <div className="page-header">
              <div>
                <h1>Book a Porter</h1>
                <p>Welcome back, {storedUser.name}! Choose a verified porter for your luggage</p>
              </div>
            </div>

            <div className="card">
              <h3>📍 Trip Details</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Pickup Point</label>
                  <input placeholder="e.g. Platform 1" value={form.from}
                    onChange={e => setForm({...form, from:e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Drop Point</label>
                  <input placeholder="e.g. Exit Gate B" value={form.to}
                    onChange={e => setForm({...form, to:e.target.value})} />
                </div>
                <div className="form-group">
                  <label>No. of Bags</label>
                  <select value={form.bags} onChange={e => setForm({...form, bags:e.target.value})}>
                    {[1,2,3,4,5].map(n => <option key={n}>{n}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input type="date" value={form.date}
                    onChange={e => setForm({...form, date:e.target.value})} />
                </div>
              </div>
            </div>

            <div className="card">
              <h3>🧳 Available Porters</h3>
              {loadingPorters ? (
                <p style={{ color:'var(--muted)' }}>Loading porters...</p>
              ) : porters.length === 0 ? (
                <p style={{ color:'var(--muted)' }}>No porters available right now.</p>
              ) : (
                <div className="porter-grid">
                  {porters.map((p, idx) => (
                    <div
                      key={p.id}
                      className={`porter-card ${selectedPorter === p.id ? 'selected' : ''}`}
                      onClick={() => setSelectedPorter(p.id)}
                    >
                      <div className="pc-avatar" style={{ background: AVATAR_COLORS[idx % AVATAR_COLORS.length] }}>
                        {getInitials(p.name)}
                      </div>
                      <strong style={{ fontSize:15 }}>{p.name}</strong>
                      <span className="pc-stars">⭐ {p.rating}</span>
                      <div className="pc-price">₹{p.price}</div>
                      <span className="chip chip-green" style={{ fontSize:11 }}>Available</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="confirm-row">
                <span style={{ color:'var(--muted)', fontSize:14 }}>
                  {selectedPorter
                    ? `Selected: ${porters.find(p=>p.id===selectedPorter)?.name} · ₹${porters.find(p=>p.id===selectedPorter)?.price}`
                    : 'No porter selected'}
                </span>
                <button className="btn-primary" onClick={handleBook}>Confirm Booking →</button>
              </div>
            </div>
          </>
        )}

        {/* ══ CUSTOMER: MY BOOKINGS ══ */}
        {!isPorter && tab === 'bookings' && (
          <>
            <div className="page-header">
              <div><h1>My Bookings</h1><p>All your past and current trips</p></div>
            </div>
            {bookings.length === 0
              ? <div className="empty-box">
                  <p>No bookings yet.</p>
                  <button className="link-btn" onClick={()=>setTab('book')}>Book your first porter →</button>
                </div>
              : <div className="list">
                  {bookings.map(b => (
                    <div className="b-item" key={b.id}>
                      <div className="b-info">
                        <h4>{b.from_loc} → {b.to_loc}</h4>
                        <p>{b.porter_name || 'Porter'} · {new Date(b.created_at).toLocaleDateString()}</p>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                        <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, color:'var(--amber)' }}>₹{b.price}</span>
                        <StatusBadge status={b.status} />
                      </div>
                    </div>
                  ))}
                </div>
            }
          </>
        )}

        {/* ══ CUSTOMER: STATUS ══ */}
        {!isPorter && tab === 'status' && (
          <>
            <div className="page-header">
              <div><h1>Booking Status</h1><p>Live updates on your current booking</p></div>
            </div>
            {liveStatus || bookings.find(b => b.status === 'pending' || b.status === 'confirmed')
              ? (() => {
                  const b = liveStatus || bookings.find(b => b.status === 'pending' || b.status === 'confirmed')
                  return (
                    <div className="status-card">
                      <div className="s-icon">{b.status === 'confirmed' ? '✅' : '⏳'}</div>
                      <h2>{b.status === 'confirmed' ? 'Porter Confirmed!' : 'Waiting for Porter…'}</h2>
                      <p style={{ color:'var(--muted)', marginBottom:8 }}>
                        {b.status === 'confirmed' ? 'Your porter is on the way.' : 'Porter will accept shortly.'}
                      </p>
                      <div className="detail-table">
                        {[
                          ['Booking ID', b.id],
                          ['From', b.from_loc || b.from],
                          ['To', b.to_loc || b.to],
                          ['Price', `₹${b.price}`],
                          ['Status', b.status]
                        ].map(([k,v]) => (
                          <div className="d-row" key={k}><span>{k}</span><strong>{v}</strong></div>
                        ))}
                      </div>
                      <div className="sim-btns">
                        <button className="btn-outline" onClick={()=>setTab('bookings')}>View All Bookings</button>
                      </div>
                    </div>
                  )
                })()
              : <div className="empty-box">
                  <p style={{ fontSize:48 }}>🔔</p>
                  <p style={{ marginTop:12 }}>No active bookings.</p>
                  <button className="link-btn" onClick={()=>setTab('book')}>Book a porter →</button>
                </div>
            }
          </>
        )}

        {/* ══ PORTER: REQUESTS ══ */}
        {isPorter && tab === 'requests' && (
          <>
            <div className="page-header">
              <div>
                <h1>Booking Requests</h1>
                <p>Welcome, {storedUser.name}! Accept or decline incoming requests</p>
              </div>
              <div className="avail-bar" style={{ margin:0, border:'none', background:'transparent', padding:0 }}>
                <div style={{ marginRight:14 }}>
                  <strong style={{ fontSize:14, display:'block' }}>{available ? 'You are Online' : 'You are Offline'}</strong>
                  <p style={{ fontSize:12, color:'var(--muted)' }}>{available ? 'Accepting requests' : 'Not accepting requests'}</p>
                </div>
                <div className={`toggle ${available ? 'on' : ''}`} onClick={() => setAvailable(a => !a)} />
              </div>
            </div>

            {requests.length === 0
              ? <div className="empty-box"><p style={{fontSize:48}}>🔔</p><p style={{marginTop:12}}>No new requests right now.</p></div>
              : requests.map((r, idx) => (
                  <div className="req-card" key={r.id}>
                    <span className="new-badge">NEW</span>
                    <div className="req-top">
                      <div className="rc-avatar" style={{ background: AVATAR_COLORS[idx % AVATAR_COLORS.length] }}>
                        {getInitials(r.customer_name || 'Customer')}
                      </div>
                      <div>
                        <h4>{r.customer_name || 'Customer'}</h4>
                        <p>{new Date(r.created_at).toLocaleTimeString()}</p>
                      </div>
                    </div>
                    <div className="req-details">
                      {[
                        ['From', r.from_loc],
                        ['To', r.to_loc],
                        ['Bags', r.bags],
                        ['Price', `₹${r.price}`]
                      ].map(([k,v])=>(
                        <div className="rd-row" key={k}><span>{k}</span><strong>{v}</strong></div>
                      ))}
                    </div>
                    <div className="req-actions">
                      <button className="btn-accept" onClick={() => handleRequest(r.id, 'accept')}>✓ Accept</button>
                      <button className="btn-reject" onClick={() => handleRequest(r.id, 'reject')}>✕ Decline</button>
                    </div>
                  </div>
                ))
            }
          </>
        )}

        {/* ══ PORTER: PRICING ══ */}
        {isPorter && tab === 'pricing' && (
          <>
            <div className="page-header">
              <div><h1>My Pricing</h1><p>Set prices for your routes</p></div>
              <button className="btn-amber" onClick={saveRoutes}>Save All</button>
            </div>
            <div className="card">
              <h3>💰 Route Pricing</h3>
              {routes.map((r, i) => (
                <div className="route-row" key={i}>
                  <input className="route-input" value={r.from_loc || r.from || ''} onChange={e => updateRoute(i,'from_loc',e.target.value)} placeholder="From" />
                  <span className="arrow">→</span>
                  <input className="route-input" value={r.to_loc || r.to || ''}   onChange={e => updateRoute(i,'to_loc',e.target.value)}   placeholder="To" />
                  <input className="route-input" value={r.price || ''} onChange={e => updateRoute(i,'price',e.target.value)} placeholder="₹" type="number" />
                </div>
              ))}
              <button className="add-route-btn" onClick={() => setRoutes(prev=>[...prev,{from_loc:'',to_loc:'',price:''}])}>
                + Add Route
              </button>
            </div>
          </>
        )}

        {/* ══ PORTER: EARNINGS ══ */}
        {isPorter && tab === 'earnings' && (
          <>
            <div className="page-header">
              <div><h1>Earnings</h1><p>Track your income</p></div>
            </div>
            <div className="card">
              <h3>📋 Completed Trips</h3>
              {bookings.filter(b => b.status === 'completed').length === 0
                ? <p style={{ color:'var(--muted)' }}>No completed trips yet.</p>
                : <div className="list">
                    {bookings.filter(b => b.status === 'completed').map(b => (
                      <div className="b-item" key={b.id}>
                        <div className="b-info">
                          <h4>{b.from_loc} → {b.to_loc}</h4>
                          <p>{b.customer_name} · {new Date(b.created_at).toLocaleDateString()}</p>
                        </div>
                        <strong style={{ fontFamily:"'Syne',sans-serif", color:'var(--green)' }}>+₹{b.price}</strong>
                      </div>
                    ))}
                  </div>
              }
            </div>
          </>
        )}

      </div>
    </div>
  )
}