import { trackEvent } from '@/lib/customerio-server'
import { logAuditEvent } from '@/lib/audit'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, eventName, data } = body

    if (!userId || !eventName) {
      return NextResponse.json(
        { error: 'Missing userId or eventName' },
        { status: 400 }
      )
    }

    // Track event in Customer.io
    await trackEvent(userId, eventName, data)

    // Log to audit table
    await logAuditEvent(userId, eventName, data)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error tracking event:', error)
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    )
  }
}


