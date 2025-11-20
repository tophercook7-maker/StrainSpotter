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
import ComplianceSummaryCard from "./ComplianceSummaryCard";
import BusinessSummaryCard from "./BusinessSummaryCard";
import { API_BASE } from "../config";

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
    "marijuana is for use by",
    "marihuana is for use by",
    "patients only",
    "do not operate",
    "vehicle or machinery",
    "under the influence",
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

    // add weight for strainy words
    for (const kw of strainKeywords) {
      if (lower.includes(kw)) score += 2;
    }

    // product-y hints
    if (lower.includes("vape") || lower.includes("cartridge") || lower.includes("cart")) {
      score += 2;
    }

    // small bonus if it clearly looks like a strain name like "Commerce City Kush"
    if (/\bkush\b/i.test(line) || /\bcity kush\b/i.test(line)) {
      score += 3;
    }

    return score;
  }

  let best = null;
  let bestScore = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Hard-ban the classic warning line so it can never be the product name
    if (/vehicle or machinery/i.test(line)) continue;

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

// New component for packagingInsights-based results
function PackagingInsightsCard({ packaging, visionRaw, scanId, onCorrectionSaved }) {
  const [showPotency, setShowPotency] = useState(true);
  const [showTerpenes, setShowTerpenes] = useState(false);
  const [showRegulatory, setShowRegulatory] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const { basic, potency, terpenes, regulatory, package_details, marketing_copy, business_tags } = packaging || {};

  const [editState, setEditState] = useState({
    strain_name: basic?.strain_name || "",
    brand_name: basic?.brand_name || "",
    thc_percent: potency?.thc_percent ?? "",
    cbd_percent: potency?.cbd_percent ?? "",
  });

  const handleEditChange = (field, value) => {
    setEditState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveCorrection = async () => {
    if (!scanId) {
      setEditError("Scan ID missing");
      return;
    }
    
    setEditSaving(true);
    setEditError("");
    try {
      const correction = {
        basic: {
          strain_name: editState.strain_name || null,
          brand_name: editState.brand_name || null,
        },
        potency: {
          thc_percent: editState.thc_percent === "" ? null : Number(editState.thc_percent),
          cbd_percent: editState.cbd_percent === "" ? null : Number(editState.cbd_percent),
        },
      };
      const res = await fetch(`${API_BASE}/api/scans/${scanId}/corrections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correction }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      setShowEdit(false);
      if (onCorrectionSaved) onCorrectionSaved();
    } catch (e) {
      setEditError(String(e));
    } finally {
      setEditSaving(false);
    }
  };

  const handleBarcodeLookup = async () => {
    const code = package_details?.unit_barcode;
    if (!code) return;
    try {
      const res = await fetch(`${API_BASE}/api/barcode/lookup?code=${encodeURIComponent(String(code))}`);
      const data = await res.json();
      console.log("[barcodeLookup] matches", data);
      // In future: navigate to a list; for now we just log.
    } catch (e) {
      console.error("[barcodeLookup] error", e);
    }
  };

  return (
    <Box sx={{ mt: 3, mb: 8 }}>
      {/* BASIC HEADER */}
      <SectionCard>
        <Box sx={{ mb: 1 }}>
          <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap' }}>
            {basic?.product_type && (
              <Chip label={basic.product_type} size="small" color="success" variant="outlined" />
            )}
            {Array.isArray(basic?.category_tags) && basic.category_tags.map((tag) => (
              <Chip key={tag} label={tag} size="small" variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.25)", color: "#fff" }} />
            ))}
          </Stack>
          <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 700 }}>
            {basic?.strain_name || "Unknown strain"}
          </Typography>
          {basic?.brand_name && (
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)", mb: 0.5 }}>
              {basic.brand_name}
              {basic.product_line ? ` • ${basic.product_line}` : ""}
            </Typography>
          )}
          {package_details?.net_weight_grams && (
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
              {package_details.net_weight_grams} g package
            </Typography>
          )}
          <Typography
            variant="body2"
            sx={{ color: "rgba(255,255,255,0.7)", mt: 0.5 }}
          >
            Scroll down to see potency, terpenes, compliance, and business tools.
          </Typography>
          {package_details?.unit_barcode && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", display: 'flex', alignItems: 'center', gap: 1 }}>
                Barcode: <code style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: 2 }}>{package_details.unit_barcode}</code>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleBarcodeLookup}
                  sx={{
                    textTransform: 'none',
                    borderColor: 'rgba(255,255,255,0.3)',
                    color: 'rgba(255,255,255,0.8)',
                    '&:hover': {
                      borderColor: 'rgba(255,255,255,0.5)',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                    },
                  }}
                >
                  Lookup
                </Button>
              </Typography>
            </Box>
          )}
        </Box>
      </SectionCard>

      {/* Scroll hint */}
      <Typography
        variant="caption"
        sx={{
          color: 'rgba(255,255,255,0.6)',
          display: 'block',
          textAlign: 'center',
          mb: 2,
          fontStyle: 'italic',
        }}
      >
        Scroll to see potency, terpenes, compliance, and business tools.
      </Typography>

      {/* COMPLIANCE SUMMARY */}
      {packaging && (
        <ComplianceSummaryCard packaging={packaging} />
      )}

      {/* BUSINESS SUMMARY */}
      {packaging && (
        <BusinessSummaryCard packaging={packaging} />
      )}

      {/* POTENCY SECTION */}
      <SectionCard>
        <Button
          fullWidth
          onClick={() => setShowPotency((v) => !v)}
          sx={{
            textTransform: 'none',
            color: '#fff',
            justifyContent: 'space-between',
            p: 0,
            mb: showPotency ? 1.5 : 0,
          }}
        >
          <Typography variant="overline" sx={{ color: "rgba(255,255,255,0.6)", letterSpacing: 1.3 }}>
            Potency
          </Typography>
          <Typography variant="body2">{showPotency ? "▾" : "▸"}</Typography>
        </Button>
        {showPotency && (
          <Box>
            <Stack direction="row" spacing={3} sx={{ mb: 1.5 }}>
              <Box>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", display: 'block', mb: 0.5 }}>THC</Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {potency?.thc_percent != null ? `${potency.thc_percent}%` : "—"}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", display: 'block', mb: 0.5 }}>CBD</Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {potency?.cbd_percent != null ? `${potency.cbd_percent}%` : "—"}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", display: 'block', mb: 0.5 }}>Total cannabinoids</Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {potency?.total_cannabinoids_percent != null ? `${potency.total_cannabinoids_percent}%` : "—"}
                </Typography>
              </Box>
            </Stack>
            {Array.isArray(potency?.other_cannabinoids) && potency.other_cannabinoids.length > 0 && (
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
                {potency.other_cannabinoids.map((c) => (
                  <Chip
                    key={c.name}
                    label={`${c.name}${c.percent != null ? ` ${c.percent}%` : ""}`}
                    size="small"
                    variant="outlined"
                    sx={{ borderColor: "rgba(255,255,255,0.25)", color: "#fff" }}
                  />
                ))}
              </Stack>
            )}
          </Box>
        )}
      </SectionCard>

      {/* TERPENES SECTION */}
      <SectionCard>
        <Button
          fullWidth
          onClick={() => setShowTerpenes((v) => !v)}
          sx={{
            textTransform: 'none',
            color: '#fff',
            justifyContent: 'space-between',
            p: 0,
            mb: showTerpenes ? 1.5 : 0,
          }}
        >
          <Typography variant="overline" sx={{ color: "rgba(255,255,255,0.6)", letterSpacing: 1.3 }}>
            Terpenes & flavor
          </Typography>
          <Typography variant="body2">{showTerpenes ? "▾" : "▸"}</Typography>
        </Button>
        {showTerpenes && (
          <Box>
            {Array.isArray(terpenes?.listed_terpenes) && terpenes.listed_terpenes.length > 0 && (
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1.5 }}>
                {terpenes.listed_terpenes.map((t) => (
                  <Chip
                    key={t.name}
                    label={`${t.name}${t.percent != null ? ` ${t.percent}%` : ""}`}
                    size="small"
                    variant="outlined"
                    sx={{ borderColor: "rgba(255,255,255,0.25)", color: "#fff" }}
                  />
                ))}
              </Stack>
            )}
            {Array.isArray(terpenes?.terpene_profile_tags) && terpenes.terpene_profile_tags.length > 0 && (
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1.5 }}>
                {terpenes.terpene_profile_tags.map((tag) => (
                  <Chip key={tag} label={tag} size="small" variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.25)", color: "#fff" }} />
                ))}
              </Stack>
            )}
            {Array.isArray(marketing_copy?.flavor_notes) && marketing_copy.flavor_notes.length > 0 && (
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)", mt: 1 }}>
                Flavor notes: {marketing_copy.flavor_notes.join(", ")}
              </Typography>
            )}
          </Box>
        )}
      </SectionCard>

      {/* REGULATORY SECTION */}
      <SectionCard>
        <Button
          fullWidth
          onClick={() => setShowRegulatory((v) => !v)}
          sx={{
            textTransform: 'none',
            color: '#fff',
            justifyContent: 'space-between',
            p: 0,
            mb: showRegulatory ? 1.5 : 0,
          }}
        >
          <Typography variant="overline" sx={{ color: "rgba(255,255,255,0.6)", letterSpacing: 1.3 }}>
            Regulatory & compliance
          </Typography>
          <Typography variant="body2">{showRegulatory ? "▾" : "▸"}</Typography>
        </Button>
        {showRegulatory && (
          <Box>
            {regulatory?.license_number && (
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.9)", mb: 1 }}>
                <strong>License:</strong> {regulatory.license_number}
              </Typography>
            )}
            {regulatory?.producer_name && (
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.9)", mb: 1 }}>
                <strong>Producer:</strong> {regulatory.producer_name}
              </Typography>
            )}
            {regulatory?.testing_lab_name && (
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.9)", mb: 1 }}>
                <strong>Lab:</strong> {regulatory.testing_lab_name}
              </Typography>
            )}
            {Array.isArray(regulatory?.regulatory_symbols) && regulatory.regulatory_symbols.length > 0 && (
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1.5 }}>
                {regulatory.regulatory_symbols.map((s) => (
                  <Chip key={s} label={s} size="small" variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.25)", color: "#fff" }} />
                ))}
              </Stack>
            )}
            {Array.isArray(regulatory?.warning_statements) && regulatory.warning_statements.length > 0 && (
              <Box component="ul" sx={{ pl: 2, mt: 1 }}>
                {regulatory.warning_statements.map((w, idx) => (
                  <Typography key={idx} component="li" variant="body2" sx={{ color: "rgba(255,255,255,0.8)", mb: 0.5 }}>
                    {w}
                  </Typography>
                ))}
              </Box>
            )}
          </Box>
        )}
      </SectionCard>

      {/* EDIT DETAILS TO FEED CORRECTIONS */}
      <SectionCard>
        <Button
          fullWidth
          onClick={() => setShowEdit((v) => !v)}
          sx={{
            textTransform: 'none',
            color: '#fff',
            justifyContent: 'space-between',
            p: 0,
            mb: showEdit ? 1.5 : 0,
          }}
        >
          <Typography variant="overline" sx={{ color: "rgba(255,255,255,0.6)", letterSpacing: 1.3 }}>
            Edit key details
          </Typography>
          <Typography variant="body2">{showEdit ? "▾" : "▸"}</Typography>
        </Button>
        {showEdit && (
          <Box>
            <Stack spacing={2} sx={{ mb: 2 }}>
              <Box>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)", display: 'block', mb: 0.5 }}>Strain name</Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={editState.strain_name}
                  onChange={(e) => handleEditChange("strain_name", e.target.value)}
                  placeholder="Strain name"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: '#fff',
                      '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                    },
                  }}
                />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)", display: 'block', mb: 0.5 }}>Brand name</Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={editState.brand_name}
                  onChange={(e) => handleEditChange("brand_name", e.target.value)}
                  placeholder="Brand name"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: '#fff',
                      '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                    },
                  }}
                />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)", display: 'block', mb: 0.5 }}>THC %</Typography>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  value={editState.thc_percent}
                  onChange={(e) => handleEditChange("thc_percent", e.target.value)}
                  placeholder="e.g. 28.5"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: '#fff',
                      '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                    },
                  }}
                />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)", display: 'block', mb: 0.5 }}>CBD %</Typography>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  value={editState.cbd_percent}
                  onChange={(e) => handleEditChange("cbd_percent", e.target.value)}
                  placeholder="e.g. 0.1"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: '#fff',
                      '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                    },
                  }}
                />
              </Box>
            </Stack>
            {editError && (
              <Typography variant="body2" sx={{ color: '#f44336', mb: 1 }}>
                {editError}
              </Typography>
            )}
            <Button
              variant="contained"
              fullWidth
              disabled={editSaving}
              onClick={handleSaveCorrection}
              sx={{
                textTransform: 'none',
                background: 'linear-gradient(135deg, #7CB342 0%, #9CCC65 100%)',
              }}
            >
              {editSaving ? "Saving…" : "Save correction"}
            </Button>
          </Box>
        )}
      </SectionCard>

      {/* RAW TEXT SECTION */}
      <SectionCard>
        <Button
          fullWidth
          onClick={() => setShowRaw((v) => !v)}
          sx={{
            textTransform: 'none',
            color: '#fff',
            justifyContent: 'space-between',
            p: 0,
            mb: showRaw ? 1.5 : 0,
          }}
        >
          <Typography variant="overline" sx={{ color: "rgba(255,255,255,0.6)", letterSpacing: 1.3 }}>
            Raw label text
          </Typography>
          <Typography variant="body2">{showRaw ? "▾" : "▸"}</Typography>
        </Button>
        {showRaw && (
          <Box>
            <Typography
              component="pre"
              variant="body2"
              sx={{
                color: "rgba(255,255,255,0.7)",
                fontSize: '0.75rem',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontFamily: 'monospace',
                p: 1,
                backgroundColor: 'rgba(0,0,0,0.3)',
                borderRadius: 1,
              }}
            >
              {packaging.raw?.ocr_text_raw || visionRaw?.fullTextAnnotation?.text || "No raw text available."}
            </Typography>
          </Box>
        )}
      </SectionCard>
    </Box>
  );
}

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

export default function ScanResultCard({ result, scan }) {
  if (!result) return null;

  const { imageUrl } = result;

  // ----- packagingInsights (GPT-5 nano) -----
  const packagingInsights = result?.packagingInsights || null;
  const visionRaw = result?.visionRaw || null;
  
  // Get scan ID from result or scan prop
  const scanId = result?.id || scan?.id || null;

  // If we have packagingInsights, use the new UI
  if (packagingInsights) {
    return <PackagingInsightsCard packaging={packagingInsights} visionRaw={visionRaw} scanId={scanId} onCorrectionSaved={() => {}} />;
  }

  // ----- label info (fallback to existing logic) -----
  const labelInsights = result?.labelInsights || {};
  const rawText = labelInsights.rawText || "";
  const labelStrainName = labelInsights.strainName || null;

  // ----- visual matches (DB) -----
  const matches =
    result?.visualMatches?.matches ??
    (result?.visualMatches?.match
      ? [result.visualMatches.match]
      : result?.matches ?? []);

  const primaryMatch = matches?.[0] ?? null;

  const dbName = primaryMatch?.name ?? null;
  const dbConfidence =
    typeof primaryMatch?.confidence === "number"
      ? primaryMatch.confidence
      : result?.visualMatches?.match?.confidence ?? null;

  const dbType = primaryMatch?.type || null;

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
    primaryName =
      productNameFromRaw ||
      labelStrainName ||
      aiTitleFromBackend ||
      dbName ||
      "Unknown product";

    if (
      dbName &&
      primaryName &&
      dbName.toLowerCase().trim() !== primaryName.toLowerCase().trim()
    ) {
      secondaryDbName = dbName;
    }
  } else {
    primaryName =
      dbName ||
      labelStrainName ||
      aiTitleFromBackend ||
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
                dbConfidence != null ? ` • ${dbConfidence}% match` : ""
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
            <Typography
              variant="body2"
              sx={{ color: "text.secondary" }}
            >
              {aiOverview}
            </Typography>
          )}
        </Box>
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