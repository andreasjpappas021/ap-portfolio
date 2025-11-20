#!/usr/bin/env node
/**
 * Test script for Customer.io transactional email (App API)
 * 
 * Usage:
 *   node scripts/test-transactional-email.js <userId> [transactionalId]
 * 
 * Example:
 *   node scripts/test-transactional-email.js abc123 order_completed
 */

const userId = process.argv[2]
const transactionalId = process.argv[3] || 'order_completed'

if (!userId) {
  console.error('❌ Error: User ID required')
  console.log('\nUsage: node scripts/test-transactional-email.js <userId> [transactionalId]')
  console.log('Example: node scripts/test-transactional-email.js abc123 order_completed')
  process.exit(1)
}

// Load environment variables
try {
  require('dotenv').config({ path: '.env.local' })
} catch (e) {
  console.log('ℹ️  Note: dotenv not found. Set env vars manually or install: npm install dotenv')
}

const APP_API_KEY = process.env.CIO_APP_API_KEY

if (!APP_API_KEY) {
  console.error('❌ Error: Missing Customer.io App API Key')
  console.log('\nRequired environment variable:')
  console.log('  - CIO_APP_API_KEY (App API Key, separate from CIO_API_KEY which is Track API key)')
  console.log('\nSet it manually:')
  console.log('  export CIO_APP_API_KEY=your_app_api_key')
  console.log('  node scripts/test-transactional-email.js <userId>')
  console.log('\nOr install dotenv: npm install --save-dev dotenv')
  process.exit(1)
}

console.log('🧪 Testing Customer.io Transactional Email (App API)\n')
console.log('Configuration:')
console.log(`  App API Key: ${APP_API_KEY.substring(0, 10)}...`)
console.log(`  User ID: ${userId}`)
console.log(`  Transactional Message ID: ${transactionalId}\n`)

// Import the function (using dynamic import for ES modules)
async function testTransactionalEmail() {
  try {
    // Since this is a CommonJS script, we'll need to use the API directly
    // or import the function if possible
    const { APIClient, SendEmailRequest } = require('customerio-node')
    const { createClient } = require('@supabase/supabase-js')

    // Create Supabase admin client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Error: Missing Supabase credentials')
      console.log('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
      process.exit(1)
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    console.log('1. Fetching user email from Supabase...')
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single()

    if (userError || !user?.email) {
      console.error(`❌ Error fetching user: ${userError?.message || 'User not found'}`)
      console.log('\nMake sure:')
      console.log('  - User exists in Supabase users table')
      console.log('  - User ID is correct')
      console.log('  - SUPABASE_SERVICE_ROLE_KEY has proper permissions')
      process.exit(1)
    }

    console.log(`✅ Found user email: ${user.email}\n`)

    console.log('2. Initializing Customer.io App API client...')
    const client = new APIClient(APP_API_KEY)

    console.log('3. Creating send email request...')
    const testData = {
      session_id: 'test_session_' + Date.now(),
      product_name: 'Test Product',
      price: 10000,
      price_formatted: '$100.00',
      amount: 100.00,
      currency: 'usd',
      test: true,
      timestamp: new Date().toISOString(),
    }

    const request = new SendEmailRequest({
      transactional_message_id: transactionalId,
      identifiers: {
        id: userId,
      },
      to: user.email,
      message_data: testData,
    })

    console.log('4. Sending transactional email...')
    const response = await client.sendEmail(request)

    console.log('\n✅ Transactional email sent successfully!')
    console.log(`   Response:`, response)
    console.log('\nNext steps:')
    console.log('  1. Check your email inbox:', user.email)
    console.log('  2. Check Customer.io dashboard: https://fly.customer.io')
    console.log('  3. Go to Deliveries → Transactional Messages')
    console.log(`  4. Look for message ID: ${transactionalId}`)
    console.log('\nTest data sent:')
    console.log(JSON.stringify(testData, null, 2))
  } catch (error) {
    console.error('\n❌ Error sending transactional email:')
    if (error.statusCode) {
      console.error(`   Status: ${error.statusCode}`)
      console.error(`   Message: ${error.message}`)
    } else {
      console.error(`   ${error.message}`)
      console.error(`   Stack: ${error.stack}`)
    }
    
    console.log('\nTroubleshooting:')
    console.log('  - Verify CIO_APP_API_KEY is the App API Key (separate from CIO_API_KEY which is Track API key)')
    console.log(`  - Verify transactional message "${transactionalId}" exists in Customer.io`)
    console.log('  - Check Customer.io dashboard → Messages → Transactional Messages')
    console.log('  - Verify user exists in Supabase users table')
    process.exit(1)
  }
}

testTransactionalEmail()

