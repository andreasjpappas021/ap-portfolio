'use client'

import { useEffect, useRef } from 'react'

export default function CalendlyBadge() {
  const calendlyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Load Calendly CSS
    const link = document.createElement('link')
    link.href = 'https://assets.calendly.com/assets/external/widget.css'
    link.rel = 'stylesheet'
    document.head.appendChild(link)

    // Load Calendly script
    const script = document.createElement('script')
    script.src = 'https://assets.calendly.com/assets/external/widget.js'
    script.async = true
    document.head.appendChild(script)

    // Initialize widget after script loads
    script.onload = () => {
      if (calendlyRef.current && (window as any).Calendly) {
        ;(window as any).Calendly.initInlineWidget({
          url: 'https://calendly.com/andreasjpappas/30min',
          parentElement: calendlyRef.current,
        })
      }
    }

    // Cleanup
    return () => {
      const existingLink = document.querySelector(
        'link[href="https://assets.calendly.com/assets/external/widget.css"]'
      )
      if (existingLink) {
        document.head.removeChild(existingLink)
      }
    }
  }, [])

  return (
    <div
      ref={calendlyRef}
      style={{ minWidth: '320px', height: '700px', width: '100%' }}
    />
  )
}

