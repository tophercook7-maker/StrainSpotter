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
  if (isPackagedProduct) {
    const pkgName =
      packagingInsights?.strainName ||
      labelInsights?.strainName ||
      aiSummary?.strainName ||
      null;

    if (pkgName) {
      return {
        name: pkgName,
        source: 'packaging',
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

