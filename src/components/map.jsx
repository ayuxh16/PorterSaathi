import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const userIcon = new L.DivIcon({
  className: '',
  html: `<div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#E8341C,#F5A623);display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 4px 12px rgba(232,52,28,0.5);border:3px solid #fff;">🧑</div>`,
  iconSize: [40, 40], iconAnchor: [20, 20],
})

const porterIcon = new L.DivIcon({
  className: '',
  html: `<div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#F5A623,#e67e22);display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 4px 12px rgba(245,166,35,0.5);border:3px solid #fff;">🧳</div>`,
  iconSize: [40, 40], iconAnchor: [20, 20],
})

function FitBounds({ positions }) {
  const map = useMap()
  useEffect(() => {
    if (positions.length >= 2) map.fitBounds(positions, { padding: [60, 60] })
  }, [positions])
  return null
}

function RecenterButton({ positions }) {
  const map = useMap()
  return (
    <div onClick={() => map.fitBounds(positions, { padding: [60, 60] })} style={{
      position:'absolute', bottom:80, right:12, zIndex:1000,
      background:'#1a1a1a', border:'1px solid rgba(255,255,255,0.1)',
      borderRadius:10, padding:'10px 14px', cursor:'pointer',
      color:'#fff', fontSize:13, fontWeight:600,
      boxShadow:'0 4px 12px rgba(0,0,0,0.3)',
    }}>
      ⊙ Recenter
    </div>
  )
}

