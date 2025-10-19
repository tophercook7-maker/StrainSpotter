-- Migration: create scans table

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.scans (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  image_url text,
  status text DEFAULT 'pending',
  result jsonb,
  processed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Optional: index for faster recent queries
CREATE INDEX IF NOT EXISTS scans_created_at_idx ON public.scans (created_at DESC);

-- Create storage bucket for scan images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('scans', 'scans', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to scans bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'scans');
