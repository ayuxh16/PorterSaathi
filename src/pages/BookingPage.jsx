import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
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
    cancelled: ['var(--red)',   'rgba(232,52,28,0.08)'],
  }
  const [color, bg] = map[status] || map.pending
  return (
    <span style={{ fontSize:12, fontWeight:600, padding:'4px 12px', borderRadius:999,
                   color, background:bg, fontFamily:"'Syne',sans-serif", textTransform:'capitalize' }}>
      {status}
    </span>
  )
}

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
  const navigate       = useNavigate()
  const showToast      = useToast()
  const [searchParams] = useSearchParams()
  const pollRef        = useRef(null)

  const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
  const token      = localStorage.getItem('token')
  const isPorter   = storedUser.role === 'porter'

  const defaultTab = searchParams.get('tab') || (isPorter ? 'requests' : 'book')
  const [tab, setTab]                         = useState(defaultTab)
  const [cancellingId, setCancellingId]       = useState(null)

  // ── Customer state ──
  const [porters, setPorters]                 = useState([])
  const [loadingPorters, setLoadingPorters]   = useState(false)
  const [matchedPorter, setMatchedPorter]     = useState(null)
  const [requestSent, setRequestSent]         = useState(false)
  const [bookingStatus, setBookingStatus]     = useState(null)
  const [activeBookingId, setActiveBookingId] = useState(null)
  const [form, setForm]                       = useState({
    from: '', to: '', bags: '1', date: '',
    priceMin: '', priceMax: '',
    serviceType: 'luggage',
    pnr: '', trainNo: '', coach: '',
  })

  // ── Shared state ──
  const [bookings, setBookings]   = useState([])
  const [liveStatus, setLiveStatus] = useState(null)

  // ── Porter state ──
  const [requests, setRequests]   = useState([])
  const [available, setAvailable] = useState(true)
  const [routes, setRoutes]       = useState([])

  useEffect(() => { if (!token) navigate('/login') }, [token])

  // ── Fetch porters ──
  const fetchPorters = () => {
    if (isPorter) return
    const station = storedUser.station || ''
    setLoadingPorters(true)
    fetch(`/api/porters?station=${encodeURIComponent(station)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => { setPorters(data); setLoadingPorters(false) })
      .catch(() => setLoadingPorters(false))
  }

  useEffect(() => { fetchPorters() }, [isPorter])

  // ── Fetch bookings ──
  const fetchBookings = () => {
    if (!token) return
    fetch('https://portersaathi-1.onrender.com/api/bookings', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (isPorter) {
          setRequests(data.filter(b => b.status === 'pending'))
          setBookings(data)
        } else {
          setBookings(data)
          const active = data.find(b => b.status === 'pending' || b.status === 'confirmed')
          if (active) { setActiveBookingId(active.id); setBookingStatus(active.status) }
        }
      })
      .catch(() => {})
  }

  useEffect(() => { fetchBookings() }, [token, isPorter])

  // ── Fetch porter routes ──
  useEffect(() => {
    if (!isPorter || !token) return
    fetch('https://portersaathi-1.onrender.com/api/porter-routes', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => setRoutes(data.length ? data : [{ from_loc:'', to_loc:'', price:'' }]))
      .catch(() => {})
  }, [isPorter, token])

  // ── Poll booking status ──
  useEffect(() => {
    if (!activeBookingId || isPorter) return
    pollRef.current = setInterval(async () => {
      try {
        const res  = await fetch(`/api/bookings/${activeBookingId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        setBookingStatus(data.status)
        if (data.status === 'confirmed') {
          setMatchedPorter(data.porter)
          setLiveStatus(data)
          showToast('Porter Confirmed! 🎉', `${data.porter?.name} is on the way!`)
          clearInterval(pollRef.current)
        } else if (data.status === 'rejected') {
          showToast('Request Declined', 'Try another porter or raise your price.', '❌')
          setRequestSent(false)
          setActiveBookingId(null)
          clearInterval(pollRef.current)
        } else if (data.status === 'cancelled') {
          showToast('Booking Cancelled', 'The booking has been cancelled.', '❌')
          setRequestSent(false)
          setActiveBookingId(null)
          clearInterval(pollRef.current)
          fetchBookings()
        }
      } catch {}
    }, 3000)
    return () => clearInterval(pollRef.current)
  }, [activeBookingId])

  /* ── Cancel booking (customer or porter) ── */
  const handleCancel = async (id) => {
    const confirmed = window.confirm('Are you sure you want to cancel this booking?')
    if (!confirmed) return
    setCancellingId(id)
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'cancelled' }),
      })
      const data = await res.json()
      if (res.ok) {
        showToast('Booking Cancelled', 'The booking has been cancelled.', '🚫')
        // Reset active booking state if customer cancelled their active booking
        if (id === activeBookingId) {
          setRequestSent(false)
          setActiveBookingId(null)
          setBookingStatus(null)
          setMatchedPorter(null)
          clearInterval(pollRef.current)
        }
        fetchBookings() // refresh list
      } else {
        showToast('Cancel failed', data.error || 'Could not cancel booking', '❌')
      }
    } catch {
      showToast('Could not connect to server', '', '❌')
    } finally {
      setCancellingId(null)
    }
  }

  /* ── Send booking request ── */
  const handleSendRequest = async () => {
    if (!form.from || !form.to)           return showToast('Enter pickup & drop location', '', '⚠️')
    if (!form.priceMin || !form.priceMax) return showToast('Enter your price range', '', '⚠️')
    if (parseInt(form.priceMin) > parseInt(form.priceMax))
      return showToast('Min price cannot exceed max price', '', '⚠️')

    try {
      const res = await fetch('https://portersaathi-1.onrender.com/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
        body: JSON.stringify({
          from_loc:     form.from,
          to_loc:       form.to,
          bags:         parseInt(form.bags),
          price_min:    parseInt(form.priceMin),
          price_max:    parseInt(form.priceMax),
          service_type: form.serviceType,
          pnr:          form.pnr,
          train_no:     form.trainNo,
          coach:        form.coach,
          station:      storedUser.station,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setActiveBookingId(data.id)
        setRequestSent(true)
        setBookingStatus('pending')
        showToast('Request Sent!', 'Waiting for a porter to accept…', '📡')
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
      await fetch(`/api/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
        body: JSON.stringify({ status }),
      })
      setRequests(prev => prev.filter(r => r.id !== id))
      showToast(
        action === 'accept' ? '✅ Request Accepted!' : 'Request Declined',
        action === 'accept' ? 'Head to the customer now.' : '',
        action === 'accept' ? '✅' : '❌',
      )
      if (action === 'accept') { fetchBookings(); setTab('status') }
    } catch {
      showToast('Could not update request', '', '❌')
    }
  }

  /* ── Save porter routes ── */
  const saveRoutes = async () => {
    try {
      const res = await fetch('https://portersaathi-1.onrender.com/api/porter-routes', {
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

  const updateRoute = (i, field, val) => {
    setRoutes(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r))
  }

  const canCancel = (b) => ['pending', 'confirmed'].includes(b.status)

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
                <p>
                  <span className="station-chip">🚉 {storedUser.station || 'No station set'}</span>
                  &nbsp;— Showing porters at your station only
                </p>
              </div>
            </div>

            <div className="card">
              <h3>📋 Trip Details</h3>
              <div className="service-type-row">
                {[
                  { id:'luggage',    icon:'🧳', label:'Luggage'           },
                  { id:'wheelchair', icon:'♿', label:'Wheelchair'         },
                  { id:'group',      icon:'👥', label:'Group / Corporate'  },
                ].map(s => (
                  <button key={s.id}
                    className={`service-btn ${form.serviceType === s.id ? 'active' : ''}`}
                    onClick={() => setForm({...form, serviceType: s.id})}>
                    {s.icon} {s.label}
                  </button>
                ))}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>📍 Pickup Location</label>
                  <input placeholder="e.g. Platform 3, Gate A"
                    value={form.from} onChange={e => setForm({...form, from: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>🏁 Drop Location</label>
                  <input placeholder="e.g. Exit, Parking, Coach B4"
                    value={form.to} onChange={e => setForm({...form, to: e.target.value})} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>🚂 Train No. / PNR</label>
                  <input placeholder="e.g. 12345"
                    value={form.trainNo} onChange={e => setForm({...form, trainNo: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>🪑 Coach & Seat</label>
                  <input placeholder="e.g. S4 / 32"
                    value={form.coach} onChange={e => setForm({...form, coach: e.target.value})} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>🧳 Number of Bags</label>
                  <select value={form.bags} onChange={e => setForm({...form, bags: e.target.value})}>
                    {[1,2,3,4,5,6,7,8].map(n => <option key={n}>{n}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>📅 Date of Journey</label>
                  <input type="date" value={form.date}
                    onChange={e => setForm({...form, date: e.target.value})} />
                </div>
              </div>

              <div className="price-range-box">
                <div className="prb-header">
                  <span>💰 Your Price Range</span>
                  <span className="prb-hint">Porters nearby will see this and accept if they agree</span>
                </div>
                <div className="prb-inputs">
                  <div className="prb-field">
                    <label>Min (₹)</label>
                    <input type="number" placeholder="50" min="0"
                      value={form.priceMin} onChange={e => setForm({...form, priceMin: e.target.value})} />
                  </div>
                  <div className="prb-divider">—</div>
                  <div className="prb-field">
                    <label>Max (₹)</label>
                    <input type="number" placeholder="200" min="0"
                      value={form.priceMax} onChange={e => setForm({...form, priceMax: e.target.value})} />
                  </div>
                  {form.priceMin && form.priceMax && (
                    <div className="prb-preview">₹{form.priceMin}–₹{form.priceMax}</div>
                  )}
                </div>
                <p className="prb-note">
                  📡 Once you send the request, <strong>all available porters at {storedUser.station || 'your station'}</strong> will get a notification.
                  The first one to accept wins the booking.
                </p>
              </div>

              <button className="btn-primary btn-lg" onClick={handleSendRequest}>
                📡 Send Request to Nearby Porters →
              </button>
            </div>

            {loadingPorters
              ? <div className="card"><p style={{color:'var(--muted)'}}>Finding porters at your station…</p></div>
              : porters.length > 0 && (
                <div className="card">
                  <h3>👷 {porters.length} Porter{porters.length > 1 ? 's' : ''} Available at {storedUser.station}</h3>
                  <p style={{color:'var(--muted)', fontSize:13, marginBottom:16}}>
                    These porters will receive your request popup
                  </p>
                  <div className="porter-grid">
                    {porters.map((p, idx) => (
                      <div className="porter-card" key={p.id}>
                        <div className="pc-avatar" style={{ background: AVATAR_COLORS[idx % AVATAR_COLORS.length] }}>
                          {getInitials(p.name)}
                        </div>
                        <strong style={{fontSize:14}}>{p.name}</strong>
                        <span className="pc-stars">⭐ {p.rating || '4.5'} · #{p.coolie_num || p.id}</span>
                        <span style={{fontSize:12, color:'var(--green)'}}>● Online</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            }

            {porters.length === 0 && !loadingPorters && (
              <div className="card no-porter-card">
                <p style={{fontSize:36}}>😔</p>
                <h3>No porters available at {storedUser.station || 'your station'} right now</h3>
                <p style={{color:'var(--muted)', fontSize:14}}>Try again in a few minutes or contact station support.</p>
              </div>
            )}
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
                  <button className="link-btn" onClick={() => setTab('book')}>Book your first porter →</button>
                </div>
              : <div className="list">
                  {bookings.map(b => (
                    <div className="b-item" key={b.id} style={{ flexWrap: 'wrap', gap: 12 }}>
                      <div className="b-info">
                        <h4>{b.from_loc} → {b.to_loc}</h4>
                        <p>{b.porter_name || 'Awaiting porter'} · {new Date(b.created_at).toLocaleDateString()}</p>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
                        <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, color:'var(--amber)' }}>
                          ₹{b.price_min}–₹{b.price_max}
                        </span>
                        <StatusBadge status={b.status} />
                        {canCancel(b) && (
                          <button
                            onClick={() => handleCancel(b.id)}
                            disabled={cancellingId === b.id}
                            style={{
                              padding: '5px 14px', borderRadius: 8,
                              background: 'rgba(232,52,28,0.1)',
                              border: '1px solid rgba(232,52,28,0.3)',
                              color: 'var(--red)', fontSize: 12, fontWeight: 600,
                              cursor: cancellingId === b.id ? 'not-allowed' : 'pointer',
                              opacity: cancellingId === b.id ? 0.6 : 1,
                            }}
                          >
                            {cancellingId === b.id ? 'Cancelling…' : '✕ Cancel'}
                          </button>
                        )}
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

            {requestSent && bookingStatus === 'pending' && (
              <div className="status-card waiting-card">
                <div className="pulse-ring" />
                <div className="s-icon">📡</div>
                <h2>Waiting for a Porter…</h2>
                <p style={{ color:'var(--muted)' }}>
                  Your request has been sent to all available porters at <strong>{storedUser.station}</strong>.
                </p>
                <div className="detail-table" style={{maxWidth:380}}>
                  {[
                    ['From',        form.from || liveStatus?.from_loc],
                    ['To',          form.to   || liveStatus?.to_loc],
                    ['Price Range', `₹${form.priceMin} – ₹${form.priceMax}`],
                    ['Bags',        form.bags],
                    ['Station',     storedUser.station],
                  ].map(([k,v]) => v && (
                    <div className="d-row" key={k}><span>{k}</span><strong>{v}</strong></div>
                  ))}
                </div>
                <div className="searching-dots"><span /><span /><span /></div>
                {/* Cancel while waiting */}
                {activeBookingId && (
                  <button
                    onClick={() => handleCancel(activeBookingId)}
                    disabled={cancellingId === activeBookingId}
                    style={{
                      marginTop: 24, padding: '10px 28px', borderRadius: 10,
                      background: 'rgba(232,52,28,0.1)',
                      border: '1px solid rgba(232,52,28,0.3)',
                      color: 'var(--red)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                      opacity: cancellingId === activeBookingId ? 0.6 : 1,
                    }}
                  >
                    {cancellingId === activeBookingId ? 'Cancelling…' : '✕ Cancel Booking'}
                  </button>
                )}
              </div>
            )}

            {bookingStatus === 'confirmed' && matchedPorter && (
              <div className="status-card confirmed-card">
                <div className="s-icon">✅</div>
                <h2>Porter Confirmed!</h2>
                <p style={{ color:'var(--muted)', marginBottom:20 }}>
                  Your porter is on the way. You can now contact them directly.
                </p>
                <div className="matched-porter-card">
                  <div className="mp-avatar" style={{background: AVATAR_COLORS[0]}}>
                    {getInitials(matchedPorter.name)}
                  </div>
                  <div className="mp-info">
                    <h3>{matchedPorter.name}</h3>
                    <span>⭐ {matchedPorter.rating || '4.5'} · #{matchedPorter.coolie_num}</span>
                  </div>
                  <a href={`tel:+91${matchedPorter.mobile}`} className="mp-call-btn">📞 Call Porter</a>
                </div>
                <div className="mobile-reveal-box">
                  <span>📱</span>
                  <div>
                    <strong>Porter's Mobile</strong>
                    <p style={{fontSize:20, fontFamily:"'Syne',sans-serif", fontWeight:700, color:'var(--text)', margin:'4px 0 0'}}>
                      +91 {matchedPorter.mobile}
                    </p>
                  </div>
                </div>
                <div className="sim-btns">
                  <button className="btn-primary" onClick={() => navigate('/map')}>🗺️ Open Live Tracking Map</button>
                  <button className="btn-outline" onClick={() => setTab('bookings')}>View All Bookings</button>
                  {activeBookingId && (
                    <button
                      onClick={() => handleCancel(activeBookingId)}
                      disabled={cancellingId === activeBookingId}
                      style={{
                        padding: '10px 20px', borderRadius: 10,
                        background: 'rgba(232,52,28,0.1)',
                        border: '1px solid rgba(232,52,28,0.3)',
                        color: 'var(--red)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      ✕ Cancel Booking
                    </button>
                  )}
                </div>
              </div>
            )}

            {!requestSent && !liveStatus && bookings.filter(b => b.status === 'pending' || b.status === 'confirmed').length === 0 && (
              <div className="empty-box">
                <p style={{ fontSize:48 }}>🔔</p>
                <p style={{ marginTop:12 }}>No active bookings.</p>
                <button className="link-btn" onClick={() => setTab('book')}>Book a porter →</button>
              </div>
            )}
          </>
        )}

        {/* ══ PORTER: REQUESTS ══ */}
        {isPorter && tab === 'requests' && (
          <>
            <div className="page-header">
              <div>
                <h1>Booking Requests</h1>
                <p>
                  <span className="station-chip">🚉 {storedUser.station || 'No station set'}</span>
                  &nbsp;— Requests from your station only
                </p>
              </div>
              <div className="avail-bar" style={{margin:0, border:'none', background:'transparent', padding:0}}>
                <div style={{marginRight:14}}>
                  <strong style={{fontSize:14, display:'block', color: available ? 'var(--green)' : 'var(--muted)'}}>
                    {available ? '● You are Online' : '○ You are Offline'}
                  </strong>
                  <p style={{fontSize:12, color:'var(--muted)'}}>
                    {available ? 'Accepting requests' : 'Not accepting requests'}
                  </p>
                </div>
                <div className={`toggle ${available ? 'on' : ''}`} onClick={() => setAvailable(a => !a)} />
              </div>
            </div>

            {!available && (
              <div className="offline-banner">
                😴 You are currently offline. Toggle above to start receiving requests.
              </div>
            )}

            {requests.length === 0
              ? <div className="empty-box">
                  <p style={{fontSize:48}}>🔔</p>
                  <p style={{marginTop:12}}>No new requests right now.</p>
                  <p style={{color:'var(--muted)', fontSize:13}}>Make sure you are Online to receive requests.</p>
                </div>
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
                      ['From',      r.from_loc],
                      ['To',        r.to_loc],
                      ['Bags',      r.bags],
                      ['Service',   r.service_type || 'Luggage'],
                      ['Train No.', r.train_no || '—'],
                      ['Coach',     r.coach    || '—'],
                    ].map(([k,v]) => (
                      <div className="rd-row" key={k}><span>{k}</span><strong>{v}</strong></div>
                    ))}
                  </div>
                  <div className="price-offer-box">
                    <span>💰 Customer's Offer</span>
                    <strong style={{fontSize:22, fontFamily:"'Syne',sans-serif", color:'var(--amber)'}}>
                      ₹{r.price_min} – ₹{r.price_max}
                    </strong>
                  </div>
                  <div className="req-actions">
                    <button className="btn-accept" onClick={() => handleRequest(r.id, 'accept')}>
                      ✓ Accept — I'm okay with ₹{r.price_max}
                    </button>
                    <button className="btn-reject" onClick={() => handleRequest(r.id, 'reject')}>
                      ✕ Decline
                    </button>
                  </div>
                  {/* Porter cancel for pending requests */}
                  <div style={{ marginTop: 10 }}>
                    <button
                      onClick={() => handleCancel(r.id)}
                      disabled={cancellingId === r.id}
                      style={{
                        width: '100%', padding: '9px', borderRadius: 8,
                        background: 'transparent',
                        border: '1px dashed rgba(232,52,28,0.3)',
                        color: 'rgba(232,52,28,0.7)', fontSize: 12, fontWeight: 600,
                        cursor: cancellingId === r.id ? 'not-allowed' : 'pointer',
                        opacity: cancellingId === r.id ? 0.6 : 1,
                      }}
                    >
                      {cancellingId === r.id ? 'Cancelling…' : '🚫 Cancel this Request'}
                    </button>
                  </div>
                </div>
              ))
            }
          </>
        )}

        {/* ══ PORTER: STATUS after accepting ══ */}
        {isPorter && tab === 'status' && (
          <>
            <div className="page-header">
              <div><h1>Active Job</h1><p>Your current booking details</p></div>
            </div>
            {bookings.find(b => b.status === 'confirmed')
              ? (() => {
                  const b = bookings.find(b => b.status === 'confirmed')
                  return (
                    <div className="status-card confirmed-card">
                      <div className="s-icon">🏃</div>
                      <h2>Job In Progress</h2>
                      <div className="mobile-reveal-box">
                        <span>📱</span>
                        <div>
                          <strong>Customer's Mobile</strong>
                          <p style={{fontSize:20, fontFamily:"'Syne',sans-serif", fontWeight:700, color:'var(--text)', margin:'4px 0 0'}}>
                            +91 {b.customer_mobile || '——'}
                          </p>
                        </div>
                        <a href={`tel:+91${b.customer_mobile}`} className="mp-call-btn">📞 Call</a>
                      </div>
                      <div className="detail-table" style={{maxWidth:380}}>
                        {[
                          ['Customer',     b.customer_name],
                          ['From',         b.from_loc],
                          ['To',           b.to_loc],
                          ['Bags',         b.bags],
                          ['Coach',        b.coach || '—'],
                          ['Agreed Price', `₹${b.price_max}`],
                        ].map(([k,v]) => v && (
                          <div className="d-row" key={k}><span>{k}</span><strong>{v}</strong></div>
                        ))}
                      </div>
                      <div className="sim-btns">
                        <button className="btn-amber" onClick={() => navigate('/map')}>🗺️ Open Live Tracking Map</button>
                        <button
                          onClick={() => updateStatus(b.id, 'completed')}
                          style={{
                            padding: '10px 20px', borderRadius: 10,
                            background: 'rgba(34,197,94,0.12)',
                            border: '1px solid rgba(34,197,94,0.25)',
                            color: 'var(--green)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                          }}
                        >
                          🏁 Mark Complete
                        </button>
                        {/* Porter cancel active job */}
                        <button
                          onClick={() => handleCancel(b.id)}
                          disabled={cancellingId === b.id}
                          style={{
                            padding: '10px 20px', borderRadius: 10,
                            background: 'rgba(232,52,28,0.1)',
                            border: '1px solid rgba(232,52,28,0.3)',
                            color: 'var(--red)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                            opacity: cancellingId === b.id ? 0.6 : 1,
                          }}
                        >
                          {cancellingId === b.id ? 'Cancelling…' : '🚫 Cancel Job'}
                        </button>
                      </div>
                    </div>
                  )
                })()
              : <div className="empty-box">
                  <p style={{fontSize:48}}>✅</p>
                  <p style={{marginTop:12}}>No active job right now.</p>
                </div>
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
                  <input className="route-input" value={r.from_loc || ''} onChange={e => updateRoute(i,'from_loc',e.target.value)} placeholder="From" />
                  <span className="arrow">→</span>
                  <input className="route-input" value={r.to_loc || ''}   onChange={e => updateRoute(i,'to_loc',e.target.value)}   placeholder="To" />
                  <input className="route-input" value={r.price || ''}    onChange={e => updateRoute(i,'price',e.target.value)}    placeholder="₹" type="number" />
                </div>
              ))}
              <button className="add-route-btn" onClick={() => setRoutes(prev => [...prev, {from_loc:'',to_loc:'',price:''}])}>
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
            <div className="stats-row">
              {[
                ['Total Earned',    `₹${bookings.filter(b=>b.status==='completed').reduce((s,b)=>s+(Number(b.price_max)||0),0)}`, 'var(--green)'],
                ['Completed Trips', bookings.filter(b=>b.status==='completed').length, 'var(--amber)'],
                ['Pending',         bookings.filter(b=>b.status==='pending').length,   'var(--text)'],
              ].map(([l,v,c]) => (
                <div className="stat-card" key={l}>
                  <div className="stat-label">{l}</div>
                  <div className="stat-val" style={{color:c}}>{v}</div>
                </div>
              ))}
            </div>
            <div className="card">
              <h3>📋 Completed Trips</h3>
              {bookings.filter(b => b.status === 'completed').length === 0
                ? <p style={{ color:'var(--muted)', padding:'20px 0' }}>No completed trips yet.</p>
                : <div className="list">
                    {bookings.filter(b => b.status === 'completed').map(b => (
                      <div className="b-item" key={b.id}>
                        <div className="b-info">
                          <h4>{b.from_loc} → {b.to_loc}</h4>
                          <p>{b.customer_name} · {new Date(b.created_at).toLocaleDateString()}</p>
                        </div>
                        <strong style={{ fontFamily:"'Syne',sans-serif", color:'var(--green)' }}>
                          +₹{b.price_max}
                        </strong>
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





