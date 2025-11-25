// backend/services/seedBankKnownStrains.js
// Provides a list of all canonical strains with seed bank URLs for image scraping

import { supabaseAdmin } from '../supabaseAdmin.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get ALL strains from the JSON file (where the app actually loads from)
 * The app uses backend/data/strain_library.json, not the database
 */
export async function getAllStrainsFromJSON() {
  const strainsSet = new Set();
  
  try {
    // Load from JSON file (same file the API uses)
    const strainPath = path.join(__dirname, '../data/strain_library.json');
    
    if (!fs.existsSync(strainPath)) {
      console.warn('[seedBankKnownStrains] strain_library.json not found at', strainPath);
      return [];
    }
    
    const rawStrains = fs.readFileSync(strainPath, 'utf8');
    const strains = JSON.parse(rawStrains);
    
    if (!Array.isArray(strains)) {
      console.error('[seedBankKnownStrains] strain_library.json is not an array');
      return [];
    }
    
    strains.forEach(strain => {
      if (strain?.name) {
        strainsSet.add(strain.name.toUpperCase());
      }
    });
    
    return Array.from(strainsSet).sort();
  } catch (err) {
    console.error('[seedBankKnownStrains] Error reading JSON file:', err.message);
    return [];
  }
}

/**
 * Get ALL strains from the database (strains table + scans with canonical_strain_name)
 * Returns unique list of canonical strain names
 */
export async function getAllStrainsFromDatabase() {
  const strainsSet = new Set();
  
  try {
    // Get all strains from strains table
    const { data: strainsData, error: strainsError } = await supabaseAdmin
      .from('strains')
      .select('name, slug')
      .not('name', 'is', null);
    
    if (!strainsError && strainsData) {
      strainsData.forEach(strain => {
        if (strain.name) {
          strainsSet.add(strain.name.toUpperCase());
        }
      });
    }
    
    // Get all canonical strain names from scans table
    const { data: scansData, error: scansError } = await supabaseAdmin
      .from('scans')
      .select('canonical_strain_name, result')
      .not('canonical_strain_name', 'is', null);
    
    if (!scansError && scansData) {
      scansData.forEach(scan => {
        if (scan.canonical_strain_name) {
          strainsSet.add(scan.canonical_strain_name.toUpperCase());
        }
        // Also check result.canonical_strain.name
        if (scan.result?.canonical_strain?.name) {
          strainsSet.add(scan.result.canonical_strain.name.toUpperCase());
        }
      });
    }
    
    return Array.from(strainsSet).sort();
  } catch (err) {
    console.error('[seedBankKnownStrains] Error fetching strains:', err.message);
    return [];
  }
}

/**
 * Get seed bank URLs from scans that have seedBank data
 * @param {string} canonicalName - The strain name to search for
 * @returns {Promise<object|null>} Seed bank info or null
 */
export async function getSeedBankUrlForStrain(canonicalName) {
  if (!canonicalName) return null;
  
  const normalized = canonicalName.toUpperCase();
  
  try {
    // Search scans for this strain with seedBank data
    // Query by canonical_strain_name first
    const { data: scansByName, error: error1 } = await supabaseAdmin
      .from('scans')
      .select('result, canonical_strain_name')
      .eq('canonical_strain_name', normalized)
      .not('result', 'is', null)
      .limit(10);
    
    let scansData = scansByName || [];
    
    // Also query by result.canonical_strain.name (if that column exists or we can filter in JS)
    // For now, just use the first query and check result.canonical_strain.name in JS
    if (!error1 && scansData.length > 0) {
      // Filter by result.canonical_strain.name in JS
      scansData = scansData.filter(scan => {
        const resultName = scan.result?.canonical_strain?.name || scan.result?.canonicalStrain?.name;
        return !resultName || resultName.toUpperCase() === normalized;
      });
    }
    
    if (scansData.length === 0) {
      // Try to find by result.canonical_strain.name by fetching more scans and filtering
      const { data: allScans, error: error2 } = await supabaseAdmin
        .from('scans')
        .select('result, canonical_strain_name')
        .not('result', 'is', null)
        .limit(100);
      
      if (!error2 && allScans) {
        scansData = allScans.filter(scan => {
          const resultName = scan.result?.canonical_strain?.name || 
                            scan.result?.canonicalStrain?.name ||
                            scan.canonical_strain_name;
          return resultName && resultName.toUpperCase() === normalized;
        }).slice(0, 10);
      }
    }
    
    // Look for seedBank.seedBankUrl in scan results
    for (const scan of scansData) {
      const seedBank = scan.result?.seedBank || scan.result?.seed_bank;
      if (seedBank?.seedBankUrl || seedBank?.seed_bank_url) {
        return {
          seedBankName: seedBank.name || seedBank.breeder || 'Unknown Breeder',
          seedBankUrl: seedBank.seedBankUrl || seedBank.seed_bank_url,
        };
      }
    }
    
    return null;
  } catch (err) {
    console.error('[seedBankKnownStrains] Error fetching seedBank URL:', err.message);
    return null;
  }
}

