-- Normalize memberships tier values to support owner/admin tiers
ALTER TABLE memberships DROP CONSTRAINT IF EXISTS memberships_tier_check;
ALTER TABLE memberships
  ADD CONSTRAINT memberships_tier_check
  CHECK (tier IN (
    'scan-only',
    'full-access',
    'club',
    'pro',
    'owner',
    'admin'
  ));
