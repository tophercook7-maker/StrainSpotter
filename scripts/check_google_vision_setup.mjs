#!/usr/bin/env node
// Safe check for Google Vision setup. Prints no secrets.
import fs from 'fs';
import path from 'path';

function maskEmail(email) {
  if (!email || typeof email !== 'string') return '—';
  const [u, d] = email.split('@');
  const um = u.length <= 2 ? u[0] + '*' : u[0] + '*'.repeat(u.length - 2) + u.slice(-1);
  const dm = d ? d.replace(/^[^.]*/, (m) => m[0] + '*'.repeat(Math.max(0, m.length - 2)) + (m.slice(-1) || '')) : '';
  return `${um}@${dm}`;
}

function flag(val) { return !!val ? 'yes' : 'no'; }

const scriptDir = path.dirname(new URL(import.meta.url).pathname);
const repoRoot = path.resolve(scriptDir, '..');
const envFile = path.join(repoRoot, 'env', '.env.local');
const credsFile = path.join(repoRoot, 'env', 'google-vision-key.json');

const envPresent = fs.existsSync(envFile);
const credsPresent = fs.existsSync(credsFile);

let envContent = '';
if (envPresent) {
  try { envContent = fs.readFileSync(envFile, 'utf8'); } catch {}
}

const hasGac = /^\s*GOOGLE_APPLICATION_CREDENTIALS\s*=\s*/m.test(envContent);
const hasInline = /^\s*GOOGLE_VISION_JSON\s*=\s*/m.test(envContent);
const hasSupabaseUrl = /^\s*SUPABASE_URL\s*=\s*/m.test(envContent);

let projectId = '—';
let clientEmailMasked = '—';
if (credsPresent) {
  try {
    const raw = fs.readFileSync(credsFile, 'utf8');
    const j = JSON.parse(raw);
    projectId = j.project_id || '—';
    clientEmailMasked = maskEmail(j.client_email);
  } catch {}
}

console.log('Google Vision setup check:');
console.log('- env/.env.local present:', flag(envPresent));
console.log('- SUPABASE_URL set in .env.local:', flag(hasSupabaseUrl));
console.log('- GOOGLE_APPLICATION_CREDENTIALS set:', flag(hasGac));
console.log('- GOOGLE_VISION_JSON set:', flag(hasInline));
console.log('- env/google-vision-key.json present:', flag(credsPresent));
console.log('- service account project_id:', projectId);
console.log('- service account email (masked):', clientEmailMasked);

console.log('\nNext:');
console.log('* Open project dashboard:', projectId !== '—' ? `https://console.cloud.google.com/home/dashboard?project=${projectId}` : 'add GOOGLE_* in env/.env.local');
console.log('* APIs & Services → Enabled APIs: confirm "Cloud Vision API" is enabled');
console.log('* Billing: link the project to a billing account if not already');
