# Customer.io Integration Testing Guide

This guide will help you test your Customer.io integration before shipping to production.

## Prerequisites

1. ✅ Environment variables are set in `.env.local`:
   - `NEXT_PUBLIC_CIO_JS_KEY`
   - `CIO_API_KEY`
   - `NEXT_PUBLIC_CIO_SITE_ID`
   - `NEXT_PUBLIC_CIO_ANON_INAPP` (optional)

2. ✅ Development server is running: `npm run dev`

3. ✅ Customer.io dashboard access: https://fly.customer.io

---

## 1. Verify Environment Setup

### Check Environment Variables

```bash
# Verify variables are loaded (in your terminal)
grep -E "^NEXT_PUBLIC_CIO_|^CIO_" .env.local
```

Expected output should show:
- `NEXT_PUBLIC_CIO_JS_KEY=...`
- `CIO_API_KEY=...`
- `NEXT_PUBLIC_CIO_SITE_ID=...`

### Check Server Console

Start your dev server and check for any warnings:
```bash
npm run dev
```

Look for:
- ❌ `[Customer.io] Missing CIO_API_KEY or site ID` - means env vars aren't loaded
- ✅ No warnings - good!

---

## 2. Test Client-Side Integration (Browser)

### A. Verify Script Loading

1. Open your app in browser: `http://localhost:3000`
2. Open browser DevTools (F12)
3. Go to **Console** tab
4. Check for Customer.io script:
   ```javascript
   // Run this in console:
   window.cioanalytics
   ```
   - ✅ Should return an object or array (not `undefined`)
   - ❌ If `undefined`, check that `NEXT_PUBLIC_CIO_JS_KEY` is set

5. Check **Network** tab:
   - Filter by "customer.io" or "analytics"
   - You should see requests to `cdp.customer.io`

### B. Test Page View Tracking

1. Navigate to different pages:
   - `/` (home)
   - `/dashboard`
   - `/dashboard/schedule`
   - `/dashboard/settings`

2. In **Network** tab, look for:
   - Requests to Customer.io analytics endpoints
   - Each page navigation should trigger a `page` event

3. In Customer.io dashboard:
   - Go to **Data & Integrations** → **Activity**
   - You should see page view events appearing

### C. Test Client-Side Event Tracking

1. Open browser console
2. Run the debug helper (if available):
   ```javascript
   // If you have debugCustomerIO() exported, you can call it
   // Or manually test:
   window.cioanalytics.track('test_event', { test: true })
   ```

3. Check Customer.io dashboard for the test event

### D. Test User Identification (Client-Side)

1. Log in to your app
2. In browser console, check if user is identified:
   ```javascript
   // Check if identify was called
   // This happens automatically on login/registration
   ```

---

## 3. Test Server-Side Integration

### A. Test Registration Flow

1. **Create a new test user:**
   - Go to `/auth/register`
   - Fill out the form and register
   - This should trigger:
     - `identifyUser()` - creates/updates user in Customer.io
     - `trackEvent(user.id, 'user_registered', ...)` - tracks registration

2. **Check server logs:**
   - Look for any `[Customer.io]` warnings or errors
   - Should see no errors if credentials are correct

3. **Verify in Customer.io:**
   - Go to **People** → Search for the test user's email
   - User should exist with attributes (name, job, company)
   - Check **Activity** tab - should see `user_registered` event

### B. Test Dashboard View Event

1. **Log in and visit dashboard:**
   - Go to `/dashboard`
   - This triggers `trackEvent(user.id, 'dashboard_viewed', ...)`

2. **Verify in Customer.io:**
   - Go to user's profile in Customer.io
   - Check **Activity** - should see `dashboard_viewed` event

### C. Test API Endpoint Directly

Test the `/api/customerio/track` endpoint:

```bash
# Replace USER_ID with an actual user ID from your database
curl -X POST http://localhost:3000/api/customerio/track \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID",
    "eventName": "test_event",
    "data": {
      "test": true,
      "timestamp": "2024-01-01"
    }
  }'
```

Expected response:
```json
{ "success": true }
```

Then verify in Customer.io dashboard that the event appears.

### D. Test Payment Flow (Stripe Webhook)

1. **Make a test purchase:**
   - Use Stripe test mode
   - Complete a checkout flow
   - This triggers webhook → `trackEvent()` for:
     - `payment_completed`
     - `session_purchased`

2. **Verify in Customer.io:**
   - Check user's activity for payment events
   - Verify transactional email was sent (if configured)

---

## 4. Verify in Customer.io Dashboard

### A. Check User Profiles

1. Go to **People** in Customer.io
2. Search for test users by email
3. Verify:
   - ✅ User exists
   - ✅ Attributes are correct (name, email, job, company)
   - ✅ User ID matches your database user ID

