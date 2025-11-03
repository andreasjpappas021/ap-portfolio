'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { identify, track } from '@/lib/customerio'
import Image from 'next/image'

export default function GatePage() {
  const router = useRouter()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [job, setJob] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!email || !job) {
      setError('Please provide at least email and job.')
      return
    }
    try {
      setSubmitting(true)

      identify({
        id: email,
        email,
        first_name: firstName,
        last_name: lastName,
        company,
        job,
      })

      track('signup_submitted', { job, company })

      if (typeof window !== 'undefined') {
        window.localStorage.setItem('ci_gate', email)
      }

      router.push('/')
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black">
      {/* Subtle site preview behind (non-interactive) */}
      <div className="absolute inset-0 -z-20 pointer-events-none select-none">
        <iframe
          src="/"
          aria-hidden="true"
          className="w-full h-full scale-110 blur-xl opacity-60"
          style={{ border: 'none' }}
        />
      </div>
      {/* Dark overlay to keep focus on the form */}
      <div className="absolute inset-0 -z-10 bg-black/60" />
      {/* Header with avatar + name */}
      <div className="relative z-10 w-full pt-12 pb-6 flex flex-col items-center">
        <div className="w-20 h-20 rounded-full overflow-hidden ring-1 ring-white/20">
          <Image src="/images/headshot.png" alt="Andreas Pappas" width={80} height={80} className="object-cover" />
        </div>
        <div className="mt-3 text-white font-semibold text-lg">Andreas Pappas</div>
      </div>

      {/* Centered translucent card */}
      <div className="relative z-10 flex items-center justify-center pb-16 px-4">
        <div className="w-full max-w-md rounded-xl border border-white/15 bg-white/10 backdrop-blur-xl shadow-2xl">
          <div className="p-6">
            <h1 className="text-white text-2xl font-semibold mb-2">Sign up to view</h1>
            <p className="text-slate-200/80 mb-6 text-sm">Brief form to access the portfolio.</p>

            <form onSubmit={onSubmit} className="grid gap-3">
              <label className="grid gap-1 text-slate-200 text-sm">
                <span>First name</span>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Jane"
                  className="px-3 py-2 rounded-md bg-white/10 border border-white/15 text-white placeholder:text-slate-300/60 focus:outline-none focus:ring-2 focus:ring-white/30"
                />
              </label>

              <label className="grid gap-1 text-slate-200 text-sm">
                <span>Last name</span>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  className="px-3 py-2 rounded-md bg-white/10 border border-white/15 text-white placeholder:text-slate-300/60 focus:outline-none focus:ring-2 focus:ring-white/30"
                />
              </label>

              <label className="grid gap-1 text-slate-200 text-sm">
                <span>Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  required
                  className="px-3 py-2 rounded-md bg-white/10 border border-white/15 text-white placeholder:text-slate-300/60 focus:outline-none focus:ring-2 focus:ring-white/30"
                />
              </label>

              <label className="grid gap-1 text-slate-200 text-sm">
                <span>Company</span>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Acme Inc"
                  className="px-3 py-2 rounded-md bg-white/10 border border-white/15 text-white placeholder:text-slate-300/60 focus:outline-none focus:ring-2 focus:ring-white/30"
                />
              </label>

              <label className="grid gap-1 text-slate-200 text-sm">
                <span>Job</span>
                <select
                  value={job}
                  onChange={(e) => setJob(e.target.value)}
                  required
                  className="px-3 py-2 rounded-md bg-white/10 border border-white/15 text-white focus:outline-none focus:ring-2 focus:ring-white/30"
                >
                  <option value="" className="text-black">Select a role</option>
                  <option value="Recruiting" className="text-black">Recruiting</option>
                  <option value="Product Management" className="text-black">Product Management</option>
                  <option value="Engineering" className="text-black">Engineering</option>
                  <option value="Marketing" className="text-black">Marketing</option>
                  <option value="Design" className="text-black">Design</option>
                  <option value="Data" className="text-black">Data</option>
                  <option value="Sales" className="text-black">Sales</option>
                  <option value="Support" className="text-black">Support</option>
                </select>
              </label>

              {error ? (
                <div className="text-red-300 text-sm">{error}</div>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 inline-flex items-center justify-center px-4 py-2 rounded-md border border-white/20 bg-white/15 text-white hover:bg-white/25 disabled:opacity-60"
              >
                {submitting ? 'Submitting…' : 'Continue'}
              </button>
            </form>
            {/* Mini-game removed */}
          </div>
        </div>
      </div>
    </div>
  )
}


