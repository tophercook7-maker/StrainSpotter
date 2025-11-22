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

  // CRITICAL: Determine if this is a packaged product
  // Check multiple sources to be absolutely sure
  const isPackagedFromSummary = summary?.isPackagedProduct === true || summary?.is_packaged_product === true;
  const isPackagedFromPackaging = !!packaging || packaging?.isPackagedProduct === true || packaging?.is_packaged_product === true;
  const isPackagedFromLabel = label?.isPackagedProduct === true || label?.is_packaged_product === true;
  const isPackagedProduct = isPackagedFromSummary || isPackagedFromPackaging || isPackagedFromLabel;

  // Extract strain names from different sources
  // CRITICAL: For packaged products, ONLY use label_insights.strainName
  const packagedStrainName = 
    (label?.strainName || label?.strain_name || '').trim() ||
    (packaging?.strainName || packaging?.strain_name || '').trim() ||
    null;

  // Library strain name (from AI/library match) - ONLY for non-packaged products
  const libraryStrainName = 
    (scan.matched_strain_name || scan.matchedStrainName || '').trim() ||
    (summary?.matchedStrainName || summary?.strainName || '').trim() ||
    null;

  // Extract visual matcher strain name and confidence (for non-packaged products only)
  let visualStrainName = null;
  let visualMatchConfidence = null;
  if (!isPackagedProduct) {
    const visualMatch = Array.isArray(visual) && visual.length > 0 
      ? (visual[0]?.match || visual[0]) 
      : null;
    if (visualMatch && typeof visualMatch.name === 'string') {
      visualStrainName = visualMatch.name.trim();
      visualMatchConfidence = visualMatch.confidence ?? visualMatch.score ?? null;
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

  // CRITICAL: Strict priority order - packaged products NEVER use visual/library guesses
  if (isPackagedProduct) {
    // 1. If packaged product with label strain name → USE THIS ALWAYS
    if (hasPackagedStrain) {
      primaryName = packagedStrainName;
      
      // Extract confidence and brand from packaging
      estimateConfidence = packaging?.overallConfidence || packaging?.confidence?.overall || null;
      brandName = packaging?.basic?.brand_name || packaging?.package_details?.brand || null;
      
      // Extract THC/CBD from packaging
      if (packaging?.potency) {
        thcPercent = packaging.potency.thc_percent ?? packaging.potency.thc_total_percent ?? null;
        cbdPercent = packaging.potency.cbd_percent ?? packaging.potency.cbd_total_percent ?? null;
      }
      
      // If libraryStrainName is different, we can mention it in a soft way (but don't use it as primary)
      if (
        libraryStrainName &&
        normalizeName(libraryStrainName) !== normalizeName(packagedStrainName)
      ) {
        displaySubline = `Similar to ${libraryStrainName}`;
      }
    } else {
      // 2. Packaged product but no strain name from label => DO NOT invent one
      // NEVER use visual guesses like "Limon", "MAC", "Evergreen Berry" for packaged products
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
    }
  } else {
    // 3. Non-packaged (unpackaged bud) - use visual/library match
    if (visualStrainName) {
      // Use visual match only if confidence >= 0.6
      if (visualMatchConfidence == null || visualMatchConfidence >= 0.6) {
        primaryName = visualStrainName;
        isFlowerGuessOnly = true;
        estimateConfidence = visualMatchConfidence;
        
        // Extract type from visual match if available
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
        }
      } else {
        // Visual match confidence too low (< 0.6)
        primaryName = 'Cannabis (strain unknown)';
      }
    } else if (libraryStrainName) {
      // Use library match for non-packaged
      primaryName = libraryStrainName;
      estimateConfidence = scan.match_confidence ?? scan.matchConfidence ?? null;
    } else {
      primaryName = 'Cannabis (strain unknown)';
    }
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

  // Extract effects/flavors - ONLY show if we have a real library strain match
  // CRITICAL: For packaged products, NEVER use library effects/flavors unless library strain exactly matches packaging strain
  const libraryMatchesPackaging = 
    isPackagedProduct &&
    hasPackagedStrain &&
    libraryStrainName &&
    normalizeName(libraryStrainName) === normalizeName(packagedStrainName);
  
  const canUseLibraryTags = 
    !!libraryStrainName &&
    !isPackagedProduct && // NEVER use library tags for packaged products (unless exact match)
    !isUnknownPackaged &&
    (estimateConfidence == null || estimateConfidence >= 0.8);

  // For packaged products: use AI/label effects, NEVER library effects (unless exact match)
  // For non-packaged: use library effects if confidence is high enough
  let effects = null;
  let flavors = null;
  
  if (isPackagedProduct) {
    // Packaged products: ONLY use AI/label effects, never library effects
    // Exception: if library strain exactly matches packaging strain, we can use library effects
    if (libraryMatchesPackaging) {
      effects = summary?.effects || scan.result?.effects || label?.effects || packaging?.effects || null;
      flavors = label?.terpenes || packaging?.terpenes || summary?.terpenes || summary?.flavors || null;
    } else {
      // For packaged products, prefer AI/label effects over library effects
      effects = summary?.effects || scan.result?.effects || label?.effects || packaging?.effects || null;
      flavors = label?.terpenes || packaging?.terpenes || summary?.terpenes || summary?.flavors || null;
    }
  } else {
    // Non-packaged: use library effects if confidence is high enough
    if (canUseLibraryTags) {
      effects = summary?.effects || scan.result?.effects || null;
      flavors = label?.terpenes || summary?.terpenes || summary?.flavors || null;
    } else {
      effects = summary?.effects || scan.result?.effects || label?.effects || null;
      flavors = label?.terpenes || summary?.terpenes || summary?.flavors || null;
    }
  }

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

