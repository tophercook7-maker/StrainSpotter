-- Fix RLS policies to allow credit system functions to work

-- The issue: Database functions run with the caller's permissions
-- Solution: Make the functions run with SECURITY DEFINER (as the function owner)

-- 1. Recreate deduct_scan_credit with SECURITY DEFINER
CREATE OR REPLACE FUNCTION deduct_scan_credit(p_user_id UUID)
RETURNS BOOLEAN 
SECURITY DEFINER  -- This makes it run as the function owner (postgres), bypassing RLS
SET search_path = public
AS $$
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
  
  -- Increment monthly usage
  UPDATE profiles 
  SET 
    scan_credits_used_this_month = scan_credits_used_this_month + 1,
    lifetime_scans_used = lifetime_scans_used + 1
  WHERE id = p_user_id;
  
  INSERT INTO scan_credit_transactions (user_id, amount, transaction_type, description)
  VALUES (p_user_id, -1, 'scan', CONCAT(v_profile.membership_tier, ' tier scan'));
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 2. Recreate add_scan_credits with SECURITY DEFINER
CREATE OR REPLACE FUNCTION add_scan_credits(p_user_id UUID, p_amount INTEGER, p_description TEXT)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile RECORD;
BEGIN
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- For free users, add to lifetime credits
  IF v_profile.membership_tier = 'free' THEN
    UPDATE profiles 
    SET scan_credits = scan_credits + p_amount
    WHERE id = p_user_id;
  END IF;
  
  -- Log the transaction
  INSERT INTO scan_credit_transactions (user_id, amount, transaction_type, description)
  VALUES (p_user_id, p_amount, 'admin_grant', p_description);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 3. Recreate upgrade_membership_tier with SECURITY DEFINER
CREATE OR REPLACE FUNCTION upgrade_membership_tier(p_user_id UUID, p_new_tier TEXT)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_monthly_limit INTEGER;
BEGIN
  -- Validate tier
  IF p_new_tier NOT IN ('free', 'member', 'premium', 'moderator', 'admin') THEN
    RETURN FALSE;
  END IF;
  
  v_monthly_limit := get_monthly_credit_limit(p_new_tier);
  
  -- Update membership tier and reset monthly usage
  UPDATE profiles 
  SET 
    membership_tier = p_new_tier,
    scan_credits_used_this_month = 0,
    credits_reset_at = NOW()
  WHERE id = p_user_id;
  
  -- Log the upgrade
  INSERT INTO scan_credit_transactions (user_id, amount, transaction_type, description)
  VALUES (p_user_id, 0, 'membership_grant', CONCAT('Upgraded to ', p_new_tier, ' tier'));
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 4. Grant execute permissions
GRANT EXECUTE ON FUNCTION deduct_scan_credit(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION deduct_scan_credit(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION deduct_scan_credit(UUID) TO anon;

GRANT EXECUTE ON FUNCTION add_scan_credits(UUID, INTEGER, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION add_scan_credits(UUID, INTEGER, TEXT) TO authenticated;

GRANT EXECUTE ON FUNCTION upgrade_membership_tier(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION upgrade_membership_tier(UUID, TEXT) TO authenticated;

-- 5. Verify it worked
SELECT 'Functions updated with SECURITY DEFINER' as status;

