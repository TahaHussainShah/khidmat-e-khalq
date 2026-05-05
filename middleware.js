// middleware.js — Next.js edge middleware for route protection
// This middleware reads auth cookies synced from Firebase client state.

import { NextResponse } from 'next/server'

const PROTECTED_ROUTES = ['/dashboard', '/report-issue', '/admin']
const AUTH_ROUTES = ['/login', '/register']
const VERIFICATION_ROUTE = '/verify-email'

function isRouteMatch(pathname, routes) {
  return routes.some(route => pathname === route || pathname.startsWith(`${route}/`))
}

export function middleware(request) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('auth-token')?.value
  const verified = request.cookies.get('auth-verified')?.value === '1'

  const isProtectedRoute = isRouteMatch(pathname, PROTECTED_ROUTES)
  const isAuthRoute = isRouteMatch(pathname, AUTH_ROUTES)
  const isVerificationRoute = isRouteMatch(pathname, [VERIFICATION_ROUTE])

  if (!token && (isProtectedRoute || isVerificationRoute)) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (token && !verified) {
    if (isVerificationRoute) return NextResponse.next()

    if (isProtectedRoute || isAuthRoute) {
      const verifyUrl = new URL('/verify-email', request.url)
      verifyUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(verifyUrl)
    }
  }

  if (token && verified && (isAuthRoute || isVerificationRoute)) {
    const from = request.nextUrl.searchParams.get('from')
    return NextResponse.redirect(new URL(from || '/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/report-issue/:path*', '/admin/:path*', '/login', '/register', '/verify-email'],
}
