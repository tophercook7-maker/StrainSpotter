#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'backend', 'data');
const SOURCES_DIR = path.join(DATA_DIR, 'sources');
const STRAIN_LIBRARY = path.join(DATA_DIR, 'strain_library.json');
const OUTPUT = path.join(DATA_DIR, 'strain_library_enhanced.json');

const slugify = s => String(s).toLowerCase()
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9\s-]/g, '')
  .trim()
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-');

const normName = s => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');

const JUNK_NAMES = new Set([
  'strains', 'popular', 'toprated', 'highthc', 'highcbd', 'sativa', 'indica', 
  'hybrid', 'cannabis', 'marijuana', 'weed', 'strain', 'seeds', 'flower',
  'all', 'best', 'new', 'featured', 'trending', 'viewall', 'more', 'browse',
  '100breeders', 'breeders', 'breeder'
]);

// Title case helper
function titleCase(str) {
  return str.split(/\s+/).map(w => w ? (w[0].toUpperCase() + w.slice(1).toLowerCase()) : w).join(' ').trim();
}

// Collapse repeated phrases like "NameNameName" -> "Name"
function collapseRepeated(name) {
  const s = name.replace(/\s+/g, ' ').trim();
  // Match whole-string repetition: "AbcAbcAbc" or "Abc Abc Abc"
  for (let reps = 5; reps >= 2; reps--) {
    const chunkLen = Math.floor(s.length / reps);
    if (chunkLen < 2) continue;
    const chunk = s.slice(0, chunkLen);
    let match = true;
    for (let i = 1; i < reps; i++) {
      if (s.slice(i * chunkLen, (i + 1) * chunkLen) !== chunk) {
        match = false;
        break;
      }
    }
    if (match && s.slice(reps * chunkLen).trim() === '') return chunk.trim();
  }
  return s;
}

// Clean and normalize strain names
function cleanName(raw) {
  let n = String(raw || '').replace(/\s+/g, ' ').trim();
  if (!n) return '';
  
  // Collapse repeated concatenations
  n = collapseRepeated(n);
  
  // Remove trailing generic words
  n = n.replace(/\b(seeds?|strain|cannabis|marijuana|weed)\b$/i, '').trim();
  
  // Normalize unicode dashes and spacing
  n = n.replace(/[\u2013\u2014]/g, '-').replace(/\s*-\s*/g, ' - ').replace(/\s{2,}/g, ' ').trim();
  
  // Title case for readability
  n = titleCase(n);
  
  return n;
}

function isValid(name) {
  if (!name || typeof name !== 'string') return false;
  const norm = normName(name);
  if (norm.length < 3 || norm.length > 50) return false;
  if (JUNK_NAMES.has(norm)) return false;
  if (/^\d+$/.test(norm)) return false;
  
  // Filter cross-breeding notation with more than 2 'x' (too technical/messy)
  const xCount = (name.match(/\bx\b/gi) || []).length;
  if (xCount > 2) return false;
  
  // Filter if contains "breeder" or "100+"
  if (/breeders?|100\+/i.test(name)) return false;
  
  // Filter parentheses-heavy entries (often metadata or complex crosses)
  const parenCount = (name.match(/[()]/g) || []).length;
  if (parenCount > 4) return false;
  
  return true;
}

console.log('\n🔄 Enhanced Strain Library Merger\n');
console.log('='.repeat(50));

// Load existing
const existing = JSON.parse(fs.readFileSync(STRAIN_LIBRARY, 'utf8'));
console.log(`📚 Existing library: ${existing.length} strains`);

// Index by normalized name
const index = new Map();
for (const strain of existing) {
  index.set(normName(strain.name), strain);
}

// Load scraped sources
let added = 0, skipped = 0, invalid = 0;

if (fs.existsSync(SOURCES_DIR)) {
  const files = fs.readdirSync(SOURCES_DIR).filter(f => f.endsWith('.json'));
  
  for (const file of files) {
    const scraped = JSON.parse(fs.readFileSync(path.join(SOURCES_DIR, file), 'utf8'));
    console.log(`\n📥 Processing ${file}: ${scraped.length} entries`);
    
    for (const s of scraped) {
      const cleaned = cleanName(s.name);
      if (!isValid(cleaned)) { invalid++; continue; }
      
      const key = normName(cleaned);
      if (index.has(key)) { skipped++; continue; }
      
      index.set(key, {
        slug: slugify(cleaned),
        name: cleaned,
        type: s.type || null,
        description: s.description || null,
        effects: s.effects || [],
        flavors: s.flavors || [],
        lineage: s.lineage || [],
        thc: s.thc || null,
        cbd: s.cbd || null,
        labTestResults: []
      });
      added++;
    }
    
    console.log(`  ✅ Added: ${added}, Skipped: ${skipped}, Invalid: ${invalid}`);
  }
}

// Convert to array and sort
const final = Array.from(index.values()).sort((a, b) => a.name.localeCompare(b.name));

// Save
fs.writeFileSync(OUTPUT, JSON.stringify(final, null, 2));

console.log('\n' + '='.repeat(50));
console.log(`\n✅ Final Results:`);
console.log(`  Original: ${existing.length}`);
console.log(`  Added: ${added}`);
console.log(`  Total: ${final.length}`);
console.log(`  Gain: +${added} strains (${((added/existing.length)*100).toFixed(1)}% increase)`);
console.log(`\n📁 Saved to: ${OUTPUT}`);

if (added > 0) {
  console.log(`\n🌿 Sample new strains:`);
  final.filter(s => !existing.find(e => e.slug === s.slug))
    .slice(0, 15)
    .forEach(s => console.log(`  - ${s.name}${s.type ? ' (' + s.type + ')' : ''}`));
}
