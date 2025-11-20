# Environment Variables Setup Guide

Follow these steps to get all the environment variables you need for the coaching session booking app.

## Step 1: Create `.env.local` file

Create a file named `.env.local` in the root of your project (same directory as `package.json`).

## Step 2: Get Supabase Credentials

1. Go to your Supabase project dashboard: https://app.supabase.com
2. Click on your project
3. Go to **Settings** → **API** (in the left sidebar)
4. You'll see:
   - **Project URL** → This is your `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → This is your `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep this secret!)

Add these to your `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## Step 3: Get Stripe Credentials

1. Go to Stripe Dashboard: https://dashboard.stripe.com
2. Make sure you're in **Test mode** (toggle in top right)
3. Go to **Developers** → **API keys**
4. You'll see:
   - **Publishable key** → This is your `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - **Secret key** (click "Reveal test key") → This is your `STRIPE_SECRET_KEY`

5. For the webhook secret:
   - Go to **Developers** → **Webhooks**
   - Click **"Add endpoint"** (or use existing one)
   - Endpoint URL: `https://your-domain.com/api/stripe/webhook` (for production)
   - For local testing, use Stripe CLI (see below)
   - Select event: `checkout.session.completed`
   - After creating, click on the webhook endpoint
   - Copy the **Signing secret** → This is your `STRIPE_WEBHOOK_SECRET`

Add these to your `.env.local`:
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Local Webhook Testing (Optional)

For local development, use Stripe CLI to forward webhooks:

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Run: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
3. Copy the webhook signing secret it gives you (starts with `whsec_`)
4. Use that as your `STRIPE_WEBHOOK_SECRET` for local development

## Step 4: Get Customer.io Credentials

1. Go to Customer.io dashboard: https://fly.customer.io
2. Go to **Settings** → **API Credentials**
3. You'll see:
   - **App API Key** → This is your `CIO_API_KEY` (for server-side events)
   - **Site ID** → This is your `CIO_SITE_ID` (for in-app messages, optional)

4. For JavaScript tracking:
   - Go to **Settings** → **Data & Integrations** → **JavaScript**
   - Copy the **JavaScript Site ID** → This is your `NEXT_PUBLIC_CIO_JS_KEY`

Add these to your `.env.local`:
```env
CIO_SITE_ID=15cdbba0967ea9daef00
NEXT_PUBLIC_CIO_ANON_INAPP=true
CIO_API_KEY=6ba527a207f6c17342f1
NEXT_PUBLIC_CIO_SITE_ID=15cdbba0967ea9daef00
NEXT_PUBLIC_CIO_JS_KEY=c2de94a64750a9c44a29
CIO_APP_API_KEY=29edb66b6455e715eb9b5b7200f5d423 
```

**Note:** If you want to enable in-app messages, set `NEXT_PUBLIC_CIO_ANON_INAPP=true`

## Step 5: Set App URL

For local development:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

For production, replace with your actual domain:
```env
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## Complete `.env.local` Template

Here's what your complete `.env.local` file should look like:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe (Test Mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51xxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_test_51xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Customer.io
NEXT_PUBLIC_CIO_JS_KEY=xxxxxxxxxxxxx
CIO_API_KEY=xxxxxxxxxxxxx
CIO_SITE_ID=xxxxxxxxxxxxx
NEXT_PUBLIC_CIO_ANON_INAPP=false

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Verification Checklist

After setting up your `.env.local`:

- [ ] All Supabase variables are set
- [ ] All Stripe variables are set (test mode keys)
- [ ] Customer.io variables are set
- [ ] `NEXT_PUBLIC_APP_URL` is set to `http://localhost:3000` for local dev
- [ ] File is named exactly `.env.local` (not `.env` or `.env.example`)
- [ ] File is in the root directory (same level as `package.json`)

## Important Notes

1. **Never commit `.env.local` to git** - It should already be in `.gitignore`
2. **Service Role Key is secret** - Only use it server-side (which we do)
3. **Stripe keys shown here are test mode** - Use test cards for testing
4. **Restart your dev server** after creating/updating `.env.local`

## Testing Your Setup

After setting up all variables, restart your dev server:

```bash
npm run dev
```

Then try:
1. Visit `http://localhost:3000/auth/register`
2. Try to register a user
3. Check browser console for any missing env variable errors

If you see errors about missing variables, double-check your `.env.local` file.