export default function MapPage() {
  const navigate  = useNavigate()
  const watchRef  = useRef(null)
  const pollRef   = useRef(null)

  const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
  const token      = localStorage.getItem('token')
  const isPorter   = storedUser.role === 'porter'

  const [myLocation,    setMyLocation]    = useState(null)
  const [bookingInfo,   setBookingInfo]   = useState(null)
  const [locationError, setLocationError] = useState(null)
  const [distance,      setDistance]      = useState(null)
  const [error,         setError]         = useState(null)

  // Haversine distance in metres
  const calcDistance = (a, b) => {
    const R  = 6371000
    const φ1 = a[0] * Math.PI / 180
    const φ2 = b[0] * Math.PI / 180
    const Δφ = (b[0] - a[0]) * Math.PI / 180
    const Δλ = (b[1] - a[1]) * Math.PI / 180
    const x  = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2
    return Math.round(R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x)))
  }

  // Fetch active booking
  useEffect(() => {
    if (!token) { navigate('/login'); return }
    fetch('https://portersaathi-1.onrender.com/api/bookings/active', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => {
        if (r.status === 404) { setError('No active confirmed booking found. Go back and confirm a booking first.'); return null }
        return r.ok ? r.json() : null
      })
      .then(data => { if (data) setBookingInfo(data) })
      .catch(() => setError('Could not connect to server.'))
  }, [token])

  // Watch own GPS
  useEffect(() => {
    if (!navigator.geolocation) { setLocationError('Geolocation not supported by your browser.'); return }

    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setMyLocation([pos.coords.latitude, pos.coords.longitude])
        setLocationError(null)
      },
      () => setLocationError('Could not get your location. Please allow location access.'),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    )

    return () => { if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current) }
  }, [])

  // Calculate distance when my location updates
  // (In a real app, other party's location would come from Socket.io)
  // For now, show your own location clearly with booking info
  const center = myLocation || [26.1445, 91.7362]

  return (
    <div style={{ minHeight:'100vh', background:'#0d0d0d', display:'flex', flexDirection:'column' }}>

      {/* TOP BAR */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'14px 24px', background:'#1a1a1a',
        borderBottom:'1px solid rgba(255,255,255,0.07)', zIndex:100,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button
            onClick={() => navigate(isPorter ? '/portal' : '/booking')}
            style={{ background:'transparent', border:'none', color:'#888', cursor:'pointer', fontSize:16 }}
          >← Back</button>
          <div style={{ width:1, height:20, background:'rgba(255,255,255,0.1)' }} />
          <span style={{ fontWeight:700, fontSize:16 }}>🗺️ Live Tracking</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{
            width:8, height:8, borderRadius:'50%',
            background: myLocation ? '#22c55e' : '#E8341C',
            display:'inline-block',
            boxShadow: myLocation ? '0 0 6px #22c55e' : '0 0 6px #E8341C',
          }} />
          <span style={{ fontSize:13, color:'#888' }}>
            {myLocation ? 'GPS Active' : 'Getting GPS…'}
          </span>
        </div>
      </div>

      {/* ERROR STATE */}
      {error && (
        <div style={{
          background:'rgba(232,52,28,0.08)', border:'1px solid rgba(232,52,28,0.2)',
          padding:'20px 24px', margin:'20px', borderRadius:12, color:'#E8341C', fontSize:15,
          textAlign:'center',
        }}>
          ⚠️ {error}
          <br />
          <button
            onClick={() => navigate(isPorter ? '/portal' : '/booking')}
            style={{
              marginTop:12, padding:'8px 20px', borderRadius:8,
              background:'rgba(232,52,28,0.15)', border:'1px solid rgba(232,52,28,0.3)',
              color:'#E8341C', cursor:'pointer', fontWeight:600,
            }}
          >← Go Back</button>
        </div>
      )}

      {/* INFO CARDS */}
      {!error && (
        <div style={{
          display:'flex', gap:12, padding:'12px 16px',
          background:'#1a1a1a', borderBottom:'1px solid rgba(255,255,255,0.07)',
          flexWrap:'wrap',
        }}>
          {/* My location */}
          <div style={{
            background:'#222', border:'1px solid rgba(255,255,255,0.07)',
            borderRadius:10, padding:'10px 16px', flex:1, minWidth:160,
          }}>
            <p style={{ fontSize:11, color:'#888', marginBottom:4 }}>
              {isPorter ? '🧳 Your Location (Porter)' : '🧑 Your Location (Customer)'}
            </p>
            <strong style={{ fontSize:13 }}>
              {myLocation
                ? `${myLocation[0].toFixed(5)}, ${myLocation[1].toFixed(5)}`
                : 'Getting location…'}
            </strong>
          </div>

          {/* Booking info */}
          {bookingInfo && (
            <div style={{
              background:'#222', border:'1px solid rgba(255,255,255,0.07)',
              borderRadius:10, padding:'10px 16px', flex:1, minWidth:160,
            }}>
              <p style={{ fontSize:11, color:'#888', marginBottom:4 }}>📋 Active Booking</p>
              <strong style={{ fontSize:13 }}>
                {bookingInfo.from_loc} → {bookingInfo.to_loc}
              </strong>
              <p style={{ fontSize:11, color:'#888', marginTop:2 }}>
                {isPorter
                  ? `Customer: ${bookingInfo.customer_name}`
                  : `Porter: ${bookingInfo.porter_name || 'Assigned'}`}
              </p>
            </div>
          )}

          {/* Call button */}
          {bookingInfo && (
            <a
              href={`tel:+91${isPorter ? bookingInfo.customer_mobile : bookingInfo.porter_mobile}`}
              style={{
                display:'flex', alignItems:'center', gap:8,
                background:'rgba(34,197,94,0.12)', border:'1px solid rgba(34,197,94,0.25)',
                borderRadius:10, padding:'10px 18px',
                color:'#22c55e', textDecoration:'none', fontWeight:600, fontSize:14,
                whiteSpace:'nowrap',
              }}
            >
              📞 Call {isPorter ? 'Customer' : 'Porter'}
            </a>
          )}
        </div>
      )}

      {/* LOCATION ERROR */}
      {locationError && (
        <div style={{
          background:'rgba(232,52,28,0.08)', border:'1px solid rgba(232,52,28,0.2)',
          padding:'12px 20px', margin:'12px 16px', borderRadius:10,
          color:'#E8341C', fontSize:14,
        }}>
          ⚠️ {locationError}
        </div>
      )}

      {/* MAP */}
      {!error && (
        <div style={{ flex:1, position:'relative' }}>
          <MapContainer
            center={center}
            zoom={15}
            style={{ height:'100%', minHeight:'500px', width:'100%' }}
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />

            {myLocation && (
              <Marker position={myLocation} icon={isPorter ? porterIcon : userIcon}>
                <Popup>
                  <strong>{isPorter ? '🧳 You (Porter)' : '🧑 You (Customer)'}</strong><br />
                  {storedUser.name}
                </Popup>
              </Marker>
            )}

            {myLocation && (
              <RecenterButton positions={[myLocation]} />
            )}
          </MapContainer>

          {/* LEGEND */}
          <div style={{
            position:'absolute', top:12, left:12, zIndex:1000,
            background:'rgba(13,13,13,0.85)', backdropFilter:'blur(8px)',
            border:'1px solid rgba(255,255,255,0.08)',
            borderRadius:12, padding:'12px 16px',
          }}>
            <div style={{ fontSize:13, marginBottom:6 }}>
              {isPorter ? '🧳' : '🧑'} <span style={{ color:'#f0f0f0' }}>You ({isPorter ? 'Porter' : 'Customer'})</span>
            </div>
            {bookingInfo && (
              <div style={{ fontSize:12, color:'#888', marginTop:4 }}>
                Booking #{bookingInfo.id} · {bookingInfo.status}
              </div>
            )}
          </div>

          {/* Note about real-time */}
          <div style={{
            position:'absolute', bottom:12, left:'50%', transform:'translateX(-50%)',
            zIndex:1000, background:'rgba(13,13,13,0.85)', backdropFilter:'blur(8px)',
            border:'1px solid rgba(245,166,35,0.2)', borderRadius:10,
            padding:'8px 16px', fontSize:12, color:'#F5A623', whiteSpace:'nowrap',
          }}>
            📡 Your live location is shown · Call {isPorter ? 'customer' : 'porter'} to coordinate
          </div>
        </div>
      )}
    </div>
  )
}





