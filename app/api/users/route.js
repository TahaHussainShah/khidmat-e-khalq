// app/api/users/route.js
// NOTE: This endpoint is deprecated. The admin panel calls getAllUsers() directly via Firestore with proper auth context.
// If you need user data from the frontend, use the Firestore client directly (see admin/users/page.js for example).

import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(
    { success: false, error: 'This endpoint requires proper Firebase Auth token. Please use Firestore client directly for admin pages.' },
    { status: 401 }
  )
}
