#!/usr/bin/env node
/**
 * Script to create a Stripe Product and Price for monthly subscription
 * Run: node scripts/setup-stripe-subscription.js
 * 
 * Prerequisites: STRIPE_SECRET_KEY must be set in .env.local
 */

const fs = require('fs')
const path = require('path')

// Load .env.local manually (no dotenv dependency needed)
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local')
  try {
    const envContent = fs.readFileSync(envPath, 'utf-8')
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=')
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim()
        if (!process.env[key.trim()]) {
          process.env[key.trim()] = value
        }
      }
    })
  } catch (err) {
    console.error('Could not read .env.local file:', err.message)
  }
}

loadEnvFile()

const Stripe = require('stripe')

async function main() {
  const apiKey = process.env.STRIPE_SECRET_KEY
  
  if (!apiKey) {
    console.error('❌ STRIPE_SECRET_KEY is not set in .env.local')
    process.exit(1)
  }

  const stripe = new Stripe(apiKey, {
    apiVersion: '2024-12-18.acacia',
  })

  console.log('🚀 Creating Stripe subscription product and price...\n')

  try {
    // Create the product
    const product = await stripe.products.create({
      name: 'Coaching Access',
      description: 'Monthly subscription for unlimited coaching session scheduling',
    })
    console.log('✅ Product created:', product.id)

    // Create the price (recurring monthly)
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: 1500, // $15.00
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
    })
    console.log('✅ Price created:', price.id)

    console.log('\n📋 Add this to your .env.local:')
    console.log(`STRIPE_SUBSCRIPTION_PRICE_ID=${price.id}`)

    console.log('\n🔧 Next steps:')
    console.log('1. Add the STRIPE_SUBSCRIPTION_PRICE_ID to your .env.local')
    console.log('2. Enable Customer Portal in Stripe Dashboard:')
    console.log('   https://dashboard.stripe.com/test/settings/billing/portal')
    console.log('3. Run the SQL migration to add subscription fields')

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

main()

