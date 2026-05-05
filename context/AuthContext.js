'use client'
// context/AuthContext.js

import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { getUserProfile } from '@/lib/firestore'
import { clearAuthCookies, syncAuthCookies } from '@/lib/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [profile, setProfile] = useState(null)  // Firestore profile (includes role)
  const [loading, setLoading] = useState(true)
  const isVerified = Boolean(
    user && (user.emailVerified || user.providerData?.some(provider => provider.providerId === 'google.com'))
  )

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      try {
        if (firebaseUser) {
          syncAuthCookies(firebaseUser)
          const p = await getUserProfile(firebaseUser.uid)
          setProfile(p)
        } else {
          clearAuthCookies()
          setProfile(null)
        }
      } catch (err) {
        console.error('Auth profile load failed:', err)
        clearAuthCookies()
        setProfile(null)
      } finally {
        setLoading(false)
      }
    })
    return () => unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, profile, loading, isVerified }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
