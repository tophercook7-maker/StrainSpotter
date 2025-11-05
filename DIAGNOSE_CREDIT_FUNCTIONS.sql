-- Diagnostic: Check if credit functions exist and work

-- 1. Check if functions exist
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_name IN ('has_scan_credits', 'deduct_scan_credit', 'get_monthly_credit_limit', 'add_scan_credits')
ORDER BY routine_name;

-- Should return 4 functions

-- 2. Check your profile
SELECT 
  id,
  email,
  membership_tier,
  scan_credits,
  scan_credits_used_this_month,
  role
FROM profiles 
WHERE email = 'topher.cook7@gmail.com';

-- 3. Test has_scan_credits function directly
DO $$
DECLARE
  v_user_id UUID;
  v_has_credits BOOLEAN;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE email = 'topher.cook7@gmail.com';
  SELECT has_scan_credits(v_user_id) INTO v_has_credits;
  RAISE NOTICE 'User ID: %, Has Credits: %', v_user_id, v_has_credits;
END $$;

-- 4. Test deduct_scan_credit function directly
DO $$
DECLARE
  v_user_id UUID;
  v_result BOOLEAN;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE email = 'topher.cook7@gmail.com';
  SELECT deduct_scan_credit(v_user_id) INTO v_result;
  RAISE NOTICE 'User ID: %, Deduct Result: %', v_user_id, v_result;
END $$;

-- 5. Check credit balance view
SELECT * FROM user_credit_balance WHERE email = 'topher.cook7@gmail.com';

