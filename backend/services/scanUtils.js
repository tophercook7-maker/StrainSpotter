/**
 * Canonical Strain Decision Helper
 * 
 * Determines the canonical strain name for a scan based on strict priority rules:
 * 1. Packaging/label strain (for packaged products) - NEVER overridden by visual guesses
 * 2. Visual match (for raw bud) - only if confidence >= 0.6
 * 3. None - "Cannabis (strain unknown)"
 */

/**
 * Normalize packaging strain name by removing quantity tokens and cleaning whitespace
 */
function normalizePackagingStrainName(name) {
  if (!name) return null;
  let s = String(name).trim();
  
  // Remove leading quantity tokens
  s = s.replace(/^(1g|1G|ONE GRAM|1 GRAM|1G VAPE|1g VAPE|VAPE\s+)?/i, '');
  
  // Collapse multiple spaces to single spaces
  s = s.replace(/\s+/g, ' ').trim();
  
  return s || null;
}

/**
 * Determine canonical strain name with strict priority rules
 * 
 * @param {Object} params
 * @param {Object} params.packagingInsights - Packaging insights object
 * @param {Object} params.labelInsights - Label insights object
 * @param {Object} params.visualMatch - Top visual match object
 * @param {number} params.visualConfidence - Visual match confidence (0-1)
 * @returns {Object} Canonical strain decision
 */
export function determineCanonicalStrain({
  packagingInsights = null,
  labelInsights = null,
  visualMatch = null,
  visualConfidence = null,
}) {
  // Extract packaging/label strain name
  const packagingStrainRaw =
    packagingInsights?.strainName ||
    labelInsights?.strainName ||
    null;
  
  const packagingStrain = normalizePackagingStrainName(packagingStrainRaw);
  
  // Determine if this is a packaged product
  const isPackagedProduct =
    !!(packagingInsights?.isPackagedProduct ||
       labelInsights?.isPackagedProduct ||
       packagingInsights ||
       (labelInsights && (labelInsights.category === 'vape' || labelInsights.category === 'packaged')));
  
  // Extract visual match strain name (for non-packaged products only)
  let visualStrain = null;
  if (visualMatch) {
    visualStrain = visualMatch.strain?.name ||
                   visualMatch.strain?.strain_name ||
                   visualMatch.strain?.slug ||
                   visualMatch.name ||
                   null;
  }
  
  // Determine canonical strain name with strict priority
  let canonicalStrainName = null;
  let strainSource = 'none';
  let matchConfidence = null;
  
  // Priority 1: Packaged products ALWAYS use packaging strain (NEVER visual guesses)
  if (isPackagedProduct) {
    if (packagingStrain) {
      canonicalStrainName = packagingStrain;
      strainSource = 'packaging';
      matchConfidence = packagingInsights?.overallConfidence ||
                       packagingInsights?.confidence?.overall ||
                       labelInsights?.confidence ||
                       1.0; // High confidence for packaging-derived names
    } else {
      // Packaged product but no strain name from label
      canonicalStrainName = 'Cannabis (strain unknown)';
      strainSource = 'packaging-unknown';
      matchConfidence = 0;
    }
  } else {
    // Priority 2: Raw bud - use visual match only if confidence >= 0.6
    if (visualStrain && visualConfidence != null && visualConfidence >= 0.6) {
      canonicalStrainName = visualStrain;
      strainSource = 'visual';
      matchConfidence = visualConfidence;
    } else {
      // No valid visual match
      canonicalStrainName = 'Cannabis (strain unknown)';
      strainSource = 'none';
      matchConfidence = 0;
    }
  }
  
  return {
    isPackagedProduct,
    packagingStrain,
    visualStrain,
    canonicalStrainName,
    strainSource,
    matchConfidence,
  };
}

