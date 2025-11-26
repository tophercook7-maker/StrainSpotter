var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { r as reactExports, j as jsxRuntimeExports, B as Box, n as CircularProgress, C as Container, A as Alert, i as Button, S as Stack, bs as HealthAndSafetyIcon, T as Typography, a9 as TroubleshootIcon, a0 as Grid, f as Card, h as CardContent, H as Chip, bt as LinkIcon, bu as BarChartIcon, Z as Divider } from "./react-vendor-DaVUs1pH.js";
import { u as useAuth, a as API_BASE, s as supabase } from "./App-BxlAc3TE.js";
import { i as isAdminEmail } from "./roles-MIh-dFq-.js";
import "./vendor-qR99EfKL.js";
async function authHeaders() {
  if (!supabase) return {};
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}
__name(authHeaders, "authHeaders");
function AdminStatus({ onBack, onNavigate }) {
  const { user, loading } = useAuth();
  const [health, setHealth] = reactExports.useState(null);
  const [apiHealth, setApiHealth] = reactExports.useState(null);
  const [analytics, setAnalytics] = reactExports.useState(null);
  const [error, setError] = reactExports.useState(null);
  const isAdmin = reactExports.useMemo(() => isAdminEmail(user?.email), [user]);
  reactExports.useEffect(() => {
    if (loading || !isAdmin) return;
    (async () => {
      try {
        const headers = await authHeaders();
        const [rootHealth, apiHealthResp, analyticsSummary] = await Promise.all([
          fetch(`${API_BASE}/health`).then((res) => res.json()),
          fetch(`${API_BASE}/api/health`).then((res) => res.json()),
          fetch(`${API_BASE}/api/analytics/events/summary`, { headers }).then((res) => res.json())
        ]);
        setHealth(rootHealth);
        setApiHealth(apiHealthResp);
        setAnalytics(analyticsSummary);
      } catch (err) {
        console.error("[AdminStatus] Failed to load status:", err);
        setError(err.message || "Unable to load status page.");
      }
    })();
  }, [loading, isAdmin]);
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(CircularProgress, {}) });
  }
  if (!isAdmin) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(Container, { maxWidth: "sm", sx: { py: 6 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { severity: "error", sx: { mb: 2 }, children: "Admin-only page. Please sign in with an approved admin account." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "contained", onClick: onBack, children: "Back" })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { minHeight: "100vh", py: 4 }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Container, { maxWidth: "lg", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", justifyContent: "space-between", alignItems: "center", sx: { mb: 3 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", spacing: 1, alignItems: "center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(HealthAndSafetyIcon, { color: "success" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h5", fontWeight: 800, children: "Status & Debug" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", spacing: 1, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outlined", onClick: onBack, children: "Back" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "contained", startIcon: /* @__PURE__ */ jsxRuntimeExports.jsx(TroubleshootIcon, {}), onClick: /* @__PURE__ */ __name(() => onNavigate?.("errors"), "onClick"), children: "Admin Errors" })
      ] })
    ] }),
    error && /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { severity: "error", sx: { mb: 3 }, children: error }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Grid, { container: true, spacing: 2, sx: { mb: 3 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { item: true, xs: 12, md: 4, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "subtitle2", gutterBottom: true, children: "Environment" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 1, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Chip, { label: `Mode: ${"production"}`, size: "small" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Chip, { label: `API Base: ${API_BASE}`, size: "small", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(LinkIcon, {}) }),
          apiHealth?.rls?.mode && /* @__PURE__ */ jsxRuntimeExports.jsx(
            Chip,
            {
              label: `RLS Mode: ${apiHealth.rls.mode}`,
              size: "small",
              color: apiHealth.rls.mode === "prod" ? "success" : "default"
            }
          )
        ] })
      ] }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { item: true, xs: 12, md: 4, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "subtitle2", gutterBottom: true, children: "Backend Health" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 1, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Chip,
            {
              label: `Supabase: ${health?.supabaseConfigured ? "OK" : "Missing"}`,
              color: health?.supabaseConfigured ? "success" : "error",
              size: "small"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Chip,
            {
              label: `Vision: ${health?.googleVisionConfigured ? health?.visionMethod : "Missing"}`,
              color: health?.googleVisionConfigured ? "success" : "warning",
              size: "small"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Chip,
            {
              label: `Bucket: ${health?.bucketExists ? "Found" : "Missing"}`,
              color: health?.bucketExists ? "success" : "warning",
              size: "small"
            }
          )
        ] })
      ] }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { item: true, xs: 12, md: 4, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "subtitle2", gutterBottom: true, children: "Links" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 1, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: "outlined",
              onClick: /* @__PURE__ */ __name(() => onNavigate?.("moderation"), "onClick"),
              children: "Moderation Dashboard"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: "outlined",
              onClick: /* @__PURE__ */ __name(() => onNavigate?.("membership-admin"), "onClick"),
              children: "Membership Admin"
            }
          )
        ] })
      ] }) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { sx: { mb: 3 }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", spacing: 1, alignItems: "center", sx: { mb: 2 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(BarChartIcon, { color: "primary" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "subtitle1", fontWeight: 700, children: "Last 7 days of activity" })
      ] }),
      analytics ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", spacing: 2, sx: { mb: 2, flexWrap: "wrap" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Chip, { label: `Scans started: ${analytics.scanStats?.started ?? 0}` }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Chip, { label: `Scans completed: ${analytics.scanStats?.completed ?? 0}` }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Chip,
            {
              label: `Success rate: ${analytics.scanStats?.successRate != null ? `${analytics.scanStats.successRate.toFixed(1)}%` : "n/a"}`
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Chip, { label: `Journal entries: ${analytics.totals?.journal_entry_created ?? 0}` })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Divider, { sx: { my: 2 } }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "subtitle2", gutterBottom: true, children: "Top matched strains" }),
        analytics.topStrains?.length ? /* @__PURE__ */ jsxRuntimeExports.jsx(Stack, { direction: "row", spacing: 1, flexWrap: "wrap", children: analytics.topStrains.map((strain) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          Chip,
          {
            label: `${strain.name} (${strain.count})`,
            color: "success",
            variant: "outlined"
          },
          strain.slug
        )) }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", color: "text.secondary", children: "No scan activity logged yet." })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(CircularProgress, { size: 24 })
    ] }) })
  ] }) });
}
__name(AdminStatus, "AdminStatus");
export {
  AdminStatus as default
};
