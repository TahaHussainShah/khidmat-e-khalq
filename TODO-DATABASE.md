# TODO-DATABASE.md

# Khidmat e Khalq — Firebase & Firestore Database Connectivity Guide

This document is a step-by-step checklist for setting up, connecting, securing, and maintaining the Firebase Firestore database for the project.

---

# 1. Firebase Project Setup

## Step 1 — Create Firebase Project
* [ ] Go to https://console.firebase.google.com
* [ ] Click "Add Project"
* [ ] Enter project name: `khidmat-e-khalq`
* [ ] Disable Google Analytics (not needed for this project)
* [ ] Click "Create Project"

## Step 2 — Register Web App
* [ ] In Firebase Console → click the `</>` (Web) icon
* [ ] App nickname: `khidmat-e-khalq-web`
* [ ] Do NOT enable Firebase Hosting (using Vercel instead)
* [ ] Copy the `firebaseConfig` object — you will need it for `.env.local`

**Config shape to copy:**
```js
const firebaseConfig = {
  apiKey:            "...",
  authDomain:        "....firebaseapp.com",
  projectId:         "...",
  storageBucket:     "....appspot.com",
  messagingSenderId: "...",
  appId:             "...",
}
```

---

# 2. Firestore Database Setup

## Step 3 — Create Firestore Database
* [ ] Firebase Console → Build → Firestore Database
* [ ] Click "Create database"
* [ ] Choose **Start in test mode** (we will add rules after)
* [ ] Select region closest to Pakistan: `asia-south1` (Mumbai)
* [ ] Click "Enable"

## Step 4 — Verify Connection File
Confirm `lib/firebase.js` matches your project config:

```js
// lib/firebase.js
import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth }      from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
export const auth = getAuth(app)
export const db   = getFirestore(app)
export default app
```

* [ ] All 6 env vars are set in `.env.local`
* [ ] All 6 env vars are set in Vercel → Settings → Environment Variables (for production)

---

# 3. Environment Variables

## Step 5 — Create `.env.local`
* [ ] Copy `.env.local.example` to `.env.local`
* [ ] Fill in all 6 values from the Firebase Console

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=khidmat-e-khalq.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=khidmat-e-khalq
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=khidmat-e-khalq.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

* [ ] Add `.env.local` to `.gitignore` — NEVER commit this file
* [ ] Confirm `.gitignore` contains: `.env.local`

---

# 4. Firebase Authentication Setup

## Step 6 — Enable Authentication Methods
* [ ] Firebase Console → Build → Authentication → Get Started
* [ ] Enable **Email/Password** sign-in provider
* [ ] Enable **Google** sign-in provider
  * [ ] Add project support email
* [ ] Enable **Phone** sign-in provider (for OTP)
  * [ ] Note: Phone auth requires a real phone number in production

## Step 7 — Configure Authorised Domains
* [ ] Firebase Console → Authentication → Settings → Authorised domains
* [ ] Add `localhost` (already there by default)
* [ ] Add your Vercel domain: `your-project.vercel.app`
* [ ] Add any custom domain if applicable

## Step 8 — Verify Auth in Code
`lib/auth.js` should export these functions — confirm each works:

| Function              | Provider           | Status |
|-----------------------|--------------------|--------|
| `registerWithEmail()` | Email + Password   | [ ]    |
| `loginWithEmail()`    | Email + Password   | [ ]    |
| `loginWithGoogle()`   | Google OAuth popup | [ ]    |
| `sendOTP()`           | Phone OTP          | [ ]    |
| `setupRecaptcha()`    | Invisible reCAPTCHA| [ ]    |
| `logout()`            | All providers      | [ ]    |
| `onAuthChange()`      | Auth state listener| [ ]    |
| `getUserRole()`       | Firestore lookup   | [ ]    |

---

# 5. Firestore Collections & Documents

## Step 9 — Understand the 3 Collections

