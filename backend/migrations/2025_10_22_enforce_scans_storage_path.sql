-- Enforce normalized storage keys for 'scans' bucket
-- Convention: users/{owner}/{filename}
-- This trigger allows any non-empty owner (UUID or sanitized string) to avoid breaking anonymous trials.

CREATE OR REPLACE FUNCTION public.enforce_scans_storage_path()
RETURNS trigger AS $$
BEGIN
  IF NEW.bucket_id = 'scans' THEN
    -- require a path with at least two segments: users/{owner}/...
    IF NEW.name IS NULL OR NEW.name NOT LIKE 'users/%/%' THEN
      RAISE EXCEPTION USING MESSAGE = 'Storage objects in bucket "scans" must be under users/{owner}/{filename}';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger idempotently
DROP TRIGGER IF EXISTS trg_enforce_scans_storage_path ON storage.objects;
CREATE TRIGGER trg_enforce_scans_storage_path
BEFORE INSERT OR UPDATE ON storage.objects
FOR EACH ROW
EXECUTE FUNCTION public.enforce_scans_storage_path();
