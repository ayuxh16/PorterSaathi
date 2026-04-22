import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './AdminPage.css'

const API = 'https://portersaathi-1.onrender.com'

export default function AdminPage() {
  const navigate = useNavigate()
  const token    = localStorage.getItem('token')
  const user     = JSON.parse(localStorage.getItem('user') || '{}')

  const [users,    setUsers]    = useState([])
  const [bookings, setBookings] = useState([])
  const [tab,      setTab]      = useState('users')
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (!token || user.role !== 'admin') { navigate('/login'); return }
    fetchAll()
  }, [])

  const fetchAll = () => {
    setLoading(true)
    fetch(`${API}/api/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => setUsers(data))
      .catch(() => {})

    fetch(`${API}/api/admin/bookings`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => { setBookings(data); setLoading(false) })
      .catch(() => setLoading(false))
  }

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return
    await fetch(`${API}/api/admin/users/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    setUsers(prev => prev.filter(u => u.id !== id))
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const porters   = users.filter(u => u.role === 'porter')
  const customers = users.filter(u => u.role === 'customer')

  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-brand-icon">🧳</div>
          <span>Porter<span>Saathi</span> Admin</span>
        </div>
        <nav>
          <button className={tab === 'users'    ? 'active' : ''} onClick={() => setTab('users')}>👥 Users</button>
          <button className={tab === 'bookings' ? 'active' : ''} onClick={() => setTab('bookings')}>📋 Bookings</button>
          <button className={tab === 'stats'    ? 'active' : ''} onClick={() => setTab('stats')}>📊 Stats</button>
        </nav>
        <button className="admin-logout" onClick={handleLogout}>↩ Logout</button>
      </aside>

      <main className="admin-main">
        <div className="admin-header">
          <h1>
            {tab === 'users'    && '👥 User Management'}
            {tab === 'bookings' && '📋 All Bookings'}
            {tab === 'stats'    && '📊 Platform Stats'}
          </h1>
        </div>

        {loading ? (
          <div className="admin-loading">Loading…</div>
        ) : (
          <>
            {tab === 'stats' && (
              <div className="admin-stats-grid">
                <div className="astat"><div className="astat-val">{users.length}</div><div className="astat-lbl">Total Users</div></div>
                <div className="astat"><div className="astat-val">{porters.length}</div><div className="astat-lbl">Porters</div></div>
                <div className="astat"><div className="astat-val">{customers.length}</div><div className="astat-lbl">Customers</div></div>
                <div className="astat"><div className="astat-val">{bookings.length}</div><div className="astat-lbl">Total Bookings</div></div>
                <div className="astat"><div className="astat-val">{bookings.filter(b => b.status === 'completed').length}</div><div className="astat-lbl">Completed</div></div>
                <div className="astat"><div className="astat-val">{bookings.filter(b => b.status === 'pending').length}</div><div className="astat-lbl">Pending</div></div>
              </div>
            )}

            {tab === 'users' && (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th><th>Name</th><th>Email</th><th>Role</th>
                    <th>Station</th><th>Mobile</th><th>Joined</th><th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>#{u.id}</td>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td><span className={`role-badge role-${u.role}`}>{u.role}</span></td>
                      <td>{u.station || '—'}</td>
                      <td>{u.mobile || '—'}</td>
                      <td>{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                      <td>
                        {u.role !== 'admin' && (
                          <button className="btn-delete" onClick={() => deleteUser(u.id)}>Delete</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {tab === 'bookings' && (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th><th>Customer</th><th>Porter</th><th>From</th>
                    <th>To</th><th>Status</th><th>Station</th><th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b.id}>
                      <td>#{b.id}</td>
                      <td>{b.customer_name || '—'}</td>
                      <td>{b.porter_name || 'Unassigned'}</td>
                      <td>{b.from_loc}</td>
                      <td>{b.to_loc}</td>
                      <td><span className={`status-badge status-${b.status}`}>{b.status}</span></td>
                      <td>{b.station || '—'}</td>
                      <td>{b.created_at ? new Date(b.created_at).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </main>
    </div>
  )
}
