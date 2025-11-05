-- STEP 1: Check current status
SELECT 
  id,
  email,
  membership_tier,
  scan_credits,
  scan_credits_used_this_month,
  role
FROM profiles 
WHERE email = 'topher.cook7@gmail.com';

-- STEP 2: Fix your account (run this!)
UPDATE profiles 
SET 
  membership_tier = 'admin',
  scan_credits = 999999,
  scan_credits_used_this_month = 0,
  role = 'admin'
WHERE email = 'topher.cook7@gmail.com';

-- STEP 3: Verify it worked
SELECT 
  id,
  email,
  membership_tier,
  scan_credits,
  scan_credits_used_this_month,
  role
FROM profiles 
WHERE email = 'topher.cook7@gmail.com';

-- STEP 4: Test the credit check function
SELECT has_scan_credits(id) as has_credits
FROM profiles 
WHERE email = 'topher.cook7@gmail.com';

-- Should return: TRUE

-- STEP 5: Test credit deduction (should work for admin)
SELECT deduct_scan_credit(id) as deduct_result
FROM profiles 
WHERE email = 'topher.cook7@gmail.com';

-- Should return: TRUE

