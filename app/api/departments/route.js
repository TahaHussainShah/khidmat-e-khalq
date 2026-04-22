// app/api/departments/route.js

import { NextResponse } from 'next/server'
import { getDepartments, createDepartment } from '@/lib/firestore'

// GET /api/departments
export async function GET() {
  try {
    const departments = await getDepartments()
    return NextResponse.json({ success: true, data: departments })
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

// POST /api/departments
export async function POST(request) {
  try {
    const body = await request.json()
    const id   = await createDepartment(body)
    return NextResponse.json({ success: true, id }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
