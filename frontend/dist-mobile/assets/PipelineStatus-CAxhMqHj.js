var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { r as reactExports, j as jsxRuntimeExports, B as Box, i as Button, T as Typography, av as LinearProgress, f as Card, h as CardContent, S as Stack, H as Chip, Z as Divider, bd as Table, be as TableHead, bf as TableRow, bg as TableCell, bh as TableBody } from "./react-vendor-DaVUs1pH.js";
import { a as API_BASE } from "./App-BxlAc3TE.js";
import "./vendor-qR99EfKL.js";
function PipelineStatus({ onBack }) {
  const [latest, setLatest] = reactExports.useState(null);
  const [history, setHistory] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [error, setError] = reactExports.useState(null);
  reactExports.useEffect(() => {
    const load = /* @__PURE__ */ __name(async () => {
      try {
        setLoading(true);
        const [l, h] = await Promise.all([
          fetch(`${API_BASE}/api/pipeline/latest`).then((r) => r.json()),
          fetch(`${API_BASE}/api/pipeline/history`).then((r) => r.json())
        ]);
        setLatest(l);
        setHistory(Array.isArray(h) ? h : [h].filter(Boolean));
      } catch (e) {
        console.error("[Pipeline] load error", e);
        setError("Could not load pipeline status");
      } finally {
        setLoading(false);
      }
    }, "load");
    load();
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { maxWidth: 1e3, mx: "auto", p: 2 }, children: [
    onBack && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: onBack, size: "small", variant: "contained", sx: { bgcolor: "white", color: "black", textTransform: "none", fontWeight: 700, borderRadius: 999, mb: 1, "&:hover": { bgcolor: "grey.100" } }, children: "Home" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h4", sx: { fontWeight: 800, mb: 1 }, children: "Data Pipeline" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body1", sx: { color: "text.secondary", mb: 2 }, children: "Schedule: Daily at 3:00 AM UTC via GitHub Actions." }),
    loading && /* @__PURE__ */ jsxRuntimeExports.jsx(LinearProgress, {}),
    error && /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { color: "error", sx: { mb: 2 }, children: error }),
    latest && /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { sx: { mb: 3 }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: { xs: "column", sm: "row" }, spacing: 2, justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", sx: { fontWeight: 700 }, children: "Latest Run" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", sx: { color: "text.secondary" }, children: [
            "Date: ",
            new Date(latest.date || latest.when || Date.now()).toLocaleString()
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", spacing: 1, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Chip, { label: `Strains (main): ${latest.totals?.strainsMain ?? "—"}`, color: "success", variant: "outlined" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Chip, { label: `Strains (enhanced): ${latest.totals?.strainsEnhanced ?? "—"}`, color: "success", variant: "outlined" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Divider, { sx: { my: 2 } }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "subtitle1", sx: { fontWeight: 700, mb: 1 }, children: "Import Report" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", spacing: 2, flexWrap: "wrap", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Chip, { label: `Attributes: ${latest.report?.counts?.attributes ?? "—"}` }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Chip, { label: `CSV Rows: ${latest.report?.counts?.csvRows ?? "—"}` }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Chip, { label: `Matched: ${latest.report?.counts?.matched ?? "—"}`, color: "primary" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Chip, { label: `Unmatched: ${latest.report?.counts?.unmatched ?? "—"}`, color: "warning" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", sx: { fontWeight: 700, mb: 1 }, children: "Run History" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { size: "small", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: "Date (UTC)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { align: "right", children: "Strains (main)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { align: "right", children: "Strains (enhanced)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { align: "right", children: "Matched" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { align: "right", children: "Unmatched" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: history.map((h, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { hover: true, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: h.date_utc || (h.date ? new Date(h.date).toISOString().slice(0, 10) : "—") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { align: "right", children: h.totals?.strainsMain ?? "—" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { align: "right", children: h.totals?.strainsEnhanced ?? "—" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { align: "right", children: h.report?.counts?.matched ?? "—" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { align: "right", children: h.report?.counts?.unmatched ?? "—" })
        ] }, idx)) })
      ] })
    ] }) })
  ] });
}
__name(PipelineStatus, "PipelineStatus");
export {
  PipelineStatus as default
};
