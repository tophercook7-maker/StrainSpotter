var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { r as reactExports, j as jsxRuntimeExports, B as Box, n as CircularProgress, T as Typography, A as Alert, i as Button, S as Stack, H as Chip, aM as MyLocationIcon, aN as OpenInNewIcon, a0 as Grid, f as Card, h as CardContent, aO as ButtonGroup, ao as PhoneIcon, an as DirectionsIcon } from "./react-vendor-DaVUs1pH.js";
import { a as API_BASE, C as CannabisLeafIcon } from "./App-BxlAc3TE.js";
import { b as useNavigate } from "./router-vendor-CizxVMW3.js";
import "./vendor-qR99EfKL.js";
function Dispensaries({ onBack }) {
  const navigate = useNavigate();
  const [dispensaries, setDispensaries] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [error, setError] = reactExports.useState(null);
  const [userLocation, setUserLocation] = reactExports.useState(null);
  const [locationError, setLocationError] = reactExports.useState(null);
  reactExports.useEffect(() => {
    const getLocation = /* @__PURE__ */ __name(async () => {
      try {
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Geolocation) {
          const { Geolocation } = window.Capacitor.Plugins;
          const position = await Geolocation.getCurrentPosition({
            timeout: 15e3,
            enableHighAccuracy: false,
            maximumAge: 3e5
            // 5 min cache
          });
          console.log("[Dispensaries] Location obtained via Capacitor:", position);
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          return;
        }
        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              console.log("[Dispensaries] Location obtained successfully");
              setUserLocation({
                lat: position.coords.latitude,
                lng: position.coords.longitude
              });
            },
            (err) => {
              console.warn("[Dispensaries] Location access denied:", err.message);
              if (err.code === 1) {
                setLocationError("Location access denied. Please enable location services or search manually.");
              } else {
                setLocationError("Unable to detect location. Please search manually or enable location services.");
              }
            },
            {
              timeout: 15e3,
              // 15 second timeout
              maximumAge: 3e5,
              // 5 min cache
              enableHighAccuracy: false
            }
          );
        } else {
          console.log("[Dispensaries] Geolocation not supported");
          setLocationError("Geolocation not supported. Please search manually.");
        }
      } catch (error2) {
        console.error("[Dispensaries] Location error:", error2);
        setLocationError("Unable to detect location. Please search manually.");
      }
    }, "getLocation");
    getLocation();
  }, []);
  reactExports.useEffect(() => {
    if (!userLocation) {
      setLoading(false);
      return;
    }
    const params = new URLSearchParams();
    params.set("lat", userLocation.lat);
    params.set("lng", userLocation.lng);
    params.set("radius", "50");
    const url = `${API_BASE}/api/dispensaries?${params}`;
    console.log("[Dispensaries] Fetching from:", url);
    fetch(url).then((res) => {
      console.log("[Dispensaries] Response status:", res.status, res.statusText);
      if (!res.ok) {
        if (res.status === 400) {
          return res.json().then((err) => {
            throw new Error(err.error || "Location required");
          });
        }
        throw new Error("Failed to load dispensaries");
      }
      return res.json();
    }).then((data) => {
      console.log("[Dispensaries] Received dispensaries:", data?.length || 0);
      if (userLocation && Array.isArray(data)) {
        data.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
      }
      setDispensaries(data || []);
      setError(null);
    }).catch((e) => {
      console.error("[Dispensaries] Error:", e);
      setError(e.message || "Failed to load dispensaries. Please try again.");
      setDispensaries([]);
    }).finally(() => setLoading(false));
  }, [userLocation]);
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { display: "flex", flexDirection: "column", alignItems: "center", gap: 2, m: 4 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CircularProgress, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", color: "text.secondary", children: userLocation ? "Finding dispensaries near you..." : "Getting your location..." })
    ] });
  }
  if (error) return /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { severity: "error", sx: { m: 2 }, children: error });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { p: 3 }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        style: {
          position: "absolute",
          top: 16,
          left: 16,
          zIndex: 100,
          background: "rgba(34, 139, 34, 0.25)",
          border: "1px solid #228B22",
          borderRadius: 12,
          boxShadow: "0 2px 12px rgba(34,139,34,0.15)",
          backdropFilter: "blur(8px)",
          color: "#228B22",
          padding: "8px 16px",
          display: "flex",
          alignItems: "center",
          fontWeight: 600,
          fontSize: 18
        },
        onClick: /* @__PURE__ */ __name(() => navigate("/"), "onClick"),
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CannabisLeafIcon, { style: { marginRight: 8, height: 24 } }),
          "Home"
        ]
      }
    ),
    onBack && /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { mb: 2 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: onBack, size: "small", variant: "contained", sx: { bgcolor: "#7CB342", color: "white", textTransform: "none", fontWeight: 700, borderRadius: 999, "&:hover": { bgcolor: "#689f38" } }, children: "← Back to Garden" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", alignItems: "center", spacing: 2, sx: { mb: 3 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h4", sx: { fontWeight: 700 }, children: "Dispensaries Near You" }),
      userLocation && /* @__PURE__ */ jsxRuntimeExports.jsx(
        Chip,
        {
          icon: /* @__PURE__ */ jsxRuntimeExports.jsx(MyLocationIcon, {}),
          label: "Location enabled",
          color: "success",
          size: "small"
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { mb: 4 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", sx: { mb: 1 }, children: "Google Maps Results" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          variant: "outlined",
          color: "primary",
          startIcon: /* @__PURE__ */ jsxRuntimeExports.jsx(OpenInNewIcon, {}),
          href: userLocation ? `https://www.google.com/maps/search/dispensary/@${userLocation.lat},${userLocation.lng},13z` : `https://www.google.com/maps/search/dispensary/`,
          target: "_blank",
          rel: "noopener noreferrer",
          sx: { mb: 2 },
          children: "View Dispensaries on Google Maps"
        }
      )
    ] }),
    locationError && /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { severity: "info", sx: { mb: 2 }, children: locationError }),
    dispensaries.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { severity: "info", children: "No dispensaries found nearby. Try expanding your search radius or check back later." }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { container: true, spacing: 3, children: dispensaries.map((d, idx) => /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { item: true, size: { xs: 12, sm: 6, md: 4 }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { sx: { mb: 2, background: "rgba(255,255,255,0.10)", backdropFilter: "blur(12px)", border: "2px solid black", boxShadow: "none" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { sx: { flex: 1 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", gutterBottom: true, sx: { fontWeight: 600 }, children: d.name }),
        d.distance && /* @__PURE__ */ jsxRuntimeExports.jsx(
          Chip,
          {
            label: `${d.distance.toFixed(1)} mi away`,
            size: "small",
            color: "primary",
            sx: { mb: 1 }
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 0.5, sx: { mt: 1 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "black", fontSize: "1.08rem" }, children: d.address }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", color: "text.secondary", children: [
            d.city,
            ", ",
            d.state,
            " ",
            d.zip || ""
          ] }),
          d.description && /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { mt: 1 }, children: d.description })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { p: 2, pt: 0 }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(ButtonGroup, { fullWidth: true, orientation: "vertical", variant: "contained", children: [
        d.phone && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            startIcon: /* @__PURE__ */ jsxRuntimeExports.jsx(PhoneIcon, {}),
            href: `tel:${d.phone.replace(/[^0-9+]/g, "")}`,
            sx: {
              background: "linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)",
              "&:hover": {
                background: "linear-gradient(45deg, #388e3c 30%, #4caf50 90%)"
              }
            },
            children: [
              "Call ",
              d.phone
            ]
          }
        ),
        d.lat && d.lng || d.address && d.city && d.state ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            startIcon: /* @__PURE__ */ jsxRuntimeExports.jsx(DirectionsIcon, {}),
            onClick: /* @__PURE__ */ __name(() => {
              const destination = d.lat && d.lng ? `${d.lat},${d.lng}` : `${d.address}, ${d.city}, ${d.state} ${d.zip || ""}`.trim();
              const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
              window.open(mapsUrl, "_blank");
            }, "onClick"),
            sx: {
              background: "linear-gradient(45deg, #2196f3 30%, #42a5f5 90%)",
              "&:hover": {
                background: "linear-gradient(45deg, #1976d2 30%, #2196f3 90%)"
              }
            },
            children: "Get Directions"
          }
        ) : null,
        d.website && /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            startIcon: /* @__PURE__ */ jsxRuntimeExports.jsx(OpenInNewIcon, {}),
            href: d.website,
            target: "_blank",
            rel: "noopener noreferrer",
            sx: {
              background: "linear-gradient(45deg, #ff9800 30%, #ffa726 90%)",
              "&:hover": {
                background: "linear-gradient(45deg, #f57c00 30%, #ff9800 90%)"
              }
            },
            children: "Visit Website"
          }
        )
      ] }) })
    ] }) }, `${d.id}-${idx}`)) })
  ] });
}
__name(Dispensaries, "Dispensaries");
export {
  Dispensaries as default
};
