import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { useToast } from '../components/Toast'
import MapComponent from '../components/Map'
import './BookingPage.css'

const PORTERS = [
  { id:'RK', name:'Ramesh Kumar', num:'#2847', stars:'4.9', trips:127, price:80,  bg:'linear-gradient(135deg,#E8341C,#F5A623)' },
  { id:'MS', name:'Mohan Singh',  num:'#1193', stars:'4.6', trips:89,  price:65,  bg:'linear-gradient(135deg,#6C5CE7,#a29bfe)' },
  { id:'AK', name:'Arjun Kumar',  num:'#3312', stars:'4.8', trips:203, price:90,  bg:'linear-gradient(135deg,#00b894,#55efc4)' },
]

export default function BookingPage() {
  const [searchParams]   = useSearchParams()
  const isPorter         = searchParams.get('role') === 'porter'
  const showToast        = useToast()

  const [location, setLocation] = useState(null)
  const [tab, setTab]           = useState(isPorter ? 'requests' : 'book')
  const [selected, setSelected] = useState(0)
  const [status, setStatus]     = useState(null)
  const [reqs, setReqs]         = useState([])

  // 🔥 Fetch bookings for porter
  useEffect(() => {
    if (isPorter) {
      fetch('http://localhost:5000/api/bookings')
        .then(res => res.json())
        .then(data => setReqs(data))
        .catch(err => console.error(err))
    }
  }, [isPorter])

  // 🔥 Booking API call
  function confirmBooking() {
    if (!location) {
      showToast('Select location first!', '', '⚠️')
      return
    }

    const bookingData = {
      porterId: PORTERS[selected].id,
      porterName: PORTERS[selected].name,
      price: PORTERS[selected].price,
      location
    }

    fetch('http://localhost:5000/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData)
    })

    setStatus('waiting')
    setTab('status')

    showToast(
      'Booking Sent!',
      `Waiting for ${PORTERS[selected].name} to respond.`
    )
  }

  return (
    <div className="dashboard-layout">
      <Sidebar role={isPorter ? 'porter' : 'customer'} activeTab={tab} onTabChange={setTab} />

      <div className="main-content page-enter">

        {/* ── CUSTOMER VIEW ── */}
        {!isPorter && tab === 'book' && <>
          <div className="page-header">
            <div>
              <h1>Book a Porter</h1>
              <p>Select location and choose porter</p>
            </div>
          </div>

          {/* Trip */}
          <div className="card">
            <h3>🚉 Trip Details</h3>
            <p>Select your station details</p>
          </div>

          {/* 🔥 MAP */}
          <div className="card">
            <h3>📍 Select Pickup Location</h3>

            <MapComponent setLocation={setLocation} />

            {location && (
              <p style={{ marginTop: 10, fontSize: 13 }}>
                Selected: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
              </p>
            )}
          </div>

          {/* Porters */}
          <div className="card">
            <h3>👷 Available Porters</h3>

            <div className="porter-grid">
              {PORTERS.map((p, i) => (
                <div
                  key={p.id}
                  className={`porter-card ${selected === i ? 'selected' : ''}`}
                  onClick={() => setSelected(i)}
                >
                  <div className="pc-avatar" style={{ background: p.bg }}>
                    {p.id}
                  </div>

                  <h4>{p.name}</h4>
                  <div>₹{p.price}</div>
                </div>
              ))}
            </div>

            <button className="btn-primary" onClick={confirmBooking}>
              Confirm Booking →
            </button>
          </div>
        </>}

        {/* ── CUSTOMER STATUS ── */}
        {!isPorter && tab === 'status' && (
          <div className="card">
            <h2>⏳ Waiting for confirmation</h2>
          </div>
        )}

        {/* ── PORTER VIEW ── */}
        {isPorter && tab === 'requests' && <>
          <div className="page-header">
            <h1>Booking Requests</h1>
          </div>

          {reqs.length === 0 ? (
            <p>No bookings yet...</p>
          ) : (
            reqs.map((r, i) => (
              <div key={i} className="req-card">
                <h3>{r.porterName}</h3>

                <p>💰 ₹{r.price}</p>

                <p>
                  📍 {r.location?.lat?.toFixed(3)}, {r.location?.lng?.toFixed(3)}
                </p>

                <div className="req-actions">
                  <button className="btn-accept">Accept</button>
                  <button className="btn-reject">Reject</button>
                </div>
              </div>
            ))
          )}
        </>}
      </div>
    </div>
  )
}