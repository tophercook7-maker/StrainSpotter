var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { r as reactExports, j as jsxRuntimeExports, B as Box, C as Container, I as IconButton, y as ArrowBackIcon, T as Typography, n as CircularProgress, A as Alert, S as Stack, P as Paper, H as Chip } from "./react-vendor-DaVUs1pH.js";
import { a as API_BASE } from "./App-BxlAc3TE.js";
import "./vendor-qR99EfKL.js";
function AnalyticsDashboard({ onBack }) {
  const [loading, setLoading] = reactExports.useState(true);
  const [error, setError] = reactExports.useState("");
  const [summary, setSummary] = reactExports.useState(null);
  reactExports.useEffect(() => {
    let cancelled = false;
    async function fetchSummary() {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`${API_BASE}/api/analytics/summary`);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        if (!cancelled) setSummary(data);
      } catch (e) {
        if (!cancelled) setError(String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    __name(fetchSummary, "fetchSummary");
    fetchSummary();
    return () => {
      cancelled = true;
    };
  }, []);
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
              /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h4", sx: { color: "#F1F8E9", fontWeight: 700 }, children: "Analytics" })
            ] }),
            loading && /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { display: "flex", justifyContent: "center", py: 4 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(CircularProgress, { sx: { color: "#CDDC39" } }) }),
            error && /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { severity: "error", sx: { mb: 3 }, children: error }),
            !loading && !error && summary && /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 3, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Paper,
                {
                  elevation: 6,
                  sx: {
                    p: 3,
                    background: "rgba(12, 20, 12, 0.95)",
                    border: "1px solid rgba(124, 179, 66, 0.6)",
                    borderRadius: 3
                  },
                  children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "h6", sx: { color: "#F1F8E9", mb: 2, fontWeight: 600 }, children: [
                    "Total Scans: ",
                    summary.totalScans || 0
                  ] })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Paper,
                {
                  elevation: 6,
                  sx: {
                    p: 3,
                    background: "rgba(12, 20, 12, 0.95)",
                    border: "1px solid rgba(124, 179, 66, 0.6)",
                    borderRadius: 3
                  },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", sx: { color: "#F1F8E9", mb: 2, fontWeight: 600 }, children: "Top Strains" }),
                    summary.topStrains?.length ? /* @__PURE__ */ jsxRuntimeExports.jsx(Stack, { spacing: 1, children: summary.topStrains.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body1", sx: { color: "#F1F8E9" }, children: s.name }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Chip, { label: s.count, size: "small", color: "success" })
                    ] }, s.name)) }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "rgba(224, 242, 241, 0.8)" }, children: "No strain data yet." })
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Paper,
                {
                  elevation: 6,
                  sx: {
                    p: 3,
                    background: "rgba(12, 20, 12, 0.95)",
                    border: "1px solid rgba(124, 179, 66, 0.6)",
                    borderRadius: 3
                  },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", sx: { color: "#F1F8E9", mb: 2, fontWeight: 600 }, children: "Top Brands" }),
                    summary.topBrands?.length ? /* @__PURE__ */ jsxRuntimeExports.jsx(Stack, { spacing: 1, children: summary.topBrands.map((b) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body1", sx: { color: "#F1F8E9" }, children: b.name }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Chip, { label: b.count, size: "small", color: "success" })
                    ] }, b.name)) }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "rgba(224, 242, 241, 0.8)" }, children: "No brand data yet." })
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Paper,
                {
                  elevation: 6,
                  sx: {
                    p: 3,
                    background: "rgba(12, 20, 12, 0.95)",
                    border: "1px solid rgba(124, 179, 66, 0.6)",
                    borderRadius: 3
                  },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", sx: { color: "#F1F8E9", mb: 2, fontWeight: 600 }, children: "THC Potency Distribution" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Stack, { spacing: 1, children: summary.potencyBuckets && Object.entries(summary.potencyBuckets).map(([bucket, count]) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body1", sx: { color: "#F1F8E9" }, children: bucket === "unknown" ? "Unknown" : `${bucket}%` }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Chip, { label: count, size: "small", color: "success" })
                    ] }, bucket)) })
                  ]
                }
              )
            ] })
          ]
        }
      )
    }
  );
}
__name(AnalyticsDashboard, "AnalyticsDashboard");
export {
  AnalyticsDashboard as default
};
