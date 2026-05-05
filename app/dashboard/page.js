'use client'
// app/dashboard/page.js
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { getUserComplaints, deleteComplaint } from '@/lib/firestore'
import ComplaintCard from '@/components/ComplaintCard/ComplaintCard'
import { STATUSES } from '@/lib/utils'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const { user, loading: authLoading, isVerified } = useAuth()
  const router = useRouter()

  const [complaints, setComplaints] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [filter,     setFilter]     = useState('All')

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace('/login?from=/dashboard')
      return
    }
    if (!isVerified) {
      router.replace('/verify-email?from=/dashboard')
      return
    }

    getUserComplaints(user.uid)
      .then(setComplaints)
      .finally(() => setLoading(false))
  }, [user, authLoading, isVerified, router])

  const handleDelete = async (id) => {
    if (!confirm('Delete this complaint? This cannot be undone.')) return
    await deleteComplaint(id)
    setComplaints(prev => prev.filter(c => c.id !== id))
  }

  const filtered = filter === 'All'
    ? complaints
    : complaints.filter(c => c.status === filter)

  // Summary counts
  const counts = {
    All:         complaints.length,
    Pending:     complaints.filter(c => c.status === 'Pending').length,
    'In Progress':complaints.filter(c => c.status === 'In Progress').length,
    Resolved:    complaints.filter(c => c.status === 'Resolved').length,
  }

  if (authLoading || loading) return <PageLoader />

  return (
    <div className="page-wrapper py-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="section-title">My Complaints</h1>
          <p className="text-gray-500 text-sm mt-1">
            Welcome back, <span className="font-medium text-brand-green">{user?.displayName || user?.email}</span>
          </p>
        </div>
        <Link href="/report-issue" className="btn-primary whitespace-nowrap">
          + Report New Issue
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total',       count: counts.All,          color: 'bg-gray-50 border-gray-200' },
          { label: 'Pending',     count: counts.Pending,      color: 'bg-red-50 border-red-100'   },
          { label: 'In Progress', count: counts['In Progress'],color: 'bg-yellow-50 border-yellow-100' },
          { label: 'Resolved',    count: counts.Resolved,     color: 'bg-green-50 border-green-100' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-5 ${s.color}`}>
            <p className="text-3xl font-display font-bold text-gray-800">{s.count}</p>
            <p className="text-sm text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['All', 'Pending', 'In Progress', 'Resolved'].map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all border
              ${filter === tab
                ? 'bg-brand-green text-white border-brand-green'
                : 'bg-white text-gray-600 border-gray-200 hover:border-brand-green'
              }`}
          >
            {tab} ({counts[tab] ?? 0})
          </button>
        ))}
      </div>

      {/* Complaints grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 card">
          <p className="text-5xl mb-4">📋</p>
          <p className="text-gray-500 font-medium">No complaints found.</p>
          {filter === 'All' && (
            <Link href="/report-issue" className="btn-primary inline-block mt-4">
              Report Your First Issue
            </Link>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(c => (
            <ComplaintCard
              key={c.id}
              complaint={c}
              showActions
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function PageLoader() {
  return (
    <div className="page-wrapper py-10">
      <div className="h-8 skeleton w-48 mb-8" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => <div key={i} className="h-20 skeleton rounded-2xl" />)}
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[...Array(6)].map((_, i) => <div key={i} className="h-48 skeleton rounded-2xl" />)}
      </div>
    </div>
  )
}
