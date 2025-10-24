# API endpoints added by backend/index.js

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

## Reviews Endpoints

GET /api/reviews?strain_slug={slug}

- Returns up to 50 most recent reviews for the given strain slug.
- Response: an array of reviews with user info when available.

Example response:

[
  {
    "id": "uuid",
    "user_id": "uuid",
    "strain_slug": "blue-dream",
    "rating": 5,
    "comment": "Citrus notes, very uplifting.",
    "created_at": "2025-10-22T12:34:56.000Z",
    "users": { "id": "uuid", "username": "alice", "avatar_url": null }
  }
]

POST /api/reviews

- Body: { user_id: uuid, strain_slug: text, rating: 1-5, comment?: text }
- Behavior: upserts by (user_id, strain_slug) semantics (single current review per user per strain). If a review exists, it updates rating/comment.
- Response: inserted/updated row

Setup (run once in Supabase SQL editor):

Run the migration file to create the table and policies:

- backend/migrations/2025_10_22_create_reviews_table.sql

Notes:

- If the table is not created yet, GET will return an empty list (graceful), and POST will return a helpful hint to run the migration.

## Diagnostic Endpoints

GET /api/diagnostic/scan?url={image_url}

- Runs a full end-to-end diagnostic of the scanning pipeline:
  - Health check (env/creds)
  - Create scan row from the supplied URL
  - Process image with Google Vision (all relevant features)
  - Visual match against local strain library
- Returns a comprehensive JSON report with step-by-step results, timing, and a summary.

Query params:

- url (optional): The image URL to test. If omitted, uses the first example image below.

Example public test images:

1. [Unsplash sample 1](https://images.unsplash.com/photo-1542451313056-b7c8e626645f?q=80&w=1200&auto=format&fit=crop)
2. [Unsplash sample 2](https://images.unsplash.com/photo-1623043284279-e1de67d82f8d?q=80&w=1200&auto=format&fit=crop)
3. [Unsplash sample 3](https://images.unsplash.com/photo-1558155316-50a38f1b4f2a?q=80&w=1200&auto=format&fit=crop)
4. [Picsum cannabis seed](https://picsum.photos/seed/cannabis/800)

Legacy alias (kept for compatibility):

- GET /api/diagnostic/scan-test?url={image_url}

