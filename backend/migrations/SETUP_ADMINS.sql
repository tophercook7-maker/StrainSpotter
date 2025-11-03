-- Setup Topher and Andrew as Admin/Owner/Moderators
-- Run this in Supabase SQL Editor

-- Setup Topher as Admin/Owner/Moderator
UPDATE profiles SET
  display_name = 'Topher Cook',
  avatar_url = 'https://api.dicebear.com/7.x/bottts/svg?seed=topher&backgroundColor=10b981',
  bio = 'Founder & Head Cultivator of StrainSpotter 🌿',
  is_grower = true,
  grower_license_status = 'licensed',
  grower_experience_years = 15,
  grower_bio = 'Founder of StrainSpotter with 15+ years of cultivation experience.',
  grower_specialties = ARRAY['indoor', 'outdoor', 'organic', 'hydroponics'],
  grower_city = 'Denver',
  grower_state = 'Colorado',
  grower_farm_name = 'StrainSpotter HQ',
  grower_listed_in_directory = true,
  grower_directory_consent_date = now(),
  grower_accepts_messages = true,
  grower_image_approved = true,
  scan_credits = 999
WHERE id = '2d3d5906-a5cc-4bca-a6de-c98586728dfa';

-- Make Topher a moderator
INSERT INTO moderators (user_id, assigned_by, permissions, is_active)
VALUES (
  '2d3d5906-a5cc-4bca-a6de-c98586728dfa',
  '2d3d5906-a5cc-4bca-a6de-c98586728dfa',
  ARRAY['moderate_messages', 'moderate_images', 'warn_users', 'suspend_users', 'ban_users'],
  true
)
ON CONFLICT (user_id) DO UPDATE SET
  permissions = ARRAY['moderate_messages', 'moderate_images', 'warn_users', 'suspend_users', 'ban_users'],
  is_active = true;

-- Setup Andrew Beck as Admin/Owner/Moderator
UPDATE profiles SET
  display_name = 'Andrew Beck',
  avatar_url = 'https://api.dicebear.com/7.x/bottts/svg?seed=andrew&backgroundColor=3b82f6',
  bio = 'Co-Founder of StrainSpotter 🌿',
  is_grower = true,
  grower_license_status = 'licensed',
  grower_experience_years = 12,
  grower_bio = 'Co-Founder of StrainSpotter with 12+ years of cultivation experience.',
  grower_specialties = ARRAY['indoor', 'organic', 'breeding'],
  grower_city = 'Denver',
  grower_state = 'Colorado',
  grower_farm_name = 'StrainSpotter HQ',
  grower_listed_in_directory = true,
  grower_directory_consent_date = now(),
  grower_accepts_messages = true,
  grower_image_approved = true,
  scan_credits = 999
WHERE id = '237fc1d6-3c5e-4a50-b01a-f71fcd825768';

-- Make Andrew a moderator
INSERT INTO moderators (user_id, assigned_by, permissions, is_active)
VALUES (
  '237fc1d6-3c5e-4a50-b01a-f71fcd825768',
  '2d3d5906-a5cc-4bca-a6de-c98586728dfa',
  ARRAY['moderate_messages', 'moderate_images', 'warn_users', 'suspend_users', 'ban_users'],
  true
)
ON CONFLICT (user_id) DO UPDATE SET
  permissions = ARRAY['moderate_messages', 'moderate_images', 'warn_users', 'suspend_users', 'ban_users'],
  is_active = true;

-- Verify
SELECT id, display_name, scan_credits, is_grower, grower_farm_name FROM profiles
WHERE id IN ('2d3d5906-a5cc-4bca-a6de-c98586728dfa', '237fc1d6-3c5e-4a50-b01a-f71fcd825768');

SELECT user_id, permissions, is_active FROM moderators
WHERE user_id IN ('2d3d5906-a5cc-4bca-a6de-c98586728dfa', '237fc1d6-3c5e-4a50-b01a-f71fcd825768');

