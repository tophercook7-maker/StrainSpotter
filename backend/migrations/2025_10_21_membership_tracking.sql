-- Membership Tracking System
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),
  tier TEXT DEFAULT 'scan-only' CHECK (tier IN ('scan-only', 'full-access')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  payment_amount DECIMAL(10,2),
  payment_method TEXT,
  payment_reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add index for user_id and lower(email)
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_email_lower ON memberships (lower(email));
CREATE UNIQUE INDEX IF NOT EXISTS uq_memberships_email_active ON memberships (lower(email)) WHERE status = 'active';

-- Create trial_usage table to track "Try Me" scans

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
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add index for lower(email)
CREATE INDEX IF NOT EXISTS idx_membership_applications_email_lower ON membership_applications (lower(email));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_email ON memberships(email);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON memberships(status);
CREATE INDEX IF NOT EXISTS idx_membership_applications_status ON membership_applications(status);
CREATE INDEX IF NOT EXISTS idx_membership_applications_email ON membership_applications(email);

-- Add RLS policies (adjust based on your auth setup)

ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_applications ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access to memberships" ON memberships
  FOR ALL USING (true);


CREATE POLICY "Service role full access to membership_applications" ON membership_applications
  FOR ALL USING (true);

-- Users can view their own membership by user_id or email
CREATE POLICY "Users can view own membership" ON memberships
  FOR SELECT USING (auth.uid() = user_id OR lower(email) = lower(auth.jwt()->>'email'));

-- Users can view their own trial usage

-- Anyone can submit a membership application
CREATE POLICY "Anyone can submit membership application" ON membership_applications
  FOR INSERT WITH CHECK (true);

-- Users can view their own applications
CREATE POLICY "Users can view own applications" ON membership_applications
  FOR SELECT USING (lower(email) = lower(auth.jwt()->>'email'));

-- Admins can update any membership or application
CREATE POLICY "Admins can manage memberships" ON memberships
  FOR ALL USING (public.is_admin());

CREATE POLICY "Admins can manage membership_applications" ON membership_applications
  FOR ALL USING (public.is_admin());

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

CREATE OR REPLACE FUNCTION set_updated_by_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_by := auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_membership_applications_updated_by ON membership_applications;
CREATE TRIGGER set_membership_applications_updated_by
  BEFORE UPDATE ON membership_applications
  FOR EACH ROW EXECUTE FUNCTION set_updated_by_column();

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
COMMENT ON TABLE membership_applications IS 'Stores membership join requests for admin review';
