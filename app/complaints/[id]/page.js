'use client'
// app/complaints/[id]/page.js
// FIX: This file was COMPLETELY MISSING — "View Details →" on every ComplaintCard returned 404.

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getComplaintById } from '@/lib/firestore'
import StatusBadge from '@/components/StatusBadge/StatusBadge'
import SeverityBadge from '@/components/SeverityBadge/SeverityBadge'
import CategoryIcon from '@/components/CategoryIcon/CategoryIcon'
import { formatDate } from '@/lib/utils'

export default function ComplaintDetailPage() {
  const { id } = useParams()
  const router  = useRouter()
  const [complaint, setComplaint] = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [notFound,  setNotFound]  = useState(false)

  useEffect(() => {
    if (!id) return
    getComplaintById(id)
      .then(data => { if (!data) setNotFound(true); else setComplaint(data) })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <PageLoader />

  if (notFound) return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
      <p className="text-5xl mb-4">🔍</p>
      <h2 className="font-display text-2xl font-bold text-brand-dark mb-3">Complaint Not Found</h2>
      <p className="text-gray-500 mb-6">This complaint may have been deleted or the link is invalid.</p>
      <Link href="/map" className="btn-primary">View All Complaints</Link>
    </div>
  )

  const { category, severity, description, status, location, createdAt, updatedAt, userName, imageUrl, resolutionNotes } = complaint

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      <Link href="/map" className="inline-flex items-center gap-1 text-sm text-brand-green hover:underline mb-6">
        ← Back to Map
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-6 mb-5">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center border border-green-100 flex-shrink-0">
              <CategoryIcon category={category} size="lg" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-brand-dark">{category}</h1>
              <p className="text-xs text-gray-400 mt-0.5">Reported on {formatDate(createdAt)}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <StatusBadge status={status} />
            <SeverityBadge severity={severity} />
          </div>
        </div>

        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Description</p>
          <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{description}</p>
        </div>

        {userName && (
          <p className="text-xs text-gray-400">
            Reported by: <span className="font-medium text-gray-600">{userName}</span>
          </p>
        )}
      </div>

      {/* Location */}
      {location?.lat && (
        <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-6 mb-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Location</p>
          <p className="text-sm text-gray-700 mb-2">
            📍 {location.address || `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`}
          </p>
          <a
            href={`https://www.google.com/maps?q=${location.lat},${location.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-brand-green hover:underline"
          >
            View on Google Maps ↗
          </a>
        </div>
      )}

      {/* Photo */}
      {imageUrl && (
        <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-6 mb-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Attached Photo</p>
          <a
            href={imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-brand-green hover:underline"
          >
            📎 View Photo →
          </a>
        </div>
      )}

      {/* Resolution notes */}
      {resolutionNotes && (
        <div className="bg-green-50 rounded-2xl border border-green-200 p-6 mb-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-green-700 mb-2">Department Response</p>
          <p className="text-sm text-green-800 leading-relaxed">{resolutionNotes}</p>
          {updatedAt && (
            <p className="text-xs text-green-600 mt-2">Last updated: {formatDate(updatedAt)}</p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => router.back()}
          className="btn-secondary text-sm"
        >
          ← Go Back
        </button>
        <Link href="/report-issue" className="btn-primary text-sm">
          Report Another Issue
        </Link>
      </div>
    </div>
  )
}

function PageLoader() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      <div className="h-4 skeleton w-24 mb-6 rounded" />
      <div className="bg-white rounded-2xl border border-green-100 p-6 mb-5">
        <div className="flex gap-3 mb-5">
          <div className="h-12 w-12 skeleton rounded-xl" />
          <div className="flex-1">
            <div className="h-6 skeleton w-48 mb-2 rounded" />
            <div className="h-3 skeleton w-32 rounded" />
          </div>
        </div>
        <div className="h-4 skeleton w-full mb-2 rounded" />
        <div className="h-4 skeleton w-3/4 rounded" />
      </div>
      <div className="bg-white rounded-2xl border border-green-100 p-6">
        <div className="h-4 skeleton w-32 mb-2 rounded" />
        <div className="h-4 skeleton w-56 rounded" />
      </div>
    </div>
  )
}
