'use client'
// app/admin/users/page.js
// FIXES:
// 1. Validates department is selected before saving department_admin role
// 2. React key prop on table row fragments fixed
// 3. Table has min-w to prevent overlap on mobile
// 4. Save button disabled while saving to prevent double-submit

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { getAllUsers, updateUserRole, getDepartments } from '@/lib/firestore'
import { formatDate } from '@/lib/utils'

const ROLE_LABELS = {
  user:             'Citizen',
  department_admin: 'Dept Admin',
  main_admin:       'Main Admin',
}

const ROLE_COLORS = {
  user:             'bg-gray-100 text-gray-700',
  department_admin: 'bg-blue-100 text-blue-700',
  main_admin:       'bg-purple-100 text-purple-700',
}

export default function ManageUsersPage() {
  const { profile, loading: authLoading } = useAuth()
  const router = useRouter()

  const [users,       setUsers]       = useState([])
  const [departments, setDepartments] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [editing,     setEditing]     = useState(null)
  const [newRole,     setNewRole]     = useState('')
  const [newDept,     setNewDept]     = useState('')
  const [saving,      setSaving]      = useState(false)
  const [saveError,   setSaveError]   = useState('')

  useEffect(() => {
    if (!authLoading && profile?.role !== 'main_admin') { router.push('/admin'); return }
    Promise.all([getAllUsers(), getDepartments()])
      .then(([u, d]) => { setUsers(u); setDepartments(d) })
      .finally(() => setLoading(false))
  }, [profile, authLoading]) // eslint-disable-line

  const startEditing = (u) => {
    setSaveError('')
    setEditing(u.uid)
    setNewRole(u.role)
    setNewDept(u.departmentId || '')
  }

  const handleSaveRole = async (uid) => {
    // FIX: Must select a department when assigning dept admin role
    if (newRole === 'department_admin' && !newDept) {
      setSaveError('Please select a department for this admin.')
      return
    }
    setSaveError('')
    setSaving(true)
    await updateUserRole(uid, newRole, newRole === 'department_admin' ? newDept : null)
    setUsers(prev => prev.map(u =>
      u.uid === uid ? { ...u, role: newRole, departmentId: newRole === 'department_admin' ? newDept : '' } : u
    ))
    setEditing(null)
    setSaving(false)
  }

  if (authLoading || loading) return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center text-gray-400">Loading…</div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link href="/admin" className="text-sm text-brand-green hover:underline mb-6 inline-block">
        ← Back to Admin
      </Link>
      <h1 className="font-display text-3xl font-bold text-brand-dark mb-8">
        Manage Users <span className="text-gray-400 font-normal text-xl">({users.length})</span>
      </h1>

      <div className="bg-white rounded-2xl shadow-sm border border-green-100 overflow-hidden">
        <div className="overflow-x-auto">
          {/* FIX: min-w-[750px] prevents column overlap on small screens */}
          <table className="w-full text-sm min-w-[750px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Name', 'Email', 'Phone', 'Role', 'Department', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-400">No users found.</td>
                </tr>
              )}

              {/* FIX: one <tr> per user — no fragment key issues */}
              {users.map(u => (
                editing === u.uid ? (
                  // Inline edit row
                  <tr key={u.uid} className="border-b border-blue-100 bg-blue-50/60">
                    <td colSpan={7} className="px-4 py-4">
                      <div className="flex flex-wrap gap-3 items-start">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
                          <select
                            value={newRole}
                            onChange={e => { setNewRole(e.target.value); setSaveError('') }}
                            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green bg-white"
                          >
                            <option value="user">Citizen</option>
                            <option value="department_admin">Department Admin</option>
                            <option value="main_admin">Main Admin</option>
                          </select>
                        </div>

                        {newRole === 'department_admin' && (
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Department <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={newDept}
                              onChange={e => { setNewDept(e.target.value); setSaveError('') }}
                              className={`border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 bg-white ${
                                saveError ? 'border-red-300 focus:ring-red-300' : 'border-gray-200 focus:ring-brand-green'
                              }`}
                            >
                              <option value="">Select department…</option>
                              {departments.map(d => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div className="flex flex-col gap-1">
                          {saveError && <p className="text-red-500 text-xs">⚠️ {saveError}</p>}
                          <div className="flex gap-2 mt-auto pt-5">
                            <button
                              onClick={() => handleSaveRole(u.uid)}
                              disabled={saving}
                              className="btn-primary text-sm py-2 disabled:opacity-60"
                            >
                              {saving ? 'Saving…' : 'Save'}
                            </button>
                            <button
                              onClick={() => { setEditing(null); setSaveError('') }}
                              className="btn-secondary text-sm py-2"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  // Normal display row
                  <tr key={u.uid} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{u.name || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-[160px] truncate">{u.email}</td>
                    <td className="px-4 py-3 text-gray-500">{u.phone || '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${ROLE_COLORS[u.role] || 'bg-gray-100 text-gray-600'}`}>
                        {ROLE_LABELS[u.role] || u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {departments.find(d => d.id === u.departmentId)?.name || u.departmentId || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => startEditing(u)}
                        className="text-xs text-brand-green border border-brand-green px-3 py-1.5 rounded-lg hover:bg-green-50 transition-colors"
                      >
                        Change Role
                      </button>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
