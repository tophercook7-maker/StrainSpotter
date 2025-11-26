var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { r as reactExports, j as jsxRuntimeExports, B as Box, i as Button, f as Card, h as CardContent, S as Stack, T as Typography, m as TextField, ah as MenuItem, a0 as Grid, s as FormControlLabel, aP as Switch, Z as Divider, t as Checkbox, A as Alert, as as Snackbar } from "./react-vendor-DaVUs1pH.js";
import { s as supabase, a as API_BASE } from "./App-BxlAc3TE.js";
import "./vendor-qR99EfKL.js";
function GrowerRegistration({ onBack }) {
  const [mode, setMode] = reactExports.useState("non-certified");
  const [form, setForm] = reactExports.useState({
    growerId: "",
    farmName: "",
    city: "",
    state: "",
    specialties: "",
    bio: "",
    experienceYears: 3,
    licenseStatus: "not_applicable",
    acceptsMessages: true,
    optInDirectory: true,
    phone: "",
    address: "",
    contactRiskAcknowledged: false,
    moderatorOptIn: false,
    moderatorMotivation: "",
    moderatorAvailability: "",
    moderatorExperience: "",
    moderatorNotes: ""
  });
  const [loading, setLoading] = reactExports.useState(false);
  const [error, setError] = reactExports.useState(null);
  const [snack, setSnack] = reactExports.useState("");
  const handleChange = /* @__PURE__ */ __name((key) => (e) => setForm({ ...form, [key]: e.target.value }), "handleChange");
  const handleBoolean = /* @__PURE__ */ __name((key) => (e) => setForm({ ...form, [key]: e.target.checked }), "handleBoolean");
  const licenseOptions = reactExports.useMemo(() => [
    { value: "licensed", label: "Licensed" },
    { value: "unlicensed", label: "Unlicensed" },
    { value: "not_applicable", label: "Not Applicable" }
  ], []);
  const resetForm = /* @__PURE__ */ __name(() => setForm({
    growerId: "",
    farmName: "",
    city: "",
    state: "",
    specialties: "",
    bio: "",
    experienceYears: 3,
    licenseStatus: mode === "certified" ? "licensed" : "not_applicable",
    acceptsMessages: true,
    optInDirectory: true,
    phone: "",
    address: "",
    contactRiskAcknowledged: false,
    moderatorOptIn: false,
    moderatorMotivation: "",
    moderatorAvailability: "",
    moderatorExperience: "",
    moderatorNotes: ""
  }), "resetForm");
  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr) throw sessionErr;
      const userId = sessionData?.session?.user?.id;
      if (!userId) {
        throw new Error("Please sign in before registering as a grower.");
      }
      const certified = mode === "certified";
      const basePayload = {
        userId,
        isGrower: true,
        licenseStatus: certified ? "licensed" : form.licenseStatus,
        experienceYears: Number(form.experienceYears) || 0,
        bio: form.bio,
        specialties: form.specialties,
        city: form.city,
        state: form.state,
        country: "USA",
        farmName: form.farmName,
        acceptsMessages: form.acceptsMessages,
        optInDirectory: form.optInDirectory,
        phone: form.phone || null,
        address: form.address || null,
        contactRiskAcknowledged: form.contactRiskAcknowledged,
        certified,
        moderatorOptIn: certified && form.moderatorOptIn
      };
      if ((basePayload.phone || basePayload.address) && !basePayload.contactRiskAcknowledged) {
        throw new Error("Please acknowledge the risks of sharing contact information.");
      }
      if (certified && !form.growerId) {
        throw new Error("Certified growers must provide their certification or license ID.");
      }
      let moderatorApplication = null;
      if (certified && form.moderatorOptIn) {
        const motivation = form.moderatorMotivation.trim();
        const availability = form.moderatorAvailability.trim();
        const experience = form.moderatorExperience.trim();
        const notes = form.moderatorNotes.trim();
        if (!motivation || !availability) {
          throw new Error("Please tell us why you would be a great moderator and when you are available.");
        }
        moderatorApplication = {
          motivation,
          availability,
          ...experience ? { experience } : {},
          ...notes ? { notes } : {}
        };
      }
      const payload = {
        ...basePayload,
        growerId: certified ? form.growerId : null,
        moderatorApplication
      };
      const res = await fetch(`${API_BASE}/api/growers/profile/setup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const message = await res.json().catch(() => ({}));
        throw new Error(message.error || "Failed to register grower profile.");
      }
      setSnack("Registration submitted!");
      resetForm();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  __name(submit, "submit");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { maxWidth: 720, mx: "auto", py: 4 }, children: [
    onBack && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: onBack, size: "small", variant: "contained", sx: { bgcolor: "white", color: "black", textTransform: "none", fontWeight: 700, borderRadius: 999, mb: 1, "&:hover": { bgcolor: "grey.100" } }, children: "Home" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 2, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h5", children: "Grower Registration" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        TextField,
        {
          select: true,
          label: "Registration Type",
          value: mode,
          onChange: /* @__PURE__ */ __name((e) => {
            const value = e.target.value;
            setMode(value);
            setForm((prev) => ({
              ...prev,
              licenseStatus: value === "certified" ? "licensed" : prev.licenseStatus === "licensed" ? "licensed" : "not_applicable",
              moderatorOptIn: value === "certified" ? prev.moderatorOptIn : false,
              moderatorMotivation: value === "certified" ? prev.moderatorMotivation : "",
              moderatorAvailability: value === "certified" ? prev.moderatorAvailability : "",
              moderatorExperience: value === "certified" ? prev.moderatorExperience : "",
              moderatorNotes: value === "certified" ? prev.moderatorNotes : ""
            }));
          }, "onChange"),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(MenuItem, { value: "certified", children: "Certified Grower" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(MenuItem, { value: "non-certified", children: "Non-Certified Grower" })
          ]
        }
      ),
      mode === "certified" && /* @__PURE__ */ jsxRuntimeExports.jsx(TextField, { label: "Grower ID", value: form.growerId, onChange: handleChange("growerId"), required: true }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Grid, { container: true, spacing: 2, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { item: true, xs: 12, sm: 6, children: /* @__PURE__ */ jsxRuntimeExports.jsx(TextField, { label: "Farm / Brand Name", value: form.farmName, onChange: handleChange("farmName"), fullWidth: true }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { item: true, xs: 12, sm: 6, children: /* @__PURE__ */ jsxRuntimeExports.jsx(TextField, { label: "City", value: form.city, onChange: handleChange("city"), fullWidth: true }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { item: true, xs: 12, sm: 6, children: /* @__PURE__ */ jsxRuntimeExports.jsx(TextField, { label: "State", value: form.state, onChange: handleChange("state"), fullWidth: true }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { item: true, xs: 12, sm: 6, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          TextField,
          {
            label: "Years of Experience",
            type: "number",
            inputProps: { min: 0 },
            value: form.experienceYears,
            onChange: handleChange("experienceYears"),
            fullWidth: true
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { item: true, xs: 12, children: /* @__PURE__ */ jsxRuntimeExports.jsx(TextField, { label: "Specialties (comma-separated)", value: form.specialties, onChange: handleChange("specialties"), fullWidth: true }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { item: true, xs: 12, children: /* @__PURE__ */ jsxRuntimeExports.jsx(TextField, { label: "Bio", value: form.bio, onChange: handleChange("bio"), fullWidth: true, multiline: true, minRows: 3 }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { item: true, xs: 12, sm: 6, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          TextField,
          {
            select: true,
            label: "License Status",
            value: form.licenseStatus,
            onChange: handleChange("licenseStatus"),
            fullWidth: true,
            disabled: mode === "certified",
            children: licenseOptions.map((opt) => /* @__PURE__ */ jsxRuntimeExports.jsx(MenuItem, { value: opt.value, children: opt.label }, opt.value))
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { item: true, xs: 12, sm: 6, sx: { display: "flex", alignItems: "center" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          FormControlLabel,
          {
            control: /* @__PURE__ */ jsxRuntimeExports.jsx(
              Switch,
              {
                checked: form.acceptsMessages,
                onChange: handleBoolean("acceptsMessages")
              }
            ),
            label: "Accept direct messages from members"
          }
        ) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Divider, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        FormControlLabel,
        {
          control: /* @__PURE__ */ jsxRuntimeExports.jsx(
            Switch,
            {
              checked: form.optInDirectory,
              onChange: handleBoolean("optInDirectory")
            }
          ),
          label: "List me in the public grower directory"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "caption", color: "text.secondary", children: "New growers are welcome — we highlight certified growers separately and sort the list by experience so members can find the right fit." }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Grid, { container: true, spacing: 2, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { item: true, xs: 12, sm: 6, children: /* @__PURE__ */ jsxRuntimeExports.jsx(TextField, { label: "Public Phone (optional)", value: form.phone, onChange: handleChange("phone"), fullWidth: true }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { item: true, xs: 12, sm: 6, children: /* @__PURE__ */ jsxRuntimeExports.jsx(TextField, { label: "Public Address (optional)", value: form.address, onChange: handleChange("address"), fullWidth: true }) })
      ] }),
      (form.phone || form.address) && /* @__PURE__ */ jsxRuntimeExports.jsx(
        FormControlLabel,
        {
          control: /* @__PURE__ */ jsxRuntimeExports.jsx(
            Checkbox,
            {
              checked: form.contactRiskAcknowledged,
              onChange: handleBoolean("contactRiskAcknowledged")
            }
          ),
          label: "I understand the risks of sharing my contact information publicly."
        }
      ),
      mode === "certified" && /* @__PURE__ */ jsxRuntimeExports.jsx(
        FormControlLabel,
        {
          control: /* @__PURE__ */ jsxRuntimeExports.jsx(
            Switch,
            {
              checked: form.moderatorOptIn,
              onChange: /* @__PURE__ */ __name((e) => {
                const checked = e.target.checked;
                setForm((prev) => ({
                  ...prev,
                  moderatorOptIn: checked,
                  moderatorMotivation: checked ? prev.moderatorMotivation : "",
                  moderatorAvailability: checked ? prev.moderatorAvailability : "",
                  moderatorExperience: checked ? prev.moderatorExperience : "",
                  moderatorNotes: checked ? prev.moderatorNotes : ""
                }));
              }, "onChange")
            }
          ),
          label: "I'll earn that free membership by helping moderate the community (you gotta earn it!)"
        }
      ),
      mode === "certified" && form.moderatorOptIn && /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 2, sx: { p: 2, bgcolor: "rgba(124,179,66,0.08)", borderRadius: 2, border: "1px solid rgba(124,179,66,0.3)" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { severity: "info", sx: { bgcolor: "rgba(255,255,255,0.7)" }, children: "Certified moderators help keep conversations safe and on-topic. Share a quick note about how you can contribute so we can activate your complimentary membership." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          TextField,
          {
            label: "Why you'd be a great moderator",
            value: form.moderatorMotivation,
            onChange: handleChange("moderatorMotivation"),
            fullWidth: true,
            multiline: true,
            minRows: 2,
            required: true
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          TextField,
          {
            label: "Weekly availability (hours / time windows)",
            value: form.moderatorAvailability,
            onChange: handleChange("moderatorAvailability"),
            fullWidth: true,
            multiline: true,
            minRows: 2,
            required: true
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          TextField,
          {
            label: "Experience moderating or supporting communities",
            value: form.moderatorExperience,
            onChange: handleChange("moderatorExperience"),
            fullWidth: true,
            multiline: true,
            minRows: 2
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          TextField,
          {
            label: "Anything else we should know?",
            value: form.moderatorNotes,
            onChange: handleChange("moderatorNotes"),
            fullWidth: true,
            multiline: true,
            minRows: 2
          }
        )
      ] }),
      error && /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { severity: "error", children: error }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Stack, { direction: "row", spacing: 2, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "contained", onClick: submit, disabled: loading, children: loading ? "Submitting…" : "Submit" }) })
    ] }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Snackbar, { open: !!snack, autoHideDuration: 2500, onClose: /* @__PURE__ */ __name(() => setSnack(""), "onClose"), message: snack })
  ] });
}
__name(GrowerRegistration, "GrowerRegistration");
export {
  GrowerRegistration as default
};
