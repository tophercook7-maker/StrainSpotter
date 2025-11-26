var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { j as jsxRuntimeExports, r as reactExports, R as React, S as Stack, B as Box, I as IconButton, y as ArrowBackIcon, T as Typography, i as Button, P as Paper, n as CircularProgress, C as Container, a2 as CameraAltIcon, aa as CloudUploadIcon, A as Alert, ab as Skeleton, D as Dialog, p as DialogTitle, q as DialogContent, u as DialogActions } from "./react-vendor-DaVUs1pH.js";
import { S as ScanResultCard, n as normalizeScanResult, t as transformScanResult } from "./ScanResultCard-BGx_BhU_.js";
import { u as useCanScan } from "./useCanScan-DUbcGzHt.js";
import { u as useAuth, b as useMembership, c as useProMode, a as API_BASE } from "./App-BxlAc3TE.js";
import { u as useCreditBalance } from "./useCreditBalance-C4unyUsC.js";
import "./vendor-qR99EfKL.js";
import "./useStrainImage-Dsgj-zte.js";
function formatPercent$1(value) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  const num = typeof value === "string" ? parseFloat(value) : value;
  return `${num.toFixed(2)}%`;
}
__name(formatPercent$1, "formatPercent$1");
function formatDate$1(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString();
}
__name(formatDate$1, "formatDate$1");
function InfoRow({ label, value }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 1 }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: 11, opacity: 0.7 }, children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: 13 }, children: value != null && value !== "" ? value : "—" })
  ] });
}
__name(InfoRow, "InfoRow");
function ScanAISummaryPanel({ summary }) {
  if (!summary) return null;
  const {
    isPackagedProduct,
    matchConfidence,
    matchedStrainName,
    estimateConfidenceLabel,
    estimateType,
    notes,
    scanType = "bud",
    stabilityLabel = "single-frame",
    numberOfFrames = 1,
    label = {}
  } = summary;
  const {
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
    originType
  } = label;
  const confidenceText = estimateConfidenceLabel || (matchConfidence != null ? `${Math.round(
    matchConfidence <= 1 ? matchConfidence * 100 : matchConfidence
  )}% match` : "Unknown");
  const effectiveEstimateType = estimateType || (isPackagedProduct ? "visual+label" : "visual-only");
  const showLabelBlock = isPackagedProduct || Boolean(
    productName || brandName || thcPercent != null || cbdPercent != null || thcaPercent != null
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      style: {
        marginTop: 16,
        marginBottom: 16,
        padding: 16,
        borderRadius: 24,
        background: "linear-gradient(145deg, rgba(5,20,10,0.96), rgba(5,35,15,0.96))",
        color: "#f5fff5",
        backdropFilter: "blur(12px)"
      },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            style: {
              marginBottom: 12,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              flexWrap: "wrap",
              gap: 8
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "div",
                  {
                    style: {
                      textTransform: "uppercase",
                      fontSize: 11,
                      letterSpacing: 1.2,
                      opacity: 0.7
                    },
                    children: "AI scan summary"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: 14, opacity: 0.8 }, children: [
                  confidenceText,
                  matchConfidence != null && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    " ",
                    "•",
                    " ",
                    Math.round(
                      matchConfidence <= 1 ? matchConfidence * 100 : matchConfidence
                    ),
                    "%"
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "div",
                  {
                    style: {
                      fontSize: 11,
                      opacity: 0.7,
                      marginTop: 4,
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap"
                    },
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                        "Scan type: ",
                        scanType === "package" ? "Packaged product" : scanType === "bud" ? "Loose flower" : "Live plant"
                      ] }),
                      numberOfFrames > 1 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "•" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                          numberOfFrames,
                          "-angle scan"
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "•" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                          "Stability: ",
                          stabilityLabel === "high" ? "High" : stabilityLabel === "medium" ? "Medium" : "Low",
                          stabilityLabel === "low" && " (angles disagree, consider rescanning)",
                          stabilityLabel === "medium" && " (angles partly agree)"
                        ] })
                      ] }),
                      numberOfFrames === 1 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "•" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Single-frame scan. Add more angles in future updates for higher stability." })
                      ] })
                    ]
                  }
                )
              ] }),
              matchedStrainName && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  style: {
                    fontSize: 13,
                    padding: "4px 10px",
                    borderRadius: 999,
                    border: "1px solid rgba(180,255,190,0.3)",
                    textAlign: "right"
                  },
                  children: [
                    "Closest match: ",
                    /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: matchedStrainName })
                  ]
                }
              )
            ]
          }
        ),
        scanType === "package" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            style: {
              marginBottom: 16,
              padding: 12,
              borderRadius: 16,
              background: "linear-gradient(135deg, rgba(40,80,30,0.9), rgba(15,40,20,0.95))",
              border: "1px solid rgba(200,255,200,0.18)",
              fontSize: 13,
              lineHeight: 1.4
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  style: {
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    opacity: 0.7,
                    marginBottom: 4
                  },
                  children: "Packaged product detected"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: "This scan looks like a packaged retail product. THC/CBD and label details were read and combined with visual features." })
            ]
          }
        ),
        scanType === "bud" && !isPackagedProduct && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            style: {
              marginBottom: 16,
              padding: 12,
              borderRadius: 16,
              background: "linear-gradient(135deg, rgba(30,60,25,0.9), rgba(10,30,15,0.95))",
              border: "1px solid rgba(180,240,180,0.18)",
              fontSize: 13,
              lineHeight: 1.4
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  style: {
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    opacity: 0.7,
                    marginBottom: 4
                  },
                  children: "Loose flower detected"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: "This looks like loose flower. The estimate is based mostly on visual structure (buds, trichomes, coloration)." })
            ]
          }
        ),
        scanType === "plant" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            style: {
              marginBottom: 16,
              padding: 12,
              borderRadius: 16,
              background: "linear-gradient(135deg, rgba(25,50,20,0.9), rgba(8,25,12,0.95))",
              border: "1px solid rgba(160,220,160,0.18)",
              fontSize: 13,
              lineHeight: 1.4
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  style: {
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    opacity: 0.7,
                    marginBottom: 4
                  },
                  children: "Live plant detected"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: "This appears to be a live plant shot. Estimates for live plants are usually less precise than packaged/bud scans." })
            ]
          }
        ),
        showLabelBlock && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginBottom: 18 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              style: {
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: 1,
                opacity: 0.7,
                marginBottom: 6
              },
              children: "Label decode"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              style: {
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
                gap: 8,
                fontSize: 13
              },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(InfoRow, { label: "Product name", value: productName }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(InfoRow, { label: "Brand", value: brandName }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  InfoRow,
                  {
                    label: "Package type",
                    value: packageType || (isPackagedProduct ? "Packaged product" : "—")
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(InfoRow, { label: "Package size", value: packageSize }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(InfoRow, { label: "THC on label", value: formatPercent$1(thcPercent) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(InfoRow, { label: "CBD on label", value: formatPercent$1(cbdPercent) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(InfoRow, { label: "THCA on label", value: formatPercent$1(thcaPercent) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(InfoRow, { label: "Batch / Lot", value: batchId || lotNumber }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(InfoRow, { label: "Harvest date", value: formatDate$1(harvestDate) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(InfoRow, { label: "Test date", value: formatDate$1(testDate) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(InfoRow, { label: "Lab", value: labName }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(InfoRow, { label: "License #", value: licenseNumber })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginBottom: 18 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              style: {
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: 1,
                opacity: 0.7,
                marginBottom: 6
              },
              children: "How this estimate was made"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "p",
            {
              style: {
                fontSize: 13,
                lineHeight: 1.5,
                margin: 0,
                opacity: 0.9
              },
              children: [
                effectiveEstimateType === "visual+label" && /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: "This estimate combines what the AI sees in the plant/packaging (color, structure, visual features) with text decoded from the label (THC/CBD numbers, brand, product name)." }),
                effectiveEstimateType === "label-only" && /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: "This estimate relies mainly on the label text (THC/CBD numbers, product name, brand). Visual features had little or no impact." }),
                effectiveEstimateType === "visual-only" && /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: "No reliable label text was found. This estimate is based mainly on visual features and should be treated as an educated guess." })
              ]
            }
          ),
          numberOfFrames > 1 && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "p",
            {
              style: {
                fontSize: 13,
                lineHeight: 1.5,
                marginTop: 8,
                opacity: 0.85
              },
              children: [
                stabilityLabel === "high" && /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: "Results were consistent across multiple angles of the same product." }),
                stabilityLabel === "medium" && /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: "Results were mostly consistent across angles, with some variation." }),
                stabilityLabel === "low" && /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: "Different angles gave conflicting signals. Consider rescanning with clearer shots of the bud/label." })
              ]
            }
          ),
          notes && /* @__PURE__ */ jsxRuntimeExports.jsx(
            "p",
            {
              style: {
                fontSize: 13,
                lineHeight: 1.5,
                marginTop: 8,
                opacity: 0.85
              },
              children: notes
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            style: {
              marginBottom: 14,
              padding: 12,
              borderRadius: 16,
              background: "rgba(10, 40, 15, 0.9)",
              border: "1px solid rgba(130, 220, 150, 0.35)"
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  style: {
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    opacity: 0.8,
                    marginBottom: 4
                  },
                  children: "For dispensaries"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "ul",
                {
                  style: {
                    paddingLeft: 16,
                    margin: 0,
                    fontSize: 13,
                    lineHeight: 1.45
                  },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
                      "Use the ",
                      /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "THC/CBD on label" }),
                      " values above to verify they match your menu and label requirements."
                    ] }),
                    brandName && /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
                      "Confirm this product is listed under",
                      " ",
                      /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: brandName }),
                      " in your POS / menu system."
                    ] }),
                    licenseNumber && /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
                      "Check that license ",
                      /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: licenseNumber }),
                      " is valid for the product's origin."
                    ] }),
                    batchId || lotNumber ? /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
                      "Record batch/lot ID ",
                      /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: batchId || lotNumber }),
                      " for traceability and recall audits."
                    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
                      "Consider recording ",
                      /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "batch / lot ID" }),
                      " for traceability, if present on the physical label."
                    ] }),
                    isPackagedProduct ? /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
                      "This scan looks like a ",
                      /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "ready-for-sale package" }),
                      ". Use it to support intake checks and compliance reviews."
                    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
                      "This scan does ",
                      /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "not" }),
                      " look like a full retail package. Treat this as a visual estimate only, not a compliance check."
                    ] })
                  ]
                }
              )
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            style: {
              padding: 12,
              borderRadius: 16,
              background: "rgba(5, 35, 15, 0.9)",
              border: "1px solid rgba(110, 200, 140, 0.3)"
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  style: {
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    opacity: 0.8,
                    marginBottom: 4
                  },
                  children: "For growers"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "ul",
                {
                  style: {
                    paddingLeft: 16,
                    margin: 0,
                    fontSize: 13,
                    lineHeight: 1.45
                  },
                  children: [
                    matchedStrainName ? /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
                      "Visual / label features are closest to",
                      " ",
                      /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: matchedStrainName }),
                      ". Use this as a reference when tracking phenotype consistency across batches."
                    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Use this estimate as a starting point when comparing phenotypes or dialing in new genetics." }),
                    thcPercent != null && /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
                      "Label THC: ",
                      /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: formatPercent$1(thcPercent) }),
                      ". Compare this to your historical averages for this strain or batch."
                    ] }),
                    thcaPercent != null && /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
                      "Label THCA: ",
                      /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: formatPercent$1(thcaPercent) }),
                      ". Use this alongside THC and CBD to track decarb and curing results."
                    ] }),
                    originType && /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
                      "Origin detected as: ",
                      /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: originType }),
                      ". Keep this consistent between your internal records and packaging."
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
                      "Future versions of StrainSpotter can add",
                      " ",
                      /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "terpene profiles" }),
                      " and grow notes once lab data is linked to this product."
                    ] })
                  ]
                }
              )
            ]
          }
        )
      ]
    }
  );
}
__name(ScanAISummaryPanel, "ScanAISummaryPanel");
function normalizeTags(raw) {
  if (!raw) return [];
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    if (typeof item === "string") return item.trim();
    if (item && typeof item === "object") {
      if ("name" in item && "percent" in item) {
        const pct = typeof item.percent === "number" ? Math.round(item.percent) : item.percent;
        if (item.name && pct != null && pct !== "") {
          return `${item.name} (${pct}%)`;
        }
        if (item.name) return String(item.name);
      }
      if ("name" in item && item.name) return String(item.name);
      if ("label" in item && item.label) return String(item.label);
      if ("value" in item && item.value) return String(item.value);
    }
    return null;
  }).filter(Boolean);
}
__name(normalizeTags, "normalizeTags");
function StrainResultCard({ matchedStrain, scan }) {
  if (!matchedStrain) return null;
  const name = matchedStrain.name || "Unknown strain";
  const type = normalizeType(matchedStrain.type);
  const thc = formatPercent(matchedStrain.thc);
  const cbd = formatPercent(matchedStrain.cbd);
  const rawEffects = matchedStrain.effects || null;
  const rawFlavors = matchedStrain.flavors || null;
  const effectsArray = toArray(rawEffects);
  const flavorsArray = toArray(rawFlavors);
  const effects = normalizeTags(effectsArray);
  const flavors = normalizeTags(flavorsArray);
  const lineage = matchedStrain.lineage || "";
  const createdAt = scan?.created_at || scan?.createdAt || null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      style: {
        marginTop: "1.25rem",
        marginBottom: "0.5rem",
        padding: "1.1rem 1.0rem",
        borderRadius: "1rem",
        border: "1px solid rgba(76, 175, 80, 0.55)",
        background: "radial-gradient(circle at 0% 0%, rgba(178,255,89,0.18), transparent 60%), linear-gradient(145deg, rgba(5,10,5,0.98), rgba(16,30,16,0.98))",
        color: "#e8ffe1",
        boxShadow: "0 16px 40px rgba(0,0,0,0.55)",
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif'
      },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            style: {
              display: "flex",
              gap: "0.75rem",
              alignItems: "flex-start",
              justifyContent: "space-between",
              marginBottom: "0.75rem"
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { minWidth: 0, flex: 1 }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "div",
                  {
                    style: {
                      fontSize: "0.78rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.12em",
                      opacity: 0.75,
                      marginBottom: "0.15rem"
                    },
                    children: "Scan result"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "div",
                  {
                    style: {
                      fontSize: "1.25rem",
                      fontWeight: 650,
                      lineHeight: 1.2,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    },
                    children: name
                  }
                ),
                lineage && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "div",
                  {
                    style: {
                      fontSize: "0.8rem",
                      opacity: 0.75,
                      marginTop: "0.2rem"
                    },
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { opacity: 0.65 }, children: "Lineage: " }),
                      lineage
                    ]
                  }
                ),
                createdAt && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "div",
                  {
                    style: {
                      fontSize: "0.72rem",
                      opacity: 0.65,
                      marginTop: "0.2rem"
                    },
                    children: [
                      "Scanned on ",
                      formatDate(createdAt)
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  style: {
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.35rem",
                    alignItems: "flex-end"
                  },
                  children: [
                    type && /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "span",
                      {
                        style: {
                          fontSize: "0.7rem",
                          padding: "0.24rem 0.6rem",
                          borderRadius: 999,
                          border: "1px solid rgba(178,255,89,0.8)",
                          backgroundColor: "rgba(12,25,12,0.95)",
                          textTransform: "uppercase",
                          letterSpacing: "0.11em"
                        },
                        children: type
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "div",
                      {
                        style: {
                          display: "flex",
                          gap: "0.25rem",
                          fontSize: "0.78rem",
                          opacity: 0.88
                        },
                        children: [
                          thc && /* @__PURE__ */ jsxRuntimeExports.jsx(MiniStat, { label: "THC", value: thc, highlight: "rgba(255,255,255,0.08)" }),
                          cbd && /* @__PURE__ */ jsxRuntimeExports.jsx(MiniStat, { label: "CBD", value: cbd, highlight: "rgba(255,255,255,0.04)" })
                        ]
                      }
                    )
                  ]
                }
              )
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            style: {
              display: "flex",
              flexWrap: "wrap",
              gap: "0.75rem"
            },
            children: [
              effects.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(TagSection, { title: "Typical effects", items: effects, tone: "effects" }),
              flavors.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(TagSection, { title: "Common flavors", items: flavors, tone: "flavors" })
            ]
          }
        )
      ]
    }
  );
}
__name(StrainResultCard, "StrainResultCard");
function MiniStat({ label, value, highlight }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      style: {
        padding: "0.22rem 0.45rem",
        borderRadius: "0.55rem",
        backgroundColor: highlight,
        border: "1px solid rgba(190, 220, 190, 0.5)",
        minWidth: 44,
        textAlign: "center"
      },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            style: {
              fontSize: "0.62rem",
              textTransform: "uppercase",
              opacity: 0.7,
              letterSpacing: "0.09em"
            },
            children: label
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            style: {
              fontSize: "0.8rem",
              fontWeight: 600
            },
            children: value
          }
        )
      ]
    }
  );
}
__name(MiniStat, "MiniStat");
function TagSection({ title, items, tone }) {
  const safeItems = Array.isArray(items) ? items : [];
  const cleaned = safeItems.map((item) => {
    if (typeof item === "string") return item;
    if (item && typeof item === "object") {
      if ("name" in item) return String(item.name);
      if ("label" in item) return String(item.label);
      if ("value" in item) return String(item.value);
    }
    return null;
  }).filter(Boolean);
  if (cleaned.length === 0) return null;
  const palette = tone === "flavors" ? {
    chipBg: "rgba(255, 248, 225, 0.06)",
    chipBorder: "1px solid rgba(255, 236, 179, 0.7)",
    chipText: "#fff8e1",
    titleColor: "#fff9c4"
  } : {
    chipBg: "rgba(178, 255, 89, 0.08)",
    chipBorder: "1px solid rgba(200, 255, 140, 0.85)",
    chipText: "#e8ffca",
    titleColor: "#e8f5e9"
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { minWidth: 0 }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        style: {
          fontSize: "0.78rem",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          opacity: 0.8,
          marginBottom: "0.25rem",
          color: palette.titleColor
        },
        children: title
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        style: {
          display: "flex",
          flexWrap: "wrap",
          gap: "0.3rem"
        },
        children: cleaned.map((item, idx) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            style: {
              fontSize: "0.76rem",
              padding: "0.2rem 0.55rem",
              borderRadius: 999,
              backgroundColor: palette.chipBg,
              border: palette.chipBorder,
              color: palette.chipText,
              maxWidth: "100%"
            },
            children: item
          },
          `${title}-${idx}`
        ))
      }
    )
  ] });
}
__name(TagSection, "TagSection");
function toArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string") {
    return value.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
}
__name(toArray, "toArray");
function formatPercent(raw) {
  if (raw === null || raw === void 0) return null;
  const num = Number(raw);
  if (!Number.isFinite(num)) return null;
  if (num === 0) return "0%";
  if (num > 0 && num <= 1) return `${(num * 100).toFixed(1)}%`;
  if (num > 1 && num < 100) return `${num.toFixed(1)}%`;
  return `${num}%`;
}
__name(formatPercent, "formatPercent");
function normalizeType(type) {
  if (!type || typeof type !== "string") return null;
  const lower = type.toLowerCase();
  if (lower.includes("indica") && lower.includes("sativa")) return "Hybrid";
  if (lower.includes("indica")) return "Indica";
  if (lower.includes("sativa")) return "Sativa";
  if (lower.includes("hybrid")) return "Hybrid";
  return type.charAt(0).toUpperCase() + type.slice(1);
}
__name(normalizeType, "normalizeType");
function formatDate(value) {
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString(void 0, {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  } catch {
    return "";
  }
}
__name(formatDate, "formatDate");
async function resizeImageToBase64(file, maxWidth = 1280, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Failed to create blob"));
          const reader = new FileReader();
          reader.onloadend = () => {
            const dataUrl = reader.result || "";
            const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
            URL.revokeObjectURL(img.src);
            resolve({ base64, contentType: "image/jpeg" });
          };
          reader.onerror = () => {
            URL.revokeObjectURL(img.src);
            reject(new Error("Failed to read blob"));
          };
          reader.readAsDataURL(blob);
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error("Failed to load image"));
    };
    img.src = URL.createObjectURL(file);
  });
}
__name(resizeImageToBase64, "resizeImageToBase64");
const GUEST_LIMIT = 20;
function getGuestScansUsed() {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem("ss_guest_scans_used");
  const n = raw ? parseInt(raw, 10) : 0;
  return Number.isFinite(n) && n > 0 ? n : 0;
}
__name(getGuestScansUsed, "getGuestScansUsed");
function setGuestScansUsed(n) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("ss_guest_scans_used", String(n));
}
__name(setGuestScansUsed, "setGuestScansUsed");
function apiUrl(path) {
  if (!path.startsWith("/")) path = `/${path}`;
  return `${API_BASE}${path}`;
}
__name(apiUrl, "apiUrl");
function ScanPage({ onBack, onNavigate, onScanComplete }) {
  const { user } = useAuth();
  const {
    isMember,
    starterRemaining,
    memberRemaining,
    memberCap,
    extraCredits,
    totalAvailableScans,
    starterCap,
    registerScanConsumed
  } = useMembership();
  useProMode();
  const { canScan: canScanFromHook, isFounder, remainingScans: remainingScansFromHook } = useCanScan();
  const { summary: creditSummary } = useCreditBalance?.() ?? {};
  const hasUnlimited = isFounder || Boolean(creditSummary?.unlimited || creditSummary?.isUnlimited || creditSummary?.membershipTier === "founder_unlimited" || creditSummary?.tier === "admin");
  const email = user?.email ?? null;
  const isGuest = !user;
  reactExports.useEffect(() => {
    console.log("[FounderDebug]", {
      email,
      isFounder,
      canScan: canScanFromHook,
      remainingScans: remainingScansFromHook
    });
  }, [email, isFounder, canScanFromHook, remainingScansFromHook]);
  const [selectedFile, setSelectedFile] = reactExports.useState(null);
  const [previewUrl, setPreviewUrl] = reactExports.useState(null);
  const [isUploading, setIsUploading] = reactExports.useState(false);
  const [isPolling, setIsPolling] = reactExports.useState(false);
  const [isOpeningPicker, setIsOpeningPicker] = reactExports.useState(false);
  const [isChoosingFile, setIsChoosingFile] = reactExports.useState(false);
  const [scanResult, setScanResult] = reactExports.useState(null);
  const [error, setError] = reactExports.useState(null);
  const [hasCompletedScan, setHasCompletedScan] = reactExports.useState(false);
  const [guestScansUsed, setGuestScansUsedState] = reactExports.useState(() => getGuestScansUsed());
  const [showPlans, setShowPlans] = reactExports.useState(false);
  const [capturedFrames, setCapturedFrames] = reactExports.useState([]);
  const [multiAngleMode, setMultiAngleMode] = reactExports.useState(false);
  const MAX_FRAMES = 3;
  const canScan = canScanFromHook ?? (isFounder || hasUnlimited || totalAvailableScans > 0);
  const [scanPhase, setScanPhase] = reactExports.useState("camera-loading");
  const [statusMessage, setStatusMessage] = reactExports.useState("Opening scanner…");
  const [scanStatus, setScanStatus] = reactExports.useState({
    phase: "idle",
    message: "",
    details: ""
  });
  const [scanProgress, setScanProgress] = reactExports.useState(null);
  const [scanError, setScanError] = reactExports.useState(null);
  const [currentScanId, setCurrentScanId] = reactExports.useState(null);
  const scanIdRef = reactExports.useRef(null);
  const [cameraReady, setCameraReady] = reactExports.useState(false);
  const [lastPhotoUrl, setLastPhotoUrl] = reactExports.useState(null);
  const [framePulsing, setFramePulsing] = reactExports.useState(false);
  const [activeScanView, setActiveScanView] = reactExports.useState("scanner");
  const [completedScan, setCompletedScan] = reactExports.useState(null);
  const [selectedScanId, setSelectedScanId] = reactExports.useState(null);
  const processedScanIdsRef = reactExports.useRef(/* @__PURE__ */ new Set());
  const hasCompletedScanRef = reactExports.useRef(false);
  reactExports.useEffect(() => {
    setScanPhase("camera-loading");
    setStatusMessage("Opening scanner…");
    const t = setTimeout(() => {
      setCameraReady(true);
      setScanPhase("ready");
      setStatusMessage("Take or choose a photo of any weed product or packaging.");
    }, 200);
    return () => clearTimeout(t);
  }, []);
  reactExports.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      if (lastPhotoUrl) {
        URL.revokeObjectURL(lastPhotoUrl);
      }
      capturedFrames.forEach((frame) => {
        if (frame.previewUrl) {
          URL.revokeObjectURL(frame.previewUrl);
        }
      });
    };
  }, []);
  reactExports.useEffect(() => {
    if (scanPhase === "done" && completedScan) {
      const cleanupTimer = setTimeout(() => {
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl(null);
        }
        if (lastPhotoUrl) {
          URL.revokeObjectURL(lastPhotoUrl);
          setLastPhotoUrl(null);
        }
      }, 2e3);
      return () => clearTimeout(cleanupTimer);
    }
  }, [scanPhase, completedScan]);
  const handleBack = /* @__PURE__ */ __name(() => {
    if (onBack) onBack();
  }, "handleBack");
  const resetScan = /* @__PURE__ */ __name(() => {
    setError(null);
    setScanError(null);
    setScanPhase("ready");
    setStatusMessage("Take or choose a photo of the product or packaging.");
    setScanStatus({
      phase: "idle",
      message: "Ready to scan.",
      details: ""
    });
    setSelectedFile(null);
    setPreviewUrl(null);
    setLastPhotoUrl(null);
    setScanResult(null);
    setIsUploading(false);
    setIsPolling(false);
    setActiveScanView("scanner");
    setCompletedScan(null);
    setSelectedScanId(null);
    setHasCompletedScan(false);
    setCurrentScanId(null);
    hasCompletedScanRef.current = false;
    processedScanIdsRef.current.clear();
    setCapturedFrames([]);
    setMultiAngleMode(false);
  }, "resetScan");
  const handleStartMultiAngleScan = /* @__PURE__ */ __name(async () => {
    if (capturedFrames.length === 0) {
      setError("Please capture at least one photo");
      return;
    }
    await startScan(capturedFrames[0].file);
  }, "handleStartMultiAngleScan");
  const toggleMultiAngleMode = /* @__PURE__ */ __name(() => {
    setMultiAngleMode(!multiAngleMode);
    setCapturedFrames([]);
    setSelectedFile(null);
    setPreviewUrl(null);
    if (!multiAngleMode) {
      setStatusMessage("Step 1/3: Capture the product from the front / top");
    } else {
      setStatusMessage("Take or choose a photo of the product or packaging.");
    }
  }, "toggleMultiAngleMode");
  const handleScanAgain = /* @__PURE__ */ __name(() => {
    resetScan();
  }, "handleScanAgain");
  const handleBackToHome = /* @__PURE__ */ __name(() => {
    setActiveScanView("scanner");
  }, "handleBackToHome");
  const handleScanCompleted = React.useCallback(
    (scan) => {
      if (!scan || !scan.id) {
        console.warn("[SCAN] handleScanCompleted called with invalid scan", scan);
        return;
      }
      if (onScanComplete && typeof onScanComplete === "function") {
        onScanComplete(scan);
        return;
      }
      console.log("[SCAN] Completed, going to result page", scan.id);
      setSelectedScanId(scan.id);
      setActiveScanView("result");
    },
    []
    // No dependencies needed
  );
  const startScanForFile = /* @__PURE__ */ __name(async (file) => {
    if (!file) {
      setError("Choose a photo first.");
      return;
    }
    if (isGuest && guestScansUsed >= GUEST_LIMIT) {
      setShowPlans(true);
      return;
    }
    setError(null);
    setScanResult(null);
    await startScan(file);
  }, "startScanForFile");
  const handleFileChange = /* @__PURE__ */ __name((event) => {
    setIsOpeningPicker(false);
    setIsChoosingFile(false);
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    setScanResult(null);
    const previewUrl2 = URL.createObjectURL(file);
    setPreviewUrl(previewUrl2);
    setLastPhotoUrl((oldUrl) => {
      if (oldUrl) URL.revokeObjectURL(oldUrl);
      return previewUrl2;
    });
    setFramePulsing(true);
    if (multiAngleMode && capturedFrames.length < MAX_FRAMES) {
      const newFrame = { file, previewUrl: previewUrl2 };
      const updatedFrames = [...capturedFrames, newFrame];
      setCapturedFrames(updatedFrames);
      if (updatedFrames.length >= MAX_FRAMES) {
        setStatusMessage(`All ${MAX_FRAMES} photos captured. Ready to scan.`);
        setScanPhase("ready");
      } else {
        const step = updatedFrames.length + 1;
        const instructions = [
          "Capture the product from the front / top",
          "Capture from a side angle",
          "Capture a close-up of the bud/label"
        ];
        setStatusMessage(`Step ${step}/${MAX_FRAMES}: ${instructions[step - 1]}`);
        setScanPhase("ready");
      }
    } else {
      setSelectedFile(file);
      setIsUploading(false);
      setIsPolling(false);
      setScanPhase("capturing");
      setStatusMessage("Preparing image…");
      startScanForFile(file);
    }
    event.target.value = "";
  }, "handleFileChange");
  const handlePickImageClick = /* @__PURE__ */ __name(() => {
    const input = document.getElementById("scan-file-input");
    if (!input) return;
    setIsOpeningPicker(true);
    input.click();
  }, "handlePickImageClick");
  const handleChoosePhotoClick = /* @__PURE__ */ __name(() => {
    const input = document.getElementById("scan-file-input");
    if (!input) return;
    setIsChoosingFile(true);
    input.click();
    setTimeout(() => {
      setIsChoosingFile(false);
    }, 800);
  }, "handleChoosePhotoClick");
  const handleStartScan = /* @__PURE__ */ __name(async () => {
    await startScanForFile(selectedFile);
  }, "handleStartScan");
  async function startScan(file) {
    if (!isFounder && !canScan) {
      setError(
        `You're out of scans. Members get ${memberCap} scans included; you can also top up scan packs any time.`
      );
      return;
    }
    try {
      setError(null);
      setScanError(null);
      setCurrentScanId(null);
      setScanPhase("capturing");
      setScanProgress(5);
      setStatusMessage("Preparing image…");
      setScanStatus({
        phase: "uploading",
        message: "Preparing your scan...",
        details: ""
      });
      setScanPhase("uploading");
      setScanProgress(15);
      setStatusMessage("Resizing image for faster upload…");
      setScanStatus({
        phase: "uploading",
        message: "Securely uploading your photo to our servers…",
        details: "We compress and encrypt your image for fast, secure processing."
      });
      console.time("[Scanner] image-compression");
      const { base64, contentType } = await resizeImageToBase64(file, 1280, 0.7);
      console.timeEnd("[Scanner] image-compression");
      setScanProgress(40);
      setStatusMessage("Uploading image…");
      setScanStatus({
        phase: "uploading",
        message: "Securely uploading your photo to our servers…",
        details: "We compress and encrypt your image for fast, secure processing."
      });
      const payload = {
        filename: file.name || "scan.jpg",
        contentType: contentType || "image/jpeg",
        base64
      };
      console.time("[Scanner] upload");
      const res = await fetch(apiUrl("/api/uploads"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      console.timeEnd("[Scanner] upload");
      const data = await safeJson(res);
      if (!res.ok) {
        if (res.status === 403 && data?.error === "Guest scan limit reached") {
          setShowPlans(true);
          setIsUploading(false);
          setIsPolling(false);
          setScanPhase("error");
          setStatusMessage("Guest scan limit reached.");
          return;
        }
        let errorMessage = data?.error || data?.hint || `Upload failed (${res.status})`;
        if (res.status === 413 || errorMessage.includes("too large")) {
          errorMessage = "Image is too large. Try taking the photo a bit farther away or with lower resolution.";
        } else if (res.status === 400) {
          errorMessage = "Image problem (too large or wrong type). Try another photo.";
        } else if (res.status >= 500) {
          errorMessage = "Scan failed on the server. Try again in a moment.";
        }
        setScanPhase("error");
        throw new Error(errorMessage);
      }
      const scanId = data.id;
      console.log("[SCAN-ID] Received from backend", {
        scanId,
        responseData: data,
        hasId: !!data.id,
        hasScanId: !!data.scanId,
        hasScan_id: !!data.scan_id
      });
      if (!scanId) {
        console.error("[SCAN-ID] ERROR: No scan ID in backend response", {
          responseData: data,
          responseKeys: Object.keys(data || {})
        });
        setScanPhase("idle");
        setScanStatus({
          phase: "error",
          message: "Server did not return scan ID.",
          details: "Please try again."
        });
        throw new Error("Did not receive a scan id from the server.");
      }
      scanIdRef.current = scanId;
      setCurrentScanId(scanId);
      console.log("[SCAN-ID] Stored scan ID", { scanId, storedInRef: scanIdRef.current });
      setScanStatus({
        phase: "queued",
        message: "Scan received. Getting in line...",
        details: "Our AI is about to process your image."
      });
      if (!processedScanIdsRef.current.has(scanId)) {
        processedScanIdsRef.current.add(scanId);
        try {
          let frameImageUrls = [];
          if (multiAngleMode && capturedFrames.length > 1) {
            for (let i = 1; i < capturedFrames.length; i++) {
              const frame = capturedFrames[i];
              const { base64: frameBase64, contentType: frameContentType } = await resizeImageToBase64(frame.file, 1280, 0.7);
              const framePayload = {
                filename: frame.file.name || `frame-${i}.jpg`,
                contentType: frameContentType || "image/jpeg",
                base64: frameBase64
              };
              const frameRes = await fetch(apiUrl("/api/uploads"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(framePayload)
              });
              const frameData = await safeJson(frameRes);
              if (frameRes.ok && frameData.image_url) {
                frameImageUrls.push(frameData.image_url);
              }
            }
          }
          console.time("[Scanner] process-trigger");
          const processRes = await fetch(apiUrl(`/api/scans/${scanId}/process`), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ frameImageUrls })
          });
          console.timeEnd("[Scanner] process-trigger");
          if (!processRes.ok) {
            let errorData = {};
            try {
              errorData = await processRes.json();
            } catch (e) {
              console.warn("[startScan] Failed to parse error response", e);
            }
            console.error("[startScan] Process endpoint returned non-OK", {
              status: processRes.status,
              scanId,
              error: errorData?.error || errorData?.error?.message || "Unknown error",
              errorCode: errorData?.error?.code || null
            });
            setIsUploading(false);
            setIsPolling(false);
            setScanPhase("error");
            const errorMessage = errorData?.error?.message || errorData?.error || errorData?.message || `Server returned ${processRes.status}`;
            setScanError({
              type: "server",
              message: "We couldn't start this scan.",
              details: errorMessage + ". Please try again in a moment.",
              scanId: scanId || void 0
            });
            setScanStatus({
              phase: "error",
              message: "Scan start failed.",
              details: "Our AI couldn't begin processing your image."
            });
            setError("We couldn't start this scan. Please try again in a moment.");
            setStatusMessage("Scan start failed. Please try again.");
            return;
          }
        } catch (e) {
          console.error("[startScan] Error triggering scan processing", {
            error: e,
            scanId,
            message: e?.message || String(e)
          });
          setIsUploading(false);
          setIsPolling(false);
          setScanPhase("error");
          setScanError({
            type: "server",
            message: "We couldn't start this scan.",
            details: e?.message || "Failed to start scan processing. Please try again.",
            scanId: scanId || void 0
          });
          setScanStatus({
            phase: "error",
            message: "Scan start failed.",
            details: "Our AI couldn't begin processing your image."
          });
          setError("We couldn't start this scan. Please try again in a moment.");
          setStatusMessage("Scan start failed. Please try again.");
          return;
        }
      }
      setIsUploading(false);
      setIsPolling(true);
      setScanPhase("processing");
      setScanProgress(60);
      setStatusMessage("Processing image with Vision API…");
      setScanStatus({
        phase: "processing",
        message: "Extracting text and visual features…",
        details: "Running Google Vision AI to read labels and analyze your photo."
      });
      setHasCompletedScan(false);
      hasCompletedScanRef.current = false;
      const timeoutId = setTimeout(() => {
        if (!hasCompletedScanRef.current) {
          console.warn("[Scanner] Scan timed out", { scanId: currentScanId });
          setIsPolling(false);
          setScanPhase("error");
          setScanError({
            type: "timeout",
            message: "Our AI took longer than expected.",
            details: "This scan may still finish in the background. It's usually a temporary slowdown on the server or network.",
            scanId: currentScanId || void 0
          });
          setScanStatus({
            phase: "error",
            message: "Scan is taking longer than normal.",
            details: "You can try again now, or wait a bit and retry on a stronger connection."
          });
          setError("Our AI took longer than expected to finish this scan. Please try again in a moment.");
          setStatusMessage("Scan timed out. Please try again.");
        }
      }, 12e4);
      try {
        console.time("[Scanner] total-scan-time");
        await pollScan(scanId, 0, timeoutId);
        console.timeEnd("[Scanner] total-scan-time");
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (e) {
      console.error("[Scanner] startScan error", e);
      setIsUploading(false);
      setIsPolling(false);
      setHasCompletedScan(true);
      hasCompletedScanRef.current = true;
      setScanPhase("error");
      const errorMsg = String(e?.message || e || "");
      let userMessage = "We couldn't finish this scan. Please try again.";
      let errorType = "unknown";
      const isInternalError = /ReferenceError|TypeError|SyntaxError|hasCompletedScanRef|Can't find variable|is not defined/i.test(errorMsg);
      if (isInternalError) {
        console.error("[Scanner] Internal error detected, showing generic message:", errorMsg);
        userMessage = "We couldn't finish this scan. Please try again.";
        errorType = "client";
      } else {
        if (errorMsg.includes("413") || errorMsg.includes("too large") || errorMsg.includes("PayloadTooLargeError")) {
          userMessage = "Image is too large. Try taking the photo a bit farther away or with lower resolution.";
          errorType = "client";
        } else if (errorMsg.includes("400") || errorMsg.includes("Bad Request")) {
          userMessage = "Image problem (too large or wrong type). Try another photo.";
          errorType = "client";
        } else if (errorMsg.includes("Network") || errorMsg.includes("fetch") || errorMsg.includes("Failed to fetch") || /NetworkError|network/i.test(errorMsg)) {
          userMessage = "Network issue while scanning. Please check your connection and try again.";
          errorType = "network";
        } else if (errorMsg.includes("500") || errorMsg.includes("Internal Server Error")) {
          userMessage = "Scan failed on the server. Try again in a moment.";
          errorType = "server";
        } else if (errorMsg.includes("403") || errorMsg.includes("Guest scan limit")) {
          userMessage = "You've reached the guest scan limit. Sign up or upgrade to continue scanning.";
          errorType = "server";
        } else if (!errorMsg || errorMsg === "undefined" || errorMsg === "null") {
          userMessage = "Something went wrong. Please try again.";
          errorType = "unknown";
        }
      }
      setScanError({
        type: errorType,
        message: errorType === "network" ? "Network issue during scan." : errorType === "server" ? "Server couldn't finish your scan." : errorType === "client" ? "App had trouble reading the scan result." : "We couldn't finish this scan.",
        details: isInternalError ? "Internal error (see console)" : errorMsg,
        scanId: currentScanId || void 0
      });
      setScanStatus({
        phase: "error",
        message: errorType === "network" ? "Network issue." : errorType === "server" ? "Server error." : "Display error.",
        details: errorType === "network" ? "Check your connection and try again." : errorType === "server" ? "Our AI had trouble finishing this scan." : "We'll fix this in an update."
      });
      setError(userMessage);
      setStatusMessage(userMessage);
    }
  }
  __name(startScan, "startScan");
  async function pollScan(scanId, attempt = 0, timeoutRef = null) {
    const maxAttempts = 120;
    const delayMs = 1e3;
    const currentScanId2 = scanIdRef.current || scanId;
    if (!currentScanId2 || typeof currentScanId2 !== "string") {
      console.error("[POLL] ERROR: Invalid scanId", {
        scanId: currentScanId2,
        type: typeof currentScanId2,
        refScanId: scanIdRef.current,
        passedScanId: scanId
      });
      throw new Error(`Invalid scan ID: ${currentScanId2}`);
    }
    try {
      const progressPercent = Math.min(70 + attempt * 2, 95);
      setScanProgress(progressPercent);
      if (attempt === 0) {
        setScanStatus({
          phase: "processing",
          message: "Extracting text and visual features…",
          details: "Running Google Vision AI to read labels and analyze your photo."
        });
        setStatusMessage("Processing image with Vision API…");
      } else if (attempt < 5) {
        setScanStatus({
          phase: "processing",
          message: "Extracting text from label…",
          details: "Reading product information and batch numbers."
        });
        setStatusMessage("Extracting text from label…");
      } else if (attempt < 10) {
        setScanStatus({
          phase: "matching",
          message: "Searching our database of 35,000+ strains…",
          details: "Comparing visual features and text against our comprehensive strain library."
        });
      } else if (attempt < 20) {
        setScanStatus({
          phase: "analyzing",
          message: "Decoding label details and generating AI insights…",
          details: "Our AI extracts THC, CBD, effects, flavors, and warnings from the label."
        });
        setStatusMessage("Analyzing product details…");
      } else {
        setScanStatus({
          phase: "finalizing",
          message: "Compiling your complete strain breakdown…",
          details: "Combining all analyses into a comprehensive result card."
        });
        setStatusMessage("Finalizing results…");
      }
      if (attempt === 0) {
        console.time("[Scanner] polling");
        console.log("[POLL] Starting poll", {
          scanId: currentScanId2,
          passedScanId: scanId,
          refScanId: scanIdRef.current,
          maxAttempts,
          timeoutMs: maxAttempts * delayMs
        });
      }
      console.log("[POLL] Polling scanId", {
        attempt,
        scanId: currentScanId2,
        passedScanId: scanId,
        refScanId: scanIdRef.current
      });
      const url = `${API_BASE}/api/scans/${currentScanId2}`;
      console.log("[POLL] Fetching scan", { scanId: currentScanId2, url });
      const res = await fetch(url, {
        credentials: "include"
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "(no body)");
        console.error("[POLL] non-OK response", {
          scanId: currentScanId2,
          status: res.status,
          statusText: res.statusText,
          url,
          body
        });
        throw new Error(`pollScan non-OK: ${res.status}`);
      }
      const scan = await res.json();
      console.log("[POLL] raw scan data", { scanId: currentScanId2, scan });
      const isDone = scan.status === "completed" || scan.status === "failed" || !!scan.result || !!scan.ai_summary || !!scan.packaging_insights || !!scan.label_insights;
      if (isDone) {
        console.log("[POLL] Scan complete", {
          scanId: currentScanId2,
          status: scan.status,
          hasResult: !!scan.result,
          hasAISummary: !!scan.ai_summary,
          hasPackagingInsights: !!scan.packaging_insights,
          hasLabelInsights: !!scan.label_insights
        });
        if (timeoutRef) clearTimeout(timeoutRef);
        setIsPolling(false);
        setHasCompletedScan(true);
        hasCompletedScanRef.current = true;
        setScanProgress(100);
        setScanStatus({
          phase: "finalizing",
          message: "Compiling your complete strain breakdown…",
          details: "Combining all analyses into a comprehensive result card."
        });
        setTimeout(() => {
          setScanPhase("done");
          setStatusMessage("Scan complete!");
          setError(null);
          setScanError(null);
          setScanStatus({
            phase: "completed",
            message: "Scan complete.",
            details: ""
          });
          setScanProgress(null);
        }, 800);
        const normalized = normalizeScanResult(scan);
        const result = scan.result;
        if (normalized) {
          setScanResult(normalized);
        } else {
          setScanResult({
            topMatch: null,
            otherMatches: [],
            matches: [],
            matched_strain_slug: null,
            labelInsights: result?.labelInsights || null,
            aiSummary: result?.labelInsights?.aiSummary || null,
            isPackagedProduct: result?.labelInsights?.isPackagedProduct || false,
            packagingInsights: result?.packagingInsights || null,
            visionRaw: result?.vision_raw || null
          });
        }
        const processedResult = scan.result || normalized;
        const transformed = transformScanResult(scan);
        let matchedStrain = null;
        if (transformed && transformed.strainName && transformed.strainName !== "Cannabis (strain unknown)") {
          const packagingInsights = scan.packaging_insights || scan.result?.packagingInsights || null;
          const labelInsights = scan.label_insights || scan.result?.labelInsights || null;
          const lineage = packagingInsights?.lineage || labelInsights?.lineage || null;
          const type = packagingInsights?.basic?.type || labelInsights?.type || null;
          matchedStrain = {
            name: transformed.strainName,
            // CRITICAL: Use strainName from transformScanResult
            lineage: lineage || null,
            type: type || null,
            thc: transformed.thc || null,
            // Use thc from transformScanResult
            cbd: transformed.cbd || null,
            // Use cbd from transformScanResult
            // CRITICAL: Use effects/flavors from transformScanResult (single source of truth)
            effects: transformed.effectsTags || null,
            flavors: transformed.flavorTags || null
          };
        }
        const extractedVisionText = scan.visionText || result?.vision_raw?.textAnnotations?.[0]?.description || result?.vision_raw?.fullTextAnnotation?.text || result?.visionRaw?.textAnnotations?.[0]?.description || result?.visionRaw?.fullTextAnnotation?.text || null;
        setCompletedScan({
          id: scan.id,
          result: processedResult,
          created_at: scan.created_at || (/* @__PURE__ */ new Date()).toISOString(),
          ai_summary: scan.ai_summary || null,
          summary: scan.summary || null,
          matchedStrain: matchedStrain || null,
          visionText: extractedVisionText || null,
          matched_strain_slug: scan.matched_strain_slug || null,
          // Store transformed result for ScanResultCard (single source of truth)
          transformed: transformed || null
        });
        if (scan.status === "completed" && scan.id) {
          handleScanCompleted(scan);
        }
        if (!isMember) {
          registerScanConsumed();
          if (isGuest) {
            const used = guestScansUsed + 1;
            setGuestScansUsedState(used);
            setGuestScansUsed(used);
          }
        }
        return;
      }
      if (scan.status === "failed" || scan?.error) {
        console.error("[POLL] scan failed", {
          scanId: currentScanId2,
          attempt,
          status: scan.status,
          error: scan?.error
        });
        if (timeoutRef) clearTimeout(timeoutRef);
        setIsPolling(false);
        setHasCompletedScan(true);
        hasCompletedScanRef.current = true;
        setScanPhase("error");
        setFramePulsing(false);
        const errorMessage = scan?.error || scan?.errorMessage || "Scan failed on the server.";
        let userMessage = errorMessage;
        if (errorMessage.includes("Vision") || errorMessage.includes("OCR")) {
          userMessage = "Could not read text from the image. Try a clearer photo with better lighting.";
        } else if (errorMessage.includes("match") || errorMessage.includes("strain")) {
          userMessage = "Could not find a matching strain. Try a photo that shows the product label clearly.";
        } else if (errorMessage.includes("storage") || errorMessage.includes("bucket")) {
          userMessage = "Storage error. Please try again in a moment.";
        }
        setScanError({
          type: "server",
          message: "Server couldn't finish your scan.",
          details: errorMessage,
          scanId: scanId || currentScanId2 || void 0
        });
        setScanStatus({
          phase: "error",
          message: "Server error.",
          details: "Our AI had trouble finishing this scan."
        });
        setError(userMessage);
        setStatusMessage(userMessage);
        return;
      }
      if (attempt >= 120) {
        if (timeoutRef) clearTimeout(timeoutRef);
        setIsPolling(false);
        setHasCompletedScan(true);
        hasCompletedScanRef.current = true;
        setScanPhase("error");
        setFramePulsing(false);
        setScanError({
          type: "timeout",
          message: "Our AI took longer than expected.",
          details: "This scan may still finish in the background. It's usually a temporary slowdown on the server or network.",
          scanId: scanId || currentScanId2 || void 0
        });
        setScanStatus({
          phase: "error",
          message: "Scan is taking longer than normal.",
          details: "You can try again now, or wait a bit and retry on a stronger connection."
        });
        const timeoutError = "Our AI took longer than expected to finish this scan. Please try again in a moment.";
        setError(timeoutError);
        setStatusMessage(timeoutError);
        return;
      }
      setTimeout(() => {
        const nextScanId = scanIdRef.current || currentScanId2 || scanId;
        if (!nextScanId) {
          console.error("[POLL] ERROR: No scan ID available for next poll attempt", {
            attempt,
            scanId,
            currentScanId: currentScanId2,
            refScanId: scanIdRef.current
          });
          throw new Error("Scan ID lost during polling");
        }
        pollScan(nextScanId, attempt + 1, timeoutRef);
      }, delayMs);
    } catch (e) {
      if (timeoutRef) clearTimeout(timeoutRef);
      console.error("[Scanner] pollScan error", {
        scanId: currentScanId2,
        attempt,
        message: e?.message || String(e),
        name: e?.name || "Error",
        stack: e?.stack || null,
        error: e
      });
      setIsPolling(false);
      setHasCompletedScan(true);
      hasCompletedScanRef.current = true;
      setScanPhase("error");
      const errorMsg = String(e?.message || e || "");
      let userMessage = "We couldn't finish this scan. Please try again.";
      let errorType = "unknown";
      const isInternalError = /ReferenceError|TypeError|SyntaxError|hasCompletedScanRef|Can't find variable|is not defined/i.test(errorMsg);
      if (isInternalError) {
        console.error("[Scanner] Internal error detected, showing generic message:", errorMsg);
        userMessage = "We couldn't finish this scan. Please try again.";
        errorType = "client";
      } else {
        if (errorMsg.includes("404") || errorMsg.includes("not found")) {
          userMessage = "Scan not found. Please try scanning again.";
          errorType = "server";
        } else if (errorMsg.includes("500") || errorMsg.includes("Server error")) {
          userMessage = "Server error while processing scan. Please try again in a moment.";
          errorType = "server";
        } else if (errorMsg.includes("Network") || errorMsg.includes("fetch") || /NetworkError|network/i.test(errorMsg)) {
          userMessage = "Network issue while scanning. Please check your connection and try again.";
          errorType = "network";
        }
      }
      setScanError({
        type: errorType,
        message: errorType === "network" ? "Network issue during scan." : errorType === "server" ? "Server couldn't finish your scan." : "App had trouble reading the scan result.",
        details: isInternalError ? "Internal error (see console)" : errorMsg,
        scanId: scanId || currentScanId2 || void 0
      });
      setScanStatus({
        phase: "error",
        message: errorType === "network" ? "Network issue." : errorType === "server" ? "Server error." : "Display error.",
        details: errorType === "network" ? "Check your connection and try again." : errorType === "server" ? "Our AI had trouble finishing this scan." : "We'll fix this in an update."
      });
      setError(userMessage);
      setStatusMessage(userMessage);
      throw e;
    }
  }
  __name(pollScan, "pollScan");
  async function safeJson(res) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }
  __name(safeJson, "safeJson");
  if (activeScanView === "result" && completedScan) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Stack,
      {
        direction: "column",
        sx: {
          height: "100vh",
          overflow: "hidden",
          backgroundColor: "#050705",
          paddingTop: "calc(env(safe-area-inset-top) + 20px)",
          paddingBottom: "env(safe-area-inset-bottom)"
        },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Box,
            {
              sx: {
                flexShrink: 0,
                px: 2,
                pb: 1,
                maxWidth: "md",
                mx: "auto",
                width: "100%"
              },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { mb: 2, mt: 0, pt: 0, display: "flex", alignItems: "center" }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    IconButton,
                    {
                      onClick: handleBackToHome,
                      sx: {
                        mr: 1,
                        color: "#C5E1A5"
                      },
                      "aria-label": "Back to home",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowBackIcon, {})
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Typography,
                    {
                      variant: "subtitle2",
                      sx: { color: "#A5D6A7", fontWeight: 500 },
                      children: "Back to scanner"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { mb: 2 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Typography,
                  {
                    variant: "h5",
                    sx: {
                      color: "#F1F8E9",
                      fontWeight: 700,
                      mb: 0.5
                    },
                    children: "Scan result"
                  }
                ) })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Box,
            {
              sx: {
                flex: 1,
                minHeight: 0,
                overflowY: "auto",
                overflowX: "hidden",
                WebkitOverflowScrolling: "touch",
                position: "relative"
              },
              children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Box,
                {
                  sx: {
                    px: 2,
                    pb: 2,
                    maxWidth: "md",
                    mx: "auto",
                    width: "100%"
                  },
                  children: [
                    completedScan?.matchedStrain && /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { mb: 1 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                      StrainResultCard,
                      {
                        matchedStrain: completedScan.matchedStrain,
                        scan: completedScan
                      }
                    ) }),
                    !completedScan?.matchedStrain && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      Box,
                      {
                        sx: {
                          mb: 1.5,
                          p: 1,
                          borderRadius: 1.5,
                          border: "1px solid rgba(90, 130, 90, 0.7)",
                          background: "rgba(5, 10, 5, 0.96)",
                          color: "#d6f5d6",
                          fontSize: "0.84rem"
                        },
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            Typography,
                            {
                              variant: "overline",
                              sx: {
                                fontSize: "0.78rem",
                                letterSpacing: "0.08em",
                                opacity: 0.75,
                                mb: 0.5,
                                display: "block"
                              },
                              children: "Scan details"
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            Box,
                            {
                              component: "pre",
                              sx: {
                                margin: 0,
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-word",
                                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                                fontSize: "0.76rem",
                                opacity: 0.88
                              },
                              children: JSON.stringify(
                                {
                                  id: completedScan.id,
                                  matched_strain_slug: completedScan.matched_strain_slug,
                                  created_at: completedScan.created_at
                                },
                                null,
                                2
                              )
                            }
                          )
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      ScanResultCard,
                      {
                        scan: completedScan,
                        result: normalizeScanResult(completedScan),
                        onCorrectionSaved: /* @__PURE__ */ __name(() => {
                          console.log("[ScanResultCard] correction saved");
                        }, "onCorrectionSaved")
                      }
                    ),
                    completedScan?.summary && /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { mt: 2 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(ScanAISummaryPanel, { summary: completedScan.summary }) }),
                    completedScan?.ai_summary && !completedScan?.summary && /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { mt: 2 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                      ScanAISummaryPanel,
                      {
                        aiSummary: completedScan.ai_summary,
                        visionText: completedScan.visionText || null
                      }
                    ) }),
                    completedScan?.aiSummary && !completedScan?.summary && !completedScan?.ai_summary && /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { mt: 2 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(ScanAISummaryPanel, { summary: completedScan.aiSummary }) })
                  ]
                }
              )
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Box,
            {
              sx: {
                flexShrink: 0,
                p: 2,
                borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                background: "rgba(0, 0, 0, 0.3)",
                backdropFilter: "blur(12px)",
                maxWidth: "md",
                mx: "auto",
                width: "100%"
              },
              children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", spacing: 1.5, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    variant: "outlined",
                    fullWidth: true,
                    onClick: handleBackToHome,
                    sx: {
                      textTransform: "none",
                      borderColor: "rgba(197, 225, 165, 0.8)",
                      color: "#C5E1A5",
                      fontWeight: 500,
                      "&:hover": {
                        borderColor: "#CDDC39",
                        backgroundColor: "rgba(156, 204, 101, 0.08)"
                      }
                    },
                    children: "Back to scanner"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    variant: "contained",
                    fullWidth: true,
                    onClick: handleScanAgain,
                    sx: {
                      textTransform: "none",
                      backgroundColor: "#9CCC65",
                      color: "#050705",
                      fontWeight: 600,
                      "&:hover": {
                        backgroundColor: "#CDDC39"
                      }
                    },
                    children: "Scan again"
                  }
                )
              ] })
            }
          )
        ]
      }
    );
  }
  if (!cameraReady) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      Box,
      {
        sx: {
          minHeight: "100vh",
          width: "100%",
          backgroundColor: "#050705",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          zIndex: 1,
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)"
        },
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Paper,
          {
            elevation: 6,
            sx: {
              p: 4,
              borderRadius: 3,
              background: "rgba(12, 20, 12, 0.95)",
              border: "1px solid rgba(124, 179, 66, 0.6)",
              textAlign: "center",
              maxWidth: 320,
              pointerEvents: "auto"
            },
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 2, alignItems: "center", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CircularProgress, { size: 48, sx: { color: "#CDDC39" } }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", sx: { color: "#F1F8E9", fontWeight: 600 }, children: statusMessage || "Opening camera…" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "rgba(224, 242, 241, 0.8)" }, children: "Preparing scanner for you." })
            ] })
          }
        )
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Box,
    {
      sx: {
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        bgcolor: "#0a0f0a",
        // Clean, solid dark green background
        position: "relative"
      },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Box,
          {
            sx: {
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              paddingX: 2,
              paddingTop: 1.5,
              paddingBottom: 1.5,
              gap: 1.5,
              position: "relative",
              zIndex: 1
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                IconButton,
                {
                  edge: "start",
                  onClick: handleBack,
                  sx: { mr: 1, color: "#C5E1A5" },
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowBackIcon, {})
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { flex: 1 }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "subtitle2", sx: { color: "rgba(255,255,255,0.7)" }, children: "StrainSpotter" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", fontWeight: "600", sx: { color: "#fff" }, children: "Scan a package or bud" })
              ] })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Box,
          {
            sx: {
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
              px: 2,
              pb: 2,
              position: "relative",
              zIndex: 1,
              bgcolor: "transparent"
              // Transparent to show parent background
            },
            children: [
              scanStatus.phase !== "idle" && /* @__PURE__ */ jsxRuntimeExports.jsx(
                Box,
                {
                  sx: {
                    pt: 1,
                    pb: 1
                  },
                  children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Box,
                    {
                      sx: {
                        padding: "8px 12px",
                        borderRadius: "999px",
                        fontSize: 12,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        backgroundColor: scanStatus.phase === "error" ? "rgba(220, 53, 69, 0.12)" : scanStatus.phase === "completed" ? "rgba(25, 135, 84, 0.14)" : "rgba(15, 118, 110, 0.16)",
                        color: "#e5fbea",
                        border: scanStatus.phase === "error" ? "1px solid rgba(220, 53, 69, 0.3)" : "none"
                      },
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: 14 }, children: scanStatus.phase === "error" ? "⚠️" : scanStatus.phase === "completed" ? "✅" : "🔍" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { flex: 1 }, children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { fontWeight: 500, fontSize: 13 }, children: scanStatus.message || "Ready to scan." }),
                          scanStatus.details && /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { fontSize: 11, opacity: 0.8, mt: 0.25 }, children: scanStatus.details })
                        ] })
                      ]
                    }
                  )
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Container,
                {
                  maxWidth: "sm",
                  sx: {
                    px: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: 2
                  },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { mb: 2 }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }, children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { flex: 1 }, children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Typography,
                          {
                            variant: "h5",
                            sx: {
                              color: "#F1F8E9",
                              fontWeight: 700,
                              mb: 0.5
                            },
                            children: "Scan weed products"
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Typography,
                          {
                            variant: "body2",
                            sx: { color: "rgba(224, 242, 241, 0.9)" },
                            children: "Choose or take a photo of a cannabis product or bud. We'll analyze it and show you the closest strain matches."
                          }
                        )
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { textAlign: "right", ml: 2, minWidth: 160 }, children: isMember ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Typography,
                          {
                            variant: "caption",
                            sx: {
                              color: "rgba(163, 230, 186, 0.9)",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              letterSpacing: "0.08em"
                            },
                            children: "Member"
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs(
                          Typography,
                          {
                            variant: "body2",
                            sx: {
                              color: "rgba(255,255,255,0.9)",
                              fontWeight: 500
                            },
                            children: [
                              "Included scans: ",
                              memberCap - memberRemaining,
                              "/",
                              memberCap
                            ]
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs(
                          Typography,
                          {
                            variant: "caption",
                            sx: { color: "rgba(190, 242, 100, 0.9)" },
                            children: [
                              "Scans left: ",
                              totalAvailableScans,
                              extraCredits > 0 ? " (with top-ups)" : ""
                            ]
                          }
                        )
                      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs(
                          Typography,
                          {
                            variant: "caption",
                            sx: { color: "rgba(248, 250, 252, 0.7)" },
                            children: [
                              "Free starter scans used:",
                              " ",
                              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: starterCap - starterRemaining }),
                              " / ",
                              starterCap
                            ]
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs(
                          Typography,
                          {
                            variant: "body2",
                            sx: {
                              mt: 0.25,
                              color: totalAvailableScans === 0 ? "#fecaca" : totalAvailableScans <= 5 ? "#fde68a" : "#bbf7d0",
                              fontWeight: 600
                            },
                            children: [
                              "Scans available: ",
                              totalAvailableScans
                            ]
                          }
                        ),
                        extraCredits > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                          Typography,
                          {
                            variant: "caption",
                            sx: { color: "rgba(190, 242, 100, 0.9)" },
                            children: [
                              "Includes ",
                              extraCredits,
                              " top-up scans"
                            ]
                          }
                        )
                      ] }) })
                    ] }) }),
                    user && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      Typography,
                      {
                        variant: "caption",
                        sx: { color: "#9CCC65", mb: 1.5 },
                        children: [
                          "Signed in as ",
                          user.email,
                          ". Your scans will be saved to your account."
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Paper,
                      {
                        elevation: 6,
                        sx: {
                          p: 2.5,
                          borderRadius: 3,
                          background: "rgba(12, 20, 12, 0.95)",
                          border: "1px solid rgba(124, 179, 66, 0.6)",
                          boxShadow: "0 18px 40px rgba(0, 0, 0, 0.7)",
                          mb: 3
                        },
                        children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 2, children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsxs(
                            Box,
                            {
                              sx: {
                                borderRadius: 2,
                                border: "2px dashed rgba(200, 230, 201, 0.5)",
                                minHeight: 200,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                overflow: "hidden",
                                background: "radial-gradient(circle at top, rgba(76, 175, 80, 0.15), rgba(0, 0, 0, 0.95))",
                                position: "relative",
                                animation: framePulsing ? "scan-pulse 1.4s infinite" : "none",
                                "@keyframes scan-pulse": {
                                  "0%": { boxShadow: "0 0 0 0 rgba(0, 255, 120, 0.5)" },
                                  "70%": { boxShadow: "0 0 0 12px rgba(0, 255, 120, 0)" },
                                  "100%": { boxShadow: "0 0 0 0 rgba(0, 255, 120, 0)" }
                                }
                              },
                              children: [
                                previewUrl ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                                  Box,
                                  {
                                    component: "img",
                                    src: previewUrl,
                                    alt: "Selected to scan",
                                    sx: { width: "100%", maxHeight: 280, objectFit: "cover" }
                                  }
                                ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 1, alignItems: "center", children: [
                                  /* @__PURE__ */ jsxRuntimeExports.jsx(CameraAltIcon, { sx: { fontSize: 40, color: "#A5D6A7" } }),
                                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                                    Typography,
                                    {
                                      variant: "body2",
                                      sx: { color: "rgba(224, 242, 241, 0.9)" },
                                      children: [
                                        scanPhase === "ready" && "Align the label in this area when you take the photo.",
                                        scanPhase === "capturing" && "Preparing image…",
                                        scanPhase === "uploading" && (statusMessage || "Uploading image…"),
                                        scanPhase === "processing" && (statusMessage || "Processing image with Vision API…"),
                                        scanPhase === "done" && "Scan complete! You can review the details below.",
                                        scanPhase !== "ready" && scanPhase !== "capturing" && scanPhase !== "uploading" && scanPhase !== "processing" && scanPhase !== "done" && "Tap below to take a new photo or choose one from your library."
                                      ]
                                    }
                                  )
                                ] }),
                                lastPhotoUrl && /* @__PURE__ */ jsxRuntimeExports.jsx(
                                  Box,
                                  {
                                    sx: {
                                      position: "absolute",
                                      bottom: 8,
                                      right: 8,
                                      width: 64,
                                      height: 64,
                                      borderRadius: 1,
                                      overflow: "hidden",
                                      border: "1px solid rgba(255, 255, 255, 0.4)"
                                    },
                                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                                      Box,
                                      {
                                        component: "img",
                                        src: lastPhotoUrl,
                                        alt: "Last captured",
                                        sx: { width: "100%", height: "100%", objectFit: "cover" }
                                      }
                                    )
                                  }
                                )
                              ]
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "input",
                            {
                              id: "scan-file-input",
                              type: "file",
                              accept: "image/*",
                              style: { display: "none" },
                              onChange: handleFileChange
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 1.5, children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              Button,
                              {
                                variant: "contained",
                                fullWidth: true,
                                size: "large",
                                startIcon: /* @__PURE__ */ jsxRuntimeExports.jsx(CloudUploadIcon, {}),
                                onClick: handlePickImageClick,
                                disabled: !isFounder && !canScanFromHook && (isOpeningPicker || scanPhase === "uploading" || scanPhase === "processing" || scanPhase === "capturing"),
                                sx: {
                                  textTransform: "none",
                                  fontWeight: 700,
                                  py: 1.3,
                                  borderRadius: 2,
                                  background: "linear-gradient(135deg, #7CB342 0%, #9CCC65 50%, #CDDC39 100%)",
                                  boxShadow: "0 8px 32px rgba(124, 179, 66, 0.5), 0 0 40px rgba(124, 179, 66, 0.3)",
                                  "&:hover": {
                                    background: "linear-gradient(135deg, #8BC34A 0%, #AED581 50%, #CDDC39 100%)",
                                    boxShadow: "0 12px 40px rgba(124, 179, 66, 0.7), 0 0 60px rgba(124, 179, 66, 0.4)"
                                  }
                                },
                                children: scanPhase === "uploading" ? "Uploading…" : scanPhase === "processing" ? "Processing…" : isOpeningPicker ? "Opening camera…" : isFounder || canScanFromHook ? "Scan a package or bud" : "Upgrade to keep scanning"
                              }
                            ),
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              Button,
                              {
                                variant: "outlined",
                                fullWidth: true,
                                size: "large",
                                onClick: selectedFile ? handleStartScan : handleChoosePhotoClick,
                                disabled: !selectedFile && isChoosingFile || isUploading || isPolling || previewUrl && (isUploading || isPolling),
                                sx: {
                                  textTransform: "none",
                                  fontWeight: 700,
                                  py: 1.1,
                                  borderRadius: 2,
                                  borderColor: selectedFile ? "#9CCC65" : "rgba(200, 230, 201, 0.4)",
                                  color: selectedFile ? "#C5E1A5" : "rgba(224, 242, 241, 0.6)",
                                  "&:hover": {
                                    borderColor: selectedFile ? "#CDDC39" : "rgba(200, 230, 201, 0.4)",
                                    backgroundColor: selectedFile ? "rgba(156, 204, 101, 0.12)" : "transparent"
                                  }
                                },
                                children: isUploading ? "Uploading photo…" : isPolling ? "Analyzing…" : selectedFile ? "Start scan" : isChoosingFile ? "Opening photos…" : "Choose photo"
                              }
                            ),
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              Button,
                              {
                                variant: "text",
                                size: "small",
                                onClick: toggleMultiAngleMode,
                                sx: {
                                  textTransform: "none",
                                  color: multiAngleMode ? "#CDDC39" : "rgba(224, 242, 241, 0.7)",
                                  fontSize: "0.75rem",
                                  py: 0.5
                                },
                                children: multiAngleMode ? "✓ Multi-angle mode" : "Multi-angle mode (3 photos)"
                              }
                            ),
                            multiAngleMode && capturedFrames.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                              Box,
                              {
                                sx: {
                                  mt: 1,
                                  p: 1.5,
                                  borderRadius: 1,
                                  backgroundColor: "rgba(124, 179, 66, 0.15)",
                                  border: "1px solid rgba(124, 179, 66, 0.3)"
                                },
                                children: [
                                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                                    Typography,
                                    {
                                      variant: "body2",
                                      sx: { color: "rgba(224, 242, 241, 0.9)", mb: 0.5 },
                                      children: [
                                        capturedFrames.length,
                                        "/",
                                        MAX_FRAMES,
                                        " photos captured"
                                      ]
                                    }
                                  ),
                                  capturedFrames.length >= MAX_FRAMES ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                                    Button,
                                    {
                                      variant: "contained",
                                      fullWidth: true,
                                      size: "medium",
                                      onClick: handleStartMultiAngleScan,
                                      disabled: !isFounder && (isUploading || isPolling || !canScan),
                                      sx: {
                                        textTransform: "none",
                                        background: "linear-gradient(135deg, #7CB342, #9CCC65)",
                                        mt: 0.5
                                      },
                                      children: "Start multi-angle scan"
                                    }
                                  ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
                                    Typography,
                                    {
                                      variant: "caption",
                                      sx: { color: "rgba(224, 242, 241, 0.7)" },
                                      children: [
                                        "Capture ",
                                        MAX_FRAMES - capturedFrames.length,
                                        " more photo",
                                        MAX_FRAMES - capturedFrames.length > 1 ? "s" : ""
                                      ]
                                    }
                                  )
                                ]
                              }
                            ),
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              Typography,
                              {
                                variant: "caption",
                                sx: { color: "rgba(224, 242, 241, 0.8)" },
                                children: multiAngleMode ? "Capture the same product from different angles for better accuracy." : "Clear, close-up photos of labels or flowers give the best results."
                              }
                            )
                          ] }),
                          (previewUrl || selectedFile) && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                            Box,
                            {
                              sx: {
                                mt: 2,
                                mb: 1,
                                borderRadius: 2,
                                overflow: "hidden",
                                border: "1px solid",
                                borderColor: "rgba(124, 179, 66, 0.3)",
                                bgcolor: "rgba(0, 0, 0, 0.3)"
                              },
                              children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx(
                                  Box,
                                  {
                                    component: "img",
                                    src: previewUrl || (selectedFile ? URL.createObjectURL(selectedFile) : null),
                                    alt: "Selected photo",
                                    sx: {
                                      width: "100%",
                                      height: 220,
                                      objectFit: "cover",
                                      display: "block"
                                    }
                                  }
                                ),
                                /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { p: 1.5, borderTop: "1px solid rgba(124, 179, 66, 0.2)" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", spacing: 1, alignItems: "center", children: [
                                  (isUploading || isPolling) && /* @__PURE__ */ jsxRuntimeExports.jsx(CircularProgress, { size: 16, sx: { color: "#9CCC65" } }),
                                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                                    Typography,
                                    {
                                      variant: "caption",
                                      sx: {
                                        color: isUploading || isPolling ? "rgba(156, 204, 101, 0.9)" : "rgba(224, 242, 241, 0.7)",
                                        fontSize: 12,
                                        fontWeight: isUploading || isPolling ? 600 : 400
                                      },
                                      children: isUploading ? "Uploading photo…" : isPolling ? "Processing scan… this may take a few seconds." : "Photo selected. Ready to scan."
                                    }
                                  )
                                ] }) })
                              ]
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs(
                            Box,
                            {
                              sx: {
                                mt: 2,
                                p: 1.5,
                                borderRadius: 1,
                                backgroundColor: scanPhase === "error" ? "rgba(239, 68, 68, 0.15)" : "rgba(124, 179, 66, 0.1)",
                                border: `1px solid ${scanPhase === "error" ? "rgba(239, 68, 68, 0.4)" : "rgba(124, 179, 66, 0.3)"}`
                              },
                              children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", spacing: 1.5, alignItems: "center", children: [
                                  scanPhase !== "ready" && scanPhase !== "done" && scanPhase !== "error" && /* @__PURE__ */ jsxRuntimeExports.jsx(CircularProgress, { size: 18, sx: { color: "#CDDC39" } }),
                                  scanPhase === "error" && /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { sx: { color: "#fecaca", fontSize: 18 }, children: "⚠" }),
                                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                                    Typography,
                                    {
                                      variant: "body2",
                                      sx: {
                                        color: scanPhase === "error" ? "#fecaca" : "rgba(224, 242, 241, 0.9)",
                                        flex: 1
                                      },
                                      children: [
                                        scanPhase === "ready" && (statusMessage || "Ready to scan."),
                                        scanPhase === "capturing" && "Preparing image…",
                                        scanPhase === "uploading" && (statusMessage || "Uploading image…"),
                                        scanPhase === "processing" && (statusMessage || "Processing image with Vision API…"),
                                        scanPhase === "done" && "Scan complete!",
                                        scanPhase === "error" && (error || "Scan failed. Please try again.")
                                      ]
                                    }
                                  )
                                ] }),
                                scanPhase === "error" && /* @__PURE__ */ jsxRuntimeExports.jsx(
                                  Button,
                                  {
                                    variant: "contained",
                                    fullWidth: true,
                                    size: "medium",
                                    onClick: /* @__PURE__ */ __name(() => {
                                      setError(null);
                                      setScanPhase("ready");
                                      setStatusMessage("Ready to scan.");
                                      setSelectedFile(null);
                                      setPreviewUrl(null);
                                      if (previewUrl) {
                                        URL.revokeObjectURL(previewUrl);
                                      }
                                      if (lastPhotoUrl) {
                                        URL.revokeObjectURL(lastPhotoUrl);
                                      }
                                      setCapturedFrames([]);
                                    }, "onClick"),
                                    sx: {
                                      mt: 1.5,
                                      textTransform: "none",
                                      background: "linear-gradient(135deg, #7CB342, #9CCC65)",
                                      "&:hover": {
                                        background: "linear-gradient(135deg, #8BC34A, #AED581)"
                                      }
                                    },
                                    children: "Try again"
                                  }
                                )
                              ]
                            }
                          ),
                          error && /* @__PURE__ */ jsxRuntimeExports.jsx(
                            Alert,
                            {
                              severity: "warning",
                              sx: {
                                mt: 1.5,
                                backgroundColor: "rgba(255, 244, 179, 0.08)",
                                color: "#FFF59D",
                                "& .MuiAlert-icon": { color: "#FFEE58" }
                              },
                              children: error
                            }
                          )
                        ] })
                      }
                    ),
                    scanPhase !== "ready" && scanPhase !== "done" && scanPhase !== "error" && !scanResult && !error && /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Paper,
                      {
                        elevation: 6,
                        sx: {
                          p: 2.5,
                          borderRadius: 3,
                          background: "rgba(12, 20, 12, 0.95)",
                          border: "1px solid rgba(124, 179, 66, 0.6)",
                          boxShadow: "0 18px 40px rgba(0, 0, 0, 0.7)",
                          mb: 3
                        },
                        children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 2, children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            Skeleton,
                            {
                              variant: "text",
                              width: "60%",
                              height: 40,
                              sx: { bgcolor: "rgba(255, 255, 255, 0.1)" }
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            Skeleton,
                            {
                              variant: "text",
                              width: "100%",
                              height: 24,
                              sx: { bgcolor: "rgba(255, 255, 255, 0.08)" }
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            Skeleton,
                            {
                              variant: "text",
                              width: "80%",
                              height: 24,
                              sx: { bgcolor: "rgba(255, 255, 255, 0.08)" }
                            }
                          )
                        ] })
                      }
                    ),
                    scanPhase === "error" && /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Button,
                      {
                        variant: "outlined",
                        fullWidth: true,
                        onClick: handleScanAgain,
                        sx: {
                          mt: 2,
                          textTransform: "none",
                          borderColor: "#9CCC65",
                          color: "#C5E1A5",
                          "&:hover": {
                            borderColor: "#CDDC39",
                            backgroundColor: "rgba(156, 204, 101, 0.1)"
                          }
                        },
                        children: "Scan again"
                      }
                    ),
                    !scanResult && scanPhase === "ready" && !error && /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Typography,
                      {
                        variant: "body2",
                        sx: {
                          color: "rgba(224, 242, 241, 0.8)",
                          textAlign: "center"
                        },
                        children: "After you scan, we'll show you the best match and similar strains here."
                      }
                    )
                  ]
                }
              )
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { height: 8, flexShrink: 0 } }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Dialog,
          {
            open: showPlans,
            onClose: /* @__PURE__ */ __name(() => setShowPlans(false), "onClose"),
            fullWidth: true,
            maxWidth: "xs",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Get more scans" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { dividers: true, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { mb: 2 }, children: "You've used your 20 free guest scans. Join the garden to unlock full access and auto-refreshing monthly scan bundles." }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 2, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Button,
                    {
                      variant: "contained",
                      fullWidth: true,
                      onClick: /* @__PURE__ */ __name(() => {
                        setShowPlans(false);
                        onNavigate?.("membership");
                      }, "onClick"),
                      children: "View membership plans"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Button,
                    {
                      variant: "outlined",
                      fullWidth: true,
                      onClick: /* @__PURE__ */ __name(() => {
                        setShowPlans(false);
                        onNavigate?.("buy-scans");
                      }, "onClick"),
                      children: "Buy additional scan packs"
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(DialogActions, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: /* @__PURE__ */ __name(() => setShowPlans(false), "onClick"), children: "Close" }) })
            ]
          }
        )
      ]
    }
  );
}
__name(ScanPage, "ScanPage");
export {
  ScanPage as default
};