/**
 * Get list of ALL canonical strains with seed bank URLs for image scraping
 * Loads from JSON file (where the app actually uses) and matches with seedBank URLs from scans
 */
export async function getKnownSeedBankStrains() {
  console.log('[seedBankKnownStrains] Fetching all strains from JSON file (strain_library.json)...');
  
  // Get all unique strain names from JSON file (where the app actually loads from)
  const jsonStrains = await getAllStrainsFromJSON();
  console.log('[seedBankKnownStrains] Found', jsonStrains.length, 'strains in JSON file');
  
  // Also get from database for completeness
  const dbStrains = await getAllStrainsFromDatabase();
  console.log('[seedBankKnownStrains] Found', dbStrains.length, 'strains in database');
  
  // Combine both sources
  const allStrainsSet = new Set([...jsonStrains, ...dbStrains]);
  const allStrains = Array.from(allStrainsSet).sort();
  console.log('[seedBankKnownStrains] Total unique strains:', allStrains.length);
  
  // Build list with seedBank URLs where available
  const strainsWithUrls = [];
  
  // Process in batches to avoid overwhelming the database
  const batchSize = 100;
  for (let i = 0; i < allStrains.length; i += batchSize) {
    const batch = allStrains.slice(i, i + batchSize);
    console.log(`[seedBankKnownStrains] Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(allStrains.length / batchSize)} (${batch.length} strains)...`);
    
    for (const strainName of batch) {
      // Try to get seedBank URL from scans
      const seedBankInfo = await getSeedBankUrlForStrain(strainName);
      
      if (seedBankInfo && seedBankInfo.seedBankUrl) {
        strainsWithUrls.push({
          canonicalName: strainName,
          seedBankName: seedBankInfo.seedBankName,
          seedBankUrl: seedBankInfo.seedBankUrl,
        });
      } else {
        // No seedBank URL found, but include it anyway (we'll try generic search)
        strainsWithUrls.push({
          canonicalName: strainName,
          seedBankName: null,
          seedBankUrl: null, // Will need to search for this
        });
      }
    }
    
    // Small delay between batches to be nice to the database
    if (i + batchSize < allStrains.length) {
      await new Promise(r => setTimeout(r, 100));
    }
  }
  
  console.log('[seedBankKnownStrains] Found', strainsWithUrls.filter(s => s.seedBankUrl).length, 'strains with seedBank URLs');
  return strainsWithUrls;
}

/**
 * Get seed bank strains from recent scans that have seedBank data
 * This can be used to dynamically build the list from actual scan results
 */
export async function getSeedBankStrainsFromScans() {
  try {
    const { data, error } = await supabaseAdmin
      .from('scans')
      .select('canonical_strain_name, result')
      .not('result->seedBank->seedBankUrl', 'is', null)
      .limit(1000);
    
    if (error || !data) {
      return [];
    }
    
    const strainsMap = new Map();
    
    data.forEach(scan => {
      const canonicalName = scan.canonical_strain_name || scan.result?.canonical_strain?.name;
      if (!canonicalName) return;
      
      const seedBank = scan.result?.seedBank || scan.result?.seed_bank;
      const seedBankUrl = seedBank?.seedBankUrl || seedBank?.seed_bank_url;
      
      if (seedBankUrl && !strainsMap.has(canonicalName.toUpperCase())) {
        strainsMap.set(canonicalName.toUpperCase(), {
          canonicalName: canonicalName.toUpperCase(),
          seedBankName: seedBank.name || seedBank.breeder || 'Unknown Breeder',
          seedBankUrl,
        });
      }
    });
    
    return Array.from(strainsMap.values());
  } catch (err) {
    console.error('[seedBankKnownStrains] Error fetching from scans:', err.message);
    return [];
  }
}

