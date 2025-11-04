-- Fix the update_grower_last_active trigger function
-- The profiles table uses 'id' as primary key, not 'user_id'

CREATE OR REPLACE FUNCTION update_grower_last_active()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET grower_last_active = now()
  WHERE id = NEW.sender_id  -- Changed from user_id to id
    AND is_grower = true;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- The trigger itself doesn't need to be recreated, just the function
-- But here it is for reference:
-- CREATE TRIGGER trigger_update_grower_last_active
--   AFTER INSERT ON messages
--   FOR EACH ROW
--   EXECUTE FUNCTION update_grower_last_active();

