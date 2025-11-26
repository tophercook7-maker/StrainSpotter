var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { r as reactExports, j as jsxRuntimeExports, D as Dialog, p as DialogTitle, q as DialogContent, B as Box, A as Alert, bl as Stepper, bm as Step, bn as StepLabel, T as Typography, m as TextField, aF as ToggleButtonGroup, aG as ToggleButton, s as FormControlLabel, t as Checkbox, S as Stack, i as Button } from "./react-vendor-DaVUs1pH.js";
import { u as useAuth, a as API_BASE, s as supabase } from "./App-BxlAc3TE.js";
import "./vendor-qR99EfKL.js";
function useOnboardingStatus() {
  const { session, user } = useAuth();
  const [status, setStatus] = reactExports.useState({
    loading: true,
    error: null,
    onboardingRequired: false,
    needsDisplayName: false,
    needsRole: false,
    needsPersona: false,
    profile: null
  });
  const fetchStatus = reactExports.useCallback(async () => {
    if (!user || !session?.access_token) {
      setStatus((prev) => ({
        ...prev,
        loading: false,
        onboardingRequired: false,
        profile: null,
        error: null
      }));
      return;
    }
    setStatus((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await fetch(`${API_BASE}/api/users/onboarding-status`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Failed to load onboarding status");
      }
      const payload = await response.json();
      setStatus({
        loading: false,
        error: null,
        onboardingRequired: Boolean(payload.onboardingRequired),
        needsDisplayName: Boolean(payload.needsDisplayName),
        needsRole: Boolean(payload.needsRole),
        needsPersona: Boolean(payload.needsPersona),
        profile: payload.profile
      });
    } catch (err) {
      console.error("[useOnboardingStatus] Failed to load status:", err);
      setStatus((prev) => ({
        ...prev,
        loading: false,
        error: err.message || "Failed to load onboarding status"
      }));
    }
  }, [user, session?.access_token]);
  reactExports.useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);
  return {
    ...status,
    refresh: fetchStatus
  };
}
__name(useOnboardingStatus, "useOnboardingStatus");
const personas = [
  { value: "enthusiast", label: "Enthusiast", description: "I explore strains, dispensaries, and community content." },
  { value: "grower", label: "Grower", description: "I cultivate, test, and share knowledge with others." },
  { value: "operator", label: "Business", description: "I run a dispensary, delivery service, or cannabis brand." }
];
function OnboardingFlow() {
  const { user } = useAuth();
  const { onboardingRequired, loading, profile, refresh, needsDisplayName, needsPersona, needsRole, error } = useOnboardingStatus();
  const [step, setStep] = reactExports.useState(0);
  const [displayName, setDisplayName] = reactExports.useState("");
  const [persona, setPersona] = reactExports.useState("");
  const [notifications, setNotifications] = reactExports.useState(false);
  const [saving, setSaving] = reactExports.useState(false);
  const [submitError, setSubmitError] = reactExports.useState(null);
  const [submitSuccess, setSubmitSuccess] = reactExports.useState(false);
  reactExports.useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      const personaTag = profile.profile_tags?.find((tag) => tag.startsWith("persona:"));
      setPersona(personaTag ? personaTag.replace("persona:", "") : "");
      setNotifications(profile.profile_tags?.some((tag) => tag.startsWith("notify:")) || false);
    }
  }, [profile]);
  const steps = reactExports.useMemo(() => [
    { label: "Profile", description: "Set your public name so others recognize you." },
    { label: "Role", description: "Tell us how you use StrainSpotter." },
    { label: "Preferences", description: "Stay in the loop with community updates." }
  ], []);
  const open = Boolean(user && onboardingRequired);
  const canContinueProfile = displayName.trim().length >= 2;
  const canContinuePersona = Boolean(persona);
  const handleSubmit = /* @__PURE__ */ __name(async () => {
    if (!supabase || !user) return;
    setSaving(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Session expired. Please sign in again.");
      }
      const response = await fetch(`${API_BASE}/api/users/onboarding`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          display_name: displayName.trim(),
          role: persona === "grower" ? "grower" : persona === "operator" ? "operator" : "member",
          persona,
          notifications
        })
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Failed to save onboarding data");
      }
      setSubmitSuccess(true);
      await refresh();
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 3e3);
    } catch (err) {
      console.error("[OnboardingFlow] Submit failed:", err);
      setSubmitError(err.message || "Failed to complete onboarding");
    } finally {
      setSaving(false);
    }
  }, "handleSubmit");
  const showStepper = needsDisplayName || needsPersona || needsRole;
  if (!open) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open: true, fullScreen: true, PaperProps: { sx: { background: "#041204", color: "#fff" } }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { sx: { textAlign: "center", fontWeight: 700, color: "#CDDC39", pt: 4 }, children: "Welcome to StrainSpotter" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      DialogContent,
      {
        sx: {
          maxWidth: 520,
          mx: "auto",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          pt: 1,
          pb: 6
        },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Box,
            {
              sx: {
                overflowY: "auto",
                pr: 1,
                flex: 1,
                "&::-webkit-scrollbar": { width: 6 },
                "&::-webkit-scrollbar-thumb": { background: "rgba(255,255,255,0.2)", borderRadius: 999 }
              },
              children: [
                error && /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { severity: "error", sx: { mb: 2 }, children: error }),
                showStepper && /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { mb: 3 }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Stepper, { activeStep: step, alternativeLabel: true, children: steps.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsx(Step, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(StepLabel, { children: item.label }) }, item.label)) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { mt: 1, textAlign: "center", color: "#ccc" }, children: steps[step]?.description })
                ] }),
                step === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { mt: 3 }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", sx: { mb: 1, fontWeight: 700 }, children: "How should the community address you?" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    TextField,
                    {
                      value: displayName,
                      onChange: /* @__PURE__ */ __name((e) => setDisplayName(e.target.value), "onChange"),
                      label: "Display Name",
                      fullWidth: true,
                      autoFocus: true,
                      inputProps: { maxLength: 60 },
                      helperText: "Shown in chats, groups, and grower directory.",
                      sx: {
                        "& .MuiOutlinedInput-root": { color: "#fff" },
                        "& .MuiInputLabel-root": { color: "#bbb" },
                        "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.3)" }
                      }
                    }
                  )
                ] }),
                step === 1 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { mt: 2 }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", sx: { mb: 1, fontWeight: 700 }, children: "Choose your primary role" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    ToggleButtonGroup,
                    {
                      exclusive: true,
                      fullWidth: true,
                      color: "success",
                      value: persona,
                      onChange: /* @__PURE__ */ __name((_e, next) => next && setPersona(next), "onChange"),
                      orientation: "vertical",
                      children: personas.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                        ToggleButton,
                        {
                          value: p.value,
                          sx: {
                            mb: 1,
                            textTransform: "none",
                            justifyContent: "flex-start",
                            borderRadius: 2,
                            bgcolor: persona === p.value ? "rgba(124,179,66,0.25)" : "rgba(255,255,255,0.05)"
                          },
                          children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { textAlign: "left" }, children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "subtitle1", sx: { fontWeight: 700 }, children: p.label }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "caption", sx: { color: "#ccc" }, children: p.description })
                          ] })
                        },
                        p.value
                      ))
                    }
                  )
                ] }),
                step === 2 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { mt: 3 }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", sx: { mb: 1, fontWeight: 700 }, children: "Stay in the loop?" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { mb: 2, color: "#ccc" }, children: "Receive occasional emails about new groups, grower spotlights, and product updates. You can change this anytime in settings." }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    FormControlLabel,
                    {
                      control: /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Checkbox,
                        {
                          checked: notifications,
                          onChange: /* @__PURE__ */ __name((e) => setNotifications(e.target.checked), "onChange"),
                          sx: { color: "#CDDC39" }
                        }
                      ),
                      label: "Yes, send me StrainSpotter updates"
                    }
                  )
                ] }),
                submitError && /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { severity: "error", sx: { mt: 3 }, children: submitError }),
                submitSuccess && /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { severity: "success", sx: { mt: 3 }, children: "Profile updated! You’re all set." })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", spacing: 2, sx: { mt: 4 }, children: [
            step > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "outlined",
                onClick: /* @__PURE__ */ __name(() => setStep((prev) => Math.max(prev - 1, 0)), "onClick"),
                sx: { flex: 1 },
                children: "Back"
              }
            ),
            step < steps.length - 1 && /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "contained",
                disabled: saving || step === 0 && !canContinueProfile || step === 1 && !canContinuePersona,
                onClick: /* @__PURE__ */ __name(() => setStep((prev) => Math.min(prev + 1, steps.length - 1)), "onClick"),
                sx: { flex: 1, bgcolor: "#7CB342", color: "#fff", "&:hover": { bgcolor: "#8bc34a" } },
                children: "Continue"
              }
            ),
            step === steps.length - 1 && /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "contained",
                disabled: saving || !canContinueProfile || !canContinuePersona,
                onClick: handleSubmit,
                sx: { flex: 1, bgcolor: "#7CB342", color: "#fff", "&:hover": { bgcolor: "#8bc34a" } },
                children: saving ? "Saving…" : "Finish"
              }
            )
          ] }),
          !loading && !onboardingRequired && /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { mt: 3, textAlign: "center" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: /* @__PURE__ */ __name(() => setStep(0), "onClick"), size: "small", sx: { color: "#ccc" }, children: "Revisit onboarding" }) })
        ]
      }
    )
  ] });
}
__name(OnboardingFlow, "OnboardingFlow");
export {
  OnboardingFlow as default
};
