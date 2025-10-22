-- Membership Tracking System
-- Run this in Supabase SQL Editor

-- Create memberships table to track paid members
CREATE TABLE IF NOT EXISTS memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),
  tier TEXT DEFAULT 'full' CHECK (tier IN ('trial', 'full', 'premium')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  payment_amount DECIMAL(10,2),
  payment_method TEXT,
  payment_reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create trial_usage table to track "Try Me" scans
CREATE TABLE IF NOT EXISTS trial_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL, -- For anonymous users (fingerprint/IP)
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- For logged-in users
  scan_count INTEGER DEFAULT 0,
  search_count INTEGER DEFAULT 0,
  trial_started_at TIMESTAMPTZ DEFAULT now(),
  trial_expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '7 days'),
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(session_id),
  UNIQUE(user_id)
);

-- Create membership_applications table for join requests
CREATE TABLE IF NOT EXISTS membership_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  payment_received BOOLEAN DEFAULT false,
  payment_amount DECIMAL(10,2),
  payment_reference TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_email ON memberships(email);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON memberships(status);
CREATE INDEX IF NOT EXISTS idx_trial_usage_session ON trial_usage(session_id);
CREATE INDEX IF NOT EXISTS idx_trial_usage_user ON trial_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_membership_applications_status ON membership_applications(status);
CREATE INDEX IF NOT EXISTS idx_membership_applications_email ON membership_applications(email);

-- Add RLS policies (adjust based on your auth setup)
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_applications ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access to memberships" ON memberships
  FOR ALL USING (true);

CREATE POLICY "Service role full access to trial_usage" ON trial_usage
  FOR ALL USING (true);

CREATE POLICY "Service role full access to membership_applications" ON membership_applications
  FOR ALL USING (true);

-- Users can view their own membership
CREATE POLICY "Users can view own membership" ON memberships
  FOR SELECT USING (auth.uid() = user_id);

-- Users can view their own trial usage
CREATE POLICY "Users can view own trial usage" ON trial_usage
  FOR SELECT USING (auth.uid() = user_id);

-- Anyone can submit a membership application
CREATE POLICY "Anyone can submit membership application" ON membership_applications
  FOR INSERT WITH CHECK (true);

-- Users can view their own applications
CREATE POLICY "Users can view own applications" ON membership_applications
  FOR SELECT USING (email = auth.jwt()->>'email');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables
DROP TRIGGER IF EXISTS update_memberships_updated_at ON memberships;
CREATE TRIGGER update_memberships_updated_at
  BEFORE UPDATE ON memberships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_membership_applications_updated_at ON membership_applications;
CREATE TRIGGER update_membership_applications_updated_at
  BEFORE UPDATE ON membership_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create view for active members
CREATE OR REPLACE VIEW active_members AS
SELECT 
  m.id,
  m.user_id,
  m.email,
  m.full_name,
  m.tier,
  m.joined_at,
  m.expires_at,
  CASE 
    WHEN m.expires_at IS NULL THEN true
    WHEN m.expires_at > now() THEN true
    ELSE false
  END as is_active
FROM memberships m
WHERE m.status = 'active';

COMMENT ON TABLE memberships IS 'Tracks paid club members with subscription details';
COMMENT ON TABLE trial_usage IS 'Tracks Try Me trial usage (2 scans + 2 searches per session)';
COMMENT ON TABLE membership_applications IS 'Stores membership join requests for admin review';
