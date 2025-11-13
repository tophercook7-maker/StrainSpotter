-- =====================================================
-- BACKFILL & ENFORCE PROFILE DISPLAY NAMES
-- =====================================================

-- 1. Backfill display_name for existing users
UPDATE profiles p
SET display_name = COALESCE(
    NULLIF(trim(p.display_name), ''),
    NULLIF(trim(p.username), ''),
    CASE
      WHEN p.email IS NOT NULL THEN initcap(split_part(p.email, '@', 1))
      ELSE 'Member ' || substring(p.user_id::text, 1, 8)
    END
  )
WHERE p.display_name IS NULL
   OR length(trim(p.display_name)) = 0;

-- 2. Backfill username if missing (ensures alphabetical sort works)
UPDATE profiles p
SET username = COALESCE(
    NULLIF(trim(p.username), ''),
    lower(regexp_replace(split_part(COALESCE(p.display_name, ''), ' ', 1), '[^a-z0-9]+', '', 'g')),
    'user' || replace(substring(p.user_id::text, 1, 12), '-', '')
  )
WHERE p.username IS NULL
   OR length(trim(p.username)) = 0;

-- 3. Enforce non-null constraint on display_name
ALTER TABLE profiles
  ALTER COLUMN display_name SET NOT NULL;

-- 4. Optional: keep display_name trimmed via trigger
CREATE OR REPLACE FUNCTION public.normalize_profile_names()
RETURNS trigger AS $$
BEGIN
  NEW.display_name := trim(NEW.display_name);
  IF NEW.display_name = '' THEN
    NEW.display_name := 'Member ' || substring(NEW.user_id::text, 1, 8);
  END IF;

  IF NEW.username IS NOT NULL THEN
    NEW.username := lower(regexp_replace(NEW.username, '[^a-z0-9]+', '', 'g'));
    IF NEW.username = '' THEN
      NEW.username := 'user' || replace(substring(NEW.user_id::text, 1, 12), '-', '');
    END IF;
  ELSE
    NEW.username := 'user' || replace(substring(NEW.user_id::text, 1, 12), '-', '');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS normalize_profile_names_trigger ON profiles;
CREATE TRIGGER normalize_profile_names_trigger
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION public.normalize_profile_names();

