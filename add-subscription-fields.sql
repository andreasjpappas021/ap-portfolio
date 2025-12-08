-- Add subscription tracking fields to session_purchases table
-- Run this in your Supabase SQL Editor

-- Add stripe_subscription_id to link to Stripe subscription
ALTER TABLE session_purchases 
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Add subscription_status to track current subscription state
ALTER TABLE session_purchases 
ADD COLUMN IF NOT EXISTS subscription_status TEXT 
CHECK (subscription_status IN ('active', 'cancelled', 'past_due'));

-- Add stripe_customer_id to enable Customer Portal access
ALTER TABLE session_purchases 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Create index for faster subscription lookups
CREATE INDEX IF NOT EXISTS idx_session_purchases_subscription_id 
ON session_purchases(stripe_subscription_id);

CREATE INDEX IF NOT EXISTS idx_session_purchases_subscription_status 
ON session_purchases(subscription_status);

CREATE INDEX IF NOT EXISTS idx_session_purchases_customer_id 
ON session_purchases(stripe_customer_id);

