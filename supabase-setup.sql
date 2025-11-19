-- Coaching Session Booking App - Database Setup
-- Run this in your Supabase SQL Editor

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  job TEXT,
  company TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Session purchases table
CREATE TABLE IF NOT EXISTS session_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_session_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit events table (for tracking all events)
CREATE TABLE IF NOT EXISTS audit_events (
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

-- Drop existing policies if they exist (for re-running)
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can view own purchases" ON session_purchases;
DROP POLICY IF EXISTS "Users can view own audit events" ON audit_events;
DROP POLICY IF EXISTS "Service role full access" ON users;
DROP POLICY IF EXISTS "Service role full access purchases" ON session_purchases;
DROP POLICY IF EXISTS "Service role full access audit" ON audit_events;

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
-- Note: These policies allow the service role to bypass RLS
-- The service role key should be kept secret and only used server-side
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_session_purchases_user_id ON session_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_session_purchases_status ON session_purchases(status);
CREATE INDEX IF NOT EXISTS idx_audit_events_user_id ON audit_events(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_event_name ON audit_events(event_name);
CREATE INDEX IF NOT EXISTS idx_audit_events_created_at ON audit_events(created_at);


