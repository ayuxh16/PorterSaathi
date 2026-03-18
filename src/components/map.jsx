import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import { useState } from 'react'

function LocationMarker({ setLocation }) {
  const [position, setPosition] = useState(null)

  useMapEvents({
    click(e) {
      setPosition(e.latlng)
      setLocation(e.latlng)
    }
  })

  return position === null ? null : (
    <Marker position={position}></Marker>
  )
}

export default function MapComponent({ setLocation }) {
  const center = [28.6431, 77.2197] // NDLS

  return (
    <MapContainer center={center} zoom={15} style={{ height: '400px', borderRadius: '16px' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LocationMarker setLocation={setLocation} />
    </MapContainer>
  )
}