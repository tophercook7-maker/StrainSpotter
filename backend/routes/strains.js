import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();
const DATA_DIR = path.join(process.cwd(), 'data');

// Load strain data
let strains = [];
let testMapping = {};

function loadData() {
  try {
    strains = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'strain_library.json')));
    testMapping = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'test_mapping.json')));
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
    if (data.mappedTo === strain.slug) {
      mappedTests.push({
        ...data,
        anonymous: true
      });
    }
  });

  res.json({
    strain: strain.name,
    directTests,
    mappedTests,
    stats: {
      totalTests: directTests.length + mappedTests.length,
      avgThc: [...directTests, ...mappedTests].reduce((sum, t) => sum + (t.thc || 0), 0) / (directTests.length + mappedTests.length)
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