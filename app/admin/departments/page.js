'use client'
// app/admin/departments/page.js
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from '@/lib/firestore'
import Link from 'next/link'

export default function ManageDepartmentsPage() {
  const { profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const [departments, setDepartments] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [form,        setForm]        = useState({ name: '', categories: '' })
  const [editing,     setEditing]     = useState(null)
  const [saving,      setSaving]      = useState(false)

  useEffect(() => {
    if (!authLoading && profile?.role !== 'main_admin') { router.push('/admin'); return }
    getDepartments().then(setDepartments).finally(() => setLoading(false))
  }, [profile, authLoading]) // eslint-disable-line

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    const cats = form.categories.split(',').map(s => s.trim()).filter(Boolean)
    await createDepartment({ name: form.name, categories: cats, adminUid: '' })
    const fresh = await getDepartments()
    setDepartments(fresh)
    setForm({ name: '', categories: '' })
    setSaving(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this department?')) return
    await deleteDepartment(id)
    setDepartments(prev => prev.filter(d => d.id !== id))
  }

  if (authLoading || loading) return <div className="page-wrapper py-20 text-center text-gray-400">Loading…</div>

  return (
    <div className="page-wrapper py-10 max-w-3xl">
      <Link href="/admin" className="text-sm text-brand-green hover:underline mb-6 inline-block">← Back to Admin</Link>
      <h1 className="section-title mb-8">Manage Departments</h1>

      {/* Create form */}
      <div className="card mb-8">
        <h2 className="font-semibold text-gray-800 mb-4">Add New Department</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="label">Department Name</label>
            <input className="input-field" placeholder="e.g. Road Department"
              value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
          </div>
          <div>
            <label className="label">Categories (comma-separated)</label>
            <input className="input-field" placeholder="Broken Road, Open Manhole"
              value={form.categories} onChange={e => setForm(p => ({ ...p, categories: e.target.value }))} />
          </div>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Adding…' : 'Add Department'}
          </button>
        </form>
      </div>

      {/* Departments list */}
      <div className="space-y-3">
        {departments.map(d => (
          <div key={d.id} className="card flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-gray-800">{d.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Categories: {d.categories?.join(', ') || '—'}
              </p>
              <p className="text-xs text-gray-400">ID: <code className="font-mono bg-gray-100 px-1 rounded">{d.id}</code></p>
            </div>
            <button onClick={() => handleDelete(d.id)} className="btn-danger text-xs py-1.5 px-3 whitespace-nowrap">
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
