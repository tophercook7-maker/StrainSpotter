import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Load env
dotenv.config({ path: new URL('../env/.env.local', import.meta.url).pathname });

// Google Vision credentials are handled in index.js
// No need to write to file here - just use GOOGLE_VISION_JSON env var directly

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY;

export const supabase = createClient(url ?? '', key ?? '');
