'use client'
// components/MapSelector/MapSelector.js
// FIXES:
// 1. Map restricted to Pakistan bounds — cannot pan or click outside Pakistan
// 2. Pins placed outside Pakistan are rejected with a user-visible error toast
// 3. Auto-detected location outside Pakistan falls back to Rawalpindi default
// 4. Read-only map (public map page) still shows all of Pakistan but won't accept pins

import { useEffect, useRef, useState } from 'react'

// Pakistan bounding box
const PAKISTAN_BOUNDS = {
  minLat: 23.5,
  maxLat: 37.1,
  minLng: 60.8,
  maxLng: 77.8,
}
const PAKISTAN_CENTER = [30.3753, 69.3451] // geographic center of Pakistan
const DEFAULT_CENTER  = [33.6007, 73.0679] // Rawalpindi fallback

function isInPakistan(lat, lng) {
  return (
    lat >= PAKISTAN_BOUNDS.minLat &&
    lat <= PAKISTAN_BOUNDS.maxLat &&
    lng >= PAKISTAN_BOUNDS.minLng &&
    lng <= PAKISTAN_BOUNDS.maxLng
  )
}

export default function MapSelector({ value, onChange, readOnly = false, complaints = [] }) {
  const mapRef      = useRef(null)
  const instanceRef = useRef(null)
  const markerRef   = useRef(null)

  const [locationStatus, setLocationStatus] = useState('detecting')
  const [hasAdjusted,    setHasAdjusted]    = useState(false)
  const [outOfBounds,    setOutOfBounds]    = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    import('leaflet').then((L) => {
      delete L.default.Icon.Default.prototype._getIconUrl
      L.default.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      if (!mapRef.current || instanceRef.current) return

      // FIX: Restrict map to Pakistan bounds
      const pakistanBounds = L.default.latLngBounds(
        [PAKISTAN_BOUNDS.minLat, PAKISTAN_BOUNDS.minLng],
        [PAKISTAN_BOUNDS.maxLat, PAKISTAN_BOUNDS.maxLng]
      )

      const initialCenter = value?.lat ? [value.lat, value.lng] : DEFAULT_CENTER
      const initialZoom   = value?.lat ? 15 : readOnly ? 5 : 12

      const map = L.default.map(mapRef.current, {
        center:          initialCenter,
        zoom:            initialZoom,
        maxBounds:       pakistanBounds,       // FIX: cannot pan outside Pakistan
        maxBoundsViscosity: 1.0,               // hard boundary — no elastic snap
        minZoom:         readOnly ? 5 : 10,    // prevent zooming out of Pakistan entirely
        maxZoom:         19,
      })
      instanceRef.current = map

      L.default.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map)

      // Place existing pin
      if (value?.lat && value?.lng) {
        markerRef.current = L.default.marker([value.lat, value.lng]).addTo(map)
        setLocationStatus('detected')
      } else if (!readOnly) {
        // Request geolocation
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            ({ coords: { latitude, longitude } }) => {
              // FIX: If GPS is outside Pakistan, fall back to Rawalpindi
              if (!isInPakistan(latitude, longitude)) {
                map.setView(DEFAULT_CENTER, 12)
                setLocationStatus('denied')
                return
              }
              if (markerRef.current) markerRef.current.remove()
              markerRef.current = L.default.marker([latitude, longitude]).addTo(map)
              map.setView([latitude, longitude], 15)
              onChange?.({ lat: latitude, lng: longitude, address: '' })
              setLocationStatus('detected')
            },
            () => setLocationStatus('denied'),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
          )
        } else {
          setLocationStatus('denied')
        }
      }

      // Complaint markers for read-only map view
      if (complaints.length > 0) {
        const STATUS_COLORS = { 'Pending': '#ef4444', 'In Progress': '#f97316', 'Resolved': '#22c55e' }
        complaints.forEach(c => {
          if (!c.location?.lat || !c.location?.lng) return
          const color = STATUS_COLORS[c.status] || '#3b82f6'
          const icon  = L.default.divIcon({
            className: '',
            html: `<div style="background:${color};width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>`,
            iconSize: [14, 14],
          })
          L.default.marker([c.location.lat, c.location.lng], { icon })
            .addTo(map)
            .bindPopup(`
              <b>${c.category}</b><br/>
              <span style="font-size:12px">${c.description?.slice(0, 80) ?? ''}…</span><br/>
              <a href="/complaints/${c.id}" style="color:#1a6b3c;font-size:12px">View →</a>
            `)
        })
      }

      // Click to place pin — only in edit mode, only inside Pakistan
      if (!readOnly) {
        map.on('click', (e) => {
          const { lat, lng } = e.latlng

          // FIX: Reject clicks outside Pakistan
          if (!isInPakistan(lat, lng)) {
            setOutOfBounds(true)
            setTimeout(() => setOutOfBounds(false), 3000)
            return
          }

          setOutOfBounds(false)
          if (markerRef.current) markerRef.current.remove()
          markerRef.current = L.default.marker([lat, lng]).addTo(map)
          onChange?.({ lat, lng, address: '' })
          setHasAdjusted(true)
          setLocationStatus('detected')
        })
      }
    })

    return () => {
      if (instanceRef.current) {
        instanceRef.current.remove()
        instanceRef.current = null
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative w-full" style={{ height: '380px' }}>
      <div ref={mapRef} className="w-full h-full rounded-xl border border-green-100 shadow-sm" />

      {/* Out-of-bounds toast */}
      {outOfBounds && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-red-50/95 backdrop-blur-sm border border-red-200 text-red-700 text-xs px-4 py-2 rounded-full shadow-md z-[1000] flex items-center gap-1.5 whitespace-nowrap">
          🚫 Please select a location inside Pakistan
        </div>
      )}

      {/* Status messages — only shown in edit mode */}
      {!readOnly && !outOfBounds && (
        <>
          {locationStatus === 'detected' && !hasAdjusted && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-green-50/95 backdrop-blur-sm border border-green-200 text-green-700 text-xs px-3 py-2 rounded-full shadow-md z-[1000] flex items-center gap-1.5">
              ✓ Your location detected — click to adjust
            </div>
          )}
          {locationStatus === 'detected' && hasAdjusted && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-blue-50/95 backdrop-blur-sm border border-blue-200 text-blue-700 text-xs px-3 py-2 rounded-full shadow-md z-[1000]">
              📍 Location adjusted
            </div>
          )}
          {locationStatus === 'detecting' && !value?.lat && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm border border-gray-200 text-gray-600 text-xs px-3 py-2 rounded-full shadow-md z-[1000] flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 bg-gray-400 rounded-full animate-pulse" />
              Detecting location…
            </div>
          )}
          {locationStatus === 'denied' && !value?.lat && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-orange-50/95 backdrop-blur-sm border border-orange-200 text-orange-700 text-xs px-3 py-2 rounded-full shadow-md z-[1000]">
              📍 Click anywhere in Pakistan to set location
            </div>
          )}
        </>
      )}

      {/* Pakistan-only badge */}
      {!readOnly && (
        <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm text-xs text-gray-500 px-2 py-1 rounded-lg shadow-sm z-[1000] flex items-center gap-1 pointer-events-none">
          🇵🇰 Pakistan only
        </div>
      )}
    </div>
  )
}
