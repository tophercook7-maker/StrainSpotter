import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
  Button,
} from "@mui/material";
import {
  cleanCandidateName,
  getStrainIdentityFromResult,
} from "../utils/scanResultUtils";

// ---------- helpers ----------

// Small title-case helper used for terpene labels, etc.
function titleCase(str = "") {
  return str
    .toString()
    .split(" ")
    .map((w) =>
      w.length > 1 ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w.toUpperCase()
    )
    .join(" ");
}

// Extract product name from raw OCR text for packaged products
function extractProductNameFromRawText(rawText = "") {
  if (!rawText) return null;

  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const bannedFragments = [
    "net wt",
    "oz)",
    "mg",
    "%",
    "activation time",
    "approx",
    "test:",
    "tested by",
    "batch:",
    "manufactured by",
    "permit",
    "uin",
    "scan to learn",
    "suite",
    "tel:",
    "warning",
    "keep out of reach",
    "ingredients",
  ];

  const strainKeywords = [
    "og",
    "kush",
    "haze",
    "diesel",
    "cake",
    "cookies",
    "glue",
    "bomb",
    "runtz",
    "mints",
    "sherb",
    "skunk",
    "gelato",
    "berry",
    "punch",
    "lemon",
    "orange",
    "sour",
    "mac",
    "crème",
    "cream",
    "tangie",
  ];

  function isBanned(line) {
    const lower = line.toLowerCase();
    if (/\d/.test(lower)) {
      // allow things like "1G Vape Glitter Bomb"
      const onlyNumsOrUnits = /^[-\d\s()./%gmg]+$/i.test(lower);
      if (onlyNumsOrUnits) return true;
    }
    return bannedFragments.some((frag) => lower.includes(frag));
  }

  function scoreLine(line) {
    const lower = line.toLowerCase();
    let score = 0;
    const words = lower.split(/\s+/).filter(Boolean);

    if (words.length >= 2 && words.length <= 6) score += 1;
    if (!/^[A-Z0-9\s]+$/.test(line)) score += 1; // not all caps => more likely nice title

    for (const kw of strainKeywords) {
      if (lower.includes(kw)) score += 2;
    }

    if (lower.includes("vape") || lower.includes("cartridge") || lower.includes("cart")) {
      score += 2;
    }

    return score;
  }

  let best = null;
  let bestScore = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    if (isBanned(line)) continue;
    if (line.length < 3 || line.length > 60) continue;

    const score = scoreLine(line);
    if (score > bestScore) {
      best = line;
      bestScore = score;
    }
  }

  if (!best) return null;

  return best
    .split(" ")
    .map((w) =>
      w.length > 1 ? w[0].toUpperCase() + w.slice(1) : w.toUpperCase()
    )
    .join(" ");
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

// ---------- reusable components ----------

