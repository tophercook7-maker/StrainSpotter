// backend/services/matchUtils.js

/**
 * Normalize match confidence to 0-1 scale
 * Handles both confidence (0-1) and score (0-200) formats
 */
export function normalizeMatchConfidence(match) {
  if (!match) return null;
  if (typeof match.confidence === 'number') {
    const c = match.confidence;
    if (c <= 0) return 0;
    if (c >= 1) return 1;
    return c;
  }
  if (typeof match.score === 'number') {
    // Score is 0–200 per docs; map to 0–1.
    const score = Math.max(0, Math.min(200, match.score));
    return score / 200;
  }
  return null;
}

/**
 * Classify match quality based on normalized confidence
 */
export function classifyMatchQuality(normalized) {
  const c = normalized ?? 0;
  if (c >= 0.9) return 'high';
  if (c >= 0.7) return 'medium';
  if (c > 0) return 'low';
  return 'none';
}

