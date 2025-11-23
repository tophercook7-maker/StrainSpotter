import { supabaseAdmin } from '../supabaseAdmin.js';

/**
 * Normalize strain name for matching
 * - trim whitespace
 * - collapse double spaces
 * - lowercase for comparison
 */
function normalizeStrainName(name) {
  if (!name || typeof name !== 'string') return null;
  return name
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

/**
 * Find seed bank entry for a canonical strain name
 * @param {object} params
 * @param {string} params.canonicalName - The canonical strain name to look up
 * @returns {Promise<object|null>} Seed bank entry or null if not found
 */
export async function findSeedBankEntry({ canonicalName }) {
  if (!canonicalName || typeof canonicalName !== 'string') {
    console.log('[seed-bank] no match', { canonicalName: 'invalid input' });
    return null;
  }

  const normalized = normalizeStrainName(canonicalName);
  if (!normalized) {
    console.log('[seed-bank] no match', { canonicalName });
    return null;
  }

  try {
    // Query strains table by normalized name
    // Primary match: lower(name) = normalizedCanonicalName
    const { data, error } = await supabaseAdmin
      .from('strains')
      .select('*')
      .ilike('name', normalized)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[seed-bank] error', {
        canonicalName,
        message: error.message,
      });
      return null;
    }

    if (!data) {
      console.log('[seed-bank] no match', { canonicalName });
      return null;
    }

    // Extract seed bank URL from seed_vendors jsonb if available
    let seedBankUrl = null;
    if (data.seed_vendors && typeof data.seed_vendors === 'object') {
      // seed_vendors might be an array or object
      if (Array.isArray(data.seed_vendors) && data.seed_vendors.length > 0) {
        // Take first vendor's URL if available
        const firstVendor = data.seed_vendors[0];
        seedBankUrl = firstVendor?.url || firstVendor?.website || null;
      } else if (data.seed_vendors.url) {
        seedBankUrl = data.seed_vendors.url;
      } else if (data.seed_vendors.website) {
        seedBankUrl = data.seed_vendors.website;
      }
    }

    // Map DB row to clean JS object
    const entry = {
      name: data.name || null,
      breeder: data.breeder || null,
      type: data.type || null, // 'hybrid' | 'indica' | 'sativa'
      thcMin: data.thc || null, // Single value - use as both min and max
      thcMax: data.thc || null,
      cbdMin: data.cbd || null, // Single value - use as both min and max
      cbdMax: data.cbd || null,
      parents: data.lineage || null, // Lineage often contains parent info
      lineage: data.lineage || null,
      dominantTerpenes: Array.isArray(data.flavors) ? data.flavors : [], // Flavors array used for terpenes
      seedBankUrl: seedBankUrl || null,
    };

    console.log('[seed-bank] found', {
      canonicalName,
      matched: entry.name,
      breeder: entry.breeder,
      type: entry.type,
    });

    return entry;
  } catch (err) {
    console.error('[seed-bank] error', {
      canonicalName,
      message: err?.message || String(err),
    });
    return null;
  }
}

