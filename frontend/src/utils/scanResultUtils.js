// Shared utilities for normalizing scan results across ScanPage and ScanWizard

// Common strain / product keywords we care about
export const STRAIN_NAME_KEYWORDS = [
  'kush',
  'og',
  'glue',
  'haze',
  'diesel',
  'cake',
  'pie',
  'runtz',
  'bomb',
  'mint',
  'mints',
  'punch',
  'gelato',
  'cookies',
  'cookie',
  'sherb',
  'sherbet',
  'tangie',
  'skunk',
  'berry',
  'lemon',
  'lime',
  'mac',
  'fuel',
];

// Lines containing any of these fragments should NEVER be used as the strain name
export const LABEL_LINE_BANNED_FRAGMENTS = [
  'net wt',
  'oz)',
  'mg',
  '%',
  'thc',
  'cbd',
  'limonene',
  'myrcene',
  'caryophyllene',
  'lab',
  'tested',
  'batch',
  'permit',
  'uin',
  'scan to learn',
  'activation time',
  'manufactured by',
  'suite',
  'bio track',
  'warning',
  'keep out of reach',
  'ingredients',
  'license',
];

function toTitleCase(str) {
  return str
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');
}

// Extract a nice candidate name from the raw OCR text on a package label
export function extractLabelNameFromRawText(rawText) {
  if (!rawText) return null;

  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  let bestLine = null;
  let bestScore = 0;

  for (const line of lines) {
    const lower = line.toLowerCase();

    // Skip clearly non-name lines
    if (LABEL_LINE_BANNED_FRAGMENTS.some((frag) => lower.includes(frag))) {
      continue;
    }

    // Remove pure numeric tokens (1g, 0.035oz, 88.18%, etc.)
    const cleaned = line
      .replace(/\b\d+(\.\d+)?\b/g, ' ')
      .replace(/[%()]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleaned) continue;

    const words = cleaned.split(' ');

    if (words.length < 2 || words.length > 5) continue; // avoid single-word or super-long lines

    const lowerClean = cleaned.toLowerCase();

    const hasKeyword = STRAIN_NAME_KEYWORDS.some((kw) =>
      lowerClean.includes(kw),
    );

    if (!hasKeyword) continue;

    // Scoring:
    // +2 for having a keyword
    // +1 for length 2–4 words (nice product names)
    // +1 if not ALL CAPS
    let score = 2;
    if (words.length >= 2 && words.length <= 4) score += 1;
    if (cleaned !== cleaned.toUpperCase()) score += 1;

    // Prefer longer "interesting" names over short generic ones
    score += cleaned.length * 0.01;

    if (score > bestScore) {
      bestScore = score;
      bestLine = cleaned;
    }
  }

  if (!bestLine) return null;

  return toTitleCase(bestLine);
}

// Banned name fragments for cleanCandidateName (lowercase for matching)
// Must match backend BANNED list in visualMatcher.js
export const BANNED_NAME_FRAGMENTS = [
  'set the',
  'set the experience',
  'set the vape',
  'set the full spectrum',
  'full spectrum vape cartridge',
  'full spectrum cartridge',
  'full spectrum totals',
  'total cannabinoids',
  'activation time',
  'activation approx',
  'activation approx.',
  'for use by',
  'not approved',
  'keep out of reach',
  'testing lab',
  'lab:',
  'coa',
  'batch',
  'date made',
  'test date',
  'exp. date',
  'suite',
  'tel',
  'ocked the rich te',
  'rm. our full-spectrum',
  'rm. our full-spectre',
  'r full spectrum prode'
];

/**
 * Clean and validate a candidate name
 * Returns null if the name is invalid or contains banned fragments
 */
export function cleanCandidateName(raw) {
  if (!raw) return null;
  let s = String(raw).trim().replace(/\s+/g, ' ');
  if (s.length < 3) return null;
  const lower = s.toLowerCase();
  if (BANNED_NAME_FRAGMENTS.some(f => lower.includes(f))) {
    return null;
  }
  return s;
}

// used by ScanResultCard to power the actions row
export function getStrainIdentityFromResult(result) {
  if (!result) return { slug: null, name: null };

  const slug =
    result.matched_strain_slug ||
    result.slug ||
    result.topMatch?.slug ||
    result.topMatch?.id || // id might be the slug
    result.primaryMatch?.slug ||
    result.matches?.[0]?.slug ||
    result.matches?.[0]?.id || // id might be the slug
    null;

  const dbNameRaw =
    result.topMatch?.name ||
    result.primaryMatch?.name ||
    result.matchedName ||
    result.name ||
    result.matches?.[0]?.name ||
    null;

  const dbName = cleanCandidateName(dbNameRaw);
  return { slug, name: dbName };
}

