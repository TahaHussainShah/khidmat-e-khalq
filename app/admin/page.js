'use client'
// app/admin/page.js
// FIXES:
// 1. React key prop added correctly — no more bare <> fragments in table rows
// 2. Table has min-w-[700px] so cells don't overlap on mobile
// 3. Resolution notes required when marking Resolved
// 4. Edit controls stay in same row — no layout shift
// 5. Category filter dropdown properly sized on mobile

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { getComplaints, updateComplaint, getDepartments } from '@/lib/firestore'
import StatusBadge from '@/components/StatusBadge/StatusBadge'
import { formatDate } from '@/lib/utils'

export default function AdminPage() {
  const { user, profile, loading: authLoading, isVerified } = useAuth()
  const router = useRouter()

  const [complaints,  setComplaints]  = useState([])
  const [departments, setDepartments] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [filter,      setFilter]      = useState('All')
  const [catFilter,   setCatFilter]   = useState('All')

  const [editing,   setEditing]   = useState(null)
  const [newStatus, setNewStatus] = useState('')
  const [notes,     setNotes]     = useState('')
  const [saving,    setSaving]    = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    if (authLoading) return
    if (!user)       { router.replace('/login?from=/admin'); return }
    if (!isVerified) { router.replace('/verify-email?from=/admin'); return }
    if (!['department_admin', 'main_admin'].includes(profile?.role)) {
      router.replace('/dashboard'); return
    }
    const deptId = profile.role === 'department_admin' ? profile.departmentId : null
    Promise.all([getComplaints(deptId), getDepartments()])
      .then(([c, d]) => { setComplaints(c); setDepartments(d) })
      .finally(() => setLoading(false))
  }, [user, profile, authLoading, isVerified, router])

  const startEditing = (c) => {
    setSaveError('')
    setEditing(c.id)
    setNewStatus(c.status)
    setNotes(c.resolutionNotes || '')
  }

  const handleSave = async (id) => {
    // FIX: Require notes when resolving
    if (newStatus === 'Resolved' && !notes.trim()) {
      setSaveError('Please add resolution notes when marking as Resolved.')
      return
    }
    setSaveError('')
    setSaving(true)
    await updateComplaint(id, { status: newStatus, resolutionNotes: notes })
    setComplaints(prev => prev.map(c =>
      c.id === id ? { ...c, status: newStatus, resolutionNotes: notes } : c
    ))
    setEditing(null)
    setSaving(false)
  }

  const allCategories = [...new Set(complaints.map(c => c.category))]
  let filtered = complaints
  if (filter !== 'All')    filtered = filtered.filter(c => c.status   === filter)
  if (catFilter !== 'All') filtered = filtered.filter(c => c.category === catFilter)

  const counts = {
    total:      complaints.length,
    pending:    complaints.filter(c => c.status === 'Pending').length,
    inProgress: complaints.filter(c => c.status === 'In Progress').length,
    resolved:   complaints.filter(c => c.status === 'Resolved').length,
  }

  if (authLoading || loading) return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center text-gray-400">
      Loading admin panel…
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-brand-dark">
            {profile.role === 'main_admin' ? 'Main Admin' : 'Department Admin'} Dashboard
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {profile.role === 'department_admin'
              ? `Managing: ${departments.find(d => d.id === profile.departmentId)?.name || profile.departmentId}`
              : 'Full system access'}
          </p>
        </div>
        {profile.role === 'main_admin' && (
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/departments" className="btn-secondary text-sm">Manage Departments</Link>
            <Link href="/admin/users"       className="btn-secondary text-sm">Manage Users</Link>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total',       count: counts.total,      cls: 'bg-gray-50 border-gray-200'     },
          { label: 'Pending',     count: counts.pending,    cls: 'bg-red-50 border-red-100'       },
          { label: 'In Progress', count: counts.inProgress, cls: 'bg-yellow-50 border-yellow-100' },
          { label: 'Resolved',    count: counts.resolved,   cls: 'bg-green-50 border-green-100'   },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-5 ${s.cls}`}>
            <p className="text-3xl font-display font-bold text-gray-800">{s.count}</p>
            <p className="text-sm text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <div className="flex flex-wrap gap-2">
          {['All', 'Pending', 'In Progress', 'Resolved'].map(tab => (
            <button key={tab} onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all
                ${filter === tab
                  ? 'bg-brand-green text-white border-brand-green'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-brand-green'}`}>
              {tab}
            </button>
          ))}
        </div>
        <div className="sm:ml-auto">
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green bg-white w-full sm:w-auto">
            <option value="All">All Categories</option>
            {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* FIX: Table with min-width to prevent cell overlap on mobile */}
      <div className="bg-white rounded-2xl shadow-sm border border-green-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[750px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Category', 'Description', 'Severity', 'Status', 'Reported By', 'Date', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    <p className="text-3xl mb-2">📋</p>
                    No complaints found.
                  </td>
                </tr>
              )}

              {/* FIX: Each complaint is ONE <tr> — no nested fragments needing extra keys */}
              {filtered.map(c => (
                editing === c.id ? (
                  // Edit row — replaces normal row
                  <tr key={c.id} className="border-b border-green-100 bg-green-50/60">
                    <td colSpan={7} className="px-4 py-4">
                      <div className="flex flex-wrap gap-3 items-start">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                          <select value={newStatus} onChange={e => { setNewStatus(e.target.value); setSaveError('') }}
                            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green bg-white">
                            <option>Pending</option>
                            <option>In Progress</option>
                            <option>Resolved</option>
                          </select>
                        </div>
                        <div className="flex-1 min-w-[220px]">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Resolution Notes {newStatus === 'Resolved' && <span className="text-red-500">*</span>}
                          </label>
                          <input type="text"
                            className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 bg-white ${
                              saveError ? 'border-red-300 focus:ring-red-300' : 'border-gray-200 focus:ring-brand-green'
                            }`}
                            placeholder="Add notes for the citizen…"
                            value={notes}
                            onChange={e => { setNotes(e.target.value); setSaveError('') }}
                          />
                          {saveError && <p className="text-red-500 text-xs mt-1">⚠️ {saveError}</p>}
                        </div>
                        <div className="flex gap-2 pt-5">
                          <button onClick={() => handleSave(c.id)} disabled={saving}
                            className="btn-primary text-sm py-2 disabled:opacity-60">
                            {saving ? 'Saving…' : 'Save'}
                          </button>
                          <button onClick={() => { setEditing(null); setSaveError('') }}
                            className="btn-secondary text-sm py-2">
                            Cancel
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  // Normal display row
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{c.category}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-[160px] truncate" title={c.description}>{c.description}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs font-semibold text-gray-600">{c.severity}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap max-w-[100px] truncate">{c.userName}</td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap text-xs">{formatDate(c.createdAt)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => startEditing(c)}
                        className="text-xs text-brand-green border border-brand-green px-3 py-1.5 rounded-lg hover:bg-green-50 transition-colors"
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-3 text-right">
        Showing {filtered.length} of {complaints.length} complaints
      </p>
    </div>
  )
}
