import express from 'express';
import { supabase } from '../supabaseClient.js';
import { supabaseAdmin } from '../supabaseAdmin.js';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Helper to check RLS policy for scans
async function checkRLS() {
  try {
    // Try inserting a dummy row (will fail if RLS blocks)
    const { error } = await supabase
      .from('scans')
      .insert({ image_url: 'test', user_id: null });
    if (error && error.message.includes('row-level security')) {
      console.warn(JSON.stringify({ tag: 'health', warning: 'RLS blocks scan insert', details: error.message }));
      return false;
    }
    return true;
  } catch (e) {
    console.error(JSON.stringify({ tag: 'health', error: e?.message || e }));
    return false;
  }
}

router.get('/', async (req, res) => {
  // Check Supabase connection
  let supabaseConfigured = false;
  try {
    const { error } = await supabase.from('scans').select('*').limit(1);
    supabaseConfigured = !error;
    if (error) {
      console.warn(JSON.stringify({ tag: 'health', warning: 'Supabase error', details: error.message }));
    }
  } catch (e) {
    supabaseConfigured = false;
    console.error(JSON.stringify({ tag: 'health', error: e?.message || e }));
  }

  // Check Google Vision credentials
  let googleVisionConfigured = false;
  try {
    const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (credPath) {
      const resolved = path.isAbsolute(credPath)
        ? credPath
        : path.resolve(process.cwd(), credPath);
      googleVisionConfigured = fs.existsSync(resolved);
      if (!googleVisionConfigured) {
        console.warn(JSON.stringify({ tag: 'health', warning: 'Google Vision credentials not found', details: resolved }));
      }
    }
  } catch (e) {
    googleVisionConfigured = false;
    console.error(JSON.stringify({ tag: 'health', error: e?.message || e }));
  }

  // Check bucket existence (scans)
  let bucketExists = false;
  try {
    const client = supabaseAdmin ?? supabase;
    const { data } = await client.storage.listBuckets();
    bucketExists = data?.some(b => b.name === 'scans');
    if (!bucketExists) {
      console.warn(JSON.stringify({ tag: 'health', warning: 'Scans bucket not found' }));
    }
  } catch (e) {
    bucketExists = false;
    console.error(JSON.stringify({ tag: 'health', error: e?.message || e }));
  }

  // Check RLS policy
  const rlsPermissive = await checkRLS();

  res.json({
    supabaseConfigured,
    googleVisionConfigured,
    bucketExists,
    rlsPermissive
  });
});

export default router;
