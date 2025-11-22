/**
 * Canonical Strain Resolution Service
 * 
 * Determines the canonical strain name for a scan based on strict priority rules:
 * 1. Packaged products: Packaging > Label > AI summary (NEVER visual guesses)
 * 2. Raw flower: Visual matches (confidence >= 0.6) > AI summary
 * 3. Otherwise: "Cannabis (strain unknown)"
 */

export function resolveCanonicalStrain({
  packagingInsights,
  labelInsights,
  visualMatches,
  aiSummary,
  isPackagedProduct,
}) {
  // 1 — PACKAGED PRODUCT WINS ALWAYS
  // CRITICAL: Prioritize packagingInsights.strainName FIRST (most reliable)
  // Then labelInsights.strainName, then AI summary
  // NEVER use visual guesses for packaged products
  if (isPackagedProduct) {
    // Priority 1: packagingInsights.strainName (from GPT-5 nano packaging analysis)
    const packagingStrainName = 
      packagingInsights?.strainName || 
      packagingInsights?.basic?.strain_name ||
      null;
    
    // Priority 2: labelInsights.strainName (from OCR extraction)
    const labelStrainName = 
      labelInsights?.strainName || 
      labelInsights?.strain_name ||
      null;
    
    // Priority 3: AI summary strain name
    const aiStrainName = 
      aiSummary?.strainName ||
      null;
    
    // Use packaging strain name FIRST (most reliable for packaged products)
    const pkgName = packagingStrainName || labelStrainName || aiStrainName || null;

    if (pkgName && pkgName.trim() !== '' && pkgName.toLowerCase() !== 'is for use by') {
      // Filter out common OCR artifacts that shouldn't be strain names
      const bannedPhrases = ['is for use by', 'for use by', 'use by', 'best by', 'expires'];
      const lowerName = pkgName.toLowerCase();
      if (bannedPhrases.some(phrase => lowerName.includes(phrase))) {
        // If packaging strain is a banned phrase, try label or AI instead
        const fallbackName = labelStrainName || aiStrainName || null;
        if (fallbackName && fallbackName.trim() !== '') {
          return {
            name: fallbackName.trim(),
            source: labelStrainName ? 'label' : 'ai',
            confidence: 1.0,
          };
        }
        // If all are banned phrases, return unknown
        return {
          name: 'Cannabis (strain unknown)',
          source: 'packaged-unknown',
          confidence: 0.0,
        };
      }
      
      return {
        name: pkgName.trim(),
        source: packagingStrainName ? 'packaging' : (labelStrainName ? 'label' : 'ai'),
        confidence: 1.0,
      };
    }

    // Packaged but unknown
    return {
      name: 'Cannabis (strain unknown)',
      source: 'packaged-unknown',
      confidence: 0.0,
    };
  }

  // 2 — RAW FLOWER: use visual matches
  const top = visualMatches?.[0];
  if (top && top.confidence >= 0.6) {
    return {
      name: top.name,
      source: 'visual',
      confidence: top.confidence,
    };
  }

  // 3 — If AI summary has a strain in raw flower mode
  if (aiSummary?.strainName) {
    return {
      name: aiSummary.strainName,
      source: 'ai',
      confidence: 0.4,
    };
  }

  // 4 — Nothing matched
  return {
    name: 'Cannabis (strain unknown)',
    source: 'none',
    confidence: 0.0,
  };
}

