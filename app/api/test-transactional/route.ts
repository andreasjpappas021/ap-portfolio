import { sendTransactionalEmail } from '@/lib/customerio-server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Test endpoint for transactional email
 * GET /api/test-transactional?userId=xxx
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json(
      { error: 'Missing userId query parameter' },
      { status: 400 }
    )
  }

  console.log('[Test] Testing transactional email for userId:', userId)

  try {
    await sendTransactionalEmail(
      userId,
      'order_completed',
      {
        session_id: 'test_session_' + Date.now(),
        product_name: 'Test Product',
        price: 10000,
        price_formatted: '$100.00',
        amount: 100.00,
        currency: 'usd',
        test: true,
      }
    )

    return NextResponse.json({
      success: true,
      message: 'Transactional email sent! Check server logs for details.',
    })
  } catch (error: any) {
    console.error('[Test] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        details: error,
      },
      { status: 500 }
    )
  }
}

