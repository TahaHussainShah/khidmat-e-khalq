'use client'
// components/Navbar/Navbar.js

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { logout } from '@/lib/auth'

export default function Navbar() {
  const { user, profile, loading } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const role = profile?.role
  const displayName = user?.displayName || profile?.name || user?.email || 'Account'
  const avatarLabel = useMemo(() => {
    const source = displayName.trim()
    return source ? source[0].toUpperCase() : 'U'
  }, [displayName])

  const handleLogout = async () => {
    setUserMenuOpen(false)
    setMenuOpen(false)
    await logout()
    router.push('/')
  }

  return (
    <nav className="sticky top-0 z-50 bg-brand-dark border-b border-brand-mid shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2" onClick={() => setMenuOpen(false)}>
            <span className="text-2xl">🌿</span>
            <span className="font-display text-xl font-bold text-brand-lime">Khidmat e Khalq</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <NavLink href="/" current={pathname}>Home</NavLink>
            <NavLink href="/map" current={pathname}>Map</NavLink>

            {user && (
              <>
                <NavLink href="/report-issue" current={pathname}>Report Issue</NavLink>
                <NavLink href="/dashboard" current={pathname}>My Complaints</NavLink>
              </>
            )}

            {(role === 'department_admin' || role === 'main_admin') && (
              <NavLink href="/admin" current={pathname}>Admin</NavLink>
            )}

            {!loading && !user && (
              <Link href="/login" className="btn-primary text-sm">Login</Link>
            )}

            {user && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(open => !open)}
                  className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-left transition-colors hover:bg-white/10"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-lime text-brand-dark text-sm font-bold">
                    {avatarLabel}
                  </span>
                  <span className="max-w-[140px] truncate text-sm text-gray-100">{displayName}</span>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-3 w-52 overflow-hidden rounded-2xl border border-white/10 bg-brand-mid shadow-xl">
                    <Link
                      href="/dashboard"
                      onClick={() => setUserMenuOpen(false)}
                      className="block px-4 py-3 text-sm text-gray-100 hover:bg-white/5"
                    >
                      Dashboard
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="block w-full px-4 py-3 text-left text-sm text-red-300 hover:bg-white/5"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            className="md:hidden text-gray-300 hover:text-brand-lime"
            onClick={() => setMenuOpen(v => !v)}
            aria-label="Toggle navigation menu"
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-brand-mid border-t border-brand-dark px-4 py-4 space-y-3 animate-fade-in">
          <MobileLink href="/" label="Home" close={() => setMenuOpen(false)} />
          <MobileLink href="/map" label="Map" close={() => setMenuOpen(false)} />
          {user && (
            <>
              <MobileLink href="/report-issue" label="Report Issue" close={() => setMenuOpen(false)} />
              <MobileLink href="/dashboard" label="My Complaints" close={() => setMenuOpen(false)} />
            </>
          )}
          {(role === 'department_admin' || role === 'main_admin') && (
            <MobileLink href="/admin" label="Admin" close={() => setMenuOpen(false)} />
          )}
          {!user && <MobileLink href="/login" label="Login" close={() => setMenuOpen(false)} />}
          {user && (
            <div className="border-t border-white/10 pt-3">
              <div className="flex items-center gap-3 px-1 pb-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-lime text-brand-dark text-sm font-bold">
                  {avatarLabel}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-100">{displayName}</p>
                  <p className="truncate text-xs text-gray-400">{user.email}</p>
                </div>
              </div>
              <MobileLink href="/dashboard" label="Dashboard" close={() => setMenuOpen(false)} />
              <button onClick={handleLogout} className="w-full text-left text-red-400 text-sm py-2">
                Logout
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}

function NavLink({ href, current, children }) {
  const active = current === href
  return (
    <Link
      href={href}
      className={`text-sm transition-colors ${
        active ? 'text-brand-lime font-semibold' : 'text-gray-300 hover:text-brand-lime'
      }`}
    >
      {children}
    </Link>
  )
}

function MobileLink({ href, label, close }) {
  return (
    <Link href={href} onClick={close} className="block text-gray-200 hover:text-brand-lime text-sm py-1.5">
      {label}
    </Link>
  )
}
