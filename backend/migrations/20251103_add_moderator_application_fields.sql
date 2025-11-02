-- Capture extra application details for grower moderators
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS grower_moderator_application jsonb;

COMMENT ON COLUMN profiles.grower_moderator_application IS
  'Structured details submitted by certified growers when volunteering to moderate.';
