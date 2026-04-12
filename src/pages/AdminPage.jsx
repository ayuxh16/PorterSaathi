import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './AdminPage.css'

const token = () => localStorage.getItem('token')

function StatCard({ icon, label, value, color }) {
  return (
    <div className="admin-stat-card">
      <div className="asc-icon" style={{ background: color }}>{icon}</div>
      <div>
        <div className="asc-value">{value ?? '—'}</div>
        <div className="asc-label">{label}</div>
      </div>
    </div>
  )
}

function Badge({ status }) {
  const map = {
    pending:   { color:'#F5A623', bg:'rgba(245,166,35,0.12)'  },
    confirmed: { color:'#22c55e', bg:'rgba(34,197,94,0.12)'   },
    completed: { color:'#aaa',    bg:'rgba(255,255,255,0.06)' },
    rejected:  { color:'#E8341C', bg:'rgba(232,52,28,0.12)'   },
    admin:     { color:'#6366f1', bg:'rgba(99,102,241,0.12)'  },
    porter:    { color:'#F5A623', bg:'rgba(245,166,35,0.12)'  },
    customer:  { color:'#22c55e', bg:'rgba(34,197,94,0.12)'   },
  }
  const s = map[status] || map.pending
  return (
    <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:999,
                   color: s.color, background: s.bg, textTransform:'capitalize' }}>
      {status}
    </span>
  )
}

export default function AdminPage() {
  const navigate = useNavigate()
  const [tab,      setTab]      = useState('overview')
  const [users,    setUsers]    = useState([])
  const [bookings, setBookings] = useState([])
  const [loading,  setLoading]  = useState(true)

  const storedUser = JSON.parse(localStorage.getItem('user') || '{}')

  // Guard: redirect if not admin
  useEffect(() => {
    if (!token() || storedUser.role !== 'admin') navigate('/login')
  }, [])

  // Fetch all users
  useEffect(() => {
    if (tab !== 'users' && tab !== 'overview') return
    setLoading(true)
    fetch('https://portersaathi-1.onrender.com/api/admin/users', {
      headers: { Authorization: `Bearer ${token()}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => { setUsers(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [tab])

  // Fetch all bookings
  useEffect(() => {
    if (tab !== 'bookings' && tab !== 'overview') return
    setLoading(true)
    fetch('https://portersaathi-1.onrender.com/api/admin/bookings', {
      headers: { Authorization: `Bearer ${token()}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => { setBookings(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [tab])

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token()}` },
    })
    if (res.ok) setUsers(prev => prev.filter(u => u.id !== id))
    else alert('Failed to delete user')
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const porters   = users.filter(u => u.role === 'porter')
  const customers = users.filter(u => u.role === 'customer')

  const initials = storedUser.name
    ? storedUser.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'AD'

  return (
    <div className="admin-layout">
      {/* SIDEBAR */}
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span>🧳</span>
          <span>Porter<b>Saathi</b></span>
        </div>
        <nav className="admin-nav">
          {[
            ['overview', '📊', 'Overview'],
            ['users',    '👥', 'All Users'],
            ['bookings', '📋', 'All Bookings'],
          ].map(([id, icon, label]) => (
            <button
              key={id}
              className={`admin-nav-item ${tab === id ? 'active' : ''}`}
              onClick={() => setTab(id)}
            >
              {icon} {label}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-bottom">
          <div className="admin-user-chip">
            <div className="admin-avatar">{initials}</div>
            <div>
              <strong>{storedUser.name || 'Admin'}</strong>
              <p>Administrator</p>
            </div>
          </div>
          <button className="admin-logout" onClick={handleLogout}>↩ Sign out</button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="admin-main">

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <>
            <div className="admin-page-header">
              <div>
                <h1>Dashboard</h1>
                <p>Welcome back, {storedUser.name}!</p>
              </div>
            </div>
            <div className="admin-stats-grid">
              <StatCard icon="👥" label="Total Users"    value={users.length}    color="rgba(99,102,241,0.2)"  />
              <StatCard icon="🧳" label="Porters"        value={porters.length}  color="rgba(245,166,35,0.2)"  />
              <StatCard icon="🧑" label="Customers"      value={customers.length}color="rgba(34,197,94,0.2)"   />
              <StatCard icon="📋" label="Total Bookings" value={bookings.length} color="rgba(232,52,28,0.2)"   />
            </div>

            <div className="admin-card">
              <h3>📋 Recent Bookings</h3>
              {bookings.length === 0
                ? <p className="admin-empty">No bookings yet.</p>
                : <table className="admin-table">
                    <thead>
                      <tr><th>ID</th><th>Customer</th><th>Porter</th><th>From</th><th>To</th><th>Price</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {bookings.slice(0, 5).map(b => (
                        <tr key={b.id}>
                          <td>#{b.id}</td>
                          <td>{b.customer_name}</td>
                          <td>{b.porter_name || '—'}</td>
                          <td>{b.from_loc}</td>
                          <td>{b.to_loc}</td>
                          <td>₹{b.price}</td>
                          <td><Badge status={b.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
              }
            </div>
          </>
        )}

        {/* ── USERS ── */}
        {tab === 'users' && (
          <>
            <div className="admin-page-header">
              <div><h1>All Users</h1><p>Manage registered porters and customers</p></div>
            </div>
            {loading
              ? <p className="admin-empty">Loading...</p>
              : <div className="admin-card">
                  <table className="admin-table">
                    <thead>
                      <tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Coolie #</th><th>City</th><th>Joined</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id}>
                          <td>#{u.id}</td>
                          <td>{u.name}</td>
                          <td>{u.email}</td>
                          <td><Badge status={u.role} /></td>
                          <td>{u.coolie_num || '—'}</td>
                          <td>{u.city || '—'}</td>
                          <td>{new Date(u.created_at).toLocaleDateString()}</td>
                          <td>
                            {u.role !== 'admin' && (
                              <button className="admin-del-btn" onClick={() => handleDeleteUser(u.id)}>
                                🗑️ Delete
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            }
          </>
        )}

        {/* ── BOOKINGS ── */}
        {tab === 'bookings' && (
          <>
            <div className="admin-page-header">
              <div><h1>All Bookings</h1><p>Monitor every booking on the platform</p></div>
            </div>
            {loading
              ? <p className="admin-empty">Loading...</p>
              : <div className="admin-card">
                  {bookings.length === 0
                    ? <p className="admin-empty">No bookings yet.</p>
                    : <table className="admin-table">
                        <thead>
                          <tr><th>ID</th><th>Customer</th><th>Porter</th><th>From</th><th>To</th><th>Bags</th><th>Price</th><th>Status</th><th>Date</th></tr>
                        </thead>
                        <tbody>
                          {bookings.map(b => (
                            <tr key={b.id}>
                              <td>#{b.id}</td>
                              <td>{b.customer_name}</td>
                              <td>{b.porter_name || '—'}</td>
                              <td>{b.from_loc}</td>
                              <td>{b.to_loc}</td>
                              <td>{b.bags}</td>
                              <td>₹{b.price}</td>
                              <td><Badge status={b.status} /></td>
                              <td>{new Date(b.created_at).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                  }
                </div>
            }
          </>
        )}

      </main>
    </div>
  )
}



