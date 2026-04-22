// lib/utils.js — shared utility helpers

import { clsx } from 'clsx'

/** Merge Tailwind class names safely */
export function cn(...inputs) {
  return clsx(inputs)
}

/** Format a Firestore Timestamp or JS Date to a readable string */
export function formatDate(timestamp) {
  if (!timestamp) return 'N/A'
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleDateString('en-PK', {
    year:  'numeric',
    month: 'short',
    day:   'numeric',
    hour:  '2-digit',
    minute:'2-digit',
  })
}

/** Complaint categories with labels and emoji icons */
export const CATEGORIES = [
  { value: 'Garbage',           label: 'Garbage',           icon: '🗑️', color: '#6b7280' },
  { value: 'Sewage',            label: 'Sewage',            icon: '💧', color: '#3b82f6' },
  { value: 'Broken Road',       label: 'Broken Road',       icon: '🚧', color: '#f97316' },
  { value: 'Streetlight Issue', label: 'Streetlight Issue', icon: '💡', color: '#eab308' },
  { value: 'Open Manhole',      label: 'Open Manhole',      icon: '⚠️', color: '#ef4444' },
  { value: 'Water Leakage',     label: 'Water Leakage',     icon: '🚿', color: '#06b6d4' },
  { value: 'Other',             label: 'Other',             icon: '📋', color: '#8b5cf6' },
]

/** Severity levels with colors */
export const SEVERITIES = [
  { value: 'Low',      label: 'Low',      color: '#22c55e', bg: 'bg-green-100',  text: 'text-green-800'  },
  { value: 'Medium',   label: 'Medium',   color: '#f59e0b', bg: 'bg-yellow-100', text: 'text-yellow-800' },
  { value: 'High',     label: 'High',     color: '#f97316', bg: 'bg-orange-100', text: 'text-orange-800' },
  { value: 'Critical', label: 'Critical', color: '#ef4444', bg: 'bg-red-100',    text: 'text-red-800'    },
]

/** Status definitions */
export const STATUSES = [
  { value: 'Pending',     label: 'Pending',     color: '#ef4444', bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500'    },
  { value: 'In Progress', label: 'In Progress', color: '#f59e0b', bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  { value: 'Resolved',    label: 'Resolved',    color: '#22c55e', bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500'  },
]

/** Default departments seeded in Firestore */
export const DEFAULT_DEPARTMENTS = [
  { id: 'road',       name: 'Road Department',       categories: ['Broken Road', 'Open Manhole'] },
  { id: 'sanitation', name: 'Sanitation Department', categories: ['Garbage', 'Sewage']           },
  { id: 'water',      name: 'Water Department',      categories: ['Water Leakage']               },
  { id: 'electric',   name: 'Electric Department',   categories: ['Streetlight Issue']           },
  { id: 'municipal',  name: 'Municipal Authority',   categories: ['Other']                       },
]

/** Get category object by value */
export function getCategoryMeta(value) {
  return CATEGORIES.find(c => c.value === value) || CATEGORIES[CATEGORIES.length - 1]
}

/** Get severity object by value */
export function getSeverityMeta(value) {
  return SEVERITIES.find(s => s.value === value) || SEVERITIES[0]
}

/** Get status object by value */
export function getStatusMeta(value) {
  return STATUSES.find(s => s.value === value) || STATUSES[0]
}

/** Validate URL format */
export function isValidUrl(str) {
  try { return Boolean(new URL(str)) } catch { return false }
}

/** Truncate string with ellipsis */
export function truncate(str, maxLen = 80) {
  if (!str) return ''
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str
}
