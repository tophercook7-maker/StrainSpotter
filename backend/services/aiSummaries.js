// Backend helper to build a rich AI summary object for scanner results.
import { normalizeMatchConfidence } from './matchUtils.js';
// It takes the Vision API result + the visual matching output and returns
// a single `aiSummary` object that the frontend can render.
//
// Expected input shape:
//   visionResult: raw Vision annotateImage result
//   matches: {
//     matches: [
//       {
//         slug,
//         name,
//         score,          // 0–200
//         confidence,     // optional, 0–1
//         reasoning       // string
//       },
//       ...
//     ]
//   }
//
// Output shape:
//   {
//     isPackagedProduct: boolean,
//     matchConfidence: number | null,     // 0–1
//     matchedStrainName: string | null,
//     estimateConfidenceLabel: string,    // "Very strong match" | ... | "Unknown"
//     estimateType: "visual+label" | "visual-only" | "label-only",
//     notes: string,
//     label: {
//       productName,
//       brandName,
//       packageType,
//       packageSize,
//       thcPercent,
//       cbdPercent,
//       thcaPercent,
//       batchId,
//       lotNumber,
//       harvestDate,
//       testDate,
//       labName,
//       licenseNumber,
//       originType
//     }
//   }

export function buildScanAISummary({ 
  visionResult, 
  matches, 
  scanType = null, 
  stabilityScore = 1.0, 
  stabilityLabel = 'single-frame', 
  numberOfFrames = 1 
}) {
  try {
    const textAnn = visionResult?.textAnnotations || [];

    const labelAnn = visionResult?.labelAnnotations || [];

    const fullText = (textAnn[0]?.description || '').trim();

    const labels = (labelAnn || []).map((l) => (l.description || '').toLowerCase());

    const topMatch = Array.isArray(matches?.matches) && matches.matches.length > 0
      ? matches.matches[0]
      : null;

    const matchConfidence = normalizeMatchConfidence(topMatch);
    const matchedStrainName = topMatch?.name || null;
    const estimateConfidenceLabel = computeConfidenceLabel(matchConfidence);

    const labelInfo = extractLabelInfo(fullText);
    const isPackagedProduct = detectPackagedProduct({
      fullText,
      labels,
      hasThc: labelInfo.thcPercent != null,
      hasCbd: labelInfo.cbdPercent != null,
    });

    // Classify scan type if not provided
    const detectedScanType = scanType || classifyScanType(visionResult, fullText, labels, isPackagedProduct);

    const estimateType = computeEstimateType({
      isPackagedProduct,
      fullText,
      labels,
    });

    const notes = buildNotes({
      matchConfidence,
      estimateConfidenceLabel,
      isPackagedProduct,
      topMatch,
      labelInfo,
      scanType: detectedScanType,
      stabilityLabel,
      numberOfFrames,
    });

    return {
      hasSummary: true,
      isPackagedProduct,
      matchConfidence,
      matchedStrainName,
      estimateConfidenceLabel,
      estimateType,
      notes,
      scanType: detectedScanType,
      stabilityScore,
      stabilityLabel,
      numberOfFrames,
      label: {
        productName: labelInfo.productName,
        brandName: labelInfo.brandName,
        packageType: labelInfo.packageType,
        packageSize: labelInfo.packageSize,
        thcPercent: labelInfo.thcPercent,
        cbdPercent: labelInfo.cbdPercent,
        thcaPercent: labelInfo.thcaPercent,
        batchId: labelInfo.batchId,
        lotNumber: labelInfo.lotNumber,
        harvestDate: labelInfo.harvestDate,
        testDate: labelInfo.testDate,
        labName: labelInfo.labName,
        licenseNumber: labelInfo.licenseNumber,
        originType: labelInfo.originType,
      },
    };
  } catch (err) {
    console.error('[Scan Summary] buildScanAISummary error', err);
    return {
      hasSummary: false,
      error: 'AI summary failed to generate',
    };
  }
}

// normalizeMatchConfidenceForSummary removed - now using shared normalizeMatchConfidence from matchUtils.js

function computeConfidenceLabel(matchConfidence) {
  if (matchConfidence == null) return 'Unknown';
  const pct = matchConfidence * 100;
  if (pct >= 95) return 'Very strong match';
  if (pct >= 85) return 'Strong match';
  if (pct >= 70) return 'Moderate match';
  if (pct > 0) return 'Low confidence';
  return 'Unknown';
}

