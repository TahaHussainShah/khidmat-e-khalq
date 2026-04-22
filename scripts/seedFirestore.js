// scripts/seedFirestore.js
// Run once to populate departments and a main admin:
//   node scripts/seedFirestore.js
//
// Requirements:
//   npm install firebase-admin dotenv
//   Set FIREBASE_SERVICE_ACCOUNT env var to your service account JSON path
//   OR place serviceAccountKey.json in the project root

require('dotenv').config({ path: '.env.local' })
const admin = require('firebase-admin')
const path  = require('path')

// ── Init ────────────────────────────────────────────────────────
let serviceAccount
try {
  serviceAccount = require(path.resolve(__dirname, '../serviceAccountKey.json'))
} catch {
  console.error('❌  serviceAccountKey.json not found.')
  console.error('   Download it from Firebase Console → Project Settings → Service Accounts')
  process.exit(1)
}

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
}

const db = admin.firestore()

// ── Data ─────────────────────────────────────────────────────────
const DEPARTMENTS = [
  {
    id:         'road',
    name:       'Road Department',
    categories: ['Broken Road', 'Open Manhole'],
    adminUid:   '',
  },
  {
    id:         'sanitation',
    name:       'Sanitation Department',
    categories: ['Garbage', 'Sewage'],
    adminUid:   '',
  },
  {
    id:         'water',
    name:       'Water Department',
    categories: ['Water Leakage'],
    adminUid:   '',
  },
  {
    id:         'electric',
    name:       'Electric Department',
    categories: ['Streetlight Issue'],
    adminUid:   '',
  },
  {
    id:         'municipal',
    name:       'Municipal Authority',
    categories: ['Other'],
    adminUid:   '',
  },
]

// ── Seed function ────────────────────────────────────────────────
async function seed() {
  console.log('\n🌿  Khidmat e Khalq — Firestore Seed Script\n')

  // 1. Seed departments
  console.log('📦  Seeding departments…')
  const batch = db.batch()
  for (const dept of DEPARTMENTS) {
    const ref = db.collection('departments').doc(dept.id)
    batch.set(ref, {
      name:       dept.name,
      categories: dept.categories,
      adminUid:   dept.adminUid,
      createdAt:  admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true })
    console.log(`   ✓ ${dept.name}`)
  }
  await batch.commit()
  console.log('   All departments seeded.\n')

  // 2. Optional: promote a user to main_admin
  //    Uncomment and fill in the UID after you register via the app
  /*
  const MAIN_ADMIN_UID = 'PASTE_YOUR_UID_HERE'
  console.log('👑  Setting main admin…')
  await db.collection('users').doc(MAIN_ADMIN_UID).set({
    role:      'main_admin',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true })
  console.log(`   ✓ UID ${MAIN_ADMIN_UID} set as main_admin\n`)
  */

  console.log('✅  Seed complete!\n')
  process.exit(0)
}

seed().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
