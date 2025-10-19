#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const HOME = process.env.HOME || process.env.USERPROFILE || '.';
const candidates = [
  path.resolve(HOME, 'Desktop/strain_library.json'),
  path.resolve(HOME, 'Downloads/strain_attributes.txt'),
  path.resolve(HOME, 'Downloads/Dataset.html'),
  path.resolve(HOME, 'Downloads/Dataset-2.html'),
  path.resolve(process.cwd(), '../strains/strains-sample.json'),
  path.resolve(process.cwd(), '../strains/strains.json')
];

function tryParseJSON(content) {
  try {
    return JSON.parse(content);
  } catch (e) {
    return null;
  }
}

function extractJsonObjectsByBraces(s) {
  const objs = [];
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '{') {
      let depth = 0;
      let j = i;
      for (; j < s.length; j++) {
        if (s[j] === '{') depth++;
        else if (s[j] === '}') {
          depth--;
          if (depth === 0) {
            const maybe = s.slice(i, j + 1);
            // quick sanity: must contain a "name" or "slug"
            if (maybe.includes('"name"') || maybe.includes('"slug"')) {
              try {
                const obj = JSON.parse(maybe);
                objs.push(obj);
              } catch (e) {
                // ignore parse errors
              }
            }
            i = j;
            break;
          }
        }
      }
    }
  }
  return objs;
}

function normalize(rec, source) {
  const out = { _sources: [source] };
  // name
  out.name = rec.name || rec.displayName || rec.strain || rec.slug || rec.title || null;
  if (!out.name && rec.strainId) out.name = String(rec.strainId);
  // phenotype / type
  out.type = (rec.type || rec.phenotype || rec.category || null);
  // dominance
  out.dominance = rec.dominance || null;
  // description
  out.description = rec.descriptionPlain || rec.description || rec.shortDescriptionPlain || null;
  // lineage
  out.lineage = rec.lineage || rec.parents || rec.lineage || null;
  // flavors/terps
  if (rec.flavors) out.flavors = rec.flavors;
  else if (rec.terps && typeof rec.terps === 'object') out.flavors = Object.keys(rec.terps);
  else out.flavors = rec.flavor || null;
  // effects
  if (Array.isArray(rec.effects)) out.effects = rec.effects;
  else if (rec.effects && typeof rec.effects === 'object') out.effects = Object.keys(rec.effects);
  else out.effects = rec.topEffect ? [rec.topEffect] : null;
  // thc/cbd
  try {
    if (rec.cannabinoids && rec.cannabinoids.thc) {
      const v = rec.cannabinoids.thc.percentile50 ?? rec.cannabinoids.thc.value ?? null;
      out.thc = typeof v === 'number' ? v : out.thc ?? null;
    }
  } catch (e) {}
  if (rec.thc) out.thc = rec.thc;
  if (rec.CBD || rec.cbd) out.cbd = rec.cbd || rec.CBD;
  if (rec.nugImage) out.image = rec.nugImage;
  else if (rec.flowerImagePng) out.image = rec.flowerImagePng;
  else if (rec.image) out.image = rec.image;
  // raw
  out.raw = rec;
  return out;
}

function mergeRecords(map, rec) {
  const key = (rec.name || '').trim().toLowerCase();
  if (!key) return;
  if (!map.has(key)) {
    map.set(key, rec);
    return;
  }
  const existing = map.get(key);
  // merge simple fields preferring existing non-null values, and merge arrays
  for (const k of Object.keys(rec)) {
    if (k === 'name' || k === '_sources' || k === 'raw') continue;
    if (!existing[k]) existing[k] = rec[k];
    else if (Array.isArray(existing[k]) && Array.isArray(rec[k])) {
      existing[k] = Array.from(new Set([...existing[k], ...rec[k]]));
    }
  }
  existing._sources = Array.from(new Set([...(existing._sources||[]), ...(rec._sources||[])]));
}

(async function main(){
  const foundFiles = candidates.filter(p => fs.existsSync(p));
  console.log('Found candidate files:', foundFiles);
  const records = [];
  for (const f of foundFiles) {
    const ext = path.extname(f).toLowerCase();
    const content = fs.readFileSync(f, 'utf8');
    if (ext === '.json') {
      const j = tryParseJSON(content);
      if (j) {
        if (Array.isArray(j)) {
          for (const item of j) records.push({ item, source: f });
        } else {
          records.push({ item: j, source: f });
        }
        continue;
      }
    }
    // try to find a JSON array within
    const start = content.indexOf('[');
    const end = content.lastIndexOf(']');
    if (start !== -1 && end !== -1 && end > start) {
      const sub = content.slice(start, end+1);
      const j = tryParseJSON(sub);
      if (j && Array.isArray(j)) {
        for (const item of j) records.push({ item, source: f });
        continue;
      }
    }
    // fallback: extract by braces
    const objs = extractJsonObjectsByBraces(content);
    for (const item of objs) records.push({ item, source: f });
  }

  console.log('Extracted raw records count:', records.length);

  const map = new Map();
  for (const r of records) {
    const normalized = normalize(r.item, r.source);
    mergeRecords(map, normalized);
  }

  const merged = Array.from(map.values());
  console.log('Unique strains after dedupe:', merged.length);

  const outDir = path.resolve(process.cwd(), '../strains');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.resolve(outDir, 'strains.json');
  // backup existing
  try {
    const existing = fs.readFileSync(outPath, 'utf8');
    fs.writeFileSync(outPath + '.bak', existing);
  } catch (e) {}
  fs.writeFileSync(outPath, JSON.stringify(merged, null, 2), 'utf8');
  console.log('Wrote merged strains to', outPath);
})();
