-- Journal enhancements: richer structured fields for user experiences
ALTER TABLE public.journals
  ADD COLUMN IF NOT EXISTS strain_slug TEXT,
  ADD COLUMN IF NOT EXISTS strain_name TEXT,
  ADD COLUMN IF NOT EXISTS entry_date DATE DEFAULT now(),
  ADD COLUMN IF NOT EXISTS rating NUMERIC,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS method TEXT,
  ADD COLUMN IF NOT EXISTS dosage TEXT,
  ADD COLUMN IF NOT EXISTS time_of_day TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[];

CREATE INDEX IF NOT EXISTS idx_journals_user_id ON public.journals(user_id);
CREATE INDEX IF NOT EXISTS idx_journals_strain_slug ON public.journals(strain_slug);

