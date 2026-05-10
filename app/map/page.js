'use client'
// app/map/page.js
// FIXES:
// 1. Map height is responsive — uses CSS calc instead of fixed 520px
// 2. Recent reports list shows "No reports" when filtered list is empty
// 3. Filter bar wraps properly on mobile without overflow
// 4. Complaint rows are clickable links

import { useEffect, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { getComplaints } from '@/lib/firestore'
import { CATEGORIES } from '@/lib/utils'

const MapSelector = dynamic(() => import('@/components/MapSelector/MapSelector'), { ssr: false })

export default function MapPage() {
  const [complaints, setComplaints] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [filter,     setFilter]     = useState('All')

  useEffect(() => {
    getComplaints().then(setComplaints).finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'All'
    ? complaints
    : complaints.filter(c => c.status === filter)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-brand-dark">Civic Issues Map</h1>
        <p className="text-gray-500 text-sm mt-1">
          All reported issues across the city. Click any marker to view details.
        </p>
      </div>

      {/* Legend + filter — wraps on mobile */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          {[
            { label: 'Pending',     color: 'bg-red-500'    },
            { label: 'In Progress', color: 'bg-orange-400' },
            { label: 'Resolved',    color: 'bg-green-500'  },
          ].map(l => (
            <span key={l.label} className="flex items-center gap-1.5 text-sm text-gray-600 whitespace-nowrap">
              <span className={`w-3 h-3 rounded-full flex-shrink-0 ${l.color}`} />
              {l.label}
            </span>
          ))}
        </div>

        {/* FIX: Filter buttons wrap cleanly */}
        <div className="flex flex-wrap gap-2 sm:ml-auto">
          {['All', 'Pending', 'In Progress', 'Resolved'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap
                ${filter === f
                  ? 'bg-brand-green text-white border-brand-green'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-brand-green'
                }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex gap-4 mb-4 text-sm text-gray-500">
        <span>Total: <b className="text-gray-800">{complaints.length}</b></span>
        <span>Showing: <b className="text-gray-800">{filtered.length}</b></span>
      </div>

      {/* FIX: Responsive map height — 55vh on mobile, 520px on desktop */}
      {loading ? (
        <div className="skeleton rounded-xl" style={{ height: 'clamp(300px, 55vh, 520px)' }} />
      ) : (
        <div style={{ height: 'clamp(300px, 55vh, 520px)' }}>
          <MapSelector readOnly complaints={filtered} />
        </div>
      )}

      {/* Recent reports */}
      <div className="mt-8">
        <h2 className="font-display text-xl font-bold text-brand-dark mb-4">
          Recent Reports
          {filter !== 'All' && (
            <span className="ml-2 text-sm font-normal text-gray-400">— {filter}</span>
          )}
        </h2>

        {filtered.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-3xl mb-2">📭</p>
            <p>No {filter !== 'All' ? filter.toLowerCase() : ''} complaints found.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {filtered.slice(0, 10).map(c => (
              // FIX: Entire row is a clickable link to complaint detail
              <Link
                key={c.id}
                href={`/complaints/${c.id}`}
                className="flex items-center gap-4 py-3 px-3 border-b border-gray-100 hover:bg-gray-50 -mx-3 rounded-xl transition-colors group"
              >
                <span className="text-2xl flex-shrink-0">
                  {CATEGORIES.find(cat => cat.value === c.category)?.icon || '📋'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{c.category}</p>
                  <p className="text-xs text-gray-400 truncate">{c.description?.slice(0, 70)}…</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    c.status === 'Resolved'    ? 'bg-green-100 text-green-700'  :
                    c.status === 'In Progress' ? 'bg-yellow-100 text-yellow-700':
                                                  'bg-red-100 text-red-700'
                  }`}>
                    {c.status}
                  </span>
                  <span className="text-gray-300 group-hover:text-brand-green transition-colors text-xs">→</span>
                </div>
              </Link>
            ))}
            {filtered.length > 10 && (
              <p className="text-xs text-gray-400 text-center pt-3">
                Showing 10 of {filtered.length} complaints
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