function extractLabelInfo(fullTextRaw) {
  const fullText = (fullTextRaw || '').replace(/\s+/g, ' ');
  const upper = fullText.toUpperCase();

  let thcPercent = null;
  let cbdPercent = null;
  let thcaPercent = null;

  // Simple THC% / CBD% / THCA% extraction
  const thcMatch = upper.match(/THC[^0-9]{0,10}([0-9]+(\.[0-9]+)?)\s*%/);
  if (thcMatch) thcPercent = parseFloat(thcMatch[1]);

  const cbdMatch = upper.match(/CBD[^0-9]{0,10}([0-9]+(\.[0-9]+)?)\s*%/);
  if (cbdMatch) cbdPercent = parseFloat(cbdMatch[1]);

  const thcaMatch = upper.match(/THCA?[^0-9]{0,10}([0-9]+(\.[0-9]+)?)\s*%/);
  if (thcaMatch) thcaPercent = parseFloat(thcaMatch[1]);

  // Look for candidate product + brand lines by splitting into lines.
  const lines = fullTextRaw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  let productName = null;
  let brandName = null;
  let packageSize = null;
  let batchId = null;
  let lotNumber = null;
  let harvestDate = null;
  let testDate = null;
  let labName = null;
  let licenseNumber = null;

  for (const line of lines) {
    const u = line.toUpperCase();

    if (!productName && u.length >= 3 && u.length <= 40 && /[A-Z]/.test(u) && !u.includes('%')) {
      // First decent non-percent line becomes candidate product name.
      productName = line;
    }

    if (!brandName && /(NATURAL STATE|CANNABIS|BRAND|COMPANY|FARMS|GROWERS|ORGANICS|CO\.)/i.test(line)) {
      brandName = line;
    }

    if (!packageSize && /\b(0\.\d+\s*(G|GRAM)|[0-9]+(\.[0-9]+)?\s*(G|GRAM|GRAMS|ML|OZ|PCS))\b/i.test(line)) {
      packageSize = line;
    }

    if (!batchId && /\bBATCH[:\s#-]*([A-Z0-9\-]+)/i.test(line)) {
      batchId = line.replace(/.*BATCH[:\s#-]*/i, '').trim();
    }

    if (!lotNumber && /\bLOT[:\s#-]*([A-Z0-9\-]+)/i.test(line)) {
      lotNumber = line.replace(/.*LOT[:\s#-]*/i, '').trim();
    }

    if (!licenseNumber && /\bLIC(ENSE|#| NO\.?)\b/i.test(line)) {
      licenseNumber = line;
    }

    if (!harvestDate && /HARVEST/i.test(line)) {
      harvestDate = extractDate(line);
    }

    if (!testDate && /(TESTED|TEST DATE)/i.test(line)) {
      testDate = extractDate(line);
    }

    if (!labName && /(LABORATOR(Y|IO)|LABS?|TESTING)/i.test(line)) {
      labName = line;
    }
  }

  // Crude guess for package type
  let packageType = null;
  const uall = upper;
  if (/\bCART|CARTRIDGE|VAPE\b/.test(uall)) packageType = 'Cart';
  else if (/\bPRE[- ]?ROLL/.test(uall)) packageType = 'Pre-roll';
  else if (/\bEDIBLE|GUMMIES|CHOCOLATE\b/.test(uall)) packageType = 'Edible';
  else if (/\bFLOWER|BUD|NUGS?\b/.test(uall)) packageType = 'Flower';

  // Very rough origin type
  let originType = null;
  if (/DISPENSAR(Y|IES)|RETAIL/i.test(fullTextRaw)) originType = 'Dispensary';
  else if (/GROWER|FARM|CULTIVATION/i.test(fullTextRaw)) originType = 'Grower';
  else if (/BRAND|COMPANY|LABS?/i.test(fullTextRaw)) originType = 'Brand';

  return {
    productName,
    brandName,
    packageType,
    packageSize,
    thcPercent,
    cbdPercent,
    thcaPercent,
    batchId,
    lotNumber,
    harvestDate,
    testDate,
    labName,
    licenseNumber,
    originType,
  };
}

function extractDate(line) {
  // Very simple date sniffing: yyyy-mm-dd or mm/dd/yy(yy)
  const iso = line.match(/\b(20[0-9]{2})[-/.](0[1-9]|1[0-2])[-/.]([0-3][0-9])\b/);
  if (iso) {
    return `${iso[1]}-${iso[2]}-${iso[3]}`;
  }
  const us = line.match(/\b(0[1-9]|1[0-2])[\/.-]([0-3][0-9])[\/.-]([0-9]{2,4})\b/);
  if (us) {
    let year = us[3];
    if (year.length === 2) {
      year = parseInt(year, 10) >= 70 ? `19${year}` : `20${year}`;
    }
    return `${year}-${us[1]}-${us[2]}`;
  }
  return null;
}

function detectPackagedProduct({ fullText, labels, hasThc, hasCbd }) {
  const upper = (fullText || '').toUpperCase();

  const packagingKeywords = [
    'NET WT',
    'NET WEIGHT',
    'BATCH',
    'LOT',
    'INGREDIENTS',
    'MANUFACTURED BY',
    'PACKAGED BY',
    'FOR MEDICAL USE ONLY',
    'GOVERNMENT WARNING',
  ];

  const labelHasPackaging = labels.some((l) =>
    /packaging|product|label|brand|cannabis/i.test(l)
  );

  const hasPackagingText = packagingKeywords.some((kw) => upper.includes(kw));

  // NORMAL sensitivity:
  // - If THC or CBD is found
  // - AND we see either brand/packaging words OR Vision labels mention packaging/product
  const hasPotency = hasThc || hasCbd;
  const hasBrandishWords = /(BRAND|COMPANY|FARMS|GROWERS|NATURAL STATE|CANNABIS CO\.?|DISPENSARY)/i.test(
    fullText || ''
  );

  if (hasPotency && (hasBrandishWords || hasPackagingText || labelHasPackaging)) {
    return true;
  }

  return false;
}

function computeEstimateType({ isPackagedProduct, fullText, labels }) {
  const hasAnyLabelText = !!(fullText && fullText.trim().length > 0);
  if (isPackagedProduct && hasAnyLabelText) return 'visual+label';

  const onlyLabelLike =
    hasAnyLabelText && !labels?.length; // Very rough: text but no visual labels.
  if (onlyLabelLike) return 'label-only';

  if (!hasAnyLabelText) return 'visual-only';
  return isPackagedProduct ? 'visual+label' : 'visual-only';
}

/**
 * Classify scan type: package, bud, or plant
 */
export function classifyScanType(visionResult, fullText, labels, isPackagedProduct) {
  // If already detected as packaged product, return "package"
  if (isPackagedProduct) {
    return 'package';
  }

  const upper = (fullText || '').toUpperCase();
  const labelTexts = labels.join(' ').toLowerCase();

  // Plant indicators
  const plantKeywords = ['plant', 'leaf', 'leaves', 'hemp', 'shrub', 'outdoor plant', 'vegetation', 'foliage', 'stem', 'branch'];
  const hasPlantLabels = plantKeywords.some(kw => labelTexts.includes(kw));
  const hasPlantText = /(plant|leaf|hemp|shrub|outdoor|vegetation|foliage|stem|branch)/i.test(fullText);

  // Bud/flower indicators
  const budKeywords = ['cannabis', 'marijuana', 'weed', 'bud', 'nug', 'nugs', 'flower', 'buds', 'trichome'];
  const hasBudLabels = budKeywords.some(kw => labelTexts.includes(kw));
  const hasBudText = /(cannabis|marijuana|weed|bud|nug|flower|trichome)/i.test(fullText);

  // Package indicators (already checked via isPackagedProduct, but double-check)
  const hasPackagingText = /(NET WT|NET WEIGHT|BATCH|LOT|INGREDIENTS|MANUFACTURED|PACKAGED|GOVERNMENT WARNING)/i.test(upper);
  const hasThcCbd = /(THC|CBD)[^0-9]{0,10}[0-9]+/.test(upper);

  // Classification logic
  if (hasPackagingText && hasThcCbd) {
    return 'package';
  }

  if (hasPlantLabels || hasPlantText) {
    // If it looks like a plant and NOT like packaged product, return "plant"
    if (!hasPackagingText && !hasThcCbd) {
      return 'plant';
    }
  }

  // Default to "bud" if cannabis-related labels dominate
  if (hasBudLabels || hasBudText) {
    return 'bud';
  }

  // Fallback: if we have any cannabis-ish content, assume bud
  if (labelTexts.length > 0 || fullText.length > 0) {
    return 'bud';
  }

  // Ultimate fallback
  return 'bud';
}

function buildNotes({
  matchConfidence,
  estimateConfidenceLabel,
  isPackagedProduct,
  topMatch,
  labelInfo,
  scanType = 'bud',
  stabilityLabel = 'single-frame',
  numberOfFrames = 1,
}) {
  const parts = [];

  if (topMatch?.reasoning) {
    parts.push(topMatch.reasoning);
  } else if (estimateConfidenceLabel && matchConfidence != null) {
    const pct = Math.round(matchConfidence * 100);
    parts.push(`${estimateConfidenceLabel} (${pct}% confidence) based on visual features and label text.`);
  }

  // Add scan type context
  if (scanType === 'package') {
    parts.push(
      'This scan looks like a packaged retail product. THC/CBD and label details were read directly from the photo and used to refine the match.'
    );
  } else if (scanType === 'bud') {
    parts.push(
      'This looks like loose flower. The estimate is based mostly on visual structure (buds, trichomes, coloration).'
    );
  } else if (scanType === 'plant') {
    parts.push(
      'This appears to be a live plant shot. Estimates for live plants are usually less precise than packaged/bud scans.'
    );
  } else if (isPackagedProduct) {
    parts.push(
      'This looks like a packaged product: potency and label details were read directly from the photo and used to refine the match.'
    );
  } else {
    parts.push(
      'No full retail label was detected; this estimate leans more on visual features and may be less precise.'
    );
  }

  // Add stability context
  if (numberOfFrames > 1) {
    if (stabilityLabel === 'high') {
      parts.push('Results were consistent across multiple angles of the same product.');
    } else if (stabilityLabel === 'medium') {
      parts.push('Results were mostly consistent across angles, with some variation.');
    } else if (stabilityLabel === 'low') {
      parts.push('Different angles gave conflicting signals. Consider rescanning with clearer shots.');
    }
  } else {
    parts.push('Single-frame scan. Add more angles in future updates for higher stability.');
  }

  if (labelInfo.thcPercent != null || labelInfo.cbdPercent != null) {
    const thc = labelInfo.thcPercent != null ? `${labelInfo.thcPercent.toFixed(2)}% THC` : null;
    const cbd = labelInfo.cbdPercent != null ? `${labelInfo.cbdPercent.toFixed(2)}% CBD` : null;
    const combined = [thc, cbd].filter(Boolean).join(', ');
    if (combined) {
      parts.push(`Label potency detected: ${combined}.`);
    }
  }

  return parts.join(' ');
}

// Keep the existing generateScanAISummary function for backward compatibility
import OpenAI from 'openai';

const openaiApiKey = process.env.OPENAI_API_KEY || '';

const client = openaiApiKey
  ? new OpenAI({ apiKey: openaiApiKey })
  : null;

/**
 * Generate rich AI summary for dispensaries and growers using OpenAI GPT.
 * 
 * Input fields:
 * - packagingInsights: object|null (packaging analysis results)
 * - labelInsights: object|null (label extraction results)
 * - visualMatches: array (visual matching results)
 * - plantHealth: object|null (plant health analysis)
 * - canonical: object (canonical strain resolution result)
 * - visionText: string (raw OCR text, optional fallback)
 * - visionLabels: array (labels from Vision, optional fallback)
 * - strainRecord: object|null (matched strain row from DB, optional)
 *
 * Returns a structured object matching canonical ai_summary shape or null on failure:
 * {
 *   intensity: "LOW" | "MEDIUM" | "HIGH",
 *   effects: string[],
 *   flavors: string[],
 *   aromas: string[],
 *   dispensaryNotes: string[],
 *   growerNotes: string[],
 *   warnings: string[],
 *   summary: string,
 *   audience: "dispensary-and-grower"
 * }
 */
export async function generateScanAISummary({ 
  packagingInsights, 
  labelInsights, 
  visualMatches, 
  plantHealth, 
  canonical,
  visionText,
  visionLabels,
  strainRecord 
}) {
  if (!client || !openaiApiKey) {
    console.warn('[AI] OPENAI_API_KEY missing; skipping AI summary.');
    return null;
  }

  try {
    // Build prompt with rich context
    const prompt = buildRichPrompt({ 
      packagingInsights, 
      labelInsights, 
      visualMatches, 
      plantHealth, 
      canonical,
      visionText,
      visionLabels,
      strainRecord 
    });

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { 
          role: 'system', 
          content: `You are an expert cannabis product analyst writing for TWO audiences:
1) DISPENSARIES (budtenders, managers, buyers).
2) GROWERS (cultivators, head growers, breeders).

You will output STRICT JSON ONLY, with NO extra text, following the schema you have been given.

IMPORTANT:
- If the exact strain is unclear or unknown, DO NOT fabricate specific lineage; speak in general terms like "indica-leaning hybrid".
- You may infer a reasonable profile from known strain names like "White Widow" or "Scott's OG", BUT DO NOT invent impossible facts.
- Use clear, professional, non-medical language. Do NOT claim to diagnose, treat, or cure any condition.
- Be conservative about medical claims. Use "may" / "can" instead of promising effects.`
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
      max_tokens: 1200, // Increased for richer output
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) {
      console.warn('[AI] Empty response content from OpenAI');
      return null;
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (err) {
      console.warn('[AI] Failed to parse AI response JSON:', err);
      return null;
    }

    // Normalize and validate the response to match canonical shape
    const intensity = ['LOW', 'MEDIUM', 'HIGH'].includes(parsed.intensity) 
      ? parsed.intensity 
      : (parsed.intensity?.toUpperCase() === 'HIGH' ? 'HIGH' : 
         parsed.intensity?.toUpperCase() === 'LOW' ? 'LOW' : 'MEDIUM');

    return {
      intensity,
      effects: Array.isArray(parsed.effects) ? parsed.effects : [],
      flavors: Array.isArray(parsed.flavors) ? parsed.flavors : [],
      aromas: Array.isArray(parsed.aromas) ? parsed.aromas : [],
      dispensaryNotes: Array.isArray(parsed.dispensaryNotes) 
        ? parsed.dispensaryNotes 
        : (typeof parsed.dispensaryNotes === 'string' && parsed.dispensaryNotes.trim() 
          ? [parsed.dispensaryNotes.trim()] 
          : []),
      growerNotes: Array.isArray(parsed.growerNotes) 
        ? parsed.growerNotes 
        : (typeof parsed.growerNotes === 'string' && parsed.growerNotes.trim() 
          ? [parsed.growerNotes.trim()] 
          : []),
      warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
      summary: typeof parsed.summary === 'string' ? parsed.summary : '',
      audience: parsed.audience || 'dispensary-and-grower',
      // Backward compatibility fields
      userFacingSummary: parsed.summary || parsed.userFacingSummary || '',
      effectsAndUseCases: Array.isArray(parsed.effects) ? parsed.effects : (Array.isArray(parsed.effectsAndUseCases) ? parsed.effectsAndUseCases : []),
      risksAndWarnings: Array.isArray(parsed.warnings) ? parsed.warnings : (Array.isArray(parsed.risksAndWarnings) ? parsed.risksAndWarnings : []),
    };
  } catch (err) {
    console.error('[AI] Error generating AI summary:', err);
    return null;
  }
}

function buildRichPrompt({ 
  packagingInsights, 
  labelInsights, 
  visualMatches, 
  plantHealth, 
  canonical,
  visionText,
  visionLabels,
  strainRecord 
}) {
  const strainName = canonical?.name || labelInsights?.strainName || packagingInsights?.strainName || null;
  const isPackagedProduct = !!packagingInsights?.isPackagedProduct || !!canonical?.source?.includes('packaging');

  const packagingName = packagingInsights?.strainName || null;
  const labelName = labelInsights?.strainName || null;
  const visualName = visualMatches?.[0]?.name || null;

  const names = [strainName, packagingName, labelName, visualName].filter(Boolean);
  const bestName = names[0] || 'this cannabis product';

  const contextLines = [];

  if (isPackagedProduct) {
    contextLines.push(`This is a PACKAGED product. Treat label text and lab results as the source of truth.`);
  } else {
    contextLines.push(`This is a LIVE PLANT / BUD photo. Any strain name is an estimate, not guaranteed.`);
  }

  if (plantHealth?.stage || plantHealth?.healthLabel) {
    contextLines.push(`Plant health: stage=${plantHealth.stage || 'unknown'}, health=${plantHealth.healthLabel || 'unknown'}.`);
  }

  if (packagingInsights?.labels?.length) {
    contextLines.push(`Packaging labels: ${packagingInsights.labels.join(', ')}.`);
  }

  if (labelInsights?.thc || labelInsights?.cbd) {
    contextLines.push(`Label potency: THC=${labelInsights.thc || 'unknown'}%, CBD=${labelInsights.cbd || 'unknown'}%.`);
  }

  const cleanVisionText = (visionText || '').slice(0, 4000);
  const labelsSnippet = Array.isArray(visionLabels)
    ? visionLabels
        .map(l => {
          const name = l.description || l.name || '';
          const score = typeof l.score === 'number' ? ` (${(l.score * 100).toFixed(0)}%)` : '';
          return name ? `${name}${score}` : '';
        })
        .filter(Boolean)
        .join(', ')
        .slice(0, 800)
    : '';

  const strainContext = strainRecord
    ? {
        name: strainRecord.name,
        type: strainRecord.type,
        thc: strainRecord.thc,
        cbd: strainRecord.cbd,
        effects: strainRecord.effects,
        flavors: strainRecord.flavors,
        lineage: strainRecord.lineage,
      }
    : null;

  const context = contextLines.join('\n');

  return `
FOCUS PRODUCT:
- Name (best guess): ${bestName}
- Is packaged product: ${isPackagedProduct ? 'YES' : 'NO'}

CONTEXT:
${context}

${cleanVisionText ? `OCR TEXT FROM LABEL:\n${cleanVisionText}\n` : ''}
${labelsSnippet ? `VISION LABELS:\n${labelsSnippet}\n` : ''}
${strainContext ? `OPTIONAL STRAIN RECORD (from database):\n${JSON.stringify(strainContext, null, 2)}\n` : ''}

REQUIREMENTS:

1) "intensity":
   - Overall intensity of psychoactive effect.
   - Must be one of: "LOW", "MEDIUM", "HIGH".
   - Consider THC %, terpene content, and typical profile if strain is known.

2) "effects":
   - 3–8 concise effect tags.
   - Examples: "relaxed", "uplifted", "focused", "creative", "sleepy", "euphoric", "social", "body-heavy".
   - Use generic but realistic tags if strain is unknown.

3) "flavors":
   - 2–6 flavor tags.
   - Examples: "citrus", "diesel", "earthy", "sweet", "berry", "tropical", "pine", "spice".
   - You may infer from terpenes if available (e.g., limonene → citrus/lemon).

4) "aromas":
   - 2–6 aroma tags (may overlap with flavor but can be more pungent or specific).
   - Examples: "skunky", "gassy", "herbal", "spicy", "woody".

5) "dispensaryNotes":
   - 2–6 short paragraphs (1–3 sentences each) as an array of strings.
   - Focus on how budtenders should POSITION and EXPLAIN this product to customers.
   - Include:
     - When to recommend (time of day, experience level).
     - What customers it fits (e.g., "after-work relaxation", "creative daytime users").
     - Any standout lab features (THC, CBD, terpenes) in plain language.

6) "growerNotes":
   - 2–6 short paragraphs (1–3 sentences each) as an array of strings.
   - Focus on cultivation-relevant insights based on the apparent type (indica-leaning, sativa-leaning, hybrid) and potency.
   - Include:
     - General growth style (tall/stretchy vs compact, bushy).
     - Environmental preferences (indoor/outdoor, temp/humidity tolerance).
     - Training recommendations (topping, LST, SCROG).
     - Harvest timing (early vs late for desired effect) in qualitative terms.

7) "warnings":
   - 2–6 bullet-style warnings as short strings in an array.
   - Include safety and compliance language, such as:
     - "Not recommended for first-time users due to potency."
     - "Do not operate a vehicle or heavy machinery after use."
     - "Start with a low dose and wait to feel full effects."
     - "Keep out of reach of children and pets."

8) "summary":
   - 2–4 sentences.
   - High-level overview combining potency, effects, and use-case.
   - Useful as a quick read for either a buyer or a head grower.

9) "audience":
   - Always: "dispensary-and-grower".

RETURN ONLY VALID JSON MATCHING THIS STRUCTURE:
{
  "intensity": "LOW" | "MEDIUM" | "HIGH",
  "effects": ["tag1", "tag2", ...],
  "flavors": ["tag1", "tag2", ...],
  "aromas": ["tag1", "tag2", ...],
  "dispensaryNotes": ["paragraph 1", "paragraph 2", ...],
  "growerNotes": ["paragraph 1", "paragraph 2", ...],
  "warnings": ["warning 1", "warning 2", ...],
  "summary": "2-4 sentence overview",
  "audience": "dispensary-and-grower"
}
`.trim();
}
