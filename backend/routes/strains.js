import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
// Resolve data directory relative to this file, not process.cwd(), to avoid PM2/cwd issues
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');

// Load strain data
let strains = [];
let testMapping = {};

function loadData() {
  try {
    const strainPath = path.join(DATA_DIR, 'strain_library.json');
    const mappingPath = path.join(DATA_DIR, 'test_mapping.json');

    const rawStrains = fs.readFileSync(strainPath, 'utf8');
    const rawMapping = fs.readFileSync(mappingPath, 'utf8');

    strains = JSON.parse(rawStrains);
    testMapping = JSON.parse(rawMapping);

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

    console.log(`[data] Loaded ${strains.length} strains and ${Object.keys(testMapping.strains).length} test mappings`);
  } catch (e) {
    console.error('[data] Error loading strain data:', e);
  }
}

// Initial load
loadData();

// Watch for data changes
fs.watch(DATA_DIR, (eventType, filename) => {
  if (filename?.endsWith('.json')) {
    console.log(`[watch] Reloading data due to changes in ${filename}`);
    loadData();
  }
});

// Helper function to filter strains
function filterStrains(query = {}) {
  return strains.filter(strain => {
    if (query.type && strain.type?.toLowerCase() !== query.type.toLowerCase()) return false;
    if (query.effect && !strain.effects?.includes(query.effect.toLowerCase())) return false;
    if (query.flavor && !strain.flavors?.includes(query.flavor.toLowerCase())) return false;
    if (query.minThc && (!strain.thc || strain.thc < parseFloat(query.minThc))) return false;
    if (query.maxThc && (!strain.thc || strain.thc > parseFloat(query.maxThc))) return false;
    if (query.source && !strain.sources?.includes(query.source)) return false;
    return true;
  });
}

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