/**
 * Get primary name for a scan result based on scan type
 * For packaged products: prefers AI/label name over DB name
 * For plant scans: prefers DB name over label name
 */
export function getPrimaryNameForResult(result) {
  if (!result) return "Unknown";
  
  const isPackage = Boolean(result.isPackagedProduct);
  const labelInsights = result.labelInsights || {};
  const aiSummary = result.aiSummary || labelInsights.aiSummary || null;
  const topMatch = result.topMatch || null;
  
  const dbName = cleanCandidateName(
    (result?.topMatch && result.topMatch.name) ||
    result?.matchedName ||
    result?.name ||
    topMatch?.name
  );
  
  const labelStrain = cleanCandidateName(labelInsights?.strainName);
  const aiTitle = cleanCandidateName(aiSummary?.title);
  
  let primaryName = null;
  
  if (isPackage) {
    primaryName = aiTitle || labelStrain || dbName || "Unknown product";
  } else {
    primaryName = dbName || labelStrain || "Unknown strain";
  }
  
  return primaryName;
}

/**
 * Transform scan result using canonical strain from backend.
 * CRITICAL: Frontend now consumes canonicalStrain as single source of truth.
 * 
 * @param {Object} scan - Backend scan object (should include canonicalStrain)
 * @returns {Object} Transformed result with strainName, strainSource, effectsTags, flavorTags
 */
export function transformScanResult(scan) {
  if (!scan) return null;

  const result = scan?.result || {};
  const packagingInsights = scan.packaging_insights || result.packagingInsights || null;
  const labelInsights = scan.label_insights || result.labelInsights || null;
  
  // CRITICAL: Use canonicalStrain as single source of truth
  // Backend sets canonicalStrain with strict priority: Packaging > Label > Visual
  const canonical = scan.canonicalStrain || result.canonicalStrain || {
    name: scan.matched_strain_name || null,
    source: scan.match_quality || null,
    confidence: scan.match_confidence || null,
  };
  
  // Determine if this is a packaged product
  const isPackagedProduct =
    packagingInsights?.isPackagedProduct === true ||
    labelInsights?.isPackagedProduct === true ||
    scan.ai_summary?.isPackagedProduct === true ||
    canonical.source === 'packaging' ||
    canonical.source === 'packaged-unknown' ||
    false;

  // Preserve existing fields for backward compatibility
  const existingFields = {
    id: scan.id,
    created_at: scan.created_at,
    processed_at: scan.processed_at,
    image_url: scan.image_url,
    status: scan.status,
    result: result,
    packaging_insights: packagingInsights,
    label_insights: labelInsights,
    ai_summary: scan.ai_summary,
    matched_strain_slug: scan.matched_strain_slug,
    match_confidence: canonical.confidence ?? scan.match_confidence,
    match_quality: canonical.source || scan.match_quality,
    matched_strain_name: canonical.name !== 'Cannabis (strain unknown)' ? canonical.name : scan.matched_strain_name,
  };

  // Extract effects and flavors (empty for now, can be populated from AI summary if needed)
  const effectsTags = [];
  const flavorTags = [];

  return {
    ...existingFields,
    strainName: canonical.name || 'Cannabis (strain unknown)',
    strainSource: canonical.source || 'none',
    matchConfidence: canonical.confidence ?? 0,
    isPackagedProduct: isPackagedProduct,
    effectsTags: effectsTags,
    flavorTags: flavorTags,
  };
}

/**
 * Normalize backend scan row into the shape ScanResultCard expects,
 * including labelInsights from the backend.
 * 
 * NOTE: This function now uses transformScanResult for strain name determination.
 */
