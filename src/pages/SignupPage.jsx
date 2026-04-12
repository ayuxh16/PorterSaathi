import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './LoginPage.css'
import './SignupPage.css'

const INDIAN_STATIONS = [
  'New Delhi (NDLS)', 'Mumbai CST (CSTM)', 'Howrah (HWH)', 'Chennai Central (MAS)',
  'Bengaluru City (SBC)', 'Hyderabad (HYB)', 'Ahmedabad (ADI)', 'Pune (PUNE)',
  'Guwahati (GHY)', 'Patna (PNBE)', 'Lucknow (LKO)', 'Jaipur (JP)',
  'Bhopal (BPL)', 'Nagpur (NGP)', 'Surat (ST)', 'Kanpur (CNB)',
  'Varanasi (BSB)', 'Agra Cantt (AGC)', 'Amritsar (ASR)', 'Kolkata (KOAA)',
  'Vijayawada (BZA)', 'Coimbatore (CBE)', 'Kochi (ERS)', 'Thiruvananthapuram (TVC)',
  'Bhubaneswar (BBS)', 'Raipur (R)', 'Indore (INDB)', 'Gwalior (GWL)',
  'Jodhpur (JU)', 'Udaipur (UDZ)', 'New Jalpaiguri (NJP)', 'Dibrugarh (DBRG)',
]

