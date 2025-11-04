-- =====================================================
-- SCAN CREDIT SYSTEM V2
-- =====================================================
-- Implements tiered scan credit system with monthly resets
-- Free: 10 scans lifetime
-- Member ($4.99): 200 scans/month
-- Premium ($14.99): 1200 scans/month
-- Moderator: 500 scans/month
-- Admin: Unlimited
-- =====================================================

-- 1. Add columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS scan_credits INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS scan_credits_used_this_month INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS membership_tier TEXT DEFAULT 'free' CHECK (membership_tier IN ('free', 'member', 'premium', 'moderator', 'admin')),
ADD COLUMN IF NOT EXISTS credits_reset_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS lifetime_scans_used INTEGER DEFAULT 0;

-- 2. Create scan_credit_transactions table
CREATE TABLE IF NOT EXISTS scan_credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- Positive for credits added, negative for credits used
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'scan', 'monthly_reset', 'admin_grant', 'membership_grant')),
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_scan_credit_transactions_user_id ON scan_credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_credit_transactions_created_at ON scan_credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_membership_tier ON profiles(membership_tier);

-- 4. Set admin users to unlimited credits
UPDATE profiles 
SET 
  membership_tier = 'admin',
  scan_credits = 999999,
  scan_credits_used_this_month = 0
WHERE email IN ('topher.cook7@gmail.com', 'andrew.beck@example.com');

-- 5. Create function to get monthly credit limit based on tier
CREATE OR REPLACE FUNCTION get_monthly_credit_limit(tier TEXT)
RETURNS INTEGER AS $$
BEGIN
  CASE tier
    WHEN 'free' THEN RETURN 0; -- Free users get 10 lifetime, no monthly reset
    WHEN 'member' THEN RETURN 200;
    WHEN 'premium' THEN RETURN 1200;
    WHEN 'moderator' THEN RETURN 500;
    WHEN 'admin' THEN RETURN 999999;
    ELSE RETURN 0;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- 6. Create function to check if user has credits
