'use client'
// components/MapSelector/MapSelector.js
// Dynamic import required — Leaflet needs window

import { useEffect, useRef, useState } from 'react'

export default function MapSelector({ value, onChange, readOnly = false, complaints = [] }) {
  const mapRef       = useRef(null)
  const instanceRef  = useRef(null)
  const markerRef    = useRef(null)
  const [locationStatus, setLocationStatus] = useState('detecting') // 'detecting' | 'detected' | 'denied'
  const [hasUserAdjusted, setHasUserAdjusted] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Lazy load Leaflet
    import('leaflet').then((L) => {
      // Fix default icon paths (Next.js breaks Leaflet icons)
      delete L.default.Icon.Default.prototype._getIconUrl
      L.default.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      if (!mapRef.current || instanceRef.current) return

      // Default center: Rawalpindi, Pakistan
      const map = L.default.map(mapRef.current).setView([33.6007, 73.0679], 13)
      instanceRef.current = map

      L.default.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map)

      // If pre-existing value, place marker
      if (value?.lat && value?.lng) {
        markerRef.current = L.default.marker([value.lat, value.lng]).addTo(map)
        map.setView([value.lat, value.lng], 15)
        setLocationStatus('detected')
      } else if (!readOnly) {
        // Request user's geolocation
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords
              // Place marker at user's location
              if (markerRef.current) markerRef.current.remove()
              markerRef.current = L.default.marker([latitude, longitude]).addTo(map)
              map.setView([latitude, longitude], 15)
              // Update form with detected location
              onChange?.({ lat: latitude, lng: longitude, address: '' })
              setLocationStatus('detected')
            },
            (error) => {
              console.warn('Geolocation error:', error)
              setLocationStatus('denied')
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0,
            }
          )
        } else {
          setLocationStatus('denied')
        }
      }

      // Place complaint markers (read-only mode for map page)
      if (complaints.length > 0) {
        const STATUS_COLORS = {
          'Pending':     'red',
          'In Progress': 'orange',
          'Resolved':    'green',
        }
        complaints.forEach(c => {
          if (!c.location?.lat) return
          const color = STATUS_COLORS[c.status] || 'blue'
          const icon  = L.default.divIcon({
            className: '',
            html: `<div style="
              background:${color === 'red' ? '#ef4444' : color === 'orange' ? '#f97316' : '#22c55e'};
              width:14px;height:14px;border-radius:50%;
              border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4)
            "></div>`,
            iconSize: [14, 14],
          })
          L.default.marker([c.location.lat, c.location.lng], { icon })
            .addTo(map)
            .bindPopup(`
              <b>${c.category}</b><br/>
              <span style="font-size:12px">${c.description?.slice(0, 80)}…</span><br/>
              <a href="/complaints/${c.id}" style="color:#1a6b3c;font-size:12px">View →</a>
            `)
        })
      }

      // Click to place pin (only if not readOnly)
      if (!readOnly) {
        map.on('click', (e) => {
          const { lat, lng } = e.latlng
          if (markerRef.current) markerRef.current.remove()
          markerRef.current = L.default.marker([lat, lng]).addTo(map)
          onChange?.({ lat, lng, address: '' })
          setHasUserAdjusted(true)
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
      
      {/* Status messages */}
      {!readOnly && (
        <>
          {locationStatus === 'detected' && !hasUserAdjusted && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-green-50/95 backdrop-blur-sm
                            border border-green-200 text-green-700 text-xs px-3 py-2 rounded-full shadow-md z-[1000]
                            flex items-center gap-1.5">
              <span>✓ Your location detected</span>
            </div>
          )}
          {locationStatus === 'detected' && hasUserAdjusted && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-blue-50/95 backdrop-blur-sm
                            border border-blue-200 text-blue-700 text-xs px-3 py-2 rounded-full shadow-md z-[1000]
                            flex items-center gap-1.5">
              <span>📍 Location adjusted</span>
            </div>
          )}
          {locationStatus === 'detecting' && !value?.lat && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm
                            border border-gray-200 text-gray-600 text-xs px-3 py-2 rounded-full shadow-md z-[1000]
                            flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 bg-gray-400 rounded-full animate-pulse"></span>
              <span>Detecting location…</span>
            </div>
          )}
          {locationStatus === 'denied' && !value?.lat && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-orange-50/95 backdrop-blur-sm
                            border border-orange-200 text-orange-700 text-xs px-3 py-2 rounded-full shadow-md z-[1000]">
              <span>📍 Click to set location manually</span>
            </div>
          )}
          {!value?.lat && locationStatus === 'denied' && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm
                            text-xs text-gray-600 px-3 py-1.5 rounded-full shadow-md pointer-events-none z-[1000]">
              Click on the map to drop a pin 📍
            </div>
          )}
        </>
      )}
    </div>
  )
}
