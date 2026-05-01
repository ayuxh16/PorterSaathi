import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './LoginPage.css'

const API = 'https://portersaathi-1.onrender.com'

export default function LoginPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res  = await fetch(`${API}/api/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      })
      const data = await res.json()

      if (res.ok) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user',  JSON.stringify(data.user))

        // Redirect based on role
        if (data.user.role === 'admin') {
          navigate('/admin')
        } else if (data.user.role === 'porter') {
          navigate('/portal')       // ← porter goes to their dashboard
        } else {
          navigate('/booking')      // ← customer goes to booking page
        }
      } else {
        alert(data.error || 'Login failed')
      }
    } catch {
      alert('Could not connect to server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page page-enter">
      {/* LEFT */}
      <div className="login-left">
        <div className="ll-brand" onClick={() => navigate('/')}>
          <div style={{ width:36, height:36, background:'var(--red)', borderRadius:10,
                        display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🧳</div>
          <span className="brand-name">Porter<span>Saathi</span></span>
        </div>
        <div className="ll-copy">
          <h2>Book trusted porters instantly</h2>
          <p>Fast, reliable, and safe luggage handling at railway stations.</p>
          <div className="ll-stats">
            <div className="ll-stat"><strong>500+</strong><span>Porters</span></div>
            <div className="ll-stat"><strong>1k+</strong><span>Bookings</span></div>
            <div className="ll-stat"><strong>4.8★</strong><span>Rating</span></div>
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="login-right">
        <div className="login-card">
          <h2>Welcome Back 👋</h2>
          <p className="form-sub">Sign in to your account</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Your password"
                required
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="toggle-auth">
            Don't have an account?{' '}
            <button onClick={() => navigate('/signup')}>Sign up</button>
          </div>
          <p className="back-home" onClick={() => navigate('/')}>← Back to home</p>
        </div>
      </div>
    </div>
  )
}