export default function SignupPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // 2-step form
  const [stationSearch, setStationSearch] = useState('')
  const [showStationDropdown, setShowStationDropdown] = useState(false)

  const [form, setForm] = useState({
    name:      '',
    email:     '',
    mobile:    '',
    password:  '',
    role:      'customer',
    coolieNum: '',
    station:   '',
    city:      '',
  })

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const filteredStations = INDIAN_STATIONS.filter(s =>
    s.toLowerCase().includes(stationSearch.toLowerCase())
  )

  const selectStation = (station) => {
    setForm({ ...form, station })
    setStationSearch(station)
    setShowStationDropdown(false)
  }

  const handleNext = (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.mobile || !form.password) {
      alert('Please fill all fields in Step 1')
      return
    }
    setStep(2)
  }

  const handleSignup = async (e) => {
    e.preventDefault()

    if (!form.station) {
      alert('Please select your station')
      return
    }
    if (form.role === 'porter' && !form.coolieNum) {
      alert('Coolie registration number is required for porters')
      return
    }

    setLoading(true)
    try {
      const payload = {
        name:      form.name,
        email:     form.email,
        password:  form.password,
        role:      form.role,
        mobile:    form.mobile,
        station:   form.station,
        city:      form.city,
        ...(form.role === 'porter' && { coolieNum: form.coolieNum }),
      }

      const res  = await fetch('https://portersaathi-1.onrender.com/api/auth/signup', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      })
      const data = await res.json()

      if (res.ok) {
        alert('Account created! Please login.')
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

  const isPorter = form.role === 'porter'
  const accent   = isPorter ? 'var(--amber)' : 'var(--red)'
  const btnStyle = { background: accent, color: isPorter ? '#0d0d0d' : '#fff' }

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
          <p>Be part of India's largest railway porter network.</p>

          {/* Step indicator on left panel */}
          <div className="signup-steps-visual">
            <div className={`ssv-step ${step >= 1 ? 'done' : ''}`}>
              <div className="ssv-circle" style={{ borderColor: accent, background: step >= 1 ? accent : 'transparent' }}>
                {step > 1 ? '✓' : '1'}
              </div>
              <div>
                <strong>Your Details</strong>
                <p>Name, email & password</p>
              </div>
            </div>
            <div className="ssv-line" style={{ background: step >= 2 ? accent : 'var(--border)' }} />
            <div className={`ssv-step ${step >= 2 ? 'done' : ''}`}>
              <div className="ssv-circle" style={{ borderColor: accent, background: step >= 2 ? accent : 'transparent', color: step >= 2 ? '#fff' : 'var(--muted)' }}>
                2
              </div>
              <div>
                <strong>Your Station</strong>
                <p>Where you operate</p>
              </div>
            </div>
          </div>

          <div className="ll-stats">
            <div className="ll-stat"><strong>Free</strong><span>To Join</span></div>
            <div className="ll-stat"><strong>Instant</strong><span>Activation</span></div>
            <div className="ll-stat"><strong>Secure</strong><span>Verified</span></div>
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="login-right">
        <div className="login-card">

          {/* Step progress bar */}
          <div className="step-bar">
            <div className="step-bar-fill" style={{ width: step === 1 ? '50%' : '100%', background: accent }} />
          </div>
          <p className="step-label" style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 16 }}>
            Step {step} of 2
          </p>

          {/* Role toggle — always visible */}
          <div className="form-group">
            <label>I am a</label>
            <div className="role-toggle">
              <button
                type="button"
                className={form.role === 'customer' ? 'active' : ''}
                onClick={() => setForm({ ...form, role: 'customer', coolieNum: '' })}
              >
                🧑‍💼 Customer
              </button>
              <button
                type="button"
                className={form.role === 'porter' ? 'active' : ''}
                onClick={() => setForm({ ...form, role: 'porter' })}
              >
                🧳 Porter
              </button>
            </div>
          </div>

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <>
              <h2 style={{ marginBottom: 4 }}>Create Account</h2>
              <p className="form-sub">Fill in your basic details</p>

              <form onSubmit={handleNext}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input name="name" placeholder="Your full name" required
                      value={form.name} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>Mobile Number</label>
                    <div className="input-with-prefix">
                      <span className="input-prefix">🇮🇳 +91</span>
                      <input
                        name="mobile"
                        type="tel"
                        placeholder="9876543210"
                        required
                        maxLength={10}
                        value={form.mobile}
                        onChange={handleChange}
                        style={{ paddingLeft: '80px' }}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Email Address</label>
                  <input name="email" type="email" placeholder="you@example.com" required
                    value={form.email} onChange={handleChange} />
                </div>

                <div className="form-group">
                  <label>Password</label>
                  <input name="password" type="password" placeholder="Create a strong password" required
                    value={form.password} onChange={handleChange} />
                </div>

                <button type="submit" className="submit-btn" style={btnStyle}>
                  Continue →
                </button>
              </form>
            </>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <>
              <h2 style={{ marginBottom: 4 }}>Your Station</h2>
              <p className="form-sub">This determines which bookings you see</p>

              <form onSubmit={handleSignup}>

                {/* Station selector */}
                <div className="form-group" style={{ position: 'relative' }}>
                  <label>🚉 Your Railway Station <span style={{ color: 'var(--red)' }}>*</span></label>
                  <input
                    type="text"
                    placeholder="Search station name..."
                    value={stationSearch}
                    onChange={e => {
                      setStationSearch(e.target.value)
                      setShowStationDropdown(true)
                      setForm({ ...form, station: '' })
                    }}
                    onFocus={() => setShowStationDropdown(true)}
                    autoComplete="off"
                  />
                  {showStationDropdown && stationSearch && (
                    <div className="station-dropdown">
                      {filteredStations.length === 0
                        ? <div className="station-option muted">No stations found</div>
                        : filteredStations.slice(0, 6).map(s => (
                          <div
                            key={s}
                            className="station-option"
                            onClick={() => selectStation(s)}
                          >
                            🚉 {s}
                          </div>
                        ))
                      }
                    </div>
                  )}
                  {form.station && (
                    <div className="selected-station-badge">
                      ✅ {form.station}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>City</label>
                  <input name="city" placeholder="e.g. Guwahati"
                    value={form.city} onChange={handleChange} />
                </div>

                {/* Porter-only fields */}
                {isPorter && (
                  <>
                    <div className="govt-notice">
                      <span>🏛️</span>
                      <div>
                        <strong>Government Registration Required</strong>
                        <p>Enter your official coolie registration number issued by Indian Railways.</p>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Coolie Registration Number <span style={{ color: 'var(--red)' }}>*</span></label>
                      <input
                        name="coolieNum"
                        placeholder="e.g. GHY-2847"
                        required
                        value={form.coolieNum}
                        onChange={handleChange}
                      />
                    </div>
                  </>
                )}

                {/* Mobile number confirmation notice */}
                <div className="info-notice">
                  <span>📱</span>
                  <div>
                    <strong>Mobile Visible After Match</strong>
                    <p>Your mobile number <b>+91 {form.mobile}</b> will be shared with your matched {isPorter ? 'customer' : 'porter'} so you can coordinate directly.</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    className="submit-btn"
                    style={{ background: 'var(--bg3)', color: 'var(--muted)', flex: 1 }}
                    onClick={() => setStep(1)}
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    className="submit-btn"
                    style={{ ...btnStyle, flex: 2 }}
                    disabled={loading}
                  >
                    {loading ? 'Creating account…' : '🎉 Create Account'}
                  </button>
                </div>
              </form>
            </>
          )}

          <div className="toggle-auth" style={{ marginTop: 16 }}>
            Already have an account?{' '}
            <button onClick={() => navigate('/login')}>Sign in</button>
          </div>
          <p className="back-home" onClick={() => navigate('/')}>← Back to home</p>
        </div>
      </div>
    </div>
  )
}





