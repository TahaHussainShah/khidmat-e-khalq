'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { auth } from '@/lib/firebase'
import { refreshCurrentUser, sendVerificationEmail, syncAuthCookies } from '@/lib/auth'

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailPageFallback />}>
      <VerifyEmailPageContent />
    </Suspense>
  )
}

function VerifyEmailPageFallback() {
  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center px-4">
      <div className="card shadow-lg max-w-md w-full text-center py-14">
        <p className="text-gray-500">Loading verification status…</p>
      </div>
    </div>
  )
}

function VerifyEmailPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading, isVerified } = useAuth()
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const from = searchParams.get('from') || '/dashboard'
  const email = searchParams.get('email') || user?.email || ''

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace(`/login?from=${encodeURIComponent('/verify-email')}`)
      return
    }
    if (isVerified) {
      router.replace(from)
    }
  }, [user, loading, isVerified, from, router])

  const handleResend = async () => {
    setError('')
    setMessage('')
    setSending(true)
    try {
      await sendVerificationEmail(auth.currentUser)
      setMessage('Verification email sent again. Check your inbox.')
    } catch (err) {
      setError(friendlyError(err.code))
    } finally {
      setSending(false)
    }
  }

  const handleRefresh = async () => {
    setError('')
    setMessage('')
    setSending(true)
    try {
      const currentUser = await refreshCurrentUser()
      if (currentUser) {
        syncAuthCookies(currentUser)
        if (currentUser.emailVerified) {
          router.replace(from)
          return
        }
      }
      setMessage('Your account is still pending verification. Please check the email link and try again.')
    } catch (err) {
      setError(friendlyError(err.code))
    } finally {
      setSending(false)
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center px-4">
        <div className="card shadow-lg max-w-md w-full text-center py-14">
          <p className="text-gray-500">Loading verification status…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center px-4 py-12">
      <div className="card shadow-lg max-w-md w-full">
        <div className="text-center mb-6">
          <span className="text-5xl">✉️</span>
          <h1 className="font-display text-3xl font-bold text-brand-dark mt-3">Verify Your Email</h1>
          <p className="text-gray-500 text-sm mt-2">
            {email ? `We sent a verification link to ${email}.` : 'We sent a verification link to your email.'}
          </p>
        </div>

        <p className="text-sm text-gray-600 leading-6 mb-6">
          Please verify your email before logging in. Once you click the link in your inbox, you can continue to your account.
        </p>

        {message && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-4">
            {message}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={sending}
            className="btn-primary w-full disabled:opacity-60"
          >
            {sending ? 'Checking…' : 'I have verified my email'}
          </button>
          <button
            type="button"
            onClick={handleResend}
            disabled={sending}
            className="btn-secondary w-full disabled:opacity-60"
          >
            {sending ? 'Sending…' : 'Resend Verification Email'}
          </button>
        </div>
      </div>
    </div>
  )
}

function friendlyError(code) {
  const map = {
    'auth/too-many-requests': 'Too many attempts. Please wait a moment.',
    'auth/invalid-action-code': 'That verification link is no longer valid.',
    'auth/network-request-failed': 'Network error. Please try again.',
  }

  return map[code] || 'Something went wrong. Please try again.'
}
