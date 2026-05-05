'use client'
// app/login/page.js

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  loginWithEmail,
  loginWithGoogle,
  registerWithEmail,
  logout,
  syncAuthCookies,
  refreshCurrentUser,
} from '@/lib/auth'

const INITIAL_FORM = {
  email: '',
  password: '',
  confirmPassword: '',
}

export default function AuthPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState(INITIAL_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const loginEmailRef = useRef(null)
  const registerEmailRef = useRef(null)

  const from = searchParams.get('from') || '/dashboard'

  useEffect(() => {
    const input = mode === 'login' ? loginEmailRef.current : registerEmailRef.current
    input?.focus()
  }, [mode])

  const switchTo = (nextMode) => {
    setError('')
    setSuccess('')
    setMode(nextMode)
  }

  const handleEmailLogin = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const user = await loginWithEmail(form.email, form.password)
      const refreshedUser = await refreshCurrentUser()
      const activeUser = refreshedUser || user
      const isGoogleUser = activeUser.providerData?.some(provider => provider.providerId === 'google.com')
      const isVerified = Boolean(activeUser.emailVerified || isGoogleUser)

      syncAuthCookies(activeUser)

      if (!isVerified) {
        router.push(`/verify-email?from=${encodeURIComponent(from)}&email=${encodeURIComponent(activeUser.email || form.email)}`)
        return
      }

      router.push(from)
    } catch (err) {
      setError(friendlyError(err.code))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const user = await loginWithGoogle()
      syncAuthCookies(user)
      router.push(from)
    } catch (err) {
      setError(friendlyError(err.code))
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await registerWithEmail('', form.email, form.password)
      await logout()
      setMode('login')
      setForm({ email: form.email, password: '', confirmPassword: '' })
      setSuccess('Verification email sent. Please check your inbox before logging in.')
    } catch (err) {
      setError(friendlyError(err.code))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-slide-up">
        <div className="card shadow-lg overflow-hidden">
          <div className="text-center mb-6">
            <span className="text-5xl">🌿</span>
            <h1 className="font-display text-3xl font-bold text-brand-dark mt-3">
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {mode === 'login'
                ? 'Sign in to continue'
                : 'Create your account and verify your email'}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-5">
              {success}
            </div>
          )}

          <div className="overflow-hidden">
            <div
              className="flex w-[200%] transition-transform duration-300 ease-in-out"
              style={{ transform: mode === 'login' ? 'translateX(0%)' : 'translateX(-50%)' }}
            >
              <section className="w-1/2 shrink-0 pr-4">
                <button
                  onClick={handleGoogle}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors mb-5 disabled:opacity-60"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>

                <div className="flex items-center gap-3 mb-5">
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-xs text-gray-400">or sign in with email</span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>

                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div>
                    <label className="label">Email Address</label>
                    <input
                      ref={loginEmailRef}
                      type="email"
                      className="input-field"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                      autoComplete="email"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Password</label>
                    <input
                      type="password"
                      className="input-field"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
                      autoComplete="current-password"
                      required
                    />
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary w-full mt-2 disabled:opacity-60">
                    {loading ? 'Signing in…' : 'Sign In'}
                  </button>
                </form>
              </section>

              <section className="w-1/2 shrink-0 pl-4">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="label">Email Address</label>
                    <input
                      ref={registerEmailRef}
                      type="email"
                      className="input-field"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                      autoComplete="email"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Password</label>
                    <input
                      type="password"
                      className="input-field"
                      placeholder="Min. 6 characters"
                      value={form.password}
                      onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
                      autoComplete="new-password"
                      minLength={6}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Confirm Password</label>
                    <input
                      type="password"
                      className="input-field"
                      placeholder="Re-enter password"
                      value={form.confirmPassword}
                      onChange={e => setForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      autoComplete="new-password"
                      minLength={6}
                      required
                    />
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary w-full mt-2 disabled:opacity-60">
                    {loading ? 'Creating account…' : 'Register'}
                  </button>
                </form>
              </section>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 mt-6 text-sm text-gray-500">
            <button
              type="button"
              onClick={() => switchTo('login')}
              className={`font-medium transition-colors ${mode === 'login' ? 'text-brand-green' : 'hover:text-gray-700'}`}
            >
              Already have an account? Login
            </button>
            <button
              type="button"
              onClick={() => switchTo('register')}
              className={`font-medium transition-colors ${mode === 'register' ? 'text-brand-green' : 'hover:text-gray-700'}`}
            >
              Don't have an account? Register
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function friendlyError(code) {
  const map = {
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/too-many-requests': 'Too many attempts. Please wait a moment.',
    'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/invalid-login-credentials': 'Invalid email or password.',
  }
  return map[code] || 'Something went wrong. Please try again.'
}
