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
 * @param {Array} params.labelCandidates - Candidate names extracted from OCR text
 * @param {Array} params.dbCandidates - Candidate names from database matches
 * @returns {Object|null} AI summary object or null if unavailable
 */
export async function generateLabelAISummary({ 
  labelInsights, 
  rawText, 
  topMatch, 
  otherMatches, 
  labelCandidates = [], 
  dbCandidates = [], 
  labelStrainName = null,
  isPackagedProduct = false 
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

    const systemMessage = `You are an expert cannabis label interpreter. Your job is to analyze cannabis product labels and provide clear, SHORT, helpful explanations for consumers.

CRITICAL CONSTRAINTS:
- IF this is a packaged product AND labelStrainName is provided, you MUST use labelStrainName as the title. NEVER invent a different title. NEVER use marketing text like 'Set The', 'Experience', 'Full Spectrum', 'Ocked', 'Rich Te'.
- summary/overview: At most 2 short sentences (~40-60 words max).
- potencyAnalysis, terpeneAnalysis, usageNotes, dbConsistency: Either 1-2 short sentences OR 2-3 bullet points using "• " prefix.
- brandStory, jurisdictionNotes: 1-2 sentences max when they exist.
- Keep language simple and direct, not fluffy or verbose. Prefer concise language that's easy to skim on a phone.
- warnings must ALWAYS be an array of short strings like ["High THC – start slow", "Not for inexperienced users"]. If there are no warnings, return an empty array []. Never return a long paragraph or null for warnings.

TITLE RULES:
- There is a field called labelStrainName (in labelInsights) which comes from matching the database strain list to the actual text on the label.
- When choosing the title in the JSON, you MUST prefer labelStrainName if it is provided and looks like a valid strain or product name.
- You must NEVER use marketing or tagline text like "Set The Experience", "Full Spectrum", "Total", or generic phrases like "Vape Cartridge" as the title.
- Valid titles usually look like "Scott's OG", "Trail Blazer", "Commerce City Kush", or "Goji Runtz 1000mg Live Resin". They correspond to a strain or product name, not usage instructions or marketing slogans.
- The title MUST be built from ONE of the candidate names provided (prefer labelStrainName if available), optionally plus a short descriptor like "Vape Cartridge", "Sauce Cartridge", "Live Resin", "Flower", "Pre-Roll".
- Never invent a name that is not based on a candidate.
- 2-4 words max.
- Title-case the result.
- FORBIDDEN fragments (never use these in title): "Not Approved", "Approved By", "Set The", "Set The Experience", "Set The Vape", "Set The Vape Cartridge", "Use By", "Patients Only", "Marijuana", "Keep Out Of Reach", "Warning", "Not Approved By", "Na Is", "Rm Our", "Full Spectrum", "Total".

Return ONLY valid JSON (no markdown, no code blocks, no explanations outside the JSON). The JSON should have these fields:

{
  "title": "Short product/strain name (2-4 words, from candidates, optionally + descriptor)",
  "summary": "1-2 sentences (~40-60 words max) explaining what this product is and who it may be good for.",
  "potencyAnalysis": "1-2 sentences OR 2-3 bullet points (• prefix) about THC/CBD levels and strength.",
  "terpeneAnalysis": "1-2 sentences OR 2-3 bullet points (• prefix) about dominant terpenes and likely effects.",
  "usageNotes": "1-2 sentences OR 2-3 bullet points (• prefix) about onset, duration, and recommended use.",
  "warnings": ["Array", "of", "short", "warning", "strings"] or [] if none,
  "brandStory": "A SHORT BUT DENSE description of the maker and how this product fits their lineup. Write 2–3 sentences max. Focus on what a BUDTENDER or DISPENSARY BUYER actually cares about: Who makes it (brand or producer), and what they're generally known for (e.g. small-batch, value brand, solventless, big multi-state operator). How this SKU is positioned: budget / mid / premium, connoisseur vs casual, \"everyday cart\" vs \"special treat\", etc. If the label text doesn't clearly say the brand, infer something reasonable from the text (e.g. TRAIL BLAZER may be the house brand) but do NOT invent wild details. If you are unsure, say that the brand isn't obvious from the package. Otherwise null.",
  "jurisdictionNotes": "VERY PRACTICAL notes for staff on COMPLIANCE and STATE-SPECIFIC quirks. Format: Prefer 1–3 BULLET POINTS starting with \"•\". Mention things like: THC caps, purchase limits, required warnings, \"not FDA approved\" style language, age restrictions, testing / COA requirements, or anything on the label that matters for how staff can sell or talk about it. If the label does not include any meaningful compliance info beyond boilerplate, say that briefly instead of making things up. Otherwise null.",
  "dbConsistency": "A SHORT, STAFF-FOCUSED note about how well this physical package matches the StrainSpotter database entry. This is primarily for DISPENSARIES and TENDERS, not consumers. Format: 1–2 short bullets OR 1–2 short sentences. Comment on name alignment (does the strain/product name on the package match the DB match or is it a close cousin?), THC range (is the THC % in the same ballpark as typical lab results for this strain or brand?), and terpene / effect alignment if known. If confidence is high, say something like \"High confidence: package and DB agree on strain and potency range.\" If confidence is lower, say something like \"Moderate confidence: label and DB differ slightly; treat effects as approximate.\" Otherwise null."
}

If a field cannot be determined from the label, use null for that field (except warnings, which must always be an array).`;

    // Combine all candidates
    const allCandidates = [...labelCandidates, ...dbCandidates].filter(Boolean);
    
    const userMessage = `Analyze this cannabis product label:

Label Insights:
${JSON.stringify(context.labelInsights, null, 2)}

Raw OCR Text:
${context.rawText.substring(0, 2000)}${context.rawText.length > 2000 ? '...' : ''}

Database Matches:
${JSON.stringify(context.databaseMatches, null, 2)}

CANDIDATE NAMES (choose title from these):
${JSON.stringify(allCandidates, null, 2)}

IMPORTANT: The title MUST be built from one of the candidate names above. Never use fragments like "Set The", "Not Approved", "Na Is", etc.

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
      const parsed = JSON.parse(content);
      
      let title = parsed.title || null;
      
      if (isPackagedProduct && labelStrainName) {
        console.log("[AI] Packaged product: forcing title =", labelStrainName);
        title = labelStrainName;
      }
      
      // Post-process: ensure warnings is always an array
      if (!Array.isArray(parsed.warnings)) {
        if (typeof parsed.warnings === 'string' && parsed.warnings.trim()) {
          // If it's a string, split into array (by sentences or commas)
          parsed.warnings = parsed.warnings
            .split(/[.;]\s+/)
            .map(s => s.trim())
            .filter(s => s.length > 0);
        } else {
          // If null/undefined/empty, set to empty array
          parsed.warnings = [];
        }
      }
      
      // Ensure title is set (already handled by forced override above for packaged products)
      parsed.title = title;
      
      // Post-process: trim retail-facing fields if too long
      if (parsed.brandStory && typeof parsed.brandStory === 'string') {
        const words = parsed.brandStory.split(/\s+/);
        if (words.length > 90) {
          parsed.brandStory = words.slice(0, 90).join(' ') + '...';
        }
      }
      
      if (parsed.jurisdictionNotes && typeof parsed.jurisdictionNotes === 'string') {
        const words = parsed.jurisdictionNotes.split(/\s+/);
        if (words.length > 60) {
          parsed.jurisdictionNotes = words.slice(0, 60).join(' ') + '...';
        }
      }
      
      if (parsed.dbConsistency && typeof parsed.dbConsistency === 'string') {
        const words = parsed.dbConsistency.split(/\s+/);
        // Check if it's bullet points or sentences
        const bullets = parsed.dbConsistency.split(/[•\n]/).filter(s => s.trim().length > 0);
        if (bullets.length > 2) {
          // Keep first 2 bullets
          parsed.dbConsistency = bullets.slice(0, 2).map(b => '• ' + b.trim()).join('\n');
        } else if (words.length > 60) {
          // Trim to first 60 words if it's a long paragraph
          parsed.dbConsistency = words.slice(0, 60).join(' ') + '...';
        }
      }
      
      console.log('[AI] Successfully generated label summary');
      return {
        title: parsed.title,
        summary: parsed.summary,
        potencyAnalysis: parsed.potencyAnalysis,
        terpeneAnalysis: parsed.terpeneAnalysis,
        usageNotes: parsed.usageNotes,
        warnings: parsed.warnings,
        brandStory: parsed.brandStory,
        jurisdictionNotes: parsed.jurisdictionNotes,
        dbConsistency: parsed.dbConsistency
      };
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

