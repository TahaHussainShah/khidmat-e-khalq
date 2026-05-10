'use client'
// components/Navbar/Navbar.js
// FIXES:
// 1. Login/Register button label changed to just "Login"
// 2. Outside click closes user dropdown
// 3. Both menus close on route change
// 4. Active link highlighting on mobile

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useMemo, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { logout } from '@/lib/auth'

export default function Navbar() {
  const { user, profile, loading } = useAuth()
  const [menuOpen,     setMenuOpen]     = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const pathname    = usePathname()
  const router      = useRouter()
  const userMenuRef = useRef(null)

  const role        = profile?.role
  const displayName = user?.displayName || profile?.name || user?.email || 'Account'
  const avatarLabel = useMemo(() => {
    const s = displayName.trim()
    return s ? s[0].toUpperCase() : 'U'
  }, [displayName])

  useEffect(() => {
    setMenuOpen(false)
    setUserMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!userMenuOpen) return
    function onOutside(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [userMenuOpen])

  const handleLogout = async () => {
    setUserMenuOpen(false)
    setMenuOpen(false)
    await logout()
    router.push('/')
  }

  return (
    <nav className="sticky top-0 z-50 bg-brand-dark border-b border-brand-mid shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <span className="text-2xl">🌿</span>
            <span className="font-display text-lg sm:text-xl font-bold text-brand-lime leading-none">
              Khidmat e Khalq
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-5 lg:gap-6">
            <NavLink href="/"    current={pathname}>Home</NavLink>
            <NavLink href="/map" current={pathname}>Map</NavLink>

            {user && (
              <>
                <NavLink href="/report-issue" current={pathname}>Report Issue</NavLink>
                <NavLink href="/dashboard"    current={pathname}>My Complaints</NavLink>
              </>
            )}

            {(role === 'department_admin' || role === 'main_admin') && (
              <NavLink href="/admin" current={pathname}>Admin</NavLink>
            )}

            {/* FIX: label is just "Login" */}
            {!loading && !user && (
              <Link href="/login" className="btn-primary text-sm py-2 whitespace-nowrap">
                Login
              </Link>
            )}

            {user && (
              <div className="relative flex-shrink-0" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(o => !o)}
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                  className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 transition-colors hover:bg-white/10"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-lime text-brand-dark text-sm font-bold flex-shrink-0">
                    {avatarLabel}
                  </span>
                  <span className="max-w-[120px] truncate text-sm text-gray-100 hidden lg:block">
                    {displayName}
                  </span>
                  <span className="text-gray-400 text-xs">{userMenuOpen ? '▲' : '▼'}</span>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-white/10 bg-brand-mid shadow-2xl z-50">
                    <div className="px-4 py-3 border-b border-white/10">
                      <p className="text-xs text-gray-100 font-medium truncate">{displayName}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      {role && (
                        <p className="text-xs text-brand-lime mt-1 capitalize">
                          {role.replace(/_/g, ' ')}
                        </p>
                      )}
                    </div>
                    <Link href="/dashboard" className="flex items-center gap-2 px-4 py-3 text-sm text-gray-100 hover:bg-white/5 transition-colors">
                      📋 My Complaints
                    </Link>
                    {(role === 'department_admin' || role === 'main_admin') && (
                      <Link href="/admin" className="flex items-center gap-2 px-4 py-3 text-sm text-gray-100 hover:bg-white/5 transition-colors">
                        ⚙️ Admin Panel
                      </Link>
                    )}
                    <div className="border-t border-white/10">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-red-300 hover:bg-white/5 transition-colors"
                      >
                        🚪 Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Hamburger */}
          <button
            className="md:hidden text-gray-300 hover:text-brand-lime p-2 rounded-lg transition-colors flex-shrink-0"
            onClick={() => setMenuOpen(v => !v)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <span className="text-xl leading-none">{menuOpen ? '✕' : '☰'}</span>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-brand-mid border-t border-brand-dark px-4 py-3 space-y-1">
          <MobileLink href="/"    label="🏠 Home" close={() => setMenuOpen(false)} active={pathname === '/'} />
          <MobileLink href="/map" label="🗺️ Map"   close={() => setMenuOpen(false)} active={pathname === '/map'} />
          {user && (
            <>
              <MobileLink href="/report-issue" label="📝 Report Issue"  close={() => setMenuOpen(false)} active={pathname === '/report-issue'} />
              <MobileLink href="/dashboard"    label="📋 My Complaints" close={() => setMenuOpen(false)} active={pathname === '/dashboard'} />
            </>
          )}
          {(role === 'department_admin' || role === 'main_admin') && (
            <MobileLink href="/admin" label="⚙️ Admin Panel" close={() => setMenuOpen(false)} active={pathname.startsWith('/admin')} />
          )}
          {/* FIX: label is just "Login" */}
          {!user && (
            <MobileLink href="/login" label="🔑 Login" close={() => setMenuOpen(false)} active={pathname === '/login'} />
          )}

          {user && (
            <div className="border-t border-white/10 pt-3 mt-2">
              <div className="flex items-center gap-3 px-2 pb-3">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-lime text-brand-dark text-sm font-bold">
                  {avatarLabel}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-100">{displayName}</p>
                  <p className="truncate text-xs text-gray-400">{user.email}</p>
                  {role && <p className="text-xs text-brand-lime capitalize">{role.replace(/_/g, ' ')}</p>}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left text-red-400 text-sm py-2 px-2 hover:text-red-300 transition-colors"
              >
                🚪 Logout
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}

function NavLink({ href, current, children }) {
  const active = current === href || (href !== '/' && current.startsWith(href))
  return (
    <Link href={href} className={`text-sm transition-colors whitespace-nowrap ${active ? 'text-brand-lime font-semibold' : 'text-gray-300 hover:text-brand-lime'}`}>
      {children}
    </Link>
  )
}

function MobileLink({ href, label, close, active }) {
  return (
    <Link href={href} onClick={close} className={`block text-sm py-2.5 px-3 rounded-xl transition-colors ${active ? 'text-brand-lime bg-white/5 font-medium' : 'text-gray-200 hover:text-brand-lime hover:bg-white/5'}`}>
      {label}
    </Link>
  )
}
