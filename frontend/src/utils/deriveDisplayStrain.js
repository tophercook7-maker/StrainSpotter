/**
 * Normalizes a strain name for comparison (lowercase, remove special chars)
 * @param {string|null|undefined} name - The strain name to normalize
 * @returns {string} Normalized name
 */
function normalizeName(name) {
  return (name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Derives the display strain information from a scan object with priority order:
 * 1. OCR / packaging strain (highest priority for packaged products)
 * 2. AI summary strain field
 * 3. Visual matcher (fallback only for non-packaged products)
 * 
 * @param {Object} scan - The scan object from GET /api/scans/:id
 * @returns {Object} Display strain information
 */
export function deriveDisplayStrain(scan) {
  if (!scan || typeof scan !== 'object') {
    return {
      primaryName: null,
      displaySubline: null,
      primaryType: 'unknown',
      estimateLabel: 'Strain estimate',
      estimateConfidence: null,
      brandName: null,
      thcPercent: null,
      cbdPercent: null,
      isPackagedProduct: false,
      isFlowerGuessOnly: false,
    };
  }

  // Unpack all relevant fields (defensive - all may be missing)
  const packaging = scan.packaging_insights || scan.result?.packagingInsights || null;
  const label = scan.label_insights || scan.result?.labelInsights || null;
  const summary = scan.ai_summary || scan.result?.aiSummary || null;
  const visual = scan.result?.visualMatches || scan.result?.topMatches || scan.result?.matches || [];

  // Determine if this is a packaged product
  const isPackagedFromSummary = summary?.isPackagedProduct === true;
  const isPackagedFromPackaging = !!packaging;
  const isPackagedProduct = isPackagedFromSummary || isPackagedFromPackaging;

  // Extract strain names from different sources
  const packagedStrainName = 
    (packaging?.strainName || packaging?.strain_name || '').trim() ||
    (label?.strainName || label?.strain_name || '').trim() ||
    null;

  const libraryStrainName = 
    (scan.matched_strain_name || scan.matchedStrainName || '').trim() ||
    (summary?.matchedStrainName || summary?.strainName || '').trim() ||
    null;

  // Extract visual matcher strain name (for non-packaged products only)
  let visualStrainName = null;
  if (!isPackagedProduct) {
    const visualMatch = Array.isArray(visual) && visual.length > 0 
      ? (visual[0]?.match || visual[0]) 
      : null;
    if (visualMatch && typeof visualMatch.name === 'string') {
      visualStrainName = visualMatch.name.trim();
    }
  }

  // Determine display strain name and subline
  const hasPackagedStrain = !!packagedStrainName;
  const isUnknownPackaged = isPackagedProduct && !hasPackagedStrain;
  
  let primaryName = null;
  let displaySubline = null;
  let primaryType = 'unknown';
  let estimateConfidence = null;
  let brandName = null;
  let thcPercent = null;
  let cbdPercent = null;
  let isFlowerGuessOnly = false;

  // Pick display name for the TOP CARD
  if (hasPackagedStrain) {
    // We trust the label name first
    primaryName = packagedStrainName;
    
    // Extract confidence and brand from packaging
    estimateConfidence = packaging?.overallConfidence || packaging?.confidence?.overall || null;
    brandName = packaging?.basic?.brand_name || packaging?.package_details?.brand || null;
    
    // Extract THC/CBD from packaging
    if (packaging?.potency) {
      thcPercent = packaging.potency.thc_percent ?? packaging.potency.thc_total_percent ?? null;
      cbdPercent = packaging.potency.cbd_percent ?? packaging.potency.cbd_total_percent ?? null;
    }
    
    // If libraryStrainName is different, we can mention it in a soft way
    if (
      libraryStrainName &&
      normalizeName(libraryStrainName) !== normalizeName(packagedStrainName)
    ) {
      displaySubline = `Similar to ${libraryStrainName}`;
    }
  } else if (isUnknownPackaged) {
    // Packaged product but no strain name from label => DO NOT invent one
    primaryName = 'Cannabis (strain unknown)';
    
    // Extract THC/CBD from label if available
    if (label) {
      thcPercent = label.thc ?? null;
      cbdPercent = label.cbd ?? null;
    }
    if (packaging?.potency) {
      thcPercent = thcPercent ?? packaging.potency.thc_percent ?? packaging.potency.thc_total_percent ?? null;
      cbdPercent = cbdPercent ?? packaging.potency.cbd_percent ?? packaging.potency.cbd_total_percent ?? null;
    }
    brandName = packaging?.basic?.brand_name || packaging?.package_details?.brand || label?.brandName || null;
  } else if (libraryStrainName || visualStrainName) {
    // Non-packaged (likely bud) with a best library/visual match
    primaryName = libraryStrainName || visualStrainName;
    isFlowerGuessOnly = !!visualStrainName;
    
    // Extract type and confidence from visual match if available
    if (visualStrainName) {
      const visualMatch = Array.isArray(visual) && visual.length > 0 
        ? (visual[0]?.match || visual[0]) 
        : null;
      
      if (visualMatch) {
        if (visualMatch.type || visualMatch.strain?.type) {
          const type = (visualMatch.type || visualMatch.strain?.type || '').toLowerCase();
          if (type.includes('indica') && type.includes('sativa')) {
            primaryType = 'hybrid';
          } else if (type.includes('indica')) {
            primaryType = 'indica';
          } else if (type.includes('sativa')) {
            primaryType = 'sativa';
          } else if (type.includes('hybrid')) {
            primaryType = 'hybrid';
          }
        }
        estimateConfidence = visualMatch.confidence ?? visualMatch.score ?? null;
      }
    }
  } else {
    primaryName = 'Cannabis (strain unknown)';
  }

  // Extract THC/CBD from label_insights if not already set
  if (thcPercent === null && label?.thc != null) {
    thcPercent = label.thc;
  }
  if (cbdPercent === null && label?.cbd != null) {
    cbdPercent = label.cbd;
  }

  // Extract brand name from label if not already set
  if (!brandName && label?.brandName) {
    brandName = label.brandName;
  }

  // Determine estimate label
  let estimateLabel = 'Strain estimate';
  if (isPackagedProduct && primaryName) {
    if (estimateConfidence != null && estimateConfidence >= 0.9) {
      estimateLabel = 'High confidence match';
    } else if (estimateConfidence != null && estimateConfidence >= 0.7) {
      estimateLabel = 'Likely match';
    } else if (estimateConfidence != null && estimateConfidence >= 0.5) {
      estimateLabel = 'Best guess match';
    } else {
      estimateLabel = 'Label-based match';
    }
  } else if (isFlowerGuessOnly) {
    if (estimateConfidence != null && estimateConfidence >= 0.7) {
      estimateLabel = 'Visual match';
    } else {
      estimateLabel = 'Best guess match';
    }
  } else if (!primaryName) {
    estimateLabel = 'Strain unknown';
  }

  // Extract effects with priority order
  const effects = 
    summary?.effects ||
    scan.result?.effects ||
    label?.effects ||
    packaging?.effects ||
    null;

  // Extract flavors/terpenes with priority order
  const flavors = 
    label?.terpenes ||
    packaging?.terpenes ||
    summary?.terpenes ||
    summary?.flavors ||
    null;

  return {
    primaryName,
    displaySubline, // Optional "Similar to XYZ" note
    primaryType,
    estimateLabel,
    estimateConfidence,
    brandName,
    thcPercent,
    cbdPercent,
    isPackagedProduct,
    isFlowerGuessOnly,
    effects,
    flavors,
  };
}