const SectionCard = ({ title, children }) => (
  <Card
    elevation={6}
    sx={{
      mb: 2.5,
      background: "linear-gradient(135deg, rgba(0,0,0,0.52), rgba(0,0,0,0.72))",
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

// Helper to render text that may contain bullets as a list
function renderTextWithBullets(text) {
  if (!text || typeof text !== "string") return null;

  const hasBullets =
    /^[\s]*[•\-\*]\s+/m.test(text) || text.includes("\n•") || text.includes("\n-") || text.includes("\n*");

  if (hasBullets) {
    const items = text
      .split(/[\n\r]+/)
      .map((line) => line.trim())
      .filter((line) => {
        return (
          /^[•\-\*]\s+/.test(line) ||
          (line.length > 0 && !/^[A-Z][^:]*:/.test(line))
        );
      })
      .map((line) => line.replace(/^[•\-\*]\s+/, "").trim())
      .filter((line) => line.length > 0);

    if (items.length > 0) {
      return (
        <Box component="ul" sx={{ m: 0, pl: 2.5, listStyle: "none" }}>
          {items.map((item, idx) => (
            <Box
              key={idx}
              component="li"
              sx={{
                position: "relative",
                pl: 1.5,
                mb: 0.5,
                "&::before": {
                  content: '"•"',
                  position: "absolute",
                  left: 0,
                  color: "rgba(255,255,255,0.7)",
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

  let aiWarnings = [];
  if (Array.isArray(warnings)) {
    aiWarnings = warnings;
  } else if (typeof warnings === "string" && warnings.trim().length > 0) {
    aiWarnings = [warnings.trim()];
  }

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

function StrainActionsRow({ strainSlug, strainName }) {
  if (!strainSlug || !strainName) return null;

  const basePath = `/strains/${strainSlug}`;

  return (
    <Stack direction="row" spacing={1.5} sx={{ mt: 2, flexWrap: "wrap" }}>
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

  const { imageUrl } = result;

  // ----- label info -----
  const labelInsights = result?.labelInsights || {};
  const rawText = labelInsights.rawText || "";
  const labelStrainName = labelInsights.strainName || null;

  // ----- visual matches (DB) -----
  const visual = result?.visualMatches || {};
  const matchesFromVisual = Array.isArray(visual.matches)
    ? visual.matches
    : visual.match
    ? [visual.match]
    : [];
  const matchesFromLegacy = Array.isArray(result?.matches)
    ? result.matches
    : [];
  const matches =
    matchesFromVisual.length > 0
      ? matchesFromVisual
      : matchesFromLegacy;

  const primaryMatch = matches[0] || result?.topMatch || null;

  const dbName =
    primaryMatch?.name ||
    visual?.match?.name ||
    result?.topMatch?.name ||
    null;

  const dbType =
    primaryMatch?.type ||
    visual?.match?.type ||
    result?.topMatch?.type ||
    null;

  const dbConfidence =
    typeof primaryMatch?.confidence === "number"
      ? primaryMatch.confidence
      : typeof visual?.match?.confidence === "number"
      ? visual.match.confidence
      : null;

  // ----- packaged-product detection -----
  const categoryRaw =
    labelInsights.category || result?.category || "";

  const packagedKeywords = [
    "vape",
    "cartridge",
    "cart",
    "edible",
    "gummy",
    "preroll",
    "pre-roll",
    "concentrate",
    "hash",
    "rosin",
    "live resin",
    "disposable",
  ];

  const isPackagedProduct =
    labelInsights.isPackagedProduct === true ||
    packagedKeywords.some((kw) =>
      categoryRaw.toLowerCase().includes(kw)
    ) ||
    /vape|cartridge|cart|gummy|preroll|pre-roll|disposable/i.test(rawText);

  // ----- AI summary -----
  const aiSummary =
    result?.aiSummary ||
    result?.labelInsights?.aiSummary ||
    null;

  const aiTitleFromBackend = aiSummary?.title ?? null;
  const aiOverview =
    aiSummary?.summary ||
    aiSummary?.overview ||
    null;

  const hasAiSummary = !!(aiTitleFromBackend || aiOverview);

  // ----- NAME RESOLUTION -----
  const productNameFromRaw = extractProductNameFromRawText(rawText);

  let primaryName = null;
  let secondaryDbName = null;

  if (isPackagedProduct) {
    // LABEL-FIRST for packaged products - NEVER show "Unknown strain"
    // Try multiple sources before falling back to "Unknown product"
    primaryName =
      productNameFromRaw ||
      labelStrainName ||
      aiTitleFromBackend ||
      (categoryDisplay && categoryDisplay !== 'unknown' ? categoryDisplay : null) ||
      dbName ||
      "Unknown product";

    // Show DB name as secondary only if it's different from primary
    if (
      dbName &&
      primaryName &&
      dbName.toLowerCase().trim() !== primaryName.toLowerCase().trim() &&
      primaryName !== "Unknown product"
    ) {
      secondaryDbName = dbName;
    }
  } else {
    // PLANT-FIRST for bud/plant scans
    primaryName =
      dbName ||
      labelStrainName ||
      aiTitleFromBackend ||
      productNameFromRaw ||
      "Unknown strain";
  }

  const nameDisplay = primaryName;
  const isPackage = Boolean(isPackagedProduct);
  const dbConfidenceNormalized = normalizeConfidence(dbConfidence);

  const weightText = formatWeight(labelInsights);
  const potencyText = formatPotency(labelInsights);
  const categoryDisplay =
    labelInsights.category || labelInsights.productType || null;

  const terpenes = Array.isArray(labelInsights.terpenes)
    ? labelInsights.terpenes
    : [];

  const terpeneChips = terpenes.slice(0, 6).map((t) => {
    const name =
      typeof t === "string"
        ? t
        : t.name || t.key || "";
    if (!name) return null;
    return {
      label:
        typeof t === "object" && t.percent != null
          ? `${titleCase(name)} • ${t.percent}%`
          : titleCase(name),
    };
  }).filter(Boolean);

  const TagRow = ({ children }) => (
    <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
      {children}
    </Stack>
  );

  return (
    <Box sx={{ mt: 3, mb: 8 }}>
      {/* Header / title */}
      <SectionCard>
        <Box sx={{ mb: 1 }}>
          <Typography
            variant="h6"
            component="h2"
            gutterBottom
            sx={{ fontWeight: 700 }}
          >
            {nameDisplay}
          </Typography>

          {secondaryDbName && (
            <Typography
              variant="body2"
              sx={{ mb: 1, color: "success.main" }}
            >
              {`Database strain (best guess): ${secondaryDbName}${
                dbConfidenceNormalized ? ` • ${dbConfidenceNormalized}` : ""
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
              sx={{
                borderColor: "rgba(255,255,255,0.25)",
                color: "#fff",
              }}
            />
          )}
          {dbType && (
            <Chip
              label={dbType}
              size="small"
              variant="outlined"
              sx={{
                borderColor: "rgba(255,255,255,0.25)",
                color: "#fff",
              }}
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
              sx={{
                borderColor: "rgba(255,255,255,0.25)",
                color: "#fff",
              }}
            />
          )}
        </TagRow>
      </SectionCard>

      {/* AI decoded label (simple inline version) */}
      {hasAiSummary && (
        <SectionCard title="AI decoded label">
          {aiTitleFromBackend && (
            <Typography
              variant="body2"
              sx={{ fontWeight: 500, mb: 0.75 }}
            >
              {aiTitleFromBackend}
            </Typography>
          )}
          {aiOverview && renderTextWithBullets(aiOverview)}
        </SectionCard>
      )}

      {/* Package lab details */}
      {isPackagedProduct && (
        <SectionCard title="PACKAGE LAB DETAILS">
          {(labelInsights?.thc != null || labelInsights?.cbd != null) && (
            <Typography variant="body2" sx={{ mb: 0.75 }}>
              {labelInsights?.thc != null && (
                <>
                  <strong>THC:</strong> {labelInsights.thc}%{" "}
                </>
              )}
              {labelInsights?.cbd != null && (
                <>
                  <strong>CBD:</strong> {labelInsights.cbd}%{" "}
                </>
              )}
            </Typography>
          )}

          {Array.isArray(labelInsights?.terpenes) &&
            labelInsights.terpenes.length > 0 && (
              <Typography variant="body2" sx={{ mb: 0.75 }}>
                <strong>Terpenes:</strong>{" "}
                {labelInsights.terpenes
                  .slice(0, 3)
                  .map((t) =>
                    typeof t === "string"
                      ? t
                      : t.name || t.key || ""
                  )
                  .filter(Boolean)
                  .join(", ")}
              </Typography>
            )}

          {(labelInsights?.labName ||
            labelInsights?.batchId ||
            labelInsights?.testDate ||
            labelInsights?.expirationDate) && (
            <Typography variant="body2">
              {labelInsights?.labName && (
                <>
                  <strong>Testing lab:</strong> {labelInsights.labName}{" "}
                </>
              )}
              {labelInsights?.batchId && (
                <>
                  • <strong>Batch:</strong> {labelInsights.batchId}{" "}
                </>
              )}
              {labelInsights?.testDate && (
                <>
                  • <strong>Tested:</strong> {labelInsights.testDate}{" "}
                </>
              )}
              {labelInsights?.expirationDate && (
                <>
                  • <strong>Expires:</strong> {labelInsights.expirationDate}
                </>
              )}
            </Typography>
          )}
        </SectionCard>
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
                  sx={{
                    borderColor: "rgba(255,255,255,0.25)",
                    color: "#fff",
                  }}
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
                        ? `${m.name} • ${normalizeConfidence(m.confidence)}`
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
        return (
          <StrainActionsRow
            strainSlug={slug}
            strainName={primaryName || name}
          />
        );
      })()}

      <Box sx={{ height: 40 }} />
    </Box>
  );
}