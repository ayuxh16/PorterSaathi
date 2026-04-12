import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

const API = 'http://localhost:5000'

function getToken() { return localStorage.getItem('token') }
function getUser()  { try { return JSON.parse(localStorage.getItem('user') || '{}') } catch { return {} } }

const STATUS_STYLE = {
  pending:   { color: '#F5A623', bg: 'rgba(245,166,35,0.12)',   label: '⏳ Pending'   },
  confirmed: { color: '#22c55e', bg: 'rgba(34,197,94,0.12)',    label: '✅ Confirmed'  },
  completed: { color: '#aaaaaa', bg: 'rgba(255,255,255,0.07)',  label: '🏁 Completed' },
  rejected:  { color: '#E8341C', bg: 'rgba(232,52,28,0.12)',    label: '❌ Rejected'  },
}

function Badge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.pending
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
      color: s.color, background: s.bg, textTransform: 'capitalize', whiteSpace: 'nowrap'
    }}>{s.label}</span>
  )
}

function ToggleSwitch({ checked, onChange, disabled }) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      style={{
        position: 'relative', width: 52, height: 28, borderRadius: 14,
        background: checked ? '#22c55e' : 'rgba(255,255,255,0.12)',
        border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background 0.25s', flexShrink: 0, outline: 'none',
        boxShadow: checked ? '0 0 12px rgba(34,197,94,0.4)' : 'none',
      }}
      aria-label="Toggle availability"
    >
      <span style={{
        position: 'absolute', top: 3, left: checked ? 27 : 3,
        width: 22, height: 22, borderRadius: '50%',
        background: '#fff', transition: 'left 0.25s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
      }} />
    </button>
  )
}

