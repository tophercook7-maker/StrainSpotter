import express from 'express';
const router = express.Router();
// --- Health Check Endpoint ---
router.get('/health', (req, res) => {
  let ok = true;
  let strainCount = Array.isArray(strains) ? strains.length : 0;
  let errors = [];
  if (!strainCount) {
    ok = false;
    errors.push('No strains loaded');
  }
  res.json({ ok, strainCount, errors });
});

// --- Auto-repair for missing/corrupt strain data ---
function autoRepairStrainData() {
  const fs = require('fs');
  const path = require('path');
  const strainPath = path.resolve(__dirname, '../data/strain_library.json');
  try {
    const data = fs.readFileSync(strainPath, 'utf8');
    const arr = JSON.parse(data);
    if (!Array.isArray(arr) || arr.length === 0) {
      throw new Error('Strain data empty or corrupt');
    }
    return arr;
  } catch (err) {
    // Attempt to rebuild from source
    try {
      const mergeScript = path.resolve(__dirname, '../../tools/merge_strain_datasets.mjs');
      require('child_process').execSync(`node ${mergeScript}`);
      const data = fs.readFileSync(strainPath, 'utf8');
      return JSON.parse(data);
    } catch (e) {
  console.error(JSON.stringify({ tag: 'auto-repair', error: e?.message || e }));
      return [];
    }
  }
}

// --- Global error handler for self-healing ---
router.use((err, req, res, next) => {
  console.error(JSON.stringify({ tag: 'error', error: err?.message || err }));
  // Attempt auto-repair if strain data error
  if (String(err).includes('strain')) {
    strains = autoRepairStrainData();
    if (strains.length) {
      return res.status(200).json({ ok: true, repaired: true });
    }
  }
  res.status(500).json({ error: err.message || 'Unknown error' });
});
// --- Full Automation: Periodic retry for pending scans ---
function notifyUser(scan) {
  // Placeholder: Integrate with email, push, or frontend notification
  console.info(JSON.stringify({ tag: 'notify', scanId: scan.id, strain: scan.strain?.name }));
}

setInterval(() => {
  let found = [];
  for (const scan of pendingScans) {
    for (const strain of strains) {
      if (scan.image && scan.image.toLowerCase().includes(strain.slug)) {
        scan.status = 'complete';
        scan.strain = strain;
        found.push(scan);
        notifyUser(scan);
      }
    }
  }
  // Remove completed scans from pending
  pendingScans = pendingScans.filter(s => s.status === 'pending');
  if (found.length) {
    console.info(JSON.stringify({ tag: 'auto-retry', matched: found.length }));
  }
}, 60000); // every 60 seconds
// In-memory pending scans (for demo; use DB in production)
let pendingScans = [];

// POST /api/scans - handle new scan
router.post('/scans', async (req, res) => {
  const { image, user } = req.body;
  let match = null;
  let matchedSlug = null;
  if (image && typeof image === 'string') {
    supabaseAdmin
      .from('strains')
      .select('*')
      .then(({ data, error }) => {
        if (error || !data) {
          return res.status(500).json({ error: 'Supabase error: ' + (error?.message || 'Unknown') });
        }
        const imageLower = image.toLowerCase();
        for (const strain of data) {
          if (
            imageLower.includes(strain.slug?.toLowerCase()) ||
            imageLower.includes(strain.name?.toLowerCase())
          ) {
            match = strain;
            matchedSlug = strain.slug;
            break;
          }
        }
        if (match) {
          return res.json({ status: 'complete', strain: match });
        } else {
          const scanId = Date.now() + '-' + Math.floor(Math.random()*10000);
          pendingScans.push({ id: scanId, image, user, status: 'pending', created: new Date().toISOString() });
          return res.json({ status: 'pending', scanId });
        }
      });
  } else {
    return res.status(400).json({ error: 'No image provided' });
  }
});

// GET /api/scans/pending - list all pending scans
router.get('/scans/pending', (req, res) => {
  res.json({ pending: pendingScans });
});

// POST /api/scans/retry - retry matching for all pending scans
router.post('/scans/retry', (req, res) => {
  let found = [];
  for (const scan of pendingScans) {
    for (const strain of strains) {
      if (scan.image && scan.image.toLowerCase().includes(strain.slug)) {
        scan.status = 'complete';
        scan.strain = strain;
        found.push(scan);
      }
    }
  }
  // Remove completed scans from pending
  pendingScans = pendingScans.filter(s => s.status === 'pending');
  res.json({ found });
});
// Get reviews for a strain
router.get('/strains/:slug/reviews', (req, res) => {
  const strain = strains.find(s => s.slug === req.params.slug);
  if (!strain) return res.status(404).json({ error: 'Strain not found' });
  res.json({ reviews: strain.reviews || [] });
});

