# Customer.io Domain Verification - DNS Setup Guide

## Where to Add DNS Records

### Option 1: Domain Managed in Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Domains**
4. Click on your domain name
5. Click the **DNS** tab
6. Add the DNS records provided by Customer.io

### Option 2: Domain Managed Elsewhere
If your domain is registered with another provider (Namecheap, GoDaddy, Cloudflare, etc.):

1. **Log into your domain registrar/DNS provider**
   - Namecheap: https://www.namecheap.com → Domain List → Manage → Advanced DNS
   - GoDaddy: https://www.godaddy.com → My Products → DNS
   - Cloudflare: https://dash.cloudflare.com → Select domain → DNS
   - Google Domains: https://domains.google.com → DNS

2. **Navigate to DNS Management**
   - Look for "DNS Settings", "DNS Management", "DNS Records", or "Advanced DNS"

3. **Add the DNS records provided by Customer.io**
   - Customer.io will show you the exact records to add in their domain verification page
   - Typically includes: SPF, DKIM, and sometimes DMARC records

## Common DNS Record Types for Customer.io

### SPF Record (TXT)
- **Type**: TXT
- **Name/Host**: `@` or your domain name
- **Value**: Provided by Customer.io (usually starts with `v=spf1`)

### DKIM Record (TXT)
- **Type**: TXT
- **Name/Host**: Usually something like `customerio._domainkey` or similar
- **Value**: Provided by Customer.io (long string)

### DMARC Record (TXT) - Optional but recommended
- **Type**: TXT
- **Name/Host**: `_dmarc`
- **Value**: Provided by Customer.io

## Steps in Customer.io

1. Go to Customer.io dashboard: https://fly.customer.io
2. Navigate to **Settings** → **Sending Domains** (or **Email** → **Sending Domains**)
3. Click **Add Domain** or **Verify Domain**
4. Enter your domain name
5. Customer.io will show you the exact DNS records to add
6. Copy each record and add it to your DNS provider
7. Wait for DNS propagation (can take a few minutes to 48 hours)
8. Click **Verify** in Customer.io to check if records are detected

## Quick Links

- **Vercel Domains**: https://vercel.com/dashboard → Settings → Domains
- **Customer.io Dashboard**: https://fly.customer.io
- **Customer.io Domain Setup Docs**: Check Customer.io's help documentation for the latest instructions

## Notes

- DNS changes can take up to 48 hours to propagate globally, but usually happen within minutes
- Make sure you're adding records to the correct domain (root domain vs subdomain)
- If you're using a subdomain (e.g., `mail.yourdomain.com`), add records for that subdomain
- After adding records, use Customer.io's verification tool to check status