export default function PorterDashboard() {
  const navigate  = useNavigate()
  const user      = getUser()
  const token     = getToken()

  const [bookings,     setBookings]     = useState([])
  const [available,    setAvailable]    = useState(false)
  const [toggling,     setToggling]     = useState(false)
  const [loading,      setLoading]      = useState(true)
  const [activeTab,    setActiveTab]    = useState('pending')
  const [updatingId,   setUpdatingId]   = useState(null)

  // Guard
  useEffect(() => {
    if (!token || user.role !== 'porter') navigate('/login')
  }, [])

  // Fetch porter info (availability) + bookings
  const fetchData = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      // Get porter's own profile for is_available
      const [bookRes] = await Promise.all([
        fetch(`${API}/api/bookings`, { headers: { Authorization: `Bearer ${token}` } }),
      ])
      const bookData = await bookRes.json()
      setBookings(Array.isArray(bookData) ? bookData : [])

      // Get availability from users endpoint or profile
      const profRes = await fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      if (profRes.ok) {
        const prof = await profRes.json()
        setAvailable(!!prof.is_available)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { fetchData() }, [fetchData])

  // Poll for new bookings every 10s
  useEffect(() => {
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [fetchData])

  const toggleAvailability = async (val) => {
    setToggling(true)
    try {
      const res = await fetch(`${API}/api/porter/availability`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ is_available: val }),
      })
      if (res.ok) setAvailable(val)
      else alert('Failed to update availability')
    } catch { alert('Could not connect to server') }
    finally { setToggling(false) }
  }

  const updateStatus = async (id, status) => {
    setUpdatingId(id)
    try {
      const res = await fetch(`${API}/api/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b))
      } else {
        alert('Failed to update booking')
      }
    } catch { alert('Server error') }
    finally { setUpdatingId(null) }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const filtered = bookings.filter(b => {
    if (activeTab === 'pending')   return b.status === 'pending'
    if (activeTab === 'active')    return b.status === 'confirmed'
    if (activeTab === 'history')   return ['completed','rejected'].includes(b.status)
    return true
  })

  const counts = {
    pending:  bookings.filter(b => b.status === 'pending').length,
    active:   bookings.filter(b => b.status === 'confirmed').length,
    history:  bookings.filter(b => ['completed','rejected'].includes(b.status)).length,
  }

  const initials = user.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'P'

  const earnings = bookings
    .filter(b => b.status === 'completed')
    .reduce((sum, b) => sum + Number(b.price_max || b.price || 0), 0)

  // ── Styles ──
  const S = {
    root: {
      minHeight: '100vh',
      background: '#0f0f0f',
      color: '#f0f0f0',
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      display: 'flex',
    },
    sidebar: {
      width: 240, minHeight: '100vh', background: '#161616',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', flexDirection: 'column', padding: '24px 0', flexShrink: 0,
    },
    brand: {
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '0 20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)',
      marginBottom: 20,
    },
    brandIcon: {
      width: 34, height: 34, background: '#E8341C', borderRadius: 9,
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
    },
    brandName: { fontWeight: 700, fontSize: 15, letterSpacing: '-0.3px' },
    navItem: (active) => ({
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 20px', margin: '2px 10px', borderRadius: 8,
      background: active ? 'rgba(232,52,28,0.15)' : 'transparent',
      color: active ? '#E8341C' : 'rgba(255,255,255,0.55)',
      border: 'none', cursor: 'pointer', fontSize: 13.5, fontWeight: active ? 600 : 400,
      textAlign: 'left', transition: 'all 0.15s', width: 'calc(100% - 20px)',
    }),
    badge: (n) => n > 0 ? {
      marginLeft: 'auto', background: '#E8341C', color: '#fff',
      fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 999,
    } : { display: 'none' },
    sidebarBottom: {
      marginTop: 'auto', padding: '20px', borderTop: '1px solid rgba(255,255,255,0.06)',
    },
    availRow: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '12px 14px',
      marginBottom: 12,
    },
    availLabel: { fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)' },
    availStatus: (on) => ({
      fontSize: 11, fontWeight: 700,
      color: on ? '#22c55e' : 'rgba(255,255,255,0.3)',
      marginTop: 2,
    }),
    userChip: {
      display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12,
    },
    avatar: {
      width: 34, height: 34, borderRadius: '50%',
      background: 'linear-gradient(135deg,#E8341C,#F5A623)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 13, fontWeight: 700, flexShrink: 0,
    },
    logoutBtn: {
      width: '100%', padding: '8px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)',
      background: 'transparent', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontSize: 12,
    },
    main: { flex: 1, padding: '32px 28px', overflowY: 'auto' },
    header: { marginBottom: 28 },
    h1: { fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: '-0.5px' },
    sub: { color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 4 },
    statsRow: {
      display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 28,
    },
    statCard: (color) => ({
      background: '#1a1a1a', borderRadius: 12, padding: '16px 18px',
      border: `1px solid ${color}30`,
    }),
    statVal: { fontSize: 22, fontWeight: 700, margin: 0 },
    statLbl: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 3, fontWeight: 500 },
    tabs: { display: 'flex', gap: 6, marginBottom: 20 },
    tab: (active) => ({
      padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13,
      fontWeight: active ? 600 : 400,
      background: active ? '#E8341C' : 'rgba(255,255,255,0.06)',
      color: active ? '#fff' : 'rgba(255,255,255,0.5)',
      transition: 'all 0.15s',
    }),
    card: {
      background: '#1a1a1a', borderRadius: 12, padding: '18px 20px',
      border: '1px solid rgba(255,255,255,0.06)', marginBottom: 12,
    },
    cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    customerName: { fontWeight: 700, fontSize: 15, margin: 0 },
    meta: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 3 },
    routeRow: {
      display: 'flex', alignItems: 'center', gap: 8,
      background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '10px 14px',
      marginBottom: 12, fontSize: 13,
    },
    arrow: { color: 'rgba(255,255,255,0.3)', fontSize: 16 },
    detailRow: {
      display: 'flex', gap: 16, marginBottom: 14,
    },
    detail: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
    detailVal: { fontWeight: 600, color: '#f0f0f0' },
    btnRow: { display: 'flex', gap: 8 },
    btnAccept: {
      padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
      background: '#22c55e', color: '#fff', fontWeight: 600, fontSize: 13,
    },
    btnReject: {
      padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
      background: 'rgba(232,52,28,0.15)', color: '#E8341C',
      fontWeight: 600, fontSize: 13, border: '1px solid rgba(232,52,28,0.3)',
    },
    btnComplete: {
      padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
      background: 'rgba(245,166,35,0.15)', color: '#F5A623',
      fontWeight: 600, fontSize: 13, border: '1px solid rgba(245,166,35,0.3)',
    },
    empty: {
      textAlign: 'center', padding: '48px 20px',
      color: 'rgba(255,255,255,0.25)', fontSize: 14,
    },
  }

  return (
    <div style={S.root}>
      {/* ── SIDEBAR ── */}
      <aside style={S.sidebar}>
        <div style={S.brand}>
          <div style={S.brandIcon}>🧳</div>
          <span style={S.brandName}>Porter<span style={{ color: '#E8341C' }}>Saathi</span></span>
        </div>

        <nav>
          {[
            { id: 'pending', icon: '⏳', label: 'New Requests',  count: counts.pending  },
            { id: 'active',  icon: '✅', label: 'Active Jobs',   count: counts.active   },
            { id: 'history', icon: '🏁', label: 'History',       count: 0               },
          ].map(({ id, icon, label, count }) => (
            <button key={id} style={S.navItem(activeTab === id)} onClick={() => setActiveTab(id)}>
              <span>{icon}</span>
              <span>{label}</span>
              {count > 0 && <span style={S.badge(count)}>{count}</span>}
            </button>
          ))}
          <button style={S.navItem(false)} onClick={() => navigate('/profile')}>
            <span>👤</span>
            <span>Profile</span>
          </button>
        </nav>

        <div style={S.sidebarBottom}>
          {/* Availability Toggle */}
          <div style={S.availRow}>
            <div>
              <div style={S.availLabel}>Availability</div>
              <div style={S.availStatus(available)}>
                {available ? '🟢 Online' : '⚫ Offline'}
              </div>
            </div>
            <ToggleSwitch checked={available} onChange={toggleAvailability} disabled={toggling} />
          </div>

          {/* User chip */}
          <div style={S.userChip}>
            <div style={S.avatar}>{initials}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{user.name || 'Porter'}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                {user.coolie_num ? `#${user.coolie_num}` : 'Porter'}
              </div>
            </div>
          </div>

          <button style={S.logoutBtn} onClick={handleLogout}>↩ Sign out</button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main style={S.main}>
        <div style={S.header}>
          <h1 style={S.h1}>
            {activeTab === 'pending' && '⏳ New Booking Requests'}
            {activeTab === 'active'  && '✅ Active Jobs'}
            {activeTab === 'history' && '🏁 Booking History'}
          </h1>
          <p style={S.sub}>
            {available
              ? 'You are online — customers can see and book you.'
              : 'You are offline — go online to receive bookings.'}
          </p>
        </div>

        {/* Stats */}
        <div style={S.statsRow}>
          <div style={S.statCard('#E8341C')}>
            <div style={{ ...S.statVal, color: '#E8341C' }}>{counts.pending}</div>
            <div style={S.statLbl}>Pending</div>
          </div>
          <div style={S.statCard('#22c55e')}>
            <div style={{ ...S.statVal, color: '#22c55e' }}>{counts.active}</div>
            <div style={S.statLbl}>Active</div>
          </div>
          <div style={S.statCard('#aaa')}>
            <div style={{ ...S.statVal, color: '#aaa' }}>{counts.history}</div>
            <div style={S.statLbl}>Completed</div>
          </div>
          <div style={S.statCard('#F5A623')}>
            <div style={{ ...S.statVal, color: '#F5A623' }}>₹{earnings}</div>
            <div style={S.statLbl}>Total Earned</div>
          </div>
        </div>

        {/* Tab Pills */}
        <div style={S.tabs}>
          {[
            { id: 'pending', label: `New Requests ${counts.pending > 0 ? `(${counts.pending})` : ''}` },
            { id: 'active',  label: `Active (${counts.active})` },
            { id: 'history', label: 'History' },
          ].map(t => (
            <button key={t.id} style={S.tab(activeTab === t.id)} onClick={() => setActiveTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Booking Cards */}
        {loading ? (
          <div style={S.empty}>Loading bookings…</div>
        ) : filtered.length === 0 ? (
          <div style={S.empty}>
            {activeTab === 'pending' && '🎉 No new requests right now.\nGo online to start receiving bookings.'}
            {activeTab === 'active'  && 'No active jobs at the moment.'}
            {activeTab === 'history' && 'No completed bookings yet.'}
          </div>
        ) : (
          filtered.map(b => (
            <div key={b.id} style={S.card}>
              <div style={S.cardTop}>
                <div>
                  <p style={S.customerName}>👤 {b.customer_name || 'Customer'}</p>
                  <p style={S.meta}>
                    Booking #{b.id} · {b.bags || 1} bag{b.bags > 1 ? 's' : ''}
                    {b.customer_mobile ? ` · 📞 ${b.customer_mobile}` : ''}
                  </p>
                </div>
                <Badge status={b.status} />
              </div>

              <div style={S.routeRow}>
                <span>📍 {b.from_loc}</span>
                <span style={S.arrow}>→</span>
                <span>🏁 {b.to_loc}</span>
              </div>

              <div style={S.detailRow}>
                <div style={S.detail}>
                  Price: <span style={S.detailVal}>
                    {b.price_min && b.price_max
                      ? `₹${b.price_min} – ₹${b.price_max}`
                      : b.price
                      ? `₹${b.price}`
                      : 'Not set'}
                  </span>
                </div>
                {b.train_no && (
                  <div style={S.detail}>
                    Train: <span style={S.detailVal}>{b.train_no}</span>
                  </div>
                )}
                {b.coach && (
                  <div style={S.detail}>
                    Coach: <span style={S.detailVal}>{b.coach}</span>
                  </div>
                )}
                {b.pnr && (
                  <div style={S.detail}>
                    PNR: <span style={S.detailVal}>{b.pnr}</span>
                  </div>
                )}
              </div>

              {b.status === 'pending' && (
                <div style={S.btnRow}>
                  <button
                    style={{ ...S.btnAccept, opacity: updatingId === b.id ? 0.6 : 1 }}
                    disabled={updatingId === b.id}
                    onClick={() => updateStatus(b.id, 'confirmed')}
                  >
                    ✓ Accept
                  </button>
                  <button
                    style={{ ...S.btnReject, opacity: updatingId === b.id ? 0.6 : 1 }}
                    disabled={updatingId === b.id}
                    onClick={() => updateStatus(b.id, 'rejected')}
                  >
                    ✗ Decline
                  </button>
                </div>
              )}

              {b.status === 'confirmed' && (
                <div style={S.btnRow}>
                  <button
                    style={{ ...S.btnComplete, opacity: updatingId === b.id ? 0.6 : 1 }}
                    disabled={updatingId === b.id}
                    onClick={() => updateStatus(b.id, 'completed')}
                  >
                    🏁 Mark as Complete
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </main>
    </div>
  )
}