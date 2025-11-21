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

/**
 * Build a comprehensive scan AI summary from OCR, vision labels, and match results.
 * This creates a rich summary object for display in the frontend.
 *
 * @param {Object} params
 * @param {string} params.ocr - Raw OCR text from Google Vision
 * @param {Array} params.visionLabels - Label annotations from Vision API
 * @param {Object} params.bestMatch - Best visual match result (from matchStrainByVisuals)
 * @param {Object} params.labelInsights - Extracted label insights (from extractLabelInsights)
 * @returns {Object} Rich summary object
 */
export function buildScanAISummary({ ocr, visionLabels, bestMatch, labelInsights }) {
  const ocrText = (ocr || '').toString().trim();
  const labels = Array.isArray(visionLabels) ? visionLabels : [];
  const match = bestMatch || null;
  const label = labelInsights || {};

  // Determine if this is a packaged product
  // Normal sensitivity: requires THC% OR CBD% AND brand name AND structured text
  const hasThcOrCbd = !!(label.thcPercent || label.cbdPercent || label.thcMg || label.cbdMg);
  const hasBrand = !!(label.brand || label.brandName);
  const hasStructuredText = ocrText.length > 50 && (
    ocrText.includes('THC') ||
    ocrText.includes('CBD') ||
    ocrText.includes('Batch') ||
    ocrText.includes('Lot') ||
    ocrText.includes('Tested') ||
    ocrText.includes('Manufactured')
  );

  const isPackagedProduct = hasThcOrCbd && hasBrand && hasStructuredText;

  // Determine match confidence (0-1)
  let matchConfidence = 0;
  let matchedStrainName = null;

  if (match) {
    matchConfidence = typeof match.confidence === 'number' 
      ? Math.min(1, Math.max(0, match.confidence))
      : (match.score ? Math.min(1, Math.max(0, match.score / 100)) : 0);
    
    matchedStrainName = match.strain?.name || 
                       match.strain?.strain_name || 
                       match.name || 
                       null;
  }

  // Determine estimate type
  let estimateType = 'visual-only';
  if (label.strainName || label.productName || hasThcOrCbd) {
    if (match && matchConfidence > 0.3) {
      estimateType = 'visual+label';
    } else {
      estimateType = 'label-only';
    }
  }

  // Determine confidence label
  let estimateConfidenceLabel = 'Unknown';
  if (matchConfidence >= 0.85) {
    estimateConfidenceLabel = 'Very strong match';
  } else if (matchConfidence >= 0.65) {
    estimateConfidenceLabel = 'Strong match';
  } else if (matchConfidence >= 0.45) {
    estimateConfidenceLabel = 'Moderate match';
  } else if (matchConfidence >= 0.25) {
    estimateConfidenceLabel = 'Low confidence';
  } else {
    estimateConfidenceLabel = 'Unknown';
  }

  // Build notes
  const notesParts = [];
  if (estimateType === 'visual+label') {
    notesParts.push('Match combines visual characteristics with label text analysis.');
  } else if (estimateType === 'label-only') {
    notesParts.push('Match based on label text analysis only.');
  } else {
    notesParts.push('Match based on visual characteristics only.');
  }
  
  if (matchConfidence < 0.5) {
    notesParts.push('Confidence is low; verify with additional sources.');
  }

  const notes = notesParts.join(' ');

  // Extract label fields
  const labelData = {
    productName: label.strainName || label.productName || null,
    brandName: label.brand || label.brandName || null,
    packageType: label.productType || label.category || null,
    packageSize: label.netWeightValue && label.netWeightUnit
      ? `${label.netWeightValue} ${label.netWeightUnit}`
      : null,
    thcPercent: label.thcPercent || null,
    cbdPercent: label.cbdPercent || null,
    thcaPercent: label.cannabinoids?.find(c => c.name === 'THCA')?.percent || null,
    batchId: label.batchId || null,
    lotNumber: label.batchId || null, // Often same as batchId
    harvestDate: null, // Not typically on labels
    testDate: label.testDate || null,
    labName: label.labName || null,
    licenseNumber: label.licenseNumber || null,
    originType: label.category || label.productType || null,
  };

  return {
    isPackagedProduct,
    matchConfidence,
    matchedStrainName,
    estimateConfidenceLabel,
    estimateType,
    notes,
    label: labelData,
  };
}
