import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';

// ---------- config & paths ----------
const DOWNLOADS_DIR = path.join(process.env.HOME || process.env.USERPROFILE, 'Downloads', 'strain_datasets');
const ATTR_FILE = path.join(DOWNLOADS_DIR, 'strain_attributes.txt');
const ALT_ATTR_JSON = path.join(DOWNLOADS_DIR, 'strain_attributes.json');
const CSV_FILE = process.env.CSV_FILE || path.join(DOWNLOADS_DIR, 'Testing-THC-THCA-202104-202403_FINAL.csv');

const OUT_DIR = path.join(process.cwd(), 'backend', 'data');
const OUT_FILE = path.join(OUT_DIR, 'strain_library.json');
const REPORT_FILE = path.join(OUT_DIR, 'import_report.json');

// Candidate header names that might hold the strain name in the CSV
const NAME_KEYS = [
  'name','strain','strain_name','strainname','strain name','product','productname','variety','label','sample name','sample','item','brandstrain','flower name','strain/variety'
];

function ensureDir(p) { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); }
function slugify(s = '') { return String(s).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-'); }
function normalizeName(s = '') { return String(s).toLowerCase().replace(/[^a-z0-9]/g, ''); }
function safeJSON(txt) { try { return JSON.parse(txt); } catch { return null; } }

function arrayFromUnknown(j) {
  if (Array.isArray(j)) return j;
  if (j && typeof j === 'object') {
    const arrays = [];
    for (const v of Object.values(j)) if (Array.isArray(v)) arrays.push(...v);
    if (arrays.length) return arrays;
  }
  return [];
}

// ---------- load strain attributes ----------
function loadAttributes() {
  const srcPath = fs.existsSync(ATTR_FILE) ? ATTR_FILE : (fs.existsSync(ALT_ATTR_JSON) ? ALT_ATTR_JSON : null);
  if (!srcPath) throw new Error(`Missing attributes file: ${ATTR_FILE} or ${ALT_ATTR_JSON}`);
  const raw = fs.readFileSync(srcPath, 'utf8');
  const j = safeJSON(raw);
  if (!j) throw new Error(`Attributes JSON parse error in ${srcPath}`);
  const arr = arrayFromUnknown(j);
  if (!arr.length) throw new Error(`Attributes file had no array entries: ${srcPath}`);
  return arr;
}

// ---------- parse CSV streaming & header normalization ----------
async function loadCSVRows(csvPath) {
  if (!fs.existsSync(csvPath)) {
    console.warn(`[csv] not found: ${csvPath} (continuing without lab data)`);
    return [];
  }
  const results = [];
  let headerLower = [];

  await new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(parse({ columns: true, skip_empty_lines: true, trim: true }))
      .on('headers', headers => { headerLower = headers.map(h => h.toLowerCase().trim()); })
      .on('data', row => {
        const normRow = {};
        for (const [k, v] of Object.entries(row)) normRow[k.toLowerCase()] = v;
        results.push(normRow);
      })
      .on('end', resolve)
      .on('error', reject);
  });

  if (!results.length) {
    console.warn('[csv] 0 rows read');
    return [];
  }
  console.log(`[csv] rows: ${results.length}`);
  console.log(`[csv] sample keys: ${Object.keys(results[0]).slice(0, 10).join(', ')}`);

  // ENV override wins
  const envKey = process.env.NAME_KEY && process.env.NAME_KEY.toLowerCase();
  let nameKey = envKey && Object.prototype.hasOwnProperty.call(results[0], envKey) ? envKey : null;
  if (envKey && !nameKey) console.warn(`[csv] NAME_KEY=${process.env.NAME_KEY} not found in headers; falling back to auto-detect`);

  if (!nameKey) {
    const haveKeys = new Set(Object.keys(results[0]));
    nameKey = NAME_KEYS.map(k => k.toLowerCase()).find(k => haveKeys.has(k)) || null;
  }
  if (!nameKey) {
    console.warn('[csv] no recognizable strain name column; lab data will be skipped');
    return [];
  }
  Object.defineProperty(results, '__nameKey', { value: nameKey, enumerable: false });
  console.log(`[csv] using name column: ${nameKey}${envKey ? ' (via NAME_KEY override)' : ''}`);
  return results;
}

