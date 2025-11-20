import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
  Button,
} from "@mui/material";
import {
  cleanCandidateName,
  getStrainIdentityFromResult,
  extractLabelNameFromRawText,
} from "../utils/scanResultUtils";

// Label name extraction is now handled by extractLabelNameFromRawText from utils

// ---------- helpers ----------

// Banned fragments list (shared between helpers)
const BANNED_FRAGMENTS = [
  'FULL SPECTRUM',
  'FULL-SPEC',
  'FULL SPEC',
  'RM. OUR',
  'RM OUR',
  'OUR FULL',
  'SET THE',
  'NOT APPROVED',
  'IS NOT APPROVED',
  'MARIJUANA IS FOR USE BY',
  'ACTIVATION TIME',
  'TOTALS',
  'NOT APPROVED BY',
  'APPROVED BY',
  'USE BY',
  'PATIENTS ONLY',
  'MARIJUANA',
  'KEEP OUT OF REACH',
  'WARNING',
  'NA IS',
  'DO NOT',
  'POTENTIAL HARMS',
  'VEHICLE OR MACHINERY',
  'PERMIT',
  'BATCH',
  'COA',
  'EXP. DATE'
];

// Note: cleanCandidateName is now imported from utils/scanResultUtils

function isProbablyGoodLabelName(name) {
  if (!name) return false;
  const trimmed = name.trim();

  // Too short - require at least 4 chars and 2 meaningful words
  if (trimmed.length < 4) return false;

  // Reject if it includes obvious warning/compliance phrases (matching backend banned fragments)
  const upper = trimmed.toUpperCase();
  if (BANNED_FRAGMENTS.some(p => upper.includes(p))) {
    return false;
  }

  // Split into words and require at least 2 meaningful words
  const words = trimmed.split(/\s+/).filter(w => w.length > 0);
  if (words.length < 2) return false; // Must have at least 2 words
  
  const generic = new Set([
    'THE', 'OUR', 'YOUR', 'OF', 'AND', 'FOR', 'SET', 'THIS',
    'FULL', 'SPECTRUM', 'CANNABIS', 'VAPE', 'CARTRIDGE',
    'SAUCE', 'CART', 'GRAM', 'ONE', 'PREMIUM'
  ]);
  const meaningful = words.filter(w => !generic.has(w.toUpperCase()));
  if (meaningful.length < 2) return false; // Must have at least 2 meaningful words

  return true;
}

function normalizeConfidence(conf) {
  if (conf == null || Number.isNaN(conf)) return null;
  const n = Math.max(0, Math.min(100, Math.round(conf)));
  return `${n}% match`;
}

function formatWeight(label) {
  if (!label) return null;
  const { netWeightValue, netWeightUnit } = label;
  if (!netWeightValue || !netWeightUnit) return null;
  return `${netWeightValue} ${netWeightUnit}`;
}

function formatPotency(label) {
  if (!label) return null;
  const { thcPercent, cbdPercent } = label;
  const parts = [];
  if (typeof thcPercent === "number") parts.push(`THC ${thcPercent}%`);
  if (typeof cbdPercent === "number") parts.push(`CBD ${cbdPercent}%`);
  if (!parts.length) return null;
  return parts.join(" • ");
}

function asArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  // If it's a string, wrap once
  if (typeof value === "string") return [value];
  return [];
}

// ---------- reusable components ----------

const SectionCard = ({ title, children }) => (
  <Card
    elevation={6}
    sx={{
      mb: 2.5,
      background:
        "linear-gradient(135deg, rgba(0,0,0,0.52), rgba(0,0,0,0.72))",
      borderRadius: 3,
      border: "1px solid rgba(255,255,255,0.08)",
      backdropFilter: "blur(14px)",
    }}
  >
    <CardContent sx={{ p: 2.5 }}>
      {title && (
        <Typography
          variant="overline"
          sx={{ color: "rgba(255,255,255,0.6)", letterSpacing: 1.3 }}
        >
          {title}
        </Typography>
      )}
      {children}
    </CardContent>
  </Card>
);

// ---------- AI decoded label component ----------

