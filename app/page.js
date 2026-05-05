// app/page.js — Landing page
'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

const FALLBACK_STATS = [
  { label: 'Issues Reported', value: 2400 },
  { label: 'Resolved',        value: 1890 },
  { label: 'Departments',     value: 5 },
  { label: 'Active Users',    value: 800 },
]

const numberFormatter = new Intl.NumberFormat('en-US')

function formatStatValue(value, addPlus = false) {
  const formatted = numberFormatter.format(value)
  return addPlus ? `${formatted}+` : formatted
}

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

export default function HomePage() {
  const [stats, setStats] = useState(FALLBACK_STATS)

  useEffect(() => {
    const controller = new AbortController()

    async function loadStats() {
      try {
        const [complaintsRes, departmentsRes, usersRes] = await Promise.allSettled([
          fetch('/api/complaints', { signal: controller.signal, cache: 'no-store' }),
          fetch('/api/departments', { signal: controller.signal, cache: 'no-store' }),
          fetch('/api/users', { signal: controller.signal, cache: 'no-store' }),
        ])

        const parseJson = async (result) => {
          if (result.status !== 'fulfilled' || !result.value.ok) return null
          return result.value.json()
        }

        const [complaintsJson, departmentsJson, usersJson] = await Promise.all([
          parseJson(complaintsRes),
          parseJson(departmentsRes),
          parseJson(usersRes),
        ])

        const complaints = complaintsJson?.data
        const departments = departmentsJson?.data
        const users = usersJson?.data

        const resolvedCount = Array.isArray(complaints)
          ? complaints.filter(c => c.status === 'Resolved').length
          : FALLBACK_STATS[1].value

        setStats([
          { label: 'Issues Reported', value: Array.isArray(complaints) ? complaints.length : FALLBACK_STATS[0].value },
          { label: 'Resolved', value: resolvedCount },
          { label: 'Departments', value: Array.isArray(departments) ? departments.length : FALLBACK_STATS[2].value },
          { label: 'Active Users', value: Array.isArray(users) ? users.length : FALLBACK_STATS[3].value },
        ])
      } catch (error) {
        // Keep fallback stats when API is unavailable.
      }
    }

    loadStats()
    return () => controller.abort()
  }, [])

  return (
    <div className="overflow-hidden">

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative bg-brand-dark text-white overflow-hidden">
        {/* Background texture */}
        <div
          className="absolute inset-0 opacity-10"
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
            <Link href="/login" className="btn-primary text-base px-8 py-3">
              Report an Issue
            </Link>
            <Link href="/map" className="btn-secondary text-base px-8 py-3 !text-brand-lime !border-brand-lime">
              View Live Map
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats strip ───────────────────────────────────────── */}
      <section className="bg-brand-green py-10">
        <div className="page-wrapper grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {stats.map(s => (
            <div key={s.label}>
              <p className="font-display text-4xl font-bold text-white">
                {formatStatValue(s.value, s.label !== 'Departments')}
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
        <Link href="/login" className="btn-primary text-base px-10 py-3">
          Get Started — It's Free
        </Link>
      </section>
    </div>
  )
}
