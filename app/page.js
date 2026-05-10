// app/page.js — Landing page
'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'

// Static fallbacks shown until real data loads
const STATIC_DEPARTMENTS = 5
const STATIC_USERS       = 800

const CATEGORIES = [
  { icon: '🗑️', label: 'Garbage',           desc: 'Dump sites, overflowing bins' },
  { icon: '💧', label: 'Sewage',             desc: 'Blocked drains, sewage leaks'  },
  { icon: '🚧', label: 'Broken Road',        desc: 'Potholes, damaged pavements'   },
  { icon: '💡', label: 'Streetlight',        desc: 'Non-functional public lights'  },
  { icon: '⚠️', label: 'Open Manhole',       desc: 'Uncovered manholes, hazards'   },
  { icon: '🚿', label: 'Water Leakage',      desc: 'Pipe bursts, water wastage'    },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Register',     desc: 'Create your free account in seconds.' },
  { step: '02', title: 'Report',       desc: 'Fill in the issue form and drop a map pin.' },
  { step: '03', title: 'Auto-Route',   desc: 'Complaint is sent to the relevant department.' },
  { step: '04', title: 'Track',        desc: 'Follow real-time status from your dashboard.' },
]

// Format whole numbers with + suffix: 10, 25+, 100+
function formatStat(value) {
  if (value === 0) return '0'
  // Round DOWN to nearest 10 and add +, e.g. 13 → "10+", 105 → "100+"
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)))
  const floored   = Math.floor(value / magnitude) * magnitude
  return floored === value ? `${value}` : `${floored}+`
}

export default function HomePage() {
  const { user, loading: authLoading } = useAuth()

  // Only issues reported & resolved are dynamic; depts & users stay static
  const [totalComplaints, setTotalComplaints] = useState(null)
  const [totalResolved,   setTotalResolved]   = useState(null)
  const [statsLoaded,     setStatsLoaded]     = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    async function loadStats() {
      try {
        const res = await fetch('/api/complaints', {
          signal: controller.signal,
          cache:  'no-store',
        })
        if (!res.ok) return
        const json = await res.json()
        const complaints = json?.data
        if (!Array.isArray(complaints)) return
        setTotalComplaints(complaints.length)
        setTotalResolved(complaints.filter(c => c.status === 'Resolved').length)
      } catch {
        // keep nulls — UI falls back gracefully
      } finally {
        setStatsLoaded(true)
      }
    }

    loadStats()
    return () => controller.abort()
  }, [])

  // Smart CTA href: logged-in → report directly; guest → login first
  const primaryCTA    = user ? '/report-issue' : '/login?from=/report-issue'
  const secondaryCTA  = user ? '/report-issue' : '/login?from=/report-issue'

  const stats = [
    {
      label: 'Issues Reported',
      // Dynamic: show real count; while loading show skeleton dash
      value: statsLoaded ? (totalComplaints !== null ? formatStat(totalComplaints) : '0') : '—',
    },
    {
      label: 'Resolved',
      value: statsLoaded ? (totalResolved !== null ? formatStat(totalResolved) : '0') : '—',
    },
    {
      label: 'Departments',
      value: String(STATIC_DEPARTMENTS), // always static
    },
    {
      label: 'Active Users',
      value: `${STATIC_USERS}+`,         // always static
    },
  ]

  return (
    <div className="overflow-hidden">

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative bg-brand-dark text-white overflow-hidden">
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, #4ade80 0%, transparent 50%),
                              radial-gradient(circle at 80% 20%, #d4a017 0%, transparent 40%)`,
          }}
        />
        <div className="relative page-wrapper py-24 sm:py-32 text-center">
          <div className="inline-flex items-center gap-2 bg-brand-mid border border-brand-green/30
                          text-brand-lime text-xs font-medium px-4 py-1.5 rounded-full mb-8">
            🌿 Civic Accountability Platform
          </div>
          <h1 className="font-display text-5xl sm:text-7xl font-black mb-6 leading-tight">
            خدمتِ خلق
            <br />
            <span className="text-brand-lime">Khidmat e Khalq</span>
          </h1>
          <p className="text-gray-300 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Report civic problems in your neighbourhood. Our platform routes every
            complaint directly to the responsible department — and keeps you updated until it is resolved.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {/* FIX: Smart CTA — goes to /report-issue if logged in, else /login */}
            <Link href={primaryCTA} className="btn-primary text-base px-8 py-3">
              Report an Issue
            </Link>
            <Link href="/map" className="btn-secondary text-base px-8 py-3 !text-brand-lime !border-brand-lime">
              View Live Map
            </Link>
          </div>

          {/* Subtle hint for guests */}
          {!authLoading && !user && (
            <p className="text-gray-500 text-xs mt-4">
              Already have an account?{' '}
              <Link href="/login" className="text-brand-lime hover:underline">Login here</Link>
            </p>
          )}
        </div>
      </section>

      {/* ── Stats strip ───────────────────────────────────────── */}
      <section className="bg-brand-green py-10">
        <div className="page-wrapper grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {stats.map(s => (
            <div key={s.label}>
              <p className="font-display text-4xl font-bold text-white">
                {s.value}
              </p>
              <p className="text-green-100 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Issue categories ──────────────────────────────────── */}
      <section className="page-wrapper py-20">
        <p className="text-brand-green text-sm font-semibold tracking-widest uppercase mb-3">What You Can Report</p>
        <h2 className="section-title mb-10">Common Civic Issues</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {CATEGORIES.map(c => (
            <div key={c.label} className="card text-center hover:border-brand-green hover:shadow-md transition-all cursor-default">
              <div className="text-4xl mb-3">{c.icon}</div>
              <p className="font-semibold text-sm text-gray-800 mb-1">{c.label}</p>
              <p className="text-xs text-gray-400 leading-snug">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────── */}
      <section className="bg-brand-mid py-20">
        <div className="page-wrapper">
          <p className="text-brand-lime text-sm font-semibold tracking-widest uppercase mb-3">Simple Process</p>
          <h2 className="section-title text-white mb-12">How It Works</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((item, i) => (
              <div key={item.step} className="relative">
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden lg:block absolute top-6 left-full w-full h-px bg-brand-green/30 z-0" />
                )}
                <div className="relative z-10 bg-brand-dark rounded-2xl p-6 border border-brand-green/20 h-full">
                  <span className="font-mono text-4xl font-black text-brand-green/30">{item.step}</span>
                  <h3 className="font-display text-xl font-bold text-white mt-3 mb-2">{item.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section className="page-wrapper py-20 text-center">
        <h2 className="section-title mb-4">See a Problem? Report It Now.</h2>
        <p className="text-gray-500 max-w-xl mx-auto mb-8">
          Your report reaches the right department instantly. Together we make our city better.
        </p>
        {/* FIX: Smart CTA — logged-in goes to report, guest goes to login */}
        <Link href={secondaryCTA} className="btn-primary text-base px-10 py-3">
          {user ? 'Report an Issue →' : 'Get Started — It\'s Free'}
        </Link>
        {!authLoading && !user && (
          <p className="text-gray-400 text-xs mt-4">
            Free to use · No ads · Your data stays private
          </p>
        )}
      </section>
    </div>
  )
}
