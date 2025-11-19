# Coaching Session Booking App

A full-stack coaching session booking application built with Next.js 14+, featuring authentication, payments, scheduling, and Customer.io messaging integration. This app demonstrates a complete user journey from registration to booking a paid coaching session.

## Features

- **Authentication**: Magic Link authentication via Supabase Auth
- **User Profiles**: Store and manage user information (name, job, company)
- **Payments**: Stripe Checkout integration for session purchases ($99)
- **Scheduling**: Calendly integration for booking 30-minute sessions
- **Messaging**: Customer.io integration for behavioral and transactional messaging
- **Event Tracking**: Comprehensive event tracking for analytics and automation

## Tech Stack

- **Framework**: Next.js 15.2.4 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (Magic Link)
- **Payments**: Stripe (Test Mode)
- **Scheduling**: Calendly
- **Messaging**: Customer.io (JS tracking + REST API)
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui

## Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Stripe account (test mode)
- Customer.io account
- Calendly account

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Customer.io
NEXT_PUBLIC_CIO_JS_KEY=your_customerio_js_key
CIO_API_KEY=your_customerio_api_key
CIO_SITE_ID=your_customerio_site_id (optional, for in-app messages)
NEXT_PUBLIC_CIO_ANON_INAPP=false (optional, set to "true" to enable in-app messages)

# App URL (for redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Database Setup

### 1. Create Supabase Tables

Run these SQL commands in your Supabase SQL Editor:

```sql
-- Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  job TEXT,
  company TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Session purchases table
CREATE TABLE session_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_session_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit events table (for tracking all events)
CREATE TABLE audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for session_purchases
CREATE POLICY "Users can view own purchases"
  ON session_purchases FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policies for audit_events
CREATE POLICY "Users can view own audit events"
  ON audit_events FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can do everything (for server-side operations)
CREATE POLICY "Service role full access"
  ON users FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access purchases"
  ON session_purchases FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access audit"
  ON audit_events FOR ALL
  USING (true)
  WITH CHECK (true);
```

### 2. Set up Supabase Auth

1. Go to Authentication > Settings in your Supabase dashboard
2. Enable "Email" provider
3. Configure email templates (optional, for custom magic link emails)
4. Set site URL to `http://localhost:3000` for local development

## Stripe Setup

### 1. Get API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Copy your **Publishable key** and **Secret key** (test mode)
3. Add them to `.env.local`

### 2. Set up Webhook