// Helper to render text that may contain bullets as a list
function renderTextWithBullets(text) {
  if (!text || typeof text !== 'string') return null;
  
  // Check if text contains bullet markers
  const hasBullets = /^[\s]*[•\-\*]\s+/m.test(text) || text.includes('\n•') || text.includes('\n-') || text.includes('\n*');
  
  if (hasBullets) {
    // Split by bullet markers and render as list
    const items = text
      .split(/[\n\r]+/)
      .map(line => line.trim())
      .filter(line => {
        // Extract bullet items (lines starting with •, -, or *)
        return /^[•\-\*]\s+/.test(line) || (line.length > 0 && !/^[A-Z][^:]*:/.test(line));
      })
      .map(line => line.replace(/^[•\-\*]\s+/, '').trim())
      .filter(line => line.length > 0);
    
    if (items.length > 0) {
      return (
        <Box component="ul" sx={{ m: 0, pl: 2.5, listStyle: 'none' }}>
          {items.map((item, idx) => (
            <Box
              key={idx}
              component="li"
              sx={{
                position: 'relative',
                pl: 1.5,
                mb: 0.5,
                '&::before': {
                  content: '"•"',
                  position: 'absolute',
                  left: 0,
                  color: 'rgba(255,255,255,0.7)',
                },
              }}
            >
              <Typography variant="body2" component="span">
                {item}
              </Typography>
            </Box>
          ))}
        </Box>
      );
    }
  }
  
  // No bullets - render as paragraph
  return <Typography variant="body2">{text}</Typography>;
}

