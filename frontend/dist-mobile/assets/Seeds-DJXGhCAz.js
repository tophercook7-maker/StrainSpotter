var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { r as reactExports, j as jsxRuntimeExports, B as Box, I as IconButton, y as ArrowBackIcon, T as Typography, C as Container, n as CircularProgress, i as Button, a0 as Grid, f as Card, h as CardContent } from "./react-vendor-DaVUs1pH.js";
import { a as API_BASE } from "./App-BxlAc3TE.js";
import { b as useNavigate } from "./router-vendor-CizxVMW3.js";
import "./vendor-qR99EfKL.js";
function Seeds({ onBack }) {
  const navigate = useNavigate();
  const [seeds, setSeeds] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [error, setError] = reactExports.useState(null);
  reactExports.useEffect(() => {
    let cancelled = false;
    const fallbackSeeds = [
      { id: "ilgm", name: "I Love Growing Marijuana (ILGM)", breeder: "ILGM", type: "seed bank", description: "Premium cannabis seeds with germination guarantee. Feminized, autoflower, and regular seeds available.", url: "https://ilgm.com" },
      { id: "seedsman", name: "Seedsman", breeder: "Seedsman", type: "seed bank", description: "One of the oldest and most trusted online seed banks. Huge selection from top breeders worldwide.", url: "https://www.seedsman.com" },
      { id: "crop-king", name: "Crop King Seeds", breeder: "Crop King", type: "seed bank", description: "Canadian seed bank with fast shipping to US. Great selection of feminized and autoflower strains.", url: "https://www.cropkingseeds.com" },
      { id: "msnl", name: "Marijuana Seeds NL", breeder: "MSNL", type: "seed bank", description: "Established seed bank with stealth shipping worldwide. Competitive prices and frequent sales.", url: "https://www.msnl.com" },
      { id: "growers-choice", name: "Growers Choice Seeds", breeder: "Growers Choice", type: "seed bank", description: "US-based seed company with 90% germination guarantee. Fast domestic shipping.", url: "https://growerschoiceseeds.com" },
      { id: "homegrown", name: "Homegrown Cannabis Co.", breeder: "Homegrown", type: "seed bank", description: "Premium genetics with expert growing advice. Free seeds with every order.", url: "https://homegrowncannabisco.com" }
    ];
    async function fetchVendors() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/api/seeds`);
        if (!res.ok) {
          throw new Error(`Failed to load seeds: ${res.status}`);
        }
        const data = await res.json();
        if (cancelled) return;
        const allSeeds = [...Array.isArray(data) ? data : [], ...fallbackSeeds].filter(
          (seed, idx, arr) => arr.findIndex((s) => s.id === seed.id) === idx
        );
        setSeeds(allSeeds);
      } catch (e) {
        console.error("[Seeds] Error loading vendors:", e);
        if (!cancelled) {
          setError("Unable to load seed vendors right now.");
          setSeeds(fallbackSeeds);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    __name(fetchVendors, "fetchVendors");
    fetchVendors();
    return () => {
      cancelled = true;
    };
  }, []);
  const handleBack = /* @__PURE__ */ __name(() => {
    if (onBack) {
      onBack();
    } else {
      navigate("/");
    }
  }, "handleBack");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Box,
    {
      sx: {
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden"
      },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Box,
          {
            sx: {
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              p: 2,
              gap: 1.5,
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              bgcolor: "transparent",
              backdropFilter: "blur(10px)",
              zIndex: 1
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                IconButton,
                {
                  edge: "start",
                  onClick: handleBack,
                  sx: { color: "#fff" },
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowBackIcon, {})
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", sx: { fontWeight: 600, color: "#fff", flex: 1 }, children: "Seed Vendors" })
            ]
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
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Container, { maxWidth: "lg", sx: { py: 3 }, children: [
              loading && /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(CircularProgress, { size: 28 }) }),
              !loading && error && /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { p: 2, textAlign: "center" }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body1", sx: { color: "#fff", mb: 1 }, children: "Seed vendor search is warming up. Live data isn't available yet, but we'll add it soon." }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    variant: "outlined",
                    size: "small",
                    onClick: /* @__PURE__ */ __name(() => window.location.reload(), "onClick"),
                    sx: { mt: 1, color: "#fff", borderColor: "rgba(255,255,255,0.3)" },
                    children: "Retry"
                  }
                )
              ] }),
              !loading && !error && (!seeds || seeds.length === 0) && /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { padding: "16px", textAlign: "center", opacity: 0.7, mt: 4 }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", sx: { color: "#fff", mb: 1 }, children: "No vendors available" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "#fff" }, children: "Seed vendors will appear here once configured." })
              ] }),
              !loading && !error && seeds && seeds.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { container: true, spacing: 2, children: seeds.map((seed) => /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { item: true, xs: 12, sm: 6, md: 4, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { sx: { height: "100%" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", sx: { fontWeight: 600, mb: 1 }, children: seed.name || "Unknown Vendor" }),
                seed.breeder && /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { opacity: 0.8, mb: 0.5 }, children: seed.breeder }),
                seed.type && /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", sx: { opacity: 0.7, mb: 0.5 }, children: [
                  "Type: ",
                  seed.type
                ] }),
                seed.description && /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { mt: 1, opacity: 0.9 }, children: seed.description }),
                seed.url && /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    size: "small",
                    variant: "contained",
                    color: "primary",
                    href: seed.url,
                    target: "_blank",
                    rel: "noopener noreferrer",
                    sx: { mt: 2 },
                    children: "Visit Website"
                  }
                )
              ] }) }) }, seed.id || seed.name)) })
            ] })
          }
        )
      ]
    }
  );
}
__name(Seeds, "Seeds");
export {
  Seeds as default
};
