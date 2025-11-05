-- Check if you're set up as admin
SELECT 
  email,
  membership_tier,
  scan_credits,
  scan_credits_used_this_month,
  role
FROM profiles 
WHERE email = 'topher.cook7@gmail.com';

-- Expected:
-- membership_tier: 'admin'
-- scan_credits: 999999
-- role: 'admin' or 'owner'

