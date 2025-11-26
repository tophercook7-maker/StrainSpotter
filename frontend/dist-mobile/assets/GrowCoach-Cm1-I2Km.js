var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { r as reactExports, j as jsxRuntimeExports, B as Box, S as Stack, P as Paper, a_ as AutoAwesome, T as Typography, Q as Tooltip, I as IconButton, U as RefreshIcon, A as Alert, a0 as Grid, m as TextField, ah as MenuItem, Z as Divider, s as FormControlLabel, aP as Switch, i as Button, a$ as Save, H as Chip, n as CircularProgress, b0 as GrassIcon, b1 as Share, b2 as ContentCopy, as as Snackbar, O as SendIcon, k as Tabs, l as Tab, L as LocalFloristIcon, b3 as Engineering, b4 as Grain, b5 as WbSunny, a3 as SpaIcon, a7 as MenuBookIcon, b6 as Opacity, b7 as WaterDrop, b8 as ScienceIcon, b9 as BugReport, ba as Timeline, bb as Checklist, bc as MonitorHeart, a5 as NoteAltIcon, ak as Slider } from "./react-vendor-DaVUs1pH.js";
import { s as supabase, a as API_BASE } from "./App-BxlAc3TE.js";
import { E as EmptyStateCard } from "./EmptyStateCard-BPZgdi7J.js";
import { B as BackHeader } from "./BackHeader-jwQJOBEe.js";
import "./vendor-qR99EfKL.js";
const stageOptions = [
  "Planning",
  "Germination",
  "Seedling",
  "Vegetative",
  "Early Flower",
  "Mid Flower",
  "Late Flower",
  "Flush",
  "Harvest",
  "Dry & Cure",
  "Maintenance"
];
const initialForm = /* @__PURE__ */ __name(() => ({
  runLabel: "",
  strainSlug: "",
  stage: "Vegetative",
  day: "",
  entryDate: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
  notes: "",
  highlight: "",
  healthIssues: "",
  remedies: "",
  nextActions: "",
  tasksCompleted: "",
  nutrientsUsed: "",
  medium: "",
  waterVolume: "",
  environmentNotes: "",
  aiPrompt: "",
  imageUrls: "",
  metrics: {
    temperature: "",
    humidity: "",
    vpd: "",
    ec: "",
    ph: "",
    co2: "",
    height: ""
  },
  shareEnabled: true,
  shareMessage: "",
  shareTags: "#StrainSpotter #GrowLog",
  vigor: "Thriving",
  pestCheck: "No pests detected"
}), "initialForm");
const parseList = /* @__PURE__ */ __name((value) => value.split(",").map((item) => item.trim()).filter(Boolean), "parseList");
const buildShareSummary = /* @__PURE__ */ __name((log) => {
  const progress = log.progress || {};
  const environment = progress.metrics || {};
  const share = progress.share || {};
  const lines = [
    `Grow Update – ${progress.run_label || "Untitled Run"}`,
    progress.day ? `Day ${progress.day}` : null,
    log.stage ? `Stage: ${log.stage}` : null,
    log.strain_slug ? `Strain: ${log.strain_slug}` : null,
    environment.temperature || environment.humidity || environment.ec || environment.ph ? `Vitals → Temp: ${environment.temperature || "—"} | RH: ${environment.humidity || "—"} | EC: ${environment.ec || "—"} | pH: ${environment.ph || "—"}` : null,
    log.notes ? `Highlights: ${log.notes}` : null,
    progress.tasks_completed?.length ? `Tasks: ${progress.tasks_completed.join(", ")}` : null,
    progress.next_actions?.length ? `Next: ${progress.next_actions.join(", ")}` : null,
    log.health_status?.issues?.length ? `Watch: ${log.health_status.issues.join(", ")}` : null,
    share.tags?.length ? `Tags: ${share.tags.map((tag) => tag.startsWith("#") ? tag : `#${tag}`).join(" ")}` : null
  ].filter(Boolean);
  if (share.summary) {
    return share.summary;
  }
  return lines.join("\n");
}, "buildShareSummary");
function GrowLogBook({ onBack: externalOnBack }) {
  const [form, setForm] = reactExports.useState(() => initialForm());
  const [logs, setLogs] = reactExports.useState([]);
  const [user, setUser] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  const [saving, setSaving] = reactExports.useState(false);
  const [error, setError] = reactExports.useState(null);
  const [snackbar, setSnackbar] = reactExports.useState({ open: false, message: "" });
  const textFieldSx = {
    "& .MuiInputLabel-root": { color: "#C5E1A5" },
    "& .MuiInputLabel-root.Mui-focused": { color: "#7CB342" },
    "& .MuiInputBase-input": { color: "#E8F5E9" },
    "& .MuiSelect-icon": { color: "#C5E1A5" },
    "& .MuiFormHelperText-root": { color: "#C5E1A5" },
    "& .MuiOutlinedInput-root": {
      bgcolor: "rgba(124, 179, 66, 0.05)",
      "& fieldset": { borderColor: "rgba(124, 179, 66, 0.3)" },
      "&:hover fieldset": { borderColor: "rgba(124, 179, 66, 0.5)" },
      "&.Mui-focused fieldset": { borderColor: "rgba(124, 179, 66, 0.7)" },
      "&.Mui-disabled": {
        bgcolor: "rgba(124, 179, 66, 0.02)",
        "& fieldset": { borderColor: "rgba(124, 179, 66, 0.1)" }
      }
    },
    "& input::placeholder": { color: "#9CCC65", opacity: 0.7 }
  };
  const loadUserAndLogs = reactExports.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await supabase.auth.getSession();
      const sessionUser = data?.session?.user || null;
      setUser(sessionUser);
      if (!sessionUser?.id || !data?.session?.access_token) {
        setLogs([]);
        setLoading(false);
        return;
      }
      const resp = await fetch(`${API_BASE}/api/growlogs?user_id=${sessionUser.id}`, {
        headers: {
          "Authorization": `Bearer ${data.session.access_token}`,
          "Content-Type": "application/json"
        }
      });
      if (!resp.ok) {
        if (resp.status === 401) {
          setUser(null);
          setLogs([]);
          setError(null);
          setLoading(false);
          return;
        }
        const body = await resp.json().catch(() => ({}));
        throw new Error(body.error || "Failed to load grow logs.");
      }
      const dataLogs = await resp.json();
      setLogs(Array.isArray(dataLogs) ? dataLogs : []);
    } catch (err) {
      console.error("[grow-logbook] load failed", err);
      setError(err.message || "Unable to load grow logs.");
    } finally {
      setLoading(false);
    }
  }, []);
  reactExports.useEffect(() => {
    loadUserAndLogs();
  }, [loadUserAndLogs]);
  const groupedLogs = reactExports.useMemo(() => {
    const groups = /* @__PURE__ */ new Map();
    logs.forEach((log) => {
      const label = log.progress?.run_label || "Unlabeled Run";
      if (!groups.has(label)) {
        groups.set(label, []);
      }
      groups.get(label).push(log);
    });
    return Array.from(groups.entries()).map(([label, items]) => ({
      label,
      items: items.sort((a, b) => {
        const dateA = new Date(a.progress?.entry_date || a.created_at || 0).getTime();
        const dateB = new Date(b.progress?.entry_date || b.created_at || 0).getTime();
        return dateB - dateA;
      })
    }));
  }, [logs]);
  const handleFormChange = /* @__PURE__ */ __name((field) => (event) => {
    const value = event.target.value;
    if (field.startsWith("metrics.")) {
      const key = field.split(".")[1];
      setForm((prev) => ({
        ...prev,
        metrics: {
          ...prev.metrics,
          [key]: value
        }
      }));
      return;
    }
    setForm((prev) => ({
      ...prev,
      [field]: value
    }));
  }, "handleFormChange");
  const handleToggleShare = /* @__PURE__ */ __name((_event, checked) => {
    setForm((prev) => ({
      ...prev,
      shareEnabled: checked
    }));
  }, "handleToggleShare");
  const handleSubmit = /* @__PURE__ */ __name(async () => {
    if (!user?.id) {
      setError("You need to be signed in to save grow logs.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const shareSummary = form.shareMessage || [
        `${form.runLabel || "Grow Log"} – ${form.stage}`,
        form.day ? `Day ${form.day}` : null,
        form.highlight || form.notes || null,
        form.nextActions ? `Next: ${form.nextActions}` : null
      ].filter(Boolean).join("\n");
      const payload = {
        user_id: user.id,
        strain_slug: form.strainSlug || null,
        stage: form.stage,
        notes: form.notes,
        images: parseList(form.imageUrls).slice(0, 6),
        health_status: {
          vigor: form.vigor,
          highlight: form.highlight,
          issues: parseList(form.healthIssues),
          medium: form.medium,
          pest_check: form.pestCheck,
          environment_notes: form.environmentNotes,
          water_volume: form.waterVolume
        },
        remedies: {
          actions: parseList(form.remedies),
          next_actions: parseList(form.nextActions),
          ai_prompt: form.aiPrompt
        },
        progress: {
          run_label: form.runLabel || "Untitled Run",
          day: form.day ? Number(form.day) : null,
          entry_date: form.entryDate,
          metrics: form.metrics,
          tasks_completed: parseList(form.tasksCompleted),
          next_actions: parseList(form.nextActions),
          nutrients: parseList(form.nutrientsUsed),
          environment_notes: form.environmentNotes,
          share: {
            enabled: form.shareEnabled,
            summary: shareSummary,
            tags: parseList(form.shareTags),
            token: form.shareEnabled ? crypto.randomUUID() : null
          },
          created_with: "grow-logbook-v1",
          last_updated: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      const resp = await fetch(`${API_BASE}/api/growlogs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...accessToken ? { "Authorization": `Bearer ${accessToken}` } : {}
        },
        body: JSON.stringify(payload)
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(data.error || "Failed to save grow log entry.");
      }
      setLogs((prev) => [data, ...prev]);
      setForm((prev) => ({
        ...initialForm(),
        runLabel: prev.runLabel,
        strainSlug: prev.strainSlug,
        stage: prev.stage
      }));
      setSnackbar({ open: true, message: "Grow log entry saved." });
    } catch (err) {
      console.error("[grow-logbook] save failed", err);
      setError(err.message || "Unable to save grow log entry.");
    } finally {
      setSaving(false);
    }
  }, "handleSubmit");
  const handleCopyShare = /* @__PURE__ */ __name(async (log) => {
    const summary = buildShareSummary(log);
    try {
      await navigator.clipboard.writeText(summary);
      setSnackbar({ open: true, message: "Share summary copied to clipboard." });
    } catch (err) {
      console.error("[grow-logbook] copy share failed", err);
      setError("Could not copy to clipboard. Please copy manually.");
    }
  }, "handleCopyShare");
  const handleBack = externalOnBack || (() => {
    if (window.history.length > 1) {
      window.history.back();
    }
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: {
    width: "100%",
    maxWidth: "100%",
    overflow: "hidden",
    minHeight: externalOnBack ? "100vh" : "auto",
    background: externalOnBack ? "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)" : "transparent",
    display: "flex",
    flexDirection: "column"
  }, children: [
    externalOnBack && /* @__PURE__ */ jsxRuntimeExports.jsx(BackHeader, { title: "Grow Logbook", onBack: handleBack }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { flex: 1, overflowY: "auto", py: externalOnBack ? 1.5 : 0, px: { xs: 0.5, sm: 1 }, mx: 0, width: "100%", boxSizing: "border-box" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: externalOnBack ? 2 : 1.5, sx: { width: "100%", maxWidth: "100%", overflow: "hidden", mx: 0 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Paper,
        {
          elevation: 0,
          id: "grow-log-form",
          sx: {
            p: { xs: 1.25, sm: 1.5 },
            borderRadius: 2,
            background: "rgba(124, 179, 66, 0.1)",
            border: "2px solid rgba(124, 179, 66, 0.3)",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
            width: "100%",
            maxWidth: "100%",
            overflow: "hidden",
            wordWrap: "break-word",
            overflowWrap: "break-word",
            mx: 0
          },
          children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: { xs: "column", sm: "row" }, spacing: 1.5, justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, sx: { mb: 1.5 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { flex: 1 }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", spacing: 1.5, alignItems: "center", sx: { mb: 1 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: {
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #7CB342, #9CCC65)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 20px rgba(124, 179, 66, 0.5)"
              }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(AutoAwesome, { sx: { color: "#fff", fontSize: 28 } }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { flex: 1 }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h5", fontWeight: 800, sx: { fontSize: "1.3rem", color: "#E8F5E9", mb: 0.5 }, children: "🤖 AI-Powered Log Entry" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body1", sx: { color: "#C5E1A5", fontSize: "0.95rem", maxWidth: "100%", wordBreak: "break-word", overflowWrap: "break-word", fontWeight: 600 }, children: "AI analyzes your data and provides instant insights. Log metrics, photos, and observations—get recommendations automatically." })
              ] })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Stack, { direction: "row", spacing: 1, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { title: "Refresh entries", children: /* @__PURE__ */ jsxRuntimeExports.jsx(IconButton, { onClick: loadUserAndLogs, color: "success", sx: { color: "#7CB342" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshIcon, {}) }) }) })
          ] })
        }
      ),
      error && /* @__PURE__ */ jsxRuntimeExports.jsx(
        Alert,
        {
          severity: "error",
          onClose: /* @__PURE__ */ __name(() => setError(null), "onClose"),
          sx: {
            bgcolor: "rgba(244, 67, 54, 0.2)",
            color: "#FFB74D",
            border: "1px solid rgba(244, 67, 54, 0.4)",
            "& .MuiAlert-icon": { color: "#FFB74D" }
          },
          children: error
        }
      ),
      !user && !loading && /* @__PURE__ */ jsxRuntimeExports.jsx(
        Alert,
        {
          severity: "info",
          sx: {
            bgcolor: "rgba(124, 179, 66, 0.2)",
            color: "#E8F5E9",
            border: "1px solid rgba(124, 179, 66, 0.4)",
            "& .MuiAlert-icon": { color: "#7CB342" }
          },
          children: "Sign in to unlock the Grow Logbook and keep detailed records of every run."
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Paper,
        {
          elevation: 0,
          sx: {
            p: { xs: 1.25, sm: 1.5 },
            borderRadius: 2,
            background: "rgba(124, 179, 66, 0.1)",
            border: "2px solid rgba(124, 179, 66, 0.3)",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
            width: "100%",
            maxWidth: "100%",
            overflow: "hidden",
            wordWrap: "break-word",
            overflowWrap: "break-word",
            mx: 0
          },
          children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 1.5, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "subtitle1", fontWeight: 800, sx: { wordBreak: "break-word", fontSize: "1rem", display: "flex", alignItems: "center", gap: 1, color: "#E8F5E9" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(AutoAwesome, { sx: { fontSize: 18, color: "#7CB342" } }),
              " Quick Entry"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Grid, { container: true, spacing: 2, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { item: true, xs: 12, md: 6, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                TextField,
                {
                  label: "Grow / Run Label",
                  placeholder: "e.g., Blue Dream - Spring 2024",
                  value: form.runLabel,
                  onChange: handleFormChange("runLabel"),
                  fullWidth: true,
                  required: true,
                  helperText: "Name this grow run for easy tracking",
                  sx: textFieldSx
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { item: true, xs: 12, md: 3, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                TextField,
                {
                  label: "Day",
                  placeholder: "42",
                  value: form.day,
                  onChange: handleFormChange("day"),
                  fullWidth: true,
                  type: "number",
                  inputProps: { min: 0 },
                  helperText: "Days since germination",
                  sx: textFieldSx
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { item: true, xs: 12, md: 3, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                TextField,
                {
                  label: "Entry Date",
                  type: "date",
                  value: form.entryDate,
                  onChange: handleFormChange("entryDate"),
                  fullWidth: true,
                  InputLabelProps: { shrink: true },
                  helperText: "When did this happen?",
                  sx: textFieldSx
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { item: true, xs: 12, md: 6, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                TextField,
                {
                  label: "Strain Name",
                  placeholder: "e.g., Blue Dream, OG Kush",
                  value: form.strainSlug,
                  onChange: handleFormChange("strainSlug"),
                  fullWidth: true,
                  helperText: "Strain name or nickname",
                  sx: textFieldSx
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { item: true, xs: 12, md: 6, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                TextField,
                {
                  label: "Growth Stage",
                  select: true,
                  value: form.stage,
                  onChange: handleFormChange("stage"),
                  fullWidth: true,
                  sx: textFieldSx,
                  children: stageOptions.map((option) => /* @__PURE__ */ jsxRuntimeExports.jsx(MenuItem, { value: option, sx: { color: "#E8F5E9", bgcolor: "rgba(124, 179, 66, 0.1)" }, children: option }, option))
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { item: true, xs: 12, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                TextField,
                {
                  label: "Session Notes / Highlights",
                  placeholder: "What happened today? Any observations, changes, or important notes...",
                  value: form.notes,
                  onChange: handleFormChange("notes"),
                  multiline: true,
                  minRows: 3,
                  fullWidth: true,
                  helperText: "Describe today's grow session in detail",
                  sx: textFieldSx
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { item: true, xs: 12, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                TextField,
                {
                  label: "Key Highlight",
                  placeholder: "e.g., First pistils appeared, Topped main cola",
                  value: form.highlight,
                  onChange: handleFormChange("highlight"),
                  fullWidth: true,
                  helperText: "One key thing that happened today",
                  sx: textFieldSx
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { item: true, xs: 12, md: 6, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                TextField,
                {
                  label: "Tasks Completed",
                  placeholder: "Watered, Defoliated, Checked pH",
                  value: form.tasksCompleted,
                  onChange: handleFormChange("tasksCompleted"),
                  fullWidth: true,
                  helperText: "Separate with commas",
                  sx: textFieldSx
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { item: true, xs: 12, md: 6, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                TextField,
                {
                  label: "Upcoming Actions",
                  placeholder: "Feed tomorrow, Check for pests, Increase humidity",
                  value: form.nextActions,
                  onChange: handleFormChange("nextActions"),
                  fullWidth: true,
                  helperText: "What's next? Separate with commas",
                  sx: textFieldSx
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { item: true, xs: 12, md: 4, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                TextField,
                {
                  label: "Nutrients / Additives",
                  placeholder: "e.g., Cal-Mag 5ml, Bloom nutes 10ml",
                  value: form.nutrientsUsed,
                  onChange: handleFormChange("nutrientsUsed"),
                  fullWidth: true,
                  helperText: "What did you feed?",
                  sx: textFieldSx
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { item: true, xs: 12, md: 4, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                TextField,
                {
                  label: "Growing Medium",
                  placeholder: "e.g., Coco, Soil, Hydro, DWC",
                  value: form.medium,
                  onChange: handleFormChange("medium"),
                  fullWidth: true,
                  helperText: "What medium are you using?",
                  sx: textFieldSx
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { item: true, xs: 12, md: 4, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                TextField,
                {
                  label: "Water / Feed Volume",
                  placeholder: "e.g., 2 gallons, 500ml per plant",
                  value: form.waterVolume,
                  onChange: handleFormChange("waterVolume"),
                  fullWidth: true,
                  helperText: "How much did you water/feed?",
                  sx: textFieldSx
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { item: true, xs: 12, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                TextField,
                {
                  label: "Environment Notes",
                  placeholder: "e.g., Temp spiked to 82°F, Added humidifier, Fan speed increased",
                  value: form.environmentNotes,
                  onChange: handleFormChange("environmentNotes"),
                  multiline: true,
                  minRows: 2,
                  fullWidth: true,
                  helperText: "Any environmental changes or observations",
                  sx: textFieldSx
                }
              ) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Divider, {}),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "subtitle2", fontWeight: 700, sx: { color: "#E8F5E9" }, children: "Vital Metrics" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { container: true, spacing: 1.5, children: Object.entries(form.metrics).map(([key, value]) => {
              const placeholders = {
                temperature: "75°F",
                humidity: "55%",
                vpd: "1.2",
                ec: "2.0",
                ph: "6.5",
                co2: "400ppm",
                height: '24"'
              };
              const helpers = {
                temperature: "Room temperature",
                humidity: "Relative humidity",
                vpd: "Vapor pressure deficit",
                ec: "Electrical conductivity",
                ph: "pH level",
                co2: "CO₂ concentration",
                height: "Plant height"
              };
              return /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { item: true, xs: 6, sm: 4, md: 3, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                TextField,
                {
                  label: key.charAt(0).toUpperCase() + key.slice(1),
                  placeholder: placeholders[key] || "Enter value",
                  value,
                  onChange: handleFormChange(`metrics.${key}`),
                  fullWidth: true,
                  helperText: helpers[key] || "",
                  size: "small",
                  sx: textFieldSx
                }
              ) }, key);
            }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Divider, {}),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "subtitle2", fontWeight: 700, sx: { color: "#E8F5E9" }, children: "Health Check" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Grid, { container: true, spacing: 1.5, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { item: true, xs: 12, md: 4, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                TextField,
                {
                  label: "Plant Vigor",
                  placeholder: "e.g., Thriving, Good, Struggling",
                  value: form.vigor,
                  onChange: handleFormChange("vigor"),
                  fullWidth: true,
                  helperText: "Overall plant health",
                  sx: textFieldSx
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { item: true, xs: 12, md: 4, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                TextField,
                {
                  label: "Health Issues",
                  placeholder: "e.g., Yellowing leaves, Brown spots, Slow growth",
                  value: form.healthIssues,
                  onChange: handleFormChange("healthIssues"),
                  fullWidth: true,
                  helperText: "Separate with commas",
                  sx: textFieldSx
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { item: true, xs: 12, md: 4, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                TextField,
                {
                  label: "Pest Check",
                  placeholder: "e.g., No pests detected, Found spider mites",
                  value: form.pestCheck,
                  onChange: handleFormChange("pestCheck"),
                  fullWidth: true,
                  helperText: "Pest inspection results",
                  sx: textFieldSx
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { item: true, xs: 12, md: 6, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                TextField,
                {
                  label: "Corrective Actions",
                  placeholder: "e.g., Applied neem oil, Increased airflow, Adjusted pH",
                  value: form.remedies,
                  onChange: handleFormChange("remedies"),
                  fullWidth: true,
                  helperText: "What did you do to fix issues?",
                  sx: textFieldSx
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { item: true, xs: 12, md: 6, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                TextField,
                {
                  label: "🤖 AI Question / Prompt",
                  placeholder: "e.g., Why are my leaves curling? Best nutrients for week 4?",
                  value: form.aiPrompt,
                  onChange: handleFormChange("aiPrompt"),
                  fullWidth: true,
                  helperText: "Ask AI for help or insights",
                  sx: textFieldSx
                }
              ) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Divider, {}),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "subtitle2", fontWeight: 700, sx: { color: "#E8F5E9" }, children: "Media & Sharing" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Grid, { container: true, spacing: 1.5, alignItems: "center", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { item: true, xs: 12, md: 8, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                TextField,
                {
                  label: "Image URLs",
                  placeholder: "Paste image URLs separated by commas",
                  value: form.imageUrls,
                  onChange: handleFormChange("imageUrls"),
                  fullWidth: true,
                  helperText: "Add photos of your grow (comma separated URLs)",
                  sx: textFieldSx
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { item: true, xs: 12, md: 4, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                FormControlLabel,
                {
                  control: /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { checked: form.shareEnabled, onChange: handleToggleShare, color: "success" }),
                  label: /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { sx: { color: "#E8F5E9" }, children: "Generate share summary" })
                }
              ) }),
              form.shareEnabled && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { item: true, xs: 12, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  TextField,
                  {
                    label: "Share summary override",
                    value: form.shareMessage,
                    onChange: handleFormChange("shareMessage"),
                    multiline: true,
                    minRows: 2,
                    fullWidth: true,
                    placeholder: "Optional custom message for social posts or group chats",
                    sx: textFieldSx
                  }
                ) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { item: true, xs: 12, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  TextField,
                  {
                    label: "Share tags (comma separated)",
                    value: form.shareTags,
                    onChange: handleFormChange("shareTags"),
                    fullWidth: true,
                    sx: textFieldSx
                  }
                ) })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: { xs: "column", sm: "row" }, spacing: 2, justifyContent: "flex-end", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  variant: "outlined",
                  startIcon: /* @__PURE__ */ jsxRuntimeExports.jsx(AutoAwesome, {}),
                  onClick: /* @__PURE__ */ __name(async () => {
                    try {
                      const summaryParts = [
                        `${form.runLabel || "Grow Log"} – ${form.stage}`,
                        form.day && `Day ${form.day}`,
                        form.highlight && `✨ ${form.highlight}`,
                        form.tasksCompleted && `✅ Tasks: ${form.tasksCompleted}`,
                        form.nextActions && `📋 Next: ${form.nextActions}`,
                        form.healthIssues && `⚠️ Watch: ${form.healthIssues}`,
                        form.metrics.temperature && `🌡️ Temp: ${form.metrics.temperature}°F`,
                        form.metrics.humidity && `💧 RH: ${form.metrics.humidity}%`,
                        form.metrics.ph && `🧪 pH: ${form.metrics.ph}`,
                        form.metrics.ec && `⚡ EC: ${form.metrics.ec}`
                      ].filter(Boolean);
                      const autoShare = summaryParts.join("\n");
                      setForm((prev) => ({ ...prev, shareMessage: autoShare }));
                      setSnackbar({ open: true, message: "AI summary generated!" });
                    } catch (err) {
                      console.error("Failed to generate summary:", err);
                    }
                  }, "onClick"),
                  sx: {
                    borderColor: "rgba(124, 179, 66, 0.5)",
                    color: "#7CB342",
                    "&:hover": {
                      borderColor: "#7CB342",
                      bgcolor: "rgba(124, 179, 66, 0.1)"
                    }
                  },
                  children: "🤖 AI Generate Summary"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  variant: "contained",
                  color: "success",
                  startIcon: /* @__PURE__ */ jsxRuntimeExports.jsx(Save, {}),
                  onClick: handleSubmit,
                  disabled: saving || !user,
                  children: saving ? "Saving…" : "Save Entry"
                }
              )
            ] })
          ] })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Paper,
        {
          elevation: 0,
          sx: {
            p: { xs: 1.25, sm: 1.5 },
            borderRadius: 2,
            background: "rgba(124, 179, 66, 0.1)",
            border: "2px solid rgba(124, 179, 66, 0.3)",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
            mx: 0
          },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, spacing: 2, sx: { mb: 2 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "subtitle1", fontWeight: 800, sx: { color: "#E8F5E9" }, children: "Logged Sessions" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Chip, { label: `${logs.length} entries`, color: "success", variant: "outlined" })
            ] }),
            loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { display: "flex", justifyContent: "center", py: 4 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(CircularProgress, { color: "success" }) }) : groupedLogs.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              EmptyStateCard,
              {
                title: "No grow logs yet",
                description: "Capture your daily environment, feedings, and canopy changes to unlock AI insights.",
                icon: /* @__PURE__ */ jsxRuntimeExports.jsx(GrassIcon, { sx: { fontSize: 56, color: "#2e7d32" } }),
                actionLabel: "Add first log",
                onAction: /* @__PURE__ */ __name(() => {
                  const section = document.getElementById("grow-log-form");
                  if (section) {
                    section.scrollIntoView({ behavior: "smooth" });
                  }
                }, "onAction")
              }
            ) : /* @__PURE__ */ jsxRuntimeExports.jsx(Stack, { spacing: 3, children: groupedLogs.map(({ label, items }) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Paper,
              {
                elevation: 0,
                sx: {
                  p: 2,
                  borderRadius: 3,
                  border: "1px solid rgba(124, 179, 66, 0.3)",
                  background: "rgba(124, 179, 66, 0.08)"
                },
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: { xs: "column", sm: "row" }, spacing: 1, justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, sx: { mb: 1 }, children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "subtitle2", fontWeight: 800, sx: { color: "#E8F5E9" }, children: label }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Chip, { label: `${items.length} updates`, size: "small" })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Stack, { spacing: 2, children: items.map((log) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Paper,
                    {
                      elevation: 0,
                      sx: {
                        p: 2,
                        borderRadius: 2,
                        border: "1px solid rgba(124, 179, 66, 0.2)",
                        background: "rgba(124, 179, 66, 0.05)"
                      },
                      children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: { xs: "column", sm: "row" }, spacing: 1, justifyContent: "space-between", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 0.5, children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", spacing: 1, alignItems: "center", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(Chip, { label: log.stage || "Stage?", size: "small", color: "success", variant: "outlined" }),
                            log.progress?.day && /* @__PURE__ */ jsxRuntimeExports.jsx(Chip, { label: `Day ${log.progress.day}`, size: "small" }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "caption", sx: { color: "#C5E1A5" }, children: new Date(log.progress?.entry_date || log.created_at).toLocaleString() })
                          ] }),
                          log.notes && /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "#E8F5E9" }, children: log.notes }),
                          log.progress?.tasks_completed?.length ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", sx: { color: "#E8F5E9" }, children: [
                            "Tasks: ",
                            log.progress.tasks_completed.join(", ")
                          ] }) : null,
                          log.progress?.next_actions?.length ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", sx: { color: "#E8F5E9" }, children: [
                            "Next: ",
                            log.progress.next_actions.join(", ")
                          ] }) : null,
                          log.health_status?.issues?.length ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", sx: { color: "#FFB74D" }, children: [
                            "Watch: ",
                            log.health_status.issues.join(", ")
                          ] }) : null,
                          log.progress?.metrics ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "caption", sx: { color: "#C5E1A5" }, children: [
                            "Vitals → Temp ",
                            log.progress.metrics.temperature || "—",
                            " | RH ",
                            log.progress.metrics.humidity || "—",
                            " | EC ",
                            log.progress.metrics.ec || "—",
                            " | pH ",
                            log.progress.metrics.ph || "—"
                          ] }) : null
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 1, direction: { xs: "row", sm: "column" }, justifyContent: "flex-start", alignItems: { xs: "center", sm: "flex-end" }, children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { title: "Copy share summary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(IconButton, { color: "success", onClick: /* @__PURE__ */ __name(() => handleCopyShare(log), "onClick"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Share, {}) }) }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { title: "Copy raw entry JSON", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                            IconButton,
                            {
                              onClick: /* @__PURE__ */ __name(async () => {
                                try {
                                  await navigator.clipboard.writeText(JSON.stringify(log, null, 2));
                                  setSnackbar({ open: true, message: "Entry JSON copied." });
                                } catch {
                                  setError("Unable to copy JSON to clipboard.");
                                }
                              }, "onClick"),
                              children: /* @__PURE__ */ jsxRuntimeExports.jsx(ContentCopy, {})
                            }
                          ) })
                        ] })
                      ] })
                    },
                    log.id
                  )) })
                ]
              },
              label
            )) })
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Snackbar,
        {
          open: snackbar.open,
          autoHideDuration: 4e3,
          onClose: /* @__PURE__ */ __name(() => setSnackbar({ open: false, message: "" }), "onClose"),
          message: snackbar.message
        }
      )
    ] }) })
  ] });
}
__name(GrowLogBook, "GrowLogBook");
function Section({ title, children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Box,
    {
      sx: {
        mb: 3,
        p: 2,
        borderRadius: 3,
        backgroundColor: "rgba(124, 179, 66, 0.08)",
        border: "1px solid rgba(124, 179, 66, 0.2)",
        boxShadow: "0 6px 18px rgba(20,40,20,0.15)",
        width: "100%",
        maxWidth: "100%",
        overflow: "hidden",
        // Prevent overflow
        wordWrap: "break-word",
        // Break long words
        overflowWrap: "break-word"
        // Modern word break
      },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "subtitle1", fontWeight: 800, gutterBottom: true, sx: { color: "#E8F5E9", wordBreak: "break-word", overflowWrap: "break-word", px: 0, mx: 0, fontSize: "1rem" }, children: title }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "#E8F5E9", wordBreak: "break-word", overflowWrap: "break-word", px: 0, mx: 0, width: "100%", boxSizing: "border-box", fontSize: "0.9rem", lineHeight: 1.6 }, children })
      ]
    }
  );
}
__name(Section, "Section");
const LOGBOOK_TAB_INDEX = 13;
function GrowCoach({ onBack, initialTab = 0 }) {
  const handleBack = onBack || (() => {
    if (window.history.length > 1) {
      window.history.back();
    }
  });
  const [tab, setTab] = reactExports.useState(initialTab);
  const [timelineIndex, setTimelineIndex] = reactExports.useState(0);
  const [question, setQuestion] = reactExports.useState("");
  const [messages, setMessages] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(false);
  const [questionsRemaining, setQuestionsRemaining] = reactExports.useState(5);
  const chatEndRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    const today = (/* @__PURE__ */ new Date()).toDateString();
    const stored = localStorage.getItem("growCoach_questions");
    if (stored) {
      const { date, count } = JSON.parse(stored);
      if (date === today) {
        setQuestionsRemaining(Math.max(0, 5 - count));
      }
    }
  }, []);
  reactExports.useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  const handleAskQuestion = /* @__PURE__ */ __name(async () => {
    if (!question.trim() || loading || questionsRemaining <= 0) return;
    const userMessage = question.trim();
    setQuestion("");
    setLoading(true);
    const newMessages = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    const today = (/* @__PURE__ */ new Date()).toDateString();
    const stored = localStorage.getItem("growCoach_questions");
    let count = 1;
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.date === today) {
        count = parsed.count + 1;
      }
    }
    localStorage.setItem("growCoach_questions", JSON.stringify({ date: today, count }));
    setQuestionsRemaining(Math.max(0, 5 - count));
    try {
      const endpoint = `${API_BASE}/api/grow-coach/ask`;
      console.log("[GrowCoach] Calling AI endpoint:", endpoint);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3e4);
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...accessToken ? { "Authorization": `Bearer ${accessToken}` } : {}
        },
        body: JSON.stringify({ question: userMessage }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("[GrowCoach] API error:", response.status, errorText);
        console.error("[GrowCoach] Endpoint URL:", endpoint);
        console.error("[GrowCoach] API_BASE:", API_BASE);
        let errorMessage = `Server error (${response.status})`;
        if (response.status === 404) {
          errorMessage = "AI endpoint not found. The backend server may not be running or the route is misconfigured.";
        } else if (response.status === 401) {
          errorMessage = "Authentication required. Please sign in and try again.";
        } else {
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.answer || errorData.error || errorMessage;
          } catch (e) {
          }
        }
        throw new Error(errorMessage);
      }
      const data = await response.json();
      console.log("[GrowCoach] AI response received:", data);
      const responseText = data.answer || data.error || "I apologize, but I couldn't generate a response. Please try again later.";
      setMessages([...newMessages, { role: "assistant", content: responseText }]);
    } catch (error) {
      console.error("[GrowCoach] AI question error:", error);
      let errorMessage = "I'm having trouble connecting right now.";
      if (error.name === "AbortError") {
        errorMessage = "The request timed out. Please check your connection and try again.";
      } else if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
        errorMessage = "Unable to reach the server. Please check your internet connection and try again.";
      } else if (error.message) {
        errorMessage = `Connection issue: ${error.message}. Please try again in a moment.`;
      }
      setMessages([...newMessages, {
        role: "assistant",
        content: `${errorMessage} For now, try checking the relevant tab above for detailed guidance. You can also try asking again in a moment.`
      }]);
    } finally {
      setLoading(false);
    }
  }, "handleAskQuestion");
  reactExports.useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);
  const overviewSections = reactExports.useMemo(
    () => [
      {
        title: "The Four Pillars of Success",
        body: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Environment:" }),
          " Hold temperature, humidity, VPD, airflow, and CO₂ inside target ranges for every stage. Stable rooms prevent most problems.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Genetics:" }),
          " Choose cultivars that fit your ceiling height, flowering window, and desired chemotype. Verify breeder data, germination rates, and lab tests.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Nutrition & Water:" }),
          " Deliver balanced feed at the correct EC and pH. Adjust based on runoff data and leaf feedback instead of bottle recommendations alone.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Observation & Logging:" }),
          " Inspect plants daily, record metrics, and photograph everything. Consistent logs unlock AI-driven insights and make troubleshooting fast."
        ] })
      },
      {
        title: "Baseline Targets",
        body: /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { container: true, spacing: 2, children: [
          { stage: "Seedling", temp: "75-80°F", rh: "65-75% RH", vpd: "0.4-0.8 kPa", light: "200-300 PPFD (18-24 hrs)" },
          { stage: "Vegetative", temp: "76-82°F", rh: "55-65% RH", vpd: "1.0-1.2 kPa", light: "350-550 PPFD (18/6 or 20/4)" },
          { stage: "Early Flower", temp: "76-80°F", rh: "45-55% RH", vpd: "1.1-1.3 kPa", light: "650-750 PPFD (12/12)" },
          { stage: "Mid/Late Flower", temp: "74-78°F", rh: "40-50% RH", vpd: "1.2-1.4 kPa", light: "750-900 PPFD (12/12)" },
          { stage: "Dry + Cure", temp: "60-65°F", rh: "55-60% RH", vpd: "0.7-0.8 kPa", light: "Complete darkness" }
        ].map((row) => /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { item: true, xs: 12, sm: 6, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Paper, { elevation: 0, sx: { p: 2, borderRadius: 3, background: "rgba(124, 179, 66, 0.1)", border: "1px solid rgba(124, 179, 66, 0.3)" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "subtitle2", fontWeight: 700, sx: { color: "#E8F5E9" }, children: row.stage }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", sx: { color: "#E8F5E9" }, children: [
            "Temperature: ",
            row.temp
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", sx: { color: "#E8F5E9" }, children: [
            "Humidity: ",
            row.rh
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", sx: { color: "#E8F5E9" }, children: [
            "VPD: ",
            row.vpd
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", sx: { color: "#E8F5E9" }, children: [
            "Lighting: ",
            row.light
          ] })
        ] }) }, row.stage)) }) })
      },
      {
        title: "Core Equipment Checklist",
        body: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Space:" }),
          " 2×2–4×4 reflective tent, inline exhaust + carbon filter (CFM ≥ tent volume ×1.25), passive or filtered active intake, oscillating clip fans for canopy and under-canopy airflow.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Lighting:" }),
          " Full-spectrum dimmable LED (PPF ≥2.4 µmol/J) with timer/smart plug. Reference manufacturer PPFD map to set hanging height.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Mediums:" }),
          " Fabric pots (3–7 gal). Choose living soil (amended), coco/perlite (70/30), or soilless peat. Always use quality water (RO or filtered tap + Cal-Mag as required).",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Monitoring:" }),
          " Calibrated pH pen, EC/TDS meter, hygrometer/thermometer at canopy, jeweler’s loupe (60×), optional Bluetooth sensors for remote logging.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Supplies:" }),
          " Two- or three-part base nutrients, silica, Cal-Mag, microbial inoculant, IPM toolkit (biologicals, neem alternatives), enzyme or flushing solution, scissors, alcohol wipes.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Automation Ready:" }),
          " Smart plugs, leak trays, Wi-Fi sensors, StrainSpotter Grow Log templates for daily data capture."
        ] })
      },
      {
        title: "Your First Cycle Roadmap",
        body: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Week 0:" }),
          " Sanitize space, assemble equipment, run empty test for 24 hours.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Weeks 1-2:" }),
          " Germinate, establish seedlings, record emergence.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Weeks 3-6:" }),
          " Vegetative growth, training, transplant, canopy leveling.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Weeks 7-16:" }),
          " Flower stretch, bud formation, bulking, ripening.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Weeks 17-18:" }),
          " Harvest, dry, cure, and review analytics for next run.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "Pair this roadmap with the Stage Timelines tab for detailed weekly objectives."
        ] })
      },
      {
        title: "USA Climate Zones & Adjustments",
        body: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Hot & Dry (Southwest - AZ, NV, CA desert):" }),
          " Use AC/dehumidifier combo. Target 75-78°F day, 68-72°F night. RH 40-50% flower. Increase watering frequency. Consider CO₂ supplementation to offset high temps. LED preferred over HPS to reduce heat load.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Hot & Humid (Southeast - FL, GA, SC):" }),
          " Dehumidifier essential. Target 76-80°F day, 70-74°F night. RH 45-55% veg, 40-48% flower. Increase airflow, use exhaust fan 24/7. Watch for powdery mildew and botrytis. Consider shorter flowering strains (7-8 weeks).",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Temperate (Pacific Northwest, Northeast):" }),
          " Natural climate advantage. Target 72-78°F day, 65-70°F night. RH 50-60% veg, 45-55% flower. May need heating in winter, cooling in summer. Excellent for longer flowering sativas (10-12 weeks).",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Cold & Dry (Mountain states, Northern Midwest):" }),
          " Heating required. Target 74-78°F day, 68-72°F night. RH 50-60% veg, 45-50% flower. Use humidifier in winter. Insulate grow space. LED preferred for lower heat output. Consider indica-dominant strains for faster finish.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Cold & Humid (Great Lakes, New England):" }),
          " Heating + dehumidifier. Target 74-78°F day, 68-72°F night. RH 50-60% veg, 40-48% flower. Prevent condensation on walls. Excellent airflow critical. Shorter flowering strains recommended (8-9 weeks)."
        ] })
      },
      {
        title: "Skill Level Guides",
        body: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Newbie (First 1-2 grows):" }),
          " Start with autoflowers or easy indica-dominant strains. Use pre-mixed living soil or simple two-part nutrients. Focus on environment control (temp/RH) over advanced techniques. Keep detailed logs. Don't overwater—let pots dry between waterings. Simple LST only, no HST. Target 0.5-1.0g per watt yield is excellent for first runs.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Intermediate (3-10 grows):" }),
          " Try photoperiod strains, experiment with training (LST, topping, SCROG). Learn to read runoff EC/pH. Start adjusting nutrients based on plant feedback. Try different mediums (coco vs soil). Master VPD basics. Target 1.0-1.5g per watt. Begin tracking trends with AI logs.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Professional/Advanced (10+ grows):" }),
          " Fine-tune environment to cultivar-specific needs. Advanced training (manifolding, mainlining, advanced SCROG). Master nutrient ratios and custom feed schedules. Optimize CO₂ supplementation. Dial in VPD precisely for each stage. Experiment with different light spectrums. Target 1.5-2.0+ g per watt. Use AI analytics to optimize every variable."
        ] })
      }
    ],
    []
  );
  const setupSections = reactExports.useMemo(
    () => [
      {
        title: "Space & Environmental Control",
        body: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          "• Position tent away from direct sunlight and HVAC vents; ensure dedicated electrical circuit.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• Calculate exhaust fan size: ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("em", { children: "CFM = tent volume × air exchange target (1.25-1.5)" }),
          ". Add 25% headroom for filter resistance.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• Configure air path: passive lower intake or filtered active intake; carbon filter at canopy height exhausting outdoors or into lung room.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• Install two oscillating fans (above and below canopy) for gentle non-stop airflow.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• Lightproof the space—patch pinholes with foil tape, double up flaps to prevent light leaks during flower."
        ] })
      },
      {
        title: "Medium Recipes",
        body: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Living Soil (per 10 gal):" }),
          " 5 gal sphagnum peat, 3 gal aeration (pumice/perlite), 2 gal compost. Amend with 2 cups kelp meal, 2 cups neem/karanja, 2 cups crustacean meal, 1 cup gypsum, 1 cup basalt, 1 cup dolomite lime. Moisture to field capacity, rest 2-4 weeks, inoculate with mycorrhizae at transplant.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Coco/Perlite 70/30:" }),
          " Rinse buffered coco until runoff EC <0.6 mS/cm, mix with medium perlite. Feed 1.0 EC from day one, 10-15% runoff each watering, maintain root-zone pH 5.8-6.2.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Soilless Peat (Pro-Mix style):" }),
          " 80% peat, 20% perlite with mycorrhizae. Requires full nutrient program similar to coco but slower dryback. Maintain pH 6.0-6.3."
        ] })
      },
      {
        title: "Containers & Irrigation",
        body: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          "• Fabric pots promote air pruning and faster oxygen exchange; pair with saucers and risers.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• Plastic pots retain moisture longer—reduce watering frequency or increase airflow.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• Automated options: drip rings, Blumat carrots, or ebb-and-flow trays. Log irrigation events and volumes in StrainSpotter.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• Sterilise irrigation lines monthly; flush with 3% peroxide solution during turnaround."
        ] })
      },
      {
        title: "Monitoring & Calibration",
        body: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          "• Place hygrometer at canopy height and second sensor near root zone to monitor gradients.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• Calibrate pH pen weekly if high-use; store probe in KCl solution, never dry.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• Rinse EC meter with RO after use; calibrate monthly with 1413 µS/cm solution.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• Log calibration dates, filter changes, and cleanings for compliance.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• Use lux meter (or reliable phone app) with conversion factor (lux × 0.015 ≈ PPFD for white LEDs) when PAR meter absent."
        ] })
      },
      {
        title: "Automation & Data Readiness",
        body: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          "• Connect smart plugs to StrainSpotter webhook for automated light cycle logging.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• Install Wi-Fi or Bluetooth sensors and sync to mobile dashboards for instant alerts.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• Build a StrainSpotter daily log template capturing: ambient temp, RH, CO₂, irrigation volume, input EC/pH, runoff EC/pH, observations.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• Photograph final setup (lights on/off) and upload to AI for placement review (fan orientation, light height, potential hotspots)."
        ] })
      }
    ],
    []
  );
  const germinationSections = reactExports.useMemo(
    () => [
      {
        title: "Germination Workflow (Days 0-7)",
        body: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          "1. ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Hydrate:" }),
          " Soak seeds 12-18 hours in 68-70°F filtered water (dark environment). Seeds often sink after a few hours—floating seeds can be coaxed under.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "2. ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Incubate:" }),
          " Transfer to moist (not soaked) paper towels between plates or inside a germination tray. Maintain 75-80°F and 70-80% RH.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "3. ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Monitor:" }),
          " Check twice daily. Keep towels damp. Wait for 0.25-0.5 inch taproot before planting.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "4. ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Plant:" }),
          " Place taproot-down in pre-moistened medium 0.25-0.5 inch deep. Cover lightly and mist surface.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "5. ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Acclimate:" }),
          " Use humidity dome for first 3-5 days, vent gradually to harden seedlings.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "Track seed lot, soak time, and sprout date in StrainSpotter to build cultivar-specific averages."
        ] })
      },
      {
        title: "Environmental Targets",
        body: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          "• Temperature 75-80°F, RH 70-80%, gentle airflow directed above seedlings.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• Lighting 18-24 hours per day, ~200 PPFD at canopy, LED 24-30 inches away.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• Media moisture: evenly moist but never waterlogged. Mist surface daily; allow top layer to dry between waterings to prevent damping-off.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• Avoid fertiliser until first true leaves emerge; use pH 6.0-6.2 water (or 5.8 in coco)."
        ] })
      },
      {
        title: "Troubleshooting Germination",
        body: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          "• Seed fails to crack after 48 hours: gently scarify with fine sandpaper, re-soak 12 hours, retry.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• Taproot stalls: temperature likely low—move incubator to 78°F zone.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• Helmet head: mist husk, wait 30 minutes, use sterile tweezers to ease shell off.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• Stretching seedling: increase light intensity or lower fixture; support stem with a small stake.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• Leaf spotting: photograph and run through StrainSpotter AI to confirm whether it is splash, deficiency, or pathogen."
        ] })
      },
      {
        title: "AI & Data Touchpoints",
        body: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          "• Log emergence date and cultivar inside Grow Log to populate later-stage timelines automatically.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• Upload day 3 and day 7 photos—AI flags stretch, colour deviations, or early deficiency signals.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• Record irrigation volume and intervals; AI will calculate dryback rate to inform veg watering schedule."
        ] })
      }
    ],
    []
  );
  const vegetativeSections = reactExports.useMemo(
    () => [
      {
        title: "Environmental & Nutrient Targets",
        body: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          "• Lighting: 18/6 or 20/4. Provide 350-550 PPFD. Maintain LED 18-24 inches above canopy.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• Temperature: 76-82°F day / 70-72°F night. RH 55-65% (VPD 1.0-1.2 kPa).",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• Feeding: EC 1.0-1.4 depending on medium. Maintain N:K ratio around 3:2. Always include calcium/magnesium under LED lighting.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• Watering: allow 10-20% runoff in coco; in soil water when top inch dry. Alternate feed/water as required by runoff data."
        ] })
      },
      {
        title: "Training Protocol",
        body: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          "• Week 3: Top above node 4 or 5. Begin low-stress training (LST) to spread canopy.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• Week 4: Install SCROG net 8-10 inches above pots. Tuck branches daily to maintain level canopy.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• Week 5: Remove interior growth/shaded shoots receiving <200 PPFD. Maintain airflow through centre.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• Week 6: Final canopy leveling. Ensure even height before transition to 12/12. Document training actions with photos."
        ] })
      },
      {
        title: "Weekly Checklist",
        body: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          "• Inspect foliage (top/bottom) for pests, deficiencies, mechanical damage.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• Clean and sterilise scissors, ties, and support stakes.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• Recalibrate sensors and meters once per week.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• Photograph canopy top-down for AI analysis of light distribution.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• Record plant height, node count, training adjustments, and irrigation data inside StrainSpotter."
        ] })
      },
      {
        title: "AI Utilisation",
        body: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          "• Weekly StrainSpotter Scan of canopy to detect colour shift, tip burn, or early nutrient issues.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• Prompt example: “Predict final harvest height with veg height 18 inches and cultivar stretch factor 2×.”",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• Upload canopy map; AI suggests additional tie-down points or defoliation targets."
        ] })
      }
    ],
    []
  );
  const floweringSections = reactExports.useMemo(
    () => [
      {
        title: "Transition (Weeks 1-3 of Flower)",
        body: /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: "• Switch to 12/12 photoperiod; optionally add 15-minute far-red flash at lights-off to reduce stretch. • Increase PPFD to 650-750; adjust fixture height daily during stretch. • Maintain temperature 76-80°F day / 68-70°F night; RH 45-55% (VPD 1.1-1.3 kPa). • Transition feed over 7-10 days: reduce nitrogen, increase phosphorus/potassium gradually. • Install second trellis or plant yoyos once stretch exceeds 6 inches. • Scout daily for powdery mildew and pest pressure; document observations in Grow Log." })
      },
      {
        title: "Mid Flower (Weeks 4-7)",
        body: /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: "• Hold PPFD 750-850; CO₂ (if supplementing) 900-1000 ppm during lights-on. • Maintain RH 40-50% to prevent botrytis; increase airflow beneath canopy. • Feed EC 1.4-1.8 depending on cultivar response; monitor runoff to keep input-output EC differential ≤0.3. • Perform single targeted defoliation at start of week 4 to open airflow; avoid repeated heavy stripping. • Record bud development photos weekly; AI compares to cultivar norms and flags lagging cola growth." })
      },
      {
        title: "Late Flower & Ripening (Weeks 8+)",
        body: /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: "• Begin ripening flush 10-14 days before planned harvest (RO or finishing solution). Aim for runoff EC <0.6 mS/cm by final days. • Lower night temperature to 65-68°F to preserve volatile terpenes and tighten buds. • Reduce RH to 38-45%; ensure dehumidifier sized to handle transpiration load. • Inspect trichomes with 60× loupe: clear → cloudy indicates peak potency; aim for 5-10% amber for balanced effect unless cultivar-specific. • Secure heavy branches with yoyos. Eliminate light leaks to avoid foxtailing or re-veg." })
      },
      {
        title: "AI & Data Touchpoints",
        body: /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: "• Upload weekly macro photos—AI detects early botrytis, nutrient tip burn, or foxtail formation. • Prompt example: “Provide harvest readiness checklist for cultivar X at week 8 with 20% amber trichomes.” • Record aroma notes and environmental deltas; AI correlates data with final terpene profile." })
      }
    ],
    []
  );
  const harvestSections = reactExports.useMemo(
    () => [
      {
        title: "Harvest Preparation",
        body: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          "• Stop foliar sprays minimum 14 days pre-harvest.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• Clean trimming tools with isopropyl alcohol; prepare gloves, trays, drying lines.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• Plan dark period: 24-36 hours darkness optional for terpene preservation (ensure environment stable).",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• Verify drying space conditions: 60°F ±2°, 55-60% RH, gentle air exchange, total darkness."
        ] })
      },
      {
        title: "Cutting & Initial Processing",
        body: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          "• Harvest just before lights-on to maximise terpene retention.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• Remove large fan leaves immediately; optional wet trim to reduce drying RH load.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• Hang branches evenly spaced with good airflow; avoid bud-to-bud contact.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• Label each cultivar batch with harvest date, cultivar, phenotypic notes.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• Log wet weight per plant for yield tracking (wet weight ×0.20 ≈ expected dry weight)."
        ] })
      },
      {
        title: "AI Support",
        body: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          "• Upload harvest photos for AI to verify bud density, potential mould, or trim quality.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• Prompt example: “Confirm if these trichomes show optimal maturity for sedative effect.”"
        ] })
      }
    ],
    []
  );
  const dryCureSections = reactExports.useMemo(
    () => [
      {
        title: "Drying (Days 1-10)",
        body: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          "• Maintain 60°F / 55-60% RH with slow air exchange; no direct fans on buds.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• Inspect daily for mould, adjust RH ±2% as needed to keep 7-10 day dry time.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• Check small branches: when they snap (not bend), move to trimming.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• Log dry-room temp/RH daily; AI monitors for deviations that risk terpene loss."
        ] })
      },
      {
        title: "Curing (Day 10+)",
        body: /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: "• Trim buds cleanly; store in airtight glass jars filled 65-70% (allow headspace). • Initial cure: burp jars 10 minutes twice daily for first 3 days, then once daily for days 4-7, every other day thereafter. • Use humidity packs (58-62%) once jar RH stable at 58-60%. • Cure for minimum 21 days before full evaluation; premium cure 6-8 weeks. • Record jar RH with digital mini-hygrometer; log terpene/aroma notes in StrainSpotter." })
      },
      {
        title: "Quality Assurance",
        body: /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: "• Test small sample for moisture using hygrometer or moisture meter (target 11-13%). • Upload cured bud photos—AI evaluates trim quality, mould risk, and bag appeal. • Prompt example: “Suggest corrective steps: jar RH 66% with grassy aroma at day 5 of cure.”" })
      }
    ],
    []
  );
  const wateringSections = reactExports.useMemo(
    () => [
      {
        title: "Water Source & Conditioning",
        body: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          "• Use reverse osmosis or filtered tap (ensure chlorine/chloramine removal).",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• Ideal input temperature 65-70°F to maintain dissolved oxygen.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• For living soil, dechlorinate by aerating water 24 hours or using Campden tablet.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• Record water source, EC, and pH before mixing nutrients."
        ] })
      },
      {
        title: "Watering Techniques by Medium",
        body: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Soil:" }),
          " Water when top inch dry; saturate until 10-20% runoff. Allow full dryback (pot light) before next irrigation.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Coco:" }),
          " Feed every watering, every 1-2 days early veg then daily in late veg/flower. Always achieve 10-15% runoff to prevent salt buildup.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Hydro:" }),
          " Maintain reservoir temps 66-68°F, dissolved oxygen >6 ppm, refresh nutrient solution weekly."
        ] })
      },
      {
        title: "Soil Moisture Monitoring",
        body: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          "• Use pot weight method (lift pots) or soil moisture probes for consistency.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• Record irrigation volume, EC, pH, and runoff data in StrainSpotter; AI spots overwatering trends.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• Integrate volumetric water sensors (optional) to stream data into mobile dashboard."
        ] })
      }
    ],
    []
  );
  const nutrientSections = reactExports.useMemo(
    () => [
      {
        title: "Feeding Strategy",
        body: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          "• Base nutrients: follow manufacturer schedule at 30-50% strength initially; adjust using runoff EC and plant response.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• Maintain veg pH 5.8-6.2 (coco/hydro) or 6.2-6.8 (soil). Flower pH 5.8-6.3 / 6.2-6.7 respectively.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• Alternate feed/water or feed/feed/water depending on runoff EC trends.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• Add silica in veg/early flower, Cal-Mag as needed, beneficial bacteria weekly."
        ] })
      },
      {
        title: "Deficiency & Toxicity Quick Reference",
        body: /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { container: true, spacing: 2, children: [
          { name: "Nitrogen", deficiency: "Uniform yellowing of lower leaves, slow growth.", toxicity: "Very dark leaves, clawing, fragile stems." },
          { name: "Phosphorus", deficiency: "Dark, dull leaves with purple stems, slow budding.", toxicity: "Nutrient lockout causing micronutrient deficiencies." },
          { name: "Potassium", deficiency: "Leaf edge burn, weak stems, poor bud set.", toxicity: "Lockout of calcium and magnesium, crispy leaves." },
          { name: "Calcium", deficiency: "Rust spots on new growth, twisted leaves.", toxicity: "Rare, usually manifests as high EC runoff." },
          { name: "Magnesium", deficiency: "Interveinal yellowing on older leaves.", toxicity: "Can antagonise calcium uptake." }
        ].map((row) => /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { item: true, xs: 12, sm: 6, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Paper, { elevation: 0, sx: { p: 2, borderRadius: 3, background: "rgba(124, 179, 66, 0.1)", border: "1px solid rgba(124, 179, 66, 0.3)" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "subtitle2", fontWeight: 700, sx: { color: "#E8F5E9" }, children: row.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", sx: { color: "#E8F5E9" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Deficiency:" }),
            " ",
            row.deficiency
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", sx: { color: "#E8F5E9" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Toxicity:" }),
            " ",
            row.toxicity
          ] })
        ] }) }, row.name)) }) })
      },
      {
        title: "AI Troubleshooting Workflow",
        body: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          "• Capture close-up and whole-plant photos; upload to StrainSpotter AI to classify issue (deficiency vs toxicity vs pest).",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• Log corrective action (feed adjustment, flush, foliar) and follow up with photo 48 hours later to confirm improvement.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• Prompt example: “Run diagnostic: week 5 flower, EC 1.6 input/2.0 runoff, leaf edges burnt.”"
        ] })
      }
    ],
    []
  );
  const pestSections = reactExports.useMemo(
    () => [
      {
        title: "Integrated Pest Management (IPM) Baseline",
        body: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          "• Keep room clean; remove plant waste immediately, sterilise tools regularly.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• Quarantine new clones for 10-14 days; treat preventatively before entering main space.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• Apply biologicals (Bacillus subtilis, beneficial mites) on schedule—alternate modes of action."
        ] })
      },
      {
        title: "Common Pests & Responses",
        body: /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { container: true, spacing: 2, children: [
          { pest: "Spider Mites", sign: "Speckled leaves, webbing under leaves.", action: "Increase humidity temporarily, spray with horticultural oil or release predatory mites (Phytoseiulus persimilis)." },
          { pest: "Fungus Gnats", sign: "Tiny flies, larvae in topsoil.", action: "Allow top layer to dry, top-dress with GnatNix, apply Bacillus thuringiensis israelensis (BTi)." },
          { pest: "Powdery Mildew", sign: "White powder on leaves.", action: "Lower humidity, increase airflow, apply potassium bicarbonate or biological fungicide. Remove infected leaves." },
          { pest: "Bud Rot (Botrytis)", sign: "Gray mould inside buds.", action: "Remove infected material immediately, lower RH to &lt;45%, increase airflow, consider hydrogen peroxide spray on surrounding area." }
        ].map((row) => /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { item: true, xs: 12, sm: 6, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Paper, { elevation: 0, sx: { p: 2, borderRadius: 3, background: "rgba(124, 179, 66, 0.1)", border: "1px solid rgba(124, 179, 66, 0.3)" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "subtitle2", fontWeight: 700, sx: { color: "#E8F5E9" }, children: row.pest }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", sx: { color: "#E8F5E9" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Signs:" }),
            " ",
            row.sign
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", sx: { color: "#E8F5E9" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Response:" }),
            " ",
            row.action
          ] })
        ] }) }, row.pest)) }) })
      },
      {
        title: "AI-Assisted Monitoring",
        body: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          "• Use macro lens attachments on mobile to capture pest images; upload to StrainSpotter for classification and treatment recommendations.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• Log every spray/application with date, product, rate, and coverage; AI ensures rotation of active ingredients.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• Prompt example: “Identify cause: Week 6 flower, RH 48%, white spots underside leaves.”"
        ] })
      }
    ],
    []
  );
  const timeline = reactExports.useMemo(
    () => [
      {
        label: "Week 0",
        stage: "Pre-Plant Planning",
        focus: "Select genetics, prep environment, sterilise tools.",
        tasks: [
          "Review grow goals: yield target (g/watt), cannabinoid profile, flowering length.",
          "Select genetics suited to space height and flowering duration; order seeds/clones from vetted suppliers.",
          "Sanitise grow space with 3% hydrogen peroxide or 1:10 bleach solution; dry thoroughly.",
          "Verify electrical load capacity and timer accuracy; install surge protection.",
          "Calibrate pH and EC meters; record calibration date in log."
        ],
        aiPrompts: [
          "“Recommend three cultivars for 8 ft ceiling, 9-week flower, balanced THC:CBD.”",
          "Upload previous harvest images for AI review; note phenotype traits to replicate or avoid."
        ],
        metrics: ["Room temp 68-72°F empty", "RH 45-55%", "Baseline VPD 1.0-1.2 kPa"]
      },
      {
        label: "Week 1",
        stage: "Germination & Emergence",
        focus: "Even germination, gentle environment.",
        tasks: [
          "Hydrate seeds 12-18 hours, incubate in moist paper towel at 78°F.",
          "Transfer to medium once taproot 0.25-0.5 inches; label cultivar and date.",
          "Maintain humidity dome 70-80% until cotyledons fully open.",
          "Provide 18-24 hour light at ~200 PPFD; ensure gentle airflow above seedlings.",
          "Log emergence dates in StrainSpotter to start growth timeline."
        ],
        aiPrompts: [
          "“Is this seedling stretching? Suggest light distance adjustment.”",
          "Upload seedling photo to confirm healthy colour and cotyledon shape."
        ],
        metrics: ["Temp 75-80°F", "RH 70-80%", "pH 5.8-6.2", "EC ≤0.4"]
      },
      {
        label: "Week 2",
        stage: "Seedling Establishment",
        focus: "Root expansion, prepare for transplant.",
        tasks: [
          "Remove humidity dome; increase gentle airflow to prevent damping-off.",
          "Water 5-10% pot volume with pH 6.0, 150-200 ppm solution (or dechlorinated water for amended soil).",
          "Transplant into solo cups or 1-gal pots once roots circle starter cube.",
          "Introduce low-stress training anchors (soft wire) to prepare for future training.",
          "Record first true leaf size and colour in log."
        ],
        aiPrompts: [
          "“Calculate dryback time for 1-gal coco at 78°F with 55% RH.”",
          "Upload leaf photo to distinguish splash marks vs deficiency."
        ],
        metrics: ["Temp 75-80°F", "RH 60-70%", "VPD 0.8-1.0 kPa"]
      },
      {
        label: "Weeks 3-4",
        stage: "Vegetative Ramp",
        focus: "Build structure, accelerate root mass.",
        tasks: [
          "Transplant into final containers with microbial inoculant.",
          "Top above node 4 or 5, begin low-stress training to even canopy.",
          "Feed 0.8-1.2 EC solution; monitor runoff to prevent salt build-up.",
          "Defoliate damaged or shading leaves to improve airflow.",
          "Document plant height, node count, training actions."
        ],
        aiPrompts: [
          "“Estimate final height with current veg height 18 inches and stretch factor 2×.”",
          "Upload canopy photo for AI tie-down recommendations."
        ],
        metrics: ["PPFD 350-450", "RH 55-65%", "VPD 1.0-1.2 kPa"]
      },
      {
        label: "Weeks 5-6",
        stage: "Late Vegetative / Flip Prep",
        focus: "Even canopy, pathogen prevention.",
        tasks: [
          "Install trellis net, finalise canopy height.",
          "Perform lollipop pruning on lower growth receiving &lt;200 PPFD.",
          "Conduct final preventative IPM spray (biologicals).",
          "Verify timer accuracy and dark-period integrity.",
          "Plan nutrient transition schedule for flower."
        ],
        aiPrompts: [
          "“List defoliation order for SCROG canopy one week before flip.”",
          "Upload canopy map to check PPFD uniformity."
        ],
        metrics: ["RH 50-60%", "Runoff pH 5.8-6.3", "Leaf surface vs ambient delta &lt;2°F"]
      },
      {
        label: "Weeks 7-10",
        stage: "Early Flower (Stretch)",
        focus: "Manage stretch, initiate buds.",
        tasks: [
          "Switch to 12/12, ramp PPFD to 650-750.",
          "Support branches with ties/yoyos as stretch progresses.",
          "Increase bloom nutrients gradually, maintain nitrogen moderate.",
          "Inspect daily for powdery mildew and pests.",
          "Log bud site count weekly via photos."
        ],
        aiPrompts: [
          "Upload bud site photos to track stretch uniformity.",
          "“Predict harvest date given pre-flower date and cultivar flowering length.”"
        ],
        metrics: ["Temp 76-80°F / 68-70°F night", "RH 45-55%", "VPD 1.1-1.3 kPa"]
      },
      {
        label: "Weeks 11-14",
        stage: "Mid Flower",
        focus: "Bulk buds, preserve terpenes.",
        tasks: [
          "Hold PPFD 750-850; keep RH 40-50%.",
          "Feed EC 1.4-1.8, adjust based on runoff trend.",
          "Inspect for botrytis; remove susceptible leaves near buds.",
          "Optional CO₂ supplementation to 900-1000 ppm.",
          "Document aroma changes and frost development."
        ],
        aiPrompts: [
          "Upload macro shots; AI detects early bud rot or nutrient stress.",
          "“Is leaf fade normal at week 6 flower given current feed data?”"
        ],
        metrics: ["VPD 1.2-1.4 kPa", "Runoff EC within ±0.3 of input"]
      },
      {
        label: "Weeks 15-16",
        stage: "Ripening",
        focus: "Flush, monitor maturity.",
        tasks: [
          "Begin flush 10-14 days before harvest; aim for runoff EC &lt;0.6.",
          "Lower RH to 38-45%; run dehumidifier overnight.",
          "Secure heavy branches; eliminate light leaks.",
          "Inspect trichomes every 2-3 days.",
          "Plan harvest schedule and post-harvest workflow."
        ],
        aiPrompts: [
          "Upload trichome images for AI amber/cloudy ratio.",
          "“Provide final week ripening checklist for cultivar X.”"
        ],
        metrics: ["Night temp 65-68°F", "Dark period fully sealed"]
      },
      {
        label: "Week 17",
        stage: "Harvest",
        focus: "Cut, trim, hang.",
        tasks: [
          "Harvest before lights-on; remove large fan leaves immediately.",
          "Hang branches evenly spaced with gentle airflow.",
          "Label batches with cultivar, harvest date, wet weight.",
          "Sanitise trimming tools between plants.",
          "Document wet weight and notes in Grow Log."
        ],
        aiPrompts: [
          "“Calculate ideal dry-room settings for 6 lb wet weight in 4×8 space.”",
          "Upload harvest room photo for AI layout check."
        ],
        metrics: ["Dry room 60°F", "RH 55-60%", "Airflow indirect"]
      },
      {
        label: "Week 18+",
        stage: "Dry & Cure",
        focus: "Equalise moisture, preserve terpenes.",
        tasks: [
          "Dry 7-10 days until small stems snap; trim buds and jar.",
          "Burp jars daily first week, every other day second week.",
          "Stabilise jar RH at 58-62% with humidity packs.",
          "Log final dry weight, potency tests, and sensory notes.",
          "Store long-term in cool, dark location (55°F, 55% RH)."
        ],
        aiPrompts: [
          "“Troubleshoot hay aroma in jar at 64% RH day 5 of cure.”",
          "Upload cured bud photo for AI review of trim quality and mould risk."
        ],
        metrics: ["Jar RH 58-62%", "Cure duration minimum 21 days"]
      }
    ],
    []
  );
  const safeTimelineIndex = timeline.length > 0 ? Math.min(Math.max(timelineIndex, 0), timeline.length - 1) : 0;
  const currentTimeline = timeline.length > 0 ? timeline[safeTimelineIndex] : null;
  const dailyPlaybook = reactExports.useMemo(
    () => [
      {
        stage: "Vegetative",
        tasks: {
          Morning: ["Record ambient temp/RH and CO₂", "Inspect leaves (top/bottom) for pests or deficiencies", "Water/feed if pots are light (target 10-15% runoff)"],
          Midday: ["Adjust LST ties or SCROG tucks", "Check light height and PPFD map", "Update StrainSpotter log with observations"],
          Evening: ["Final canopy inspection, remove debris", "Confirm timers and environmental controls", "Capture photo set for AI comparison"]
        }
      },
      {
        stage: "Flower – Weeks 1-5",
        tasks: {
          Morning: ["Measure temp/RH and VPD at canopy", "Check for powdery mildew or pest pressure", "Irrigate based on dryback schedule"],
          Midday: ["Review trichomes with loupe on sample buds", "Log runoff EC/pH values", "Upload bud photo for AI stretch monitoring"],
          Evening: ["Verify dark period light-proofing", "Adjust dehumidifier settings for night", "Note aroma or colour changes in log"]
        }
      },
      {
        stage: "Flower – Weeks 6+",
        tasks: {
          Morning: ["Measure jar/drying room conditions (if applicable)", "Inspect for botrytis, remove compromised buds immediately", "Irrigate with flush solution as scheduled"],
          Midday: ["Check support ties/yoyos, redistribute weight", "Record trichome maturity (clear/cloudy/amber %)", "Upload macro photo for AI ripeness assessment"],
          Evening: ["Lower night humidity, ensure airflow is unobstructed", "Plan next-day harvest or flush tasks", "Document any fade/purple expression"]
        }
      },
      {
        stage: "Dry & Cure",
        tasks: {
          Morning: ["Check drying room temp/RH, adjust humidifier/dehumidifier", "Inspect hanging buds for mould or overdry tips"],
          Midday: ["Burp jars (5-10 minutes) if curing", "Log jar RH and aroma impressions", "Upload cured bud photo for AI storage guidance"],
          Evening: ["Re-seal jars, rotate positions, ensure storage in dark cool location", "Plan next day QA (moisture %, jar RH)"]
        }
      }
    ],
    []
  );
  const sensorSections = reactExports.useMemo(
    () => [
      {
        title: "Essential Sensors & Placement",
        body: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          "• Canopy-level temp/RH sensor (digital with logging capability).",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• Root-zone probe for media temperature and moisture (optional but valuable for disease prevention).",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• CO₂ monitor (NDIR) if supplementing; place at canopy height away from CO₂ source.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• PAR meter or calibrated lux meter for light intensity profiling.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• Optional leaf temperature IR gun to calculate actual VPD accurately."
        ] })
      },
      {
        title: "Data Logging Workflow",
        body: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          "• Log data twice daily (lights-on and lights-off) in StrainSpotter or linked spreadsheet: temp, RH, VPD, CO₂, EC, pH, water volume.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• Sync Bluetooth/Wi-Fi sensors to mobile dashboard for alerts if thresholds breached.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• Use AI to analyse trends: “Highlight any VPD deviations >0.2 kPa over last 7 days.”",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• Export data at harvest for post-mortem review; adjust environment targets next cycle."
        ] })
      },
      {
        title: "Automation Opportunities",
        body: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          "• Integrate smart plugs with irrigation pumps or humidifiers; automate via StrainSpotter webhook and set guardrails to avoid overwatering.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• Use controllers (Inkbird, TrolMaster) for closed-loop temp/RH management; log set-points and adjustments.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "• Capture camera time-lapse to correlate growth spurts with environmental changes."
        ] })
      }
    ],
    []
  );
  const renderSections = /* @__PURE__ */ __name((sections) => /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { children: sections.map(({ title, body }) => /* @__PURE__ */ jsxRuntimeExports.jsx(Section, { title, children: body }, title)) }), "renderSections");
  const renderDailyPlaybook = /* @__PURE__ */ __name(() => /* @__PURE__ */ jsxRuntimeExports.jsx(Stack, { spacing: 3, children: dailyPlaybook.map(({ stage, tasks }) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Paper, { elevation: 0, sx: { p: 3, borderRadius: 3, background: "rgba(124, 179, 66, 0.1)", border: "1px solid rgba(124, 179, 66, 0.3)" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", fontWeight: 800, gutterBottom: true, sx: { color: "#E8F5E9" }, children: stage }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { container: true, spacing: 2, children: Object.entries(tasks).map(([time, list]) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Grid, { item: true, xs: 12, sm: 4, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "subtitle2", fontWeight: 700, sx: { color: "#E8F5E9" }, children: time }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Stack, { spacing: 0.5, sx: { mt: 1 }, children: list.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", sx: { color: "#E8F5E9" }, children: [
        "• ",
        item
      ] }, item)) })
    ] }, time)) })
  ] }, stage)) }), "renderDailyPlaybook");
  const renderTimeline = /* @__PURE__ */ __name(() => /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 2, sx: { mb: 3 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "subtitle1", fontWeight: 800, sx: { color: "#E8F5E9" }, children: "Weekly Timeline" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Slider,
        {
          value: safeTimelineIndex,
          min: 0,
          max: Math.max(timeline.length - 1, 0),
          step: 1,
          marks: timeline.map((entry, idx) => ({ value: idx, label: entry.label })),
          onChange: /* @__PURE__ */ __name((_e, value) => {
            const nextValue = Array.isArray(value) ? value[0] : value;
            setTimelineIndex(typeof nextValue === "number" ? nextValue : 0);
          }, "onChange")
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Paper, { elevation: 0, sx: { p: 3, borderRadius: 3, background: "rgba(124, 179, 66, 0.1)", border: "1px solid rgba(124, 179, 66, 0.3)" }, children: currentTimeline ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", fontWeight: 800, gutterBottom: true, sx: { color: "#E8F5E9" }, children: currentTimeline.stage }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Chip, { label: `Focus: ${currentTimeline.focus}`, color: "success", size: "small", sx: { mb: 2 } }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Divider, { sx: { mb: 2, borderColor: "rgba(124, 179, 66, 0.3)" } }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "subtitle2", fontWeight: 700, sx: { color: "#E8F5E9" }, children: "Core Tasks" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Stack, { spacing: 0.5, sx: { mt: 1, mb: 2 }, children: currentTimeline.tasks.map((task) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", sx: { color: "#E8F5E9" }, children: [
        "• ",
        task
      ] }, task)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "subtitle2", fontWeight: 700, sx: { color: "#E8F5E9" }, children: "AI Prompts" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Stack, { spacing: 0.5, sx: { mt: 1, mb: 2 }, children: currentTimeline.aiPrompts.map((prompt) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", sx: { color: "#E8F5E9" }, children: [
        "• ",
        prompt
      ] }, prompt)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "subtitle2", fontWeight: 700, sx: { color: "#E8F5E9" }, children: "Target Metrics" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Stack, { spacing: 0.5, sx: { mt: 1 }, children: currentTimeline.metrics.map((metric) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", sx: { color: "#E8F5E9" }, children: [
        "• ",
        metric
      ] }, metric)) })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "#E8F5E9" }, children: "Timeline data unavailable." }) })
  ] }), "renderTimeline");
  const renderContent = /* @__PURE__ */ __name(() => {
    switch (tab) {
      case 0:
        return renderSections(overviewSections);
      case 1:
        return renderSections(setupSections);
      case 2:
        return renderSections(germinationSections);
      case 3:
        return renderSections(vegetativeSections);
      case 4:
        return renderSections(floweringSections);
      case 5:
        return renderSections(harvestSections);
      case 6:
        return renderSections(dryCureSections);
      case 7:
        return renderSections(wateringSections);
      case 8:
        return renderSections(nutrientSections);
      case 9:
        return renderSections(pestSections);
      case 10:
        return renderTimeline();
      case 11:
        return renderDailyPlaybook();
      case 12:
        return renderSections(sensorSections);
      case LOGBOOK_TAB_INDEX:
        return /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { width: "100%", maxWidth: "100%", mx: 0, px: 0 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(GrowLogBook, {}) });
      default:
        return null;
    }
  }, "renderContent");
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
              zIndex: 2
            },
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(BackHeader, { title: tab === LOGBOOK_TAB_INDEX ? "AI Grow Logbook" : "Grow Coach", onBack: handleBack })
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
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Box,
              {
                sx: {
                  py: 1.5,
                  px: { xs: 0.75, sm: 1 },
                  background: "transparent",
                  width: "100%",
                  maxWidth: "100%",
                  overflow: "hidden",
                  wordWrap: "break-word",
                  overflowWrap: "break-word",
                  boxSizing: "border-box",
                  mx: 0
                },
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Paper,
                    {
                      elevation: 0,
                      sx: {
                        mb: 1.5,
                        p: 2,
                        bgcolor: "rgba(124, 179, 66, 0.2)",
                        border: "2px solid rgba(124, 179, 66, 0.6)",
                        borderRadius: 3,
                        boxShadow: "0 0 20px rgba(124, 179, 66, 0.3)"
                      },
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", spacing: 1.5, alignItems: "center", sx: { mb: 2 }, children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: {
                            width: 48,
                            height: 48,
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, #7CB342, #9CCC65)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 0 20px rgba(124, 179, 66, 0.5)"
                          }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(AutoAwesome, { sx: { color: "#fff", fontSize: 28 } }) }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { flex: 1 }, children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", fontWeight: 800, sx: { fontSize: "1.1rem", color: "#E8F5E9", mb: 0.5 }, children: "🤖 AI Grow Coach" }),
                            /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", sx: { fontSize: "0.9rem", color: "#C5E1A5" }, children: [
                              "Ask questions, get instant recommendations",
                              questionsRemaining > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { marginLeft: 8, fontWeight: 600 }, children: [
                                "(",
                                questionsRemaining,
                                " questions left today)"
                              ] })
                            ] })
                          ] })
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Box,
                          {
                            sx: {
                              flex: 1,
                              overflowY: "auto",
                              mb: 1.5,
                              minHeight: "200px",
                              maxHeight: "300px",
                              p: 1.5,
                              bgcolor: "rgba(124, 179, 66, 0.05)",
                              borderRadius: 2
                            },
                            children: messages.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", sx: { color: "#C5E1A5", fontStyle: "italic" }, children: [
                              "Ask me anything about growing! Examples:",
                              /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
                              `• "What's the ideal VPD for week 3 of flower?"`,
                              /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
                              '• "How do I fix yellowing leaves?"',
                              /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
                              '• "When should I start flushing?"'
                            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 1.5, children: [
                              messages.map((msg, idx) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                                Box,
                                {
                                  sx: {
                                    p: 1.5,
                                    borderRadius: 2,
                                    bgcolor: msg.role === "user" ? "rgba(124, 179, 66, 0.2)" : "rgba(76, 175, 80, 0.15)",
                                    border: msg.role === "user" ? "1px solid rgba(124, 179, 66, 0.4)" : "1px solid rgba(124, 179, 66, 0.3)",
                                    alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                                    maxWidth: "85%"
                                  },
                                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "#E8F5E9", fontSize: "0.85rem" }, children: msg.content })
                                },
                                idx
                              )),
                              loading && /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { display: "flex", alignItems: "center", gap: 1, p: 1 }, children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx(CircularProgress, { size: 16, sx: { color: "#7CB342" } }),
                                /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "#C5E1A5", fontSize: "0.8rem" }, children: "Thinking..." })
                              ] }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: chatEndRef })
                            ] })
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", spacing: 1, children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            TextField,
                            {
                              fullWidth: true,
                              size: "small",
                              placeholder: questionsRemaining > 0 ? "Ask a question..." : "Daily limit reached. Try again tomorrow!",
                              value: question,
                              onChange: /* @__PURE__ */ __name((e) => setQuestion(e.target.value), "onChange"),
                              onKeyPress: /* @__PURE__ */ __name((e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  handleAskQuestion();
                                }
                              }, "onKeyPress"),
                              disabled: loading || questionsRemaining <= 0,
                              sx: {
                                "& .MuiOutlinedInput-root": {
                                  bgcolor: "rgba(124, 179, 66, 0.15)",
                                  fontSize: "0.85rem",
                                  color: "#E8F5E9",
                                  "& fieldset": {
                                    borderColor: "rgba(124, 179, 66, 0.3)"
                                  },
                                  "&:hover fieldset": {
                                    borderColor: "rgba(124, 179, 66, 0.5)"
                                  },
                                  "&.Mui-focused fieldset": {
                                    borderColor: "rgba(124, 179, 66, 0.6)"
                                  },
                                  "& input": {
                                    color: "#E8F5E9",
                                    "&::placeholder": {
                                      color: "#C5E1A5",
                                      opacity: 0.7
                                    }
                                  }
                                }
                              }
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            IconButton,
                            {
                              onClick: handleAskQuestion,
                              disabled: !question.trim() || loading || questionsRemaining <= 0,
                              sx: {
                                bgcolor: "rgba(124, 179, 66, 0.2)",
                                color: "#7CB342",
                                "&:hover": { bgcolor: "rgba(124, 179, 66, 0.3)" },
                                "&:disabled": { opacity: 0.5 }
                              },
                              children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircularProgress, { size: 20 }) : /* @__PURE__ */ jsxRuntimeExports.jsx(SendIcon, {})
                            }
                          )
                        ] }),
                        questionsRemaining <= 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "caption", sx: { mt: 1, color: "#C5E1A5", fontSize: "0.75rem" }, children: "You've used all 5 questions today. The limit resets tomorrow!" })
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1.5, sx: { mb: 1.5 }, children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Box,
                      {
                        sx: {
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: "linear-gradient(135deg, #7CB342, #9CCC65)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 0 12px rgba(124, 179, 66, 0.4)",
                          flexShrink: 0
                        },
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx(AutoAwesome, { sx: { color: "#fff", fontSize: 18 } })
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { flex: 1 }, children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Stack, { direction: "row", alignItems: "center", spacing: 1, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", fontWeight: 800, sx: { color: "#E8F5E9", fontSize: "1rem" }, children: tab === LOGBOOK_TAB_INDEX ? "AI Grow Logbook" : "Grow Coach" }) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "caption", sx: { color: "#C5E1A5", fontSize: "0.75rem" }, children: "Comprehensive guides for every stage" })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Tabs,
                    {
                      value: tab,
                      onChange: /* @__PURE__ */ __name((e, value) => setTab(value), "onChange"),
                      variant: "scrollable",
                      allowScrollButtonsMobile: true,
                      scrollButtons: "auto",
                      sx: {
                        mb: 1.5,
                        "& .MuiTab-root": {
                          minHeight: 44,
                          fontSize: "0.8rem",
                          px: 1,
                          textTransform: "none",
                          fontWeight: 600
                        },
                        "& .MuiTabs-scrollButtons": {
                          width: 32,
                          "&.Mui-disabled": { opacity: 0.3 }
                        }
                      },
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Tab, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(LocalFloristIcon, {}), iconPosition: "start", label: "Overview" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Tab, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Engineering, {}), iconPosition: "start", label: "Setup" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Tab, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Grain, {}), iconPosition: "start", label: "Germination" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Tab, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(WbSunny, {}), iconPosition: "start", label: "Vegetative" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Tab, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(SpaIcon, {}), iconPosition: "start", label: "Flowering" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Tab, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(MenuBookIcon, {}), iconPosition: "start", label: "Harvest" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Tab, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Opacity, {}), iconPosition: "start", label: "Dry & Cure" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Tab, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(WaterDrop, {}), iconPosition: "start", label: "Watering & Media" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Tab, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(ScienceIcon, {}), iconPosition: "start", label: "Nutrients" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Tab, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(BugReport, {}), iconPosition: "start", label: "Pests & IPM" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Tab, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Timeline, {}), iconPosition: "start", label: "Stage Timelines" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Tab, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Checklist, {}), iconPosition: "start", label: "Daily Tasks" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Tab, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(MonitorHeart, {}), iconPosition: "start", label: "Sensors & Data" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Tab, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(NoteAltIcon, {}), iconPosition: "start", label: "Logbook" })
                      ]
                    }
                  ),
                  renderContent()
                ]
              }
            )
          }
        )
      ]
    }
  );
}
__name(GrowCoach, "GrowCoach");
export {
  LOGBOOK_TAB_INDEX,
  GrowCoach as default
};
