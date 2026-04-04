import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

/* ── Custom marker icons ── */
const userIcon = new L.DivIcon({
  className: '',
  html: `<div style="
    width:40px; height:40px; border-radius:50%;
    background:linear-gradient(135deg,#E8341C,#F5A623);
    display:flex; align-items:center; justify-content:center;
    font-size:20px; box-shadow:0 4px 12px rgba(232,52,28,0.5);
    border:3px solid #fff;
  ">🧑</div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
})

const porterIcon = new L.DivIcon({
  className: '',
  html: `<div style="
    width:40px; height:40px; border-radius:50%;
    background:linear-gradient(135deg,#F5A623,#e67e22);
    display:flex; align-items:center; justify-content:center;
    font-size:20px; box-shadow:0 4px 12px rgba(245,166,35,0.5);
    border:3px solid #fff;
  ">🧳</div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
})

/* ── Auto-fit map to show both markers ── */
function FitBounds({ positions }) {
  const map = useMap()
  useEffect(() => {
    if (positions.length >= 2) {
      map.fitBounds(positions, { padding: [60, 60] })
    }
  }, [positions])
  return null
}

/* ── Recenter button ── */
function RecenterButton({ positions }) {
  const map = useMap()
  return (
    <div
      style={{
        position:'absolute', bottom:80, right:12, zIndex:1000,
        background:'var(--bg2,#1a1a1a)', border:'1px solid rgba(255,255,255,0.1)',
        borderRadius:10, padding:'10px 14px', cursor:'pointer',
        color:'#fff', fontSize:13, fontWeight:600,
        boxShadow:'0 4px 12px rgba(0,0,0,0.3)',
      }}
      onClick={() => map.fitBounds(positions, { padding:[60,60] })}
    >
      ⊙ Recenter
    </div>
  )
}

/* ═════════════════════════════════════════════ */
export default function MapPage() {
  const navigate   = useNavigate()
  const watchRef   = useRef(null)
  const socketRef  = useRef(null)

  const storedUser  = JSON.parse(localStorage.getItem('user') || '{}')
  const token       = localStorage.getItem('token')
  const isPorter    = storedUser.role === 'porter'

  const [myLocation,     setMyLocation]     = useState(null)
  const [otherLocation,  setOtherLocation]  = useState(null)
  const [bookingInfo,    setBookingInfo]     = useState(null)
  const [locationError,  setLocationError]  = useState(null)
  const [connected,      setConnected]       = useState(false)
  const [distance,       setDistance]        = useState(null)

  /* ── Haversine distance in metres ── */
  const calcDistance = (a, b) => {
    const R  = 6371000
    const φ1 = a[0] * Math.PI / 180
    const φ2 = b[0] * Math.PI / 180
    const Δφ = (b[0] - a[0]) * Math.PI / 180
    const Δλ = (b[1] - a[1]) * Math.PI / 180
    const x  = Math.sin(Δφ/2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) ** 2
    return Math.round(R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x)))
  }

  /* ── Fetch active booking info ── */
  useEffect(() => {
    if (!token) { navigate('/login'); return }
    fetch('http://localhost:5000/api/bookings/active', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setBookingInfo(data) })
      .catch(() => {})
  }, [token])

  /* ── Watch own GPS position ── */
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.')
      return
    }

    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude]
        setMyLocation(coords)
        setLocationError(null)
        // Emit to server via Socket.io
        if (socketRef.current?.connected) {
          socketRef.current.emit('location_update', {
            role:      storedUser.role,
            bookingId: bookingInfo?.id,
            lat:       coords[0],
            lng:       coords[1],
          })
        }
      },
      (err) => setLocationError('Could not get your location. Please allow location access.'),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    )

    return () => {
      if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current)
    }
  }, [bookingInfo])

  /* ── Connect to Socket.io for real-time updates ── */
  useEffect(() => {
    // Dynamically import socket.io-client to avoid breaking if not installed
    import('socket.io-client').then(({ io }) => {
      const socket = io('http://localhost:5000', {
        auth: { token },
        transports: ['websocket'],
      })

      socket.on('connect', () => {
        setConnected(true)
        // Join the booking room
        if (bookingInfo?.id) {
          socket.emit('join_booking', { bookingId: bookingInfo.id, role: storedUser.role })
        }
      })

      socket.on('disconnect', () => setConnected(false))

      // Listen for other party's location
      socket.on('location_update', (data) => {
        const incoming = [data.lat, data.lng]
        setOtherLocation(incoming)
        if (myLocation) {
          setDistance(calcDistance(myLocation, incoming))
        }
      })

      socketRef.current = socket
    }).catch(() => {
      // Socket.io not installed — use simulated demo mode
      console.warn('socket.io-client not found — running in demo mode')
      setConnected(false)
    })

    return () => socketRef.current?.disconnect()
  }, [bookingInfo, token])

  /* ── Update distance whenever either location changes ── */
  useEffect(() => {
    if (myLocation && otherLocation) {
      setDistance(calcDistance(myLocation, otherLocation))
    }
  }, [myLocation, otherLocation])

  const bothPositions = [myLocation, otherLocation].filter(Boolean)
  const center        = myLocation || [26.1445, 91.7362] // Default: Guwahati

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg, #0d0d0d)',
      display: 'flex', flexDirection: 'column',
    }}>

      {/* ── TOP BAR ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 24px',
        background: 'var(--bg2, #1a1a1a)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        zIndex: 100,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button
            onClick={() => navigate(isPorter ? '/portal' : '/booking')}
            style={{ background:'transparent', border:'none', color:'var(--muted,#888)', cursor:'pointer', fontSize:16 }}
          >
            ← Back
          </button>
          <div style={{ width:1, height:20, background:'rgba(255,255,255,0.1)' }} />
          <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:16 }}>
            🗺️ Live Tracking
          </span>
        </div>

        {/* Connection status */}
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{
            width:8, height:8, borderRadius:'50%',
            background: connected ? '#22c55e' : '#E8341C',
            display:'inline-block',
            boxShadow: connected ? '0 0 6px #22c55e' : '0 0 6px #E8341C',
          }} />
          <span style={{ fontSize:13, color:'var(--muted,#888)' }}>
            {connected ? 'Live' : 'Connecting…'}
          </span>
        </div>
      </div>

      {/* ── INFO CARDS ── */}
      <div style={{
        display: 'flex', gap: 12, padding: '12px 16px',
        background: 'var(--bg2, #1a1a1a)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        flexWrap: 'wrap',
      }}>
        {/* My location status */}
        <div style={{
          background: 'var(--bg3, #222)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 10, padding: '10px 16px', flex:1, minWidth:160,
        }}>
          <p style={{ fontSize:11, color:'var(--muted,#888)', marginBottom:4 }}>
            {isPorter ? '🧳 My Location' : '🧑 My Location'}
          </p>
          <strong style={{ fontSize:13 }}>
            {myLocation ? `${myLocation[0].toFixed(5)}, ${myLocation[1].toFixed(5)}` : 'Getting location…'}
          </strong>
        </div>

        {/* Other party location */}
        <div style={{
          background: 'var(--bg3, #222)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 10, padding: '10px 16px', flex:1, minWidth:160,
        }}>
          <p style={{ fontSize:11, color:'var(--muted,#888)', marginBottom:4 }}>
            {isPorter ? '🧑 Customer Location' : '🧳 Porter Location'}
          </p>
          <strong style={{ fontSize:13 }}>
            {otherLocation ? `${otherLocation[0].toFixed(5)}, ${otherLocation[1].toFixed(5)}` : 'Waiting for signal…'}
          </strong>
        </div>

        {/* Distance */}
        {distance !== null && (
          <div style={{
            background: distance < 100 ? 'rgba(34,197,94,0.1)' : 'rgba(245,166,35,0.08)',
            border: `1px solid ${distance < 100 ? 'rgba(34,197,94,0.25)' : 'rgba(245,166,35,0.2)'}`,
            borderRadius: 10, padding: '10px 16px', minWidth:120,
            display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
          }}>
            <p style={{ fontSize:11, color:'var(--muted,#888)', marginBottom:4 }}>📏 Distance</p>
            <strong style={{
              fontSize: 18,
              fontFamily:"'Syne',sans-serif",
              color: distance < 100 ? '#22c55e' : 'var(--amber,#F5A623)',
            }}>
              {distance < 1000 ? `${distance}m` : `${(distance/1000).toFixed(2)}km`}
            </strong>
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

      {/* ── LOCATION ERROR ── */}
      {locationError && (
        <div style={{
          background: 'rgba(232,52,28,0.08)', border:'1px solid rgba(232,52,28,0.2)',
          padding: '12px 20px', margin:'12px 16px', borderRadius:10,
          color:'#E8341C', fontSize:14,
        }}>
          ⚠️ {locationError}
        </div>
      )}

      {/* ── MAP ── */}
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

          {/* My marker */}
          {myLocation && (
            <Marker position={myLocation} icon={isPorter ? porterIcon : userIcon}>
              <Popup>
                <strong>{isPorter ? '🧳 You (Porter)' : '🧑 You (Customer)'}</strong><br />
                {storedUser.name}
              </Popup>
            </Marker>
          )}

          {/* Other party marker */}
          {otherLocation && (
            <Marker position={otherLocation} icon={isPorter ? userIcon : porterIcon}>
              <Popup>
                <strong>{isPorter ? '🧑 Customer' : '🧳 Porter'}</strong><br />
                {bookingInfo ? (isPorter ? bookingInfo.customer_name : bookingInfo.porter_name) : 'Other party'}
              </Popup>
            </Marker>
          )}

          {/* Line between them */}
          {bothPositions.length === 2 && (
            <Polyline
              positions={bothPositions}
              color="#F5A623"
              weight={3}
              opacity={0.6}
              dashArray="8, 8"
            />
          )}

          {/* Auto fit + recenter */}
          {bothPositions.length >= 2 && (
            <>
              <FitBounds positions={bothPositions} />
              <RecenterButton positions={bothPositions} />
            </>
          )}
        </MapContainer>

        {/* ── LEGEND ── */}
        <div style={{
          position:'absolute', top:12, left:12, zIndex:1000,
          background:'rgba(13,13,13,0.85)', backdropFilter:'blur(8px)',
          border:'1px solid rgba(255,255,255,0.08)',
          borderRadius:12, padding:'12px 16px',
          display:'flex', flexDirection:'column', gap:8,
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13 }}>
            <span>🧑</span> <span style={{ color:'#f0f0f0' }}>You ({isPorter ? 'Porter' : 'Customer'})</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13 }}>
            <span>{isPorter ? '🧑' : '🧳'}</span>
            <span style={{ color:'#f0f0f0' }}>{isPorter ? 'Customer' : 'Porter'}</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13 }}>
            <span style={{ width:20, height:3, background:'#F5A623', display:'inline-block', borderRadius:2 }} />
            <span style={{ color:'var(--muted,#888)' }}>Route line</span>
          </div>
        </div>
      </div>
    </div>
  )
}