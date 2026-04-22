'use client'
// context/AuthContext.js

import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { getUserProfile } from '@/lib/firestore'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [profile, setProfile] = useState(null)  // Firestore profile (includes role)
  const [loading, setLoading] = useState(true)

  const clearAuthCookie = () => {
    document.cookie = 'auth-token=; path=/; max-age=0'
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      try {
        if (firebaseUser) {
          const p = await getUserProfile(firebaseUser.uid)
          setProfile(p)
        } else {
          clearAuthCookie()
          setProfile(null)
        }
      } catch (err) {
        console.error('Auth profile load failed:', err)
        clearAuthCookie()
        setProfile(null)
      } finally {
        setLoading(false)
      }
    })
    return () => unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
