var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { r as reactExports, j as jsxRuntimeExports, C as Container, S as Stack, i as Button, B as Box, T as Typography, f as Card, h as CardContent, a0 as Grid, M as Avatar, H as Chip, aj as LocationOn, ax as EmojiEvents } from "./react-vendor-DaVUs1pH.js";
import { a as API_BASE } from "./App-BxlAc3TE.js";
import GrowerRegistration from "./GrowerRegistration-BBLqKBpW.js";
import "./vendor-qR99EfKL.js";
function GrowerDirectory({ onBack }) {
  const [growers, setGrowers] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [showRegistration, setShowRegistration] = reactExports.useState(false);
  reactExports.useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/growers`);
        if (res.ok) {
          const payload = await res.json();
          const list = Array.isArray(payload) ? payload : Array.isArray(payload.growers) ? payload.growers : [];
          setGrowers(list);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  const normalizeTags = reactExports.useMemo(
    () => (tags) => Array.isArray(tags) ? tags.filter(Boolean) : [],
    []
  );
  const renderGrowerCard = /* @__PURE__ */ __name((g) => {
    const primaryName = g.display_name || g.grower_farm_name || "Grower";
    const secondaryName = g.display_name && g.grower_farm_name && g.grower_farm_name !== g.display_name ? g.grower_farm_name : null;
    const tags = normalizeTags(g.profile_tags);
    const roleLabel = g.role === "admin" ? "Admin" : g.role === "moderator" ? "Moderator" : g.role === "grower" ? "Grower" : null;
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { item: true, xs: 12, sm: 6, md: 4, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { sx: { height: "100%", background: "rgba(255,255,255,0.10)", backdropFilter: "blur(12px)", border: "2px solid black", boxShadow: "none" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 2, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", spacing: 2, alignItems: "center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { sx: { bgcolor: "primary.main", width: 56, height: 56 }, children: primaryName.substring(0, 2).toUpperCase() }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { flex: 1 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", children: primaryName }),
          secondaryName && /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", color: "text.secondary", children: secondaryName }),
          g.grower_certified && /* @__PURE__ */ jsxRuntimeExports.jsx(
            Chip,
            {
              label: "Certified",
              color: "success",
              size: "small",
              sx: { mt: 0.5, alignSelf: "flex-start" }
            }
          ),
          g.grower_city && /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", spacing: 0.5, alignItems: "center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(LocationOn, { fontSize: "small", color: "action" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", color: "text.secondary", children: [
              g.grower_city,
              g.grower_state ? `, ${g.grower_state}` : ""
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", spacing: 1, sx: { mt: 1, flexWrap: "wrap" }, children: [
            roleLabel && /* @__PURE__ */ jsxRuntimeExports.jsx(Chip, { label: roleLabel, size: "small", color: "warning", variant: "outlined" }),
            tags.slice(0, 3).map((tag) => /* @__PURE__ */ jsxRuntimeExports.jsx(Chip, { label: tag.replace(/_/g, " "), size: "small", variant: "outlined" }, tag))
          ] })
        ] })
      ] }),
      Array.isArray(g.grower_specialties) && g.grower_specialties.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "caption", color: "text.secondary", children: "Specialties:" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Stack, { direction: "row", spacing: 0.5, flexWrap: "wrap", sx: { mt: 0.5 }, children: g.grower_specialties.map((s, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(Chip, { label: s, size: "small", color: "success", variant: "outlined" }, i)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", color: "text.secondary", children: [
        "Experience: ",
        g.grower_experience_years || 0,
        " years"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Chip,
        {
          icon: /* @__PURE__ */ jsxRuntimeExports.jsx(EmojiEvents, { fontSize: "small" }),
          label: g.grower_license_status === "licensed" ? "Licensed" : "Community",
          size: "small",
          sx: { alignSelf: "flex-start" }
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outlined", size: "small", onClick: /* @__PURE__ */ __name(() => setShowRegistration(true), "onClick"), children: "Edit / View Profile" })
    ] }) }) }) }, g.user_id || g.id);
  }, "renderGrowerCard");
  const renderSection = /* @__PURE__ */ __name((title, list) => {
    if (!list || list.length === 0) return null;
    const sorted = [...list].sort((a, b) => {
      const experienceA = Number(a.grower_experience_years) || 0;
      const experienceB = Number(b.grower_experience_years) || 0;
      return experienceB - experienceA;
    });
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h5", sx: { mb: 2, fontWeight: 700 }, children: title }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { container: true, spacing: 2, children: sorted.map(renderGrowerCard) })
    ] });
  }, "renderSection");
  if (showRegistration) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      GrowerRegistration,
      {
        onBack: /* @__PURE__ */ __name(() => {
          setShowRegistration(false);
          (async () => {
            try {
              const res = await fetch(`${API_BASE}/api/growers`);
              if (res.ok) {
                const payload = await res.json();
                const list = Array.isArray(payload) ? payload : Array.isArray(payload.growers) ? payload.growers : [];
                setGrowers(list);
              }
            } catch (err) {
              console.error("Error refreshing growers:", err);
            }
          })();
        }, "onBack")
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Container, { maxWidth: "lg", sx: {
    pt: "calc(env(safe-area-inset-top) + 48px)",
    pb: 4
  }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", justifyContent: "space-between", alignItems: "center", sx: { mb: 3 }, children: [
      onBack && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: onBack, size: "small", variant: "contained", sx: { bgcolor: "#7CB342", color: "white", textTransform: "none", fontWeight: 700, borderRadius: 999, "&:hover": { bgcolor: "#689f38" } }, children: "← Back to Garden" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          variant: "contained",
          color: "primary",
          onClick: /* @__PURE__ */ __name(() => setShowRegistration(true), "onClick"),
          sx: { textTransform: "none", fontWeight: 600 },
          children: "Register as Grower"
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { display: "flex", alignItems: "center", gap: 2, mb: 3 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Box,
        {
          sx: {
            width: 60,
            height: 60,
            borderRadius: "50%",
            background: "transparent",
            border: "2px solid rgba(124, 179, 66, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 20px rgba(124, 179, 66, 0.4)",
            overflow: "hidden",
            flexShrink: 0
          },
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "img",
            {
              src: "/hero.png?v=13",
              alt: "StrainSpotter",
              style: { width: "100%", height: "100%", objectFit: "cover" }
            }
          )
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h4", sx: { fontWeight: 700 }, children: "Grower Directory" })
    ] }),
    loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { children: "Loading..." }) : growers.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { sx: { textAlign: "center", py: 5 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body1", color: "text.secondary", children: "No growers yet. Be the first to register!" }) }) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 4, children: [
      renderSection("Certified Growers", growers.filter((g) => g.grower_certified)),
      renderSection("Community Growers", growers.filter((g) => !g.grower_certified))
    ] })
  ] });
}
__name(GrowerDirectory, "GrowerDirectory");
export {
  GrowerDirectory as default
};
