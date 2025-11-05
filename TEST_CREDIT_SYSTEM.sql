-- Test if credit system is installed
-- Run this in Supabase SQL Editor to check

-- Test 1: Check if columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name IN ('membership_tier', 'scan_credits', 'scan_credits_used_this_month')
ORDER BY column_name;

-- Expected result: Should return 3 rows
-- If you get 0 rows, the migration hasn't been run yet!

-- Test 2: Check if functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name IN ('has_scan_credits', 'deduct_scan_credit', 'get_monthly_credit_limit')
ORDER BY routine_name;

-- Expected result: Should return 3 rows
-- If you get 0 rows, the migration hasn't been run yet!

-- Test 3: Check your user
SELECT 
  email,
  membership_tier,
  scan_credits,
  scan_credits_used_this_month
FROM profiles 
WHERE email = 'topher.cook7@gmail.com';

-- Expected result: 
-- membership_tier: 'admin'
-- scan_credits: 999999
-- scan_credits_used_this_month: 0

