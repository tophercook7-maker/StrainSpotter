-- Add ai_summary JSONB column to scans table
-- This column stores AI-generated summaries for consumers, dispensaries, and growers

ALTER TABLE public.scans
ADD COLUMN IF NOT EXISTS ai_summary jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.scans.ai_summary IS 'AI-generated structured summary with userFacingSummary, effectsAndUseCases, risksAndWarnings, dispensaryNotes, growerNotes, and confidenceNote';

