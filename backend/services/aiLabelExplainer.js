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
 * Generate an AI-powered summary of a cannabis product label
 * @param {Object} params
 * @param {Object} params.labelInsights - Extracted label insights (strainName, THC%, terpenes, etc.)
 * @param {string} params.rawText - Raw OCR text from the label
 * @param {Object} params.topMatch - Top database strain match (if any)
 * @param {Array} params.otherMatches - Other database strain matches (names + confidence)
 * @returns {Object|null} AI summary object or null if unavailable
 */
export async function generateLabelAISummary({ labelInsights, rawText, topMatch, otherMatches }) {
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

  try {
    const client = new OpenAI({ apiKey });

    // Build context for the AI
    const context = {
      labelInsights: {
        strainName: labelInsights?.strainName || null,
        brand: labelInsights?.brand || null,
        productType: labelInsights?.productType || null,
        category: labelInsights?.category || null,
        thcPercent: labelInsights?.thcPercent || null,
        cbdPercent: labelInsights?.cbdPercent || null,
        totalCannabinoidsPercent: labelInsights?.totalCannabinoidsPercent || null,
        thcMg: labelInsights?.thcMg || null,
        cbdMg: labelInsights?.cbdMg || null,
        terpenes: labelInsights?.terpenes || [],
        terpenePercentTotal: labelInsights?.terpenePercentTotal || null,
        netWeightValue: labelInsights?.netWeightValue || null,
        netWeightUnit: labelInsights?.netWeightUnit || null,
        batchId: labelInsights?.batchId || null,
        licenseNumber: labelInsights?.licenseNumber || null,
        labName: labelInsights?.labName || null,
        jurisdiction: labelInsights?.jurisdiction || null,
        warnings: labelInsights?.warnings || [],
        ageRestricted: labelInsights?.ageRestricted || false,
        medicalUseOnly: labelInsights?.medicalUseOnly || false,
        marketingTags: labelInsights?.marketingTags || [],
      },
      rawText: rawText || '',
      databaseMatches: {
        topMatch: topMatch ? {
          name: topMatch.name || topMatch.strain?.name || 'Unknown',
          confidence: topMatch.confidence || topMatch.score || null,
          type: topMatch.type || topMatch.strain?.type || null,
        } : null,
        otherMatches: (otherMatches || []).slice(0, 3).map(m => ({
          name: m.name || m.strain?.name || 'Unknown',
          confidence: m.confidence || m.score || null,
        })),
      },
    };

    const systemMessage = `You are an expert cannabis label interpreter. Your job is to analyze cannabis product labels and provide clear, helpful explanations for consumers.

Analyze the provided label data and return ONLY valid JSON (no markdown, no code blocks, no explanations outside the JSON). The JSON should have these fields:

{
  "title": "Short, human-friendly product name (e.g., 'Glitter Bomb Vape Cartridge' or 'Blue Dream Flower')",
  "summary": "1-2 paragraphs explaining what this product is, who it may be good for, and how it differs from typical products.",
  "potencyAnalysis": "Explanation of THC/CBD levels and how strong this product is for a typical user. Mention if it's high-THC, balanced, CBD-dominant, etc.",
  "terpeneAnalysis": "Discussion of dominant terpenes and likely flavor/aroma/effects. Explain what these terpenes typically contribute.",
  "usageNotes": "Friendly notes about onset time, duration, tolerance considerations, and recommended situations for use.",
  "warnings": "Any health or legal caveats inferred from the label warnings. Be concise but clear.",
  "brandStory": "What can be inferred about the brand/company from the label (if anything notable).",
  "jurisdictionNotes": "Notes about the likely state/market based on label language and compliance fields.",
  "dbConsistency": "Comment on how well this product lines up with the database strain match(es), or note if there's a mismatch."
}

If a field cannot be determined from the label, use null for that field. Keep all text concise and consumer-friendly.`;

    const userMessage = `Analyze this cannabis product label:

Label Insights:
${JSON.stringify(context.labelInsights, null, 2)}

Raw OCR Text:
${context.rawText.substring(0, 2000)}${context.rawText.length > 2000 ? '...' : ''}

Database Matches:
${JSON.stringify(context.databaseMatches, null, 2)}

Return your analysis as JSON only.`;

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.warn('[AI] Empty response from OpenAI');
      return null;
    }

    // Parse JSON response
    try {
      const aiSummary = JSON.parse(content);
      console.log('[AI] Successfully generated label summary');
      return aiSummary;
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

