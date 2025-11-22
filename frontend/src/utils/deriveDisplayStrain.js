/**
 * Derives the display strain information from a scan object with priority order:
 * 1. OCR / packaging strain (highest priority for packaged products)
 * 2. AI summary strain field
 * 3. Visual matcher (fallback only)
 * 
 * @param {Object} scan - The scan object from GET /api/scans/:id
 * @returns {Object} Display strain information
 */
export function deriveDisplayStrain(scan) {
  if (!scan || typeof scan !== 'object') {
    return {
      primaryName: null,
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

  // Determine primaryName with priority order
  let primaryName = null;
  let primaryType = 'unknown';
  let estimateConfidence = null;
  let brandName = null;
  let thcPercent = null;
  let cbdPercent = null;
  let isFlowerGuessOnly = false;

  // 1. OCR / packaging strain (highest priority)
  if (packaging?.strainName && typeof packaging.strainName === 'string') {
    primaryName = packaging.strainName.trim();
    estimateConfidence = packaging.overallConfidence || packaging.confidence?.overall || null;
    brandName = packaging.basic?.brand_name || packaging.package_details?.brand || null;
    
    // Extract THC/CBD from packaging
    if (packaging.potency) {
      thcPercent = packaging.potency.thc_percent ?? packaging.potency.thc_total_percent ?? null;
      cbdPercent = packaging.potency.cbd_percent ?? packaging.potency.cbd_total_percent ?? null;
    }
  } else if (label?.strainName && typeof label.strainName === 'string') {
    primaryName = label.strainName.trim();
    thcPercent = label.thc ?? null;
    cbdPercent = label.cbd ?? null;
  }

  // 2. AI summary strain field (if backend exposes one)
  if (!primaryName) {
    if (summary?.matchedStrainName && typeof summary.matchedStrainName === 'string') {
      primaryName = summary.matchedStrainName.trim();
    } else if (summary?.strainName && typeof summary.strainName === 'string') {
      primaryName = summary.strainName.trim();
    } else if (scan.matched_strain_name && typeof scan.matched_strain_name === 'string') {
      primaryName = scan.matched_strain_name.trim();
    }
  }

  // 3. Fallback to visual matcher ONLY if nothing else found
  if (!primaryName) {
    const visualMatch = Array.isArray(visual) && visual.length > 0 
      ? (visual[0]?.match || visual[0]) 
      : null;
    
    if (visualMatch && typeof visualMatch.name === 'string') {
      primaryName = visualMatch.name.trim();
      isFlowerGuessOnly = true; // This is a visual guess, not OCR-backed
      
      // Extract type from visual match if available
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
      
      // Extract confidence from visual match
      estimateConfidence = visualMatch.confidence ?? visualMatch.score ?? null;
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

  return {
    primaryName,
    primaryType,
    estimateLabel,
    estimateConfidence,
    brandName,
    thcPercent,
    cbdPercent,
    isPackagedProduct,
    isFlowerGuessOnly,
  };
}