### B. Check Events

1. Go to **Data & Integrations** → **Activity**
2. Filter by:
   - User email
   - Event name (e.g., `user_registered`, `dashboard_viewed`)
3. Verify:
   - ✅ Events appear within a few seconds
   - ✅ Event data is correct
   - ✅ Timestamps are accurate

### C. Check API Credentials

1. Go to **Settings** → **API Credentials**
2. Verify:
   - ✅ App API Key matches your `CIO_API_KEY`
   - ✅ Site ID matches your `NEXT_PUBLIC_CIO_SITE_ID`

---

## 5. Test Error Handling

### A. Test Missing Credentials

Temporarily remove an env var to test error handling:

```bash
# Comment out CIO_API_KEY in .env.local
# CIO_API_KEY=...
```

Then try to trigger a server-side event. Should:
- ✅ Not crash the app
- ✅ Log a warning in console
- ✅ Continue functioning (graceful degradation)

### B. Test Invalid Credentials

If you have old credentials, test that invalid ones fail gracefully:
- Should log errors but not crash
- Should not break user experience

---

## 6. Test Specific User Flows

### Flow 1: New User Registration

1. Register new user → Should create user in Customer.io
2. Check Customer.io → User profile created
3. Check events → `user_registered` event present

### Flow 2: Returning User Login

1. Log in existing user → Should identify user
2. Visit dashboard → `dashboard_viewed` event
3. Check Customer.io → User attributes updated

### Flow 3: Session Booking

1. Log in
2. Go to `/dashboard/schedule` → `session_booking_opened` event
3. Complete booking → Check for booking events

### Flow 4: Payment

1. Complete Stripe checkout
2. Check webhook logs → Payment events tracked
3. Check Customer.io → `payment_completed` and `session_purchased` events

---

## 7. Debug Tools

### Browser Console Debug

```javascript
// Check if Customer.io is loaded
console.log(window.cioanalytics)

// Manually track an event
window.cioanalytics.track('manual_test', { source: 'console' })

// Check queue (if pre-initialization)
if (Array.isArray(window.cioanalytics)) {
  console.log('Queue:', window.cioanalytics)
}
```

### Server-Side Debug

Check your server logs for:
- `[Customer.io]` prefixed messages
- Any errors or warnings
- API response status codes

### Network Tab Debug

1. Open DevTools → Network tab
2. Filter by "customer.io"
3. Check:
   - ✅ Requests are being made
   - ✅ Status codes are 200/201 (success)
   - ❌ 401 = authentication error (check API key)
   - ❌ 404 = wrong endpoint (check site ID)

---

## 8. Production Checklist

Before shipping, verify:

- [ ] All environment variables set in production
- [ ] Test user registration works
- [ ] Test events appear in Customer.io dashboard
- [ ] Test payment flow triggers events
- [ ] No console errors in production
- [ ] Customer.io dashboard shows correct user data
- [ ] Page views are being tracked
- [ ] Server-side events are working
- [ ] Error handling works (graceful degradation)

---

## Common Issues & Solutions

### Issue: Events not appearing in Customer.io

**Check:**
1. Environment variables are set correctly
2. API key and Site ID match Customer.io dashboard
3. User ID format is correct (should match your database)
4. Network requests are succeeding (check Network tab)

### Issue: "Missing CIO_API_KEY" warnings

**Solution:**
- Restart dev server after updating `.env.local`
- Verify `.env.local` is in project root
- Check for typos in variable names

### Issue: 401 Unauthorized errors

**Solution:**
- Verify `CIO_API_KEY` matches Customer.io dashboard
- Verify `NEXT_PUBLIC_CIO_SITE_ID` matches Customer.io dashboard
- Check that credentials are for the correct workspace

### Issue: Client-side script not loading

**Solution:**
- Verify `NEXT_PUBLIC_CIO_JS_KEY` is set
- Check browser console for script errors
- Verify script tag is in `app/layout.tsx`

---

## Quick Test Script

Run this in your browser console after logging in:

```javascript
// Quick test of Customer.io integration
console.log('Customer.io Status:', {
  loaded: !!window.cioanalytics,
  type: typeof window.cioanalytics,
  isArray: Array.isArray(window.cioanalytics)
})

// Test track
if (window.cioanalytics) {
  window.cioanalytics.track('browser_test', {
    timestamp: new Date().toISOString(),
    test: true
  })
  console.log('✅ Test event sent!')
}
```

Then check Customer.io dashboard for the `browser_test` event.

---

## Need Help?

- Check Customer.io docs: https://customer.io/docs
- Check server logs for `[Customer.io]` messages
- Verify credentials in Customer.io dashboard
- Test with a fresh test user account

