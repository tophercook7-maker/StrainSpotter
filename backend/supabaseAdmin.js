import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load env from ../env/.env.local
dotenv.config({ path: new URL('../env/.env.local', import.meta.url).pathname });

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('[supabaseAdmin] URL present:', !!url);
console.log('[supabaseAdmin] Service role key present:', !!serviceRoleKey);
console.log('[supabaseAdmin] Service role key length:', serviceRoleKey?.length || 0);

export const supabaseAdmin = serviceRoleKey && url
  ? createClient(url, serviceRoleKey, { auth: { persistSession: false } })
  : null;

console.log('[supabaseAdmin] Admin client created:', !!supabaseAdmin);

export const supabaseUrl = url;
export const supabaseServiceRoleKey = serviceRoleKey;

export async function ensureBucketExists(bucketName, { public: isPublic = true } = {}) {
  if (!supabaseAdmin) return { ok: false, skipped: true, reason: 'no-service-role' };
  try {
    // listBuckets requires service role
    const { data: buckets, error: listErr } = await supabaseAdmin.storage.listBuckets();
    if (listErr) return { ok: false, error: listErr.message };
    const exists = buckets?.some(b => b.name === bucketName);
    if (exists) return { ok: true, created: false };

    const { data, error } = await supabaseAdmin.storage.createBucket(bucketName, { public: isPublic });
    if (error) return { ok: false, error: error.message };
    return { ok: true, created: true, data };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
