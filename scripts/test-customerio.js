#!/usr/bin/env node
/**
 * Quick test script for Customer.io integration
 * 
 * Usage:
 *   node scripts/test-customerio.js <userId> <eventName>
 * 
 * Example:
 *   node scripts/test-customerio.js abc123 test_event
 */

const userId = process.argv[2]
const eventName = process.argv[3] || 'test_event'

if (!userId) {
  console.error('❌ Error: User ID required')
  console.log('\nUsage: node scripts/test-customerio.js <userId> [eventName]')
  console.log('Example: node scripts/test-customerio.js abc123 test_event')
  process.exit(1)
}

// Load environment variables from .env.local
// Note: This script requires dotenv or you can run it with env vars:
//   CIO_API_KEY=... NEXT_PUBLIC_CIO_SITE_ID=... node scripts/test-customerio.js <userId>

// Try to load dotenv if available, otherwise use process.env (set manually)
try {
  require('dotenv').config({ path: '.env.local' })
} catch (e) {
  // dotenv not installed, user must set env vars manually
  console.log('ℹ️  Note: dotenv not found. Set env vars manually or install: npm install dotenv')
}

const API_KEY = process.env.CIO_API_KEY
const SITE_ID = process.env.NEXT_PUBLIC_CIO_SITE_ID || process.env.CIO_SITE_ID

if (!API_KEY || !SITE_ID) {
  console.error('❌ Error: Missing Customer.io credentials')
  console.log('\nRequired environment variables:')
  console.log('  - CIO_API_KEY')
  console.log('  - NEXT_PUBLIC_CIO_SITE_ID (or CIO_SITE_ID)')
  console.log('\nSet them manually:')
  console.log('  export CIO_API_KEY=your_key')
  console.log('  export NEXT_PUBLIC_CIO_SITE_ID=your_site_id')
  console.log('  node scripts/test-customerio.js <userId>')
  console.log('\nOr install dotenv: npm install --save-dev dotenv')
  process.exit(1)
}

console.log('🧪 Testing Customer.io Integration\n')
console.log('Configuration:')
console.log(`  Site ID: ${SITE_ID}`)
console.log(`  API Key: ${API_KEY.substring(0, 10)}...`)
console.log(`  User ID: ${userId}`)
console.log(`  Event: ${eventName}\n`)

// Test server-side event tracking
async function testEventTracking() {
  try {
    const response = await fetch(
      `https://track.customer.io/api/v1/customers/${userId}/events`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(`${SITE_ID}:${API_KEY}`).toString('base64')}`,
        },
        body: JSON.stringify({
          name: eventName,
          data: {
            test: true,
            timestamp: new Date().toISOString(),
            source: 'test_script',
          },
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ API Error: ${response.status}`)
      console.error(`   ${errorText}`)
      return false
    }

    console.log('✅ Event tracked successfully!')
    console.log(`   Check Customer.io dashboard for user: ${userId}`)
    console.log(`   Event name: ${eventName}`)
    return true
  } catch (error) {
    console.error('❌ Error:', error.message)
    return false
  }
}

// Test user identification
async function testUserIdentification() {
  try {
    const response = await fetch(
      `https://track.customer.io/api/v1/customers/${userId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(`${SITE_ID}:${API_KEY}`).toString('base64')}`,
        },
        body: JSON.stringify({
          id: userId,
          email: `test-${userId}@example.com`,
          name: 'Test User',
          test_user: true,
          created_at: Math.floor(Date.now() / 1000),
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ API Error: ${response.status}`)
      console.error(`   ${errorText}`)
      return false
    }

    console.log('✅ User identified successfully!')
    return true
  } catch (error) {
    console.error('❌ Error:', error.message)
    return false
  }
}

// Run tests
async function runTests() {
  console.log('1. Testing user identification...')
  const identifySuccess = await testUserIdentification()
  console.log('')

  console.log('2. Testing event tracking...')
  const eventSuccess = await testEventTracking()
  console.log('')

  if (identifySuccess && eventSuccess) {
    console.log('✅ All tests passed!')
    console.log('\nNext steps:')
    console.log('  1. Check Customer.io dashboard: https://fly.customer.io')
    console.log(`  2. Search for user ID: ${userId}`)
    console.log(`  3. Verify event "${eventName}" appears in Activity tab`)
    process.exit(0)
  } else {
    console.log('❌ Some tests failed. Check the errors above.')
    process.exit(1)
  }
}

runTests()

