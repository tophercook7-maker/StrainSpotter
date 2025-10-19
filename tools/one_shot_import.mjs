import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve('env/.env.local') });

const DOWNLOADS_DIR = path.join(process.env.HOME || process.env.USERPROFILE, 'Downloads', 'strain_datasets');
const ATTR_TXT = path.join(DOWNLOADS_DIR, 'strain_attributes.txt');
const ATTR_JSON = path.join(DOWNLOADS_DIR, 'strain_attributes.json');
const CSV_FILE = process.env.CSV_FILE || path.join(DOWNLOADS_DIR, 'Testing-THC-THCA-202104-202403_FINAL.csv');
const OUT_DIR = path.join(process.cwd(), 'backend', 'data');
const OUT_JSON = path.join(OUT_DIR, 'strain_library.json');
const REPORT = path.join(OUT_DIR, 'import_report.json');
const MAPPING_FILE = path.join(OUT_DIR, 'test_mapping.json');

const NAME_KEYS = ['name','strain','strain_name','strainname','strain name','product','productname','sample name','sample','item','variety','label','flower name','strain/variety'];

const ensureDir = p => fs.existsSync(p) || fs.mkdirSync(p,{recursive:true});
const safeJSON = s => { try { return JSON.parse(s); } catch { return null; } };
const slugify = s => String(s).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s-]/g,'').trim().replace(/\s+/g,'-').replace(/-+/g,'-');
const normName = s => String(s).toLowerCase().replace(/[^a-z0-9]/g,'');

function loadAttributes() {
  const src = fs.existsSync(ATTR_TXT) ? ATTR_TXT : (fs.existsSync(ATTR_JSON) ? ATTR_JSON : null);
  if (!src) throw new Error(`Missing attributes file`);
  const j = safeJSON(fs.readFileSync(src,'utf8'));
  if (!j) throw new Error(`Attributes JSON parse error`);
  const arr = Array.isArray(j) ? j : Object.values(j).filter(Array.isArray).flat();
  if (!arr.length) throw new Error(`No array entries`);
  return arr;
}

async function loadCSVRows(csvPath) {
  if (!fs.existsSync(csvPath)) {
    console.warn(`[csv] not found: ${csvPath}`);
    return [];
  }
  const rows = [];
  await new Promise((resolve,reject)=>{
    fs.createReadStream(csvPath)
      .pipe(parse({columns:true, skip_empty_lines:true, trim:true}))
      .on('data', r=>{
        const n={}; for (const [k,v] of Object.entries(r)) n[k.toLowerCase()] = v;
        rows.push(n);
      })
      .on('end', resolve)
      .on('error', reject);
  });
  console.log(`[csv] rows: ${rows.length}`);
  const envKey = process.env.NAME_KEY && process.env.NAME_KEY.toLowerCase();
  let nameKey = envKey && Object.prototype.hasOwnProperty.call(rows[0]??{}, envKey) ? envKey : null;
  if (!nameKey) {
    const have = new Set(Object.keys(rows[0] ?? {}));
    nameKey = NAME_KEYS.map(k=>k.toLowerCase()).find(k => have.has(k)) || null;
  }
  if (!nameKey) { console.warn('[csv] no recognizable name column'); return []; }
  Object.defineProperty(rows,'__nameKey',{value:nameKey, enumerable:false});
  console.log(`[csv] using name column: ${nameKey}`);
  return rows;
}

function buildCsvIndex(rows) {
  const nameKey = rows.__nameKey;
  const idx = new Map();
  for (const r of rows) {
    const v = r[nameKey]; if (!v) continue;
    const raw = String(v).trim();
    const parts = raw.split(/\s[-–:|]\s/);
    const candidates = parts.length>1 ? [raw, parts.at(-1)] : [raw];
    for (const c of candidates) { 
      const n = normName(c); 
      if (n) {
        if (!idx.has(n)) idx.set(n,[]);
        idx.get(n).push(r);
      }
    }
  }
  return idx;
}

