'use client'
// app/complaints/[id]/page.js
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { getComplaintById } from '@/lib/firestore'
import StatusBadge from '@/components/StatusBadge/StatusBadge'
import SeverityBadge from '@/components/SeverityBadge/SeverityBadge'
import CategoryIcon from '@/components/CategoryIcon/CategoryIcon'
import { formatDate } from '@/lib/utils'

const MapSelector = dynamic(() => import('@/components/MapSelector/MapSelector'), { ssr: false })

export default function ComplaintDetailPage() {
  const { id }   = useParams()
  const router   = useRouter()
  const [c,    setC]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getComplaintById(id).then(data => {
      if (!data) router.push('/dashboard')
      setC(data)
      setLoading(false)
    })
  }, [id]) // eslint-disable-line

  if (loading) return <div className="page-wrapper py-20 text-center text-gray-400">Loading…</div>
  if (!c)      return null

  return (
    <div className="page-wrapper py-10 max-w-3xl">
      <Link href="/dashboard" className="text-sm text-brand-green hover:underline mb-6 inline-block">
        ← Back to Dashboard
      </Link>

      <div className="card mb-6">
        {/* Title row */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center">
            <CategoryIcon category={c.category} size="lg" />
          </div>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-bold text-brand-dark">{c.category}</h1>
            <p className="text-gray-400 text-sm mt-0.5">Reported on {formatDate(c.createdAt)}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={c.status} />
            <SeverityBadge severity={c.severity} />
          </div>
        </div>

        {/* Details grid */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <InfoRow label="Reported by"  value={c.userName || 'Anonymous'} />
          <InfoRow label="Department"   value={c.departmentId?.replace('-', ' ')} />
          <InfoRow label="Status"       value={c.status} />
          <InfoRow label="Last Updated" value={formatDate(c.updatedAt)} />
        </div>

        {/* Description */}
        <div className="mb-6">
          <p className="label">Description</p>
          <p className="text-gray-700 text-sm leading-relaxed bg-gray-50 rounded-xl p-4">
            {c.description}
          </p>
        </div>

        {/* Optional image link */}
        {c.imageUrl && (
          <div className="mb-6">
            <p className="label">Attached Photo</p>
            <a
              href={c.imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-green text-sm underline underline-offset-2 hover:text-green-800"
            >
              📎 View Photo →
            </a>
          </div>
        )}

        {/* Resolution notes */}
        {c.resolutionNotes && (
          <div className="bg-green-50 border border-green-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-green-800 mb-1">Resolution Notes</p>
            <p className="text-sm text-green-900">{c.resolutionNotes}</p>
          </div>
        )}
      </div>

      {/* Map */}
      {c.location?.lat && (
        <div className="card">
          <p className="label mb-3">Issue Location</p>
          <div style={{ height: '300px' }}>
            <MapSelector readOnly value={c.location} />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            📍 {c.location.address || `${c.location.lat.toFixed(5)}, ${c.location.lng.toFixed(5)}`}
          </p>
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm text-gray-800 font-medium capitalize">{value || '—'}</p>
    </div>
  )
}
