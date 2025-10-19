import fs from 'fs';
import path from 'path';

const OUT_DIR = path.join(process.cwd(), 'backend', 'data');
const ATTR_FILE = path.join(process.env.HOME, 'Downloads', 'strain_datasets', 'strain_attributes.txt');
const MAPPING_FILE = path.join(OUT_DIR, 'test_mapping.json');

const attributes = JSON.parse(fs.readFileSync(ATTR_FILE, 'utf8'));
const arr = Array.isArray(attributes) ? attributes : Object.values(attributes).filter(Array.isArray).flat();

const mapping = {};
for (let i = 1; i <= Math.min(300, arr.length); i++) {
  const code = `Strain_${String(i).padStart(2, '0')}`;
  mapping[code] = arr[i - 1]?.name || '';
}

fs.writeFileSync(MAPPING_FILE, JSON.stringify(mapping, null, 2));
console.log(`[mapping] Generated ${Object.keys(mapping).length} mappings -> ${MAPPING_FILE}`);
console.log('[mapping] Sample:', Object.entries(mapping).slice(0, 10));