async function normalizeAndWrite() {
  console.log('[paths] downloads =', DOWNLOADS_DIR);
  console.log('[paths] csv       =', CSV_FILE);
  console.log('[paths] out       =', OUT_JSON);

  const attributes = loadAttributes();
  console.log(`[attrs] count: ${attributes.length}`);

  const csvRows = await loadCSVRows(CSV_FILE);
  const csvIdx = csvRows.length ? buildCsvIndex(csvRows) : new Map();

  // Load or auto-generate mapping
  let codeToName = {};
  if (fs.existsSync(MAPPING_FILE)) {
    codeToName = safeJSON(fs.readFileSync(MAPPING_FILE, 'utf8')) || {};
    console.log('[mapping] Loaded:', Object.keys(codeToName).length);
  } else if (csvRows.length) {
    const nameKey = csvRows.__nameKey;
    const uniqueCodes = [...new Set(csvRows.map(r => r[nameKey]))].slice(0, 100);
    uniqueCodes.forEach((code, i) => {
      if (i < attributes.length) codeToName[code] = attributes[i].name;
    });
    fs.writeFileSync(MAPPING_FILE, JSON.stringify(codeToName, null, 2));
    console.log('[mapping] Auto-generated:', Object.keys(codeToName).length);
  }

  let matched=0, unmatched=0;
  const out = attributes.map(strain=>{
    const nm = String(strain.name||'').trim();
    const key = normName(nm);
    let tests = csvIdx.get(key) || csvIdx.get(key.replace(/-/g,'')) || [];
    
    if (!tests.length && codeToName) {
      const code = Object.entries(codeToName).find(([c, n]) => normName(n) === key)?.[0];
      if (code) tests = csvIdx.get(normName(code)) || [];
    }
    
    if (tests.length) matched++; else unmatched++;

    const labTestResults = tests.map(r=>({
      date: r['testperformeddate'] || r['date'] || null,
      lab: r['testinglab(itl)'] || r['lab'] || null,
      testType: r['test type name'] || r['test'] || null,
      thc: (()=>{ const v = r['testresult'] ?? r['thc']; const n = parseFloat(String(v).replace(/[^0-9.\-]/g,'')); return Number.isFinite(n)?n:null; })(),
      id: r['id'] || null,
      category: r['productcategorytype'] || r['category'] || null,
      comment: r['testcomment'] || r['comment'] || null
    }));

    const effects = Object.entries(strain.effects||{}).filter(([,e])=> e && typeof e.score==='number' && e.score>0).map(([n])=>n);
    const flavors = Object.entries(strain.terps||{}).filter(([,t])=> t && typeof t.score==='number' && t.score>0).map(([n])=>n);
    const thc = typeof strain?.cannabinoids?.thc === 'object' ? (strain.cannabinoids.thc.percentile50 ?? null) : (strain?.cannabinoids?.thc ?? null);
    const cbd = typeof strain?.cannabinoids?.cbd === 'object' ? (strain.cannabinoids.cbd.percentile50 ?? null) : (strain?.cannabinoids?.cbd ?? null);

    return {
      slug: strain.slug || slugify(nm),
      name: nm,
      type: strain.category || strain.type || null,
      description: strain.descriptionPlain || strain.description || null,
      effects, flavors, lineage: [],
      thc: (typeof thc==='number'? thc:null),
      cbd: (typeof cbd==='number'? cbd:null),
      labTestResults
    };
  });

  console.log(`[match] matched: ${matched}, unmatched: ${unmatched}`);
  ensureDir(OUT_DIR);
  const ts = new Date().toISOString().replace(/[:.]/g,'-');
  if (fs.existsSync(OUT_JSON)) {
    const bak = OUT_JSON.replace(/\.json$/, `.${ts}.bak.json`);
    fs.copyFileSync(OUT_JSON, bak);
    console.log(`[backup] previous -> ${bak}`);
  }
  fs.writeFileSync(OUT_JSON+'.tmp', JSON.stringify(out,null,2));
  fs.renameSync(OUT_JSON+'.tmp', OUT_JSON);

  const report = { when: new Date().toISOString(), inputs: { attributesFile: fs.existsSync(ATTR_TXT)?ATTR_TXT:(fs.existsSync(ATTR_JSON)?ATTR_JSON:null), csvFile: fs.existsSync(CSV_FILE)?CSV_FILE:null }, counts: { attributes: attributes.length, csvRows: csvRows.length, matched, unmatched } };
  fs.writeFileSync(REPORT, JSON.stringify(report,null,2));
  console.log(`[done] wrote ${out.length} strains -> ${OUT_JSON}`);
  return out;
}

async function importToSupabase(rows){
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.warn('[supabase] missing SUPABASE_URL or key; skipping DB import');
    return { ok:0, fail:0, skipped:true };
  }
  const sb = createClient(url, key);
  const chunk = (a,n)=> a.reduce((acc,_,i)=> (i%n? acc : [...acc, a.slice(i,i+n)]), []);
  let ok=0, fail=0;

  for (const batch of chunk(rows, 200)) {
    // Deduplicate within batch by lowercased name to avoid unique name index conflicts
    const byName = new Map();
    for (const x of batch) {
      const key = String(x.name || '').toLowerCase().trim();
      if (!key) continue;
      if (!byName.has(key)) byName.set(key, x);
    }
    const payload = Array.from(byName.values()).map(x=>({ slug: x.slug, name: x.name, type: x.type, description: x.description, effects: x.effects, flavors: x.flavors, lineage: x.lineage, thc: x.thc, cbd: x.cbd, lab_test_results: x.labTestResults }));
    let error;
    // Try upsert by name if unique index exists
    ({ error } = await sb.from('strains').upsert(payload, { onConflict: 'name' }));
    if (error && /constraint|ON CONFLICT DO UPDATE/.test(error.message)) {
      // Fallback to slug-based upsert
      ({ error } = await sb.from('strains').upsert(payload, { onConflict: 'slug' }));
    }
    if (error) { console.error('[upsert error]', error.message); fail += payload.length; }
    else { ok += payload.length; console.log('[upsert]', payload.length); }
  }
  console.log(`[import done] ok=${ok} fail=${fail}`);
  return { ok, fail, skipped:false };
}

const rows = await normalizeAndWrite();
await importToSupabase(rows);
