// middleware.js — Next.js edge middleware for route protection
// NOTE: Firebase Auth tokens are validated client-side in this setup.
// This middleware handles basic redirect flows; per-page auth checks use useAuth() hook.

import { NextResponse } from 'next/server'

const PROTECTED_ROUTES = ['/dashboard', '/report-issue', '/admin']
const AUTH_ROUTES      = ['/login', '/register']

export function middleware(request) {
  const { pathname } = request.nextUrl

  // Auth token stored in cookie by client after login
  const token = request.cookies.get('auth-token')?.value

  // Redirect logged-in users away from login/register
  if (token && AUTH_ROUTES.some(r => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Redirect unauthenticated users from protected routes
  if (!token && PROTECTED_ROUTES.some(r => pathname.startsWith(r))) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/report-issue/:path*', '/admin/:path*', '/login', '/register'],
}