### Collection: `users`
* Document ID = Firebase Auth UID
* Created automatically on registration via `lib/auth.js`

```json
{
  "uid":          "firebase-uid",
  "name":         "Muhammad Ali",
  "email":        "ali@example.com",
  "phone":        "+92 300 0000000",
  "role":         "user",
  "departmentId": "",
  "createdAt":    "<timestamp>"
}
```

Role values:
```
user              ← default for all new registrations
department_admin  ← assigned by main admin
main_admin        ← assigned via seed script or Firebase Console
```

---

### Collection: `complaints`
* Document ID = Firestore auto-generated ID
* Created via `lib/firestore.js → createComplaint()`

```json
{
  "userId":          "firebase-uid",
  "userName":        "Muhammad Ali",
  "category":        "Garbage",
  "severity":        "High",
  "description":     "Large garbage pile near main road.",
  "imageUrl":        "https://i.imgur.com/example.jpg",
  "location": {
    "lat":     33.6007,
    "lng":     73.0679,
    "address": "G-9 Markaz, Islamabad"
  },
  "departmentId":    "sanitation",
  "status":          "Pending",
  "resolutionNotes": "",
  "createdAt":       "<timestamp>",
  "updatedAt":       "<timestamp>"
}
```

Status workflow:
```
Pending  →  In Progress  →  Resolved
```

Category → Department auto-mapping:
```
Garbage           → sanitation
Sewage            → sanitation
Broken Road       → road
Open Manhole      → road
Streetlight Issue → electric
Water Leakage     → water
Other             → municipal
```

---

### Collection: `departments`
* Document ID = short slug (e.g. `sanitation`, `road`)
* Created by the seed script — NOT by users

```json
{
  "name":       "Sanitation Department",
  "categories": ["Garbage", "Sewage"],
  "adminUid":   "",
  "createdAt":  "<timestamp>"
}
```

---

## Step 10 — Seed the Database (Run Once)

### 10a — Download Service Account Key
* [ ] Firebase Console → Project Settings → Service Accounts
* [ ] Click "Generate new private key"
* [ ] Save as `serviceAccountKey.json` in project root
* [ ] Add `serviceAccountKey.json` to `.gitignore` — NEVER commit this

### 10b — Install Admin SDK
```bash
npm install firebase-admin dotenv
```

### 10c — Run Seed Script
```bash
node scripts/seedFirestore.js
```

Expected output:
```
🌿  Khidmat e Khalq — Firestore Seed Script

📦  Seeding departments…
   ✓ Road Department
   ✓ Sanitation Department
   ✓ Water Department
   ✓ Electric Department
   ✓ Municipal Authority
   All departments seeded.

✅  Seed complete!
```

* [ ] Departments created in Firestore — verify in Firebase Console → Firestore → departments collection

---

# 6. Firestore Security Rules

## Step 11 — Deploy Security Rules
```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login
firebase login

# Link to your project
firebase use --add
# Select your project from the list

# Deploy rules
firebase deploy --only firestore:rules
```

* [ ] Rules deployed successfully

## Step 12 — Verify Rules Are Correct
Open `firestore.rules` and confirm these behaviours:

| Action                               | Who Can Do It                              | Verified |
|--------------------------------------|--------------------------------------------|----------|
| Read any complaint                   | Everyone (public map)                      | [ ]      |
| Create complaint                     | Signed-in users only                       | [ ]      |
| Edit own complaint                   | Owner, only if status = Pending            | [ ]      |
| Delete own complaint                 | Owner, only if status = Pending            | [ ]      |
| Update complaint status              | Dept admin (own dept) or main admin        | [ ]      |
| Read own user profile                | The user themselves or main admin          | [ ]      |
| Update user role                     | Main admin only                            | [ ]      |
| Read departments                     | Everyone (needed for routing)              | [ ]      |
| Write departments                    | Main admin only                            | [ ]      |

---

