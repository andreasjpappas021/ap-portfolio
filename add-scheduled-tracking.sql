-- Add scheduled_at field to track when user has scheduled their session
ALTER TABLE session_purchases 
ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP WITH TIME ZONE;

-- Add session_prep table to store prep information
CREATE TABLE IF NOT EXISTS session_prep (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purchase_id UUID REFERENCES session_purchases(id) ON DELETE CASCADE,
  questions TEXT[],
  strengths TEXT,
  weaknesses TEXT,
  goals TEXT,
  challenges TEXT,
  context TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE session_prep ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own prep" ON session_prep;
DROP POLICY IF EXISTS "Users can update own prep" ON session_prep;
DROP POLICY IF EXISTS "Service role full access prep" ON session_prep;

CREATE POLICY "Users can view own prep"
  ON session_prep FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own prep"
  ON session_prep FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access prep"
  ON session_prep FOR ALL
  USING (true)
  WITH CHECK (true);