export function normalizeScanResult(scan) {
  if (!scan || !scan.result) return null;

  const result = scan?.result || {};
  
  // First, transform the scan to get the canonical strain name
  const transformed = transformScanResult(scan);
  if (!transformed) return null;
  
  // Build matches from visualMatches structure (for backward compatibility)
  let matchesFromVisual = [];
  if (result.visualMatches) {
    const topMatch = result.visualMatches.match;
    const candidates = Array.isArray(result.visualMatches.candidates) 
      ? result.visualMatches.candidates 
      : [];
    
    if (topMatch) {
      matchesFromVisual = [topMatch, ...candidates];
    } else if (candidates.length > 0) {
      matchesFromVisual = candidates;
    }
  }
  
  // Build matches from flat structure (fallback)
  let matchesFromFlat = [];
  if (Array.isArray(result.matches)) {
    matchesFromFlat = result.matches;
  } else if (result.match) {
    matchesFromFlat = [result.match];
  }
  
  // Decide which list to use (prefer visualMatches if available)
  const allMatches = matchesFromVisual.length > 0 ? matchesFromVisual : matchesFromFlat;

  // Map each match to normalized format
  const toItem = (candidate) => {
    const strainObj = candidate.strain || candidate;
    const confidence = 
      candidate.confidence ?? 
      candidate.score ?? 
      candidate.probability ?? 
      0;
    
    const slug = strainObj.strain_slug || strainObj.slug || strainObj.id || null;
    
    return {
      id: slug || strainObj.name || 'unknown',
      slug: slug,
      name: strainObj.name || 'Unknown strain',
      type: strainObj.type || strainObj.category || 'Hybrid',
      description: strainObj.description || strainObj.summary || '',
      confidence,
      dbMeta: strainObj,
    };
  };

  const [first, ...rest] = allMatches.length > 0 ? allMatches : [null];

  // Extract labelInsights from various possible locations
  const labelInsights = 
    result.labelInsights || 
    result.visualMatches?.labelInsights || 
    transformed.label_insights ||
    null;
  
  // Ensure labelInsights has rawText if available
  if (labelInsights && !labelInsights.rawText) {
    labelInsights.rawText = result.rawText || result.detectedText || '';
  }

  // Extract matched_strain_slug from various possible locations
  const matched_strain_slug = 
    result.matched_strain_slug ||
    scan?.matched_strain_slug ||
    first?.strain?.strain_slug ||
    first?.strain?.slug ||
    first?.strain_slug ||
    first?.slug ||
    transformed.matched_strain_slug ||
    null;

  // Extract packagingInsights from result
  const packagingInsights = result.packagingInsights || transformed.packaging_insights || null;

  return {
    topMatch: first ? toItem(first) : null,
    otherMatches: rest.map(toItem),
    matches: allMatches.map(toItem),
    matched_strain_slug,
    labelInsights,
    aiSummary: labelInsights?.aiSummary || transformed.ai_summary || null,
    isPackagedProduct: transformed.isPackagedProduct || false,
    packagingInsights,
    visionRaw: result.vision_raw || null,
    // CRITICAL: Include transformed fields for UI components
    strainName: transformed.strainName,
    strainSource: transformed.strainSource,
    effectsTags: transformed.effectsTags,
    flavorTags: transformed.flavorTags,
    matchConfidence: transformed.matchConfidence,
  };
}

/**
 * Get a human-readable label for the scan type based on product category/type
 * @param {Object} params
 * @param {boolean} params.isPackagedProduct - Whether this is a packaged product
 * @param {string} params.category - Category from labelInsights (e.g., 'vape', 'concentrate', 'flower')
 * @param {string} params.productType - Product type string (e.g., 'Vape / Cartridge', 'Concentrate')
 * @returns {string} Label like "Vape cartridge", "Concentrate", "Flower strain", "Plant", or "Strain"
 */
export function getScanKindLabel({ isPackagedProduct, category, productType }) {
  // For packaged products, use category/productType to determine label
  if (isPackagedProduct) {
    const lowerCategory = (category || '').toLowerCase();
    const lowerProductType = (productType || '').toLowerCase();
    
    // Vape/cartridge
    if (lowerCategory === 'vape' || lowerProductType.includes('vape') || lowerProductType.includes('cartridge')) {
      return 'Vape cartridge';
    }
    
    // Concentrate (sauce, rosin, wax, etc.)
    if (lowerCategory === 'concentrate' || 
        lowerProductType.includes('concentrate') || 
        lowerProductType.includes('sauce') || 
        lowerProductType.includes('rosin') ||
        lowerProductType.includes('wax') ||
        lowerProductType.includes('shatter')) {
      return 'Concentrate';
    }
    
    // Pre-roll
    if (lowerProductType.includes('pre-roll') || lowerProductType.includes('preroll')) {
      return 'Pre-roll';
    }
    
    // Edible
    if (lowerCategory === 'edible' || lowerProductType.includes('edible')) {
      return 'Edible';
    }
    
    // Flower (packaged flower)
    if (lowerCategory === 'flower' || lowerProductType.includes('flower')) {
      return 'Flower';
    }
    
    // Default for packaged products
    return 'Packaged product';
  }
  
  // For non-packaged scans (plants/buds)
  if (category === 'flower') {
    return 'Flower strain';
  }
  
  // Default for plant scans
  return 'Plant';
}

