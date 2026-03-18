import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import './LandingPage.css'

const FEATURES = [
  { icon:'🏛️', title:'Govt. Verified',    desc:'Every porter has an official government-issued registration number.' },
  { icon:'💸', title:'Fixed Route Price', desc:'No haggling. Clear prices set by porters per route.' },
  { icon:'⚡', title:'Instant Booking',   desc:'Book in seconds. Porter accepts or declines in real time.' },
  { icon:'🗺️', title:'Live Tracking',     desc:'See where your porter is from booking to delivery.' },
  { icon:'⭐', title:'Verified Reviews',  desc:'Read genuine ratings before you choose.' },
  { icon:'🛡️', title:'Secure Payments',  desc:'UPI, card, or cash — all transactions logged safely.' },
]

const CUSTOMER_STEPS = [
  'Sign up with your mobile number.',
  'Enter your station and platform.',
  'Browse porters with prices and ratings.',
  'Confirm your booking in one tap.',
  'Porter accepts — travel stress-free!',
]

const PORTER_STEPS = [
  'Register with your govt. coolie number.',
  'Set your prices for different routes.',
  'Go online to receive booking requests.',
  'Accept or decline customer bookings.',
  'Complete jobs and build your rating.',
]

export default function LandingPage() {
  const navigate = useNavigate()

  const [porters, setPorters] = useState([])

  // 🔥 Fetch from backend
  useEffect(() => {
    fetch('http://localhost:5000/api/porters')
      .then(res => res.json())
      .then(data => setPorters(data))
      .catch(err => console.error('Error fetching porters:', err))
  }, [])

  return (
    <div className="landing page-enter">
      <Navbar />

      {/* HERO */}
      <section className="hero">
        <div className="hero-left">
          <div className="eyebrow">🚉 India's #1 Railway Porter Platform</div>
          <h1>Book a <span>Porter</span><br />in seconds</h1>
          <p>Certified government-registered porters at your service. Choose your route, pick your porter, travel light.</p>
          <div className="hero-btns">
            <button className="btn-primary" onClick={() => navigate('/booking')}>Book a Porter →</button>
            <button className="btn-outline" onClick={() => navigate('/login?role=porter')}>Join as Porter</button>
          </div>
        </div>

        {/* 🔥 Dynamic Porters */}
        <div className="hero-preview">
          <div className="preview-header">
            <span><span className="dot" />Available Porters Nearby</span>
            <span className="station-tag">Platform 2 · NDLS</span>
          </div>

          {porters.length === 0 ? (
            <p style={{ color: '#888' }}>Loading porters...</p>
          ) : (
            porters.map(p => (
              <div className="preview-row" key={p.id}>
                <div
                  className="p-avatar"
                  style={{ background: 'linear-gradient(135deg,#E8341C,#F5A623)' }}
                >
                  {p.name?.split(' ').map(n => n[0]).join('')}
                </div>

                <div className="p-info">
                  <h4>{p.name}</h4>
                  <small>⭐ {p.rating} · Porter #{p.id}</small>
                </div>

                <strong className="p-price">₹{p.price}</strong>
              </div>
            ))
          )}
        </div>
      </section>

      {/* FEATURES */}
      <section className="features" id="features">
        <h2>Why PorterSaathi?</h2>
        <p className="section-sub">A smarter way to handle luggage at India's busiest stations</p>
        <div className="features-grid">
          {FEATURES.map(f => (
            <div className="f-card" key={f.title}>
              <div className="f-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how" id="how">
        <div className="how-inner">
          <h2>How it works</h2>
          <div className="paths">
            <div className="path-card">
              <h3>🧑‍💼 Customer <span className="tag tag-red">Traveller</span></h3>
              {CUSTOMER_STEPS.map((s, i) => (
                <div className="step" key={i}>
                  <div className="step-n" style={{ color:'var(--red)' }}>{i + 1}</div>
                  <p>{s}</p>
                </div>
              ))}
              <button className="btn-primary" style={{ marginTop:20 }} onClick={() => navigate('/login')}>Get Started →</button>
            </div>

            <div className="path-card">
              <h3>🧳 Porter <span className="tag tag-amber">Porter</span></h3>
              {PORTER_STEPS.map((s, i) => (
                <div className="step" key={i}>
                  <div className="step-n" style={{ color:'var(--amber)' }}>{i + 1}</div>
                  <p>{s}</p>
                </div>
              ))}
              <button className="btn-amber" style={{ marginTop:20 }} onClick={() => navigate('/login?role=porter')}>Join as Porter →</button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <h2>Ready to travel lighter?</h2>
        <p>Join thousands of travellers and porters on PorterSaathi</p>
        <div className="hero-btns" style={{ justifyContent:'center', marginTop:28 }}>
          <button className="btn-primary" onClick={() => navigate('/booking')}>Book a Porter</button>
          <button className="btn-outline" onClick={() => navigate('/login?role=porter')}>Register as Porter</button>
        </div>
      </section>
    </div>
  )
}