// ---------- main normalization ----------
async function processStrainData() {
  console.log('[paths] downloads =', DOWNLOADS_DIR);
  console.log('[paths] csv       =', CSV_FILE);
  console.log('[paths] out       =', OUT_FILE);

  const attributes = loadAttributes();
  console.log(`[attrs] count: ${attributes.length}`);

  const csvRows = await loadCSVRows(CSV_FILE);
  const nameKey = csvRows.__nameKey; // may be undefined if not found

  // Build an index of lab rows by normalized name for quick match
  const csvIndex = new Map();
  for (const r of csvRows) {
    const n = nameKey ? normalizeName(r[nameKey]) : null;
    if (!n) continue;
    if (!csvIndex.has(n)) csvIndex.set(n, []);
    csvIndex.get(n).push(r);
  }

  let matched = 0;
  let unmatched = 0;
  const unmatchedNames = [];

  const normalizedStrains = attributes.map((strain) => {
    const nm = String(strain.name || '').trim();
    const normNm = normalizeName(nm);

    let tests = [];
    if (nameKey && normNm) {
      tests = csvIndex.get(normNm) || [];
      if (!tests.length) {
        const alt = normNm.replace(/-/g, '');
        tests = csvIndex.get(alt) || tests;
      }
    }

    if (tests.length) matched++; else { unmatched++; if (unmatchedNames.length < 10) unmatchedNames.push(nm); }

    const labTestResults = tests.map(r => ({
      date: r['testperformeddate'] || r['date'] || null,
      lab: r['testinglab(itl)'] || r['lab'] || null,
      testType: r['test type name'] || r['test'] || null,
      thc: parseFloat(String(r['testresult'] || r['thc'] || '').replace(/[^0-9.\-]/g, '')) || null,
      id: r['id'] || null,
      category: r['productcategorytype'] || r['category'] || null,
      comment: r['testcomment'] || r['comment'] || null,
    }));

    const effects = Object.entries(strain.effects || {})
      .filter(([, eff]) => (eff && typeof eff.score === 'number' && eff.score > 0))
      .map(([name]) => name);

    const flavors = Object.entries(strain.terps || {})
      .filter(([, terp]) => (terp && typeof terp.score === 'number' && terp.score > 0))
      .map(([name]) => name);

    const thc = (strain.cannabinoids && typeof strain.cannabinoids.thc === 'object')
      ? (strain.cannabinoids.thc.percentile50 ?? null)
      : (strain.cannabinoids?.thc ?? null);

    const cbd = (strain.cannabinoids && typeof strain.cannabinoids.cbd === 'object')
      ? (strain.cannabinoids.cbd.percentile50 ?? null)
      : (strain.cannabinoids?.cbd ?? null);

    return {
      slug: strain.slug || slugify(nm),
      name: nm,
      type: strain.category || strain.type || null,
      description: strain.descriptionPlain || strain.description || null,
      effects,
      flavors,
      lineage: [],
      thc: (typeof thc === 'number' ? thc : null),
      cbd: (typeof cbd === 'number' ? cbd : null),
      labTestResults,
    };
  });

  console.log(`[match] matched: ${matched}, unmatched: ${unmatched}`);
  if (unmatchedNames.length) console.log('[match] sample unmatched:', unmatchedNames.join('; '));

  // Summary report for quick debugging later
  ensureDir(OUT_DIR);
  const report = {
    when: new Date().toISOString(),
    inputs: {
      attributesFile: fs.existsSync(ATTR_FILE) ? ATTR_FILE : (fs.existsSync(ALT_ATTR_JSON) ? ALT_ATTR_JSON : null),
      csvFile: fs.existsSync(CSV_FILE) ? CSV_FILE : null,
      nameKey: nameKey || null,
    },
    counts: { attributes: attributes.length, csvRows: csvRows.length || 0, matched, unmatched },
    sampleUnmatched: unmatchedNames,
  };
  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));
  console.log(`[report] ${REPORT_FILE}`);

  // ---------- atomic write with backup ----------
  const tmp = OUT_FILE + '.tmp';
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  if (fs.existsSync(OUT_FILE)) {
    const backup = OUT_FILE.replace(/\.json$/, `.${ts}.bak.json`);
    fs.copyFileSync(OUT_FILE, backup);
    console.log(`[backup] previous -> ${backup}`);
  }
  fs.writeFileSync(tmp, JSON.stringify(normalizedStrains, null, 2));
  fs.renameSync(tmp, OUT_FILE);
  console.log(`[done] wrote ${normalizedStrains.length} strains -> ${OUT_FILE}`);
}

processStrainData().catch((e) => {
  console.error('[fatal]', e && e.stack ? e.stack : String(e));
  process.exit(1);
});