// app/api/users/route.js

import { NextResponse } from 'next/server'
import { getAllUsers } from '@/lib/firestore'

// GET /api/users — main admin only (enforce in middleware or client check)
export async function GET() {
  try {
    const users = await getAllUsers()
    return NextResponse.json({ success: true, data: users })
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
