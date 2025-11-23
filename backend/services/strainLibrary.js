import { supabaseAdmin } from '../supabaseAdmin.js';

/**
 * Get strain library information by name
 * @param {string} strainName - The strain name to look up
 * @returns {Promise<object|null>} Strain library info or null if not found
 */
export async function getStrainLibraryInfo(strainName) {
  if (!strainName || typeof strainName !== 'string') {
    return null;
  }

  try {
    const normalized = strainName.trim().toLowerCase();
    
    const { data, error } = await supabaseAdmin
      .from('strains')
      .select('*')
      .ilike('name', normalized)
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    // Extract indica/sativa percentages
    const indica = data.indica_percent ?? null;
    const sativa = data.sativa_percent ?? null;
    
    // Calculate if not directly available
    let indicaPercent = indica;
    let sativaPercent = sativa;
    
    if (indicaPercent === null || sativaPercent === null) {
      // Infer from type if available
      const type = (data.type || '').toLowerCase();
      if (type.includes('indica')) {
        indicaPercent = 70;
        sativaPercent = 30;
      } else if (type.includes('sativa')) {
        indicaPercent = 30;
        sativaPercent = 70;
      } else {
        // Default hybrid
        indicaPercent = 50;
        sativaPercent = 50;
      }
    }

    // Extract terpenes from flavors array
    const terps = Array.isArray(data.flavors) ? data.flavors : [];

    return {
      name: data.name,
      type: data.type,
      thc: data.thc || null,
      cbd: data.cbd || null,
      indica: indicaPercent,
      sativa: sativaPercent,
      lineage: data.lineage || null,
      terps: terps,
      flowering: extractFloweringTime(data), // Extract from grow_tips or default
      description: data.description || null,
    };
  } catch (err) {
    console.error('[strain-library] error', {
      strainName,
      message: err?.message || String(err),
    });
    return null;
  }
}

/**
 * Extract flowering time from strain data
 * Looks in grow_tips JSONB or uses defaults based on type
 */
function extractFloweringTime(data) {
  // Check grow_tips JSONB for flowering time
  if (data.grow_tips && typeof data.grow_tips === 'object') {
    if (typeof data.grow_tips.flowering_time === 'number') {
      return data.grow_tips.flowering_time;
    }
    if (typeof data.grow_tips.flowering === 'number') {
      return data.grow_tips.flowering;
    }
  }

  // Default based on type
  const type = (data.type || '').toLowerCase();
  if (type.includes('sativa')) {
    return 10; // Sativa typically 10-12 weeks
  } else if (type.includes('indica')) {
    return 8; // Indica typically 8-9 weeks
  }

  return 9; // Default hybrid
}

