/**
 * Visual Strain Matching Service
 * 
 * Matches cannabis bud photos to strain database using visual characteristics
 * extracted from Google Vision API (colors, labels, web matches, etc.)
 */

// --- Intense label insights from OCR text ---

const LABEL_TERPENES = [
  'myrcene',
  'limonene',
  'caryophyllene',
  'pinene',
  'linalool',
  'humulene',
  'terpinolene',
  'ocimene'
];

const CANNABINOIDS = [
  'thc',
  'thca',
  'thcv',
  'cbd',
  'cbda',
  'cbg',
  'cbn',
  'cbc'
];

/**
 * Normalize strain name for text matching (remove special chars, lowercase)
 */
function normalizeStrainName(name) {
  return (name || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function extractLabelInsights(detectedText) {
  if (!detectedText) return null;

  const raw = detectedText;
  const lower = raw.toLowerCase();
  
  // Debug: log start
  console.log('[extractLabelInsights] START');
  console.log('[extractLabelInsights] raw text:', raw);

  // Helper: first match or null
  const firstMatch = (re) => {
    const m = lower.match(re);
    return m ? m[1].trim() : null;
  };

  // THC / CBD % and mg (best effort)
  const thcPercent = firstMatch(/thc[^0-9]{0,10}([0-9]+(?:\.[0-9]+)?)\s*%/);
  const cbdPercent = firstMatch(/cbd[^0-9]{0,10}([0-9]+(?:\.[0-9]+)?)\s*%/);

  const thcMg = firstMatch(/thc[^0-9]{0,10}([0-9]+(?:\.[0-9]+)?)\s*mg/);
  const cbdMg = firstMatch(/cbd[^0-9]{0,10}([0-9]+(?:\.[0-9]+)?)\s*mg/);

  // Other cannabinoids (best effort map)
  const cannabinoids = [];
  for (const cann of CANNABINOIDS) {
    const rePct = new RegExp(cann + "[^0-9]{0,10}([0-9]+(?:\\.[0-9]+)?)\\s*%", "i");
    const reMg = new RegExp(cann + "[^0-9]{0,10}([0-9]+(?:\\.[0-9]+)?)\\s*mg", "i");

    const pctMatch = raw.match(rePct);
    const mgMatch = raw.match(reMg);

    if (pctMatch || mgMatch) {
      cannabinoids.push({
        name: cann.toUpperCase(),
        percent: pctMatch ? parseFloat(pctMatch[1]) : null,
        mg: mgMatch ? parseFloat(mgMatch[1]) : null
      });
    }
  }

  // Product type: flower, preroll, vape, edible, concentrate
  let productType = null;
  if (lower.includes('pre-roll') || lower.includes('preroll') || lower.includes('pre roll')) {
    productType = 'Pre-roll';
  } else if (lower.includes('concentrate') || lower.includes('wax') || lower.includes('shatter') || lower.includes('rosin') || lower.includes('dab')) {
    productType = 'Concentrate';
  } else if (lower.includes('vape') || lower.includes('cart') || lower.includes('cartridge')) {
    productType = 'Vape / Cartridge';
  } else if (lower.includes('edible') || lower.includes('gummy') || lower.includes('chocolate') || lower.includes('cookie')) {
    productType = 'Edible';
  } else if (lower.includes('flower') || lower.includes('bud') || lower.includes('whole bud')) {
    productType = 'Flower';
  }

  // Net weight (g, mg, oz)
  // Examples: "Net Wt 1g", "3.5 g", "100 mg"
  let netWeightValue = null;
  let netWeightUnit = null;
  const weightMatch = lower.match(/(?:net wt|net weight|net|weight)?[^0-9]{0,5}([0-9]+(?:\.[0-9]+)?)\s*(g|grams|mg|milligrams|oz|ounce|ounces)\b/);
  if (weightMatch) {
    netWeightValue = parseFloat(weightMatch[1]);
    const unitRaw = weightMatch[2];
    if (/^g|grams$/.test(unitRaw)) netWeightUnit = 'g';
    else if (/^mg|milligrams$/.test(unitRaw)) netWeightUnit = 'mg';
    else if (/^oz|ounce|ounces$/.test(unitRaw)) netWeightUnit = 'oz';
  }

  // Brand / producer: look for "manufactured by", "produced by", or "distributed by"
  let brand = null;
  const brandMarkers = ['manufactured by', 'produced by', 'distributed by', 'cultivated by', 'grown by'];
  for (const marker of brandMarkers) {
    const idx = lower.indexOf(marker);
    if (idx !== -1) {
      const tail = raw.slice(idx, idx + 160);
      const m = tail.match(new RegExp(marker + "\\s+([A-Za-z0-9 &'\\-]+)"));
      if (m) {
        brand = m[1].trim();
        break;
      }
    }
  }

  // Batch / lot ID (Batch, Lot)
  const batchId =
    firstMatch(/batch[^a-z0-9]{0,5}([a-z0-9\-]+)/) ||
    firstMatch(/lot[^a-z0-9]{0,5}([a-z0-9\-]+)/);

  // License / permit (License, Lic #, Permit #, Lic. No., etc.)
  const licenseNumber =
    firstMatch(/license[^a-z0-9]{0,5}([a-z0-9\-]+)/) ||
    firstMatch(/lic[^a-z0-9]{0,5}([a-z0-9\-]+)/) ||
    firstMatch(/permit[^a-z0-9]{0,5}([a-z0-9\-]+)/);

  // Test lab name: look for "tested by" or "lab"
  let labName = null;
  const testedIdx = lower.indexOf('tested by');
  if (testedIdx !== -1) {
    const tail = raw.slice(testedIdx, testedIdx + 160);
    const m = tail.match(/tested by\s+([A-Za-z0-9 &'\\-]+)/i);
    if (m) {
      labName = m[1].trim();
    }
  } else {
    const labIdx = lower.indexOf('laboratories');
    if (labIdx !== -1) {
      const tail = raw.slice(labIdx - 40, labIdx + 40);
      const m = tail.match(/([A-Za-z0-9 &'\\-]+laborator(?:y|ies))/i);
      if (m) {
        labName = m[1].trim();
      }
    }
  }

  // Dates: package / test / expiration
  // We just best-effort parse ISO-ish or MM/DD/YYYY patterns
  const datePatterns = [
    /packaged on[^0-9]{0,5}([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{2,4})/,
    /packaged[^0-9]{0,5}([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{2,4})/,
    /tested on[^0-9]{0,5}([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{2,4})/,
    /test date[^0-9]{0,5}([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{2,4})/,
    /expires[^0-9]{0,5}([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{2,4})/,
    /exp[^0-9]{0,5}([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{2,4})/,
  ];

  let packageDate = null;
  let testDate = null;
  let expirationDate = null;

  for (const re of datePatterns) {
    const m = lower.match(re);
    if (!m) continue;
    if (re.source.startsWith('packaged')) packageDate = m[1];
    else if (re.source.startsWith('tested on') || re.source.startsWith('test date')) testDate = m[1];
    else if (re.source.startsWith('expires') || re.source.startsWith('exp')) expirationDate = m[1];
  }

  // Terpenes: { name, percent }
  const terpenes = [];
  for (const terp of LABEL_TERPENES) {
    const re = new RegExp(terp + "[^0-9]{0,10}([0-9]+(?:\\.[0-9]+)?)\\s*%", "i");
    const m = raw.match(re);
    if (m) {
      terpenes.push({
        name: terp,
        percent: parseFloat(m[1]),
      });
    }
  }

  // Extract likely strain name from label text
  // Strict rules to guarantee multi-word plant/product names, never batch IDs or weights
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  
  // Debug: log lines and brand
  console.log('[extractLabelInsights] lines:', lines);
  console.log('[extractLabelInsights] brand (before loop):', brand);
  
  const genericWords = [
    'net', 'wt', 'activation', 'time', 'approx', 'tested', 'manufactured',
    'batch', 'permit', 'ext', 'made', 'test', 'thc', 'cbd', 'vape', 'cart',
    'edible', 'gummies', 'flower', 'hybrid', 'indica', 'sativa',
    '1g', '1.0g', 'gram', 'g', 'cartridge'
  ];
  
  let bestCandidate = null;
  let bestScore = -Infinity;
  
  for (const line of lines) {
    // Pre-process: normalize to lowercase, strip weird characters except letters, numbers, spaces, apostrophes
    const normalized = line.toLowerCase().replace(/[^a-z0-9 ']/g, ' ').trim();
    
    // Debug: log line and normalized version
    console.log('[extractLabelInsights] line:', line);
    console.log('[extractLabelInsights] normalizedLine:', normalized);
    
    // Ignore empty lines
    if (!normalized) {
      console.log('[extractLabelInsights] SKIP: empty line');
      continue;
    }
    
    // REJECT lines containing "scan to learn" (marketing text, not strain names)
    if (normalized.includes('scan to learn')) {
      console.log('[extractLabelInsights] SKIP: scan to learn line');
      continue; // Skip marketing lines like "Scan to Learn M00329P11249111786"
    }
    
    // REJECT producer/test lab lines (these are brands, not strain names)
    if (normalized.includes('manufactured by') ||
        normalized.includes('tested by') ||
        normalized.includes('distributed by') ||
        normalized.includes('producer:') ||
        normalized.includes('processor:')) {
      console.log('[extractLabelInsights] SKIP: producer/test lab line');
      continue; // Skip producer/brand lines like "Manufactured by Dark Horse"
    }
    
    // REJECT lines immediately if they match batch/ID patterns
    // Long alphanumeric strings (≥8 consecutive alphanumerics)
    if (/[a-z0-9]{8,}/i.test(line)) {
      console.log('[extractLabelInsights] SKIP: long alphanumeric string (batch ID)');
      continue; // Skip batch IDs like "M00329P11249111786"
    }
    
    // Batch/lot/permit/license patterns
    if (/batch|lot|permit|license/i.test(line)) {
      console.log('[extractLabelInsights] SKIP: batch/lot/permit/license pattern');
      continue; // Skip lines with these keywords
    }
    
    // REJECT weight or quantity patterns
    if (/[0-9]+(\.[0-9]+)?\s*(g|mg|oz)$/i.test(line) || /net wt/i.test(line) || /^1g$|^1\.0g$/i.test(line)) {
      console.log('[extractLabelInsights] SKIP: weight/quantity pattern');
      continue; // Skip weight lines
    }
    
    // REJECT lines that are mostly numbers or special chars
    const letterCount = (line.match(/[a-z]/gi) || []).length;
    const totalChars = line.replace(/\s/g, '').length;
    if (totalChars > 0 && letterCount / totalChars < 0.3) {
      console.log('[extractLabelInsights] SKIP: mostly numbers/special chars');
      continue; // Skip if less than 30% letters
    }
    
    // REJECT lines that contain mostly generic words
    const genericWordCount = genericWords.filter(gw => normalized.includes(gw)).length;
    const wordCount = normalized.split(/\s+/).filter(w => w.length > 0).length;
    if (wordCount > 0 && genericWordCount / wordCount > 0.5) {
      console.log('[extractLabelInsights] SKIP: mostly generic words');
      continue; // Skip if more than 50% generic words
    }
    
    // Extract candidate words
    const words = normalized.split(/\s+/).filter(w => w.length > 0);
    
    // Filter out generic words, words with no letters, and short words
    const candidateWords = words.filter(word => {
      if (!/[a-z]/i.test(word)) return false; // Must have at least one letter
      if (word.length <= 2) return false; // Filter out single- or two-letter words
      const wordLower = word.toLowerCase();
      return !genericWords.includes(wordLower); // Not a generic word
    });
    
    // Build candidate name
    const candidateName = candidateWords.join(' ').trim();
    
    // Debug: log candidate words and name
    console.log('[extractLabelInsights] candidateWords:', candidateWords);
    console.log('[extractLabelInsights] candidateName:', candidateName);
    
    // REJECT candidateName if it doesn't meet minimum requirements
    if (!candidateName || candidateName.length < 4) {
      console.log('[extractLabelInsights] SKIP: candidateName too short');
      continue; // Too short
    }
    
    if (candidateWords.length < 2) {
      console.log('[extractLabelInsights] SKIP: candidateName has fewer than 2 words');
      continue; // Must have at least 2 words
    }
    
    // Check if any word is ≤2 characters (shouldn't happen after filter, but double-check)
    if (candidateWords.some(w => w.length <= 2)) {
      console.log('[extractLabelInsights] SKIP: candidateName has word ≤2 chars');
      continue;
    }
    
    // REJECT candidate if it exactly matches the brand (case-insensitive)
    // Brands are not strain names (e.g., "Dark Horse" is the brand, not the strain)
    if (brand && candidateName.toLowerCase() === brand.toLowerCase()) {
      console.log('[extractLabelInsights] SKIP: candidate equals brand:', candidateName);
      continue; // Skip candidates that match the brand exactly
    }
    
    // SCORING
    let score = 0;
    
    // Base score: number of words × 20
    score = candidateWords.length * 20;
    
    // Bonus +30 if no digits
    if (!/\d/.test(candidateName)) {
      score += 30;
    }
    
    // Bonus +50 if 2+ words
    if (candidateWords.length >= 2) {
      score += 50;
    }
    
    // Penalty -100 for any digit presence
    if (/\d/.test(candidateName)) {
      score -= 100;
    }
    
    // Penalty -200 if any word appears in lowercase in original label text
    // (helps remove generic packaging words that might slip through)
    const originalLower = raw.toLowerCase();
    const hasGenericInOriginal = candidateWords.some(word => {
      return genericWords.some(gw => originalLower.includes(gw));
    });
    if (hasGenericInOriginal) {
      score -= 200;
    }
    
    // Debug: log candidate score
    console.log('[extractLabelInsights] candidate score:', { candidateName, score });
    
    // If this is the best candidate so far, save it
    if (score > bestScore) {
      bestScore = score;
      bestCandidate = candidateName;
    }
  }
  
  // Use the best candidate found (or null if none passed filters)
  const strainName = bestCandidate;
  
  // Debug: log brand and final strain name
  console.log('[extractLabelInsights] brand:', brand);
  console.log('[extractLabelInsights] Final strainName:', strainName);

  return {
    // Potency
    thcPercent: thcPercent != null ? parseFloat(thcPercent) : null,
    cbdPercent: cbdPercent != null ? parseFloat(cbdPercent) : null,
    thcMg: thcMg != null ? parseFloat(thcMg) : null,
    cbdMg: cbdMg != null ? parseFloat(cbdMg) : null,
    cannabinoids,

    // Product meta
    productType,
    netWeightValue,
    netWeightUnit,

    // Producer / tracking
    brand,
    batchId,
    licenseNumber,
    labName,

    // Dates
    packageDate,
    testDate,
    expirationDate,

    // Terpenes & raw
    terpenes,
    rawText: raw,
    strainName, // Detected strain name from label
  };
}

/**
 * Main function: Match a scan's Vision API results against strain database
 * @param {Object} visionResult - Full Google Vision API response
 * @param {Array} strains - Array of all strains from strain_library.json
 * @returns {Array} Top 10 matches with scores and reasoning
 */
export function matchStrainByVisuals(visionResult, strains) {
  // Debug logging at start
  console.log('[VisualMatcher] start', {
    visionHasText: !!(visionResult && visionResult.textAnnotations && visionResult.textAnnotations.length),
    visionHasLabels: !!(visionResult && visionResult.labelAnnotations && visionResult.labelAnnotations.length),
    strainCount: Array.isArray(strains) ? strains.length : 0,
  });

  // Extract features from Vision API result
  const features = extractVisualFeatures(visionResult);

  // Extract label insights (THC, CBD, terpenes, brand)
  const labelInsights = extractLabelInsights(features.detectedText);

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
    isMacro,
    labelInsights: labelInsights ? { thc: labelInsights.thcPercent, cbd: labelInsights.cbdPercent, terpeneCount: labelInsights.terpenes.length } : null
  });

  // Score each strain
  const scored = strains.map(strain => {
    const scoreBreakdown = calculateVisualScore(strain, features, isMacro);
    
    // Extra boost if labelInsights suggests this strain name matches
    // (This handles cases where OCR clearly identifies a strain name)
    if (labelInsights && features.detectedText) {
      const normalizedText = normalizeStrainName(features.detectedText);
      const normalizedStrainName = normalizeStrainName(strain.name);
      // If the detected text contains the strain name (normalized), give extra boost
      if (normalizedText.includes(normalizedStrainName) || normalizedStrainName.includes(normalizedText)) {
        scoreBreakdown.textMatch += 150; // Additional big bonus
        // Recalculate total with the boosted textMatch
        scoreBreakdown.total = 
          scoreBreakdown.colorMatch +
          scoreBreakdown.typeIndicators +
          (scoreBreakdown.textMatch * 2) +
          scoreBreakdown.webMatch +
          scoreBreakdown.effectLabels +
          scoreBreakdown.flavorLabels;
      }
    }
    
    return {
      strain,
      score: scoreBreakdown.total,
      confidence: calculateConfidence(scoreBreakdown.total),
      reasoning: generateReasoning(scoreBreakdown, strain, features),
      scoreBreakdown,
      labelInsights // Include label insights with each match
    };
  });

  // Debug logging after scores are computed
  console.log('[VisualMatcher] scored summary', {
    totalScored: scored.length,
    nonZero: scored.filter(s => s.score > 0).length,
    topScores: scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(s => ({
        name: s.strain?.name || s.strain?.strain_name || s.strain?.slug || 'unknown',
        score: s.score
      }))
  });

  // Sort all scored strains by score descending
  const allScored = scored
    .filter(s => s.score > 0) // Only exclude truly zero scores
    .sort((a, b) => b.score - a.score);

  // Try filtering by a low threshold first (more permissive)
  const filtered = allScored.filter(s => s.score >= 1);

  // Always return at least the top 5 matches (or all if fewer exist)
  // If filtered is empty but we have scored strains, use allScored instead
  const candidateList = filtered.length > 0 ? filtered : allScored;
  const matches = candidateList.slice(0, 5); // Top 5 matches

  // If we still have no matches but strains exist, return at least the top scored one
  let finalMatches = matches.length > 0 
    ? matches 
    : (allScored.length > 0 ? [allScored[0]] : []);

  // Force detected strain name from label to become top match
  if (labelInsights && labelInsights.strainName) {
    const labelNorm = normalizeStrainName(labelInsights.strainName);
    if (labelNorm) {
      // Find matching strain in database
      const found = strains.find(s => {
        const sName = normalizeStrainName(s.name || s.strain_name || s.slug);
        return sName === labelNorm;
      });
      
      if (found) {
        // Check if this strain is already in matches
        const existingIndex = finalMatches.findIndex(m => {
          const mName = normalizeStrainName(
            m.strain && (m.strain.name || m.strain.strain_name || m.strain.slug)
          );
          return mName === labelNorm;
        });
        
        if (existingIndex !== -1) {
          // Move existing match to top and boost score
          const boostingTarget = finalMatches[existingIndex];
          finalMatches.splice(existingIndex, 1);
          finalMatches.unshift({
            ...boostingTarget,
            score: boostingTarget.score + 500,
            reason: 'labelNameExact'
          });
        } else {
          // Add new match at top with high score
          // Need to create a proper match object with all required fields
          const scoreBreakdown = calculateVisualScore(found, features, isMacro);
          finalMatches.unshift({
            strain: found,
            score: 500,
            confidence: calculateConfidence(500),
            reasoning: 'Exact match from label text',
            scoreBreakdown,
            labelInsights, // Include label insights for consistency
            reason: 'labelNameExact'
          });
        }
      }
    }
  }

  // Debug logging for top results before returning
  const matchesArray = Array.isArray(finalMatches) ? finalMatches : [];
  console.log('[VisualMatcher] top matches', matchesArray.slice(0, 5).map(m => ({
    name: m.strain && (m.strain.name || m.strain.strain_name || m.strain.slug || 'unknown'),
    score: m.score,
    confidence: m.confidence
  })));

  // Attach label insights to the result set
  return {
    matches: finalMatches,
    labelInsights
  };
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
  // Make label text (strain name on package) heavily influence matching
  if (!isMacro && features.detectedText) {
    const rawText = features.detectedText || '';
    const normalizedText = normalizeStrainName(rawText);
    const normalizedStrainName = normalizeStrainName(strain.name);
    
    // Check for exact full-name match (normalized)
    if (normalizedText.includes(normalizedStrainName) || normalizedStrainName.includes(normalizedText)) {
      // Strong bonus for exact match
      breakdown.textMatch += 200;
    } else {
      // Partial word matches with increased bonus
      const strainWords = normalizedStrainName.split(/\s+/).filter(w => w.length > 3);
      const matchedWords = strainWords.filter(word => normalizedText.includes(word));
      breakdown.textMatch += matchedWords.length * 30;
    }
    
    // Also check original text for additional matches (case-insensitive)
    const cleanText = rawText.toLowerCase()
      .replace(/[^\w\s'-]/g, ' ')
      .trim();
    const strainNameLower = strain.name.toLowerCase();
    if (cleanText.includes(strainNameLower) && breakdown.textMatch < 200) {
      breakdown.textMatch += 150; // Additional boost if found in original text
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
  // Amplify textMatch so label text can outweigh generic visual features on package scans
  breakdown.total = 
    breakdown.colorMatch +
    breakdown.typeIndicators +
    (breakdown.textMatch * 2) + // Double weight for text matches
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
