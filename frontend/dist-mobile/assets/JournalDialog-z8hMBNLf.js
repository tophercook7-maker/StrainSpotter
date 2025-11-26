var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { r as reactExports, j as jsxRuntimeExports, D as Dialog, p as DialogTitle, q as DialogContent, S as Stack, m as TextField, B as Box, E as Rating, H as Chip, u as DialogActions, i as Button } from "./react-vendor-DaVUs1pH.js";
import { s as supabase, a as API_BASE } from "./App-BxlAc3TE.js";
const defaultForm = /* @__PURE__ */ __name((defaults) => {
  const safeDefaults = defaults && typeof defaults === "object" ? defaults : {};
  return {
    strain_name: safeDefaults.strain_name || "",
    strain_slug: safeDefaults.strain_slug || "",
    entry_date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
    rating: safeDefaults.rating || 0,
    notes: "",
    method: "",
    dosage: "",
    time_of_day: "",
    tags: ""
  };
}, "defaultForm");
function JournalDialog({ open, defaults, onClose, onSaved }) {
  const [form, setForm] = reactExports.useState(() => defaultForm(defaults));
  const [saving, setSaving] = reactExports.useState(false);
  const [error, setError] = reactExports.useState(null);
  reactExports.useEffect(() => {
    setForm(defaultForm(defaults));
  }, [defaults, open]);
  const handleChange = /* @__PURE__ */ __name((field) => (event, value) => {
    if (field === "rating") {
      setForm((prev) => ({ ...prev, rating: value || 0 }));
      return;
    }
    const val = event?.target?.value ?? "";
    setForm((prev) => ({ ...prev, [field]: val }));
  }, "handleChange");
  const handleSubmit = /* @__PURE__ */ __name(async () => {
    setSaving(true);
    setError(null);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      const resp = await fetch(`${API_BASE}/api/journals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...token ? { Authorization: `Bearer ${token}` } : {}
        },
        body: JSON.stringify({
          ...form,
          tags: form.tags ? form.tags.split(",").map((tag) => tag.trim()).filter(Boolean) : []
        })
      });
      const payload = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(payload.error || "Failed to save journal entry.");
      }
      onSaved?.(payload);
      onClose?.();
    } catch (err) {
      setError(err.message || "Unable to save entry.");
    } finally {
      setSaving(false);
    }
  }, "handleSubmit");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open, onClose, fullWidth: true, maxWidth: "sm", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Log your experience" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogContent, { dividers: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 2, sx: { mt: 1 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        TextField,
        {
          label: "Strain name",
          value: form.strain_name,
          onChange: handleChange("strain_name"),
          fullWidth: true
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        TextField,
        {
          label: "Strain slug / nickname",
          value: form.strain_slug,
          onChange: handleChange("strain_slug"),
          fullWidth: true
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        TextField,
        {
          label: "Date",
          type: "date",
          value: form.entry_date,
          onChange: handleChange("entry_date"),
          InputLabelProps: { shrink: true },
          fullWidth: true
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        Rating,
        {
          value: form.rating,
          onChange: handleChange("rating"),
          size: "large"
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        TextField,
        {
          label: "Consumption method",
          value: form.method,
          onChange: handleChange("method"),
          placeholder: "Joint, vape, edible...",
          fullWidth: true
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: { xs: "column", sm: "row" }, spacing: 2, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          TextField,
          {
            label: "Dosage",
            value: form.dosage,
            onChange: handleChange("dosage"),
            placeholder: "0.5g, 5mg edible...",
            fullWidth: true
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          TextField,
          {
            label: "Time of day",
            value: form.time_of_day,
            onChange: handleChange("time_of_day"),
            placeholder: "Morning, Night...",
            fullWidth: true
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        TextField,
        {
          label: "Tags",
          value: form.tags,
          onChange: handleChange("tags"),
          placeholder: "sleep, focus",
          helperText: "Comma-separated keywords",
          fullWidth: true
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        TextField,
        {
          label: "Notes",
          value: form.notes,
          onChange: handleChange("notes"),
          fullWidth: true,
          multiline: true,
          rows: 4
        }
      ),
      error && /* @__PURE__ */ jsxRuntimeExports.jsx(Chip, { color: "error", label: error })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogActions, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: onClose, disabled: saving, children: "Cancel" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "contained", onClick: handleSubmit, disabled: saving, children: "Save entry" })
    ] })
  ] });
}
__name(JournalDialog, "JournalDialog");
export {
  JournalDialog as J
};
