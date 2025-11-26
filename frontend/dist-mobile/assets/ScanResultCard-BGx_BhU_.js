var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { j as jsxRuntimeExports, B as Box, T as Typography, f as Card, h as CardContent, H as Chip } from "./react-vendor-DaVUs1pH.js";
import { c as useProMode } from "./App-BxlAc3TE.js";
import { u as useStrainImage } from "./useStrainImage-Dsgj-zte.js";
const BANNED_NAME_FRAGMENTS = [
  "set the",
  "set the experience",
  "set the vape",
  "set the full spectrum",
  "full spectrum vape cartridge",
  "full spectrum cartridge",
  "full spectrum totals",
  "total cannabinoids",
  "activation time",
  "activation approx",
  "activation approx.",
  "for use by",
  "not approved",
  "keep out of reach",
  "testing lab",
  "lab:",
  "coa",
  "batch",
  "date made",
  "test date",
  "exp. date",
  "suite",
  "tel",
  "ocked the rich te",
  "rm. our full-spectrum",
  "rm. our full-spectre",
  "r full spectrum prode"
];
function cleanCandidateName(raw) {
  if (!raw) return null;
  let s = String(raw).trim().replace(/\s+/g, " ");
  if (s.length < 3) return null;
  const lower = s.toLowerCase();
  if (BANNED_NAME_FRAGMENTS.some((f) => lower.includes(f))) {
    return null;
  }
  return s;
}
__name(cleanCandidateName, "cleanCandidateName");
function transformScanResult(scan) {
  if (!scan) return null;
  const result = scan.result || scan || {};
  const ai = result.ai_summary || scan.ai_summary || result.aiSummary || scan.aiSummary || {};
  const pkg = result.packaging_insights || scan.packaging_insights || result.packagingInsights || scan.packagingInsights || {};
  const label = result.label_insights || scan.label_insights || result.labelInsights || scan.labelInsights || {};
  const visual = result.visualMatches?.[0] || scan.result?.visualMatches?.[0] || null;
  const canonicalStrain = scan.canonicalStrain || result.canonicalStrain || result.canonical_strain || scan.canonical_strain || null;
  const seedBank = result.seedBank || result.seed_bank || null;
  const growProfile = result.growProfile || result.grow_profile || null;
  const plantHealth = result.plant_health || result.plantHealth || null;
  const isPackaged = !!pkg.strainName || !!label.strainName || canonicalStrain?.source === "packaging";
  let finalStrain = null;
  if (canonicalStrain && canonicalStrain.name && canonicalStrain.name !== "Cannabis (strain unknown)") {
    finalStrain = canonicalStrain.name;
  } else {
    const packagingStrain = pkg.strainName || label.strainName || null;
    const visualStrain = visual?.name && visual.confidence >= 0.8 ? visual.name : null;
    finalStrain = isPackaged ? packagingStrain : visualStrain;
  }
  const isPackagedKnown = isPackaged && (canonicalStrain && canonicalStrain.confidence === 1 || !!pkg.strainName || !!label.strainName);
  const isBudUnknown = !isPackaged && !finalStrain;
  const potency = pkg.potency || {};
  const thc = potency.thc_percent ?? potency.thc_total_percent ?? label.thc ?? null;
  const cbd = potency.cbd_percent ?? potency.cbd_total_percent ?? label.cbd ?? null;
  const aiIntensity = ai.intensity || null;
  const aiEffects = Array.isArray(ai.effects) ? ai.effects : Array.isArray(ai.effectsAndUseCases) ? ai.effectsAndUseCases : [];
  const aiFlavors = Array.isArray(ai.flavors) ? ai.flavors : [];
  const aiAromas = Array.isArray(ai.aromas) ? ai.aromas : [];
  const aiSummaryText = typeof ai.summary === "string" ? ai.summary : typeof ai.userFacingSummary === "string" ? ai.userFacingSummary : "";
  const aiDispensaryNotes = Array.isArray(ai.dispensaryNotes) ? ai.dispensaryNotes : typeof ai.dispensaryNotes === "string" && ai.dispensaryNotes.trim() ? [ai.dispensaryNotes.trim()] : typeof ai.dispensary_notes === "string" && ai.dispensary_notes.trim() ? [ai.dispensary_notes.trim()] : Array.isArray(ai.dispensary_notes) ? ai.dispensary_notes : [];
  const aiGrowerNotes = Array.isArray(ai.growerNotes) ? ai.growerNotes : typeof ai.growerNotes === "string" && ai.growerNotes.trim() ? [ai.growerNotes.trim()] : typeof ai.grower_notes === "string" && ai.grower_notes.trim() ? [ai.grower_notes.trim()] : Array.isArray(ai.grower_notes) ? ai.grower_notes : [];
  const aiWarnings = Array.isArray(ai.warnings) ? ai.warnings : Array.isArray(ai.risksAndWarnings) ? ai.risksAndWarnings : [];
  let effectsTags = [];
  let flavorTags = [];
  const visualConfidence = visual?.confidence || scan.match_confidence || 0;
  if (isPackaged) {
    effectsTags = aiEffects || [];
    flavorTags = aiFlavors || [];
  } else {
    if (visualConfidence >= 0.8) {
      effectsTags = aiEffects || [];
      flavorTags = aiFlavors || [];
    } else {
      effectsTags = [];
      flavorTags = [];
    }
  }
  let displayStrainName = finalStrain || "Cannabis (strain unknown)";
  if (isPackaged && canonicalStrain && canonicalStrain.confidence === 1 && canonicalStrain.name) {
    displayStrainName = canonicalStrain.name;
  }
  const strainHeroImageUrl = result.strainHeroImageUrl || canonicalStrain?.heroImageUrl || canonicalStrain?.image_url || null;
  const scanImageUrl = scan.image_url || null;
  const heroImageUrl = strainHeroImageUrl || scanImageUrl || null;
  return {
    strainName: displayStrainName,
    canonicalStrain,
    // Include canonical strain object
    seedBank,
    // Include seedBank data
    growProfile,
    // Include growProfile data
    plantHealth,
    // Include plant health data (for plant-only scans)
    isPackagedProduct: isPackaged,
    isPackagedKnown,
    isBudUnknown,
    matchConfidence: canonicalStrain?.confidence ?? visualConfidence,
    thc,
    cbd,
    effectsTags: Array.isArray(effectsTags) ? effectsTags : [],
    flavorTags: Array.isArray(flavorTags) ? flavorTags : [],
    intensity: aiIntensity,
    dispensaryNotes: Array.isArray(aiDispensaryNotes) ? aiDispensaryNotes : [],
    growerNotes: Array.isArray(aiGrowerNotes) ? aiGrowerNotes : [],
    warnings: Array.isArray(aiWarnings) ? aiWarnings : [],
    summary: aiSummaryText || null,
    aromaTags: Array.isArray(aiAromas) ? aiAromas : [],
    // New field for aromas
    heroImageUrl,
    // Hero image URL (strain hero or scan image)
    scanImageUrl,
    // Original scan image URL
    // Keep old field names for backward compatibility
    aiIntensity,
    aiSummaryText,
    aiDispensaryNotes: Array.isArray(aiDispensaryNotes) ? aiDispensaryNotes : [],
    aiGrowerNotes: Array.isArray(aiGrowerNotes) ? aiGrowerNotes : [],
    aiWarnings: Array.isArray(aiWarnings) ? aiWarnings : [],
    // Preserve original fields for backward compatibility
    packaging_insights: pkg,
    label_insights: label,
    ai_summary: ai,
    result: scan.result || result
  };
}
__name(transformScanResult, "transformScanResult");
function normalizeScanResult(scan) {
  if (!scan) return null;
  const result = scan.result || scan || {};
  const transformed = transformScanResult(scan);
  if (!transformed) return null;
  let matchesFromVisual = [];
  if (result.visualMatches) {
    const topMatch = result.visualMatches.match;
    const candidates = Array.isArray(result.visualMatches.candidates) ? result.visualMatches.candidates : [];
    if (topMatch) {
      matchesFromVisual = [topMatch, ...candidates];
    } else if (candidates.length > 0) {
      matchesFromVisual = candidates;
    }
  }
  let matchesFromFlat = [];
  if (Array.isArray(result.matches)) {
    matchesFromFlat = result.matches;
  } else if (result.match) {
    matchesFromFlat = [result.match];
  }
  const allMatches = matchesFromVisual.length > 0 ? matchesFromVisual : matchesFromFlat;
  const toItem = /* @__PURE__ */ __name((candidate) => {
    const strainObj = candidate.strain || candidate;
    const confidence = candidate.confidence ?? candidate.score ?? candidate.probability ?? 0;
    const slug = strainObj.strain_slug || strainObj.slug || strainObj.id || null;
    return {
      id: slug || strainObj.name || "unknown",
      slug,
      name: strainObj.name || "Unknown strain",
      type: strainObj.type || strainObj.category || "Hybrid",
      description: strainObj.description || strainObj.summary || "",
      confidence,
      dbMeta: strainObj
    };
  }, "toItem");
  const [first, ...rest] = allMatches.length > 0 ? allMatches : [null];
  const labelInsights = result.labelInsights || result.visualMatches?.labelInsights || transformed.label_insights || null;
  if (labelInsights && !labelInsights.rawText) {
    labelInsights.rawText = result.rawText || result.detectedText || "";
  }
  const matched_strain_slug = result.matched_strain_slug || scan?.matched_strain_slug || first?.strain?.strain_slug || first?.strain?.slug || first?.strain_slug || first?.slug || transformed.matched_strain_slug || null;
  const packagingInsights = result.packagingInsights || transformed.packaging_insights || null;
  return {
    topMatch: first ? toItem(first) : null,
    otherMatches: rest.map(toItem),
    matches: allMatches.map(toItem),
    matched_strain_slug,
    labelInsights,
    aiSummary: labelInsights?.aiSummary || transformed.ai_summary || null,
    isPackagedProduct: transformed.isPackagedProduct || false,
    packagingInsights,
    visionRaw: result.vision_raw || null,
    // CRITICAL: Include transformed fields for UI components
    strainName: transformed.strainName,
    strainSource: transformed.strainSource,
    effectsTags: transformed.effectsTags,
    flavorTags: transformed.flavorTags,
    matchConfidence: transformed.matchConfidence
  };
}
__name(normalizeScanResult, "normalizeScanResult");
function getScanKindLabel({ isPackagedProduct, category, productType }) {
  if (isPackagedProduct) {
    const lowerCategory = (category || "").toLowerCase();
    const lowerProductType = (productType || "").toLowerCase();
    if (lowerCategory === "vape" || lowerProductType.includes("vape") || lowerProductType.includes("cartridge")) {
      return "Vape cartridge";
    }
    if (lowerCategory === "concentrate" || lowerProductType.includes("concentrate") || lowerProductType.includes("sauce") || lowerProductType.includes("rosin") || lowerProductType.includes("wax") || lowerProductType.includes("shatter")) {
      return "Concentrate";
    }
    if (lowerProductType.includes("pre-roll") || lowerProductType.includes("preroll")) {
      return "Pre-roll";
    }
    if (lowerCategory === "edible" || lowerProductType.includes("edible")) {
      return "Edible";
    }
    if (lowerCategory === "flower" || lowerProductType.includes("flower")) {
      return "Flower";
    }
    return "Packaged product";
  }
  if (category === "flower") {
    return "Flower strain";
  }
  return "Plant";
}
__name(getScanKindLabel, "getScanKindLabel");
function AIStrainDetailsPanel({
  intensity,
  effects,
  flavors,
  dispensaryNotes,
  growerNotes,
  warnings,
  summary
}) {
  if (!intensity && (!effects || effects.length === 0) && (!flavors || flavors.length === 0) && (!dispensaryNotes || dispensaryNotes.length === 0) && (!growerNotes || growerNotes.length === 0) && (!warnings || warnings.length === 0) && !summary) {
    return null;
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Box,
    {
      sx: {
        mt: 3,
        p: 3,
        borderRadius: 2,
        background: "rgba(0, 0, 0, 0.35)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(124, 179, 66, 0.2)"
      },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Typography,
          {
            variant: "overline",
            sx: {
              color: "rgba(200, 230, 201, 0.7)",
              textTransform: "uppercase",
              letterSpacing: 1,
              fontSize: "0.75rem",
              fontWeight: 600
            },
            children: "AI STRAIN DETAILS"
          }
        ),
        intensity != null && /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { mt: 1 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Typography,
            {
              variant: "caption",
              sx: {
                color: "rgba(200, 230, 201, 0.7)",
                display: "block",
                mb: 0.5
              },
              children: [
                "Intensity",
                typeof intensity === "string" && `: ${intensity}`
              ]
            }
          ),
          (() => {
            let intensityValue = 0;
            if (typeof intensity === "number") {
              intensityValue = intensity;
            } else if (typeof intensity === "string") {
              const upper = intensity.toUpperCase();
              if (upper === "HIGH") intensityValue = 0.9;
              else if (upper === "MEDIUM") intensityValue = 0.6;
              else if (upper === "LOW") intensityValue = 0.3;
            }
            return /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { mt: 0.5, display: "flex", gap: 0.5 }, children: Array.from({ length: 5 }).map((_, i) => {
              const filled = intensityValue >= (i + 1) / 5;
              return /* @__PURE__ */ jsxRuntimeExports.jsx(
                Box,
                {
                  sx: {
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    opacity: filled ? 1 : 0.3,
                    backgroundColor: "#9AE66E"
                  }
                },
                i
              );
            }) });
          })()
        ] }),
        effects && effects.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { mt: 2 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Typography,
            {
              variant: "caption",
              sx: {
                color: "rgba(200, 230, 201, 0.7)",
                display: "block",
                mb: 0.5
              },
              children: "Likely effects"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { mt: 0.5, display: "flex", flexWrap: "wrap", gap: 0.5 }, children: Array.isArray(effects) && effects.map((effect, idx) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            Chip,
            {
              size: "small",
              label: typeof effect === "string" ? effect : effect.name || String(effect),
              sx: {
                bgcolor: "rgba(178, 255, 89, 0.08)",
                border: "1px solid rgba(200, 255, 140, 0.85)",
                color: "#e8ffca",
                fontSize: "0.75rem"
              }
            },
            idx
          )) })
        ] }),
        flavors && flavors.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { mt: 2 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Typography,
            {
              variant: "caption",
              sx: {
                color: "rgba(200, 230, 201, 0.7)",
                display: "block",
                mb: 0.5
              },
              children: "Aroma & flavor"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { mt: 0.5, display: "flex", flexWrap: "wrap", gap: 0.5 }, children: Array.isArray(flavors) && flavors.map((flavor, idx) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            Chip,
            {
              size: "small",
              label: typeof flavor === "string" ? flavor : flavor.name || String(flavor),
              sx: {
                bgcolor: "rgba(255, 248, 225, 0.06)",
                border: "1px solid rgba(255, 236, 179, 0.7)",
                color: "#fff8e1",
                fontSize: "0.75rem"
              }
            },
            idx
          )) })
        ] }),
        summary && /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { mt: 2 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Typography,
            {
              variant: "caption",
              sx: {
                color: "rgba(200, 230, 201, 0.7)",
                display: "block",
                mb: 0.5
              },
              children: "Overview"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Typography,
            {
              variant: "body2",
              sx: {
                color: "rgba(224, 242, 241, 0.85)",
                lineHeight: 1.6,
                mt: 0.5
              },
              children: summary
            }
          )
        ] }),
        dispensaryNotes && dispensaryNotes.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { mt: 2 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Typography,
            {
              variant: "caption",
              sx: {
                color: "rgba(200, 230, 201, 0.7)",
                display: "block",
                mb: 0.5
              },
              children: "For dispensaries"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { component: "ul", sx: { marginTop: 0.5, paddingLeft: 2.25, marginBottom: 0 }, children: Array.isArray(dispensaryNotes) && dispensaryNotes.map((note, idx) => /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { component: "li", sx: { mb: 0.5 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "rgba(224, 242, 241, 0.85)" }, children: note }) }, idx)) })
        ] }),
        growerNotes && growerNotes.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { mt: 2 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Typography,
            {
              variant: "caption",
              sx: {
                color: "rgba(200, 230, 201, 0.7)",
                display: "block",
                mb: 0.5
              },
              children: "For growers"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { component: "ul", sx: { marginTop: 0.5, paddingLeft: 2.25, marginBottom: 0 }, children: Array.isArray(growerNotes) && growerNotes.map((note, idx) => /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { component: "li", sx: { mb: 0.5 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "rgba(224, 242, 241, 0.85)" }, children: note }) }, idx)) })
        ] }),
        warnings && warnings.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { mt: 2 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Typography,
            {
              variant: "caption",
              sx: {
                color: "rgba(200, 230, 201, 0.7)",
                display: "block",
                mb: 0.5
              },
              children: "Warnings"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { component: "ul", sx: { marginTop: 0.5, paddingLeft: 2.25, marginBottom: 0 }, children: Array.isArray(warnings) && warnings.map((w, idx) => /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { component: "li", sx: { mb: 0.5 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "rgba(255, 152, 152, 0.9)" }, children: w }) }, idx)) })
        ] })
      ]
    }
  );
}
__name(AIStrainDetailsPanel, "AIStrainDetailsPanel");
function PackagedProductCard({
  strainName,
  thc,
  cbd,
  summary,
  effects,
  flavors,
  intensity,
  dispensaryNotes,
  growerNotes,
  warnings,
  result,
  scan,
  proRole,
  proEnabled,
  growProfile,
  canonicalStrain,
  heroImageUrl,
  plantHealth: plantHealthProp,
  packagingInsights: packagingInsightsProp,
  labelInsights: labelInsightsProp,
  displayBreeder,
  displayType,
  aiSummary: aiSummaryProp
}) {
  const packagingInsights = packagingInsightsProp || result?.packaging_insights || scan?.packaging_insights || scan?.result?.packaging_insights || null;
  const labelInsights = labelInsightsProp || result?.label_insights || scan?.label_insights || scan?.result?.label_insights || null;
  const plantHealthData = plantHealthProp || result?.plant_health || scan?.plant_health || scan?.result?.plant_health || null;
  const growProfileData = growProfile || result?.grow_profile || scan?.grow_profile || scan?.result?.grow_profile || null;
  const aiSummary = aiSummaryProp || result?.ai_summary || result?.aiSummary || scan?.ai_summary || scan?.aiSummary || scan?.result?.ai_summary || scan?.result?.aiSummary || null;
  const lineage = packagingInsights?.lineage || labelInsights?.lineage || null;
  const basic = packagingInsights?.basic || {};
  const details = packagingInsights?.package_details || {};
  const brandName = basic.brand_name || details.brand || labelInsights?.brandName || null;
  const showTHCCBD = thc != null || cbd != null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    heroImageUrl && /* @__PURE__ */ jsxRuntimeExports.jsx(
      Box,
      {
        sx: {
          mb: 2,
          borderRadius: 2,
          overflow: "hidden",
          border: "1px solid",
          borderColor: "rgba(124, 179, 66, 0.3)"
        },
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Box,
          {
            component: "img",
            src: heroImageUrl,
            alt: strainName || "Strain photo",
            sx: {
              width: "100%",
              height: 220,
              objectFit: "cover",
              display: "block"
            },
            onError: /* @__PURE__ */ __name((e) => {
              e.currentTarget.style.display = "none";
            }, "onError")
          }
        )
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Card,
      {
        variant: "outlined",
        sx: {
          mb: 2,
          borderColor: "rgba(165, 214, 167, 0.35)",
          background: "#0a0f0a"
          // Clean, solid dark green background
        },
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { flex: 1 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { display: "flex", alignItems: "center", gap: 1, mb: 0.5 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Typography,
                {
                  variant: "overline",
                  sx: {
                    color: "rgba(200, 230, 201, 0.7)",
                    letterSpacing: 1
                  },
                  children: "Label-based match"
                }
              ),
              proEnabled && proRole && /* @__PURE__ */ jsxRuntimeExports.jsx(
                Chip,
                {
                  label: proRole === "dispensary" ? "Dispensary" : "Grower",
                  size: "small",
                  sx: {
                    height: "20px",
                    fontSize: "0.65rem",
                    bgcolor: "rgba(124, 179, 66, 0.2)",
                    color: "#9AE66E",
                    border: "1px solid rgba(124, 179, 66, 0.4)"
                  }
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Typography,
              {
                variant: "h6",
                sx: { fontWeight: 700, color: "#E8F5E9", mb: 0.5 },
                children: strainName
              }
            ),
            (displayBreeder || displayType) && /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { mb: 0.5 }, children: [
              displayBreeder && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Typography,
                {
                  variant: "body2",
                  sx: { color: "rgba(200, 230, 201, 0.85)", fontSize: "0.875rem", mb: 0.25 },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Breeder:" }),
                    " ",
                    displayBreeder
                  ]
                }
              ),
              displayType && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Typography,
                {
                  variant: "body2",
                  sx: { color: "rgba(200, 230, 201, 0.75)", fontSize: "0.875rem", mb: 0.25 },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Type:" }),
                    " ",
                    displayType
                  ]
                }
              )
            ] }),
            lineage && /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Typography,
              {
                variant: "body2",
                sx: { color: "rgba(200, 230, 201, 0.75)", fontSize: "0.875rem", mb: 0.5 },
                children: [
                  "Lineage: ",
                  lineage
                ]
              }
            ),
            brandName && /* @__PURE__ */ jsxRuntimeExports.jsx(
              Typography,
              {
                variant: "body2",
                sx: { color: "rgba(200, 230, 201, 0.85)", mb: 1 },
                children: brandName
              }
            )
          ] }),
          showTHCCBD && /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { ml: 2, textAlign: "right" }, children: [
            thc != null && /* @__PURE__ */ jsxRuntimeExports.jsx(
              Chip,
              {
                label: `THC ${thc}%`,
                size: "small",
                sx: {
                  bgcolor: "rgba(255, 204, 128, 0.15)",
                  color: "#FFCC80",
                  border: "1px solid rgba(255, 204, 128, 0.3)",
                  mb: 0.5,
                  display: "block"
                }
              }
            ),
            cbd != null && /* @__PURE__ */ jsxRuntimeExports.jsx(
              Chip,
              {
                label: `CBD ${cbd}%`,
                size: "small",
                sx: {
                  bgcolor: "rgba(179, 229, 252, 0.15)",
                  color: "#B3E5FC",
                  border: "1px solid rgba(179, 229, 252, 0.3)"
                }
              }
            )
          ] })
        ] }) })
      }
    ),
    packagingInsights && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Box,
      {
        sx: {
          mt: 3,
          p: 3,
          borderRadius: 2,
          background: "rgba(0, 0, 0, 0.35)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(124, 179, 66, 0.2)",
          mb: 2
        },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Typography,
            {
              variant: "h6",
              sx: {
                color: "rgba(200, 230, 201, 0.9)",
                fontWeight: 600,
                fontSize: "1rem",
                mb: 1
              },
              children: "Packaging summary"
            }
          ),
          packagingInsights.overallConfidence != null && /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", sx: { color: "rgba(200, 230, 201, 0.85)", mb: 0.5 }, children: [
            "Match confidence: ",
            ((packagingInsights.overallConfidence || 0) * 100).toFixed(0),
            "%"
          ] }),
          packagingInsights.thc != null && /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", sx: { color: "rgba(200, 230, 201, 0.85)", mb: 0.5, mt: 0.5 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Label THC:" }),
            " ",
            packagingInsights.thc,
            "%"
          ] }),
          packagingInsights.cbd != null && /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", sx: { color: "rgba(200, 230, 201, 0.85)", mb: 0.5, mt: 0.5 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Label CBD:" }),
            " ",
            packagingInsights.cbd,
            "%"
          ] })
        ]
      }
    ),
    labelInsights && (labelInsights.batchNumber || labelInsights.packagedDate || labelInsights.testingLab) && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Box,
      {
        sx: {
          mt: 2,
          p: 3,
          borderRadius: 2,
          background: "rgba(0, 0, 0, 0.35)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(124, 179, 66, 0.2)",
          mb: 2
        },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Typography,
            {
              variant: "overline",
              sx: {
                color: "rgba(200, 230, 201, 0.7)",
                textTransform: "uppercase",
                letterSpacing: 1,
                fontSize: "0.75rem",
                fontWeight: 600,
                display: "block",
                mb: 2
              },
              children: "Additional Details"
            }
          ),
          labelInsights?.batchNumber && /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", sx: { color: "rgba(200, 230, 201, 0.85)", mb: 0.5 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Batch:" }),
            " ",
            labelInsights.batchNumber
          ] }),
          labelInsights?.packagedDate && /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", sx: { color: "rgba(200, 230, 201, 0.85)", mb: 0.5 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Packaged:" }),
            " ",
            labelInsights.packagedDate
          ] }),
          labelInsights?.testingLab && /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", sx: { color: "rgba(200, 230, 201, 0.85)", mb: 0.5 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Testing Lab:" }),
            " ",
            labelInsights.testingLab
          ] })
        ]
      }
    ),
    (plantHealthData || growProfileData) && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Box,
      {
        sx: {
          mt: 3,
          p: 3,
          borderRadius: 2,
          background: "rgba(0, 0, 0, 0.35)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(124, 179, 66, 0.2)"
        },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Typography,
            {
              variant: "overline",
              sx: {
                color: "rgba(200, 230, 201, 0.7)",
                textTransform: "uppercase",
                letterSpacing: 1,
                fontSize: "0.75rem",
                fontWeight: 600,
                display: "block",
                mb: 2
              },
              children: "Plant Health & Diagnostics"
            }
          ),
          plantHealthData?.overall_health && /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", sx: { color: "rgba(200, 230, 201, 0.85)", mb: 0.5 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Overall Health:" }),
            " ",
            plantHealthData.overall_health
          ] }),
          plantHealthData?.issues && Array.isArray(plantHealthData.issues) && plantHealthData.issues.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { mt: 1 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "rgba(255, 152, 152, 0.9)", mb: 0.5, fontWeight: 600 }, children: "Issues Detected:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { component: "ul", sx: { marginTop: 0.5, paddingLeft: 2.25, marginBottom: 0 }, children: plantHealthData.issues.map((issue, idx) => /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { component: "li", sx: { mb: 0.5 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "rgba(255, 152, 152, 0.9)" }, children: issue }) }, idx)) })
          ] }),
          plantHealthData?.recommendations && Array.isArray(plantHealthData.recommendations) && plantHealthData.recommendations.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { mt: 2 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "rgba(200, 230, 201, 0.85)", mb: 0.5, fontWeight: 600 }, children: "Recommendations:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { component: "ul", sx: { marginTop: 0.5, paddingLeft: 2.25, marginBottom: 0 }, children: plantHealthData.recommendations.map((rec, idx) => /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { component: "li", sx: { mb: 0.5 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "rgba(200, 230, 201, 0.85)" }, children: rec }) }, idx)) })
          ] })
        ]
      }
    ),
    aiSummary && (effects.length > 0 || flavors.length > 0) && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Box,
      {
        sx: {
          mt: 3,
          p: 3,
          borderRadius: 2,
          background: "rgba(0, 0, 0, 0.35)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(124, 179, 66, 0.2)",
          mb: 2
        },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Typography,
            {
              variant: "h6",
              sx: {
                color: "rgba(200, 230, 201, 0.9)",
                fontWeight: 600,
                fontSize: "1rem",
                mb: 1
              },
              children: "Effects & flavors"
            }
          ),
          effects.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", sx: { color: "rgba(200, 230, 201, 0.85)", mb: 0.5, mt: 0.5 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Effects:" }),
            " ",
            effects.join(", ")
          ] }),
          flavors.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", sx: { color: "rgba(200, 230, 201, 0.85)", mb: 0.5, mt: 0.5 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Flavors:" }),
            " ",
            flavors.join(", ")
          ] })
        ]
      }
    ),
    aiSummary && (dispensaryNotes.length > 0 || growerNotes.length > 0) && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Box,
      {
        sx: {
          mt: 2,
          p: 3,
          borderRadius: 2,
          background: "rgba(0, 0, 0, 0.35)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(124, 179, 66, 0.2)",
          mb: 2
        },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Typography,
            {
              variant: "h6",
              sx: {
                color: "rgba(200, 230, 201, 0.9)",
                fontWeight: 600,
                fontSize: "1rem",
                mb: 1
              },
              children: "Notes"
            }
          ),
          dispensaryNotes.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { mb: 2 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "rgba(200, 230, 201, 0.85)", mb: 0.5, fontWeight: 600 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Dispensary:" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { component: "ul", sx: { paddingLeft: 2.25, margin: "4px 0", mt: 0.5 }, children: dispensaryNotes.map((n, idx) => /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { component: "li", sx: { mb: 0.5 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "rgba(200, 230, 201, 0.85)" }, children: n }) }, idx)) })
          ] }),
          growerNotes.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "rgba(200, 230, 201, 0.85)", mb: 0.5, fontWeight: 600 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Grower:" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { component: "ul", sx: { paddingLeft: 2.25, margin: "4px 0", mt: 0.5 }, children: growerNotes.map((n, idx) => /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { component: "li", sx: { mb: 0.5 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "rgba(200, 230, 201, 0.85)" }, children: n }) }, idx)) })
          ] })
        ]
      }
    ),
    aiSummary && (aiSummary.thc != null || aiSummary.cbd != null || warnings.length > 0) && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Box,
      {
        sx: {
          mt: 2,
          p: 3,
          borderRadius: 2,
          background: "rgba(0, 0, 0, 0.35)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(124, 179, 66, 0.2)",
          mb: 2
        },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Typography,
            {
              variant: "h6",
              sx: {
                color: "rgba(200, 230, 201, 0.9)",
                fontWeight: 600,
                fontSize: "1rem",
                mb: 1
              },
              children: "Potency & Warnings"
            }
          ),
          (aiSummary.thc != null || aiSummary.cbd != null) && /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { mb: 2 }, children: [
            aiSummary.thc != null && /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", sx: { color: "rgba(200, 230, 201, 0.85)", mb: 0.5 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Estimated THC:" }),
              " ",
              aiSummary.thc,
              "%"
            ] }),
            aiSummary.cbd != null && /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", sx: { color: "rgba(200, 230, 201, 0.85)", mb: 0.5 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Estimated CBD:" }),
              " ",
              aiSummary.cbd,
              "%"
            ] })
          ] }),
          warnings.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "rgba(255, 152, 152, 0.9)", mb: 0.5, fontWeight: 600 }, children: "Warnings:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { component: "ul", sx: { marginTop: 0.5, paddingLeft: 2.25, marginBottom: 0 }, children: warnings.map((w, idx) => /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { component: "li", sx: { mb: 0.5 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "rgba(255, 152, 152, 0.9)" }, children: w }) }, idx)) })
          ] })
        ]
      }
    )
  ] });
}
__name(PackagedProductCard, "PackagedProductCard");
function UnknownStrainCard({
  isPackagedProduct,
  isPackagedKnown,
  isBudUnknown,
  summary,
  effects,
  flavors,
  intensity,
  dispensaryNotes,
  growerNotes,
  warnings,
  canonicalStrain,
  result,
  scan,
  plantHealth,
  growProfile,
  displayName,
  hasStrainName,
  isLikelyPlantOnly,
  aiSummary: aiSummaryProp
}) {
  if (isPackagedProduct && (isPackagedKnown || canonicalStrain && canonicalStrain.confidence === 1)) {
    return null;
  }
  const aiSummary = aiSummaryProp || result?.ai_summary || result?.aiSummary || scan?.ai_summary || scan?.aiSummary || scan?.result?.ai_summary || scan?.result?.aiSummary || null;
  const hasPlantData = plantHealth || growProfile;
  const isPlantOnly = !isPackagedProduct && hasPlantData;
  let title = "Cannabis (strain unknown)";
  let subtitle = "STRAIN UNKNOWN • 0%";
  let description = "";
  if (isPackagedProduct && !isPackagedKnown) {
    title = "Packaged product (strain unknown)";
    subtitle = "STRAIN UNKNOWN • 0%";
    description = "This looks like a packaged product, but the strain name was not clearly detected from the label. THC, CBD, and other label details may still be available below.";
  } else if (isPlantOnly) {
    title = displayName || "Unknown strain (plant detected)";
    subtitle = "STRAIN UNKNOWN • PLANT DETECTED";
    description = "We detected a cannabis plant in your photo, but couldn't identify the specific strain. Plant health diagnostics and grow information are available below.";
  } else if (!isPackagedProduct && isBudUnknown) {
    title = "Cannabis (strain unknown)";
    subtitle = "STRAIN UNKNOWN • 0%";
    description = "For live plants and buds, this is an estimated strain based on visual and label signals. Results may vary by grower and phenotype.";
  } else {
    subtitle = "STRAIN UNKNOWN • 0%";
    description = "Strain information is not available for this scan. Other label or AI details may still be shown below.";
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Card,
      {
        variant: "outlined",
        sx: {
          mb: 2,
          borderColor: "rgba(165, 214, 167, 0.35)",
          background: "#0a0f0a"
          // Clean, solid dark green background
        },
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Typography,
            {
              variant: "overline",
              sx: {
                color: "rgba(200, 230, 201, 0.7)",
                letterSpacing: 1,
                display: "block",
                mb: 0.5
              },
              children: subtitle
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Typography,
            {
              variant: "h6",
              sx: { fontWeight: 700, color: "#E8F5E9", mb: 0.5 },
              children: title
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Typography,
            {
              variant: "body2",
              sx: { color: "rgba(200, 230, 201, 0.85)" },
              children: description
            }
          )
        ] })
      }
    ),
    isLikelyPlantOnly && /* @__PURE__ */ jsxRuntimeExports.jsx(
      Box,
      {
        sx: {
          mb: 2,
          p: 2,
          borderRadius: 2,
          background: "rgba(124, 179, 66, 0.15)",
          border: "1px solid rgba(124, 179, 66, 0.3)"
        },
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Typography,
          {
            variant: "body2",
            sx: {
              margin: 0,
              fontSize: "0.8125rem",
              color: "rgba(200, 230, 201, 0.8)",
              lineHeight: 1.5
            },
            children: "This looks like a plant photo. We couldn't confidently match a strain, but we analyzed the plant for health and grow signals below."
          }
        )
      }
    ),
    (plantHealth || growProfile) && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Box,
      {
        sx: {
          mt: 3,
          p: 3,
          borderRadius: 2,
          background: "rgba(0, 0, 0, 0.35)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(124, 179, 66, 0.2)"
        },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Typography,
            {
              variant: "overline",
              sx: {
                color: "rgba(200, 230, 201, 0.7)",
                textTransform: "uppercase",
                letterSpacing: 1,
                fontSize: "0.75rem",
                fontWeight: 600,
                display: "block",
                mb: 2
              },
              children: "Plant Health & Diagnostics"
            }
          ),
          plantHealth?.overall_health && /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", sx: { color: "rgba(200, 230, 201, 0.85)", mb: 0.5 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Overall Health:" }),
            " ",
            plantHealth.overall_health
          ] }),
          plantHealth?.issues && Array.isArray(plantHealth.issues) && plantHealth.issues.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { mt: 1 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "rgba(255, 152, 152, 0.9)", mb: 0.5, fontWeight: 600 }, children: "Issues Detected:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { component: "ul", sx: { marginTop: 0.5, paddingLeft: 2.25, marginBottom: 0 }, children: plantHealth.issues.map((issue, idx) => /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { component: "li", sx: { mb: 0.5 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "rgba(255, 152, 152, 0.9)" }, children: issue }) }, idx)) })
          ] }),
          plantHealth?.recommendations && Array.isArray(plantHealth.recommendations) && plantHealth.recommendations.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { mt: 2 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "rgba(200, 230, 201, 0.85)", mb: 0.5, fontWeight: 600 }, children: "Recommendations:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { component: "ul", sx: { marginTop: 0.5, paddingLeft: 2.25, marginBottom: 0 }, children: plantHealth.recommendations.map((rec, idx) => /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { component: "li", sx: { mb: 0.5 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "rgba(200, 230, 201, 0.85)" }, children: rec }) }, idx)) })
          ] })
        ]
      }
    ),
    growProfile && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Box,
      {
        sx: {
          mt: 3,
          p: 3,
          borderRadius: 2,
          background: "rgba(0, 0, 0, 0.35)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(124, 179, 66, 0.2)"
        },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Typography,
            {
              variant: "overline",
              sx: {
                color: "rgba(200, 230, 201, 0.7)",
                textTransform: "uppercase",
                letterSpacing: 1,
                fontSize: "0.75rem",
                fontWeight: 600,
                display: "block",
                mb: 2
              },
              children: "Grow Profile"
            }
          ),
          growProfile.vigor && /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", sx: { color: "rgba(200, 230, 201, 0.85)", mb: 0.5 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Vigor:" }),
            " ",
            growProfile.vigor
          ] }),
          growProfile.harvestWeeks && /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", sx: { color: "rgba(200, 230, 201, 0.85)", mb: 0.5 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Harvest:" }),
            " ~",
            growProfile.harvestWeeks,
            " weeks"
          ] }),
          growProfile.yield && /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", sx: { color: "rgba(200, 230, 201, 0.85)", mb: 0.5 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Yield:" }),
            " ",
            growProfile.yield
          ] })
        ]
      }
    ),
    aiSummary && (effects.length > 0 || flavors.length > 0) && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Box,
      {
        sx: {
          mt: 3,
          p: 3,
          borderRadius: 2,
          background: "rgba(0, 0, 0, 0.35)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(124, 179, 66, 0.2)",
          mb: 2
        },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Typography,
            {
              variant: "h6",
              sx: {
                color: "rgba(200, 230, 201, 0.9)",
                fontWeight: 600,
                fontSize: "1rem",
                mb: 1
              },
              children: "Effects & flavors"
            }
          ),
          effects.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", sx: { color: "rgba(200, 230, 201, 0.85)", mb: 0.5, mt: 0.5 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Effects:" }),
            " ",
            effects.join(", ")
          ] }),
          flavors.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", sx: { color: "rgba(200, 230, 201, 0.85)", mb: 0.5, mt: 0.5 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Flavors:" }),
            " ",
            flavors.join(", ")
          ] })
        ]
      }
    ),
    aiSummary && (dispensaryNotes.length > 0 || growerNotes.length > 0) && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Box,
      {
        sx: {
          mt: 2,
          p: 3,
          borderRadius: 2,
          background: "rgba(0, 0, 0, 0.35)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(124, 179, 66, 0.2)",
          mb: 2
        },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Typography,
            {
              variant: "h6",
              sx: {
                color: "rgba(200, 230, 201, 0.9)",
                fontWeight: 600,
                fontSize: "1rem",
                mb: 1
              },
              children: "Notes"
            }
          ),
          dispensaryNotes.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { mb: 2 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "rgba(200, 230, 201, 0.85)", mb: 0.5, fontWeight: 600 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Dispensary:" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { component: "ul", sx: { paddingLeft: 2.25, margin: "4px 0", mt: 0.5 }, children: dispensaryNotes.map((n, idx) => /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { component: "li", sx: { mb: 0.5 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "rgba(200, 230, 201, 0.85)" }, children: n }) }, idx)) })
          ] }),
          growerNotes.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "rgba(200, 230, 201, 0.85)", mb: 0.5, fontWeight: 600 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Grower:" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { component: "ul", sx: { paddingLeft: 2.25, margin: "4px 0", mt: 0.5 }, children: growerNotes.map((n, idx) => /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { component: "li", sx: { mb: 0.5 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "rgba(200, 230, 201, 0.85)" }, children: n }) }, idx)) })
          ] })
        ]
      }
    ),
    aiSummary && (aiSummary.thc != null || aiSummary.cbd != null || warnings.length > 0) && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Box,
      {
        sx: {
          mt: 2,
          p: 3,
          borderRadius: 2,
          background: "rgba(0, 0, 0, 0.35)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(124, 179, 66, 0.2)",
          mb: 2
        },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Typography,
            {
              variant: "h6",
              sx: {
                color: "rgba(200, 230, 201, 0.9)",
                fontWeight: 600,
                fontSize: "1rem",
                mb: 1
              },
              children: "Potency & Warnings"
            }
          ),
          (aiSummary.thc != null || aiSummary.cbd != null) && /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { mb: 2 }, children: [
            aiSummary.thc != null && /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", sx: { color: "rgba(200, 230, 201, 0.85)", mb: 0.5 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Estimated THC:" }),
              " ",
              aiSummary.thc,
              "%"
            ] }),
            aiSummary.cbd != null && /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", sx: { color: "rgba(200, 230, 201, 0.85)", mb: 0.5 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Estimated CBD:" }),
              " ",
              aiSummary.cbd,
              "%"
            ] })
          ] }),
          warnings.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "rgba(255, 152, 152, 0.9)", mb: 0.5, fontWeight: 600 }, children: "Warnings:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { component: "ul", sx: { marginTop: 0.5, paddingLeft: 2.25, marginBottom: 0 }, children: warnings.map((w, idx) => /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { component: "li", sx: { mb: 0.5 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "rgba(255, 152, 152, 0.9)" }, children: w }) }, idx)) })
          ] })
        ]
      }
    )
  ] });
}
__name(UnknownStrainCard, "UnknownStrainCard");
function BudEstimateCard({
  strainName,
  matchConfidence,
  summary,
  effects,
  flavors,
  intensity,
  dispensaryNotes,
  growerNotes,
  warnings,
  result,
  scan,
  growProfile,
  canonicalStrain,
  heroImageUrl,
  plantHealth: plantHealthProp,
  packagingInsights: packagingInsightsProp,
  labelInsights: labelInsightsProp,
  displayBreeder,
  displayType,
  aiSummary: aiSummaryProp
}) {
  const packagingInsights = packagingInsightsProp || result?.packaging_insights || scan?.packaging_insights || scan?.result?.packaging_insights || null;
  const labelInsights = labelInsightsProp || result?.label_insights || scan?.label_insights || scan?.result?.label_insights || null;
  const lineage = packagingInsights?.lineage || labelInsights?.lineage || null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    heroImageUrl && /* @__PURE__ */ jsxRuntimeExports.jsx(
      Box,
      {
        sx: {
          mb: 2,
          borderRadius: 2,
          overflow: "hidden",
          border: "1px solid",
          borderColor: "rgba(124, 179, 66, 0.3)"
        },
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Box,
          {
            component: "img",
            src: heroImageUrl,
            alt: strainName || "Strain photo",
            sx: {
              width: "100%",
              height: 220,
              objectFit: "cover",
              display: "block"
            },
            onError: /* @__PURE__ */ __name((e) => {
              e.currentTarget.style.display = "none";
            }, "onError")
          }
        )
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Card,
      {
        variant: "outlined",
        sx: {
          mb: 2,
          borderColor: "rgba(165, 214, 167, 0.35)",
          background: "#0a0f0a"
          // Clean, solid dark green background
        },
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
          canonicalStrain && canonicalStrain.confidence === 1 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            Typography,
            {
              variant: "overline",
              sx: {
                color: "rgba(200, 230, 201, 0.7)",
                letterSpacing: 1,
                display: "block",
                mb: 0.5
              },
              children: "Strain match"
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Typography,
            {
              variant: "overline",
              sx: {
                color: "rgba(200, 230, 201, 0.7)",
                letterSpacing: 1,
                display: "block",
                mb: 0.5
              },
              children: [
                "Strain estimate",
                matchConfidence != null ? ` – ${Math.round(matchConfidence * 100)}%` : ""
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Typography,
            {
              variant: "h6",
              sx: { fontWeight: 700, color: "#E8F5E9", mb: 0.5 },
              children: strainName
            }
          ),
          lineage && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Typography,
            {
              variant: "body2",
              sx: { color: "rgba(200, 230, 201, 0.75)", fontSize: "0.875rem", mb: 1 },
              children: [
                "Lineage: ",
                lineage
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Typography,
            {
              variant: "body2",
              sx: { color: "rgba(200, 230, 201, 0.85)" },
              children: "For live plants and buds, this is an estimated strain based on visual and label signals. Results may vary by grower and phenotype."
            }
          )
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      AIStrainDetailsPanel,
      {
        intensity,
        effects,
        flavors,
        dispensaryNotes,
        growerNotes,
        warnings,
        summary
      }
    )
  ] });
}
__name(BudEstimateCard, "BudEstimateCard");
function ScanResultCard({ result, scan, isGuest }) {
  if (!scan || !scan.id && !scan.result) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { p: 3, textAlign: "center" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", color: "text.secondary", sx: { mb: 2, fontWeight: 600 }, children: "Scan ready, but details are missing" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", color: "text.secondary", sx: { mb: 2, display: "block" }, children: "We processed your scan, but couldn't load the full details. Try checking your scan history or scanning again." })
    ] });
  }
  const { proRole, proEnabled } = useProMode();
  const raw = scan?.result || scan || result || {};
  const canonical = raw.canonical_strain || raw.canonicalStrain || (raw.canonical_strain_name ? {
    name: raw.canonical_strain_name
  } : null) || raw.canonical || null;
  const seedBank = raw.seedBank || raw.seed_bank || null;
  const aiSummary = raw.ai_summary || raw.aiSummary || null;
  const packagingInsights = raw.packaging_insights || raw.packagingInsights || null;
  const labelInsights = raw.label_insights || raw.labelInsights || null;
  const plantHealth = raw.plant_health || raw.plantHealth || null;
  const growProfile = raw.grow_profile || raw.growProfile || null;
  const hasStrain = !!(canonical?.name || seedBank?.name || aiSummary?.canonicalName);
  const hasPlantOnlyData = !!(plantHealth || growProfile);
  const effects = Array.isArray(aiSummary?.effects) ? aiSummary.effects : [];
  const flavors = Array.isArray(aiSummary?.flavors) ? aiSummary.flavors : [];
  const dispensaryNotes = Array.isArray(aiSummary?.dispensaryNotes) ? aiSummary.dispensaryNotes : [];
  const growerNotes = Array.isArray(aiSummary?.growerNotes) ? aiSummary.growerNotes : [];
  const warnings = Array.isArray(aiSummary?.warnings) ? aiSummary.warnings : [];
  const scanData = result || scan || {};
  const title = canonical?.name || seedBank?.name || aiSummary?.canonicalName || packagingInsights?.strainName || labelInsights?.strainName || (hasPlantOnlyData ? "Unknown strain (plant detected)" : "Unknown strain");
  const displayName = title;
  const displayType = seedBank?.type || aiSummary?.type || canonical?.type || null;
  const displayBreeder = seedBank?.breeder || aiSummary?.breeder || null;
  const hasStrainName = Boolean(hasStrain && displayName && displayName !== "Unknown strain" && displayName !== "Unknown strain (plant detected)");
  const hasPlantDiagnostics = Boolean(hasPlantOnlyData);
  const isLikelyPlantOnly = !hasStrainName && hasPlantDiagnostics && !packagingInsights;
  const canonicalNameForImage = canonical?.name || seedBank?.name || aiSummary?.canonicalName || null;
  const { imageUrl: strainImageUrl } = useStrainImage(canonicalNameForImage);
  const getBestImageUrl = /* @__PURE__ */ __name((transformedImageUrl) => {
    return strainImageUrl || transformedImageUrl || scan?.image_url || null;
  }, "getBestImageUrl");
  let transformed = null;
  try {
    transformed = transformScanResult(scanData);
  } catch (error) {
    console.error("[ScanResultCard] transformScanResult error:", error);
  }
  if (!transformed && hasPlantDiagnostics && !hasStrainName) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      UnknownStrainCard,
      {
        isPackagedProduct: false,
        isPackagedKnown: false,
        isBudUnknown: true,
        summary: null,
        effects: [],
        flavors: [],
        intensity: null,
        dispensaryNotes: [],
        growerNotes: [],
        warnings: [],
        canonicalStrain: null,
        result,
        scan,
        plantHealth,
        growProfile,
        displayName,
        hasStrainName,
        isLikelyPlantOnly,
        aiSummary
      }
    );
  }
  if (!transformed) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { p: 3, textAlign: "center" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", color: "text.secondary", sx: { mb: 2 }, children: "Preparing your result…" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "caption", color: "text.secondary", sx: { mb: 2, display: "block" }, children: "Your scan is processing. This may take a moment." })
    ] });
  }
  const canonicalStrain = transformed?.canonicalStrain || null;
  const isCanonicalConfident = canonicalStrain && canonicalStrain.confidence === 1;
  const shouldShowPackagedCard = transformed?.isPackagedKnown || transformed?.isPackagedProduct && isCanonicalConfident;
  if (shouldShowPackagedCard) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      PackagedProductCard,
      {
        strainName: displayName,
        thc: transformed?.thc || null,
        cbd: transformed?.cbd || null,
        summary: transformed?.summary || null,
        effects: transformed?.effectsTags || [],
        flavors: transformed?.flavorTags || [],
        intensity: transformed?.intensity || null,
        dispensaryNotes: transformed?.dispensaryNotes || [],
        growerNotes: transformed?.growerNotes || [],
        warnings: transformed?.warnings || [],
        result,
        scan,
        proRole,
        proEnabled,
        growProfile: growProfile || transformed?.growProfile || null,
        canonicalStrain,
        heroImageUrl: getBestImageUrl(transformed?.heroImageUrl),
        plantHealth,
        packagingInsights,
        labelInsights,
        displayBreeder,
        displayType,
        aiSummary
      }
    );
  }
  const isUnknownStrain = (transformed?.isBudUnknown || transformed?.isPackagedProduct && !transformed?.isPackagedKnown) && !isCanonicalConfident;
  const isPlantOnlyScan = !hasStrainName && hasPlantDiagnostics && !packagingInsights;
  if (isUnknownStrain || isPlantOnlyScan) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      UnknownStrainCard,
      {
        isPackagedProduct: transformed?.isPackagedProduct || false,
        isPackagedKnown: transformed?.isPackagedKnown || false,
        isBudUnknown: transformed?.isBudUnknown || false,
        summary: transformed?.summary || null,
        effects: transformed?.effectsTags || effects || [],
        flavors: transformed?.flavorTags || flavors || [],
        intensity: transformed?.intensity || null,
        dispensaryNotes: transformed?.dispensaryNotes || dispensaryNotes || [],
        growerNotes: transformed?.growerNotes || growerNotes || [],
        warnings: transformed?.warnings || warnings || [],
        canonicalStrain,
        result,
        scan,
        plantHealth,
        growProfile,
        displayName,
        hasStrainName,
        isLikelyPlantOnly,
        aiSummary
      }
    );
  }
  if (transformed?.isPackagedProduct && isCanonicalConfident) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { p: 3, textAlign: "center" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", color: "text.secondary", children: "Processing result…" }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    BudEstimateCard,
    {
      strainName: transformed?.strainName || displayName,
      matchConfidence: transformed?.matchConfidence || null,
      summary: transformed?.summary || null,
      effects: transformed?.effectsTags || effects || [],
      flavors: transformed?.flavorTags || flavors || [],
      intensity: transformed?.intensity || null,
      dispensaryNotes: transformed?.dispensaryNotes || dispensaryNotes || [],
      growerNotes: transformed?.growerNotes || growerNotes || [],
      warnings: transformed?.warnings || warnings || [],
      result,
      scan,
      growProfile: growProfile || transformed?.growProfile || null,
      canonicalStrain,
      heroImageUrl: getBestImageUrl(transformed?.heroImageUrl),
      plantHealth,
      packagingInsights,
      labelInsights,
      displayBreeder,
      displayType,
      aiSummary
    }
  );
}
__name(ScanResultCard, "ScanResultCard");
const ScanResultCard$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: ScanResultCard
}, Symbol.toStringTag, { value: "Module" }));
export {
  ScanResultCard as S,
  ScanResultCard$1 as a,
  cleanCandidateName as c,
  getScanKindLabel as g,
  normalizeScanResult as n,
  transformScanResult as t
};
