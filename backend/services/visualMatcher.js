/**
 * Visual Strain Matching Service
 * 
 * Matches cannabis bud photos to strain database using visual characteristics
 * extracted from Google Vision API (colors, labels, web matches, etc.)
 */

/**
 * Main function: Match a scan's Vision API results against strain database
 * @param {Object} visionResult - Full Google Vision API response
 * @param {Array} strains - Array of all strains from strain_library.json
 * @returns {Array} Top 10 matches with scores and reasoning
 */
export function matchStrainByVisuals(visionResult, strains) {
  // Extract features from Vision API result
  const features = extractVisualFeatures(visionResult);

  // Detect macro/sugar leaf image: lots of 'leaf', 'macro', 'trichome', 'close-up', 'herb', 'green', 'weed' labels, no text
  const macroLabels = ['leaf', 'macro', 'trichome', 'close-up', 'herb', 'green', 'weed', 'perennial plant'];
  const macroScore = features.labels.filter(l => macroLabels.includes(l.name)).length;
  const isMacro = macroScore >= 3 && !features.detectedText;

  console.log('[VisualMatcher] Extracted features:', {
    labelCount: features.labels.length,
    topLabels: features.labels.slice(0, 5),
    dominantColor: features.dominantColor,
    webMatchesCount: features.webMatches.length,
    detectedText: features.detectedText.substring(0, 100),
    isMacro
  });

  // Score each strain
  const scored = strains.map(strain => {
    const scoreBreakdown = calculateVisualScore(strain, features, isMacro);
    return {
      strain,
      score: scoreBreakdown.total,
      confidence: calculateConfidence(scoreBreakdown.total),
      reasoning: generateReasoning(scoreBreakdown, strain, features),
      scoreBreakdown
    };
  });

  // Return top matches above minimum threshold
  return scored
    .filter(s => s.score >= 10) // Minimum score threshold
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

/**
 * Extract all visual features from Vision API result
 */
function extractVisualFeatures(visionResult) {
  // Labels (e.g., "cannabis", "plant", "purple", "green", "flower")
  const labels = (visionResult.labelAnnotations || [])
    .map(l => ({
      name: l.description.toLowerCase(),
      confidence: l.score || 0
    }));

  // Dominant colors
  const colors = visionResult.imagePropertiesAnnotation?.dominantColors?.colors || [];
  const dominantColor = colors.length > 0 ? rgbToColorName(colors[0].color) : null;
  const allColors = colors.slice(0, 3).map(c => rgbToColorName(c.color));

  // Text detected
  const detectedText = visionResult.textAnnotations?.[0]?.description || '';

  // Web matches (similar images found on web)
  const webMatches = (visionResult.webDetection?.webEntities || [])
    .map(e => ({
      description: e.description?.toLowerCase() || '',
      score: e.score || 0
    }));

  // Objects detected
  const objects = (visionResult.localizedObjectAnnotations || [])
    .map(o => o.name.toLowerCase());

  return {
    labels,
    dominantColor,
    allColors,
    detectedText,
    webMatches,
    objects
  };
}

/**
 * Calculate visual similarity score between strain and image features
 */
function calculateVisualScore(strain, features, isMacro = false) {
  const breakdown = {
    colorMatch: 0,
    typeIndicators: 0,
    textMatch: 0,
    webMatch: 0,
    effectLabels: 0,
    flavorLabels: 0,
    total: 0
  };

  // 1. Color matching (up to 30 points, boosted for macro)
  if (features.dominantColor) {
    const strainName = strain.name.toLowerCase();
    const strainDesc = (strain.description || '').toLowerCase();
    if (strainName.includes(features.dominantColor)) {
      breakdown.colorMatch += isMacro ? 35 : 25;
    } else if (strainDesc.includes(features.dominantColor)) {
      breakdown.colorMatch += isMacro ? 20 : 10;
    }
    features.allColors.forEach(color => {
      if (strainName.includes(color) || strainDesc.includes(color)) {
        breakdown.colorMatch += isMacro ? 10 : 5;
      }
    });
  }

  // 2. Type indicators from labels (up to 40 points, boosted for macro)
  const typeLabels = features.labels.map(l => l.name);
  if (strain.type) {
    const strainType = strain.type.toLowerCase();
    if (strainType === 'indica') {
      if (typeLabels.some(l => ['purple', 'violet', 'dense', 'compact', 'thick'].includes(l))) {
        breakdown.typeIndicators += isMacro ? 30 : 20;
      }
    }
    if (strainType === 'sativa') {
      if (typeLabels.some(l => ['tall', 'light', 'bright', 'thin', 'airy'].includes(l))) {
        breakdown.typeIndicators += isMacro ? 30 : 20;
      }
    }
    if (strainType === 'hybrid') {
      breakdown.typeIndicators += isMacro ? 20 : 10;
    }
  }

  // 3. Text detection - ignore for macro images
  if (!isMacro && features.detectedText) {
    const cleanText = features.detectedText.toLowerCase()
      .replace(/[^\w\s'-]/g, ' ')
      .trim();
    const strainName = strain.name.toLowerCase();
    if (cleanText.includes(strainName)) {
      breakdown.textMatch += 50;
    } else {
      const strainWords = strainName.split(/\s+/).filter(w => w.length > 3);
      const matchedWords = strainWords.filter(word => cleanText.includes(word));
      breakdown.textMatch += matchedWords.length * 10;
    }
  }

  // 4. Web detection - ignore for macro images
  const strainName = strain.name.toLowerCase();
  if (!isMacro) {
    features.webMatches.forEach(match => {
      if (match.description.includes(strainName)) {
        breakdown.webMatch += 30 * match.score;
      } else {
        const strainWords = strainName.split(/\s+/).filter(w => w.length > 3);
        strainWords.forEach(word => {
          if (match.description.includes(word)) {
            breakdown.webMatch += 5 * match.score;
          }
        });
      }
    });
    breakdown.webMatch = Math.min(breakdown.webMatch, 40);
  }

  // 5. Effect/flavor label matching (up to 20 points, boosted for macro)
  if (strain.effects && strain.effects.length > 0) {
    strain.effects.forEach(effect => {
      const effectLower = effect.toLowerCase();
      if (features.labels.some(l => l.name.includes(effectLower))) {
        breakdown.effectLabels += isMacro ? 6 : 3;
      }
    });
  }
  if (strain.flavors && strain.flavors.length > 0) {
    strain.flavors.forEach(flavor => {
      const flavorLower = flavor.toLowerCase();
      if (features.labels.some(l => l.name.includes(flavorLower))) {
        breakdown.flavorLabels += isMacro ? 6 : 3;
      }
    });
  }

  // Calculate total
  breakdown.total = 
    breakdown.colorMatch +
    breakdown.typeIndicators +
    breakdown.textMatch +
    breakdown.webMatch +
    breakdown.effectLabels +
    breakdown.flavorLabels;

  return breakdown;
}

/**
 * Convert raw score to confidence percentage
 */
function calculateConfidence(score) {
  // Score ranges:
  // 100+: Very high confidence (90-99%)
  // 50-99: High confidence (70-89%)
  // 30-49: Medium confidence (50-69%)
  // 10-29: Low confidence (30-49%)
  
  if (score >= 100) return Math.min(90 + Math.floor(score / 20), 99);
  if (score >= 50) return 70 + Math.floor((score - 50) / 2.5);
  if (score >= 30) return 50 + Math.floor((score - 30) / 1);
  return 30 + Math.floor(score / 0.67);
}

/**
 * Generate human-readable reasoning for the match
 */
function generateReasoning(scoreBreakdown, strain, features) {
  const reasons = [];

  if (scoreBreakdown.textMatch >= 50) {
    reasons.push('Strain name found in image text');
  } else if (scoreBreakdown.textMatch >= 20) {
    reasons.push('Partial name match in text');
  }

  if (scoreBreakdown.webMatch >= 20) {
    reasons.push('Similar images found online');
  }

  if (scoreBreakdown.colorMatch >= 20) {
    reasons.push(`Color match (${features.dominantColor})`);
  }

  if (scoreBreakdown.typeIndicators >= 15) {
    reasons.push(`Visual characteristics match ${strain.type} type`);
  }

  if (scoreBreakdown.effectLabels >= 6) {
    reasons.push('Effect indicators present');
  }

  if (scoreBreakdown.flavorLabels >= 6) {
    reasons.push('Flavor indicators detected');
  }

  if (reasons.length === 0) {
    return 'Low confidence match - consider trying another image';
  }

  return reasons.join('; ');
}

/**
 * Convert RGB color to common color name
 */
function rgbToColorName(rgb) {
  if (!rgb) return 'unknown';
  
  const { red = 0, green = 0, blue = 0 } = rgb;
  
  // Purple/violet range
  if (blue > red && blue > green && blue > 150) {
    return 'purple';
  }
  
  // Green range (most cannabis)
  if (green > red && green > blue) {
    if (green > 150 && red < 100) return 'green';
    if (red > 100) return 'yellow-green';
  }
  
  // Orange/amber range
  if (red > green && red > blue && red > 180 && green > 100) {
    return 'orange';
  }
  
  // Brown/tan range
  if (red > 100 && green > 80 && blue < 100 && Math.abs(red - green) < 50) {
    return 'brown';
  }
  
  // White/light colors
  if (red > 200 && green > 200 && blue > 200) {
    return 'white';
  }
  
  // Dark colors
  if (red < 50 && green < 50 && blue < 50) {
    return 'dark';
  }
  
  return 'green'; // Default for cannabis
}

/**
 * Fallback: Match by text only (for backward compatibility)
 */
export function matchStrainByText(detectedText, strains) {
  if (!detectedText) return [];

  const cleanText = detectedText
    .toLowerCase()
    .replace(/\n/g, ' ')
    .replace(/[^\w\s'-]/g, ' ')
    .trim();

  const matches = strains
    .map(strain => {
      const name = strain.name.toLowerCase();
      let score = 0;

      if (cleanText.includes(name)) {
        score = 100;
      } else {
        const words = name.split(/\s+/).filter(w => w.length > 3);
        const matchedWords = words.filter(w => cleanText.includes(w));
        score = (matchedWords.length / words.length) * 80;
      }

      return { strain, score, confidence: score };
    })
    .filter(m => m.score > 30)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return matches;
}
