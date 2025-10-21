// Supabase Edge Function: uploads
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { supabase } from './_shared.ts';

const ALLOW_ORIGINS = [
  'https://strainspotter.app',
  'https://www.strainspotter.app',
  'https://*.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];

function corsHeaders(origin: string | null) {
  const allowed = origin && (ALLOW_ORIGINS.includes(origin) || /\.vercel\.app$/.test(new URL(origin).host));
  return {
    'Access-Control-Allow-Origin': allowed ? origin : '*',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'content-type',
    'Vary': 'Origin'
  } as Record<string, string>;
}

// Helper: parse JSON body
async function parseJson(req: Request) {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  const headers = { 'Content-Type': 'application/json', ...corsHeaders(origin) };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers });
  }

  const body = await parseJson(req);
  if (!body || !body.filename || !body.base64) {
    return new Response(JSON.stringify({ error: 'filename and base64 are required' }), { status: 400, headers });
  }

  // Upload to Supabase Storage ('scans' bucket)
  const { filename, base64, contentType = 'image/jpeg' } = body;
  const buffer = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  const key = `${Date.now()}-${filename}`;
  const bucket = 'scans';

  let { error } = await supabase.storage.from(bucket).upload(key, buffer, { contentType });
  if (error) {
    // Try to create bucket if missing, then retry once
    const created = await supabase.storage.createBucket(bucket, { public: true }).catch(() => null);
    const retry = await supabase.storage.from(bucket).upload(key, buffer, { contentType });
    if (retry.error) {
      return new Response(JSON.stringify({ error: retry.error.message }), { status: 500, headers });
    }
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(key);
  const image_url = data.publicUrl;

  // Insert scan row with pending status
  const insert = await supabase.from('scans').insert({ image_url, status: 'pending' }).select().single();
  if (insert.error) {
    return new Response(JSON.stringify({ error: insert.error.message, image_url }), { status: 500, headers });
  }
  const scan = insert.data;
  return new Response(JSON.stringify({ ok: true, id: scan?.id || null, image_url }), { status: 200, headers });
});
