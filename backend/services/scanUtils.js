/**
 * Canonical Strain Decision Helper
 * 
 * Determines the canonical strain name for a scan based on strict priority rules:
 * 1. Packaging/label strain (for packaged products) - NEVER overridden by visual guesses
 * 2. Visual match (for raw bud) - only if confidence >= 0.6
 * 3. None - "Cannabis (strain unknown)"
 * 
 * IMPORTANT:
 * - Do NOT mutate packagingInsights or labelInsights in-place
 * - Do NOT allow visual guesses ("Limon", "MAC", "Evergreen Berry", etc.) to override packaging strain
 * - Visual guesses only count when not packaged
 */

/**
 * Normalize packaging strain name by removing quantity tokens and cleaning whitespace
 */
export function normalizePackagingStrainName(name) {
  if (!name) return null;
  let s = String(name).trim();
  
  // Remove leading quantity tokens
  s = s.replace(/^(1g|1G|ONE GRAM|1 GRAM|1G VAPE|1g VAPE|VAPE\s+)?/i, '');
  
  // Collapse multiple spaces to single spaces
  s = s.replace(/\s+/g, ' ').trim();
  
  return s || null;
}

/**
 * Resolve canonical strain name with strict priority rules
 * 
 * @param {Object} params
 * @param {Object} params.labelInsights - Label insights object
 * @param {Object} params.packagingInsights - Packaging insights object
 * @param {Array} params.visualMatches - Array of visual match objects
 * @param {number} params.matchConfidence - Optional previous match confidence (0-1)
 * @returns {Object} Canonical strain decision
 */
export function resolveCanonicalStrain({ labelInsights, packagingInsights, visualMatches, matchConfidence }) {
  // Extract packaging/label strain name
  const packagingStrainRaw =
    packagingInsights?.strainName ||
    labelInsights?.strainName ||
    null;
  
  // Determine if this is a packaged product
  const isPackagedProduct =
    !!(packagingInsights?.isPackagedProduct ||
       labelInsights?.isPackagedProduct);
  
  // Normalize packaging strain name
  const packagingStrain = normalizePackagingStrainName(packagingStrainRaw);
  
  // Extract visual match from visualMatches array
  const visualTop = (visualMatches && visualMatches[0]) || null;
  const visualStrain = visualTop?.name || null;
  
  // Determine visual confidence (handle 0-100 scale conversion)
  let visualConfidence = null;
  if (typeof visualTop?.confidence === 'number') {
    // visualTop.confidence is 0–100, convert to 0–1
    visualConfidence = visualTop.confidence / 100;
  } else if (typeof matchConfidence === 'number') {
    // Optional previous matchConfidence 0–1
    visualConfidence = matchConfidence;
  }
  
  // Determine canonical strain name with strict priority
  let canonicalStrainName = null;
  let strainSource = 'none';
  let canonicalMatchConfidence = null;
  
  // Priority 1: Packaged products ALWAYS use packaging strain (NEVER visual guesses)
  if (isPackagedProduct && packagingStrain) {
    canonicalStrainName = packagingStrain;
    strainSource = 'packaging';
    canonicalMatchConfidence = 1;
  } else if (visualStrain && visualConfidence != null && visualConfidence >= 0.6) {
    // Priority 2: Raw bud - use visual match only if confidence >= 0.6
    canonicalStrainName = visualStrain;
    strainSource = 'visual';
    canonicalMatchConfidence = visualConfidence;
  }
  // Otherwise: canonicalStrainName stays null, strainSource stays 'none', confidence stays null
  
  return {
    isPackagedProduct,
    packagingStrain,
    visualStrain,
    canonicalStrainName,
    strainSource,
    matchConfidence: canonicalMatchConfidence,
  };
}

