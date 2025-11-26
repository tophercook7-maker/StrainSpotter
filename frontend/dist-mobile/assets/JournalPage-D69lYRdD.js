var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { r as reactExports, j as jsxRuntimeExports, B as Box, C as Container, S as Stack, aW as LibraryBooksIcon, T as Typography, i as Button, n as CircularProgress, ag as Select, ah as MenuItem, Z as Divider, f as Card, h as CardContent, H as Chip } from "./react-vendor-DaVUs1pH.js";
import { s as supabase, a as API_BASE } from "./App-BxlAc3TE.js";
import { E as EmptyStateCard } from "./EmptyStateCard-BPZgdi7J.js";
import { J as JournalDialog } from "./JournalDialog-z8hMBNLf.js";
import "./vendor-qR99EfKL.js";
function JournalPage({ onBack }) {
  const [entries, setEntries] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [error, setError] = reactExports.useState(null);
  const [filter, setFilter] = reactExports.useState("all");
  const [dialogOpen, setDialogOpen] = reactExports.useState(false);
  const [dialogDefaults, setDialogDefaults] = reactExports.useState(null);
  const loadEntries = reactExports.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      if (!token) {
        setEntries([]);
        setLoading(false);
        return;
      }
      const resp = await fetch(`${API_BASE}/api/journals`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const payload = await resp.json().catch(() => []);
      if (!resp.ok) throw new Error(payload.error || "Failed to load journal entries.");
      setEntries(Array.isArray(payload) ? payload : []);
    } catch (err) {
      setError(err.message || "Unable to load journals.");
    } finally {
      setLoading(false);
    }
  }, []);
  reactExports.useEffect(() => {
    loadEntries();
  }, [loadEntries]);
  const grouped = reactExports.useMemo(() => {
    const filtered = filter === "all" ? entries : entries.filter((entry) => entry.strain_slug === filter);
    const map = /* @__PURE__ */ new Map();
    filtered.forEach((entry) => {
      const dateKey = entry.entry_date || entry.created_at?.split("T")[0] || "Unknown Date";
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey).push(entry);
    });
    return Array.from(map.entries()).sort((a, b) => new Date(b[0]) - new Date(a[0]));
  }, [entries, filter]);
  const strains = reactExports.useMemo(() => {
    const set = /* @__PURE__ */ new Set();
    entries.forEach((entry) => {
      if (entry.strain_slug) {
        set.add(entry.strain_slug);
      }
    });
    return Array.from(set);
  }, [entries]);
  const renderEntry = /* @__PURE__ */ __name((entry) => /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { variant: "outlined", sx: { mb: 1.5, background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.12)" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 1, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", justifyContent: "space-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "subtitle1", fontWeight: 700, children: entry.strain_name || entry.strain_slug || "Unknown strain" }),
      entry.rating ? /* @__PURE__ */ jsxRuntimeExports.jsx(Chip, { size: "small", color: "success", label: `${entry.rating}/5` }) : null
    ] }),
    entry.notes && /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", children: entry.notes }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", spacing: 1, flexWrap: "wrap", children: [
      entry.method && /* @__PURE__ */ jsxRuntimeExports.jsx(Chip, { size: "small", label: entry.method }),
      entry.dosage && /* @__PURE__ */ jsxRuntimeExports.jsx(Chip, { size: "small", label: entry.dosage }),
      entry.time_of_day && /* @__PURE__ */ jsxRuntimeExports.jsx(Chip, { size: "small", label: entry.time_of_day }),
      (entry.tags || []).map((tag) => /* @__PURE__ */ jsxRuntimeExports.jsx(Chip, { size: "small", variant: "outlined", label: `#${tag}` }, tag))
    ] })
  ] }) }) }, entry.id), "renderEntry");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Box,
    {
      sx: {
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden"
      },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Box,
          {
            sx: {
              flexShrink: 0,
              py: 2,
              px: 2,
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              bgcolor: "transparent",
              backdropFilter: "blur(10px)",
              zIndex: 1
            },
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(Container, { maxWidth: "md", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", justifyContent: "space-between", alignItems: "center", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", spacing: 1, alignItems: "center", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(LibraryBooksIcon, { sx: { color: "#7CB342" } }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h5", fontWeight: 800, sx: { color: "#fff" }, children: "Journal" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", spacing: 1, children: [
                onBack && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outlined", onClick: onBack, sx: { color: "#fff", borderColor: "rgba(255,255,255,0.3)" }, children: "Back" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "contained", onClick: /* @__PURE__ */ __name(() => {
                  setDialogDefaults(null);
                  setDialogOpen(true);
                }, "onClick"), children: "New entry" })
              ] })
            ] }) })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Box,
          {
            sx: {
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              WebkitOverflowScrolling: "touch"
            },
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Container, { maxWidth: "md", sx: { py: 4 }, children: [
              loading && /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { display: "flex", justifyContent: "center", py: 5 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(CircularProgress, {}) }),
              !loading && error && /* @__PURE__ */ jsxRuntimeExports.jsx(
                EmptyStateCard,
                {
                  title: "Unable to load journal",
                  description: error,
                  actionLabel: "Retry",
                  onAction: loadEntries
                }
              ),
              !loading && !error && entries.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
                EmptyStateCard,
                {
                  title: "No entries yet",
                  description: "Capture how each strain made you feel, the dosage, and what you’d change next time.",
                  actionLabel: "Scan your first strain",
                  onAction: /* @__PURE__ */ __name(() => window.dispatchEvent(new CustomEvent("nav:set-view", { detail: "scanner" })), "onAction"),
                  secondaryActionLabel: "Add a manual entry",
                  onSecondaryAction: /* @__PURE__ */ __name(() => setDialogOpen(true), "onSecondaryAction")
                }
              ),
              !loading && !error && entries.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: { xs: "column", sm: "row" }, spacing: 2, sx: { mb: 2 }, alignItems: "center", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", color: "text.secondary", children: "Filter by strain" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Select,
                    {
                      size: "small",
                      value: filter,
                      onChange: /* @__PURE__ */ __name((e) => setFilter(e.target.value), "onChange"),
                      sx: { minWidth: 200 },
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(MenuItem, { value: "all", children: "All strains" }),
                        strains.map((slug) => /* @__PURE__ */ jsxRuntimeExports.jsx(MenuItem, { value: slug, children: slug }, slug))
                      ]
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Stack, { spacing: 3, children: grouped.map(([date, dayEntries]) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "subtitle2", sx: { textTransform: "capitalize", color: "rgba(255,255,255,0.7)" }, children: new Date(date).toLocaleDateString(void 0, { weekday: "long", month: "long", day: "numeric" }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Divider, { sx: { my: 1, opacity: 0.2 } }),
                  dayEntries.map(renderEntry)
                ] }, date)) })
              ] })
            ] })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          JournalDialog,
          {
            open: dialogOpen,
            defaults: dialogDefaults,
            onClose: /* @__PURE__ */ __name(() => setDialogOpen(false), "onClose"),
            onSaved: /* @__PURE__ */ __name(() => {
              setDialogOpen(false);
              loadEntries();
            }, "onSaved")
          }
        )
      ]
    }
  );
}
__name(JournalPage, "JournalPage");
export {
  JournalPage as default
};
