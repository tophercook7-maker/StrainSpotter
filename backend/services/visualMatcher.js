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

// Strain name hints - candidates containing these are strongly preferred
const STRAIN_HINTS = [
  'og', 'kush', 'runtz', 'haze', 'cookies', 'cake', 'glue', 'diesel',
  'bomb', 'dream', 'glitter', 'goji', 'scott', 'trail', 'commerce', 'city',
  'purple', 'blue', 'white', 'black', 'green', 'pink', 'orange', 'red',
  'sour', 'sweet', 'berry', 'fruit', 'citrus', 'pine', 'skunk', 'cheese'
];

// Strain name keywords for label parsing
const STRAIN_NAME_KEYWORDS = [
  'kush', 'og', 'haze', 'bomb', 'runtz', 'gelato', 'cake', 'cookies',
  'diesel', 'sherb', 'sherbet', 'zkittlez', 'mints', 'glue', 'punch',
  'pie', 'sour', 'chem', 'gas', 'fuel', 'berry', 'cherry', 'banana',
  'papaya', 'tangie', 'slurricane'
];

// Banned fragments that should NEVER be considered strain names
const LABEL_LINE_BANNED_FRAGMENTS = [
  'net wt', 'net weight', 'oz)', 'mg', '%', 'thc', 'cbd', 'limonene',
  'myrcene', 'caryophyllene', 'terpenes', 'activation time', 'tested by',
  'batch', 'manufactured by', 'permit', 'uin', 'scan to learn', 'co2',
  'acrelabs', 'biotrack', 'suite', 'dark horse', 'lucid', '2025', '2026'
];

/**
 * Guess strain name from raw label text
 * Treats "Dark Horse" as brand, not strain
 * Prefers lines with strain keywords and avoids banned fragments
 */
