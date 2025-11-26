var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { r as reactExports, j as jsxRuntimeExports, B as Box, T as Typography, H as Chip, m as TextField, i as Button, A as Alert, C as Container, S as Stack, f as Card, h as CardContent, aQ as ButtonBase } from "./react-vendor-DaVUs1pH.js";
import { c as useProMode, C as CannabisLeafIcon } from "./App-BxlAc3TE.js";
import "./vendor-qR99EfKL.js";
function ProModeGate() {
  const { proRole, proEnabled, proLoading, activateProWithCode, clearProMode } = useProMode();
  const [code, setCode] = reactExports.useState("");
  const [error, setError] = reactExports.useState("");
  const [success, setSuccess] = reactExports.useState("");
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!code.trim()) {
      setError("Please enter your access code.");
      return;
    }
    try {
      const result = await activateProWithCode(code.trim());
      setSuccess(`Pro mode activated for ${result.role === "dispensary" ? "Dispensary" : "Grower"}.`);
      setCode("");
    } catch (err) {
      setError(err?.message || "Invalid access code.");
    }
  }
  __name(handleSubmit, "handleSubmit");
  function handleClear() {
    clearProMode();
    setSuccess("");
    setError("");
  }
  __name(handleClear, "handleClear");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Box,
    {
      sx: {
        p: 3,
        borderRadius: 2,
        border: "1px solid rgba(124, 179, 66, 0.3)",
        background: "rgba(0, 0, 0, 0.2)",
        mb: 2
      },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", sx: { mb: 1, color: "#E8F5E9" }, children: "Dispensary & Grower Mode" }),
        proEnabled && proRole ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { mb: 2 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Chip,
            {
              label: `Active: ${proRole === "dispensary" ? "Dispensary mode" : "Grower mode"}`,
              color: "success",
              sx: { mb: 1 }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "rgba(200, 230, 201, 0.8)" }, children: "Pro-level AI details are now enabled for your scans." })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { mb: 2, color: "rgba(200, 230, 201, 0.8)" }, children: "Enter your access code to unlock pro-level AI details tailored for dispensaries and growers." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, style: { display: "flex", flexDirection: "column", gap: "12px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            TextField,
            {
              type: "text",
              value: code,
              onChange: /* @__PURE__ */ __name((e) => setCode(e.target.value), "onChange"),
              placeholder: "Enter access code",
              disabled: proLoading || proEnabled,
              fullWidth: true,
              sx: {
                "& .MuiOutlinedInput-root": {
                  borderRadius: "999px",
                  backgroundColor: "rgba(0, 0, 0, 0.3)",
                  color: "#fff",
                  "& fieldset": {
                    borderColor: "rgba(255, 255, 255, 0.2)"
                  },
                  "&:hover fieldset": {
                    borderColor: "rgba(255, 255, 255, 0.3)"
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#7CB342"
                  }
                },
                "& .MuiInputBase-input": {
                  color: "#fff"
                }
              }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              type: "submit",
              disabled: proLoading || proEnabled,
              variant: "contained",
              sx: {
                borderRadius: "999px",
                backgroundColor: "#7CB342",
                color: "#000",
                fontWeight: 600,
                "&:hover": {
                  backgroundColor: "#9AE66E"
                },
                "&:disabled": {
                  backgroundColor: "rgba(124, 179, 66, 0.3)",
                  color: "rgba(255, 255, 255, 0.5)"
                }
              },
              children: proLoading ? "Checking code…" : proEnabled ? "Already Active" : "Activate Pro Mode"
            }
          ),
          proEnabled && /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              type: "button",
              onClick: handleClear,
              variant: "outlined",
              sx: {
                borderRadius: "999px",
                borderColor: "rgba(255, 255, 255, 0.2)",
                color: "#fff",
                fontSize: "12px",
                mt: 1,
                "&:hover": {
                  borderColor: "rgba(255, 255, 255, 0.4)",
                  backgroundColor: "rgba(255, 255, 255, 0.05)"
                }
              },
              children: "Disable Pro Mode"
            }
          )
        ] }),
        error && /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { severity: "error", sx: { mt: 2 }, children: error }),
        success && /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { severity: "success", sx: { mt: 2 }, children: success })
      ]
    }
  );
}
__name(ProModeGate, "ProModeGate");
function Help({ onNavigate, onBack }) {
  const tiles = [
    { key: "scanner", title: "Scanner", emoji: "📷", blurb: "Snap bud or label for AI match" },
    { key: "history", title: "Scan History", emoji: "🕘", blurb: "Revisit past scans & results" },
    { key: "strains", title: "Strain Browser", emoji: "hero", blurb: "Explore 35k+ strains" },
    { key: "dispensaries", title: "Dispensaries", emoji: "🛍️", blurb: "Find nearby shops" },
    { key: "seeds", title: "Seeds", emoji: "🌱", blurb: "Where to buy seed packs" },
    { key: "grow-coach", title: "Grow Coach", emoji: "📘", blurb: "Step‑by‑step grow guide" },
    { key: "groups", title: "Groups & Chat", emoji: "💬", blurb: "Talk with the community" },
    { key: "friends", title: "Friends", emoji: "👥", blurb: "Add friends and connect" },
    { key: "growers", title: "Grower Directory", emoji: "🧑‍🌾", blurb: "Discover local growers" },
    { key: "membership", nav: "membership-join", title: "Membership", emoji: "💎", blurb: "Unlimited scans & more" },
    { key: "feedback", title: "Feedback", emoji: "✉️", blurb: "Send us ideas & issues" }
  ];
  const GlassTile = /* @__PURE__ */ __name(({ title, emoji, onClick }) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
    ButtonBase,
    {
      disableRipple: true,
      onClick,
      sx: {
        position: "relative",
        borderRadius: 3,
        p: 0.5,
        // Little buttons
        minHeight: { xs: 72, sm: 84 },
        aspectRatio: "1 / 1",
        width: "100%",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1,
        // Single-layer, highly see-through glass
        background: "rgba(20, 40, 30, 0.10)",
        border: "1px solid rgba(124,179,66,0.14)",
        backdropFilter: "blur(3px)",
        boxShadow: "0 1px 8px rgba(0,0,0,0.10)",
        color: "white",
        transition: "all 200ms cubic-bezier(0.4, 0, 0.2, 1)",
        outline: "none",
        "&:focus-visible": { outline: "none", boxShadow: "none" },
        "&:hover": {
          transform: "none",
          background: "rgba(24, 52, 38, 0.12)",
          borderColor: "rgba(124,179,66,0.18)",
          boxShadow: "0 2px 10px rgba(0,0,0,0.12)"
        }
      },
      children: [
        emoji === "hero" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { component: "img", src: "/hero.png?v=13", alt: "", sx: {
          width: { xs: 20, sm: 22 },
          height: { xs: 20, sm: 22 },
          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2)) drop-shadow(0 0 4px rgba(124, 179, 66, 0.6))"
        } }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: {
          fontSize: { xs: 20, sm: 22 },
          lineHeight: 1,
          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))"
        }, "aria-hidden": true, children: emoji }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Typography,
          {
            variant: "subtitle2",
            sx: {
              fontWeight: 700,
              lineHeight: 1.3,
              fontSize: { xs: "0.70rem", sm: "0.80rem" },
              textShadow: "0 1px 2px rgba(0,0,0,0.25), 0 0 12px rgba(124,179,66,0.15)",
              maxWidth: "90%"
            },
            children: title
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { position: "absolute", bottom: 8, left: 8, opacity: 0.08 }, "aria-hidden": true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(CannabisLeafIcon, {}) })
      ]
    }
  ), "GlassTile");
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { minHeight: "100vh" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Container, { maxWidth: "lg", sx: { py: 4 }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 3, children: [
    onBack && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: onBack, size: "small", variant: "contained", sx: { bgcolor: "white", color: "black", textTransform: "none", fontWeight: 700, alignSelf: "flex-start", borderRadius: 999, "&:hover": { bgcolor: "grey.100" } }, children: "Home" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", spacing: 1, alignItems: "center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CannabisLeafIcon, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h4", fontWeight: "bold", color: "primary.light", children: "Help & How-To" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Box,
      {
        sx: {
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "repeat(2, minmax(0, 1fr))",
            sm: "repeat(3, minmax(0, 1fr))",
            md: "repeat(4, minmax(0, 1fr))"
          }
        },
        children: tiles.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          GlassTile,
          {
            title: t.title,
            emoji: t.emoji,
            onClick: /* @__PURE__ */ __name(() => onNavigate?.(t.nav || t.key), "onClick")
          },
          t.key
        ))
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { sx: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", backdropFilter: "blur(6px)" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", gutterBottom: true, children: "Getting Started" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 1, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "1. Create an Account:" }),
          " Tap the Account tile to sign up with email and password."
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "2. Enable Location:" }),
          " Allow location access for nearby dispensaries and grower directory."
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "3. Start Scanning:" }),
          " Tap the Scanner tile and take a photo of your cannabis to identify the strain."
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "4. Join the Community:" }),
          " Use Groups & Chat to connect with other cannabis enthusiasts."
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "5. Unlock + Membership:" }),
          " One-time app unlock (20 scans) plus $4.99/mo for 200 scans and community perks. Add 50/200/500 top-ups whenever you need more."
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { sx: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", backdropFilter: "blur(6px)" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", gutterBottom: true, children: "Scanning tips" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 1, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", children: "• Frame the whole bud inside the guide. Avoid extreme macro." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", children: "• Even lighting. Avoid glare and deep shadows." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", children: "• Include the label or strain name when possible." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", children: "• Try 2–3 angles of the same bud for richer features." })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { sx: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", backdropFilter: "blur(6px)" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", gutterBottom: true, children: "Common issues" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 1, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "subtitle2", children: "No match or low confidence" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", children: "Retake with better lighting and framing; include text if available." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "subtitle2", sx: { mt: 1 }, children: "Upload error" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", children: "Check connectivity and retry. Service may be briefly busy." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "subtitle2", sx: { mt: 1 }, children: "Stuck on processing" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", children: "Close and retry the scan. If repeated, wait a minute and try again." })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { severity: "info", children: "Questions or suggestions? Use the Feedback tile to send us a message." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ProModeGate, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "caption", color: "text.secondary", children: "For privacy, login isn't required. Select scans may be used to improve the service." })
  ] }) }) });
}
__name(Help, "Help");
export {
  Help as default
};
