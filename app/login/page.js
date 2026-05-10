'use client'
// app/login/page.js
// FIXES:
// 1. After login → redirect to HOME (/) not dashboard, unless ?from= is set
// 2. After register → stay on login tab with success message
// 3. If already logged in → redirect to home immediately
// 4. Empty field validation with scroll-to-field before Firebase call
// 5. Password show/hide toggle

import { Suspense, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import {
  loginWithEmail,
  loginWithGoogle,
  registerWithEmail,
  logout,
  syncAuthCookies,
  refreshCurrentUser,
} from '@/lib/auth'

const INITIAL_FORM = { email: '', password: '', confirmPassword: '' }

const QUOTES = {
  login: {
    title:  'A Better City Begins With One Voice',
    body:   'Every reported issue is a step toward safer roads, cleaner streets, and stronger communities.',
    accent: 'Report with purpose. Track with transparency.',
    icon:   '🌿',
  },
  register: {
    title:  'Join Hands For Civic Change',
    body:   'Create your account to raise issues responsibly and help departments respond faster.',
    accent: 'Your account connects citizens with action.',
    icon:   '🏙️',
  },
}

const transition = { duration: 0.42, ease: [0.22, 1, 0.36, 1] }

export default function AuthPage() {
  return (
    <Suspense fallback={<AuthPageFallback />}>
      <AuthPageContent />
    </Suspense>
  )
}

function AuthPageFallback() {
  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center px-4 py-12">
      <div className="card shadow-lg max-w-md w-full text-center py-14">
        <p className="text-gray-500">Loading…</p>
      </div>
    </div>
  )
}

function AuthPageContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()

  const [mode,    setMode]    = useState('login')
  const [form,    setForm]    = useState(INITIAL_FORM)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')
  const [showPw,  setShowPw]  = useState(false)
  const [showCPw, setShowCPw] = useState(false)

  const loginEmailRef    = useRef(null)
  const loginPasswordRef = useRef(null)
  const regEmailRef      = useRef(null)
  const regPasswordRef   = useRef(null)
  const regConfirmRef    = useRef(null)

  // FIX: if already logged in, redirect to home (not dashboard)
  useEffect(() => {
    if (!authLoading && user) {
      const from = searchParams.get('from')
      router.replace(from || '/')
    }
  }, [user, authLoading, router, searchParams])

  // FIX: default redirect after login is HOME, unless ?from= specifies otherwise
  const from = searchParams.get('from') || '/'

  const isLogin    = mode === 'login'
  const activeQuote = QUOTES[mode]

  useEffect(() => {
    const input = mode === 'login' ? loginEmailRef.current : regEmailRef.current
    input?.focus()
  }, [mode])

  const switchTo = (nextMode) => {
    setError('')
    setSuccess('')
    setForm(INITIAL_FORM)
    setMode(nextMode)
  }

  // ── Field-level validation before hitting Firebase ──────────
  const validateLoginForm = () => {
    if (!form.email.trim()) {
      setError('Please enter your email address.')
      loginEmailRef.current?.focus()
      loginEmailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return false
    }
    if (!form.password) {
      setError('Please enter your password.')
      loginPasswordRef.current?.focus()
      loginPasswordRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return false
    }
    return true
  }

  const validateRegisterForm = () => {
    if (!form.email.trim()) {
      setError('Please enter your email address.')
      regEmailRef.current?.focus()
      regEmailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return false
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.')
      regPasswordRef.current?.focus()
      regPasswordRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return false
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      regConfirmRef.current?.focus()
      regConfirmRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return false
    }
    return true
  }

  // ── Handlers ────────────────────────────────────────────────
  const handleEmailLogin = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!validateLoginForm()) return
    setLoading(true)
    try {
      const user        = await loginWithEmail(form.email, form.password)
      const refreshed   = await refreshCurrentUser()
      const activeUser  = refreshed || user
      const isGoogleUser = activeUser.providerData?.some(p => p.providerId === 'google.com')
      const isVerified   = Boolean(activeUser.emailVerified || isGoogleUser)
      syncAuthCookies(activeUser)
      if (!isVerified) {
        router.push(`/verify-email?from=${encodeURIComponent(from)}&email=${encodeURIComponent(activeUser.email || form.email)}`)
        return
      }
      // FIX: redirect to `from` (default '/') — i.e. home unless coming from a protected page
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
    if (!validateRegisterForm()) return
    setLoading(true)
    try {
      await registerWithEmail('', form.email, form.password)
      await logout()
      setMode('login')
      setForm({ email: form.email, password: '', confirmPassword: '' })
      setSuccess('✅ Account created! A verification email has been sent. Please verify before logging in.')
    } catch (err) {
      setError(friendlyError(err.code))
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) return <AuthPageFallback />

  return (
    <div className="min-h-screen bg-brand-cream px-4 py-6 md:py-8">
      <div className="mx-auto h-auto w-full max-w-6xl overflow-y-auto rounded-3xl border border-brand-mid/20 bg-white shadow-2xl md:h-[calc(100vh-4rem)] md:overflow-hidden">
        <div className="grid h-full grid-cols-1 md:grid-cols-2">

          {/* ── Left panel (quote) ── */}
          <motion.section
            layout
            transition={transition}
            className={`${isLogin ? 'md:order-1' : 'md:order-2'} relative flex min-h-[28vh] items-center justify-center overflow-hidden bg-gradient-to-br from-brand-dark via-brand-mid to-brand-green px-6 py-10 sm:px-8 md:min-h-0 md:px-12`}
          >
            <div className="pointer-events-none absolute -left-20 -top-16 h-56 w-56 rounded-full bg-brand-lime/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -right-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, x: isLogin ? -28 : 28 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
                transition={{ duration: 0.34, ease: 'easeOut' }}
                className="relative z-10 max-w-lg text-center text-white"
              >
                <p className="text-5xl md:text-6xl">{activeQuote.icon}</p>
                <h2 className="mt-5 font-display text-3xl font-semibold leading-tight md:text-4xl">
                  {activeQuote.title}
                </h2>
                <p className="mt-4 text-sm text-white/90 md:text-base">{activeQuote.body}</p>
                <p className="mt-6 text-xs uppercase tracking-[0.18em] text-brand-lime md:text-sm">
                  {activeQuote.accent}
                </p>
              </motion.div>
            </AnimatePresence>
          </motion.section>

          {/* ── Right panel (form) ── */}
          <motion.section
            layout
            transition={transition}
            className={`${isLogin ? 'md:order-2' : 'md:order-1'} flex items-center justify-center px-6 py-8 pb-10 sm:px-10 md:px-12`}
          >
            <motion.div
              key={`form-${mode}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.26, ease: 'easeOut' }}
              className="w-full max-w-md"
            >
              <div className="mb-7 text-center md:text-left">
                <h1 className="font-display text-3xl font-bold text-brand-dark">
                  {isLogin ? 'Login' : 'Register'}
                </h1>
                <p className="mt-2 text-sm text-gray-500">
                  {isLogin
                    ? 'Welcome back. Continue your civic impact.'
                    : 'Create your free account. Verify your email to continue.'}
                </p>
              </div>

              {/* Alerts */}
              {error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
                  <span>⚠️</span><span>{error}</span>
                </div>
              )}
              {success && (
                <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  {success}
                </div>
              )}

              {/* ── Login form ── */}
              {isLogin ? (
                <>
                  <button
                    onClick={handleGoogle}
                    disabled={loading}
                    className="mb-5 flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
                  >
                    <GoogleIcon />
                    Continue with Google
                  </button>

                  <div className="mb-5 flex items-center gap-3">
                    <div className="h-px flex-1 bg-gray-100" />
                    <span className="text-xs text-gray-400">or login with email</span>
                    <div className="h-px flex-1 bg-gray-100" />
                  </div>

                  <form onSubmit={handleEmailLogin} noValidate className="space-y-4">
                    <div>
                      <label className="label">Email</label>
                      <input
                        ref={loginEmailRef}
                        type="email"
                        className="input-field"
                        placeholder="you@example.com"
                        value={form.email}
                        onChange={e => { setForm(p => ({ ...p, email: e.target.value })); setError('') }}
                        autoComplete="email"
                      />
                    </div>
                    <div>
                      <label className="label">Password</label>
                      <div className="relative">
                        <input
                          ref={loginPasswordRef}
                          type={showPw ? 'text' : 'password'}
                          className="input-field pr-10"
                          placeholder="••••••••"
                          value={form.password}
                          onChange={e => { setForm(p => ({ ...p, password: e.target.value })); setError('') }}
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPw(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                        >
                          {showPw ? 'Hide' : 'Show'}
                        </button>
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary mt-2 w-full disabled:opacity-60"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <Spinner /> Signing in…
                        </span>
                      ) : 'Sign In'}
                    </button>
                  </form>
                </>
              ) : (
                /* ── Register form ── */
                <form onSubmit={handleRegister} noValidate className="space-y-4">
                  <div>
                    <label className="label">Email</label>
                    <input
                      ref={regEmailRef}
                      type="email"
                      className="input-field"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={e => { setForm(p => ({ ...p, email: e.target.value })); setError('') }}
                      autoComplete="email"
                    />
                  </div>
                  <div>
                    <label className="label">Password</label>
                    <div className="relative">
                      <input
                        ref={regPasswordRef}
                        type={showPw ? 'text' : 'password'}
                        className="input-field pr-10"
                        placeholder="Min. 6 characters"
                        value={form.password}
                        onChange={e => { setForm(p => ({ ...p, password: e.target.value })); setError('') }}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                      >
                        {showPw ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="label">Confirm Password</label>
                    <div className="relative">
                      <input
                        ref={regConfirmRef}
                        type={showCPw ? 'text' : 'password'}
                        className="input-field pr-10"
                        placeholder="Re-enter password"
                        value={form.confirmPassword}
                        onChange={e => { setForm(p => ({ ...p, confirmPassword: e.target.value })); setError('') }}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCPw(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                      >
                        {showCPw ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary mt-2 w-full disabled:opacity-60"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Spinner /> Creating account…
                      </span>
                    ) : 'Create Account'}
                  </button>
                </form>
              )}

              <div className="mt-6 text-center text-sm text-gray-500 md:text-left">
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <button
                  type="button"
                  onClick={() => switchTo(isLogin ? 'register' : 'login')}
                  className="font-semibold text-brand-green transition-colors hover:text-brand-dark"
                >
                  {isLogin ? 'Register' : 'Login'}
                </button>
              </div>
            </motion.div>
          </motion.section>
        </div>
      </div>
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────

function Spinner() {
  return (
    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
  )
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

function friendlyError(code) {
  const map = {
    'auth/user-not-found':           'No account found with this email.',
    'auth/wrong-password':           'Incorrect password. Please try again.',
    'auth/invalid-email':            'Please enter a valid email address.',
    'auth/too-many-requests':        'Too many attempts. Please wait a moment.',
    'auth/popup-closed-by-user':     'Google sign-in was cancelled.',
    'auth/email-already-in-use':     'An account with this email already exists.',
    'auth/weak-password':            'Password must be at least 6 characters.',
    'auth/invalid-credential':       'Invalid email or password.',
    'auth/invalid-login-credentials':'Invalid email or password.',
    'auth/network-request-failed':   'Network error. Please check your connection.',
  }
  return map[code] || 'Something went wrong. Please try again.'
}