const AIDecodedLabelSection = ({ isPackagedProduct, aiSummary }) => {
  const [showRetailerInfo, setShowRetailerInfo] = useState(false);

  if (!isPackagedProduct || !aiSummary) return null;

  const {
    title: aiTitle,
    summary,
    potencyAnalysis,
    terpeneAnalysis,
    usageNotes,
    warnings,
    brandStory,
    jurisdictionNotes,
    dbConsistency,
  } = aiSummary || {};

  // Normalize warnings into an array so we never crash if it's null or a string
  let aiWarnings = [];
  if (Array.isArray(warnings)) {
    aiWarnings = warnings;
  } else if (typeof warnings === "string" && warnings.trim().length > 0) {
    aiWarnings = [warnings.trim()];
  }

  // Retailer / dispensary oriented blocks
  const retailerBlocks = [
    brandStory && {
      label: "Brand / maker notes",
      text: brandStory,
    },
    jurisdictionNotes && {
      label: "Compliance & jurisdiction",
      text: jurisdictionNotes,
    },
    dbConsistency && {
      label: "Database consistency",
      text: dbConsistency,
    },
  ].filter(Boolean);

  return (
    <SectionCard title="AI decoded label">
      <Box>
        {/* Optional AI-picked title */}
        {aiTitle && (
          <>
            <Typography
              variant="subtitle2"
              sx={{
                opacity: 0.8,
                mb: 0.5,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              Suggested product name
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}>
              {aiTitle}
            </Typography>
          </>
        )}

        {/* Consumer-facing sections */}
        {summary && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
              Overview
            </Typography>
            {renderTextWithBullets(summary)}
          </Box>
        )}

        {potencyAnalysis && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
              Potency analysis
            </Typography>
            {renderTextWithBullets(potencyAnalysis)}
          </Box>
        )}

        {terpeneAnalysis && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
              Terpene analysis
            </Typography>
            {renderTextWithBullets(terpeneAnalysis)}
          </Box>
        )}

        {usageNotes && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
              Usage notes
            </Typography>
            {renderTextWithBullets(usageNotes)}
          </Box>
        )}

        {aiWarnings.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
              AI safety notes
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {aiWarnings.map((w, idx) => (
                <Chip
                  key={idx}
                  size="small"
                  variant="outlined"
                  color="warning"
                  label={w}
                  sx={{ mb: 1 }}
                />
              ))}
            </Stack>
          </Box>
        )}

        {/* Retailer info – only when user taps */}
        {retailerBlocks.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Button
              size="small"
              variant={showRetailerInfo ? "contained" : "outlined"}
              color="secondary"
              onClick={() => setShowRetailerInfo((prev) => !prev)}
            >
              {showRetailerInfo
                ? "Hide info for dispensaries"
                : "For dispensaries & budtenders"}
            </Button>

            {showRetailerInfo && (
              <Box sx={{ mt: 2 }}>
                {retailerBlocks.map((block, idx) => (
                  <Box key={idx} sx={{ mb: 1.5 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 600,
                        mb: 0.5,
                        fontSize: "0.85rem",
                      }}
                    >
                      {block.label}
                    </Typography>
                    {renderTextWithBullets(block.text)}
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )}
      </Box>
    </SectionCard>
  );
};

// ---------- main component ----------

// Pick the best label name using raw label text (OCR) and DB matches
function pickBestLabelNameFromTextAndMatches(rawText, matches) {
  if (!rawText) return null;

  const textLower = rawText.toLowerCase();
  const dbMatches = Array.isArray(matches) ? matches : [];
  const dbNames = dbMatches
    .map((m) => m && m.name)
    .filter(Boolean);

  // 1) If a DB match name appears in the raw label text, prefer that.
  for (const name of dbNames) {
    const cleaned = cleanCandidateName(name);
    if (!cleaned) continue;
    if (textLower.includes(cleaned.toLowerCase())) {
      return cleaned;
    }
  }

  // 2) Otherwise, scan individual lines for good strain-like names.
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length >= 3 && l.length <= 40);

  const STRAIN_HINTS = [
    ' og',
    ' kush',
    ' runtz',
    ' glue',
    ' cookies',
    ' haze',
    ' diesel',
    ' gelato',
    ' punch',
    ' pie',
  ];

  let best = null;
  let bestScore = 0;

  for (const line of lines) {
    const cleanedLine = cleanCandidateName(line);
    if (!cleanedLine) continue;
    const lower = cleanedLine.toLowerCase();

    let score = 0;

    // Prefer lines with typical strain words.
    for (const hint of STRAIN_HINTS) {
      if (lower.includes(hint)) score += 2;
    }

    // Prefer lines that overlap with any DB names.
    for (const name of dbNames) {
      if (!name) continue;
      const nameLower = name.toLowerCase();
      if (lower.includes(nameLower) || nameLower.includes(lower)) {
        score += 3;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      best = cleanedLine;
    }
  }

  return best;
}

function StrainActionsRow({ strainSlug, strainName }) {
  if (!strainSlug || !strainName) return null;

  const basePath = `/strains/${strainSlug}`;

  return (
    <Stack
      direction="row"
      spacing={1.5}
      sx={{ mt: 2, flexWrap: 'wrap' }}
    >
      <Button
        size="small"
        variant="outlined"
        component="a"
        href={`${basePath}/seeds`}
      >
        Find seeds for {strainName}
      </Button>
      <Button
        size="small"
        variant="outlined"
        component="a"
        href={`${basePath}/dispensaries`}
      >
        Find a dispensary
      </Button>
      <Button
        size="small"
        variant="outlined"
        component="a"
        href={`${basePath}/reviews`}
      >
        Read / leave reviews
      </Button>
    </Stack>
  );
}

export default function ScanResultCard({ result }) {
  if (!result) return null;

  const {
    imageUrl,
    topMatch,
  } = result;

  // --- Primary / secondary name resolution ---

  const labelInsights = result?.labelInsights || {};
  const rawText = labelInsights.rawText || "";

  // Explicitly define aiSummary to prevent ReferenceError
  const aiSummary = result?.aiSummary || labelInsights.aiSummary || null;
  const aiTitleFromBackend = cleanCandidateName(aiSummary?.title || null);
  const hasAiSummary = !!(aiSummary && (aiSummary.title || aiSummary.summary));
  const aiOverview = aiSummary?.summary || null;

  // Compute labelFromRaw using the new helper
  const labelFromRaw = extractLabelNameFromRawText(rawText);
  
  const dbName =
    result?.matched_strain_name ||
    result?.topMatch?.name ||
    (result?.matches && result.matches[0]?.name) ||
    null;

  const isPackagedProduct =
    labelInsights.category === 'vape' ||
    labelInsights.category === 'edible' ||
    labelInsights.category === 'concentrate' ||
    labelInsights.isPackagedProduct === true;

  // Name resolution rules
  let primaryName = null;
  let secondaryDbName = null;

  if (isPackagedProduct) {
    primaryName =
      labelFromRaw ||
      aiTitleFromBackend ||
      labelInsights.strainName ||
      'Unknown product';

    if (dbName && dbName.toLowerCase() !== primaryName.toLowerCase()) {
      secondaryDbName = dbName;
    }
  } else {
    primaryName =
      dbName ||
      labelFromRaw ||
      labelInsights.strainName ||
      aiTitleFromBackend ||
      'Unknown strain';

    secondaryDbName = null;
  }

  const nameDisplay = primaryName;

  const dbConfidence =
    result?.topMatch?.confidence ??
    result?.matches?.[0]?.confidence ??
    result?.databaseMatchConfidence ??
    null;

  const isPackage = Boolean(isPackagedProduct);
  
  const dbConfidenceNormalized = normalizeConfidence(dbConfidence);
  const primaryMatch = result?.matches?.[0] || result?.topMatch || null;
  const dbType = primaryMatch?.type || primaryMatch?.strain_type || null;

  const weightText = formatWeight(labelInsights);
  const potencyText = formatPotency(labelInsights);
  const categoryDisplay = labelInsights.category || labelInsights.productType || null;

  const terpenes = Array.isArray(labelInsights.terpenes)
    ? labelInsights.terpenes
    : [];

  const terpeneChips = terpenes.slice(0, 6).map((t) => ({
    label:
      t.percent != null
        ? `${titleCase(t.name)} • ${t.percent}%`
        : titleCase(t.name),
  }));

  // ---------- small reusable bits ----------

  const TagRow = ({ children }) => (
    <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
      {children}
    </Stack>
  );

  // ---------- render ----------

  return (
    <Box sx={{ mt: 3, mb: 8 }}>
      {/* Header / title */}
      <SectionCard>
        <Box sx={{ mb: 1 }}>
          <Typography
            variant="h6"
            component="h2"
            sx={{ fontWeight: 700, mb: secondaryDbName ? 0.5 : 1 }}
          >
            {nameDisplay}
          </Typography>

          {secondaryDbName && (
            <Typography
              variant="body2"
              sx={{ color: 'success.main', mb: 1 }}
            >
              {`Database strain (best guess): ${secondaryDbName}${
                dbConfidence ? ` • ${dbConfidence}% match` : ''
              }`}
            </Typography>
          )}
        </Box>

        <Stack
          direction="row"
          spacing={1}
          sx={{ mt: 1.5, alignItems: "center", flexWrap: "wrap" }}
        >
          {isPackage && (
            <Chip
              label="Packaged product"
              size="small"
              color="success"
              variant="outlined"
              sx={{ ml: { xs: 0, sm: 1 }, mt: { xs: 1, sm: 0 } }}
            />
          )}
        </Stack>

        <TagRow>
          {categoryDisplay && (
            <Chip
              label={categoryDisplay}
              size="small"
              variant="outlined"
              sx={{ borderColor: "rgba(255,255,255,0.25)", color: "#fff" }}
            />
          )}
          {dbType && (
            <Chip
              label={dbType}
              size="small"
              variant="outlined"
              sx={{ borderColor: "rgba(255,255,255,0.25)", color: "#fff" }}
            />
          )}
          {dbConfidenceNormalized && (
            <Chip
              label={dbConfidenceNormalized}
              size="small"
              variant="filled"
              color="success"
            />
          )}
          {weightText && (
            <Chip
              label={weightText}
              size="small"
              variant="outlined"
              sx={{ borderColor: "rgba(255,255,255,0.25)", color: "#fff" }}
            />
          )}
        </TagRow>
      </SectionCard>

      {/* AI decoded label */}
      {hasAiSummary && (
        <Box sx={{ mt: 2 }}>
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 600, mb: 0.5 }}
          >
            AI decoded label
          </Typography>
          {aiTitleFromBackend && (
            <Typography
              variant="body2"
              sx={{ fontWeight: 500, mb: 0.25 }}
            >
              {aiTitleFromBackend}
            </Typography>
          )}
          {aiOverview && (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {aiOverview}
            </Typography>
          )}
        </Box>
      )}

      {/* Package lab details */}
      {isPackagedProduct && (
        <Box mt={3} mb={3}>
          <Typography
            variant="overline"
            color="text.secondary"
            gutterBottom
          >
            PACKAGE LAB DETAILS
          </Typography>

          {(labelInsights?.thc != null || labelInsights?.cbd != null) && (
            <Typography variant="body2">
              {labelInsights?.thc != null && (
                <>
                  <strong>THC:</strong> {labelInsights.thc}%{' '}
                </>
              )}
              {labelInsights?.cbd != null && (
                <>
                  <strong>CBD:</strong> {labelInsights.cbd}%{' '}
                </>
              )}
            </Typography>
          )}

          {Array.isArray(labelInsights?.terpenes) &&
            labelInsights.terpenes.length > 0 && (
              <Typography variant="body2">
                <strong>Terpenes:</strong>{' '}
                {labelInsights.terpenes
                  .slice(0, 3)
                  .map(t => (typeof t === 'string' ? t : t.name || t.key || ''))
                  .filter(Boolean)
                  .join(', ')}
              </Typography>
            )}

          {(labelInsights?.labName ||
            labelInsights?.batchId ||
            labelInsights?.testDate ||
            labelInsights?.expirationDate) && (
            <Typography variant="body2">
              {labelInsights?.labName && (
                <>
                  <strong>Testing lab:</strong> {labelInsights.labName}{' '}
                </>
              )}
              {labelInsights?.batchId && (
                <>
                  • <strong>Batch:</strong> {labelInsights.batchId}{' '}
                </>
              )}
              {labelInsights?.testDate && (
                <>
                  • <strong>Tested:</strong> {labelInsights.testDate}{' '}
                </>
              )}
              {labelInsights?.expirationDate && (
                <>
                  • <strong>Expires:</strong> {labelInsights.expirationDate}
                </>
              )}
            </Typography>
          )}
        </Box>
      )}

      {/* Potency / terpenes from label */}
      {(potencyText || terpeneChips.length > 0) && (
        <SectionCard title="LABEL POTENCY & TERPENES">
          {potencyText && (
            <Typography
              variant="body2"
              sx={{ color: "rgba(255,255,255,0.9)", mb: 1.5 }}
            >
              {potencyText}
            </Typography>
          )}
          {terpeneChips.length > 0 && (
            <TagRow>
              {terpeneChips.map((t, idx) => (
                <Chip
                  key={idx}
                  label={t.label}
                  size="small"
                  variant="outlined"
                  sx={{ borderColor: "rgba(255,255,255,0.25)", color: "#fff" }}
                />
              ))}
            </TagRow>
          )}
        </SectionCard>
      )}

      {/* Database strain profile */}
      {primaryMatch && (primaryMatch.description || matches.length > 1) && (
        <SectionCard title="DATABASE STRAIN PROFILE">
          {primaryMatch.description && (
            <Typography
              variant="body2"
              sx={{ color: "rgba(255,255,255,0.9)", mb: 1.5 }}
            >
              {primaryMatch.description}
            </Typography>
          )}

          {matches.length > 1 && (
            <>
              <Typography
                variant="subtitle2"
                sx={{ color: "rgba(255,255,255,0.9)", mb: 0.5 }}
              >
                Other close matches
              </Typography>
              <TagRow>
                {matches.slice(1, 6).map((m, idx) => (
                  <Chip
                    key={idx}
                    size="small"
                    variant="outlined"
                    sx={{
                      borderColor: "rgba(255,255,255,0.25)",
                      color: "#fff",
                    }}
                    label={
                      normalizeConfidence(m.confidence)
                        ? `${m.name} • ${normalizeConfidence(
                            m.confidence
                          )}`
                        : m.name
                    }
                  />
                ))}
              </TagRow>
            </>
          )}
        </SectionCard>
      )}

      {(() => {
        const { slug, name } = getStrainIdentityFromResult(result) || {};
        if (!slug) return null;
        return <StrainActionsRow strainSlug={slug} strainName={primaryName || name} />;
      })()}

      {/* Little spacer at bottom so it doesn't hit the FAB */}
      <Box sx={{ height: 40 }} />
    </Box>
  );
}
