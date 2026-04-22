// models/complaint.js
// Complaint shape definition and validation

export const complaintSchema = {
  id:              null,   // string — Firestore auto-ID
  userId:          '',     // string — Firebase Auth UID
  userName:        '',     // string — user's display name
  category:        '',     // string — one of CATEGORIES values
  severity:        '',     // string — Low | Medium | High | Critical
  description:     '',     // string — max 500 chars
  imageUrl:        '',     // string — optional public URL
  location: {
    lat: null,             // number
    lng: null,             // number
    address: '',           // string — optional reverse geocoded
  },
  departmentId:    '',     // string — auto-assigned from category
  status:          'Pending', // Pending | In Progress | Resolved
  resolutionNotes: '',     // string — admin fills this in
  createdAt:       null,   // Firestore serverTimestamp
  updatedAt:       null,   // Firestore serverTimestamp
}

/**
 * validateComplaint — returns { valid, errors }
 */
export function validateComplaint(data) {
  const errors = {}

  if (!data.category)
    errors.category = 'Please select a category'

  if (!data.severity)
    errors.severity = 'Please select a severity level'

  if (!data.description || data.description.trim().length < 10)
    errors.description = 'Description must be at least 10 characters'

  if (data.description && data.description.length > 500)
    errors.description = 'Description cannot exceed 500 characters'

  if (!data.location?.lat || !data.location?.lng)
    errors.location = 'Please select a location on the map'

  if (data.imageUrl && data.imageUrl.trim()) {
    try { new URL(data.imageUrl) }
    catch { errors.imageUrl = 'Please enter a valid URL' }
  }

  return { valid: Object.keys(errors).length === 0, errors }
}

/**
 * buildComplaintPayload — sanitize form data before Firestore write
 */
export function buildComplaintPayload(formData, user, departmentId) {
  return {
    userId:      user.uid,
    userName:    user.displayName || user.email || 'Anonymous',
    category:    formData.category,
    severity:    formData.severity,
    description: formData.description.trim(),
    imageUrl:    formData.imageUrl?.trim() || '',
    location: {
      lat:     formData.location.lat,
      lng:     formData.location.lng,
      address: formData.location.address || '',
    },
    departmentId,
  }
}