1. Go to [Stripe Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click "Add endpoint"
3. Set endpoint URL to: `https://your-domain.com/api/stripe/webhook` (or use Stripe CLI for local testing)
4. Select event: `checkout.session.completed`
5. Copy the webhook signing secret to `.env.local` as `STRIPE_WEBHOOK_SECRET`

### 3. Local Webhook Testing (Optional)

Use Stripe CLI for local webhook testing:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

This will give you a webhook secret to use in development.

## Customer.io Setup

### 1. Get API Credentials

1. Go to Customer.io Settings > API Credentials
2. Copy your **App API Key** (for server-side events)
3. Copy your **JavaScript Site ID** (for client-side tracking)
4. Add them to `.env.local`

### 2. Create Messaging Flows

#### Transactional Email (Payment Success)

1. Go to Messages > Transactional Messages
2. Create a new transactional message with ID: `payment_success`
3. Design the email template (e.g., "Your coaching session is unlocked!")
4. The webhook will trigger this after successful payment

#### Welcome Campaign

1. Go to Campaigns > Create Campaign
2. Set trigger: Event `user_registered`
3. Design welcome email series
4. Campaign will trigger automatically on registration

#### Broadcast (Newsletter)

1. Go to Broadcasts > Create Broadcast
2. Select audience (all users)
3. Design and send manually

## Calendly Setup

1. Create a Calendly event type: `https://calendly.com/andreasjpappas/30min`
2. The app will automatically embed this in the schedule page for paid users

## Installation & Running

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your credentials
   ```

3. **Run database migrations**:
   - Execute the SQL from "Database Setup" in your Supabase SQL Editor

4. **Start development server**:
   ```bash
   npm run dev
   ```

5. **Open the app**:
   - Navigate to `http://localhost:3000`

## User Flow

1. **Registration** (`/auth/register`)
   - User enters email, name, job, company
   - Receives magic link email
   - Event: `user_registered` → Triggers welcome campaign

2. **Login** (`/auth/login`)
   - User enters email
   - Receives magic link email
   - Redirects to dashboard after authentication

3. **Dashboard** (`/dashboard`)
   - View profile and session status
   - Event: `dashboard_viewed`

4. **Purchase** (`/dashboard/purchase`)
   - View pricing ($99)
   - Click "Continue to Payment"
   - Redirected to Stripe Checkout

5. **Payment Success** (Stripe Webhook)
   - Creates `SessionPurchase` record
   - Events: `payment_completed`, `session_purchased`
   - Sends transactional email: "Your coaching session is unlocked!"

6. **Schedule** (`/dashboard/schedule`)
   - Only accessible if user has paid session
   - Shows Calendly widget
   - Event: `session_booking_opened`

7. **Settings** (`/dashboard/settings`)
   - Update profile
   - Logout
   - Simulate churn (for testing)
   - Event: `user_churned` (on churn)

## Customer.io Event Tracking

### Client-Side Events (JavaScript)

Tracked automatically via Customer.io JS snippet:
- Page views (automatic)
- `user_registered` (on registration)
- Custom events via `track()` function

### Server-Side Events (REST API)

Tracked via `/api/customerio/track` endpoint:
- `user_registered` - After user registration
- `payment_completed` - After successful Stripe payment
- `session_purchased` - After session purchase
- `session_booking_opened` - When user opens schedule page
- `dashboard_viewed` - When user views dashboard
- `user_churned` - When user cancels account

All events are also logged to the `audit_events` table for record-keeping.

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── customerio/
│   │   │   └── track/route.ts          # Server-side event tracking
│   │   └── stripe/
│   │       ├── checkout/route.ts       # Create Stripe checkout session
│   │       └── webhook/route.ts        # Handle Stripe webhooks
│   ├── auth/
│   │   ├── login/page.tsx              # Magic link login
│   │   ├── register/page.tsx           # User registration
│   │   └── callback/route.ts           # Auth callback handler
│   ├── dashboard/
│   │   ├── page.tsx                    # Main dashboard
│   │   ├── purchase/page.tsx           # Stripe checkout page
│   │   ├── schedule/page.tsx           # Calendly scheduling
│   │   └── settings/page.tsx           # User settings
│   └── page.tsx                        # Home page (with booking CTA)
├── components/
│   └── CalendlyBadge.tsx               # Calendly widget component
├── lib/
│   ├── supabase/
│   │   ├── client.ts                   # Browser Supabase client
│   │   ├── server.ts                   # Server Supabase client
│   │   └── admin.ts                    # Admin Supabase client
│   ├── auth.ts                         # Auth helpers
│   ├── stripe.ts                       # Stripe client
│   ├── customerio.ts                   # Customer.io JS client
│   ├── customerio-server.ts            # Customer.io REST API
│   └── audit.ts                        # Audit logging
└── middleware.ts                       # Route protection
```

## Testing the Full Flow

1. **Register a new user**:
   - Go to `/auth/register`
   - Fill in form and submit
   - Check email for magic link
   - Click link to authenticate

2. **Purchase a session**:
   - Go to `/dashboard/purchase`
   - Click "Continue to Payment"
   - Use Stripe test card: `4242 4242 4242 4242`
   - Complete payment

3. **Schedule session**:
   - After payment, redirect to `/dashboard/schedule`
   - Calendly widget should appear
   - Book a time slot

4. **Verify events in Customer.io**:
   - Check Customer.io dashboard for events
   - Verify transactional email was sent
   - Check welcome campaign triggered

## Troubleshooting

### Authentication Issues

- Ensure Supabase Auth is enabled
- Check email provider settings in Supabase
- Verify redirect URLs are configured correctly

### Stripe Webhook Issues

- Use Stripe CLI for local testing: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- Check webhook secret matches in `.env.local`
- Verify webhook endpoint is accessible

### Customer.io Events Not Appearing

- Check API credentials in `.env.local`
- Verify site ID matches your Customer.io account
- Check browser console for JS tracking errors
- Review server logs for API errors

### Calendly Not Loading

- Verify Calendly URL is correct: `https://calendly.com/andreasjpappas/30min`
- Check browser console for script loading errors
- Ensure user has paid session (check database)

## License

This project is for demonstration purposes.

## Support

For issues or questions, please refer to the documentation of the respective services:
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [Customer.io Documentation](https://customer.io/docs)
- [Calendly Documentation](https://developer.calendly.com/api-docs)


