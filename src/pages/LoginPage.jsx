import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useToast } from '../components/Toast'
import './LoginPage.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const showToast = useToast()

  const initialRole = searchParams.get('role') === 'porter' ? 'porter' : 'customer'
  const [role, setRole]       = useState(initialRole)
  const [isRegister, setIsReg] = useState(false)
  const [step, setStep]        = useState(1)

  function handleSubmit(e) {
    e.preventDefault()
    if (role === 'porter' && isRegister && step === 1) {
      setStep(2)
      return
    }
    showToast(
      isRegister ? 'Account Created! 🎉' : 'Welcome back!',
      role === 'porter' ? 'Porter dashboard is ready.' : 'Customer dashboard is ready.'
    )
    setTimeout(() => {
      navigate(role === 'porter' ? '/booking?role=porter' : '/booking')
    }, 800)
  }

  return (
    <div className="login-page page-enter">

      {/* LEFT */}
      <div className="login-left">
        <div className="ll-brand" onClick={() => navigate('/')}>
          <div className="brand-icon">🧳</div>
          <span className="brand-name">Porter<span>Saathi</span></span>
        </div>
        <div className="ll-copy">
          <h2>Smart porter booking for every Indian traveller</h2>
          <p>Verified porters · Fixed prices · Real-time booking</p>
          <div className="ll-stats">
            <div className="ll-stat"><strong>10K+</strong><span>Porters</span></div>
            <div className="ll-stat"><strong>50K+</strong><span>Bookings</span></div>
            <div className="ll-stat"><strong>4.8★</strong><span>Rating</span></div>
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="login-right">
        <div className="login-card">

          {/* Role toggle */}
          <div className="role-toggle">
            <button className={role === 'customer' ? 'active' : ''} onClick={() => { setRole('customer'); setStep(1) }}>
              🧑‍💼 Customer
            </button>
            <button className={role === 'porter' ? 'active' : ''} onClick={() => { setRole('porter'); setStep(1) }}>
              🧳 Porter
            </button>
          </div>

          <h2>{isRegister ? 'Create Account' : 'Sign In'}</h2>
          <p className="form-sub">
            {role === 'porter'
              ? isRegister ? 'Register to start earning.' : 'Sign in to your porter dashboard.'
              : isRegister ? 'Create an account to book porters.' : 'Sign in to book a porter.'}
          </p>

          {/* PORTER STEP 2: Govt Number */}
          {role === 'porter' && isRegister && step === 2 ? (
            <form onSubmit={handleSubmit}>
              <div className="govt-notice">
                <span>🏛️</span>
                <div>
                  <strong>Government Verification Required</strong>
                  <p>Your coolie number is issued by Ministry of Railways.</p>
                </div>
              </div>
              <div className="form-group">
                <label>Government Coolie Number</label>
                <input type="text" placeholder="e.g. NDLS-2847" required />
              </div>
              <div className="form-group">
                <label>Assigned Station</label>
                <select>
                  <option>New Delhi (NDLS)</option>
                  <option>Mumbai CST</option>
                  <option>Howrah Junction</option>
                  <option>Chennai Central</option>
                </select>
              </div>
              <button type="submit" className="btn-amber submit-btn">Complete Registration →</button>
              <button type="button" className="back-link" onClick={() => setStep(1)}>← Back</button>
            </form>
          ) : (
            <form onSubmit={handleSubmit}>
              {isRegister && (
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" placeholder="Your full name" required />
                </div>
              )}
              <div className="form-group">
                <label>Mobile Number</label>
                <input type="tel" placeholder="+91 XXXXX XXXXX" required />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" placeholder="Enter your password" required />
              </div>
              {isRegister && (
                <div className="form-group">
                  <label>Confirm Password</label>
                  <input type="password" placeholder="Repeat password" required />
                </div>
              )}
              <button type="submit" className={`submit-btn ${role === 'porter' ? 'btn-amber' : 'btn-primary'}`}>
                {isRegister ? (role === 'porter' ? 'Continue →' : 'Create Account →') : 'Sign In →'}
              </button>
            </form>
          )}

          <div className="toggle-auth">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}
            <button onClick={() => { setIsReg(!isRegister); setStep(1) }}>
              {isRegister ? ' Sign In' : ' Register'}
            </button>
          </div>

          <div className="back-home" onClick={() => navigate('/')}>← Back to Home</div>
        </div>
      </div>
    </div>
  )
}