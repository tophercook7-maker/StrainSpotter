-- Quick fix: Check and setup credit system for your user
-- Run this in Supabase SQL Editor

-- 1. Check if the credit system is set up
SELECT 
  id,
  email,
  membership_tier,
  scan_credits,
  scan_credits_used_this_month
FROM profiles 
WHERE email = 'topher.cook7@gmail.com';

-- 2. If the columns don't exist, you need to run the migration first
-- Go to: backend/migrations/20251104_scan_credit_system_v2.sql
-- Copy the entire file and run it in Supabase SQL Editor

-- 3. After migration, verify admin setup:
SELECT * FROM user_credit_balance WHERE email = 'topher.cook7@gmail.com';

-- 4. If you're not showing as admin, run this:
UPDATE profiles 
SET 
  membership_tier = 'admin',
  scan_credits = 999999,
  scan_credits_used_this_month = 0
WHERE email = 'topher.cook7@gmail.com';

-- 5. Test the credit check function:
SELECT has_scan_credits(id) FROM profiles WHERE email = 'topher.cook7@gmail.com';

-- 6. Test credit deduction (should return TRUE for admin):
SELECT deduct_scan_credit(id) FROM profiles WHERE email = 'topher.cook7@gmail.com';

