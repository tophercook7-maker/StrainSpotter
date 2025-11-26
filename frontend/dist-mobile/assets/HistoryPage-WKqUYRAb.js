var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { j as jsxRuntimeExports, f as Card, h as CardContent, B as Box, S as Stack, T as Typography, H as Chip, ac as LocalShippingIcon, a3 as SpaIcon, Z as Divider, ad as TrendingUpIcon, $ as WarningIcon, r as reactExports, C as Container, I as IconButton, y as ArrowBackIcon, ae as FormControl, af as InputLabel, ag as Select, ah as MenuItem, m as TextField, n as CircularProgress, A as Alert } from "./react-vendor-DaVUs1pH.js";
import { t as transformScanResult, S as ScanResultCard } from "./ScanResultCard-BGx_BhU_.js";
import { u as useAuth, c as useProMode, a as API_BASE } from "./App-BxlAc3TE.js";
import "./vendor-qR99EfKL.js";
import "./useStrainImage-Dsgj-zte.js";
function HistoryListItem({ scan, onClick }) {
  if (!scan) return null;
  const transformed = transformScanResult(scan);
  const strainName = transformed?.strainName || scan.canonical_strain_name || scan.matched_strain_name || "Unknown";
  const isPackaged = transformed?.isPackagedProduct || false;
  const matchConfidence = transformed?.matchConfidence || scan.canonical_match_confidence || scan.match_confidence || null;
  const intensity = transformed?.intensity || scan.ai_summary?.intensity || scan.ai_summary?.potency_score || null;
  const proRole = scan.pro_role;
  const date = new Date(scan.created_at);
  const dateStr = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== (/* @__PURE__ */ new Date()).getFullYear() ? "numeric" : void 0
  });
  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
  const thumbnailUrl = scan.image_url || null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Card,
    {
      onClick,
      sx: {
        mb: 2,
        cursor: "pointer",
        background: "rgba(255, 255, 255, 0.05)",
        border: "1px solid rgba(124, 179, 66, 0.2)",
        backdropFilter: "blur(6px)",
        transition: "all 0.2s",
        "&:hover": {
          borderColor: "rgba(124, 179, 66, 0.4)",
          background: "rgba(255, 255, 255, 0.08)",
          transform: "translateY(-2px)"
        }
      },
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { sx: { p: 2, "&:last-child": { pb: 2 } }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { display: "flex", gap: 2 }, children: [
        thumbnailUrl && /* @__PURE__ */ jsxRuntimeExports.jsx(
          Box,
          {
            sx: {
              width: 80,
              height: 80,
              borderRadius: 2,
              overflow: "hidden",
              flexShrink: 0,
              background: "rgba(0, 0, 0, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            },
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              "img",
              {
                src: thumbnailUrl,
                alt: "Scan",
                style: {
                  width: "100%",
                  height: "100%",
                  objectFit: "cover"
                },
                onError: /* @__PURE__ */ __name((e) => {
                  e.target.style.display = "none";
                }, "onError")
              }
            )
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { flex: 1, minWidth: 0 }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 1, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Typography,
              {
                variant: "h6",
                sx: {
                  color: "#E8F5E9",
                  fontWeight: 700,
                  fontSize: "1rem",
                  flex: 1,
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                },
                children: strainName
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Chip,
              {
                icon: isPackaged ? /* @__PURE__ */ jsxRuntimeExports.jsx(LocalShippingIcon, {}) : /* @__PURE__ */ jsxRuntimeExports.jsx(SpaIcon, {}),
                label: isPackaged ? "Packaged" : "Bud",
                size: "small",
                sx: {
                  height: "24px",
                  fontSize: "0.7rem",
                  bgcolor: isPackaged ? "rgba(124, 179, 66, 0.15)" : "rgba(179, 229, 252, 0.15)",
                  color: isPackaged ? "#9AE66E" : "#B3E5FC",
                  border: `1px solid ${isPackaged ? "rgba(124, 179, 66, 0.3)" : "rgba(179, 229, 252, 0.3)"}`
                }
              }
            ),
            proRole && /* @__PURE__ */ jsxRuntimeExports.jsx(
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
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Typography,
            {
              variant: "caption",
              sx: { color: "rgba(200, 230, 201, 0.7)" },
              children: [
                dateStr,
                " • ",
                timeStr
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", spacing: 1, flexWrap: "wrap", gap: 0.5, children: [
            !isPackaged && matchConfidence !== null && /* @__PURE__ */ jsxRuntimeExports.jsx(
              Chip,
              {
                label: `${Math.round(matchConfidence * 100)}% match`,
                size: "small",
                sx: {
                  height: "20px",
                  fontSize: "0.65rem",
                  bgcolor: matchConfidence >= 0.8 ? "rgba(76, 175, 80, 0.2)" : "rgba(255, 152, 0, 0.2)",
                  color: matchConfidence >= 0.8 ? "#81C784" : "#FFB74D",
                  border: `1px solid ${matchConfidence >= 0.8 ? "rgba(76, 175, 80, 0.3)" : "rgba(255, 152, 0, 0.3)"}`
                }
              }
            ),
            intensity !== null && /* @__PURE__ */ jsxRuntimeExports.jsx(
              Chip,
              {
                label: `Intensity: ${intensity.toFixed(1)}/5`,
                size: "small",
                sx: {
                  height: "20px",
                  fontSize: "0.65rem",
                  bgcolor: "rgba(255, 204, 128, 0.15)",
                  color: "#FFCC80",
                  border: "1px solid rgba(255, 204, 128, 0.3)"
                }
              }
            )
          ] })
        ] }) })
      ] }) })
    }
  );
}
__name(HistoryListItem, "HistoryListItem");
function AnalyticsSummary({ scans, proRole }) {
  if (!scans || scans.length === 0) {
    return null;
  }
  const now = /* @__PURE__ */ new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthScans = scans.filter((s) => new Date(s.created_at) >= startOfMonth);
  const packagedScans = scans.filter((s) => {
    const pkg = s.packaging_insights || s.label_insights || {};
    return !!(pkg.strainName || pkg.basic?.strain_name);
  });
  const budScans = scans.filter((s) => {
    const pkg = s.packaging_insights || s.label_insights || {};
    return !(pkg.strainName || pkg.basic?.strain_name);
  });
  const strainCounts = {};
  scans.forEach((scan) => {
    const strainName = scan.canonical_strain_name || scan.matched_strain_name || "Unknown";
    strainCounts[strainName] = (strainCounts[strainName] || 0) + 1;
  });
  const topStrains = Object.entries(strainCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name, count]) => ({ name, count }));
  const intensities = scans.map((s) => s.ai_summary?.intensity || s.ai_summary?.potency_score).filter((i) => typeof i === "number");
  const avgIntensity = intensities.length > 0 ? intensities.reduce((a, b) => a + b, 0) / intensities.length : null;
  const warningsCount = scans.filter((s) => {
    const warnings = s.ai_summary?.risksAndWarnings || s.ai_summary?.warnings || [];
    return Array.isArray(warnings) && warnings.length > 0;
  }).length;
  const dispensaryScans = scans.filter((s) => s.pro_role === "dispensary").length;
  const growerScans = scans.filter((s) => s.pro_role === "grower").length;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Card,
    {
      sx: {
        mb: 3,
        background: "rgba(255, 255, 255, 0.05)",
        border: "1px solid rgba(124, 179, 66, 0.3)",
        backdropFilter: "blur(6px)"
      },
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", sx: { mb: 2, color: "#E8F5E9", fontWeight: 700 }, children: "Analytics Summary" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 2, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "rgba(200, 230, 201, 0.7)", mb: 0.5 }, children: "This Month" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "h5", sx: { color: "#E8F5E9", fontWeight: 700 }, children: [
              thisMonthScans.length,
              " scans"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Divider, { sx: { borderColor: "rgba(124, 179, 66, 0.2)" } }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "rgba(200, 230, 201, 0.7)", mb: 1 }, children: "Product Type" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", spacing: 1, flexWrap: "wrap", gap: 1, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Chip,
                {
                  icon: /* @__PURE__ */ jsxRuntimeExports.jsx(LocalShippingIcon, {}),
                  label: `${packagedScans.length} Packaged`,
                  size: "small",
                  sx: {
                    bgcolor: "rgba(124, 179, 66, 0.15)",
                    color: "#9AE66E",
                    border: "1px solid rgba(124, 179, 66, 0.3)"
                  }
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Chip,
                {
                  icon: /* @__PURE__ */ jsxRuntimeExports.jsx(SpaIcon, {}),
                  label: `${budScans.length} Bud`,
                  size: "small",
                  sx: {
                    bgcolor: "rgba(124, 179, 66, 0.15)",
                    color: "#9AE66E",
                    border: "1px solid rgba(124, 179, 66, 0.3)"
                  }
                }
              )
            ] }),
            scans.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "caption", sx: { color: "rgba(200, 230, 201, 0.6)", mt: 0.5, display: "block" }, children: [
              Math.round(packagedScans.length / scans.length * 100),
              "% packaged"
            ] })
          ] }),
          topStrains.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Divider, { sx: { borderColor: "rgba(124, 179, 66, 0.2)" } }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "rgba(200, 230, 201, 0.7)", mb: 1 }, children: "Top Strains" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Stack, { spacing: 0.5, children: topStrains.map(({ name, count }, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", sx: { color: "#E8F5E9" }, children: [
                  idx + 1,
                  ". ",
                  name
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Chip,
                  {
                    label: count,
                    size: "small",
                    sx: {
                      bgcolor: "rgba(124, 179, 66, 0.15)",
                      color: "#9AE66E",
                      height: "20px",
                      fontSize: "0.7rem"
                    }
                  }
                )
              ] }, idx)) })
            ] })
          ] }),
          avgIntensity !== null && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Divider, { sx: { borderColor: "rgba(124, 179, 66, 0.2)" } }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "rgba(200, 230, 201, 0.7)", mb: 0.5 }, children: "Avg AI Intensity" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { display: "flex", alignItems: "center", gap: 1 }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUpIcon, { sx: { color: "#9AE66E", fontSize: "1.2rem" } }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "h6", sx: { color: "#E8F5E9", fontWeight: 700 }, children: [
                  avgIntensity.toFixed(1),
                  "/5"
                ] })
              ] })
            ] })
          ] }),
          warningsCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Divider, { sx: { borderColor: "rgba(124, 179, 66, 0.2)" } }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "rgba(200, 230, 201, 0.7)", mb: 0.5 }, children: "Warnings Encountered" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { display: "flex", alignItems: "center", gap: 1 }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(WarningIcon, { sx: { color: "#FFCC80", fontSize: "1.2rem" } }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "h6", sx: { color: "#FFCC80", fontWeight: 700 }, children: [
                  warningsCount,
                  " scans"
                ] })
              ] })
            ] })
          ] }),
          (proRole || dispensaryScans > 0 || growerScans > 0) && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Divider, { sx: { borderColor: "rgba(124, 179, 66, 0.2)" } }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "rgba(200, 230, 201, 0.7)", mb: 1 }, children: "Pro Mode Breakdown" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", spacing: 1, flexWrap: "wrap", gap: 1, children: [
                dispensaryScans > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Chip,
                  {
                    label: `${dispensaryScans} Dispensary`,
                    size: "small",
                    sx: {
                      bgcolor: "rgba(124, 179, 66, 0.15)",
                      color: "#9AE66E",
                      border: "1px solid rgba(124, 179, 66, 0.3)"
                    }
                  }
                ),
                growerScans > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Chip,
                  {
                    label: `${growerScans} Grower`,
                    size: "small",
                    sx: {
                      bgcolor: "rgba(124, 179, 66, 0.15)",
                      color: "#9AE66E",
                      border: "1px solid rgba(124, 179, 66, 0.3)"
                    }
                  }
                )
              ] })
            ] })
          ] })
        ] })
      ] })
    }
  );
}
__name(AnalyticsSummary, "AnalyticsSummary");
function HistoryPage({ onBack, onNavigate }) {
  const { user } = useAuth();
  const { proRole, proEnabled } = useProMode();
  const [scans, setScans] = reactExports.useState([]);
  const [filteredScans, setFilteredScans] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [error, setError] = reactExports.useState("");
  const [selectedScan, setSelectedScan] = reactExports.useState(null);
  const [filterRole, setFilterRole] = reactExports.useState("");
  const [filterType, setFilterType] = reactExports.useState("");
  const [filterStrain, setFilterStrain] = reactExports.useState("");
  reactExports.useEffect(() => {
    let cancelled = false;
    async function loadScans() {
      try {
        setLoading(true);
        setError("");
        const userId = user?.id || null;
        const headers = {};
        if (proEnabled && (proRole === "dispensary" || proRole === "grower")) {
          headers["X-Pro-Role"] = proRole;
        }
        const params = new URLSearchParams();
        if (userId) params.append("user_id", userId);
        if (filterRole) params.append("role", filterRole);
        if (filterType) params.append("type", filterType);
        if (filterStrain) params.append("strain", filterStrain);
        params.append("limit", "200");
        const url = `${API_BASE}/api/scans?${params.toString()}`;
        const res = await fetch(url, { headers });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        if (!cancelled) {
          setScans(data.scans || []);
          setFilteredScans(data.scans || []);
        }
      } catch (e) {
        if (!cancelled) {
          setError(String(e));
          console.error("[HistoryPage] Load error", e);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    __name(loadScans, "loadScans");
    loadScans();
    return () => {
      cancelled = true;
    };
  }, [user?.id, filterRole, filterType, filterStrain, proRole, proEnabled]);
  const handleScanSelect = /* @__PURE__ */ __name((scan) => {
    setSelectedScan(scan);
  }, "handleScanSelect");
  const handleBackFromDetail = /* @__PURE__ */ __name(() => {
    setSelectedScan(null);
  }, "handleBackFromDetail");
  if (selectedScan) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      Box,
      {
        sx: {
          minHeight: "100vh",
          width: "100%",
          backgroundColor: "#050705",
          bgcolor: "#0a0f0a",
          // Clean, solid dark green background
          position: "relative"
        },
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Container,
          {
            maxWidth: "md",
            sx: {
              pt: "calc(env(safe-area-inset-top) + 20px)",
              pb: 4
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { mb: 3, display: "flex", alignItems: "center", gap: 1 }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(IconButton, { onClick: handleBackFromDetail, sx: { color: "#C5E1A5" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowBackIcon, {}) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", sx: { color: "#F1F8E9", fontWeight: 700 }, children: "Scan Details" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(ScanResultCard, { scan: selectedScan, result: selectedScan })
            ]
          }
        )
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Box,
    {
      sx: {
        minHeight: "100vh",
        width: "100%",
        backgroundColor: "#050705",
        backgroundImage: "url(/strainspotter-bg.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative"
      },
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Container,
        {
          maxWidth: "md",
          sx: {
            pt: "calc(env(safe-area-inset-top) + 20px)",
            pb: 4
          },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { mb: 3, display: "flex", alignItems: "center", gap: 1 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(IconButton, { onClick: onBack, sx: { color: "#C5E1A5" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowBackIcon, {}) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h4", sx: { color: "#F1F8E9", fontWeight: 700 }, children: "Scan History" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", spacing: 1, sx: { mb: 3 }, flexWrap: "wrap", gap: 1, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(FormControl, { size: "small", sx: { minWidth: 120 }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(InputLabel, { sx: { color: "rgba(200, 230, 201, 0.7)" }, children: "Role" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Select,
                  {
                    value: filterRole,
                    onChange: /* @__PURE__ */ __name((e) => setFilterRole(e.target.value), "onChange"),
                    label: "Role",
                    sx: {
                      color: "#E8F5E9",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "rgba(124, 179, 66, 0.3)"
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "rgba(124, 179, 66, 0.5)"
                      },
                      "& .MuiSvgIcon-root": {
                        color: "rgba(200, 230, 201, 0.7)"
                      }
                    },
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(MenuItem, { value: "", children: "All" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(MenuItem, { value: "dispensary", children: "Dispensary" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(MenuItem, { value: "grower", children: "Grower" })
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(FormControl, { size: "small", sx: { minWidth: 120 }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(InputLabel, { sx: { color: "rgba(200, 230, 201, 0.7)" }, children: "Type" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Select,
                  {
                    value: filterType,
                    onChange: /* @__PURE__ */ __name((e) => setFilterType(e.target.value), "onChange"),
                    label: "Type",
                    sx: {
                      color: "#E8F5E9",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "rgba(124, 179, 66, 0.3)"
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "rgba(124, 179, 66, 0.5)"
                      },
                      "& .MuiSvgIcon-root": {
                        color: "rgba(200, 230, 201, 0.7)"
                      }
                    },
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(MenuItem, { value: "", children: "All" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(MenuItem, { value: "packaged", children: "Packaged" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(MenuItem, { value: "bud", children: "Bud" })
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                TextField,
                {
                  size: "small",
                  placeholder: "Filter by strain...",
                  value: filterStrain,
                  onChange: /* @__PURE__ */ __name((e) => setFilterStrain(e.target.value), "onChange"),
                  sx: {
                    flex: 1,
                    minWidth: 150,
                    "& .MuiOutlinedInput-root": {
                      color: "#E8F5E9",
                      "& fieldset": {
                        borderColor: "rgba(124, 179, 66, 0.3)"
                      },
                      "&:hover fieldset": {
                        borderColor: "rgba(124, 179, 66, 0.5)"
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#7CB342"
                      }
                    }
                  }
                }
              )
            ] }),
            loading && /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { display: "flex", justifyContent: "center", py: 4 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(CircularProgress, { sx: { color: "#CDDC39" } }) }),
            error && /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { severity: "error", sx: { mb: 3 }, children: error }),
            !loading && !error && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              filteredScans.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(AnalyticsSummary, { scans: filteredScans, proRole }),
              filteredScans.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { textAlign: "center", py: 4 }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body1", sx: { color: "rgba(200, 230, 201, 0.7)" }, children: [
                "No scans found",
                filterRole || filterType || filterStrain ? " matching filters" : "",
                "."
              ] }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { children: filteredScans.map((scan) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                HistoryListItem,
                {
                  scan,
                  onClick: /* @__PURE__ */ __name(() => handleScanSelect(scan), "onClick")
                },
                scan.id
              )) })
            ] })
          ]
        }
      )
    }
  );
}
__name(HistoryPage, "HistoryPage");
export {
  HistoryPage as default
};
