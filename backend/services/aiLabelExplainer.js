// backend/services/aiLabelExplainer.js
// AI-powered label decoder using OpenAI

let OpenAI;
let openaiLoaded = false;

async function loadOpenAI() {
  if (openaiLoaded) return;
  try {
    const openaiModule = await import('openai');
    OpenAI = openaiModule.default;
    openaiLoaded = true;
  } catch (e) {
    console.warn('[AI] OpenAI package not found. Install with: npm install openai');
    openaiLoaded = true; // Mark as loaded to avoid repeated attempts
  }
}

/**
 * Generate an AI-powered structured analysis of a cannabis product label
 * @param {Object} params
 * @param {string} params.rawText - Raw OCR text from the label (REQUIRED)
 * @param {string} params.dbTopMatchName - Top database strain match name (optional)
 * @param {number} params.dbTopMatchConfidence - Top database match confidence 0-100 (optional)
 * @param {string} params.detectedCategory - Detected product category (e.g. "vape", "flower", "edible", "unknown")
 * @param {string} params.extraHints - Any additional hints from backend (optional)
 * @returns {Object|null} Structured label data object or null if unavailable
 */
export async function generateLabelAISummary({ 
  rawText,
  dbTopMatchName = null,
  dbTopMatchConfidence = null,
  detectedCategory = null,
  extraHints = null
}) {
  await loadOpenAI();
  
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.warn('[AI] OPENAI_API_KEY not configured. Skipping AI label summary.');
    return null;
  }

  if (!OpenAI) {
    console.warn('[AI] OpenAI client not available. Skipping AI label summary.');
    return null;
  }

  if (!rawText || typeof rawText !== 'string') {
    console.warn('[AI] rawText is required for AI label analysis.');
    return null;
  }

  try {
    const client = new OpenAI({ apiKey });

    const systemMessage = `You are an assistant that analyzes cannabis product LABELS from photos.

You ONLY know what appears in the label text and what the backend passes you.
You do NOT know anything about the world beyond that, and you MUST NOT hallucinate:

- If you don't see a value on the label, return null for that field.
- If you're not sure about something, leave it null or use a conservative guess only if it is clearly implied by the label itself.
- Never invent strain effects, flavors, or brand stories that are not supported directly by the label.

Your job:

1. Parse the label text (rawText) to extract structured data about:
   - Brand / producer
   - Product or strain name (what the consumer would call this product)
   - Product type (vape, flower, edible, preroll, concentrate, etc.)
   - THC and CBD values (prefer percentages, but milligrams if that's all there is)
   - Terpenes (names only, no effects)
   - Testing lab and batch identifiers
   - Important dates (manufactured, packaged, tested, expiration)
   - Any regulatory warnings or usage warnings that appear on the label.

2. Return a JSON object EXACTLY matching the schema given below.

3. Also generate a friendly natural-language explanation ("label_explanation") of what the label says.
   - Talk ONLY about things clearly supported by the label.
   - Explain what the THC/CBD numbers mean (e.g., "high THC", "low CBD") but don't promise medical outcomes.
   - Make it sound like a budtender or app explaining the label to the user.
   - Keep it 1–3 short paragraphs.

You must ALWAYS return valid JSON that matches the schema, with no additional keys and no extra commentary.

If something truly is not on the label, set that field to null or an empty array as appropriate.

Brand vs strain rules:

- "brand" is the company that made the product (e.g. "Dark Horse", "Trail Blazer").
- "product_name" is the product or strain name printed on the package that a consumer would recognize (e.g. "Glitter Bomb", "Scott's OG").
- If the label contains BOTH a house brand and a strain (for example: a banner with "DARK HORSE" and somewhere else "Glitter Bomb" or "Scott's OG"):
  - brand   → "Dark Horse"
  - product_name → "Glitter Bomb" (or whatever the strain/product name is)
- Do NOT treat a brand name as the strain name unless the label explicitly indicates that is the strain.

Database information:

- You may be passed a "dbTopMatchName" and "dbTopMatchConfidence" from a visual database match.
- This is ONLY a hint about genetic similarity; it is NOT necessarily the same as the label's product name.
- NEVER overwrite the label's product_name with the DB match.
- If you use the DB info at all, include it ONLY in "closest_db_match_name" and "closest_db_match_confidence".

Again: DO NOT hallucinate. If a field is unknown, leave it null.`;

    const userMessage = `You are given OCR text from a cannabis product label, and some optional helper metadata.

RAW LABEL TEXT (ocr):
"""
${rawText}
"""

OPTIONAL HELPER FIELDS (may be null or missing):
- dbTopMatchName: ${dbTopMatchName || 'null'}
- dbTopMatchConfidence: ${dbTopMatchConfidence || 'null'}
- detectedCategory: ${detectedCategory || 'null'}
- extraHints: ${extraHints || 'null'}

Using ONLY the information above, extract structured data about this product and return JSON that matches the following schema exactly:

{
  "brand": string | null,
  "product_name": string | null,
  "product_type": string | null,
  "thc_percent": number | null,
  "cbd_percent": number | null,
  "thc_mg": number | null,
  "cbd_mg": number | null,
  "net_weight_value": number | null,
  "net_weight_unit": string | null,
  "terpenes": [
    {
      "name": string,
      "approx_percent": number | null
    }
  ],
  "testing_lab_name": string | null,
  "batch_id": string | null,
  "manufacture_date": string | null,
  "packaged_date": string | null,
  "test_date": string | null,
  "expiration_date": string | null,
  "jurisdiction_or_license": string | null,
  "warnings": [string],
  "age_restricted": boolean | null,
  "medical_use_only": boolean | null,
  "closest_db_match_name": string | null,
  "closest_db_match_confidence": number | null,
  "label_explanation": string
}

Now, based on the given label text and helper fields, return ONLY a JSON object that matches this schema. Do not add extra keys and do not wrap it in markdown or prose. If a field is unknown, set it to null or an empty array.`;

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.5,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.warn('[AI] Empty response from OpenAI');
      return null;
    }

    // Parse JSON response
    try {
      const parsed = JSON.parse(content);
      
      // Ensure warnings is always an array
      if (!Array.isArray(parsed.warnings)) {
        if (typeof parsed.warnings === 'string' && parsed.warnings.trim()) {
          parsed.warnings = parsed.warnings
            .split(/[.;]\s+/)
            .map(s => s.trim())
            .filter(s => s.length > 0);
        } else {
          parsed.warnings = [];
        }
      }
      
      // Ensure terpenes is always an array
      if (!Array.isArray(parsed.terpenes)) {
        parsed.terpenes = [];
      }
      
      // Validate and normalize the response
      const result = {
        brand: parsed.brand || null,
        product_name: parsed.product_name || null,
        product_type: parsed.product_type || null,
        thc_percent: typeof parsed.thc_percent === 'number' ? parsed.thc_percent : null,
        cbd_percent: typeof parsed.cbd_percent === 'number' ? parsed.cbd_percent : null,
        thc_mg: typeof parsed.thc_mg === 'number' ? parsed.thc_mg : null,
        cbd_mg: typeof parsed.cbd_mg === 'number' ? parsed.cbd_mg : null,
        net_weight_value: typeof parsed.net_weight_value === 'number' ? parsed.net_weight_value : null,
        net_weight_unit: parsed.net_weight_unit || null,
        terpenes: parsed.terpenes || [],
        testing_lab_name: parsed.testing_lab_name || null,
        batch_id: parsed.batch_id || null,
        manufacture_date: parsed.manufacture_date || null,
        packaged_date: parsed.packaged_date || null,
        test_date: parsed.test_date || null,
        expiration_date: parsed.expiration_date || null,
        jurisdiction_or_license: parsed.jurisdiction_or_license || null,
        warnings: parsed.warnings || [],
        age_restricted: typeof parsed.age_restricted === 'boolean' ? parsed.age_restricted : null,
        medical_use_only: typeof parsed.medical_use_only === 'boolean' ? parsed.medical_use_only : null,
        closest_db_match_name: parsed.closest_db_match_name || null,
        closest_db_match_confidence: typeof parsed.closest_db_match_confidence === 'number' ? parsed.closest_db_match_confidence : null,
        label_explanation: parsed.label_explanation || ''
      };
      
      console.log('[AI] Successfully generated structured label analysis');
      return result;
    } catch (parseError) {
      console.error('[AI] Failed to parse JSON response:', parseError);
      console.error('[AI] Raw response:', content);
      return null;
    }
  } catch (error) {
    console.error('[AI] Failed to generate label summary:', error.message);
    // Don't throw - just return null so scan process continues
    return null;
  }
}

