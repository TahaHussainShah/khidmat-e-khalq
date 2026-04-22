// lib/firestore.js
// All Firestore CRUD operations for the entire app

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  limit,
  Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'

// ─── COLLECTION REFERENCES ─────────────────────────────────────────────────
const complaintsRef  = () => collection(db, 'complaints')
const usersRef       = () => collection(db, 'users')
const departmentsRef = () => collection(db, 'departments')

// ══════════════════════════════════════════════════════════════════════════════
//  COMPLAINTS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * createComplaint — adds a new complaint document to Firestore
 * @param {Object} data — complaint fields (category, severity, description, location, …)
 * @returns {string} — the new document ID
 */
export async function createComplaint(data) {
  const docRef = await addDoc(complaintsRef(), {
    ...data,
    status:          'Pending',
    resolutionNotes: '',
    createdAt:       serverTimestamp(),
    updatedAt:       serverTimestamp(),
  })
  return docRef.id
}

/**
 * getComplaints — fetch all complaints, optionally filtered by department
 * @param {string|null} departmentId — filter to one department (omit for all)
 * @returns {Array} array of complaint objects with id field
 */
export async function getComplaints(departmentId = null) {
  let q
  if (departmentId) {
    q = query(complaintsRef(), where('departmentId', '==', departmentId), orderBy('createdAt', 'desc'))
  } else {
    q = query(complaintsRef(), orderBy('createdAt', 'desc'))
  }
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

/**
 * getComplaintById — fetch a single complaint document
 * @param {string} id — Firestore document ID
 * @returns {Object|null}
 */
export async function getComplaintById(id) {
  const snap = await getDoc(doc(db, 'complaints', id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

/**
 * getUserComplaints — all complaints submitted by one user
 * @param {string} userId — Firebase Auth uid
 * @returns {Array}
 */
export async function getUserComplaints(userId) {
  const q = query(
    complaintsRef(),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

/**
 * updateComplaint — partial update of a complaint document
 * @param {string} id
 * @param {Object} updates — fields to update
 */
export async function updateComplaint(id, updates) {
  await updateDoc(doc(db, 'complaints', id), {
    ...updates,
    updatedAt: serverTimestamp(),
  })
}

/**
 * deleteComplaint — permanently remove a complaint
 * @param {string} id
 */
export async function deleteComplaint(id) {
  await deleteDoc(doc(db, 'complaints', id))
}

// ══════════════════════════════════════════════════════════════════════════════
//  USERS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * createUserProfile — called after registration to store role & metadata
 */
export async function createUserProfile(uid, data) {
  await updateDoc(doc(db, 'users', uid), {
    ...data,
    createdAt: serverTimestamp(),
  }).catch(async () => {
    // Document doesn't exist yet — create it
    const { setDoc } = await import('firebase/firestore')
    await setDoc(doc(db, 'users', uid), {
      ...data,
      role:      data.role || 'user',
      createdAt: serverTimestamp(),
    })
  })
}

/**
 * getUserProfile — fetch a user's Firestore profile
 */
export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? { uid: snap.id, ...snap.data() } : null
}

/**
 * getAllUsers — main admin only
 */
export async function getAllUsers() {
  const snap = await getDocs(usersRef())
  return snap.docs.map(d => ({ uid: d.id, ...d.data() }))
}

/**
 * updateUserRole — assign a role to a user
 */
export async function updateUserRole(uid, role, departmentId = null) {
  const updates = { role, updatedAt: serverTimestamp() }
  if (departmentId) updates.departmentId = departmentId
  await updateDoc(doc(db, 'users', uid), updates)
}

// ══════════════════════════════════════════════════════════════════════════════
//  DEPARTMENTS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * getDepartments — fetch all departments
 */
export async function getDepartments() {
  const snap = await getDocs(departmentsRef())
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

/**
 * getDepartmentById
 */
export async function getDepartmentById(id) {
  const snap = await getDoc(doc(db, 'departments', id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

/**
 * createDepartment
 */
export async function createDepartment(data) {
  const docRef = await addDoc(departmentsRef(), {
    ...data,
    createdAt: serverTimestamp(),
  })
  return docRef.id
}

/**
 * updateDepartment
 */
export async function updateDepartment(id, updates) {
  await updateDoc(doc(db, 'departments', id), updates)
}

/**
 * deleteDepartment
 */
export async function deleteDepartment(id) {
  await deleteDoc(doc(db, 'departments', id))
}

// ══════════════════════════════════════════════════════════════════════════════
//  COMPLAINT ROUTING HELPER
// ══════════════════════════════════════════════════════════════════════════════

// Category → Department ID mapping
export const CATEGORY_DEPARTMENT_MAP = {
  'Garbage':          'sanitation',
  'Sewage':           'sanitation',
  'Broken Road':      'road',
  'Open Manhole':     'road',
  'Streetlight Issue':'electric',
  'Water Leakage':    'water',
  'Other':            'municipal',
}

/**
 * resolveDepartment — returns the departmentId string for a given category
 */
export function resolveDepartment(category) {
  return CATEGORY_DEPARTMENT_MAP[category] || 'municipal'
}
