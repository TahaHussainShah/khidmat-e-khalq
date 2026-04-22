'use client'
// app/map/page.js
import { useEffect, useState } from 'react'
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
    <div className="page-wrapper py-8">
      <div className="mb-6">
        <h1 className="section-title">Civic Issues Map</h1>
        <p className="text-gray-500 text-sm mt-1">
          All reported issues across the city. Click any marker to view details.
        </p>
      </div>

      {/* Legend + filter */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          {[
            { label: 'Pending',     color: 'bg-red-500'    },
            { label: 'In Progress', color: 'bg-yellow-500' },
            { label: 'Resolved',    color: 'bg-green-500'  },
          ].map(l => (
            <span key={l.label} className="flex items-center gap-1.5 text-sm text-gray-600">
              <span className={`w-3 h-3 rounded-full ${l.color}`} />
              {l.label}
            </span>
          ))}
        </div>

        <div className="ml-auto flex gap-2">
          {['All', 'Pending', 'In Progress', 'Resolved'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all
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

      {/* Map */}
      {loading ? (
        <div className="h-[500px] skeleton rounded-xl" />
      ) : (
        <div style={{ height: '520px' }}>
          <MapSelector readOnly complaints={filtered} />
        </div>
      )}

      {/* Summary table */}
      <div className="mt-8">
        <h2 className="font-display text-xl font-bold text-brand-dark mb-4">Recent Reports</h2>
        {filtered.slice(0, 8).map(c => (
          <div key={c.id} className="flex items-center gap-4 py-3 border-b border-gray-100 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors">
            <span className="text-2xl">{CATEGORIES.find(cat => cat.value === c.category)?.icon || '📋'}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{c.category}</p>
              <p className="text-xs text-gray-400 truncate">{c.description?.slice(0, 60)}…</p>
            </div>
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
              c.status === 'Resolved'    ? 'bg-green-100 text-green-700' :
              c.status === 'In Progress' ? 'bg-yellow-100 text-yellow-700' :
                                           'bg-red-100 text-red-700'
            }`}>{c.status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
