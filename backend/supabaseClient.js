import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Load env
dotenv.config({ path: new URL('../env/.env.local', import.meta.url).pathname });

// Some users prefer to store GOOGLE_VISION_JSON inline instead of a file path
if (process.env.GOOGLE_VISION_JSON && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  const credsPath = new URL('../env/google-vision-key.json', import.meta.url).pathname;
  try {
    fs.writeFileSync(credsPath, process.env.GOOGLE_VISION_JSON);
    process.env.GOOGLE_APPLICATION_CREDENTIALS = credsPath;
  } catch (e) {
    console.error('Failed to write Google Vision JSON file:', e);
  }
}

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY;

export const supabase = createClient(url ?? '', key ?? '');
