API endpoints added by backend/index.js

POST /api/uploads
- Request JSON: { filename, contentType, base64 }
- Uploads the decoded file to Supabase Storage bucket `scans` as `<timestamp>-filename`.
- Inserts a row into `scans` table with fields: image_url, status
- Response: { id, image_url }

GET /api/scans
- Returns recent scans (max 100) sorted by created_at desc
- Response: { scans: [...] }

GET /api/scans/:id
- Returns a single scan row
- Response: { scan: { ... } }

Recommended `scans` table schema (run in Supabase SQL editor):

CREATE TABLE public.scans (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  image_url text,
  status text DEFAULT 'pending',
  result jsonb,
  created_at timestamptz DEFAULT now()
);

Notes:
- Make sure there's a storage bucket named `scans` with public access if you use getPublicUrl.
- You can replace public URL logic with signed URLs if you prefer private storage.
