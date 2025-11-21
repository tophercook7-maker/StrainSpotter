// Backend helper to build a rich AI summary object for scanner results.
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

export function buildScanAISummary({ visionResult, matches }) {
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
  });

  return {
    isPackagedProduct,
    matchConfidence,
    matchedStrainName,
    estimateConfidenceLabel,
    estimateType,
    notes,
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
}

function normalizeMatchConfidence(topMatch) {
  if (!topMatch) return null;
  if (typeof topMatch.confidence === 'number') {
    // Assume 0–1; clamp just in case.
    const c = topMatch.confidence;
    if (c <= 0) return 0;
    if (c >= 1) return 1;
    return c;
  }
  if (typeof topMatch.score === 'number') {
    // Score is 0–200 per docs; map to 0–1.
    const score = Math.max(0, Math.min(200, topMatch.score));
    return score / 200;
  }
  return null;
}

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

function buildNotes({
  matchConfidence,
  estimateConfidenceLabel,
  isPackagedProduct,
  topMatch,
  labelInfo,
}) {
  const parts = [];

  if (topMatch?.reasoning) {
    parts.push(topMatch.reasoning);
  } else if (estimateConfidenceLabel && matchConfidence != null) {
    const pct = Math.round(matchConfidence * 100);
    parts.push(`${estimateConfidenceLabel} (${pct}% confidence) based on visual features and label text.`);
  }

  if (isPackagedProduct) {
    parts.push(
      'This looks like a packaged product: potency and label details were read directly from the photo and used to refine the match.'
    );
  } else {
    parts.push(
      'No full retail label was detected; this estimate leans more on visual features and may be less precise.'
    );
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
 * Generate an AI summary for a completed scan.
 *
 * Input fields:
 * - visionText: string (raw OCR text from Google Vision)
 * - visionLabels: array (labels/objects from Vision, optional)
 * - strainRecord: object|null (matched strain row from DB, if any)
 *
 * Returns a structured object or null on failure:
 * {
 *   userFacingSummary: string,
 *   effectsAndUseCases: string[],
 *   risksAndWarnings: string[],
 *   dispensaryNotes: string,
 *   growerNotes: string,
 *   confidenceNote: string
 * }
 */
export async function generateScanAISummary({ visionText, visionLabels, strainRecord }) {
  if (!client || !openaiApiKey) {
    console.warn('[AI] OPENAI_API_KEY missing; skipping AI summary.');
    return null;
  }

  try {
    const cleanVisionText = (visionText || '').slice(0, 6000);

    const labelsSnippet = Array.isArray(visionLabels)
      ? visionLabels
          .map(l => {
            const name = l.description || l.name || '';
            const score = typeof l.score === 'number' ? ` (${(l.score * 100).toFixed(0)}%)` : '';
            return name ? `${name}${score}` : '';
          })
          .filter(Boolean)
          .join(', ')
          .slice(0, 1000)
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
          growGuide: strainRecord.grow_guide,
        }
      : null;

    const systemPrompt = `
You are an assistant for a cannabis scanning app called StrainSpotter.
You receive OCR text and labels from Google Vision plus optional structured strain data.
Your job is to summarize conservatively and helpfully for three audiences:
- a regular consumer/patient,
- a dispensary budtender,
- a grower/cultivator.

You must:
1) Be conservative about medical claims. Use "may" / "can" instead of promising effects.
2) Clearly indicate uncertainty when information is weak or conflicting.
3) Prefer using the strain record when available, and fall back to OCR/labels otherwise.
4) Avoid inventing specific lab values or terpene percentages when not provided.
`.trim();

    const userPrompt = `
OCR TEXT FROM LABEL:
${cleanVisionText || '(none)'}

VISION LABELS:
${labelsSnippet || '(none)'}

OPTIONAL STRAIN RECORD (from database):
${strainContext ? JSON.stringify(strainContext, null, 2) : '(no structured strain matched)'}

Return a concise JSON object with EXACTLY these keys:
- userFacingSummary: string
- effectsAndUseCases: string[] (3–7 short bullet-style entries)
- risksAndWarnings: string[] (2–6 short, cautious bullet-style entries)
- dispensaryNotes: string (1–2 paragraphs max)
- growerNotes: string (0.5–1 paragraph; if data is weak, say that)
- confidenceNote: string (short explanation of how confident you are and why)
`.trim();

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.4,
      max_tokens: 600,
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

    return {
      userFacingSummary: parsed.userFacingSummary || '',
      effectsAndUseCases: Array.isArray(parsed.effectsAndUseCases) ? parsed.effectsAndUseCases : [],
      risksAndWarnings: Array.isArray(parsed.risksAndWarnings) ? parsed.risksAndWarnings : [],
      dispensaryNotes: parsed.dispensaryNotes || '',
      growerNotes: parsed.growerNotes || '',
      confidenceNote: parsed.confidenceNote || '',
    };
  } catch (err) {
    console.error('[AI] Error generating AI summary:', err);
    return null;
  }
}
