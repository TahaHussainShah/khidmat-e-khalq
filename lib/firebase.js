// lib/firebase.js
// Firebase initialization — imported once, reused everywhere

import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
   apiKey: "AIzaSyD59-3zqiXPgqcD6EiocntYcGW1Ol3mIvs",
  authDomain: "khidmat-e-khalq-579da.firebaseapp.com",
  projectId: "khidmat-e-khalq-579da",
  storageBucket: "khidmat-e-khalq-579da.firebasestorage.app",
  messagingSenderId: "627804827945",
  appId: "1:627804827945:web:93d2db9e5fa66acd740738",
  measurementId: "G-KHSYXNB1SM"
}

// Prevent re-initialization during hot-reload in development
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()

export const auth = getAuth(app)
export const db   = getFirestore(app)
export default app