CREATE OR REPLACE FUNCTION has_scan_credits(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_profile RECORD;
  v_monthly_limit INTEGER;
BEGIN
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Admins always have credits
  IF v_profile.membership_tier = 'admin' THEN
    RETURN TRUE;
  END IF;
  
  -- Free users: check lifetime credits
  IF v_profile.membership_tier = 'free' THEN
    RETURN v_profile.scan_credits > 0;
  END IF;
  
  -- Paid users: check monthly credits
  v_monthly_limit := get_monthly_credit_limit(v_profile.membership_tier);
  RETURN v_profile.scan_credits_used_this_month < v_monthly_limit;
END;
$$ LANGUAGE plpgsql;

-- 7. Create function to deduct scan credit
CREATE OR REPLACE FUNCTION deduct_scan_credit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_profile RECORD;
  v_monthly_limit INTEGER;
BEGIN
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Admins: no deduction
  IF v_profile.membership_tier = 'admin' THEN
    -- Log the scan but don't deduct
    INSERT INTO scan_credit_transactions (user_id, amount, transaction_type, description)
    VALUES (p_user_id, 0, 'scan', 'Admin scan (unlimited)');
    RETURN TRUE;
  END IF;
  
  -- Free users: deduct from lifetime credits
  IF v_profile.membership_tier = 'free' THEN
    IF v_profile.scan_credits <= 0 THEN
      RETURN FALSE;
    END IF;
    
    UPDATE profiles 
    SET 
      scan_credits = scan_credits - 1,
      lifetime_scans_used = lifetime_scans_used + 1
    WHERE id = p_user_id;
    
    INSERT INTO scan_credit_transactions (user_id, amount, transaction_type, description)
    VALUES (p_user_id, -1, 'scan', 'Free tier scan');
    
    RETURN TRUE;
  END IF;
  
  -- Paid users: check monthly limit
  v_monthly_limit := get_monthly_credit_limit(v_profile.membership_tier);
  
  IF v_profile.scan_credits_used_this_month >= v_monthly_limit THEN
    RETURN FALSE;
  END IF;
  
  UPDATE profiles 
  SET 
    scan_credits_used_this_month = scan_credits_used_this_month + 1,
    lifetime_scans_used = lifetime_scans_used + 1
  WHERE id = p_user_id;
  
  INSERT INTO scan_credit_transactions (user_id, amount, transaction_type, description)
  VALUES (p_user_id, -1, 'scan', v_profile.membership_tier || ' tier scan');
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 8. Create function to add credits (for purchases)
CREATE OR REPLACE FUNCTION add_scan_credits(p_user_id UUID, p_amount INTEGER, p_description TEXT DEFAULT 'Credit purchase')
RETURNS BOOLEAN AS $$
BEGIN
  -- For free users, add to lifetime credits
  UPDATE profiles 
  SET scan_credits = scan_credits + p_amount
  WHERE id = p_user_id AND membership_tier = 'free';
  
  -- For paid users, this would be handled differently (maybe add to monthly allowance)
  -- For now, we'll just log it
  INSERT INTO scan_credit_transactions (user_id, amount, transaction_type, description)
  VALUES (p_user_id, p_amount, 'purchase', p_description);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 9. Create function to reset monthly credits (run via cron)
CREATE OR REPLACE FUNCTION reset_monthly_credits()
RETURNS INTEGER AS $$
DECLARE
  v_reset_count INTEGER := 0;
BEGIN
  -- Reset monthly usage for all paid users
  UPDATE profiles 
  SET 
    scan_credits_used_this_month = 0,
    credits_reset_at = NOW()
  WHERE membership_tier IN ('member', 'premium', 'moderator', 'admin')
    AND credits_reset_at < NOW() - INTERVAL '1 month';
  
  GET DIAGNOSTICS v_reset_count = ROW_COUNT;
  
  -- Log the reset
  INSERT INTO scan_credit_transactions (user_id, amount, transaction_type, description)
  SELECT id, 0, 'monthly_reset', 'Monthly credit reset'
  FROM profiles
  WHERE membership_tier IN ('member', 'premium', 'moderator', 'admin')
    AND credits_reset_at >= NOW() - INTERVAL '1 minute';
  
  RETURN v_reset_count;
END;
$$ LANGUAGE plpgsql;

-- 10. Create function to upgrade membership tier
CREATE OR REPLACE FUNCTION upgrade_membership_tier(p_user_id UUID, p_new_tier TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_monthly_limit INTEGER;
BEGIN
  v_monthly_limit := get_monthly_credit_limit(p_new_tier);
  
  UPDATE profiles 
  SET 
    membership_tier = p_new_tier,
    scan_credits_used_this_month = 0,
    credits_reset_at = NOW()
  WHERE id = p_user_id;
  
  INSERT INTO scan_credit_transactions (user_id, amount, transaction_type, description)
  VALUES (p_user_id, v_monthly_limit, 'membership_grant', 'Upgraded to ' || p_new_tier);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 11. Enable RLS on scan_credit_transactions
ALTER TABLE scan_credit_transactions ENABLE ROW LEVEL SECURITY;

-- 12. RLS Policies for scan_credit_transactions
CREATE POLICY "Users can view their own transactions"
  ON scan_credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
  ON scan_credit_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'owner', 'moderator')
    )
  );

-- 13. Create view for credit balance
CREATE OR REPLACE VIEW user_credit_balance AS
SELECT 
  p.id,
  p.email,
  p.membership_tier,
  p.scan_credits AS lifetime_credits,
  p.scan_credits_used_this_month,
  p.lifetime_scans_used,
  p.credits_reset_at,
  CASE 
    WHEN p.membership_tier = 'free' THEN p.scan_credits
    WHEN p.membership_tier = 'admin' THEN 999999
    ELSE get_monthly_credit_limit(p.membership_tier) - p.scan_credits_used_this_month
  END AS credits_remaining,
  get_monthly_credit_limit(p.membership_tier) AS monthly_limit
FROM profiles p;

-- 14. Grant permissions
GRANT SELECT ON user_credit_balance TO authenticated;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Check admin credits:
-- SELECT * FROM user_credit_balance WHERE email IN ('topher.cook7@gmail.com', 'andrew.beck@example.com');

-- Test credit deduction:
-- SELECT deduct_scan_credit('USER_ID_HERE');

-- Check remaining credits:
-- SELECT * FROM user_credit_balance WHERE id = 'USER_ID_HERE';

-- Manual credit grant:
-- SELECT add_scan_credits('USER_ID_HERE', 100, 'Admin grant');

