# 🌿 Khidmat e Khalq
### Civic Issues Reporting & Tracking Platform

A full-stack **Next.js** web application allowing citizens to report civic problems and track their resolution. Built with Firebase for authentication and database.

## Recent Updates

- Unified authentication into a single `/login` page with a sliding Login/Register switch.
- Removed phone authentication completely from the user flow and from the Firebase setup instructions.
- Added email verification for password-based accounts with a dedicated `/verify-email` page.
- Kept Google sign-in as a supported provider and treated Google accounts as already verified.
- Updated route protection so `/dashboard`, `/report-issue`, and `/admin` require a signed-in, verified user.
- Simplified the navbar to a single Login button when signed out and an account menu when signed in.
- Updated the landing page CTAs to point to `/login` and to fetch live statistics from the API routes.

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/your-username/khidmat-e-khalq.git
cd khidmat-e-khalq
npm install
```

### 2. Firebase Setup
1. Go to [Firebase Console](https://console.firebase.google.com) → Create a project
2. Enable **Firestore Database** (start in test mode, then apply rules)
3. Enable **Authentication** → Sign-in methods:
   - Email/Password ✓
   - Google ✓
   - Phone ✗ (disabled in this project)
4. Go to **Project Settings → Your Apps → Web App** → Copy config

### 3. Environment Variables
```bash
cp .env.local.example .env.local
# Fill in your Firebase config values
```

### 4. Seed the Database
```bash
# Download serviceAccountKey.json from Firebase Console →
# Project Settings → Service Accounts → Generate new private key
# Place it in the project root, then:
npm install firebase-admin dotenv
node scripts/seedFirestore.js
```

### 5. Deploy Firestore Rules
```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

### 6. Run Development Server
```bash
npm run dev
# Open http://localhost:3000
```

---

## 🗂 Project Structure

```
khidmat-e-khalq/
├── app/                    # Next.js App Router pages + API routes
│   ├── page.js             # Landing page
│   ├── login/              # Unified login/register page
│   ├── register/           # Redirects to /login
│   ├── verify-email/       # Email verification screen
│   ├── dashboard/          # User complaint dashboard
│   ├── report-issue/       # Complaint submission form
│   ├── map/                # Public map view
│   ├── complaints/[id]/    # Complaint detail page
│   ├── admin/              # Admin dashboard
│   │   ├── departments/    # Manage departments
│   │   └── users/          # Manage users & roles
│   └── api/                # REST API routes
├── components/             # Reusable UI components
├── context/AuthContext.js  # Firebase Auth React context
├── lib/
│   ├── firebase.js         # Firebase app init
│   ├── firestore.js        # All Firestore CRUD functions
│   ├── auth.js             # Auth helpers
│   └── utils.js            # Constants & helpers
├── models/                 # Data schemas + validation
├── scripts/seedFirestore.js # One-time DB seed
├── firestore.rules         # Firestore security rules
├── firestore.indexes.json  # Composite indexes
└── middleware.js           # Route protection
```

---

## 👥 User Roles

| Role              | Access                                              |
|-------------------|-----------------------------------------------------|
| `user`            | Submit complaints, view own dashboard               |
| `department_admin`| View + update complaints for their department       |
| `main_admin`      | Full access: all complaints, users, departments     |

### Promoting a User to Main Admin
After the user registers via the app:
1. Copy their Firebase UID from Firebase Console → Authentication
2. Edit `scripts/seedFirestore.js`, uncomment the admin section, paste the UID
3. Run `node scripts/seedFirestore.js`

---

## 🗺 Features

- **Report Issues** — Category, severity, description, optional photo URL, map pin
- **Auto-routing** — Complaints automatically routed to the correct department
- **Live Map** — All reported issues visualised with colour-coded status markers
- **User Dashboard** — Track all your complaints, edit/delete pending ones
- **Admin Panel** — Update complaint status, add resolution notes
- **Main Admin** — Manage departments, assign roles, full system overview

---

## 🔒 Security

- Firebase Auth handles all authentication state and providers
- Password accounts must verify their email before accessing protected pages
- Google accounts are treated as verified because Firebase marks them as trusted OAuth users
- Firestore security rules enforce role-based access at the database level
- Users can only modify their own Pending complaints
- Department admins can only update complaints in their department
- Main admin has full write access

---

## 🔐 Authentication Flow

The current auth flow is intentionally simple:

1. New users go to `/login` and switch to Register inside the same page.
2. Email/password registration creates the Firestore profile and sends a verification email.
3. Unverified password users are redirected to `/verify-email` before using protected features.
4. Google sign-in skips the verification step and enters the app directly.
5. `/register` is kept only as a redirect to `/login` for backward compatibility.

The following routes are protected by both client checks and middleware:

- `/dashboard`
- `/report-issue`
- `/admin`

If a user is signed out, they are redirected to `/login`. If they are signed in but not verified, they are redirected to `/verify-email`.

---

## 📦 Tech Stack

| Layer        | Technology                        |
|--------------|-----------------------------------|
| Frontend     | Next.js 14 (App Router) + React   |
| Styling      | Tailwind CSS                      |
| Backend      | Next.js API Routes                |
| Database     | Firebase Firestore                |
| Auth         | Firebase Authentication           |
| Maps         | Leaflet.js + OpenStreetMap        |
| Deployment   | Vercel                            |

---

## 🌐 Deployment (Vercel)

1. Push to GitHub
2. Import project at [vercel.com](https://vercel.com)
3. Add all `.env.local` variables in Vercel → Settings → Environment Variables
4. Deploy — Vercel auto-deploys on every push

---

## 👨‍💻 Developed By

| Name                  | Roll No |
|-----------------------|---------|
| Taha Hussain Shah     | 243493  |
| Muhammad Muzammil     | 243459  |
| Muhammad Saadullah    | 240043  |

**Supervisor:** Sir Yaseen Mushtaq  
**Manager:** Sir Asim Ali Fayaz  
**Department:** ADCS — Educational Project
