// app/api/complaints/route.js
// Server-side API endpoints for complaints (can be called from external clients or testing)

import { NextResponse } from 'next/server'
import { getComplaints, createComplaint } from '@/lib/firestore'
import { validateComplaint, buildComplaintPayload } from '@/models/complaint'
import { resolveDepartment } from '@/lib/firestore'

// GET /api/complaints?departmentId=sanitation
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const departmentId     = searchParams.get('departmentId') || null
    const complaints       = await getComplaints(departmentId)
    return NextResponse.json({ success: true, data: complaints })
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

// POST /api/complaints — body: { complaint fields, userId, userName }
export async function POST(request) {
  try {
    const body = await request.json()
    const { valid, errors } = validateComplaint(body)
    if (!valid) {
      return NextResponse.json({ success: false, errors }, { status: 400 })
    }
    const departmentId = resolveDepartment(body.category)
    const id = await createComplaint({ ...body, departmentId })
    return NextResponse.json({ success: true, id }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
