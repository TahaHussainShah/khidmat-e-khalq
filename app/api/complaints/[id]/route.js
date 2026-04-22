// app/api/complaints/[id]/route.js

import { NextResponse } from 'next/server'
import { getComplaintById, updateComplaint, deleteComplaint } from '@/lib/firestore'

// GET /api/complaints/:id
export async function GET(_, { params }) {
  try {
    const complaint = await getComplaintById(params.id)
    if (!complaint) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: complaint })
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

// PATCH /api/complaints/:id — body: { status?, resolutionNotes? }
export async function PATCH(request, { params }) {
  try {
    const updates = await request.json()
    await updateComplaint(params.id, updates)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

// DELETE /api/complaints/:id
export async function DELETE(_, { params }) {
  try {
    await deleteComplaint(params.id)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
