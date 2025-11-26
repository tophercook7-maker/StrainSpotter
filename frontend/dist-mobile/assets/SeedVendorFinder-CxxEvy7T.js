var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { r as reactExports, j as jsxRuntimeExports, B as Box, P as Paper, a0 as Grid, m as TextField, ae as FormControl, af as InputLabel, ag as Select, ah as MenuItem, i as Button, A as Alert, n as CircularProgress, T as Typography, f as Card, h as CardContent, S as Stack, V as VerifiedIcon, H as Chip, I as IconButton, ap as LanguageIcon, am as StarIcon, ac as LocalShippingIcon, aZ as PaymentIcon } from "./react-vendor-DaVUs1pH.js";
import { a as API_BASE } from "./App-BxlAc3TE.js";
import { B as BackHeader } from "./BackHeader-jwQJOBEe.js";
const STATIC_SEED_VENDORS = [
  {
    id: "ilgm",
    name: "ILGM - I Love Growing Marijuana",
    url: "https://ilgm.com",
    tagline: "Beginner-friendly, classic strains, strong grow guides.",
    verified: true,
    country: "USA"
  },
  {
    id: "seedsman",
    name: "Seedsman",
    url: "https://www.seedsman.com/",
    tagline: "Huge catalog of breeders and genetics.",
    verified: true,
    country: "UK"
  },
  {
    id: "attitude",
    name: "Attitude Seed Bank",
    url: "https://www.cannabis-seeds-bank.co.uk/",
    tagline: "Global shipping, many European breeders.",
    verified: true,
    country: "UK"
  },
  {
    id: "north-atlantic",
    name: "North Atlantic Seed Company",
    url: "https://northatlanticseed.com/",
    tagline: "US-based, fast shipping, trusted breeders.",
    verified: true,
    country: "USA"
  },
  {
    id: "herbies",
    name: "Herbies Seeds",
    url: "https://herbiesheadshop.com/",
    tagline: "European seed bank with worldwide shipping.",
    verified: true,
    country: "Spain"
  }
];
function SeedVendorFinder({ onBack, strainName, strainSlug }) {
  const [vendors, setVendors] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(false);
  const [error, setError] = reactExports.useState(null);
  const [searchStrain, setSearchStrain] = reactExports.useState(strainName || "");
  const [country, setCountry] = reactExports.useState("all");
  const [showPopular, setShowPopular] = reactExports.useState(false);
  const [useStaticList, setUseStaticList] = reactExports.useState(false);
  const searchVendors = reactExports.useCallback(async (strain) => {
    setLoading(true);
    setError(null);
    setShowPopular(false);
    try {
      let url = `${API_BASE}/api/seeds-live?`;
      if (strain) url += `strain=${encodeURIComponent(strain)}&`;
      if (country !== "all") url += `country=${country}&`;
      url += `include_google=true`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Search failed");
      const data = await response.json();
      setVendors(data.results || []);
    } catch (err) {
      console.error("Seed vendor search failed:", err);
      setError("Failed to find seed vendors. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [country]);
  const loadPopularVendors = reactExports.useCallback(async () => {
    setLoading(true);
    setError(null);
    setShowPopular(true);
    try {
      const url = `${API_BASE}/api/seeds-live/popular`;
      console.log("[SeedVendorFinder] Fetching from:", url);
      const response = await fetch(url);
      console.log("[SeedVendorFinder] Response status:", response.status, response.statusText);
      if (!response.ok) throw new Error("Failed to load popular vendors");
      const data = await response.json();
      console.log("[SeedVendorFinder] Received vendors:", data?.results?.length || 0);
      setVendors(data.results || []);
    } catch (err) {
      console.error("[SeedVendorFinder] Failed to load popular vendors:", err);
      setError("Failed to load seed vendors. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);
  reactExports.useEffect(() => {
    setVendors(STATIC_SEED_VENDORS);
    setUseStaticList(true);
    setLoading(false);
    if (strainName || strainSlug) {
      searchVendors(strainSlug || strainName);
    }
  }, [strainName, strainSlug, searchVendors]);
  const handleSearch = /* @__PURE__ */ __name(() => {
    if (searchStrain.trim()) {
      searchVendors(searchStrain.trim());
    } else {
      loadPopularVendors();
    }
  }, "handleSearch");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Box,
    {
      sx: {
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "#050705",
        bgcolor: "#0a0f0a",
        // Clean, solid dark green background
        position: "relative"
      },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(BackHeader, { title: "Seed Vendors", onBack }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: {
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          px: 2,
          pb: 2,
          pt: 1
        }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Paper, { sx: {
            p: 2,
            mb: 2,
            background: "rgba(255,255,255,0.1)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(124, 179, 66, 0.3)",
            borderRadius: 2
          }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Grid, { container: true, spacing: 2, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { item: true, xs: 12, md: 6, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              TextField,
              {
                fullWidth: true,
                size: "small",
                label: "Strain Name",
                value: searchStrain,
                onChange: /* @__PURE__ */ __name((e) => setSearchStrain(e.target.value), "onChange"),
                placeholder: "e.g., Blue Dream, OG Kush",
                onKeyPress: /* @__PURE__ */ __name((e) => e.key === "Enter" && handleSearch(), "onKeyPress"),
                sx: {
                  "& .MuiOutlinedInput-root": {
                    color: "#fff",
                    "& fieldset": { borderColor: "rgba(124, 179, 66, 0.5)" },
                    "&:hover fieldset": { borderColor: "rgba(124, 179, 66, 0.7)" },
                    "&.Mui-focused fieldset": { borderColor: "#7cb342" }
                  },
                  "& .MuiInputLabel-root": { color: "#fff" }
                }
              }
            ) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { item: true, xs: 12, md: 3, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(FormControl, { fullWidth: true, size: "small", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(InputLabel, { sx: { color: "#fff" }, children: "Country" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  value: country,
                  onChange: /* @__PURE__ */ __name((e) => setCountry(e.target.value), "onChange"),
                  label: "Country",
                  sx: {
                    color: "#fff",
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(124, 179, 66, 0.5)" },
                    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(124, 179, 66, 0.7)" },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#7cb342" }
                  },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(MenuItem, { value: "all", children: "All Countries" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(MenuItem, { value: "USA", children: "USA" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(MenuItem, { value: "Canada", children: "Canada" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(MenuItem, { value: "Netherlands", children: "Netherlands" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(MenuItem, { value: "Spain", children: "Spain" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(MenuItem, { value: "UK", children: "UK" })
                  ]
                }
              )
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { item: true, xs: 12, md: 3, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                fullWidth: true,
                variant: "contained",
                onClick: handleSearch,
                disabled: loading,
                sx: {
                  bgcolor: "#7cb342",
                  "&:hover": { bgcolor: "#689f38" },
                  height: "40px"
                },
                children: loading ? "Searching..." : "Search"
              }
            ) })
          ] }) }),
          error && /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { severity: "error", sx: { mb: 2 }, children: error }),
          loading && /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { display: "flex", justifyContent: "center", py: 8 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(CircularProgress, { sx: { color: "#7cb342" } }) }),
          !loading && vendors.length === 0 && !useStaticList && /* @__PURE__ */ jsxRuntimeExports.jsxs(Paper, { sx: {
            p: 4,
            textAlign: "center",
            background: "rgba(255,255,255,0.1)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(124, 179, 66, 0.3)",
            borderRadius: 2
          }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", sx: { color: "#fff", mb: 2 }, children: "No seed vendors found" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "#e0e0e0", mb: 2 }, children: "Try a different strain or browse trusted seed banks below." }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "outlined",
                onClick: /* @__PURE__ */ __name(() => {
                  setVendors(STATIC_SEED_VENDORS);
                  setUseStaticList(true);
                }, "onClick"),
                sx: {
                  color: "#fff",
                  borderColor: "rgba(124, 179, 66, 0.6)",
                  "&:hover": { borderColor: "#7cb342", bgcolor: "rgba(124, 179, 66, 0.1)" }
                },
                children: "View Trusted Seed Banks"
              }
            )
          ] }),
          !loading && /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "#e0e0e0", mb: 2 }, children: "Trusted Seed Banks" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { container: true, spacing: 2, children: STATIC_SEED_VENDORS.map((vendor) => /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { item: true, xs: 12, md: 6, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { sx: {
              background: "rgba(255,255,255,0.1)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(124, 179, 66, 0.3)",
              borderRadius: 2,
              height: "100%"
            }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 2, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Stack, { direction: "row", justifyContent: "space-between", alignItems: "flex-start", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { flex: 1, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, mb: 1, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", sx: { color: "#fff", fontWeight: 600 }, children: vendor.name }),
                  vendor.verified && /* @__PURE__ */ jsxRuntimeExports.jsx(VerifiedIcon, { sx: { fontSize: 20, color: "#7cb342" } })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", spacing: 1, flexWrap: "wrap", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Chip,
                    {
                      label: "Trusted",
                      size: "small",
                      sx: { bgcolor: "rgba(124, 179, 66, 0.3)", color: "#fff", fontSize: "0.65rem", height: 18 }
                    }
                  ),
                  vendor.country && /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Chip,
                    {
                      label: vendor.country,
                      size: "small",
                      sx: { bgcolor: "rgba(255,255,255,0.2)", color: "#fff", fontSize: "0.65rem", height: 18 }
                    }
                  )
                ] })
              ] }) }),
              vendor.tagline && /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "#e0e0e0" }, children: vendor.tagline }),
              vendor.url ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  fullWidth: true,
                  variant: "contained",
                  component: "a",
                  href: vendor.url,
                  target: "_blank",
                  rel: "noopener noreferrer",
                  sx: {
                    bgcolor: "#7cb342",
                    "&:hover": { bgcolor: "#689f38" }
                  },
                  children: "Visit Store →"
                }
              ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  fullWidth: true,
                  variant: "outlined",
                  disabled: true,
                  sx: {
                    borderColor: "rgba(124, 179, 66, 0.3)",
                    color: "rgba(255,255,255,0.5)"
                  },
                  children: "No URL Available"
                }
              )
            ] }) }) }) }, vendor.id)) })
          ] }),
          !loading && vendors.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "#e0e0e0", mb: 2 }, children: showPopular ? "Popular Seed Banks" : `Found ${vendors.length} seed vendors` }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { container: true, spacing: 2, children: vendors.map((vendor) => /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { item: true, xs: 12, md: 6, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { sx: {
              background: "rgba(255,255,255,0.1)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(124, 179, 66, 0.3)",
              borderRadius: 2,
              height: "100%"
            }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 2, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", justifyContent: "space-between", alignItems: "flex-start", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { flex: 1, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, mb: 1, children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", sx: { color: "#fff", fontWeight: 600 }, children: vendor.name }),
                    vendor.verified && /* @__PURE__ */ jsxRuntimeExports.jsx(VerifiedIcon, { sx: { fontSize: 20, color: "#7cb342" } })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", spacing: 1, flexWrap: "wrap", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Chip,
                      {
                        label: vendor.source,
                        size: "small",
                        sx: { bgcolor: "rgba(255,255,255,0.2)", color: "#fff", fontSize: "0.65rem", height: 18 }
                      }
                    ),
                    vendor.country && /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Chip,
                      {
                        label: vendor.country,
                        size: "small",
                        sx: { bgcolor: "rgba(124, 179, 66, 0.3)", color: "#fff", fontSize: "0.65rem", height: 18 }
                      }
                    )
                  ] })
                ] }),
                (vendor.website || vendor.product_url) && /* @__PURE__ */ jsxRuntimeExports.jsx(
                  IconButton,
                  {
                    size: "small",
                    component: "a",
                    href: vendor.website || vendor.product_url,
                    target: "_blank",
                    sx: { color: "#7cb342" },
                    title: "Visit Website",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(LanguageIcon, {})
                  }
                )
              ] }),
              vendor.description && /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "#e0e0e0" }, children: vendor.description }),
              vendor.price && /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "h6", sx: { color: "#7cb342", fontWeight: 600 }, children: [
                  "$",
                  vendor.price,
                  " ",
                  vendor.currency || "USD"
                ] }),
                vendor.seed_count && /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "caption", sx: { color: "#e0e0e0" }, children: [
                  vendor.seed_count,
                  " seeds"
                ] })
              ] }),
              vendor.rating > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", alignItems: "center", spacing: 0.5, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(StarIcon, { sx: { fontSize: 16, color: "#ffd600" } }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", sx: { color: "#fff" }, children: [
                  vendor.rating,
                  " ",
                  vendor.review_count > 0 && `(${vendor.review_count} reviews)`
                ] })
              ] }),
              vendor.shipping_regions && vendor.shipping_regions.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(LocalShippingIcon, { sx: { fontSize: 16, color: "#7cb342" } }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "caption", sx: { color: "#e0e0e0" }, children: [
                  "Ships to: ",
                  vendor.shipping_regions.join(", ")
                ] })
              ] }),
              vendor.payment_methods && vendor.payment_methods.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(PaymentIcon, { sx: { fontSize: 16, color: "#7cb342" } }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "caption", sx: { color: "#e0e0e0" }, children: vendor.payment_methods.join(", ") })
              ] }),
              vendor.in_stock !== void 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
                Chip,
                {
                  label: vendor.in_stock ? "In Stock" : "Out of Stock",
                  size: "small",
                  sx: {
                    bgcolor: vendor.in_stock ? "rgba(76, 175, 80, 0.3)" : "rgba(244, 67, 54, 0.3)",
                    color: "#fff",
                    fontSize: "0.75rem",
                    width: "fit-content"
                  }
                }
              ),
              (vendor.website || vendor.product_url || vendor.url) && /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  fullWidth: true,
                  variant: "contained",
                  component: "a",
                  href: vendor.website || vendor.product_url || vendor.url,
                  target: "_blank",
                  rel: "noopener noreferrer",
                  sx: {
                    bgcolor: "#7cb342",
                    "&:hover": { bgcolor: "#689f38" }
                  },
                  children: "Visit Store →"
                }
              ),
              !(vendor.website || vendor.product_url || vendor.url) && /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  fullWidth: true,
                  variant: "outlined",
                  disabled: true,
                  sx: {
                    borderColor: "rgba(124, 179, 66, 0.3)",
                    color: "rgba(255,255,255,0.5)"
                  },
                  children: "No URL Available"
                }
              )
            ] }) }) }) }, vendor.id)) })
          ] })
        ] })
      ]
    }
  );
}
__name(SeedVendorFinder, "SeedVendorFinder");
export {
  SeedVendorFinder as S
};
