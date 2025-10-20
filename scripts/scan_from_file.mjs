#!/usr/bin/env node
// Usage:
//   node scripts/scan_from_file.mjs --file /path/to/plant.jpg [--api http://localhost:5181]
// Options:
//   --file         Absolute or relative path to image file (required)
//   --api          API base URL (default: http://localhost:5181)
//   --name         Filename to store (default: source basename)
//   --type         Content-Type (default inferred from extension)

import fs from 'node:fs/promises';
import path from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).map((s, i, arr) => {
  if (!s.startsWith('--')) return [];
  const k = s.slice(2);
  const v = arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true;
  return [k, v];
}).filter(Boolean));

if (!args.file) {
  console.error('Error: --file is required');
  process.exit(1);
}

const API = (args.api || 'http://localhost:5181').replace(/\/$/, '');
const filePath = path.resolve(process.cwd(), String(args.file));
const filename = String(args.name || path.basename(filePath));

function detectType(p) {
  const ext = path.extname(p).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.heic' || ext === '.heif') return 'image/heic';
  return 'application/octet-stream';
}

const contentType = String(args.type || detectType(filePath));

async function main() {
  const buf = await fs.readFile(filePath);
  const base64 = buf.toString('base64');

  // 1) Upload
  const upRes = await fetch(`${API}/api/uploads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, contentType, base64 })
  });
  const upJson = await upRes.json();
  if (!upRes.ok) {
    console.error('Upload failed:', upJson);
    process.exit(1);
  }
  const id = upJson.id;
  console.log('Scan created:', id, upJson.image_url || '');

  // 2) Process
  const procRes = await fetch(`${API}/api/scans/${id}/process`, { method: 'POST' });
  const procJson = await procRes.json();
  if (!procRes.ok) {
    console.error('Process failed:', procJson);
    process.exit(1);
  }
  console.log('Process status:', procJson.ok ? 'ok' : 'error');

  // 3) Fetch result
  const resRes = await fetch(`${API}/api/scans/${id}`);
  const resJson = await resRes.json();
  if (!resRes.ok) {
    console.error('Fetch scan failed:', resJson);
    process.exit(1);
  }
  const scan = resJson.scan || {};
  const result = scan.result || {};

  // 4) Summarize
  const labels = (result.labelAnnotations || []).slice(0, 8).map(x => `${x.description}(${Math.round((x.score||0)*100)}%)`);
  const webs = (result.webDetection?.webEntities || []).filter(x => x.description).slice(0, 8).map(x => `${x.description}(${Math.round((x.score||0)*100)}%)`);

  console.log('\nSummary:');
  console.log('- Status:', scan.status);
  if (result.error) console.log('- Vision Error:', result.error.message || result.error);
  console.log('- Labels:', labels.join(', ') || 'none');
  console.log('- Web Entities:', webs.join(', ') || 'none');

  // 5) Visual match (optional)
  let matches = [];
  try {
    const vmRes = await fetch(`${API}/api/visual-match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visionResult: result })
    });
    const vmJson = await vmRes.json();
    matches = Array.isArray(vmJson?.matches) ? vmJson.matches : [];
  } catch {}

  if (matches.length) {
    console.log('- Top matches:');
    for (const m of matches.slice(0, 5)) {
      const s = m.strain || {};
      console.log(`  • ${s.name} [${s.type || 'unknown'}] score=${m.score} reason=${m.reasoning || ''}`);
    }
  } else {
    console.log('- Top matches: none');
  }

  console.log('\nDone.');
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});

// Copy/paste backend/migrations/2025_10_20_friends_system.sql
