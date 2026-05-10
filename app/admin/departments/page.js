'use client'
// app/admin/departments/page.js
// FIXES:
// 1. Department name validation — cannot submit empty name
// 2. Shows form error inline instead of silent fail
// 3. Better empty state when no departments exist
// 4. Confirm before delete is more descriptive

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { getDepartments, createDepartment, deleteDepartment } from '@/lib/firestore'
import Link from 'next/link'

export default function ManageDepartmentsPage() {
  const { profile, loading: authLoading } = useAuth()
  const router = useRouter()

  const [departments, setDepartments] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [form,        setForm]        = useState({ name: '', categories: '' })
  const [formError,   setFormError]   = useState('')
  const [saving,      setSaving]      = useState(false)

  useEffect(() => {
    if (!authLoading && profile?.role !== 'main_admin') { router.push('/admin'); return }
    getDepartments().then(setDepartments).finally(() => setLoading(false))
  }, [profile, authLoading]) // eslint-disable-line

  const handleCreate = async (e) => {
    e.preventDefault()
    // FIX: Validate name is not empty
    if (!form.name.trim()) {
      setFormError('Department name is required.')
      return
    }
    setFormError('')
    setSaving(true)
    try {
      const cats = form.categories.split(',').map(s => s.trim()).filter(Boolean)
      await createDepartment({ name: form.name.trim(), categories: cats, adminUid: '' })
      const fresh = await getDepartments()
      setDepartments(fresh)
      setForm({ name: '', categories: '' })
    } catch (err) {
      console.error(err)
      setFormError('Failed to create department. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"? This cannot be undone and may affect complaint routing.`)) return
    try {
      await deleteDepartment(id)
      setDepartments(prev => prev.filter(d => d.id !== id))
    } catch (err) {
      console.error(err)
      alert('Failed to delete department. Please try again.')
    }
  }

  if (authLoading || loading) return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center text-gray-400">Loading…</div>
  )

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link href="/admin" className="text-sm text-brand-green hover:underline mb-6 inline-block">
        ← Back to Admin
      </Link>
      <h1 className="font-display text-3xl font-bold text-brand-dark mb-8">Manage Departments</h1>

      {/* Create form */}
      <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-6 mb-8">
        <h2 className="font-semibold text-gray-800 mb-4">Add New Department</h2>
        <form onSubmit={handleCreate} noValidate className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Department Name <span className="text-red-500">*</span>
            </label>
            <input
              className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:border-transparent bg-white placeholder-gray-400 transition-all ${
                formError && !form.name.trim()
                  ? 'border-red-300 focus:ring-red-300'
                  : 'border-gray-200 focus:ring-brand-green'
              }`}
              placeholder="e.g. Road Department"
              value={form.name}
              onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setFormError('') }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Categories <span className="text-gray-400 font-normal">(comma-separated, optional)</span>
            </label>
            <input
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent bg-white placeholder-gray-400"
              placeholder="Broken Road, Open Manhole"
              value={form.categories}
              onChange={e => setForm(p => ({ ...p, categories: e.target.value }))}
            />
            <p className="text-xs text-gray-400 mt-1">
              Categories link complaint types to this department for auto-routing.
            </p>
          </div>

          {formError && (
            <p className="text-red-500 text-sm flex items-center gap-1">⚠️ {formError}</p>
          )}

          <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Adding…
              </span>
            ) : (
              '+ Add Department'
            )}
          </button>
        </form>
      </div>

      {/* Departments list */}
      {departments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-green-100 p-10 text-center text-gray-400">
          <p className="text-3xl mb-3">🏢</p>
          <p className="font-medium">No departments yet.</p>
          <p className="text-sm mt-1">Add your first department above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {departments.map(d => (
            <div key={d.id} className="bg-white rounded-2xl border border-green-100 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-semibold text-gray-800">{d.name}</p>
                <p className="text-xs text-gray-400 mt-1">
                  <span className="font-medium">Categories:</span> {d.categories?.join(', ') || '—'}
                </p>
                <p className="text-xs text-gray-400">
                  <span className="font-medium">ID:</span>{' '}
                  <code className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-xs">{d.id}</code>
                </p>
              </div>
              <button
                onClick={() => handleDelete(d.id, d.name)}
                className="bg-red-600 text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap flex-shrink-0"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
