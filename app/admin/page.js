'use client'
// app/admin/page.js — Main Admin & Dept Admin dashboard
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { getComplaints, updateComplaint, getDepartments } from '@/lib/firestore'
import ComplaintCard from '@/components/ComplaintCard/ComplaintCard'
import StatusBadge from '@/components/StatusBadge/StatusBadge'
import { formatDate } from '@/lib/utils'

export default function AdminPage() {
  const { user, profile, loading: authLoading, isVerified } = useAuth()
  const router = useRouter()

  const [complaints,   setComplaints]   = useState([])
  const [departments,  setDepartments]  = useState([])
  const [loading,      setLoading]      = useState(true)
  const [filter,       setFilter]       = useState('All')
  const [catFilter,    setCatFilter]    = useState('All')
  const [activeTab,    setActiveTab]    = useState('complaints')

  // editing state
  const [editing,  setEditing]  = useState(null) // complaint id
  const [newStatus,setNewStatus] = useState('')
  const [notes,    setNotes]    = useState('')
  const [saving,   setSaving]   = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace('/login?from=/admin')
      return
    }
    if (!isVerified) {
      router.replace('/verify-email?from=/admin')
      return
    }
    if (!['department_admin', 'main_admin'].includes(profile?.role)) {
      router.replace('/dashboard')
      return
    }
    const deptId = profile.role === 'department_admin' ? profile.departmentId : null
    Promise.all([getComplaints(deptId), getDepartments()])
      .then(([c, d]) => { setComplaints(c); setDepartments(d) })
      .finally(() => setLoading(false))
  }, [user, profile, authLoading, isVerified, router])

  const handleSave = async (id) => {
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
  if (filter !== 'All')    filtered = filtered.filter(c => c.status === filter)
  if (catFilter !== 'All') filtered = filtered.filter(c => c.category === catFilter)

  const counts = {
    total:      complaints.length,
    pending:    complaints.filter(c => c.status === 'Pending').length,
    inProgress: complaints.filter(c => c.status === 'In Progress').length,
    resolved:   complaints.filter(c => c.status === 'Resolved').length,
  }

  if (authLoading || loading) return <div className="page-wrapper py-20 text-center text-gray-400">Loading admin panel…</div>
  if (!user || !profile) return <div className="page-wrapper py-20 text-center text-gray-400">Redirecting…</div>

  return (
    <div className="page-wrapper py-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="section-title">
            {profile.role === 'main_admin' ? 'Main Admin' : 'Department Admin'} Dashboard
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {profile.role === 'department_admin'
              ? `Managing: ${departments.find(d => d.id === profile.departmentId)?.name || profile.departmentId}`
              : 'Full system access'
            }
          </p>
        </div>
        {profile.role === 'main_admin' && (
          <div className="flex gap-2">
            <Link href="/admin/departments" className="btn-secondary text-sm">Manage Departments</Link>
            <Link href="/admin/users"       className="btn-secondary text-sm">Manage Users</Link>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total',       count: counts.total,      cls: 'bg-gray-50 border-gray-200'         },
          { label: 'Pending',     count: counts.pending,    cls: 'bg-red-50 border-red-100'           },
          { label: 'In Progress', count: counts.inProgress, cls: 'bg-yellow-50 border-yellow-100'     },
          { label: 'Resolved',    count: counts.resolved,   cls: 'bg-green-50 border-green-100'       },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-5 ${s.cls}`}>
            <p className="text-3xl font-display font-bold text-gray-800">{s.count}</p>
            <p className="text-sm text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['All', 'Pending', 'In Progress', 'Resolved'].map(tab => (
          <button key={tab} onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all border
              ${filter === tab
                ? 'bg-brand-green text-white border-brand-green'
                : 'bg-white text-gray-600 border-gray-200 hover:border-brand-green'}`}>
            {tab}
          </button>
        ))}
        <div className="ml-auto">
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
            className="input-field !py-2 !px-3 text-sm w-auto">
            <option value="All">All Categories</option>
            {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Complaints table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Category','Description','Severity','Status','Reported By','Date','Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">No complaints found.</td></tr>
              )}
              {filtered.map(c => (
                <>
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{c.category}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-[180px] truncate">{c.description}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs font-semibold text-gray-600">{c.severity}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{c.userName}</td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap text-xs">{formatDate(c.createdAt)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => { setEditing(c.id); setNewStatus(c.status); setNotes(c.resolutionNotes || '') }}
                        className="text-xs text-brand-green border border-brand-green px-3 py-1.5 rounded-lg hover:bg-green-50 transition-colors"
                      >
                        Update
                      </button>
                    </td>
                  </tr>

                  {/* Inline edit row */}
                  {editing === c.id && (
                    <tr key={`edit-${c.id}`} className="bg-green-50 border-b border-green-100">
                      <td colSpan={7} className="px-4 py-4">
                        <div className="flex flex-wrap gap-4 items-end">
                          <div>
                            <label className="label text-xs">Update Status</label>
                            <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
                              className="input-field !py-2 text-sm w-44">
                              <option>Pending</option>
                              <option>In Progress</option>
                              <option>Resolved</option>
                            </select>
                          </div>
                          <div className="flex-1 min-w-[200px]">
                            <label className="label text-xs">Resolution Notes</label>
                            <input type="text" className="input-field !py-2 text-sm"
                              placeholder="Add notes for the citizen…"
                              value={notes} onChange={e => setNotes(e.target.value)} />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleSave(c.id)} disabled={saving}
                              className="btn-primary text-sm py-2">
                              {saving ? 'Saving…' : 'Save'}
                            </button>
                            <button onClick={() => setEditing(null)}
                              className="btn-secondary text-sm py-2">
                              Cancel
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
