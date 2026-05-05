'use client'
// app/report-issue/page.js
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { createComplaint } from '@/lib/firestore'
import { resolveDepartment } from '@/lib/firestore'
import { buildComplaintPayload, validateComplaint } from '@/models/complaint'
import { CATEGORIES, SEVERITIES } from '@/lib/utils'

// MapSelector must be dynamically imported — Leaflet needs browser APIs
const MapSelector = dynamic(() => import('@/components/MapSelector/MapSelector'), { ssr: false })

const INITIAL = {
  category:    '',
  severity:    '',
  description: '',
  imageUrl:    '',
  location:    { lat: null, lng: null, address: '' },
}

export default function ReportIssuePage() {
  const { user, loading: authLoading, isVerified } = useAuth()
  const router = useRouter()

  const [form,    setForm]    = useState(INITIAL)
  const [errors,  setErrors]  = useState({})
  const [saving,  setSaving]  = useState(false)
  const [success, setSuccess] = useState(false)

  // Redirect if not logged in or email not verified
  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace('/login?from=/report-issue')
      return
    }
    if (!isVerified) {
      router.replace('/verify-email?from=/report-issue')
    }
  }, [user, authLoading, isVerified, router])

  const set = (key, value) => setForm(p => ({ ...p, [key]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const { valid, errors: errs } = validateComplaint(form)
    if (!valid) { setErrors(errs); return }

    setSaving(true)
    try {
      const departmentId = resolveDepartment(form.category)
      const payload      = buildComplaintPayload(form, user, departmentId)
      await createComplaint(payload)
      setSuccess(true)
      setTimeout(() => router.push('/dashboard'), 2000)
    } catch (err) {
      console.error(err)
      setErrors({ submit: 'Failed to submit. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  if (authLoading) return <LoadingScreen />
  if (success) return <SuccessScreen />

  return (
    <div className="page-wrapper py-10 max-w-3xl">
      <div className="mb-8">
        <h1 className="section-title">Report a Civic Issue</h1>
        <p className="text-gray-500 mt-2 text-sm">
          Fill in the details below. Your complaint will be automatically routed to the relevant department.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* Category */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">Issue Category *</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {CATEGORIES.map(c => (
              <button
                key={c.value}
                type="button"
                onClick={() => set('category', c.value)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all
                  ${form.category === c.value
                    ? 'border-brand-green bg-green-50 text-brand-green'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
              >
                <span className="text-xl">{c.icon}</span>
                {c.label}
              </button>
            ))}
          </div>
          {errors.category && <p className="error-text mt-2">{errors.category}</p>}
        </div>

        {/* Severity */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">Severity Level *</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {SEVERITIES.map(s => (
              <button
                key={s.value}
                type="button"
                onClick={() => set('severity', s.value)}
                className={`py-3 px-4 rounded-xl border text-sm font-semibold transition-all
                  ${form.severity === s.value
                    ? `${s.bg} ${s.text} border-current`
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          {errors.severity && <p className="error-text mt-2">{errors.severity}</p>}
        </div>

        {/* Description */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">Description *</h2>
          <textarea
            className="input-field resize-none"
            rows={5}
            placeholder="Describe the issue in detail. Include any relevant information that helps the department understand the problem…"
            value={form.description}
            onChange={e => set('description', e.target.value)}
            maxLength={500}
          />
          <div className="flex justify-between items-center mt-1">
            {errors.description
              ? <p className="error-text">{errors.description}</p>
              : <span />
            }
            <p className="text-xs text-gray-400">{form.description.length}/500</p>
          </div>
        </div>

        {/* Location */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-1">Location on Map *</h2>
          <p className="text-xs text-gray-400 mb-4">We'll auto-detect your location. You can adjust the pin by clicking anywhere on the map.</p>
          <MapSelector value={form.location} onChange={loc => set('location', loc)} />
          {form.location?.lat && (
            <p className="text-xs text-brand-green mt-2 font-medium">
              ✓ Location selected: {form.location.lat.toFixed(5)}, {form.location.lng.toFixed(5)}
            </p>
          )}
          {errors.location && <p className="error-text mt-2">{errors.location}</p>}
        </div>

        {/* Optional image URL */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-1">Photo Link <span className="text-gray-400 font-normal">(optional)</span></h2>
          <p className="text-xs text-gray-400 mb-3">
            If you have a photo, upload it to Google Photos or Imgur and paste the link here. No account needed for Imgur.
          </p>
          <input
            type="url"
            className="input-field"
            placeholder="https://i.imgur.com/yourphoto.jpg"
            value={form.imageUrl}
            onChange={e => set('imageUrl', e.target.value)}
          />
          {errors.imageUrl && <p className="error-text mt-1">{errors.imageUrl}</p>}
        </div>

        {/* Submit */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            {errors.submit}
          </div>
        )}

        <button type="submit" disabled={saving} className="btn-primary w-full py-4 text-base">
          {saving ? 'Submitting Complaint…' : 'Submit Complaint →'}
        </button>
      </form>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="page-wrapper py-20 text-center text-gray-400">
      <div className="text-5xl mb-4 animate-pulse-slow">🌿</div>
      <p>Loading…</p>
    </div>
  )
}

function SuccessScreen() {
  return (
    <div className="page-wrapper py-20 text-center animate-fade-in">
      <div className="text-6xl mb-4">✅</div>
      <h2 className="font-display text-3xl font-bold text-brand-dark mb-3">Complaint Submitted!</h2>
      <p className="text-gray-500">Your issue has been reported and routed to the relevant department.</p>
      <p className="text-gray-400 text-sm mt-2">Redirecting to your dashboard…</p>
    </div>
  )
}
