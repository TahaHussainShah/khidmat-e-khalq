// lib/auth.js — Firebase Auth helpers

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
  PhoneAuthProvider,
  signInWithPhoneNumber,
  RecaptchaVerifier,
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './firebase'

const googleProvider = new GoogleAuthProvider()

// ─── Email / Password ──────────────────────────────────────────────────────

export async function registerWithEmail(name, email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(cred.user, { displayName: name })
  // Create user profile in Firestore
  await setDoc(doc(db, 'users', cred.user.uid), {
    uid:       cred.user.uid,
    name,
    email,
    phone:     '',
    role:      'user',
    createdAt: serverTimestamp(),
  })
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

  // Only create profile if first login
  const profileSnap = await getDoc(doc(db, 'users', user.uid))
  if (!profileSnap.exists()) {
    await setDoc(doc(db, 'users', user.uid), {
      uid:       user.uid,
      name:      user.displayName || '',
      email:     user.email || '',
      phone:     user.phoneNumber || '',
      role:      'user',
      createdAt: serverTimestamp(),
    })
  }
  return user
}

// ─── Phone OTP ─────────────────────────────────────────────────────────────

export function setupRecaptcha(containerId) {
  return new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {},
  })
}

export async function sendOTP(phoneNumber, appVerifier) {
  return await signInWithPhoneNumber(auth, phoneNumber, appVerifier)
}

// ─── Sign Out ──────────────────────────────────────────────────────────────

export async function logout() {
  await signOut(auth)
  // Clear the middleware cookie so login/register routes can render again
  document.cookie = 'auth-token=; path=/; max-age=0'
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