// Add a review to a strain
router.post('/strains/:slug/reviews', async (req, res) => {
  const strain = strains.find(s => s.slug === req.params.slug);
  if (!strain) return res.status(404).json({ error: 'Strain not found' });
  const { review, user } = req.body;
  if (!review || !user) return res.status(400).json({ error: 'Missing review or user' });
  const newReview = { review, user, date: new Date().toISOString() };
  strain.reviews = strain.reviews || [];
  strain.reviews.push(newReview);
  // Persist to disk
  const fs = require('fs');
  try {
    fs.writeFileSync(
      require('path').resolve(__dirname, '../data/strain_library.json'),
      JSON.stringify(strains, null, 2)
    );
  } catch (err) {
    return res.status(500).json({ error: 'Failed to save review' });
  }
  res.json({ ok: true, review: newReview });
});
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
// Resolve data directory relative to this file, not process.cwd(), to avoid PM2/cwd issues
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');

// Load strain data
let strains = [];
let testMapping = {};
let strainDataLastUpdated = null;

function loadData() {
  try {
    const strainPath = path.join(DATA_DIR, 'strain_library.json');
    const mappingPath = path.join(DATA_DIR, 'test_mapping.json');

    // Check if files exist before trying to read (Vercel serverless may not have them)
    if (!fs.existsSync(strainPath)) {
    console.warn(JSON.stringify({ tag: 'strains', warning: 'strain_library.json not found, using empty array' }));
      strains = [];
      testMapping = { strains: {} };
      strainDataLastUpdated = null;
      return;
    }

    const rawStrains = fs.readFileSync(strainPath, 'utf8');
    strains = JSON.parse(rawStrains);
    // Get last updated time
    try {
      const stat = fs.statSync(strainPath);
      strainDataLastUpdated = stat.mtime;
    } catch (e) {
      strainDataLastUpdated = null;
    }
    
    if (fs.existsSync(mappingPath)) {
      const rawMapping = fs.readFileSync(mappingPath, 'utf8');
      testMapping = JSON.parse(rawMapping);
    } else {
      testMapping = { strains: {} };
    }

    // Normalize mapping shape: allow either { strains: {id: {mappedTo: slug}} } or { strains: {id: "Name or Slug"} }
    if (!testMapping || typeof testMapping !== 'object') testMapping = {};
    if (!testMapping.strains || typeof testMapping.strains !== 'object') {
      testMapping.strains = {};
    }

    // Build a quick lookup of name->slug and slug->slug from strains for normalization
    const nameToSlug = new Map();
    const slugToSlug = new Map();
    for (const s of Array.isArray(strains) ? strains : []) {
      if (s?.name) nameToSlug.set(s.name.toLowerCase(), s.slug || s.name.toLowerCase().replace(/\s+/g, '-'));
      if (s?.slug) slugToSlug.set(s.slug.toLowerCase(), s.slug);
    }

    for (const [id, val] of Object.entries(testMapping.strains)) {
      if (val && typeof val === 'object' && typeof val.mappedTo === 'string') {
        // already normalized
        continue;
      }
      if (typeof val === 'string') {
        const key = val.toLowerCase();
        const bySlug = slugToSlug.get(key);
        const byName = nameToSlug.get(key);
        const mappedTo = bySlug || byName || key.replace(/\s+/g, '-');
        testMapping.strains[id] = { mappedTo };
      } else {
        // Unknown shape; drop or keep as-is
        testMapping.strains[id] = { mappedTo: String(val || '').toLowerCase().replace(/\s+/g, '-') };
      }
    }

  console.info(JSON.stringify({ tag: 'data', strains: strains.length, testMappings: Object.keys(testMapping.strains).length }));
  } catch (e) {
    console.error(JSON.stringify({ tag: 'data', error: e?.message || e }));
  }
}

// Initial load
loadData();

// Watch for data changes
fs.watch(DATA_DIR, (eventType, filename) => {
  if (filename?.endsWith('.json')) {
    console.info(JSON.stringify({ tag: 'watch', file: filename }));
    loadData();
  }
});
// Endpoint for last updated timestamp
router.get('/strains/last-updated', (req, res) => {
  if (!strainDataLastUpdated) return res.json({ lastUpdated: null });
  res.json({ lastUpdated: strainDataLastUpdated });
});

// Helper function to filter strains
function filterStrains(query = {}) {
  return strains.filter(strain => {
    if (query.search) {
      const q = String(query.search).toLowerCase();
      const inName = strain.name?.toLowerCase().includes(q);
      const inDesc = strain.description?.toLowerCase().includes(q);
      if (!inName && !inDesc) return false;
    }
    if (query.type && strain.type?.toLowerCase() !== query.type.toLowerCase()) return false;
    if (query.effect && !strain.effects?.includes(query.effect.toLowerCase())) return false;
    if (query.flavor && !strain.flavors?.includes(query.flavor.toLowerCase())) return false;
    if (query.minThc && (!strain.thc || strain.thc < parseFloat(query.minThc))) return false;
    if (query.maxThc && (!strain.thc || strain.thc > parseFloat(query.maxThc))) return false;
    if (query.source && !strain.sources?.includes(query.source)) return false;
    return true;
  });
}

// Strain count endpoint for homepage
router.get('/strains/count', (req, res) => {
  res.json({ count: Array.isArray(strains) ? strains.length : 0 });
});