# 7. Composite Indexes

## Step 13 — Deploy Indexes
Firestore requires composite indexes for multi-field queries.

```bash
firebase deploy --only firestore:indexes
```

Indexes defined in `firestore.indexes.json`:

| Collection   | Fields                                          | Purpose                         |
|--------------|-------------------------------------------------|---------------------------------|
| complaints   | userId ASC + createdAt DESC                     | User dashboard                  |
| complaints   | departmentId ASC + createdAt DESC               | Department admin view           |
| complaints   | departmentId ASC + status ASC + createdAt DESC  | Filtered department view        |
| complaints   | status ASC + createdAt DESC                     | Global status filter            |

* [ ] Indexes deployed
* [ ] Firebase Console → Firestore → Indexes — all show "Enabled" status

---

# 8. Firestore CRUD Functions Checklist

All functions live in `lib/firestore.js`. Test each one in the running app:

### Complaints
| Function              | Tested | Notes                                    |
|-----------------------|--------|------------------------------------------|
| `createComplaint()`   | [ ]    | Submit form → check Firestore            |
| `getComplaints()`     | [ ]    | Map page loads all complaints            |
| `getUserComplaints()` | [ ]    | Dashboard shows only your complaints     |
| `getComplaintById()`  | [ ]    | Detail page loads correct complaint      |
| `updateComplaint()`   | [ ]    | Admin updates status → reflects in app  |
| `deleteComplaint()`   | [ ]    | Delete pending complaint → disappears    |

### Users
| Function               | Tested | Notes                                   |
|------------------------|--------|-----------------------------------------|
| `createUserProfile()`  | [ ]    | Register → user doc appears in Firestore|
| `getUserProfile()`     | [ ]    | Navbar shows correct user name          |
| `getAllUsers()`         | [ ]    | Admin → Users page lists all users      |
| `updateUserRole()`     | [ ]    | Assign dept admin role → user can access admin |

### Departments
| Function               | Tested | Notes                                   |
|------------------------|--------|-----------------------------------------|
| `getDepartments()`     | [ ]    | Admin → Departments page shows list     |
| `getDepartmentById()`  | [ ]    | Complaint routing resolves dept name    |
| `createDepartment()`   | [ ]    | Add dept form works                     |
| `updateDepartment()`   | [ ]    | Edit dept name                          |
| `deleteDepartment()`   | [ ]    | Remove dept from list                   |

---

# 9. Making the First Main Admin

After the project is running and you have registered a user account:

### Method A — Via Seed Script (recommended)
* [ ] Register normally at `/register`
* [ ] Copy your UID from Firebase Console → Authentication → Users
* [ ] Open `scripts/seedFirestore.js`
* [ ] Uncomment the admin section and paste your UID:
  ```js
  const MAIN_ADMIN_UID = 'YOUR_UID_HERE'
  ```
* [ ] Run: `node scripts/seedFirestore.js`
* [ ] Reload the app — Admin link should appear in Navbar

### Method B — Via Firebase Console (manual)
* [ ] Firebase Console → Firestore → `users` collection
* [ ] Find your document (ID = your UID)
* [ ] Click "Edit document"
* [ ] Change `role` field value from `"user"` to `"main_admin"`
* [ ] Save

---

# 10. Assigning Department Admins

After departments are seeded and you are main admin:

* [ ] Log in as main admin
* [ ] Go to `/admin/users`
* [ ] Find the user you want to promote
* [ ] Click "Change Role" → Select "Department Admin"
* [ ] Select their department from the dropdown
* [ ] Save — they can now access `/admin` and manage their dept complaints

---

# 11. Connecting Complaint Routing

The auto-routing logic lives in `lib/firestore.js`:

