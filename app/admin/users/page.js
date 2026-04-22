'use client'
// app/admin/users/page.js
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

  useEffect(() => {
    if (!authLoading && profile?.role !== 'main_admin') { router.push('/admin'); return }
    Promise.all([getAllUsers(), getDepartments()])
      .then(([u, d]) => { setUsers(u); setDepartments(d) })
      .finally(() => setLoading(false))
  }, [profile, authLoading]) // eslint-disable-line

  const handleSaveRole = async (uid) => {
    setSaving(true)
    await updateUserRole(uid, newRole, newRole === 'department_admin' ? newDept : null)
    setUsers(prev => prev.map(u =>
      u.uid === uid ? { ...u, role: newRole, departmentId: newDept } : u
    ))
    setEditing(null)
    setSaving(false)
  }

  if (authLoading || loading) return <div className="page-wrapper py-20 text-center text-gray-400">Loading…</div>

  return (
    <div className="page-wrapper py-10">
      <Link href="/admin" className="text-sm text-brand-green hover:underline mb-6 inline-block">← Back to Admin</Link>
      <h1 className="section-title mb-8">Manage Users ({users.length})</h1>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
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
              {users.map(u => (
                <>
                  <tr key={u.uid} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{u.name || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{u.email}</td>
                    <td className="px-4 py-3 text-gray-500">{u.phone || '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${ROLE_COLORS[u.role] || 'bg-gray-100 text-gray-600'}`}>
                        {ROLE_LABELS[u.role] || u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{u.departmentId || '—'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => { setEditing(u.uid); setNewRole(u.role); setNewDept(u.departmentId || '') }}
                        className="text-xs text-brand-green border border-brand-green px-3 py-1.5 rounded-lg hover:bg-green-50 transition-colors"
                      >
                        Change Role
                      </button>
                    </td>
                  </tr>

                  {editing === u.uid && (
                    <tr key={`edit-${u.uid}`} className="bg-blue-50 border-b border-blue-100">
                      <td colSpan={7} className="px-4 py-4">
                        <div className="flex flex-wrap gap-4 items-end">
                          <div>
                            <label className="label text-xs">Role</label>
                            <select value={newRole} onChange={e => setNewRole(e.target.value)}
                              className="input-field !py-2 text-sm w-44">
                              <option value="user">Citizen</option>
                              <option value="department_admin">Department Admin</option>
                              <option value="main_admin">Main Admin</option>
                            </select>
                          </div>
                          {newRole === 'department_admin' && (
                            <div>
                              <label className="label text-xs">Assign Department</label>
                              <select value={newDept} onChange={e => setNewDept(e.target.value)}
                                className="input-field !py-2 text-sm w-52">
                                <option value="">Select department…</option>
                                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                              </select>
                            </div>
                          )}
                          <div className="flex gap-2">
                            <button onClick={() => handleSaveRole(u.uid)} disabled={saving}
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