// Routes

// Get all strains with optional filtering
router.get('/strains', (req, res) => {
  const { page = 1, limit = 20, sort, ...query } = req.query;
  let results = filterStrains(query);
  
  // Apply sorting
  if (sort) {
    const [field, order] = sort.split(':');
    results.sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];
      return order === 'desc' ? (bVal > aVal ? 1 : -1) : (aVal > bVal ? 1 : -1);
    });
  }

  // Apply pagination
  const start = (page - 1) * limit;
  const paginatedResults = results.slice(start, start + parseInt(limit));

  res.json({
    total: results.length,
    page: parseInt(page),
    pages: Math.ceil(results.length / limit),
    strains: paginatedResults
  });
});

// Get a single strain by slug
router.get('/strains/:slug', (req, res) => {
  const strain = strains.find(s => s.slug === req.params.slug);
  if (!strain) return res.status(404).json({ error: 'Strain not found' });
  res.json(strain);
});

// Get lab test results for a strain
router.get('/strains/:slug/tests', (req, res) => {
  const strain = strains.find(s => s.slug === req.params.slug);
  if (!strain) return res.status(404).json({ error: 'Strain not found' });
  
  // Get any direct lab results
  const directTests = strain.labTestResults || [];
  
  // Get mapped anonymous test results
  const mappedTests = [];
  Object.entries(testMapping.strains || {}).forEach(([id, data]) => {
    const targetSlug = (data && typeof data === 'object') ? data.mappedTo : (typeof data === 'string' ? data : null);
    if (!targetSlug) return;
    // Normalize value possibly being a name
    const slugNorm = String(targetSlug).toLowerCase().replace(/\s+/g, '-');
    if (slugNorm === strain.slug) {
      mappedTests.push({ id, mappedTo: strain.slug, anonymous: true });
    }
  });

  res.json({
    strain: strain.name,
    directTests,
    mappedTests,
    stats: {
      totalTests: directTests.length + mappedTests.length,
      avgThc: (directTests.length + mappedTests.length) ? ([...directTests, ...mappedTests].reduce((sum, t) => sum + (t.thc || 0), 0) / (directTests.length + mappedTests.length)) : 0
    }
  });
});

// Get strain effects
router.get('/effects', (req, res) => {
  const effects = new Set();
  strains.forEach(strain => {
    strain.effects?.forEach(effect => effects.add(effect));
  });
  res.json(Array.from(effects));
});

// Get strain flavors/terpenes
router.get('/flavors', (req, res) => {
  const flavors = new Set();
  strains.forEach(strain => {
    strain.flavors?.forEach(flavor => flavors.add(flavor));
  });
  res.json(Array.from(flavors));
});

// Get strain types
router.get('/types', (req, res) => {
  const types = new Set();
  strains.forEach(strain => {
    if (strain.type) types.add(strain.type);
  });
  res.json(Array.from(types));
});

// Search strains by name
router.get('/search', (req, res) => {
  const { q, limit = 10 } = req.query;
  if (!q) return res.json([]);

  const query = q.toLowerCase();
  const results = strains
    .filter(strain => 
      strain.name.toLowerCase().includes(query) ||
      strain.description?.toLowerCase().includes(query)
    )
    .slice(0, parseInt(limit));

  res.json(results);
});

// Get statistics about the strain database
router.get('/stats', (req, res) => {
  const stats = {
    total: strains.length,
    byType: {},
    sources: {},
    effects: {},
    flavors: {},
    thc: {
      min: Infinity,
      max: -Infinity,
      avg: 0,
      count: 0
    },
    cbd: {
      min: Infinity,
      max: -Infinity,
      avg: 0,
      count: 0
    }
  };

  strains.forEach(strain => {
    // Count by type
    if (strain.type) {
      stats.byType[strain.type] = (stats.byType[strain.type] || 0) + 1;
    }

    // Count by source
    strain.sources?.forEach(source => {
      stats.sources[source] = (stats.sources[source] || 0) + 1;
    });

    // Count effects
    strain.effects?.forEach(effect => {
      stats.effects[effect] = (stats.effects[effect] || 0) + 1;
    });

    // Count flavors
    strain.flavors?.forEach(flavor => {
      stats.flavors[flavor] = (stats.flavors[flavor] || 0) + 1;
    });

    // THC stats
    if (strain.thc !== null) {
      stats.thc.min = Math.min(stats.thc.min, strain.thc);
      stats.thc.max = Math.max(stats.thc.max, strain.thc);
      stats.thc.avg += strain.thc;
      stats.thc.count++;
    }

    // CBD stats
    if (strain.cbd !== null) {
      stats.cbd.min = Math.min(stats.cbd.min, strain.cbd);
      stats.cbd.max = Math.max(stats.cbd.max, strain.cbd);
      stats.cbd.avg += strain.cbd;
      stats.cbd.count++;
    }
  });

  // Finalize averages
  if (stats.thc.count) stats.thc.avg /= stats.thc.count;
  if (stats.cbd.count) stats.cbd.avg /= stats.cbd.count;

  res.json(stats);
});

export default router;