```js
export const CATEGORY_DEPARTMENT_MAP = {
  'Garbage':          'sanitation',
  'Sewage':           'sanitation',
  'Broken Road':      'road',
  'Open Manhole':     'road',
  'Streetlight Issue':'electric',
  'Water Leakage':    'water',
  'Other':            'municipal',
}

export function resolveDepartment(category) {
  return CATEGORY_DEPARTMENT_MAP[category] || 'municipal'
}
```

Verify:
* [ ] Submit a "Garbage" complaint → `departmentId` in Firestore = `sanitation`
* [ ] Submit a "Broken Road" complaint → `departmentId` = `road`
* [ ] Dept admin for `sanitation` can see the Garbage complaint in their dashboard
* [ ] Dept admin for `road` cannot see the Garbage complaint

---

# 12. Real-Time Listeners (Optional Upgrade)

By default the app fetches data once with `getDocs()`. For live updates without page refresh, upgrade these queries to `onSnapshot()`:

### Example upgrade for user dashboard:
```js
// Current (one-time fetch)
const complaints = await getUserComplaints(user.uid)

// Upgraded (real-time listener)
import { onSnapshot, query, collection, where, orderBy } from 'firebase/firestore'

const q = query(
  collection(db, 'complaints'),
  where('userId', '==', user.uid),
  orderBy('createdAt', 'desc')
)
const unsubscribe = onSnapshot(q, (snap) => {
  const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  setComplaints(data)
})
// Call unsubscribe() in useEffect cleanup
```

Pages to upgrade:
* [ ] `/dashboard` — user complaints
* [ ] `/admin` — all/dept complaints
* [ ] `/map` — public map markers

---

# 13. Firestore Usage Monitoring

Check daily/monthly usage to stay within free Spark plan limits:

* [ ] Firebase Console → Firestore → Usage tab
* [ ] Set up a budget alert in Google Cloud Console (linked to Firebase)

| Metric          | Free Limit     | Alert Threshold |
|-----------------|----------------|-----------------|
| Reads / day     | 50,000         | 40,000          |
| Writes / day    | 20,000         | 15,000          |
| Deletes / day   | 20,000         | 15,000          |
| Storage         | 1 GB           | 800 MB          |

Tips to reduce reads:
* Cache complaint lists in React state — don't re-fetch on every render
* Use pagination with `limit()` on large collections
* Use `getDoc()` for single documents instead of querying all docs

---

# 14. Common Errors & Fixes

| Error                                            | Cause                              | Fix                                              |
|--------------------------------------------------|------------------------------------|--------------------------------------------------|
| `FirebaseError: Missing or insufficient permissions` | Rules blocking the request   | Check `firestore.rules` — make sure user is signed in |
| `FirebaseError: The query requires an index`     | Missing composite index            | Click the link in the error — it auto-creates the index |
| `FirebaseError: Failed to get document because the client is offline` | No internet / bad config | Check `.env.local` values are correct |
| `auth/api-key-not-valid`                         | Wrong API key in env               | Re-copy config from Firebase Console             |
| `auth/unauthorized-domain`                       | Domain not whitelisted             | Add domain in Firebase Auth → Settings → Authorised domains |
| `Cannot read properties of null (reading 'uid')` | Using `user` before auth loads     | Check `loading` state from `useAuth()` before accessing `user` |
| Phone OTP not sending                            | reCAPTCHA not rendering            | Ensure `<div id="recaptcha-container" />` is in DOM |

---

# 15. Deployment Checklist

Before going live on Vercel:

* [ ] All 6 Firebase env vars added to Vercel environment settings
* [ ] Firestore rules deployed: `firebase deploy --only firestore:rules`
* [ ] Firestore indexes deployed: `firebase deploy --only firestore:indexes`
* [ ] Vercel domain added to Firebase Auth → Authorised domains
* [ ] At least one main admin account exists
* [ ] All 5 departments seeded in Firestore
* [ ] Test registration flow on production URL
* [ ] Test complaint submission on production URL
* [ ] Test admin panel on production URL

---

# END OF DATABASE TODO
