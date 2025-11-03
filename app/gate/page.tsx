'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { identify, track } from '@/lib/customerio'

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
    <div style={{ maxWidth: 480, margin: '80px auto', padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 12 }}>Sign up to view</h1>
      <p style={{ marginBottom: 24, color: '#555' }}>Brief form to access the portfolio.</p>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>First name</span>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Jane"
            style={{ padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6 }}
          />
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span>Last name</span>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Doe"
            style={{ padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6 }}
          />
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@example.com"
            required
            style={{ padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6 }}
          />
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span>Company</span>
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Acme Inc"
            style={{ padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6 }}
          />
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span>Job</span>
          <select
            value={job}
            onChange={(e) => setJob(e.target.value)}
            required
            style={{ padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6 }}
          >
            <option value="">Select a role</option>
            <option value="Recruiting">Recruiting</option>
            <option value="Product Management">Product Management</option>
            <option value="Engineering">Engineering</option>
            <option value="Marketing">Marketing</option>
            <option value="Design">Design</option>
            <option value="Data">Data</option>
            <option value="Sales">Sales</option>
            <option value="Support">Support</option>
          </select>
        </label>

        {error ? (
          <div style={{ color: '#b00020', fontSize: 14 }}>{error}</div>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: '10px 14px',
            borderRadius: 6,
            border: '1px solid #222',
            background: '#111',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          {submitting ? 'Submitting…' : 'Continue'}
        </button>
      </form>
    </div>
  )
}


