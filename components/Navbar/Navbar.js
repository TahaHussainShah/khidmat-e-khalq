'use client'
// components/Navbar/Navbar.js

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { logout } from '@/lib/auth'

export default function Navbar() {
  const { user, profile, loading } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const router   = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  const role = profile?.role

  return (
    <nav className="sticky top-0 z-50 bg-brand-dark border-b border-brand-mid shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🌿</span>
            <span className="font-display text-xl font-bold text-brand-lime">
              Khidmat e Khalq
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <NavLink href="/"           current={pathname}>Home</NavLink>
            <NavLink href="/map"        current={pathname}>Map</NavLink>

            {user && (
              <>
                <NavLink href="/report-issue" current={pathname}>Report Issue</NavLink>
                <NavLink href="/dashboard"    current={pathname}>My Complaints</NavLink>
              </>
            )}

            {(role === 'department_admin' || role === 'main_admin') && (
              <NavLink href="/admin" current={pathname}>Admin</NavLink>
            )}

            {!loading && !user && (
              <>
                <Link href="/login"    className="text-gray-300 hover:text-brand-lime text-sm transition-colors">Login</Link>
                <Link href="/register" className="btn-primary text-sm">Register</Link>
              </>
            )}

            {user && (
              <div className="flex items-center gap-3">
                <span className="text-gray-400 text-sm truncate max-w-[120px]">
                  {user.displayName || user.email}
                </span>
                <button onClick={handleLogout} className="btn-secondary text-sm !text-brand-lime !border-brand-lime">
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-gray-300 hover:text-brand-lime"
            onClick={() => setMenuOpen(v => !v)}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-brand-mid border-t border-brand-dark px-4 py-4 space-y-3 animate-fade-in">
          <MobileLink href="/"           label="Home"         close={() => setMenuOpen(false)} />
          <MobileLink href="/map"        label="Map"          close={() => setMenuOpen(false)} />
          {user && <>
            <MobileLink href="/report-issue" label="Report Issue"  close={() => setMenuOpen(false)} />
            <MobileLink href="/dashboard"    label="My Complaints" close={() => setMenuOpen(false)} />
          </>}
          {(role === 'department_admin' || role === 'main_admin') && (
            <MobileLink href="/admin" label="Admin" close={() => setMenuOpen(false)} />
          )}
          {!user && <>
            <MobileLink href="/login"    label="Login"    close={() => setMenuOpen(false)} />
            <MobileLink href="/register" label="Register" close={() => setMenuOpen(false)} />
          </>}
          {user && (
            <button onClick={handleLogout} className="w-full text-left text-red-400 text-sm py-2">
              Logout
            </button>
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
