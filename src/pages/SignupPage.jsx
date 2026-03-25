import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './LoginPage.css'

export default function SignupPage() {
  const navigate = useNavigate()
  const [role, setRole]       = useState('customer')
  const [loading, setLoading] = useState(false)
  const [form, setForm]       = useState({
    name: '', email: '', password: '', coolieNum: '',
  })

  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      // Only include coolieNum if role is porter
      const payload = {
        name:     form.name,
        email:    form.email,
        password: form.password,
        role,
        ...(role === 'porter' && { coolieNum: form.coolieNum }),
      }

      const res  = await fetch('http://localhost:5000/api/auth/signup', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      })
      const data = await res.json()
      if (res.ok) {
        navigate('/login')
      } else {
        alert(data.error || 'Signup failed')
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
          <h2>Join PorterSaathi today</h2>
          <p>Be part of India's largest railway porter network. Customers travel light, porters earn better.</p>
          <div className="ll-stats">
            <div className="ll-stat">
              <strong>Free</strong><span>To Join</span>
            </div>
            <div className="ll-stat">
              <strong>Instant</strong><span>Activation</span>
            </div>
            <div className="ll-stat">
              <strong>Secure</strong><span>Verified</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="login-right">
        <div className="login-card">
          {/* Role toggle */}
          <div className="role-toggle">
            <button className={role === 'customer' ? 'active' : ''} onClick={() => setRole('customer')}>
              🧑‍💼 Customer
            </button>
            <button className={role === 'porter' ? 'active' : ''} onClick={() => setRole('porter')}>
              🧳 Porter
            </button>
          </div>

          <h2>Create account</h2>
          <p className="form-sub">Sign up as a {role}</p>

          {role === 'porter' && (
            <div className="govt-notice">
              <span>🏛️</span>
              <div>
                <strong>Government Registration Required</strong>
                <p>Enter your official coolie registration number below.</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSignup}>
            <div className="form-group">
              <label>Full Name</label>
              <input
                placeholder="Your full name"
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>
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
                placeholder="Create a password"
                required
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
              />
            </div>

            {role === 'porter' && (
              <div className="form-group">
                <label>Coolie Registration Number</label>
                <input
                  placeholder="e.g. NDLS-2847"
                  required
                  value={form.coolieNum}
                  onChange={e => setForm({ ...form, coolieNum: e.target.value })}
                />
              </div>
            )}

            <button
              type="submit"
              className="submit-btn"
              style={{ background: role === 'porter' ? 'var(--amber)' : 'var(--red)',
                       color: role === 'porter' ? '#0d0d0d' : '#fff' }}
              disabled={loading}
            >
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <div className="toggle-auth">
            Already have an account?{' '}
            <button onClick={() => navigate('/login')}>Sign in</button>
          </div>

          <p className="back-home" onClick={() => navigate('/')}>← Back to home</p>
        </div>
      </div>
    </div>
  )
}