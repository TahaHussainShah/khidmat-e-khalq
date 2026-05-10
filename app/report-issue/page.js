'use client'
// app/report-issue/page.js
// FIXES:
// 1. Scroll + focus to first invalid field on submit (user requirement)
// 2. Error border highlight on invalid cards
// 3. Character counter turns red near limit
// 4. Dismissible submit error banner
// 5. Loading spinner inside submit button

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { createComplaint, resolveDepartment } from '@/lib/firestore'
import { buildComplaintPayload, validateComplaint } from '@/models/complaint'
import { CATEGORIES, SEVERITIES } from '@/lib/utils'

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

  // Section refs — used to scroll to first error field
  const categoryRef    = useRef(null)
  const severityRef    = useRef(null)
  const descriptionRef = useRef(null)
  const locationRef    = useRef(null)
  const imageUrlRef    = useRef(null)

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.replace('/login?from=/report-issue'); return }
    if (!isVerified) { router.replace('/verify-email?from=/report-issue') }
  }, [user, authLoading, isVerified, router])

  const set = (key, value) => {
    setForm(p => ({ ...p, [key]: value }))
    if (errors[key]) setErrors(prev => { const e = { ...prev }; delete e[key]; return e })
  }

  // Scroll + focus to the first field that has an error
  const scrollToFirstError = (errs) => {
    const order = [
      ['category',    categoryRef],
      ['severity',    severityRef],
      ['description', descriptionRef],
      ['location',    locationRef],
      ['imageUrl',    imageUrlRef],
    ]
    for (const [field, ref] of order) {
      if (errs[field] && ref.current) {
        ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
        const focusable = ref.current.querySelector('textarea, input, button[type="button"]')
        if (focusable) setTimeout(() => focusable.focus({ preventScroll: true }), 450)
        break
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const { valid, errors: errs } = validateComplaint(form)
    if (!valid) {
      setErrors(errs)
      scrollToFirstError(errs)
      return
    }

    setSaving(true)
    try {
      const departmentId = resolveDepartment(form.category)
      const payload      = buildComplaintPayload(form, user, departmentId)
      await createComplaint(payload)
      setSuccess(true)
      setTimeout(() => router.push('/dashboard'), 2500)
    } catch (err) {
      console.error(err)
      setErrors({ submit: 'Failed to submit. Please check your connection and try again.' })
    } finally {
      setSaving(false)
    }
  }

  if (authLoading) return <LoadingScreen />
  if (success)     return <SuccessScreen />

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-brand-dark">Report a Civic Issue</h1>
        <p className="text-gray-500 mt-2 text-sm">
          Fill in the details below. Your complaint will be automatically routed to the relevant department.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-6">

        {/* ── Category ── */}
        <div
          ref={categoryRef}
          className={`bg-white rounded-2xl border p-6 shadow-sm transition-all ${
            errors.category ? 'border-red-300 ring-2 ring-red-100' : 'border-green-100'
          }`}
        >
          <h2 className="font-semibold text-gray-800 mb-1">
            Issue Category <span className="text-red-500">*</span>
          </h2>
          <p className="text-xs text-gray-400 mb-4">Select the type of civic problem you are reporting.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {CATEGORIES.map(c => (
              <button
                key={c.value}
                type="button"
                onClick={() => set('category', c.value)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left
                  ${form.category === c.value
                    ? 'border-brand-green bg-green-50 text-brand-green ring-1 ring-brand-green'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
              >
                <span className="text-xl flex-shrink-0">{c.icon}</span>
                <span className="truncate">{c.label}</span>
              </button>
            ))}
          </div>
          {errors.category && (
            <p className="text-red-500 text-xs mt-3 flex items-center gap-1">⚠️ {errors.category}</p>
          )}
        </div>

        {/* ── Severity ── */}
        <div
          ref={severityRef}
          className={`bg-white rounded-2xl border p-6 shadow-sm transition-all ${
            errors.severity ? 'border-red-300 ring-2 ring-red-100' : 'border-green-100'
          }`}
        >
          <h2 className="font-semibold text-gray-800 mb-1">
            Severity Level <span className="text-red-500">*</span>
          </h2>
          <p className="text-xs text-gray-400 mb-4">How urgent is this issue?</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {SEVERITIES.map(s => (
              <button
                key={s.value}
                type="button"
                onClick={() => set('severity', s.value)}
                className={`py-3 px-4 rounded-xl border text-sm font-semibold transition-all
                  ${form.severity === s.value
                    ? `${s.bg} ${s.text} border-current ring-1 ring-current`
                    : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          {errors.severity && (
            <p className="text-red-500 text-xs mt-3 flex items-center gap-1">⚠️ {errors.severity}</p>
          )}
        </div>

        {/* ── Description ── */}
        <div
          ref={descriptionRef}
          className={`bg-white rounded-2xl border p-6 shadow-sm transition-all ${
            errors.description ? 'border-red-300 ring-2 ring-red-100' : 'border-green-100'
          }`}
        >
          <h2 className="font-semibold text-gray-800 mb-1">
            Description <span className="text-red-500">*</span>
          </h2>
          <p className="text-xs text-gray-400 mb-4">Minimum 10 characters. Be specific so the department can act quickly.</p>
          <textarea
            className={`w-full border rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:border-transparent bg-white transition-all placeholder-gray-400 ${
              errors.description
                ? 'border-red-300 focus:ring-red-300'
                : 'border-gray-200 focus:ring-brand-green'
            }`}
            rows={5}
            placeholder="Describe the issue in detail. Include any relevant information that helps the department understand the problem…"
            value={form.description}
            onChange={e => set('description', e.target.value)}
            maxLength={500}
          />
          <div className="flex items-center justify-between mt-2">
            {errors.description
              ? <p className="text-red-500 text-xs flex items-center gap-1">⚠️ {errors.description}</p>
              : <span />
            }
            <p className={`text-xs ml-auto ${form.description.length > 480 ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
              {form.description.length}/500
            </p>
          </div>
        </div>

        {/* ── Location ── */}
        <div
          ref={locationRef}
          className={`bg-white rounded-2xl border p-6 shadow-sm transition-all ${
            errors.location ? 'border-red-300 ring-2 ring-red-100' : 'border-green-100'
          }`}
        >
          <h2 className="font-semibold text-gray-800 mb-1">
            Location on Map <span className="text-red-500">*</span>
          </h2>
          <p className="text-xs text-gray-400 mb-4">
            Your location will be auto-detected. Click on the map to adjust the pin.
          </p>
          <MapSelector value={form.location} onChange={loc => set('location', loc)} />
          {form.location?.lat ? (
            <p className="text-xs text-brand-green mt-3 font-medium flex items-center gap-1">
              ✓ Location pinned: {form.location.lat.toFixed(5)}, {form.location.lng.toFixed(5)}
            </p>
          ) : (
            <p className="text-xs text-gray-400 mt-3">No pin yet — click anywhere on the map above.</p>
          )}
          {errors.location && (
            <p className="text-red-500 text-xs mt-2 flex items-center gap-1">⚠️ {errors.location}</p>
          )}
        </div>

        {/* ── Image URL (optional) ── */}
        <div
          ref={imageUrlRef}
          className={`bg-white rounded-2xl border p-6 shadow-sm transition-all ${
            errors.imageUrl ? 'border-red-300 ring-2 ring-red-100' : 'border-green-100'
          }`}
        >
          <h2 className="font-semibold text-gray-800 mb-1">
            Photo Link{' '}
            <span className="text-gray-400 font-normal text-sm">(optional)</span>
          </h2>
          <p className="text-xs text-gray-400 mb-3">
            Upload to{' '}
            <a href="https://imgur.com" target="_blank" rel="noopener noreferrer" className="underline text-brand-green">
              Imgur
            </a>{' '}
            or Google Photos and paste the link here.
          </p>
          <input
            type="url"
            className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:border-transparent bg-white transition-all placeholder-gray-400 ${
              errors.imageUrl
                ? 'border-red-300 focus:ring-red-300'
                : 'border-gray-200 focus:ring-brand-green'
            }`}
            placeholder="https://i.imgur.com/yourphoto.jpg"
            value={form.imageUrl}
            onChange={e => set('imageUrl', e.target.value)}
          />
          {errors.imageUrl && (
            <p className="text-red-500 text-xs mt-2 flex items-center gap-1">⚠️ {errors.imageUrl}</p>
          )}
        </div>

        {/* ── Submit error ── */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-center justify-between gap-3">
            <span>⚠️ {errors.submit}</span>
            <button
              type="button"
              onClick={() => setErrors(p => { const e = { ...p }; delete e.submit; return e })}
              className="text-red-400 hover:text-red-600 font-bold flex-shrink-0"
            >
              ✕
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="btn-primary w-full py-4 text-base font-semibold disabled:opacity-60"
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              Submitting Complaint…
            </span>
          ) : (
            'Submit Complaint →'
          )}
        </button>

        <p className="text-center text-xs text-gray-400 pb-4">
          Fields marked <span className="text-red-500">*</span> are required
        </p>
      </form>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center text-gray-400">
      <div className="text-5xl mb-4 animate-pulse">🌿</div>
      <p>Loading…</p>
    </div>
  )
}

function SuccessScreen() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center animate-fade-in">
      <div className="text-6xl mb-4">✅</div>
      <h2 className="font-display text-3xl font-bold text-brand-dark mb-3">Complaint Submitted!</h2>
      <p className="text-gray-500">Your issue has been reported and routed to the relevant department.</p>
      <p className="text-gray-400 text-sm mt-2">Redirecting to your dashboard…</p>
    </div>
  )
}
