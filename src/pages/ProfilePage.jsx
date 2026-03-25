import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { useToast } from '../components/Toast'
import './ProfilePage.css'

export default function ProfilePage() {
  const navigate  = useNavigate()
  const showToast = useToast()

  // Read logged-in user from localStorage
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
  const isPorter   = storedUser.role === 'porter'
  const token      = localStorage.getItem('token')

  const [tab, setTab] = useState('profile')
  const [form, setForm] = useState({
    name:      storedUser.name  || '',
    email:     storedUser.email || '',
    mobile:    '',
    coolieNum: '',
    station:   '',
    city:      '',
  })

  const accentColor = isPorter ? 'var(--amber)' : 'var(--red)'
  const avatarBg    = isPorter
    ? 'linear-gradient(135deg,#F5A623,#e67e22)'
    : 'linear-gradient(135deg,#E8341C,#F5A623)'

  // Get initials from name
  const initials = form.name
    ? form.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  // Fetch full profile from backend
  useEffect(() => {
    if (!token) { navigate('/login'); return }
    fetch('http://localhost:5000/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setForm({
            name:      data.name      || '',
            email:     data.email     || '',
            mobile:    data.mobile    || '',
            coolieNum: data.coolie_num || '',
            station:   data.station   || '',
            city:      data.city      || '',
          })
          // Update localStorage with latest name
          localStorage.setItem('user', JSON.stringify({
            ...storedUser,
            name: data.name,
          }))
        }
      })
      .catch(() => {})
  }, [token])

  const STATS = isPorter
    ? [['Total Trips','—','var(--text)'],['Avg Rating','—','var(--amber)'],['This Month','—','var(--green)'],['Acceptance','—','var(--green)']]
    : [['Bookings','—','var(--text)'],['Completed','—','var(--green)'],['Fav Station','—','var(--amber)'],['Spent','—','var(--text)']]

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <div className="dashboard-layout">
      <Sidebar role={isPorter ? 'porter' : 'customer'} activeTab="profile" onTabChange={setTab} />

      <div className="main-content page-enter">
        <div className="page-header">
          <div><h1>My Profile</h1><p>Manage your account details</p></div>
          <button className="btn-danger" style={{ padding:'8px 18px' }} onClick={handleLogout}>
            Logout
          </button>
        </div>

        {/* Avatar banner */}
        <div className="profile-hero">
          <div className="big-avatar" style={{ background: avatarBg }}>
            {initials}
          </div>
          <div>
            <h2>{form.name}</h2>
            <p style={{ color:'var(--muted)', marginTop:4 }}>
              {isPorter ? `Porter · ${form.coolieNum || 'N/A'}` : 'Customer Account'}
            </p>
            {isPorter && <span className="chip chip-amber" style={{ marginTop:10, fontSize:12 }}>🏛️ Govt. Verified</span>}
          </div>
        </div>

        {/* Personal info */}
        <div className="card">
          <h3>👤 Personal Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" value={form.name}
                onChange={e => setForm({...form, name: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Mobile Number</label>
              <input type="tel" value={form.mobile}
                onChange={e => setForm({...form, mobile: e.target.value})} />
            </div>
          </div>
          {isPorter ? (
            <div className="form-row">
              <div className="form-group">
                <label>Coolie Number (locked)</label>
                <input type="text" value={form.coolieNum} readOnly className="locked" />
              </div>
              <div className="form-group">
                <label>Station (locked)</label>
                <input type="text" value={form.station || 'Not set'} readOnly className="locked" />
              </div>
            </div>
          ) : (
            <div className="form-row">
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})} />
              </div>
              <div className="form-group">
                <label>City</label>
                <input type="text" value={form.city}
                  onChange={e => setForm({...form, city: e.target.value})} />
              </div>
            </div>
          )}
          <button
            className={isPorter ? 'btn-amber' : 'btn-primary'}
            style={{ marginTop:8 }}
            onClick={() => showToast('Profile Updated!', 'Your changes have been saved.')}
          >
            Save Changes
          </button>
        </div>

        {/* Change password */}
        <div className="card">
          <h3>🔒 Change Password</h3>
          <div className="form-row">
            <div className="form-group"><label>Current Password</label><input type="password" placeholder="Current password" /></div>
            <div className="form-group"><label>New Password</label><input type="password" placeholder="New password" /></div>
          </div>
          <div className="form-group" style={{ maxWidth:340 }}>
            <label>Confirm New Password</label>
            <input type="password" placeholder="Repeat new password" />
          </div>
          <button
            className={isPorter ? 'btn-amber' : 'btn-primary'}
            style={{ marginTop:8 }}
            onClick={() => showToast('Password Updated!')}
          >
            Update Password
          </button>
        </div>

        {/* Stats */}
        <div className="card">
          <h3>📊 {isPorter ? 'Porter' : 'Customer'} Stats</h3>
          <div className="profile-stats">
            {STATS.map(([l, v, c]) => (
              <div className="pstat" key={l}>
                <div className="pstat-val" style={{ color:c }}>{v}</div>
                <div className="pstat-label">{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Danger zone */}
        <div className="card danger-card">
          <h3>⚠️ Danger Zone</h3>
          <p>Permanently delete your account and all data. This cannot be undone.</p>
          <button className="btn-danger"
            onClick={() => showToast('Are you sure?', 'This cannot be undone.', '⚠️')}>
            Delete Account
          </button>
        </div>
      </div>
    </div>
  )
}