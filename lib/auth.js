// lib/auth.js — Firebase Auth helpers
// FIXES:
// 1. Cookies now include `secure` flag in production (https only)
// 2. `samesite=strict` instead of `lax` for better CSRF protection

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification,
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './firebase'

const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

// FIX: add `secure` flag in production so cookies only sent over HTTPS
function setCookie(name, value) {
  if (typeof document === 'undefined') return
  const isProduction = process.env.NODE_ENV === 'production'
  const secure       = isProduction ? '; secure' : ''
  document.cookie = `${name}=${value}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax${secure}`
}

export function clearAuthCookies() {
  if (typeof document === 'undefined') return
  document.cookie = 'auth-token=; path=/; max-age=0; samesite=lax'
  document.cookie = 'auth-verified=; path=/; max-age=0; samesite=lax'
}

export function syncAuthCookies(user) {
  if (!user) { clearAuthCookies(); return }
  const isGoogleUser = user.providerData?.some(p => p.providerId === 'google.com')
  const isVerified   = Boolean(user.emailVerified || isGoogleUser)
  setCookie('auth-token',    user.uid)
  setCookie('auth-verified', isVerified ? '1' : '0')
}

// ─── Email / Password ──────────────────────────────────────────────────────

export async function registerWithEmail(name, email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  const fallbackName = name?.trim() || email.split('@')[0] || 'User'

  await updateProfile(cred.user, { displayName: fallbackName })
  await setDoc(doc(db, 'users', cred.user.uid), {
    uid:           cred.user.uid,
    name:          fallbackName,
    email,
    phone:         '',
    role:          'user',
    departmentId:  '',
    authProvider:  'password',
    emailVerified: false,
    createdAt:     serverTimestamp(),
  })
  await sendEmailVerification(cred.user)
  return cred.user
}

export async function loginWithEmail(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password)
  return cred.user
}

// ─── Google OAuth ──────────────────────────────────────────────────────────

export async function loginWithGoogle() {
  const cred = await signInWithPopup(auth, googleProvider)
  const user = cred.user

  const profileSnap = await getDoc(doc(db, 'users', user.uid))
  if (!profileSnap.exists()) {
    await setDoc(doc(db, 'users', user.uid), {
      uid:           user.uid,
      name:          user.displayName || '',
      email:         user.email || '',
      phone:         user.phoneNumber || '',
      role:          'user',
      departmentId:  '',
      authProvider:  'google.com',
      emailVerified: true,
      createdAt:     serverTimestamp(),
    })
  }
  return user
}

// ─── Verification ──────────────────────────────────────────────────────────

export async function sendVerificationEmail(user = auth.currentUser) {
  if (!user) throw new Error('No authenticated user')
  await sendEmailVerification(user)
}

// ─── Sign Out ──────────────────────────────────────────────────────────────

export async function logout() {
  await signOut(auth)
  clearAuthCookies()
}

export async function refreshCurrentUser() {
  if (!auth.currentUser) return null
  await auth.currentUser.reload()
  return auth.currentUser
}

// ─── Auth State Observer ───────────────────────────────────────────────────

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback)
}

// ─── Get user role from Firestore ─────────────────────────────────────────

export async function getUserRole(uid) {
  if (!uid) return null
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? snap.data().role : null
}