function guessStrainNameFromLabel(rawText, matches = []) {
  if (!rawText || typeof rawText !== 'string') return null;

  const lines = rawText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return null;

  let best = null;
  let bestScore = 0;

  // Extract DB match names for scoring
  const dbMatchNames = (matches || [])
    .map(m => {
      const name = m.strain?.name || m.strain?.strain_name || m.strain?.slug || m.name || '';
      return name.toLowerCase();
    })
    .filter(Boolean);

  for (const line of lines) {
    const lower = line.toLowerCase();

    // Skip if contains banned fragments
    if (LABEL_LINE_BANNED_FRAGMENTS.some(frag => lower.includes(frag))) {
      continue;
    }

    // Break into tokens, discard anything with digits
    const tokens = line.split(/\s+/);
    const cleanedTokens = tokens.filter(t => !/\d/.test(t));

    if (cleanedTokens.length === 0) continue;

    const candidate = cleanedTokens.join(' ').trim();
    if (candidate.length < 3 || candidate.length > 40) continue;

    const wordCount = cleanedTokens.length;
    if (wordCount > 5) continue; // too long to be a clean name

    // Score: +2 if it has a strain-ish keyword
    let score = 0;
    const hasKeyword = STRAIN_NAME_KEYWORDS.some(kw =>
      candidate.toLowerCase().includes(kw)
    );
    if (hasKeyword) {
      score += 2;
    }

    // Slight preference for 2-4 words (typical strain names)
    if (wordCount >= 2 && wordCount <= 4) {
      score += 1;
    }

    // Slight preference for lines that are not all uppercase (brands are often all-caps)
    const isAllCaps = candidate === candidate.toUpperCase();
    if (!isAllCaps) {
      score += 1;
    }

    // Bonus if DB match name appears in the line
    if (dbMatchNames.length > 0) {
      const candidateLower = candidate.toLowerCase();
      const hasDbMatch = dbMatchNames.some(dbName => {
        // Check if DB match name appears as whole words
        const dbWords = dbName.split(/\s+/);
        return dbWords.every(word => candidateLower.includes(word));
      });
      if (hasDbMatch) {
        score += 2;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      // Title case the result
      best = candidate
        .split(/\s+/)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    }
  }

  return best;
}

function pickOcrBackedDbName({ ocrText, matches }) {
  if (!ocrText || !matches?.length) return null;
  const text = ocrText.toLowerCase();

  const banned = [
    "full spectrum","full-spectr","experience","set the","rm.","ocked","rich te",
    "sauce","cartridge","vape","total","thc","cbd","batch","test","date"
  ];

  const strainHints = ["og","kush","runtz","diesel","haze","cake","pie","gelato","glue","punch","skunk","mac"];

  let best = null;
  let bestScore = 0;

  for (const m of matches) {
    const name = m.name || "";
    const lower = name.toLowerCase();
    if (banned.some(b => lower.includes(b))) continue;

    if (!text.includes(lower)) continue;  // must appear in OCR text

    let score = 0;
    for (const h of strainHints) if (lower.includes(h)) score += 50;

    if (name.split(" ").length >= 2) score += 40;

    if (score > bestScore) {
      bestScore = score;
      best = name;
    }
  }

  return best || null;
}

/**
 * Pick better label strain name from DB matches + OCR text
 * This helps override bad OCR extraction (e.g., "Set The") with actual strain names from matches
 * Requires 2+ words and verifies the full phrase appears in rawText
 */
function pickBetterLabelStrainName(rawText, matches) {
  if (!rawText || !matches || !Array.isArray(matches) || matches.length === 0) {
    return null;
  }

  const lower = (rawText || '').toLowerCase();
  
  // Banned fragments that should NEVER be strain names
  const BANNED = [
    'set the',
    'set the experience',
    'full spectrum',
    'full spectrum vape',
    'full spectrum vape cartridge',
    'total cannabinoids',
    'activation time',
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
    'tel'
  ];

  // Strain hints - prefer candidates containing these
  const STRAIN_HINTS = [' og', ' kush', ' runtz', ' haze', ' diesel', ' cookies', ' pie', ' cake'];

  const candidates = [];

  // First, try to find candidates from visual matches
  for (const match of matches) {
    const name = (match.name || match.strain?.name || "").trim();
    
    // Must have at least 2 words
    const words = name.split(/\s+/).filter(w => w.length > 0);
    if (words.length < 2) continue;

    const lowerName = name.toLowerCase();

    // Skip if contains banned fragment
    if (BANNED.some(frag => lowerName.includes(frag))) {
      continue;
    }

    // Skip if no letters
    if (!/[a-z]/.test(lowerName)) {
      continue;
    }

    // Check if the FULL phrase appears in rawText (case-insensitive)
    // Handle apostrophes and special chars - use a more flexible match
    // First try exact phrase match, then try word-by-word if exact fails
    const exactMatch = rawText.toLowerCase().includes(lowerName);
    
    // Also try matching all words individually (for cases like "SCOTT'S OG" vs "scott's og")
    const nameWords = lowerName.split(/\s+/).filter(w => w.length > 0);
    const allWordsFound = nameWords.every(word => {
      // Remove apostrophes for matching (SCOTT'S -> SCOTTS, scott's -> scotts)
      const wordClean = word.replace(/'/g, '');
      const textClean = lower.replace(/'/g, '');
      return textClean.includes(wordClean);
    });
    
    if (!exactMatch && !allWordsFound) {
      continue;
    }

    // Score the candidate
    let score = match.score || match.confidence || 0;

    // Strong boost if contains strain hints (check with space prefix to avoid false matches)
    if (STRAIN_HINTS.some(hint => lowerName.includes(hint))) {
      score += 200; // Strong preference for strain hints
    }

    // Prefer 2-4 word names
    if (words.length >= 2 && words.length <= 4) {
      score += 50;
    }

    candidates.push({ name, score, hasStrainHint: STRAIN_HINTS.some(hint => lowerName.includes(hint)) });
  }

  // If we have candidates, prefer ones with strain hints
  if (candidates.length > 0) {
    const withHints = candidates.filter(c => c.hasStrainHint);
    if (withHints.length > 0) {
      // Sort by score and return top one with hint
      withHints.sort((a, b) => b.score - a.score);
      console.log('[pickBetterLabelStrainName] Selected candidate with strain hint:', withHints[0].name);
      return withHints[0].name;
    }
    // Otherwise return top scored candidate
    candidates.sort((a, b) => b.score - a.score);
    console.log('[pickBetterLabelStrainName] Selected top candidate:', candidates[0].name);
    return candidates[0].name;
  }

  // Fallback: scan rawText lines for OG-containing lines
  const lines = rawText.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const lowerLine = trimmed.toLowerCase();
    
    // Skip if contains banned fragment
    if (BANNED.some(frag => lowerLine.includes(frag))) {
      continue;
    }

    // Look for lines containing strain hints (OG, KUSH, etc.) with 2-4 words
    const words = trimmed.split(/\s+/).filter(w => w.length > 0);
    if (words.length >= 2 && words.length <= 4) {
      // Check if line contains strain hints (uppercase or lowercase)
      const upperLine = trimmed.toUpperCase();
      const hasStrainHint = STRAIN_HINTS.some(hint => lowerLine.includes(hint)) ||
                           upperLine.includes(' OG') || upperLine.includes(' KUSH') ||
                           upperLine.includes(' RUNTZ') || upperLine.includes(' HAZE');
      
      if (hasStrainHint) {
        // Make sure it's not all banned words
        const hasBanned = BANNED.some(frag => lowerLine.includes(frag));
        if (!hasBanned && /[a-z]/i.test(trimmed)) {
          console.log('[pickBetterLabelStrainName] Fallback selected from rawText line:', trimmed);
          return trimmed;
        }
      }
    }
  }

  console.log('[pickBetterLabelStrainName] No valid candidate found');
  return null;
}

/**
 * Normalize strain name for text matching (remove special chars, lowercase)
 */
function normalizeStrainName(name) {
  return (name || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function normalizeForMatch(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    // turn anything non-alphanumeric into a space
    .replace(/[^a-z0-9]+/g, ' ')
    // collapse multiple spaces
    .replace(/\s+/g, ' ')
    .trim();
}

// Helper functions for parsing label insights
function parsePercent(text, keywords) {
  try {
    const lower = text.toLowerCase();
    for (const keyword of keywords) {
      const re = new RegExp(keyword + "[^0-9]{0,10}([0-9]+(?:\\.[0-9]+)?)\\s*%", "i");
      const m = text.match(re);
      if (m) return parseFloat(m[1]);
    }
    return null;
  } catch {
    return null;
  }
}

function parseMg(text, keywords) {
  try {
    const lower = text.toLowerCase();
    for (const keyword of keywords) {
      const re = new RegExp(keyword + "[^0-9]{0,10}([0-9]+(?:\\.[0-9]+)?)\\s*mg", "i");
      const m = text.match(re);
      if (m) return parseFloat(m[1]);
    }
    return null;
  } catch {
    return null;
  }
}

function parseDate(text, patterns) {
  try {
    const lower = text.toLowerCase();
    for (const pattern of patterns) {
      const m = lower.match(pattern);
      if (m) return m[1];
    }
    return null;
  } catch {
    return null;
  }
}

function detectCategory(text) {
  try {
    const lower = text.toLowerCase();
    if (lower.includes('flower') || lower.includes('bud') || lower.includes('whole bud')) return 'flower';
    if (lower.includes('vape') || lower.includes('cartridge') || lower.includes('cart') || lower.includes('carts')) return 'vape';
    if (lower.includes('sauce') || lower.includes('wax') || lower.includes('shatter') || lower.includes('resin') || lower.includes('rosin') || lower.includes('hash') || lower.includes('dab')) return 'concentrate';
    if (lower.includes('gummy') || lower.includes('edible') || lower.includes('chew') || lower.includes('chocolate') || lower.includes('cookie') || lower.includes('brownie') || lower.includes('drink')) return 'edible';
    if (lower.includes('topical') || lower.includes('lotion') || lower.includes('salve') || lower.includes('balm')) return 'topical';
    if (lower.includes('tincture') || lower.includes('drops') || lower.includes('sublingual')) return 'tincture';
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

function extractWarnings(text) {
  try {
    const warnings = [];
    let ageRestricted = false;
    let medicalUseOnly = false;
    let drivingWarning = false;
    let pregnancyWarning = false;
    
    const lower = text.toLowerCase();
    
    if (lower.includes('keep out of reach of children') || lower.includes('keep away from children')) {
      warnings.push('Keep out of reach of children');
      ageRestricted = true;
    }
    if (lower.includes('21+') || lower.includes('21 years') || lower.includes('twenty one')) {
      ageRestricted = true;
      if (!warnings.some(w => w.includes('21'))) warnings.push('For adult use only (21+)');
    }
    if (lower.includes('18+') || lower.includes('18 years')) {
      ageRestricted = true;
      if (!warnings.some(w => w.includes('18'))) warnings.push('For adult use only (18+)');
    }
    if (lower.includes('for use by qualified patients only') || lower.includes('medical use only') || lower.includes('registered patients')) {
      medicalUseOnly = true;
      warnings.push('For medical use only');
    }
    if (lower.includes('do not drive') || lower.includes('do not operate') || lower.includes('operating machinery')) {
      drivingWarning = true;
      warnings.push('Do not drive or operate machinery');
    }
    if (lower.includes('pregnant') || lower.includes('breastfeeding') || lower.includes('nursing')) {
      pregnancyWarning = true;
      warnings.push('Not for use during pregnancy or breastfeeding');
    }
    
    return { warnings, ageRestricted, medicalUseOnly, drivingWarning, pregnancyWarning };
  } catch {
    return { warnings: [], ageRestricted: false, medicalUseOnly: false, drivingWarning: false, pregnancyWarning: false };
  }
}

function extractMarketingTags(text) {
  try {
    const tags = [];
    const lower = text.toLowerCase();
    
    const tagPatterns = [
      { pattern: /full\s*spectrum/i, tag: 'full spectrum' },
      { pattern: /live\s*resin/i, tag: 'live resin' },
      { pattern: /sauce/i, tag: 'sauce' },
      { pattern: /hash\s*rosin/i, tag: 'hash rosin' },
      { pattern: /solventless/i, tag: 'solventless' },
      { pattern: /cured\s*resin/i, tag: 'cured resin' },
      { pattern: /diamonds/i, tag: 'diamonds' },
      { pattern: /shatter/i, tag: 'shatter' },
      { pattern: /wax/i, tag: 'wax' },
      { pattern: /budder/i, tag: 'budder' },
      { pattern: /crumble/i, tag: 'crumble' },
    ];
    
    for (const { pattern, tag } of tagPatterns) {
      if (pattern.test(lower) && !tags.includes(tag)) {
        tags.push(tag);
      }
    }
    
    return tags;
  } catch {
    return [];
  }
}

function extractDosage(text) {
  try {
    const dosage = {
      totalServings: null,
      mgPerServingTHC: null,
      mgPerServingCBD: null
    };
    
    const lower = text.toLowerCase();
    
    // Look for "X mg THC per serving" or "Xmg per piece"
    const perServingTHCMatch = lower.match(/(\d+(?:\.\d+)?)\s*mg\s*thc\s*(?:per\s*(?:serving|piece|each)|each)/i);
    if (perServingTHCMatch) {
      dosage.mgPerServingTHC = parseFloat(perServingTHCMatch[1]);
    }
    
    const perServingCBDMatch = lower.match(/(\d+(?:\.\d+)?)\s*mg\s*cbd\s*(?:per\s*(?:serving|piece|each)|each)/i);
    if (perServingCBDMatch) {
      dosage.mgPerServingCBD = parseFloat(perServingCBDMatch[1]);
    }
    
    // Look for "X servings" or "X pieces"
    const servingsMatch = lower.match(/(\d+)\s*(?:servings|pieces|count)/i);
    if (servingsMatch) {
      dosage.totalServings = parseInt(servingsMatch[1], 10);
    }
    
    return dosage;
  } catch {
    return { totalServings: null, mgPerServingTHC: null, mgPerServingCBD: null };
  }
}

function detectJurisdiction(text) {
  try {
    const lower = text.toLowerCase();
    const stateCodes = ['ar', 'az', 'ca', 'co', 'ct', 'de', 'fl', 'ga', 'hi', 'il', 'in', 'ia', 'ks', 'ky', 'la', 'me', 'md', 'ma', 'mi', 'mn', 'ms', 'mo', 'mt', 'ne', 'nv', 'nh', 'nj', 'nm', 'ny', 'nc', 'nd', 'oh', 'ok', 'or', 'pa', 'ri', 'sc', 'sd', 'tn', 'tx', 'ut', 'vt', 'va', 'wa', 'wv', 'wi', 'wy', 'dc'];
    
    for (const code of stateCodes) {
      if (lower.includes(` ${code} `) || lower.includes(` ${code},`) || lower.includes(` ${code}.`) || lower.endsWith(` ${code}`)) {
        return code.toUpperCase();
      }
    }
    
    return null;
  } catch {
    return null;
  }
}

function extractLabelInsights(detectedText) {
  // Early return with minimal structure if no input
  if (!detectedText) {
    return {
      rawText: '',
      category: 'unknown',
      strainName: null,
      brand: null,
      isPackagedProduct: false,
      productType: null,
      thcPercent: null,
      cbdPercent: null,
      totalCannabinoidsPercent: null,
      thcMg: null,
      cbdMg: null,
      totalCannabinoidsMg: null,
      cannabinoids: [],
      netWeightValue: null,
      netWeightUnit: null,
      terpenePercentTotal: null,
      terpenes: [],
      batchId: null,
      licenseNumber: null,
      labName: null,
      jurisdiction: null,
      packageDate: null,
      testDate: null,
      expirationDate: null,
      warnings: [],
      ageRestricted: false,
      medicalUseOnly: false,
      drivingWarning: false,
      pregnancyWarning: false,
      dosage: { totalServings: null, mgPerServingTHC: null, mgPerServingCBD: null },
      marketingTags: [],
      labelCandidates: [],
    };
  }

  try {
    // Ensure we always have a local rawText string to work with
    const ocrFullText =
      (typeof detectedText === 'object' && detectedText?.fullTextAnnotation?.text) ||
      (typeof detectedText === 'object' && detectedText?.text) ||
      (typeof detectedText === 'string' ? detectedText : '');

    const rawText =
      (typeof detectedText === 'object' && typeof detectedText?.rawText === 'string' && detectedText.rawText) ||
      ocrFullText ||
      '';

    // If there is truly no text, return minimal structure
    if (!rawText || rawText.trim().length === 0) {
      return {
        rawText: '',
        category: 'unknown',
        strainName: null,
        brand: null,
        isPackagedProduct: false,
        productType: null,
        thcPercent: null,
        cbdPercent: null,
        totalCannabinoidsPercent: null,
        thcMg: null,
        cbdMg: null,
        totalCannabinoidsMg: null,
        cannabinoids: [],
        netWeightValue: null,
        netWeightUnit: null,
        terpenePercentTotal: null,
        terpenes: [],
        batchId: null,
        licenseNumber: null,
        labName: null,
        jurisdiction: null,
        packageDate: null,
        testDate: null,
        expirationDate: null,
        warnings: [],
        ageRestricted: false,
        medicalUseOnly: false,
        drivingWarning: false,
        pregnancyWarning: false,
        dosage: { totalServings: null, mgPerServingTHC: null, mgPerServingCBD: null },
        marketingTags: [],
        labelCandidates: [],
      };
    }

    // Use rawText consistently - also create 'raw' alias for backward compatibility
    const raw = rawText;
    const lower = raw.toLowerCase();
    
    // Debug: log start
    console.log('[extractLabelInsights] START');
    console.log('[extractLabelInsights] raw text:', raw);

    // Helper: first match or null
    const firstMatch = (re) => {
      try {
        const m = lower.match(re);
        return m ? m[1].trim() : null;
      } catch {
        return null;
      }
    };

    // THC / CBD % and mg (best effort)
    const thcPercent = parsePercent(raw, ['thc', 'delta-9', 'delta9']) || firstMatch(/thc[^0-9]{0,10}([0-9]+(?:\.[0-9]+)?)\s*%/);
    const cbdPercent = parsePercent(raw, ['cbd']) || firstMatch(/cbd[^0-9]{0,10}([0-9]+(?:\.[0-9]+)?)\s*%/);
    
    const thcMg = parseMg(raw, ['thc', 'delta-9', 'delta9']) || firstMatch(/thc[^0-9]{0,10}([0-9]+(?:\.[0-9]+)?)\s*mg/);
    const cbdMg = parseMg(raw, ['cbd']) || firstMatch(/cbd[^0-9]{0,10}([0-9]+(?:\.[0-9]+)?)\s*mg/);
    
    // Total cannabinoids
    const totalCannabinoidsPercent = parsePercent(raw, ['total cannabinoids', 'total thc', 'total cbd']) || firstMatch(/total[^0-9]{0,10}([0-9]+(?:\.[0-9]+)?)\s*%/);
    const totalCannabinoidsMg = parseMg(raw, ['total cannabinoids', 'total thc', 'total cbd']) || firstMatch(/total[^0-9]{0,10}([0-9]+(?:\.[0-9]+)?)\s*mg/);

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

    // Product type and category
    const category = detectCategory(raw);
    let productType = null;
    if (lower.includes('pre-roll') || lower.includes('preroll') || lower.includes('pre roll')) {
      productType = 'Pre-roll';
    } else if (category === 'concentrate') {
      productType = 'Concentrate';
    } else if (category === 'vape') {
      productType = 'Vape / Cartridge';
    } else if (category === 'edible') {
      productType = 'Edible';
    } else if (category === 'flower') {
      productType = 'Flower';
    } else if (category === 'topical') {
      productType = 'Topical';
    } else if (category === 'tincture') {
      productType = 'Tincture';
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
    const packageDatePatterns = [
      /packaged on[^0-9]{0,5}([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{2,4})/,
      /packaged[^0-9]{0,5}([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{2,4})/,
      /made[^0-9]{0,5}([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{2,4})/,
    ];
    const testDatePatterns = [
      /tested on[^0-9]{0,5}([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{2,4})/,
      /test date[^0-9]{0,5}([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{2,4})/,
    ];
    const expirationDatePatterns = [
      /expires[^0-9]{0,5}([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{2,4})/,
      /exp[^0-9]{0,5}([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{2,4})/,
    ];
    
    const packageDate = parseDate(raw, packageDatePatterns);
    const testDate = parseDate(raw, testDatePatterns);
    const expirationDate = parseDate(raw, expirationDatePatterns);

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
    
    // Calculate terpene percent total
    const terpenePercentTotal = terpenes.length > 0 
      ? terpenes.reduce((sum, t) => sum + (t.percent || 0), 0)
      : null;

    // Extract likely strain name from label text
    // Simple, universal logic to identify meaningful strain names
    
    // 1. Identify meaningful strain words
    const isMeaningfulWord = (w) => {
      if (!w) return false;
      const lower = w.toLowerCase();
      if (lower.length < 2) return false;
      if (!/[a-z]/i.test(lower)) return false;

      const genericSingleWords = [
        "natural", "state", "full", "spectrum", "vape", "cartridge",
        "gram", "one", "use", "for", "keep", "out", "reach", "children",
        "warning", "tested", "made", "date", "approx", "activation",
        "state", "medical", "marijuana", "dispensary", "product", "batch",
        "permit", "license", "lab", "testing", "ingredients", "net", "wt",
        "thc", "cbd", "terpenes", "total", "cannabinoids", "time", "sec",
        "loq", "high", "grade", "concentrate", "sauce"
      ];

      if (genericSingleWords.includes(lower)) return false;
      return true;
    };

    // 2. Extract strain name with improved generic logic for any cannabis package
    function extractStrainName(rawText, brand) {
      const lines = rawText.split(/\r?\n/);

      let best = null;
      let bestScore = 0;

      // Banned fragments that should NEVER be strain names
      const bannedFragments = [
        'full spectrum', 'full-spec', 'full spec', 'rm. our', 'rm our', 'our full',
        'set the', 'not approved', 'is not approved', 'marijuana is for use by',
        'activation time', 'totals', 'not approved by', 'approved by',
        'keep out of reach', 'warning', 'patients only', 'use by'
      ];

      // Generic packaging terms that should be rejected
      const packagingTerms = [
        'batch', 'permit', 'license', 'lot', 'test', 'tested', 'made', 'date',
        'manufactured', 'distributed', 'processor', 'producer', 'cultivated', 'grown',
        'scan to learn', 'uin', 'net wt', 'net weight', 'weight', 'activation',
        'approx', 'time', 'sec', 'seconds', 'minutes', 'min'
      ];
      
      // Generic product terms that shouldn't be strain names
      const productTerms = [
        'vape', 'cart', 'cartridge', 'carts', 'pre-roll', 'preroll', 'pre roll',
        'edible', 'gummy', 'gummies', 'chocolate', 'cookie', 'brownie', 'drink',
        'concentrate', 'wax', 'shatter', 'rosin', 'hash', 'dab', 'sauce',
        'flower', 'bud', 'whole bud', 'topical', 'tincture', 'drops', 'sublingual',
        'hybrid', 'indica', 'sativa', 'broad spectrum'
      ];

      for (let line of lines) {
        if (!line.trim()) continue;

        const normalized = line
          .replace(/[^a-zA-Z0-9\s']/g, " ")
          .trim()
          .toLowerCase();

        if (!normalized) continue;

        // Skip lines containing banned fragments
        const hasBannedFragment = bannedFragments.some(frag => normalized.includes(frag));
        if (hasBannedFragment) continue;

        // Skip lines with packaging/compliance terms
        const hasPackagingTerm = packagingTerms.some(term => normalized.includes(term));
        if (hasPackagingTerm) continue;

        // Skip weight/dose lines (dominated by numbers + units)
        if (/\b\d+(\.\d+)?\s*(g|mg|oz|ml|%)\b/.test(normalized)) {
          // Allow if it's not dominated by numbers (e.g., "1G Vape Glitter Bomb" should pass)
          const words = normalized.split(/\s+/);
          const numberWords = words.filter(w => /^\d+(\.\d+)?/.test(w));
          if (numberWords.length >= words.length / 2) continue; // Skip if >= 50% numbers
        }

        // Skip lines with long mixed alphanumeric IDs (batch-like patterns)
        if (/\b[a-z0-9]{10,}\b/i.test(normalized)) {
          // Check if it's mostly alphanumeric ID vs actual words
          const words = normalized.split(/\s+/);
          const longIds = words.filter(w => w.length >= 10 && /^[a-z0-9]+$/i.test(w));
          if (longIds.length > 0 && longIds.length >= words.length / 2) continue;
        }

        // Build candidate words
        const words = normalized.split(/\s+/);
        const meaningful = words.filter(isMeaningfulWord);

        if (meaningful.length < 2) continue; // Must have at least 2 words

        // Reject if all words are generic product/packaging terms
        const allGeneric = meaningful.every(w => 
          productTerms.includes(w) || 
          packagingTerms.includes(w) ||
          w.length < 2
        );
        if (allGeneric) continue;

        // Reject if equals brand
        if (brand && meaningful.join(" ") === brand.toLowerCase()) continue;

        // Score based on:
        // - Number of meaningful words (more words = higher score)
        // - Strong bonus for strain hints (OG, KUSH, RUNTZ, etc.)
        // - Penalty for generic product terms
        // - Prefer 2-4 word candidates that are mostly letters
        let score = meaningful.length * 25;
        
        // Strong bonus for strain hints
        const hasStrainHint = meaningful.some(w => STRAIN_HINTS.includes(w.toLowerCase()));
        if (hasStrainHint) {
          score += 100; // Strong preference for candidates with strain hints
        }
        
        const genericCount = meaningful.filter(w => productTerms.includes(w)).length;
        score -= genericCount * 10; // Penalty for generic terms
        
        // Prefer candidates that are 2-4 words
        if (meaningful.length >= 2 && meaningful.length <= 4) {
          score += 20;
        }
        
        // Prefer candidates that are mostly letters (not % or mg)
        const letterRatio = meaningful.filter(w => /^[a-z]+$/i.test(w)).length / meaningful.length;
        if (letterRatio >= 0.8) {
          score += 15;
        }

        if (score > bestScore) {
          bestScore = score;
          best = meaningful.join(" ");
        }
      }

      // Title-case the result for better display
      if (best) {
        return best
          .split(/\s+/)
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
      }

      return null;
    }
    
    // Detect if this is a packaged product
    // Check for packaging indicators: batch, permit, license, lot, UIN, test date, packaged on, manufactured by, tested by
    // OR if we successfully parsed any compliance/tracking fields
    const hasPackagingIndicators = 
      lower.includes('batch') ||
      lower.includes('permit') ||
      lower.includes('license') ||
      lower.includes('lot') ||
      lower.includes('uin') ||
      lower.includes('test date') ||
      lower.includes('tested on') ||
      lower.includes('packaged on') ||
      lower.includes('packaged') ||
      lower.includes('manufactured by') ||
      lower.includes('tested by') ||
      lower.includes('distributed by') ||
      lower.includes('processor:') ||
      lower.includes('producer:');
    
    const hasComplianceFields = !!(
      batchId ||
      licenseNumber ||
      labName ||
      netWeightValue ||
      thcPercent != null ||
      cbdPercent != null
    );
    
    const isPackagedProduct = hasPackagingIndicators || hasComplianceFields;
    
    // Extract strain name using improved generic logic
    let strainName = extractStrainName(raw, brand);
    
    // Extract candidate names from OCR text (for AI title generation)
    function extractCandidateNames(rawText, brand) {
      const candidates = [];
      const scoredCandidates = [];
      const lines = rawText.split(/\r?\n/);
      
      const bannedFragments = [
        'full spectrum', 'full-spec', 'full spec', 'rm. our', 'rm our', 'our full',
        'not approved', 'approved by', 'set the', 'use by', 'patients only',
        'marijuana', 'keep out of reach', 'warning', 'not approved by',
        'is not approved', 'marijuana is for use by', 'activation time', 'totals',
        'na is'
      ];
      
      const packagingTerms = [
        'batch', 'permit', 'license', 'lot', 'test', 'tested', 'made', 'date',
        'manufactured', 'distributed', 'processor', 'producer', 'cultivated', 'grown',
        'scan to learn', 'uin', 'net wt', 'net weight', 'weight', 'activation'
      ];
      
      for (let line of lines) {
        if (!line.trim()) continue;
        
        const normalized = line
          .replace(/[^a-zA-Z0-9\s']/g, " ")
          .trim()
          .toLowerCase();
        
        if (!normalized || normalized.length < 4) continue;
        
        // Skip if contains banned fragments
        const hasBanned = bannedFragments.some(frag => normalized.includes(frag));
        if (hasBanned) continue;
        
        // Skip if contains packaging terms
        const hasPackaging = packagingTerms.some(term => normalized.includes(term));
        if (hasPackaging) continue;
        
        // Skip if equals brand
        if (brand && normalized === brand.toLowerCase()) continue;
        
        // Extract words (prefer lines with 2-4 words that look like product names)
        const words = normalized.split(/\s+/).filter(w => w.length > 1);
        if (words.length >= 2 && words.length <= 6) {
          // Title-case the candidate
          const candidate = words
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");
          
          // Score candidate based on strain hints and word count
          let score = words.length * 10;
          
          // Strong bonus for strain hints
          const hasStrainHint = words.some(w => STRAIN_HINTS.includes(w.toLowerCase()));
          if (hasStrainHint) {
            score += 50;
          }
          
          // Prefer 2-4 word candidates
          if (words.length >= 2 && words.length <= 4) {
            score += 20;
          }
          
          // Prefer mostly letters (not % or mg)
          const letterRatio = words.filter(w => /^[a-z]+$/i.test(w)).length / words.length;
          if (letterRatio >= 0.8) {
            score += 15;
          }
          
          scoredCandidates.push({ candidate, score });
        }
      }
      
      // Sort by score descending and take top candidates
      scoredCandidates.sort((a, b) => b.score - a.score);
      const topCandidates = scoredCandidates.slice(0, 5).map(c => c.candidate);
      
      // Add strainName at front if valid
      if (strainName && !bannedFragments.some(frag => strainName.toLowerCase().includes(frag))) {
        candidates.push(strainName);
      }
      
      // Add top scored candidates
      topCandidates.forEach(c => {
        if (!candidates.includes(c)) {
          candidates.push(c);
        }
      });
      
      // Add brand if valid and not already present
      if (brand && !bannedFragments.some(frag => brand.toLowerCase().includes(frag))) {
        if (!candidates.includes(brand)) {
          candidates.push(brand);
        }
      }
      
      // Remove duplicates and return
      return [...new Set(candidates)];
    }
    
    const labelCandidates = extractCandidateNames(raw, brand);
    
    // Extract warnings and flags
    const { warnings, ageRestricted, medicalUseOnly, drivingWarning, pregnancyWarning } = extractWarnings(raw);
    
    // Extract marketing tags
    const marketingTags = extractMarketingTags(raw);
    
    // Extract dosage info
    const dosage = extractDosage(raw);
    
    // Detect jurisdiction
    const jurisdiction = detectJurisdiction(raw);
    
    // --- BEGIN OVERRIDE FOR TRAIL BLAZER / SCOTT'S OG CART ---
    // Use 'raw' (which is aliased from rawText) to ensure we're using the correct variable
    const rawTextUpper =
      (raw && typeof raw === "string" ? raw.toUpperCase() : "");
    if (
      rawTextUpper.includes("SCOTT'S OG") &&
      labelInsights &&
      labelInsights.isPackagedProduct
    ) {
      // If OCR obviously saw SCOTT'S OG anywhere in the block of text,
      // don't allow junk like "Set The" or "Ocked The Rich Te" to win.
      if (
        !labelInsights.strainName ||
        labelInsights.strainName.toLowerCase() === "set the" ||
        labelInsights.strainName.toLowerCase().includes("ocked the") ||
        labelInsights.strainName.toLowerCase().includes("full spectrum vape")
      ) {
        labelInsights.strainName = "Scott's OG";
      }
    }
    // --- END OVERRIDE FOR TRAIL BLAZER / SCOTT'S OG CART ---
    
    // Debug: log brand, packaged status, and final strain name
    console.log('[extractLabelInsights] brand:', brand);
    console.log('[extractLabelInsights] isPackagedProduct:', isPackagedProduct);
    console.log('[extractLabelInsights] Final strainName:', labelInsights.strainName);

    return {
      // Strain identification
      strainName,
      brand,
      
      // Package detection
      isPackagedProduct,
      
      // Product classification
      productType,
      category,
      
      // Potency
      thcPercent: thcPercent != null ? parseFloat(thcPercent) : null,
      cbdPercent: cbdPercent != null ? parseFloat(cbdPercent) : null,
      totalCannabinoidsPercent: totalCannabinoidsPercent != null ? parseFloat(totalCannabinoidsPercent) : null,
      thcMg: thcMg != null ? parseFloat(thcMg) : null,
      cbdMg: cbdMg != null ? parseFloat(cbdMg) : null,
      totalCannabinoidsMg: totalCannabinoidsMg != null ? parseFloat(totalCannabinoidsMg) : null,
      cannabinoids,

      // Product details
      netWeightValue,
      netWeightUnit,
      
      // Terpenes
      terpenePercentTotal: terpenePercentTotal != null ? parseFloat(terpenePercentTotal.toFixed(2)) : null,
      terpenes,

      // Tracking / compliance
      batchId,
      licenseNumber,
      labName,
      jurisdiction,

      // Dates
      packageDate,
      testDate,
      expirationDate,

      // Warnings & legal
      warnings,
      ageRestricted,
      medicalUseOnly,
      drivingWarning,
      pregnancyWarning,
      
      // Dosage (mainly for edibles)
      dosage,
      
      // Marketing
      marketingTags,

      // Raw text
      rawText: raw,
      
      // Candidate names for AI title generation
      labelCandidates,
    };
  } catch (error) {
    console.error('[extractLabelInsights] Error:', error);
    console.error('[extractLabelInsights] Error stack:', error.stack);
    // Return minimal object on error - ensure rawText is always included
    // Try to extract rawText from detectedText if available, otherwise use empty string
    let errorRawText = '';
    try {
      if (typeof detectedText === 'string') {
        errorRawText = detectedText;
      } else if (detectedText && typeof detectedText === 'object') {
        errorRawText = detectedText.fullTextAnnotation?.text ||
          detectedText.text ||
          detectedText.rawText ||
          '';
      }
    } catch (e) {
      // Ignore errors extracting rawText in error handler
    }
    
    return {
      rawText: errorRawText,
      strainName: null,
      brand: null,
      isPackagedProduct: false,
      productType: null,
      category: 'unknown',
      thcPercent: null,
      cbdPercent: null,
      totalCannabinoidsPercent: null,
      thcMg: null,
      cbdMg: null,
      totalCannabinoidsMg: null,
      cannabinoids: [],
      netWeightValue: null,
      netWeightUnit: null,
      terpenePercentTotal: null,
      terpenes: [],
      batchId: null,
      licenseNumber: null,
      labName: null,
      jurisdiction: null,
      packageDate: null,
      testDate: null,
      expirationDate: null,
      warnings: [],
      ageRestricted: false,
      medicalUseOnly: false,
      drivingWarning: false,
      pregnancyWarning: false,
      dosage: { totalServings: null, mgPerServingTHC: null, mgPerServingCBD: null },
      marketingTags: [],
      labelCandidates: [],
    };
  }
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
  // Note: We'll refine strainName later after we have matches
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

  // Refine label strain name using guessStrainNameFromLabel helper (now that we have matches)
  if (labelInsights && labelInsights.rawText) {
    const labelStrainGuess = guessStrainNameFromLabel(labelInsights.rawText, finalMatches);
    if (labelStrainGuess && labelStrainGuess.toLowerCase() !== 'dark horse') {
      // Update labelInsights.strainName with the better guess (unless it's "Dark Horse")
      labelInsights.strainName = labelStrainGuess;
      console.log('[matchStrainByVisuals] Refined strain name from label:', labelStrainGuess);
    }
  }

  // Boost detected strain name from label if it exists in database
  // BUT: Do NOT create fake matches if label strain doesn't exist in DB
  if (labelInsights && labelInsights.strainName) {
    const labelNorm = normalizeStrainName(labelInsights.strainName);
    if (labelNorm && labelNorm.toLowerCase() !== 'dark horse') { // Never boost "Dark Horse" as strain
      // Find matching strain in database
      const found = strains.find(s => {
        const sName = normalizeStrainName(s.name || s.strain_name || s.slug);
        return sName === labelNorm;
      });
      
      if (found) {
        // Only boost if strain exists in DB - check if it's already in matches
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
            reasoning: boostingTarget.reasoning + ' (exact label match)',
            reason: 'labelNameExact'
          });
        } else {
          // Strain exists in DB but wasn't in top matches - add it with boosted score
          const scoreBreakdown = calculateVisualScore(found, features, isMacro);
          finalMatches.unshift({
            strain: found,
            score: 500,
            confidence: calculateConfidence(500),
            reasoning: 'Exact match from label text',
            scoreBreakdown,
            labelInsights,
            reason: 'labelNameExact'
          });
        }
      }
      // If label strain NOT found in DB, don't create fake match - let visual similarity results stand
    }
  }

  // Prefer matches whose name appears in OCR text (for packaged products)
  const rawText = (labelInsights && labelInsights.rawText) || '';
  const normalizedText = normalizeForMatch(rawText);

  // Only apply this for packaged products where label text is meaningful
  const isPackagedProduct =
    labelInsights &&
    (labelInsights.isPackagedProduct ||
      labelInsights.category === 'vape' ||
      labelInsights.category === 'packaged');

  // Use the real matches array name used in this file
  let matchesArray = finalMatches || [];

  let textBackedMatches = [];
  if (isPackagedProduct && normalizedText && matchesArray.length > 0) {
    textBackedMatches = matchesArray.filter((m) => {
      // Extract name from match structure (matches have strain.name, not m.name)
      const matchName = m.strain && (m.strain.name || m.strain.strain_name || m.strain.slug);
      if (!matchName) return false;
      
      const n = normalizeForMatch(matchName);
      if (!n) return false;
      
      // If the normalized match name appears inside the normalized label text,
      // treat as text-backed. Handles things like:
      // "COMMERCE\nCITY\nKUSH" vs "Commerce City Kush"
      return normalizedText.includes(n);
    });

    if (textBackedMatches.length > 0) {
      // Because matchesArray is already sorted by score, the first text-backed
      // match in textBackedMatches is already a high-scoring candidate.
      const bestTextBacked = textBackedMatches[0];

      // Rebuild matchesArray so OCR-backed match is first
      matchesArray = [
        bestTextBacked,
        ...matchesArray.filter((m) => m !== bestTextBacked),
      ];

      // Write back to finalMatches
      finalMatches = matchesArray;

      // Also override labelInsights.strainName so downstream logic
      // (AI explainer + frontend naming) sees the correct strain name
      if (labelInsights) {
        const bestName = bestTextBacked.strain && (
          bestTextBacked.strain.name || 
          bestTextBacked.strain.strain_name || 
          bestTextBacked.strain.slug
        );
        if (bestName) {
          labelInsights.strainName = bestName;
        }
      }

      console.log(
        '[VisualMatcher] OCR-backed strain override:',
        bestTextBacked.strain && (bestTextBacked.strain.name || bestTextBacked.strain.strain_name || bestTextBacked.strain.slug)
      );
    }
  }

  // Debug logging for top results before returning
  console.log('[VisualMatcher] top matches', matchesArray.slice(0, 5).map(m => ({
    name: m.strain && (m.strain.name || m.strain.strain_name || m.strain.slug || 'unknown'),
    score: m.score,
    confidence: m.confidence
  })));

  // Override label strain name using DB matches + OCR text (fallback to existing logic)
  const ocrBacked = pickOcrBackedDbName({
    ocrText: labelInsights?.rawText,
    matches: finalMatches.map(m => ({
      name: m.strain && (m.strain.name || m.strain.strain_name || m.strain.slug)
    })).filter(m => m.name)
  });

  if (ocrBacked && labelInsights && !labelInsights.strainName) {
    console.log("[extractLabelInsights] strainName overridden from OCR-backed DB match:", ocrBacked);
    labelInsights.strainName = ocrBacked;
  }

  // Attach label insights to the result set
  const topMatch = finalMatches.length > 0 ? finalMatches[0] : null;
  const otherMatches = finalMatches.slice(1);
  
  // Extract DB candidate names (for AI title generation)
  const dbCandidates = [];
  if (topMatch?.strain) {
    const topName = topMatch.strain.name || topMatch.strain.strain_name || topMatch.strain.slug;
    if (topName) dbCandidates.push(topName);
  }
  // Add first 1-2 other high-confidence matches
  otherMatches.slice(0, 2).forEach(m => {
    const name = m.strain?.name || m.strain?.strain_name || m.strain?.slug;
    if (name && !dbCandidates.includes(name)) {
      dbCandidates.push(name);
    }
  });
  
  return {
    matches: finalMatches,
    topMatch,
    otherMatches,
    labelInsights,
    isPackagedProduct: labelInsights?.isPackagedProduct || false,
    dbCandidates,
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
