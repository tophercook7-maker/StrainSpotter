var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { r as reactExports, j as jsxRuntimeExports, B as Box, P as Paper, T as Typography, m as TextField, i as Button, n as CircularProgress, S as Stack, aj as LocationOn, A as Alert, ak as Slider, f as Card, al as CardActionArea, h as CardContent, H as Chip, am as StarIcon, I as IconButton, an as DirectionsIcon, ao as PhoneIcon, ap as LanguageIcon, aq as Modal, y as ArrowBackIcon, C as Container, D as Dialog, p as DialogTitle, ai as CloseIcon, q as DialogContent, ar as DialogContentText, Z as Divider, u as DialogActions, as as Snackbar, Q as Tooltip, a1 as Fab, N as FeedbackIcon, k as Tabs, l as Tab } from "./react-vendor-DaVUs1pH.js";
import { a as API_BASE, c as useProMode, u as useAuth, F as FUNCTIONS_BASE, s as supabase, E as ErrorBoundary, S as SUPABASE_ANON_KEY } from "./App-BxlAc3TE.js";
import { S as SeedVendorFinder } from "./SeedVendorFinder-CxxEvy7T.js";
import { B as BackHeader } from "./BackHeader-jwQJOBEe.js";
import { n as normalizeScanResult, c as cleanCandidateName, g as getScanKindLabel, S as ScanResultCard } from "./ScanResultCard-BGx_BhU_.js";
import { u as useCanScan, A as AnimatedScanProgress } from "./useCanScan-DUbcGzHt.js";
import { u as useCreditBalance } from "./useCreditBalance-C4unyUsC.js";
function MembershipLogin({ onSuccess }) {
  const [email, setEmail] = reactExports.useState("");
  const [name, setName] = reactExports.useState("");
  const [loading, setLoading] = reactExports.useState(false);
  const [error, setError] = reactExports.useState("");
  const [applied, setApplied] = reactExports.useState(false);
  const handleApply = /* @__PURE__ */ __name(async () => {
    setLoading(true);
    setError("");
    try {
      const resp = await fetch(`${API_BASE}/api/membership/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, full_name: name })
      });
      const data = await resp.json();
      if (!resp.ok || !data.success) throw new Error(data.error || "Application failed");
      setApplied(true);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }, "handleApply");
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "none" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Paper, { sx: { p: 4, borderRadius: 6, minWidth: 340, maxWidth: 400, textAlign: "center", background: "rgba(255,255,255,0.15)", backdropFilter: "blur(20px)", border: "2px solid rgba(124, 179, 66, 0.3)" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h4", sx: { mb: 2, color: "#fff", fontWeight: 900 }, children: "Enter the Garden" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body1", sx: { mb: 3, color: "#e0e0e0" }, children: "Welcome! Please apply for membership to access the full app." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      TextField,
      {
        label: "Full Name",
        value: name,
        onChange: /* @__PURE__ */ __name((e) => setName(e.target.value), "onChange"),
        fullWidth: true,
        sx: { mb: 2 }
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      TextField,
      {
        label: "Email Address",
        value: email,
        onChange: /* @__PURE__ */ __name((e) => setEmail(e.target.value), "onChange"),
        fullWidth: true,
        sx: { mb: 2 }
      }
    ),
    error && /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { color: "error", sx: { mb: 2 }, children: error }),
    !applied ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          variant: "contained",
          color: "success",
          sx: {
            fontWeight: 700,
            borderRadius: 999,
            px: 4,
            py: 1,
            fontSize: 18,
            boxShadow: "none",
            bgcolor: "rgba(124, 179, 66, 0.3)",
            border: "2px solid rgba(124, 179, 66, 0.6)",
            backdropFilter: "blur(10px)",
            color: "#fff",
            textTransform: "none",
            mb: 2,
            "&:hover": {
              bgcolor: "rgba(124, 179, 66, 0.5)",
              border: "2px solid rgba(124, 179, 66, 0.8)"
            }
          },
          onClick: handleApply,
          disabled: loading || !email || !name,
          children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircularProgress, { size: 24, color: "inherit" }) : "Apply for Membership"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          variant: "text",
          sx: {
            fontWeight: 600,
            color: "#fff",
            textTransform: "none",
            bgcolor: "rgba(124, 179, 66, 0.15)",
            backdropFilter: "blur(10px)",
            "&:hover": {
              bgcolor: "rgba(124, 179, 66, 0.25)"
            }
          },
          onClick: /* @__PURE__ */ __name(() => onSuccess && onSuccess(), "onClick"),
          children: "Skip for now (Browse only)"
        }
      )
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", sx: { mt: 3, color: "#fff", mb: 2 }, children: "Membership application complete! You may now enter the garden." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          variant: "contained",
          color: "success",
          sx: {
            fontWeight: 700,
            borderRadius: 999,
            px: 4,
            py: 1,
            fontSize: 18,
            boxShadow: "none",
            bgcolor: "rgba(124, 179, 66, 0.3)",
            border: "2px solid rgba(124, 179, 66, 0.6)",
            backdropFilter: "blur(10px)",
            color: "#fff",
            textTransform: "none",
            "&:hover": {
              bgcolor: "rgba(124, 179, 66, 0.5)",
              border: "2px solid rgba(124, 179, 66, 0.8)"
            }
          },
          onClick: /* @__PURE__ */ __name(() => onSuccess && onSuccess(), "onClick"),
          children: "Continue"
        }
      )
    ] })
  ] }) });
}
__name(MembershipLogin, "MembershipLogin");
function DispensaryFinder({ onBack, strainSlug }) {
  const [dispensaries, setDispensaries] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(false);
  const [error, setError] = reactExports.useState(null);
  const [userLocation, setUserLocation] = reactExports.useState(null);
  const [radius, setRadius] = reactExports.useState(10);
  const [locationStatus, setLocationStatus] = reactExports.useState("idle");
  const initialRadiusRef = reactExports.useRef(10);
  const searchDispensaries = reactExports.useCallback(async (lat, lng, searchRadius) => {
    setLoading(true);
    setError(null);
    try {
      let url = `${API_BASE}/api/dispensaries-live?lat=${lat}&lng=${lng}&radius=${searchRadius}&limit=100`;
      if (strainSlug) {
        url += `&strain=${strainSlug}`;
      }
      console.log("[DispensaryFinder] Calling API:", url);
      const response = await fetch(url);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("[DispensaryFinder] API error:", response.status, errorText);
        console.error("[DispensaryFinder] API URL:", url);
        console.error("[DispensaryFinder] API_BASE:", API_BASE);
        let errorMsg = `Search failed: ${response.status}`;
        if (response.status === 404) {
          errorMsg = "Dispensary search endpoint not found. The backend server may not be running.";
        } else if (response.status === 500) {
          errorMsg = "Server error during search. This may be a temporary issue - please try again.";
        }
        throw new Error(errorMsg);
      }
      const data = await response.json();
      console.log("[DispensaryFinder] API response:", data);
      let results = [];
      if (Array.isArray(data)) {
        results = data;
      } else if (data && typeof data === "object") {
        results = data.results || data.dispensaries || [];
      }
      console.log("[DispensaryFinder] Found dispensaries:", results.length);
      console.log("[DispensaryFinder] Response structure:", {
        isArray: Array.isArray(data),
        hasResults: !!data.results,
        resultsLength: results.length,
        total: data.total,
        sources: data.sources
      });
      if (!Array.isArray(results) || results.length === 0) {
        console.warn("[DispensaryFinder] No dispensaries found in response");
        const total = data?.total || 0;
        if (total === 0) {
          setError(`No dispensaries found within ${searchRadius} miles. Try increasing the search radius.`);
        } else {
          setError("No dispensaries found. The search may have returned no results for this area.");
        }
        setDispensaries([]);
      } else {
        setError(null);
        setDispensaries(results);
      }
    } catch (err) {
      console.error("[DispensaryFinder] Search failed:", err);
      const errorMsg = err?.message || "Failed to find dispensaries. Please check your connection and try again.";
      setError(errorMsg);
      setDispensaries([]);
    } finally {
      setLoading(false);
    }
  }, [strainSlug]);
  const requestLocation = reactExports.useCallback(async () => {
    try {
      setLocationStatus("detecting");
      setError(null);
      console.log("[DispensaryFinder] Requesting location permission...");
      let location = null;
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Geolocation) {
        try {
          const { Geolocation } = window.Capacitor.Plugins;
          console.log("[DispensaryFinder] Using Capacitor Geolocation plugin...");
          const position = await Promise.race([
            Geolocation.getCurrentPosition({
              timeout: 15e3,
              // 15 seconds - shorter timeout
              enableHighAccuracy: false,
              maximumAge: 3e5
              // 5 min cache
            }),
            new Promise((_, reject) => {
              setTimeout(() => reject(new Error("TIMEOUT")), 15e3);
            })
          ]);
          console.log("[DispensaryFinder] Location obtained via Capacitor:", position);
          location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
        } catch (capacitorErr) {
          console.warn("[DispensaryFinder] Capacitor Geolocation failed, trying browser API:", capacitorErr);
          if (capacitorErr.message === "TIMEOUT") {
            throw { code: 3, message: "Location request timed out after 15 seconds" };
          }
        }
      }
      if (!location && navigator.geolocation) {
        console.log("[DispensaryFinder] Using browser geolocation API...");
        const timeoutId = setTimeout(() => {
          console.warn("[DispensaryFinder] Geolocation timeout exceeded (15s)");
        }, 15e3);
        try {
          const pos = await Promise.race([
            new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  clearTimeout(timeoutId);
                  resolve(position);
                },
                (error2) => {
                  clearTimeout(timeoutId);
                  reject(error2);
                },
                {
                  enableHighAccuracy: false,
                  timeout: 15e3,
                  // 15 seconds - shorter timeout
                  maximumAge: 3e5
                  // Accept cached location up to 5 minutes old
                }
              );
            }),
            new Promise((_, reject) => {
              setTimeout(() => {
                clearTimeout(timeoutId);
                reject(new Error("TIMEOUT"));
              }, 15e3);
            })
          ]);
          location = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          };
          console.log("[DispensaryFinder] Location obtained via browser API:", location);
        } catch (geoError) {
          clearTimeout(timeoutId);
          if (geoError.message === "TIMEOUT") {
            throw { code: 3, message: "Location request timed out after 15 seconds" };
          }
          throw geoError;
        }
      }
      if (!location) {
        setLocationStatus("unsupported");
        setError("Geolocation is not supported. Please search manually.");
        return;
      }
      setUserLocation(location);
      setLocationStatus("success");
      setError(null);
      await searchDispensaries(location.lat, location.lng, initialRadiusRef.current);
    } catch (err) {
      console.error("[DispensaryFinder] Geolocation error", err);
      if (err.code === 1) {
        setLocationStatus("denied");
        setError('Location permission denied. Please enable location access in Settings → StrainSpotter → Location, then tap "Find Dispensaries" below.');
      } else if (err.code === 2) {
        setLocationStatus("unavailable");
        setError("Location is unavailable. Please check that location services are enabled on your device.");
      } else if (err.code === 3) {
        setLocationStatus("timeout");
        setError('Location request timed out. Please tap "Find Dispensaries" to retry.');
      } else {
        setLocationStatus("error");
        setError(`Unable to get your location: ${err.message || "Unknown error"}. Please tap "Find Dispensaries" to retry.`);
      }
    }
  }, [searchDispensaries]);
  reactExports.useEffect(() => {
    if (!userLocation && locationStatus === "idle") {
      console.log("[DispensaryFinder] Auto-requesting location on mount...");
      const timer = setTimeout(() => {
        requestLocation();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, []);
  const handleRadiusChange = /* @__PURE__ */ __name((_event, newValue) => {
    setRadius(newValue);
    if (userLocation) {
      searchDispensaries(userLocation.lat, userLocation.lng, newValue);
    }
  }, "handleRadiusChange");
  const handleSearch = /* @__PURE__ */ __name(() => {
    if (userLocation) {
      searchDispensaries(userLocation.lat, userLocation.lng, radius);
    }
  }, "handleSearch");
  const openPlaceOnMaps = /* @__PURE__ */ __name((dispensary) => {
    if (dispensary.place_id) {
      window.open(`https://www.google.com/maps/place/?q=place_id:${dispensary.place_id}`, "_blank");
      return;
    }
    const name = dispensary.name || dispensary.business_name || dispensary.legal_name || dispensary.title;
    const parts = [];
    if (name) parts.push(name);
    if (dispensary.address) parts.push(dispensary.address);
    if (dispensary.formatted_address) parts.push(dispensary.formatted_address);
    const cityState = [dispensary.city, dispensary.state].filter(Boolean).join(", ").trim();
    if (cityState) parts.push(cityState);
    if (dispensary.postal_code) parts.push(dispensary.postal_code);
    if (!dispensary.address && !dispensary.city && !dispensary.state && dispensary.latitude !== void 0 && dispensary.longitude !== void 0) {
      parts.push(`${dispensary.latitude}, ${dispensary.longitude}`);
    }
    if (parts.length > 0) {
      const query = encodeURIComponent(parts.join(", "));
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
      return;
    }
    if (dispensary.latitude !== void 0 && dispensary.longitude !== void 0) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${dispensary.latitude},${dispensary.longitude}`)}`, "_blank");
    }
  }, "openPlaceOnMaps");
  const getDirections = /* @__PURE__ */ __name((lat, lng) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, "_blank");
  }, "getDirections");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    overflow: "hidden",
    background: "none"
  }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(BackHeader, { title: "Dispensary Finder", onBack }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: {
      flex: 1,
      minHeight: 0,
      overflowY: "auto",
      WebkitOverflowScrolling: "touch",
      px: 2,
      pb: 2,
      pt: 1
    }, children: [
      !userLocation && locationStatus !== "detecting" && locationStatus !== "success" && !error && /* @__PURE__ */ jsxRuntimeExports.jsx(Paper, { sx: {
        p: 4,
        mb: 2,
        background: "rgba(255,255,255,0.1)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(124, 179, 66, 0.3)",
        borderRadius: 2,
        textAlign: "center"
      }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 3, alignItems: "center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(LocationOn, { sx: { fontSize: 64, color: "#7cb342" } }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", sx: { color: "#fff", mb: 1, fontWeight: 700 }, children: "Find Nearby Dispensaries" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "rgba(255,255,255,0.7)" }, children: "We need your location to find dispensaries near you" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            variant: "contained",
            size: "large",
            startIcon: /* @__PURE__ */ jsxRuntimeExports.jsx(LocationOn, {}),
            onClick: requestLocation,
            disabled: locationStatus === "detecting",
            sx: {
              bgcolor: "#7cb342",
              color: "#fff",
              fontWeight: 700,
              px: 4,
              py: 1.5,
              fontSize: "1.1rem",
              "&:hover": { bgcolor: "#689f38" },
              "&:disabled": { bgcolor: "rgba(124, 179, 66, 0.5)" }
            },
            children: locationStatus === "detecting" ? "Requesting Location..." : "Find Dispensaries"
          }
        )
      ] }) }),
      locationStatus === "detecting" && !error && /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { display: "flex", justifyContent: "center", py: 4 }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 2, alignItems: "center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CircularProgress, { sx: { color: "#7cb342" } }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "#e0e0e0" }, children: "Getting your location…" })
      ] }) }),
      error && locationStatus !== "success" && /* @__PURE__ */ jsxRuntimeExports.jsxs(Paper, { sx: {
        p: 3,
        mb: 2,
        background: "rgba(255,255,255,0.1)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(124, 179, 66, 0.3)",
        borderRadius: 2
      }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { severity: "warning", sx: { mb: 2, bgcolor: "rgba(255, 193, 7, 0.15)", color: "#fff", border: "1px solid rgba(255, 193, 7, 0.4)" }, children: error }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            variant: "contained",
            fullWidth: true,
            startIcon: /* @__PURE__ */ jsxRuntimeExports.jsx(LocationOn, {}),
            onClick: /* @__PURE__ */ __name(() => {
              setError(null);
              setUserLocation(null);
              setDispensaries([]);
              requestLocation();
            }, "onClick"),
            disabled: locationStatus === "detecting",
            sx: {
              bgcolor: "#7cb342",
              "&:hover": { bgcolor: "#689f38" },
              "&:disabled": { bgcolor: "rgba(124, 179, 66, 0.5)" }
            },
            children: locationStatus === "detecting" ? "Requesting..." : "Find Dispensaries"
          }
        )
      ] }),
      userLocation && locationStatus === "success" && /* @__PURE__ */ jsxRuntimeExports.jsx(Paper, { sx: {
        p: 2,
        mb: 2,
        background: "rgba(255,255,255,0.1)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(124, 179, 66, 0.3)",
        borderRadius: 2
      }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 2, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", sx: { color: "#fff", mb: 1 }, children: [
            "Search Radius: ",
            radius,
            " miles"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Slider,
            {
              value: radius,
              onChange: handleRadiusChange,
              min: 1,
              max: 100,
              step: 1,
              marks: [
                { value: 1, label: "1mi" },
                { value: 25, label: "25mi" },
                { value: 50, label: "50mi" },
                { value: 100, label: "100mi" }
              ],
              sx: {
                color: "#7cb342",
                "& .MuiSlider-markLabel": { color: "#fff", fontSize: "0.75rem" }
              }
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            variant: "contained",
            onClick: handleSearch,
            disabled: loading,
            sx: {
              bgcolor: "#7cb342",
              "&:hover": { bgcolor: "#689f38" }
            },
            children: loading ? "Searching..." : "Update Search"
          }
        )
      ] }) }),
      error && /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { severity: "error", sx: { mb: 2 }, children: error }),
      loading && /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { display: "flex", justifyContent: "center", py: 8 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(CircularProgress, { sx: { color: "#7cb342" } }) }),
      !loading && dispensaries.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Paper, { sx: {
        p: 4,
        textAlign: "center",
        background: "rgba(255,255,255,0.1)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(124, 179, 66, 0.3)",
        borderRadius: 2
      }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", sx: { color: "#fff", mb: 2 }, children: "No dispensaries found" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "#e0e0e0" }, children: "Try increasing the search radius or check back later." })
      ] }),
      !loading && dispensaries.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", sx: { color: "#e0e0e0", mb: 2 }, children: [
          "Found ",
          dispensaries.length,
          " dispensaries within ",
          radius,
          " miles"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Stack, { spacing: 2, children: dispensaries.map((dispensary) => /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { sx: {
          background: "rgba(255,255,255,0.1)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(124, 179, 66, 0.3)",
          borderRadius: 2
        }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardActionArea, { onClick: /* @__PURE__ */ __name(() => openPlaceOnMaps(dispensary), "onClick"), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", justifyContent: "space-between", alignItems: "flex-start", mb: 2, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { flex: 1, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, mb: 1, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", sx: { color: "#fff", fontWeight: 600 }, children: dispensary.name }),
                dispensary.verified && /* @__PURE__ */ jsxRuntimeExports.jsx(Chip, { label: "Verified", size: "small", sx: { bgcolor: "#7cb342", color: "#fff", fontSize: "0.7rem", height: 20 } }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Chip,
                  {
                    label: dispensary.source,
                    size: "small",
                    sx: { bgcolor: "rgba(255,255,255,0.2)", color: "#fff", fontSize: "0.65rem", height: 18 }
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 0.5, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(LocationOn, { sx: { fontSize: 16, color: "#7cb342" } }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "#e0e0e0" }, children: dispensary.address || `${dispensary.city}, ${dispensary.state}` })
                ] }),
                dispensary.distance !== void 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", sx: { color: "#7cb342", fontWeight: 600 }, children: [
                  "📍 ",
                  dispensary.distance.toFixed(1),
                  " miles away"
                ] }),
                dispensary.rating > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", alignItems: "center", spacing: 0.5, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(StarIcon, { sx: { fontSize: 16, color: "#ffd600" } }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", sx: { color: "#fff" }, children: [
                    dispensary.rating,
                    " (",
                    dispensary.review_count,
                    " reviews)"
                  ] })
                ] }),
                dispensary.open_now !== void 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Chip,
                  {
                    label: dispensary.open_now ? "Open Now" : "Closed",
                    size: "small",
                    sx: {
                      bgcolor: dispensary.open_now ? "rgba(76, 175, 80, 0.3)" : "rgba(244, 67, 54, 0.3)",
                      color: "#fff",
                      fontSize: "0.75rem",
                      width: "fit-content"
                    }
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 1, children: [
              dispensary.latitude && dispensary.longitude && /* @__PURE__ */ jsxRuntimeExports.jsx(
                IconButton,
                {
                  size: "small",
                  onClick: /* @__PURE__ */ __name((event) => {
                    event.stopPropagation();
                    getDirections(dispensary.latitude, dispensary.longitude);
                  }, "onClick"),
                  sx: { color: "#7cb342" },
                  title: "Get Directions",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(DirectionsIcon, {})
                }
              ),
              dispensary.phone && /* @__PURE__ */ jsxRuntimeExports.jsx(
                IconButton,
                {
                  size: "small",
                  component: "a",
                  href: `tel:${dispensary.phone}`,
                  onClick: /* @__PURE__ */ __name((event) => event.stopPropagation(), "onClick"),
                  sx: { color: "#7cb342" },
                  title: "Call",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(PhoneIcon, {})
                }
              ),
              dispensary.website && /* @__PURE__ */ jsxRuntimeExports.jsx(
                IconButton,
                {
                  size: "small",
                  component: "a",
                  href: dispensary.website,
                  target: "_blank",
                  onClick: /* @__PURE__ */ __name((event) => event.stopPropagation(), "onClick"),
                  sx: { color: "#7cb342" },
                  title: "Visit Website",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(LanguageIcon, {})
                }
              )
            ] })
          ] }),
          dispensary.description && /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "#e0e0e0", mt: 1 }, children: dispensary.description })
        ] }) }) }, dispensary.id)) })
      ] })
    ] })
  ] });
}
__name(DispensaryFinder, "DispensaryFinder");
function FeedbackModal({ open, onClose, user }) {
  const [input, setInput] = reactExports.useState("");
  const [submitting, setSubmitting] = reactExports.useState(false);
  const [success, setSuccess] = reactExports.useState(false);
  const [error, setError] = reactExports.useState(null);
  const handleSubmit = /* @__PURE__ */ __name(async () => {
    if (!input.trim()) return;
    if (!user || !user.id) {
      setError("Please log in to submit feedback.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/feedback/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: input, user_id: user.id })
      });
      if (res.ok) {
        setSuccess(true);
        setInput("");
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 2e3);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to send feedback.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
    setSubmitting(false);
  }, "handleSubmit");
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { open, onClose, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 380,
    bgcolor: "rgba(255,255,255,0.15)",
    backdropFilter: "blur(12px)",
    border: "2px solid #4caf50",
    boxShadow: 24,
    p: 4,
    borderRadius: 3
  }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", sx: { mb: 2, color: "black", fontWeight: 700 }, children: "Send Feedback" }),
    !user || !user.id ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { sx: { mb: 2, color: "black" }, children: "Please log in to submit feedback. This helps us follow up with you if needed." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outlined", onClick: onClose, sx: { fontWeight: 700, color: "black", borderColor: "#4caf50" }, children: "Close" })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        TextField,
        {
          multiline: true,
          minRows: 3,
          maxRows: 6,
          fullWidth: true,
          placeholder: "Share your thoughts, suggestions, or issues...",
          value: input,
          onChange: /* @__PURE__ */ __name((e) => setInput(e.target.value), "onChange"),
          sx: { mb: 2, background: "rgba(255,255,255,0.10)", borderRadius: 2, input: { color: "black" } }
        }
      ),
      error && /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { color: "error", sx: { mb: 1 }, children: error }),
      success && /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { color: "success.main", sx: { mb: 1 }, children: "Thank you for your feedback!" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", spacing: 2, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "contained", onClick: handleSubmit, disabled: submitting || !input.trim(), sx: { fontWeight: 700, background: "#4caf50", color: "black" }, children: submitting ? "Sending…" : "Send" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outlined", onClick: onClose, sx: { fontWeight: 700, color: "black", borderColor: "#4caf50" }, children: "Cancel" })
      ] })
    ] })
  ] }) });
}
__name(FeedbackModal, "FeedbackModal");
function useScanCredits() {
  const { remainingScans, loading } = useCreditBalance();
  const { isFounder, founderUnlimitedEnabled } = useProMode();
  const { user, session } = useAuth();
  const isGuest = !user && !session;
  const isFounderNormalized = Boolean(isFounder && founderUnlimitedEnabled);
  let remainingScansNormalized = remainingScans ?? null;
  if (isFounderNormalized) {
    remainingScansNormalized = Infinity;
  } else if (isGuest) {
    remainingScansNormalized = 20;
  }
  const canScan = isFounderNormalized || isGuest || (remainingScansNormalized ?? 0) > 0;
  return {
    isFounder: isFounderNormalized,
    remainingScans: remainingScansNormalized,
    canScan,
    loading,
    isGuest
  };
}
__name(useScanCredits, "useScanCredits");
const ConfidenceCallout = /* @__PURE__ */ __name(({ confidence }) => {
  if (confidence == null) return null;
  const normalized = confidence > 1 ? confidence : confidence * 100;
  const pct = Math.max(0, Math.min(100, Math.round(normalized)));
  let severity = "success";
  if (pct < 50) severity = "warning";
  if (pct < 25) severity = "error";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Alert,
    {
      severity,
      sx: { mt: 2, bgcolor: "rgba(124,179,66,0.08)", border: "1px solid rgba(124,179,66,0.3)" },
      children: [
        "AI confidence: ",
        pct,
        "%"
      ]
    }
  );
}, "ConfidenceCallout");
function ScanWizard({ onBack, onScanComplete }) {
  const fileInputRef = reactExports.useRef(null);
  const [membershipComplete, setMembershipComplete] = reactExports.useState(true);
  const [loading, setLoading] = reactExports.useState(false);
  const [scanStatus, setScanStatus] = reactExports.useState("idle");
  const [scanPhase, setScanPhase] = reactExports.useState(null);
  const [scanProgress, setScanProgress] = reactExports.useState(null);
  const [scanMessage, setScanMessage] = reactExports.useState("");
  const [errorMessage, setErrorMessage] = reactExports.useState("");
  const [result] = reactExports.useState(null);
  const [match, setMatch] = reactExports.useState(null);
  const [plantHealth] = reactExports.useState(null);
  const [scanHistory, setScanHistory] = reactExports.useState([]);
  const [alertOpen, setAlertOpen] = reactExports.useState(false);
  const [alertMsg, setAlertMsg] = reactExports.useState("");
  const [detailsOpen, setDetailsOpen] = reactExports.useState(false);
  const [detailsTab, setDetailsTab] = reactExports.useState(0);
  const [scanResult, setScanResult] = reactExports.useState(null);
  const [isPolling, setIsPolling] = reactExports.useState(false);
  const [activeView, setActiveView] = reactExports.useState("scanner");
  const [showReviewForm, setShowReviewForm] = reactExports.useState(false);
  const [reviewText, setReviewText] = reactExports.useState("");
  const [reviewEffects, setReviewEffects] = reactExports.useState("");
  const [reviewFlavors, setReviewFlavors] = reactExports.useState("");
  const [reviewRating, setReviewRating] = reactExports.useState(5);
  const [submittingReview, setSubmittingReview] = reactExports.useState(false);
  const [existingReviews, setExistingReviews] = reactExports.useState([]);
  const [showSeedVendorFinder, setShowSeedVendorFinder] = reactExports.useState(false);
  const [showDispensaryFinder, setShowDispensaryFinder] = reactExports.useState(false);
  const [showFeedback, setShowFeedback] = reactExports.useState(false);
  const [currentUser, setCurrentUser] = reactExports.useState(null);
  const [showMembershipDialog, setShowMembershipDialog] = reactExports.useState(false);
  const [creditSummary, setCreditSummary] = reactExports.useState(null);
  const [creditsLoading, setCreditsLoading] = reactExports.useState(false);
  const [showTopUpDialog, setShowTopUpDialog] = reactExports.useState(false);
  const [topUpMessage, setTopUpMessage] = reactExports.useState("");
  const topUpOptions = [
    { credits: 50, price: "$4.99" },
    { credits: 200, price: "$9.99" },
    { credits: 500, price: "$19.99" }
  ];
  const { isFounder: isFounderFromHook } = useCanScan();
  const { remainingScans, isFounder, isGuest } = useScanCredits();
  const membershipTier = (currentUser?.user_metadata?.membership || currentUser?.user_metadata?.tier || "").toString().toLowerCase();
  const metadataMembershipActive = ["club", "full-access", "pro", "owner", "admin", "garden", "member"].some((token) => membershipTier.includes(token));
  const canUseEdgeUploads = typeof FUNCTIONS_BASE === "string" && FUNCTIONS_BASE.length > 0 && FUNCTIONS_BASE !== `${API_BASE}/api`;
  const uploadViaEdgeFunction = reactExports.useCallback(async ({ base64, filename, contentType, userId }) => {
    if (!canUseEdgeUploads || !base64) return null;
    try {
      const headers = { "Content-Type": "application/json" };
      {
        headers.Authorization = `Bearer ${SUPABASE_ANON_KEY}`;
        headers.apikey = SUPABASE_ANON_KEY;
      }
      const resp = await fetch(`${FUNCTIONS_BASE}/uploads`, {
        method: "POST",
        headers,
        body: JSON.stringify({ filename, base64, contentType, user_id: userId })
      });
      if (!resp.ok) {
        const text = await resp.text().catch(() => "");
        console.warn("[ScanWizard] Edge upload failed:", resp.status, text);
        return null;
      }
      const data = await resp.json();
      if (data?.id) {
        return data;
      }
    } catch (err) {
      console.warn("[ScanWizard] Edge upload exception:", err);
    }
    return null;
  }, [canUseEdgeUploads]);
  reactExports.useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);
  const loadCredits = reactExports.useCallback(async () => {
    if (!currentUser) {
      setCreditSummary(null);
      return;
    }
    setCreditsLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/api/scans/credits?user_id=${currentUser.id}`);
      if (resp.ok) {
        const data = await resp.json();
        setCreditSummary(data);
      } else {
        const err = await resp.json().catch(() => ({}));
        console.error("Failed to load credits", err);
        if (metadataMembershipActive) {
          setCreditSummary((prev) => prev ?? {
            credits: 999,
            membershipActive: true,
            starterExpired: false,
            trialDaysRemaining: null,
            monthlyBundle: 999
          });
        }
      }
    } catch (err) {
      console.error("Credit summary error:", err);
      if (metadataMembershipActive) {
        setCreditSummary((prev) => prev ?? {
          credits: 999,
          membershipActive: true,
          starterExpired: false,
          trialDaysRemaining: null,
          monthlyBundle: 999
        });
      }
    } finally {
      setCreditsLoading(false);
    }
  }, [currentUser, metadataMembershipActive]);
  reactExports.useEffect(() => {
    if (!currentUser) {
      setCreditSummary(null);
      return;
    }
    loadCredits();
  }, [currentUser, loadCredits]);
  reactExports.useEffect(() => {
    if (match?.strain?.slug) {
      fetch(`${API_BASE}/api/reviews?strain_slug=${match.strain.slug}`).then((res) => res.json()).then((data) => {
        setExistingReviews(Array.isArray(data) ? data : []);
      }).catch(() => {
        setExistingReviews([]);
      });
    }
  }, [match?.strain?.slug]);
  const handleLeaveReviewClick = /* @__PURE__ */ __name(() => {
    if (!currentUser) {
      setShowMembershipDialog(true);
      return;
    }
    setShowReviewForm(true);
  }, "handleLeaveReviewClick");
  const handleSubmitReview = /* @__PURE__ */ __name(async () => {
    if (!match?.strain?.slug || !currentUser) return;
    setSubmittingReview(true);
    try {
      let fullReview = reviewText;
      if (reviewEffects.trim()) {
        fullReview += `

Effects: ${reviewEffects}`;
      }
      if (reviewFlavors.trim()) {
        fullReview += `

Flavors: ${reviewFlavors}`;
      }
      const response = await fetch(`${API_BASE}/api/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: currentUser.id,
          strain_slug: match.strain.slug,
          rating: reviewRating,
          comment: fullReview
        })
      });
      if (response.ok) {
        setAlertMsg("Thank you for your review! It helps the community learn about this strain.");
        setAlertOpen(true);
        setShowReviewForm(false);
        setReviewText("");
        setReviewEffects("");
        setReviewFlavors("");
        setReviewRating(5);
        const reviewsResponse = await fetch(`${API_BASE}/api/reviews?strain_slug=${match.strain.slug}`);
        const reviewsData = await reviewsResponse.json();
        setExistingReviews(reviewsData || []);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit review");
      }
    } catch (err) {
      setAlertMsg(err.message || "Failed to submit review. Please try again.");
      setAlertOpen(true);
    } finally {
      setSubmittingReview(false);
    }
  }, "handleSubmitReview");
  const parseErrorResponse = /* @__PURE__ */ __name(async (response) => {
    try {
      const data = await response.json();
      return data.error || data.message || response.statusText || "Unexpected error";
    } catch {
      return response.statusText || "Unexpected error";
    }
  }, "parseErrorResponse");
  const handlePollSuccess = reactExports.useCallback((scan, scanId) => {
    if (!scan) {
      console.warn("[ScanWizard] handlePollSuccess called without scan object");
      return;
    }
    const normalizedScan = {
      id: scan.id || scan.scanId || scan.scan_id || scanId || null,
      status: scan.status || "completed",
      created_at: scan.created_at ?? scan.createdAt ?? null,
      processed_at: scan.processed_at ?? scan.processedAt ?? null,
      image_url: scan.image_url || scan.imageUrl || scan.result?.image_url || null,
      // Move all result-like fields under result, but keep backward compatibility
      result: {
        ...scan.result || {},
        // Normalize seedBank
        seedBank: scan.result?.seedBank ?? scan.result?.seed_bank ?? null,
        // Normalize canonical_strain (handle both object and legacy string fields)
        canonical_strain: scan.result?.canonical_strain ?? scan.result?.canonicalStrain ?? (scan.canonical_strain_name ? {
          name: scan.canonical_strain_name,
          source: scan.canonical_strain_source || null,
          confidence: scan.canonical_match_confidence ?? null
        } : null),
        // Normalize ai_summary
        ai_summary: scan.result?.ai_summary ?? scan.result?.aiSummary ?? scan.ai_summary ?? scan.aiSummary ?? null,
        // Normalize packaging_insights
        packaging_insights: scan.result?.packaging_insights ?? scan.result?.packagingInsights ?? scan.packaging_insights ?? scan.packagingInsights ?? null,
        // Normalize label_insights
        label_insights: scan.result?.label_insights ?? scan.result?.labelInsights ?? scan.label_insights ?? scan.labelInsights ?? null,
        // Normalize plant_health
        plant_health: scan.result?.plant_health ?? scan.result?.plantHealth ?? scan.plant_health ?? scan.plantHealth ?? null,
        // Normalize grow_profile
        grow_profile: scan.result?.grow_profile ?? scan.result?.growProfile ?? scan.grow_profile ?? scan.growProfile ?? null
      },
      // Include the full scan object for backward compatibility
      ...scan
    };
    if (!normalizedScan.id) {
      console.warn("[ScanWizard] Poll success but missing scan id", { scan, normalizedScan });
    }
    const normalized = normalizeScanResult(normalizedScan);
    if (normalized) {
      normalizedScan.normalizedResult = normalized;
    }
    if (onScanComplete && typeof onScanComplete === "function") {
      onScanComplete(normalizedScan);
    } else {
      setActiveView("result");
    }
  }, [onScanComplete]);
  const pollScanResult = /* @__PURE__ */ __name(async (scanId, attempt = 0) => {
    const maxAttempts = 25;
    const delayMs = 1e3;
    try {
      const res = await fetch(`${API_BASE}/api/scans/${scanId}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `Scan lookup failed (${res.status})`);
      }
      const scan = data?.scan || data;
      if (!scan) {
        throw new Error("Invalid scan response from server");
      }
      const status = scan?.status || scan?.state || "unknown";
      const result2 = scan?.result;
      const hasResult = !!(result2 && (result2.visualMatches && (result2.visualMatches.match || result2.visualMatches.candidates?.length > 0) || Array.isArray(result2.matches) && result2.matches.length > 0 || result2.match || result2.labelInsights));
      const isComplete = status === "done" || status === "complete" || status === "completed" || status === "success";
      const isError = status === "error" || status === "failed" || !!scan?.error || !!scan?.errorMessage;
      const progressPercent = Math.min(70 + attempt * 2, 95);
      setScanProgress(progressPercent);
      setScanPhase("matching");
      setScanMessage(`Searching our database of 35,000+ strains… (attempt ${attempt + 1})`);
      const hasVisualMatch = !!(result2?.visualMatches?.match || result2?.visualMatches?.candidates?.length > 0);
      const hasLabelData = !!result2?.labelInsights;
      const hasAnyMatch = !!(result2?.matches?.length > 0 || result2?.match);
      const hasStrainName = !!(result2?.canonical_strain?.name || scan?.canonical_strain_name || result2?.labelInsights?.strainName);
      if (isComplete || hasResult || hasVisualMatch || hasLabelData || hasAnyMatch || hasStrainName) {
        setScanPhase("finalizing");
        setScanProgress(95);
        setScanMessage("Compiling your complete strain breakdown…");
        setIsPolling(false);
        setLoading(false);
        const normalized = normalizeScanResult(scan);
        if (normalized) {
          setScanProgress(100);
          setTimeout(() => {
            setScanPhase(null);
            setScanProgress(null);
            setScanResult(normalized);
            setScanStatus("Scan complete!");
            if (normalized.topMatch) {
              setMatch({
                strain: {
                  ...normalized.topMatch.dbMeta,
                  name: normalized.topMatch.name,
                  type: normalized.topMatch.type,
                  slug: normalized.topMatch.id
                },
                confidence: normalized.topMatch.confidence
              });
            }
            handlePollSuccess(scan, scanId);
          }, 800);
        } else {
          setScanPhase(null);
          setScanProgress(null);
          setLoading(false);
          setScanStatus("No strain match found yet. Try a clearer photo or different angle.");
          setScanResult(null);
        }
        return;
      }
      if (isError) {
        setIsPolling(false);
        setLoading(false);
        setScanPhase(null);
        setScanProgress(null);
        const errorMessage2 = scan?.error || scan?.errorMessage || "Scan failed on the server.";
        setScanStatus(errorMessage2);
        return;
      }
      if (attempt >= maxAttempts) {
        setIsPolling(false);
        setLoading(false);
        setScanPhase(null);
        setScanProgress(null);
        setScanStatus("Scan is taking too long. Please try again with a clearer photo.");
        return;
      }
      setTimeout(() => {
        pollScanResult(scanId, attempt + 1);
      }, delayMs);
    } catch (e) {
      console.error("pollScanResult error", e);
      setIsPolling(false);
      setScanPhase(null);
      setScanProgress(null);
      setScanStatus(String(e.message || e));
    }
  }, "pollScanResult");
  const handleFileChange = /* @__PURE__ */ __name(async (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setScanStatus("idle");
      return;
    }
    if (e.target) {
      e.target.value = "";
    }
    setLoading(true);
    setScanPhase("uploading");
    setScanProgress(10);
    setScanStatus("Uploading image...");
    setScanMessage("Securely uploading your photo to our servers…");
    setErrorMessage("");
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result.split(",")[1];
          let uploadData = null;
          if (canUseEdgeUploads && currentUser) {
            setScanPhase("uploading");
            setScanProgress(30);
            setScanMessage("Uploading image to Supabase…");
            setScanStatus("Uploading image to Supabase...");
            const edge = await uploadViaEdgeFunction({
              base64,
              filename: file.name,
              contentType: file.type,
              userId: currentUser.id
            });
            if (edge?.id) {
              uploadData = edge;
            }
          }
          if (!uploadData) {
            setScanPhase("uploading");
            setScanProgress(50);
            setScanMessage("Uploading image to backend…");
            setScanStatus("Uploading image to backend...");
            const uploadResp = await fetch(`${API_BASE}/api/uploads`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                filename: file.name,
                contentType: file.type,
                base64,
                user_id: currentUser?.id || null
              })
            });
            if (!uploadResp.ok) {
              const message = await parseErrorResponse(uploadResp);
              throw new Error(message || "Upload failed");
            }
            uploadData = await uploadResp.json();
          }
          const scanId = uploadData.id;
          setScanPhase("processing");
          setScanProgress(60);
          setScanMessage("Extracting text and visual features…");
          setScanStatus("Processing scan...");
          const processResp = await fetch(`${API_BASE}/api/scans/${scanId}/process`, {
            method: "POST",
            headers: { "Content-Type": "application/json" }
          });
          if (processResp.status === 402) {
            if (isFounderFromHook) {
              console.warn("[ScanWizard] Founder account hit 402 - backend may not be recognizing founder status. Continuing anyway.");
            } else {
              let errorPayload = {};
              try {
                errorPayload = await processResp.json();
              } catch (err) {
                console.warn("[ScanWizard] Could not parse credit error payload:", err);
              }
              const tier = errorPayload.tier || "free";
              const needsUpgrade = errorPayload.needsUpgrade || false;
              let message = errorPayload.message || "No scan credits remaining.";
              if (needsUpgrade) {
                message = "🎯 You've used all 10 free scans! Unlock StrainSpotter (20 scans) or join Monthly Member ($4.99/mo) for 200 scans/month. Top-up packs (50 • 200 • 500) are also available.";
              } else if (tier === "member" || tier === "monthly_member") {
                message = "📊 You've used all 200 scans this month! Add a top-up pack (50 • 200 • 500 scans) or wait for your next monthly refresh.";
              } else if (tier === "premium") {
                message = "🚀 You've used the legacy premium allotment. Grab a top-up pack (50 • 200 • 500 scans) to keep scanning.";
              }
              setAlertMsg(message);
              setAlertOpen(true);
              setTopUpMessage(message);
              setShowTopUpDialog(true);
              setScanStatus("Out of credits");
              await loadCredits();
              setLoading(false);
              return;
            }
          }
          if (!processResp.ok) {
            const message = await parseErrorResponse(processResp);
            throw new Error(message || "Scan processing failed");
          }
          const processData = await processResp.json();
          let scan = processData.scan || processData;
          if (!scan || !scan.id) {
            const scanResp = await fetch(`${API_BASE}/api/scans/${scanId}`);
            if (scanResp.ok) {
              const scanData = await scanResp.json();
              scan = scanData.scan || scanData;
            } else {
              scan = { id: scanId, status: "processing" };
            }
          }
          setScanPhase("matching");
          setScanProgress(70);
          setScanMessage("Searching our database of 35,000+ strains…");
          setScanStatus("Scan started successfully!");
          setIsPolling(true);
          setLoading(false);
          pollScanResult(scanId, 0);
          const normalizedScan = {
            id: scan.id || scan.scanId || scan.scan_id || scanId || null,
            status: scan.status || "processing",
            created_at: scan.created_at ?? scan.createdAt ?? null,
            processed_at: scan.processed_at ?? scan.processedAt ?? null,
            image_url: scan.image_url ?? scan.imageUrl ?? scan.result?.image_url ?? null,
            result: {
              ...scan.result || {},
              // Normalize all result fields for consistency
              seedBank: scan.result?.seedBank ?? scan.result?.seed_bank ?? null,
              canonical_strain: scan.result?.canonical_strain ?? scan.result?.canonicalStrain ?? (scan.canonical_strain_name ? {
                name: scan.canonical_strain_name,
                source: scan.canonical_strain_source || null,
                confidence: scan.canonical_match_confidence ?? null
              } : null),
              ai_summary: scan.result?.ai_summary ?? scan.result?.aiSummary ?? scan.ai_summary ?? scan.aiSummary ?? null,
              packaging_insights: scan.result?.packaging_insights ?? scan.result?.packagingInsights ?? scan.packaging_insights ?? scan.packagingInsights ?? null,
              label_insights: scan.result?.label_insights ?? scan.result?.labelInsights ?? scan.label_insights ?? scan.labelInsights ?? null,
              plant_health: scan.result?.plant_health ?? scan.result?.plantHealth ?? scan.plant_health ?? scan.plantHealth ?? null,
              grow_profile: scan.result?.grow_profile ?? scan.result?.growProfile ?? scan.grow_profile ?? scan.growProfile ?? null
            },
            // Include the full scan object for backward compatibility
            ...scan
          };
          if (onScanComplete && typeof onScanComplete === "function") {
            onScanComplete(normalizedScan);
          }
          await loadCredits();
        } catch (err) {
          console.error("Scan error:", err);
          setScanPhase(null);
          setScanProgress(null);
          const errorMsg = err?.message || err?.toString() || "Failed to process scan. Please check your connection and try again.";
          setScanStatus("error");
          setErrorMessage(errorMsg);
          setAlertMsg(errorMsg);
          setAlertOpen(true);
          setLoading(false);
        }
      };
      reader.onerror = () => {
        const errorMsg = "Unable to read the selected file. Please try a different image.";
        setScanStatus("error");
        setErrorMessage(errorMsg);
        setAlertMsg(errorMsg);
        setAlertOpen(true);
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Scan error:", err);
      const errorMsg = err?.message || err?.toString() || "Failed to start scan. Please check your connection and try again.";
      setScanStatus("error");
      setErrorMessage(errorMsg);
      setAlertMsg(errorMsg);
      setAlertOpen(true);
      setLoading(false);
    }
  }, "handleFileChange");
  reactExports.useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const resp = await fetch(`${API_BASE}/api/scans`);
        if (resp.ok) {
          const data = await resp.json();
          const scans = data.scans || [];
          const completed = scans.filter((s) => s.status === "complete");
          if (completed.length > 0) {
            setAlertMsg(`Scan matched: ${completed.map((s) => s.strain?.name || "Unknown").join(", ")}`);
            setAlertOpen(true);
          }
          setScanHistory(scans);
        }
      } catch (err) {
        console.error("Poll error:", err);
      }
    }, 3e4);
    return () => clearInterval(poll);
  }, []);
  const renderDetailsDialog = /* @__PURE__ */ __name(() => {
    if (!match || !match.strain) return null;
    const { strain } = match;
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Dialog,
      {
        open: detailsOpen,
        onClose: /* @__PURE__ */ __name(() => setDetailsOpen(false), "onClose"),
        maxWidth: "md",
        fullWidth: true,
        fullScreen: true,
        PaperProps: {
          sx: {
            bgcolor: "transparent",
            m: 0,
            maxHeight: "100vh"
          }
        },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogTitle, { sx: { borderBottom: "1px solid rgba(124,179,66,0.3)", display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "h6", children: [
              strain.name,
              " Details"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(IconButton, { onClick: /* @__PURE__ */ __name(() => setDetailsOpen(false), "onClick"), sx: { color: "#fff" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(CloseIcon, {}) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { value: detailsTab, onChange: /* @__PURE__ */ __name((_e, v) => setDetailsTab(v), "onChange"), sx: { borderBottom: "1px solid rgba(124,179,66,0.2)" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Tab, { label: "Overview", sx: { color: "#c8ff9e" } }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Tab, { label: "Dispensaries", sx: { color: "#c8ff9e" } }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Tab, { label: "Seeds", sx: { color: "#c8ff9e" } }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Tab, { label: "Care Guide", sx: { color: "#c8ff9e" } })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { sx: { bgcolor: "rgba(0,0,0,0.95)" }, children: [
            detailsTab === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "subtitle1", fontWeight: 700, children: "Overview" }),
              strain.description && /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { children: strain.description })
            ] }),
            detailsTab === 1 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "subtitle1", fontWeight: 700, children: "Dispensaries" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { children: "Nearby dispensaries feature coming soon." })
            ] }),
            detailsTab === 2 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "subtitle1", fontWeight: 700, children: "Seeds" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { children: "Seed info feature coming soon." })
            ] }),
            detailsTab === 3 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "subtitle1", fontWeight: 700, children: "Care Guide" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { children: "Care guide feature coming soon." })
            ] })
          ] })
        ]
      }
    );
  }, "renderDetailsDialog");
  const membershipActive = (() => {
    if (typeof creditSummary?.membershipActive === "boolean") {
      if (creditSummary.membershipActive) return true;
      if (metadataMembershipActive) return true;
      if (typeof creditSummary.monthlyBundle === "number" && creditSummary.monthlyBundle > 0) return true;
      return false;
    }
    return metadataMembershipActive;
  })();
  const creditsRemaining = typeof creditSummary?.credits === "number" ? creditSummary.credits : null;
  const monthlyBundle = typeof creditSummary?.monthlyBundle === "number" ? creditSummary.monthlyBundle : null;
  const resetAt = creditSummary?.resetAt ? new Date(creditSummary.resetAt) : null;
  const accessExpiresAt = creditSummary?.accessExpiresAt ? new Date(creditSummary.accessExpiresAt) : null;
  const starterExpired = Boolean(creditSummary?.starterExpired) && !membershipActive;
  const trialDaysRemaining = typeof creditSummary?.trialDaysRemaining === "number" ? creditSummary.trialDaysRemaining : accessExpiresAt ? Math.max(0, Math.ceil((accessExpiresAt.getTime() - Date.now()) / (1e3 * 60 * 60 * 24))) : null;
  const lowCredits = typeof creditsRemaining === "number" && creditsRemaining <= 5;
  const isOutOfScans = !isFounder && !isGuest && (remainingScans ?? 0) <= 0;
  const primaryLabel = isOutOfScans ? "Upgrade to keep scanning" : "Scan";
  const trialMessage = (() => {
    if (membershipActive) return null;
    if (!accessExpiresAt) return null;
    if (starterExpired) {
      return "Your starter access has ended. Join the Garden to keep scanning with full AI access.";
    }
    const diffDays = trialDaysRemaining ?? Math.ceil((accessExpiresAt.getTime() - Date.now()) / (1e3 * 60 * 60 * 24));
    if (diffDays <= 0) {
      return "Starter access ends today. Join the Garden to keep scanning with full AI access.";
    }
    return `Starter access ends in ${diffDays} day${diffDays === 1 ? "" : "s"}. Join the Garden or grab a top-up pack to keep scanning.`;
  })();
  const nextResetLabel = (() => {
    if (!resetAt) return null;
    return resetAt.toLocaleDateString(void 0, { month: "short", day: "numeric", year: "numeric" });
  })();
  const accessExpiresLabel = accessExpiresAt ? accessExpiresAt.toLocaleDateString(void 0, { month: "short", day: "numeric", year: "numeric" }) : null;
  if (showSeedVendorFinder) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(SeedVendorFinder, { onBack: /* @__PURE__ */ __name(() => setShowSeedVendorFinder(false), "onBack") });
  }
  if (showDispensaryFinder) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(DispensaryFinder, { onBack: /* @__PURE__ */ __name(() => setShowDispensaryFinder(false), "onBack") });
  }
  if (activeView === "result" && scanResult) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(ErrorBoundary, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Box,
      {
        sx: {
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          overflow: "hidden",
          bgcolor: "transparent"
        },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Box,
            {
              sx: {
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                p: 2,
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
                    onClick: /* @__PURE__ */ __name(() => {
                      setActiveView("scanner");
                      setScanResult(null);
                    }, "onClick"),
                    sx: { color: "#fff" },
                    "aria-label": "Go back to scanner",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowBackIcon, {})
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", sx: { fontWeight: 600, color: "#fff", flex: 1 }, children: "Scan Result" })
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
                WebkitOverflowScrolling: "touch",
                px: 2,
                py: 2
              },
              children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Container, { maxWidth: "md", sx: { py: 2 }, children: [
                (() => {
                  const isPackage = Boolean(scanResult.isPackagedProduct);
                  const dbName = cleanCandidateName(
                    scanResult?.topMatch && scanResult.topMatch.name || scanResult?.matchedName || scanResult?.name
                  );
                  const labelStrain = cleanCandidateName(scanResult.labelInsights?.strainName);
                  const aiTitle = cleanCandidateName(
                    scanResult.aiSummary?.title || scanResult.labelInsights?.aiSummary?.title
                  );
                  const primaryName = isPackage ? aiTitle || labelStrain || dbName || "Unknown product" : dbName || labelStrain || "Unknown strain";
                  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { sx: {
                    fontSize: { xs: "1.25rem", sm: "1.5rem" },
                    fontWeight: 900,
                    color: "#00e676",
                    letterSpacing: { xs: 0.5, sm: 1 },
                    mb: { xs: 1, sm: 1.5 },
                    textAlign: "center",
                    textShadow: "0 2px 8px #388e3c",
                    fontFamily: "Montserrat, Arial, sans-serif"
                  }, children: [
                    getScanKindLabel({
                      isPackagedProduct: scanResult.isPackagedProduct || false,
                      category: scanResult.labelInsights?.category,
                      productType: scanResult.labelInsights?.productType
                    }),
                    " identified: ",
                    primaryName
                  ] });
                })(),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  ScanResultCard,
                  {
                    result: scanResult,
                    isGuest: !currentUser,
                    onSaveMatch: /* @__PURE__ */ __name(() => console.log("Save match"), "onSaveMatch"),
                    onLogExperience: /* @__PURE__ */ __name(() => handleLeaveReviewClick(), "onLogExperience"),
                    onReportMismatch: /* @__PURE__ */ __name(() => {
                      setAlertMsg("Thank you for reporting. We'll review this match.");
                      setAlertOpen(true);
                    }, "onReportMismatch"),
                    onViewStrain: /* @__PURE__ */ __name(() => setDetailsOpen(true), "onViewStrain")
                  }
                ),
                plantHealth && /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: {
                  mb: { xs: 2, sm: 3 },
                  p: { xs: 2, sm: 3 },
                  bgcolor: "rgba(0, 0, 0, 0.4)",
                  borderRadius: { xs: 2, sm: 3 },
                  border: `2px solid ${plantHealth.healthStatus.color}`,
                  boxShadow: `0 0 20px ${plantHealth.healthStatus.color}40`,
                  width: "100%",
                  mt: 2
                }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", sx: { color: "#fff", fontWeight: 700, mb: { xs: 1.5, sm: 2 } }, children: "Plant Analysis" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", sx: { color: "#fff" }, children: [
                    "Growth Stage: ",
                    plantHealth.growthStage?.stage || "Unknown"
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", sx: { color: "#fff", mt: 1 }, children: [
                    "Health Status: ",
                    plantHealth.healthStatus?.status || "Unknown"
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: {
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  mt: 3,
                  width: "100%",
                  maxWidth: "400px",
                  mx: "auto"
                }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    variant: "contained",
                    fullWidth: true,
                    onClick: /* @__PURE__ */ __name(() => {
                      setActiveView("scanner");
                      setScanResult(null);
                      fileInputRef.current?.click();
                    }, "onClick"),
                    sx: {
                      py: 2,
                      fontSize: "1rem",
                      fontWeight: 700,
                      borderRadius: "12px",
                      background: "linear-gradient(135deg, #7CB342 0%, #9CCC65 100%)",
                      textTransform: "none"
                    },
                    children: "📷 Scan Another"
                  }
                ) })
              ] })
            }
          )
        ]
      }
    ) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(ErrorBoundary, { children: !membershipComplete ? /* @__PURE__ */ jsxRuntimeExports.jsx(MembershipLogin, { onSuccess: /* @__PURE__ */ __name(() => setMembershipComplete(true), "onSuccess") }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Box,
    {
      sx: {
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#0a0f0a",
        // Clean, solid dark green background
        color: "#fff",
        overflow: "hidden",
        position: "relative"
      },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Box,
          {
            sx: {
              flexShrink: 0,
              pt: "calc(env(safe-area-inset-top) + 8px)",
              px: 2,
              pb: 1,
              display: "flex",
              alignItems: "center",
              gap: 1.5
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                IconButton,
                {
                  edge: "start",
                  onClick: /* @__PURE__ */ __name(() => onBack ? onBack() : window.history.back(), "onClick"),
                  size: "small",
                  sx: { borderRadius: 2, border: "1px solid", borderColor: "divider", color: "#fff" },
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowBackIcon, { fontSize: "small" })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { flex: 1 }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "subtitle1", fontWeight: 600, noWrap: true, sx: { color: "#fff" }, children: "StrainSpotter Scanner" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "caption", sx: { color: "rgba(255,255,255,0.7)" }, noWrap: true, children: "Snap packaging or buds to decode everything" })
              ] }),
              currentUser && /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  variant: "text",
                  size: "small",
                  onClick: /* @__PURE__ */ __name(async () => {
                    try {
                      await supabase.auth.signOut();
                      setCurrentUser(null);
                      setAlertMsg("Logged out successfully");
                      setAlertOpen(true);
                      setTimeout(() => {
                        if (onBack) {
                          onBack();
                        } else {
                          window.location.href = "/";
                        }
                      }, 1e3);
                    } catch (err) {
                      console.error("Logout error:", err);
                      setAlertMsg("Logout failed");
                      setAlertOpen(true);
                    }
                  }, "onClick"),
                  sx: {
                    color: "#fff",
                    textTransform: "none"
                  },
                  children: "Logout"
                }
              )
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Box,
          {
            sx: {
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
              px: 2,
              pb: 2
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Box,
                {
                  sx: {
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 2,
                    minHeight: "100%"
                  },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { display: "flex", justifyContent: "center", mb: { xs: 1, sm: 2 } }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Box,
                      {
                        sx: {
                          width: { xs: 50, sm: 70 },
                          height: { xs: 50, sm: 70 },
                          borderRadius: "50%",
                          background: "transparent",
                          border: "2px solid rgba(124, 179, 66, 0.5)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 0 30px rgba(124, 179, 66, 0.5)",
                          overflow: "hidden"
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
                    ) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Typography,
                      {
                        variant: "h3",
                        align: "center",
                        sx: {
                          fontWeight: 900,
                          letterSpacing: 1,
                          color: "#fff",
                          mb: { xs: 0.5, sm: 1 },
                          fontSize: { xs: "1.5rem", sm: "2.5rem" },
                          textShadow: "0 2px 12px #388e3c, 0 0px 2px #000",
                          filter: "drop-shadow(0 0 8px #00e676)",
                          fontFamily: "Montserrat, Arial, sans-serif"
                        },
                        children: "Identify Your Cannabis Plant"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      Typography,
                      {
                        align: "center",
                        sx: {
                          mt: { xs: 1, sm: 2 },
                          color: "#fff",
                          fontSize: { xs: "0.875rem", sm: "1.375rem" },
                          fontWeight: 600,
                          px: { xs: 1, sm: 0 },
                          textShadow: "0 1px 8px #388e3c",
                          fontFamily: "Montserrat, Arial, sans-serif"
                        },
                        children: [
                          "Snap a photo of your cannabis and let our AI deliver the full strain breakdown—",
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { color: "#00e676", fontWeight: 900 }, children: "no hype" }),
                          ", just ",
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { color: "#ffd600", fontWeight: 900 }, children: "next-gen science" }),
                          "."
                        ]
                      }
                    ),
                    currentUser && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      Paper,
                      {
                        sx: {
                          mt: { xs: 2, sm: 4 },
                          mb: { xs: 2, sm: 3 },
                          p: { xs: 2, sm: 3 },
                          width: "100%",
                          maxWidth: 720,
                          background: "rgba(0, 0, 0, 0.45)",
                          borderRadius: { xs: 2, sm: 4 },
                          border: "1px solid rgba(124, 179, 66, 0.4)",
                          color: "#e8f5e9"
                        },
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "subtitle2", sx: { textTransform: "uppercase", letterSpacing: 1, color: "#c8ff9e", fontSize: { xs: "0.7rem", sm: "0.875rem" } }, children: "Scan Credits" }),
                            /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "h3", sx: { fontWeight: 800, color: "#fff", display: "flex", alignItems: "baseline", gap: 1, fontSize: { xs: "2rem", sm: "3rem" } }, children: [
                              creditsLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircularProgress, { size: 28, sx: { color: "#c8ff9e" } }) : isFounder ? "Unlimited" : typeof remainingScans === "number" && remainingScans === Infinity ? "Unlimited" : typeof remainingScans === "number" ? remainingScans : creditsRemaining ?? "--",
                              !isFounder && !(typeof remainingScans === "number" && remainingScans === Infinity) && /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { component: "span", variant: "h6", sx: { color: "#c8ff9e", fontWeight: 500, fontSize: { xs: "1rem", sm: "1.25rem" } }, children: "left" })
                            ] }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "#d0ffd6", maxWidth: 420, fontSize: { xs: "0.75rem", sm: "0.875rem" } }, children: membershipActive ? "Membership perks active — we auto-refresh your bundle every month so you never lose your streak." : "Starter bundle includes 20 scans. After 3 days you'll need a membership or a top-up pack to keep scanning." }),
                            membershipActive && nextResetLabel && /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "caption", sx: { display: "block", mt: 1, color: "#b2fab4", fontSize: { xs: "0.65rem", sm: "0.75rem" } }, children: [
                              "Next monthly reset: ",
                              nextResetLabel
                            ] }),
                            !membershipActive && accessExpiresLabel && /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "caption", sx: { display: "block", mt: 1, color: "#ffcc80", fontSize: { xs: "0.65rem", sm: "0.75rem" } }, children: [
                              "Starter access expires: ",
                              accessExpiresLabel
                            ] })
                          ] }),
                          !membershipActive && trialMessage && /* @__PURE__ */ jsxRuntimeExports.jsx(
                            Alert,
                            {
                              severity: starterExpired ? "error" : "info",
                              sx: {
                                mt: 2,
                                bgcolor: starterExpired ? "rgba(244, 67, 54, 0.2)" : "rgba(124, 179, 66, 0.18)",
                                color: "#fff",
                                "& .MuiAlert-icon": { color: starterExpired ? "#ffccbc" : "#c8ff9e" }
                              },
                              children: trialMessage
                            }
                          ),
                          membershipActive && monthlyBundle && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                            Alert,
                            {
                              severity: "success",
                              sx: {
                                mt: 2,
                                bgcolor: "rgba(76, 175, 80, 0.18)",
                                color: "#e8f5e9",
                                "& .MuiAlert-icon": { color: "#c8ff9e" }
                              },
                              children: [
                                "Your membership includes a ",
                                monthlyBundle,
                                "-scan bundle each month. We’ll keep it topped up automatically."
                              ]
                            }
                          ),
                          !membershipActive && lowCredits && !starterExpired && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                            Alert,
                            {
                              severity: "warning",
                              sx: {
                                mt: 2,
                                bgcolor: "rgba(255, 193, 7, 0.18)",
                                color: "#fff",
                                "& .MuiAlert-icon": { color: "#ffe082" }
                              },
                              children: [
                                "Only ",
                                creditsRemaining,
                                " scan",
                                creditsRemaining === 1 ? "" : "s",
                                " left. Add a top-up pack or join the Garden to keep results flowing."
                              ]
                            }
                          ),
                          !membershipActive && starterExpired && /* @__PURE__ */ jsxRuntimeExports.jsx(
                            Alert,
                            {
                              severity: "error",
                              sx: {
                                mt: 2,
                                bgcolor: "rgba(244, 67, 54, 0.25)",
                                color: "#fff",
                                "& .MuiAlert-icon": { color: "#ffccbc" }
                              },
                              children: "Starter access has ended. Join the Garden membership or redeem a top-up pack within the app stores to continue scanning."
                            }
                          )
                        ]
                      }
                    ),
                    (loading || isPolling || scanPhase) && /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { mt: 4, mb: 4 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                      AnimatedScanProgress,
                      {
                        phase: scanPhase,
                        message: scanMessage || scanStatus,
                        progress: scanProgress,
                        error: errorMessage || null
                      }
                    ) }),
                    errorMessage && !loading && /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Typography,
                      {
                        variant: "body2",
                        color: "error",
                        sx: { mt: 2, textAlign: "center", px: 2 },
                        children: errorMessage
                      }
                    ),
                    scanStatus && scanStatus !== "idle" && !loading && !errorMessage && /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { align: "center", sx: { mt: { xs: 1, sm: 2 }, color: "#388e3c", fontWeight: 700, fontSize: { xs: "0.875rem", sm: "1rem" } }, children: scanStatus })
                  ]
                }
              ),
              scanResult && activeView === "scanner" && /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: {
                mt: { xs: 2, sm: 4 },
                width: "100%",
                maxWidth: 600
              }, children: [
                (() => {
                  const isPackage = Boolean(scanResult.isPackagedProduct);
                  const dbName = cleanCandidateName(
                    scanResult?.topMatch && scanResult.topMatch.name || scanResult?.matchedName || scanResult?.name
                  );
                  const labelStrain = cleanCandidateName(scanResult.labelInsights?.strainName);
                  const aiTitle = cleanCandidateName(
                    scanResult.aiSummary?.title || scanResult.labelInsights?.aiSummary?.title
                  );
                  let primaryName = null;
                  if (isPackage) {
                    primaryName = aiTitle || labelStrain || dbName || "Unknown product";
                  } else {
                    primaryName = dbName || labelStrain || "Unknown strain";
                  }
                  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { sx: {
                    fontSize: { xs: "1.25rem", sm: "1.5rem" },
                    fontWeight: 900,
                    color: "#00e676",
                    letterSpacing: { xs: 0.5, sm: 1 },
                    mb: { xs: 1, sm: 1.5 },
                    textAlign: "center",
                    textShadow: "0 2px 8px #388e3c",
                    fontFamily: "Montserrat, Arial, sans-serif"
                  }, children: [
                    getScanKindLabel({
                      isPackagedProduct: scanResult.isPackagedProduct || false,
                      category: scanResult.labelInsights?.category,
                      productType: scanResult.labelInsights?.productType
                    }),
                    " identified: ",
                    primaryName
                  ] });
                })(),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  ScanResultCard,
                  {
                    result: scanResult,
                    isGuest: !currentUser,
                    onSaveMatch: /* @__PURE__ */ __name(() => {
                      console.log("Save match");
                    }, "onSaveMatch"),
                    onLogExperience: /* @__PURE__ */ __name(() => {
                      handleLeaveReviewClick();
                    }, "onLogExperience"),
                    onReportMismatch: /* @__PURE__ */ __name(() => {
                      setAlertMsg("Thank you for reporting. We'll review this match.");
                      setAlertOpen(true);
                    }, "onReportMismatch"),
                    onViewStrain: /* @__PURE__ */ __name(() => {
                      setDetailsOpen(true);
                    }, "onViewStrain")
                  }
                ),
                plantHealth && /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: {
                  mb: { xs: 2, sm: 3 },
                  p: { xs: 2, sm: 3 },
                  bgcolor: "rgba(0, 0, 0, 0.4)",
                  borderRadius: { xs: 2, sm: 3 },
                  border: `2px solid ${plantHealth.healthStatus.color}`,
                  boxShadow: `0 0 20px ${plantHealth.healthStatus.color}40`,
                  width: "100%"
                }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", sx: { color: "#fff", fontWeight: 700, mb: { xs: 1.5, sm: 2 }, display: "flex", alignItems: "center", gap: 1, fontSize: { xs: "1rem", sm: "1.25rem" } }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { component: "img", src: "/hero.png?v=13", alt: "", sx: { width: 18, height: 18, filter: "drop-shadow(0 0 4px rgba(124, 179, 66, 0.6))" } }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Plant Analysis" })
                  ] }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { mb: 2 }, children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "#9CCC65", fontWeight: 700, mb: 0.5 }, children: "Growth Stage:" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body1", sx: { color: "#fff", fontSize: 18, fontWeight: 600 }, children: [
                      plantHealth.growthStage.icon,
                      " ",
                      plantHealth.growthStage.stage
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "#b0b0b0", mt: 0.5 }, children: plantHealth.growthStage.description }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "caption", sx: { color: "#808080" }, children: [
                      "Timeframe: ",
                      plantHealth.growthStage.timeframe
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { mb: 2 }, children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "#9CCC65", fontWeight: 700, mb: 0.5 }, children: "Health Status:" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Chip,
                      {
                        label: plantHealth.healthStatus.status,
                        sx: {
                          bgcolor: `${plantHealth.healthStatus.color}30`,
                          color: plantHealth.healthStatus.color,
                          fontWeight: 700,
                          border: `2px solid ${plantHealth.healthStatus.color}`,
                          fontSize: 16,
                          px: 2,
                          py: 2.5
                        }
                      }
                    ),
                    plantHealth.healthStatus.issues.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { mt: 1 }, children: plantHealth.healthStatus.issues.map((issue, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", sx: { color: "#fff", mt: 0.5 }, children: [
                      "• ",
                      issue
                    ] }, idx)) })
                  ] }),
                  plantHealth.recommendations && plantHealth.recommendations.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "#9CCC65", fontWeight: 700, mb: 1 }, children: "Care Recommendations:" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Stack, { spacing: 0.5, children: plantHealth.recommendations.map((rec, idx) => /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "#fff", fontSize: 14 }, children: rec }, idx)) })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ConfidenceCallout, { confidence: plantHealth.confidence })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: {
                  mt: 3,
                  mb: 3,
                  p: 3,
                  bgcolor: "rgba(0, 0, 0, 0.3)",
                  borderRadius: 3,
                  border: "2px solid rgba(124, 179, 66, 0.3)",
                  width: "100%"
                }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", sx: { color: "#00e676", fontWeight: 700, mb: 2 }, children: "📝 Share Your Experience" }),
                  !showReviewForm ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", color: "#fff", sx: { mb: 2 }, children: [
                      "Have you tried ",
                      match.strain?.name,
                      "? Help the community by sharing your experience with effects, flavors, and overall rating."
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      Button,
                      {
                        variant: "contained",
                        sx: {
                          fontWeight: 700,
                          borderRadius: 999,
                          px: 4,
                          py: 1,
                          fontSize: 16,
                          boxShadow: "none",
                          bgcolor: "rgba(124, 179, 66, 0.3)",
                          border: "2px solid rgba(124, 179, 66, 0.6)",
                          backdropFilter: "blur(10px)",
                          color: "#fff",
                          textTransform: "none",
                          "&:hover": {
                            bgcolor: "rgba(124, 179, 66, 0.5)",
                            border: "2px solid rgba(124, 179, 66, 0.8)"
                          }
                        },
                        onClick: handleLeaveReviewClick,
                        children: [
                          "✍️ Leave a Review ",
                          !currentUser && "(Members Only)"
                        ]
                      }
                    )
                  ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { display: "flex", flexDirection: "column", gap: 2 }, children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      TextField,
                      {
                        label: "Your Review",
                        multiline: true,
                        rows: 4,
                        value: reviewText,
                        onChange: /* @__PURE__ */ __name((e) => setReviewText(e.target.value), "onChange"),
                        placeholder: "Share your experience with this strain...",
                        fullWidth: true,
                        sx: {
                          "& .MuiOutlinedInput-root": {
                            color: "#fff",
                            "& fieldset": { borderColor: "rgba(124, 179, 66, 0.5)" },
                            "&:hover fieldset": { borderColor: "rgba(124, 179, 66, 0.7)" },
                            "&.Mui-focused fieldset": { borderColor: "rgba(124, 179, 66, 0.9)" }
                          },
                          "& .MuiInputLabel-root": { color: "#fff" }
                        }
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      TextField,
                      {
                        label: "Effects (comma-separated)",
                        value: reviewEffects,
                        onChange: /* @__PURE__ */ __name((e) => setReviewEffects(e.target.value), "onChange"),
                        placeholder: "e.g., relaxed, happy, euphoric",
                        fullWidth: true,
                        sx: {
                          "& .MuiOutlinedInput-root": {
                            color: "#fff",
                            "& fieldset": { borderColor: "rgba(124, 179, 66, 0.5)" },
                            "&:hover fieldset": { borderColor: "rgba(124, 179, 66, 0.7)" },
                            "&.Mui-focused fieldset": { borderColor: "rgba(124, 179, 66, 0.9)" }
                          },
                          "& .MuiInputLabel-root": { color: "#fff" }
                        }
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      TextField,
                      {
                        label: "Flavors (comma-separated)",
                        value: reviewFlavors,
                        onChange: /* @__PURE__ */ __name((e) => setReviewFlavors(e.target.value), "onChange"),
                        placeholder: "e.g., berry, sweet, earthy",
                        fullWidth: true,
                        sx: {
                          "& .MuiOutlinedInput-root": {
                            color: "#fff",
                            "& fieldset": { borderColor: "rgba(124, 179, 66, 0.5)" },
                            "&:hover fieldset": { borderColor: "rgba(124, 179, 66, 0.7)" },
                            "&.Mui-focused fieldset": { borderColor: "rgba(124, 179, 66, 0.9)" }
                          },
                          "& .MuiInputLabel-root": { color: "#fff" }
                        }
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", color: "#fff", sx: { mb: 1 }, children: [
                        "Rating: ",
                        reviewRating,
                        "/10"
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "input",
                        {
                          type: "range",
                          min: "1",
                          max: "10",
                          value: reviewRating,
                          onChange: /* @__PURE__ */ __name((e) => setReviewRating(parseInt(e.target.value)), "onChange"),
                          style: { width: "100%" }
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", spacing: 2, children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Button,
                        {
                          variant: "contained",
                          disabled: submittingReview || !reviewText.trim(),
                          sx: {
                            fontWeight: 700,
                            borderRadius: 999,
                            px: 4,
                            py: 1,
                            fontSize: 16,
                            boxShadow: "none",
                            bgcolor: "rgba(124, 179, 66, 0.3)",
                            border: "2px solid rgba(124, 179, 66, 0.6)",
                            backdropFilter: "blur(10px)",
                            color: "#fff",
                            textTransform: "none",
                            "&:hover": {
                              bgcolor: "rgba(124, 179, 66, 0.5)",
                              border: "2px solid rgba(124, 179, 66, 0.8)"
                            }
                          },
                          onClick: handleSubmitReview,
                          children: submittingReview ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircularProgress, { size: 20, color: "inherit" }) : "Submit Review"
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Button,
                        {
                          variant: "outlined",
                          disabled: submittingReview,
                          sx: {
                            fontWeight: 700,
                            borderRadius: 999,
                            px: 4,
                            py: 1,
                            fontSize: 16,
                            boxShadow: "none",
                            bgcolor: "rgba(124, 179, 66, 0.2)",
                            border: "2px solid rgba(124, 179, 66, 0.5)",
                            backdropFilter: "blur(10px)",
                            color: "#fff",
                            textTransform: "none",
                            "&:hover": {
                              bgcolor: "rgba(124, 179, 66, 0.3)",
                              border: "2px solid rgba(124, 179, 66, 0.7)"
                            }
                          },
                          onClick: /* @__PURE__ */ __name(() => setShowReviewForm(false), "onClick"),
                          children: "Cancel"
                        }
                      )
                    ] })
                  ] })
                ] }),
                existingReviews.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: {
                  mt: 3,
                  mb: 3,
                  p: 3,
                  bgcolor: "rgba(0, 0, 0, 0.3)",
                  borderRadius: 3,
                  border: "2px solid rgba(124, 179, 66, 0.3)",
                  width: "100%"
                }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "h6", sx: { color: "#00e676", fontWeight: 700, mb: 2 }, children: [
                    "💬 Community Reviews (",
                    existingReviews.length,
                    ")"
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Stack, { spacing: 2, children: existingReviews.map((review, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Box,
                    {
                      sx: {
                        p: 2,
                        bgcolor: "rgba(255, 255, 255, 0.05)",
                        borderRadius: 2,
                        borderLeft: "3px solid rgba(124, 179, 66, 0.6)"
                      },
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", sx: { color: "#ffd600", fontWeight: 700, mb: 1 }, children: [
                          review.users?.username || review.user || "Anonymous",
                          " • ",
                          new Date(review.created_at || review.date).toLocaleDateString()
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "#fff", whiteSpace: "pre-line" }, children: review.comment || review.review }),
                        review.rating && /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", sx: { color: "#00e676", mt: 1 }, children: [
                          "⭐ Rating: ",
                          review.rating,
                          "/5"
                        ] })
                      ]
                    },
                    idx
                  )) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: {
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  mt: 3,
                  width: "100%",
                  maxWidth: "400px",
                  mx: "auto",
                  px: 2
                }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Button,
                    {
                      variant: "contained",
                      fullWidth: true,
                      onClick: /* @__PURE__ */ __name(() => {
                        if (currentUser) {
                          setShowSeedVendorFinder(true);
                        } else {
                          const strainName = match.strain?.slug || match.strain?.name;
                          window.open(`https://www.seedsman.com/en/search?q=${encodeURIComponent(strainName)}`, "_blank");
                        }
                      }, "onClick"),
                      sx: {
                        py: 2,
                        fontSize: "1rem",
                        fontWeight: 700,
                        borderRadius: "12px",
                        background: "linear-gradient(135deg, #7CB342 0%, #9CCC65 100%)",
                        boxShadow: "0 4px 12px rgba(124, 179, 66, 0.3)",
                        textTransform: "none",
                        transition: "all 0.2s ease",
                        "&:active": {
                          transform: "scale(0.98)",
                          boxShadow: "0 2px 8px rgba(124, 179, 66, 0.4)"
                        }
                      },
                      children: "🌱 Buy Seeds"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Button,
                    {
                      variant: "outlined",
                      fullWidth: true,
                      onClick: /* @__PURE__ */ __name(() => {
                        if (currentUser) {
                          setShowDispensaryFinder(true);
                        } else {
                          const strainName = match.strain?.name || match.strain?.slug;
                          window.open(`https://www.google.com/search?q=${encodeURIComponent(strainName + " cannabis dispensary near me")}`, "_blank");
                        }
                      }, "onClick"),
                      sx: {
                        py: 2,
                        fontSize: "1rem",
                        fontWeight: 700,
                        borderRadius: "12px",
                        border: "2px solid rgba(124, 179, 66, 0.6)",
                        color: "#9CCC65",
                        textTransform: "none",
                        transition: "all 0.2s ease",
                        "&:active": {
                          transform: "scale(0.98)",
                          background: "rgba(124, 179, 66, 0.15)",
                          border: "2px solid rgba(124, 179, 66, 0.8)"
                        }
                      },
                      children: "🏪 Find Dispensaries"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: {
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: { xs: 1.5, sm: 2 },
                  mt: { xs: 2, sm: 3 },
                  background: "rgba(30,30,30,0.25)",
                  backdropFilter: "blur(16px) saturate(180%)",
                  borderRadius: { xs: 3, sm: 6 },
                  px: { xs: 2, sm: 4 },
                  py: { xs: 2, sm: 3 },
                  boxShadow: "0 4px 32px 0 rgba(0,0,0,0.12)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  width: "100%"
                }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "input",
                    {
                      type: "file",
                      accept: "image/*",
                      style: { display: "none" },
                      ref: fileInputRef,
                      onChange: handleFileChange
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Button,
                    {
                      variant: "contained",
                      color: "success",
                      fullWidth: true,
                      sx: {
                        fontWeight: 700,
                        borderRadius: 999,
                        px: { xs: 3, sm: 5 },
                        py: { xs: 1.25, sm: 1.5 },
                        fontSize: { xs: "0.95rem", sm: "1.125rem" },
                        boxShadow: "none",
                        bgcolor: "rgba(124, 179, 66, 0.3)",
                        border: "2px solid rgba(124, 179, 66, 0.6)",
                        backdropFilter: "blur(10px)",
                        color: "#fff",
                        textTransform: "none",
                        maxWidth: { xs: "100%", sm: "400px" },
                        "&:hover": {
                          bgcolor: "rgba(124, 179, 66, 0.5)",
                          border: "2px solid rgba(124, 179, 66, 0.8)"
                        },
                        "&:active": {
                          transform: "scale(0.98)"
                        }
                      },
                      onClick: /* @__PURE__ */ __name(() => fileInputRef.current?.click(), "onClick"),
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { role: "img", "aria-label": "camera", style: { marginRight: 8 }, children: "📷" }),
                        "Scan Another Strain"
                      ]
                    }
                  ),
                  loading && /* @__PURE__ */ jsxRuntimeExports.jsx(CircularProgress, { color: "success", sx: { mt: { xs: 1, sm: 2 } } }),
                  scanStatus && !loading && /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { align: "center", sx: { mt: { xs: 1, sm: 2 }, color: "#00e676", fontWeight: 700, fontSize: { xs: "0.875rem", sm: "1rem" } }, children: scanStatus })
                ] }),
                match.strain?.labTestResults && match.strain.labTestResults.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { mb: 2, width: "100%" }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "subtitle2", color: "#fff", gutterBottom: true, children: "Lab Test Results:" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Stack, { spacing: 1, children: match.strain.labTestResults.map((test, idx) => /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { bgcolor: "rgba(255,255,255,0.10)", backdropFilter: "blur(6px)", borderRadius: 2, p: 1 }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", color: "#fff", children: [
                    test.date && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Date:" }),
                      " ",
                      test.date,
                      " "
                    ] }),
                    test.lab && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Lab:" }),
                      " ",
                      test.lab,
                      " "
                    ] }),
                    test.testType && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Type:" }),
                      " ",
                      test.testType,
                      " "
                    ] }),
                    typeof test.thc === "number" && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "THC:" }),
                      " ",
                      test.thc,
                      "% "
                    ] }),
                    typeof test.cbd === "number" && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "CBD:" }),
                      " ",
                      test.cbd,
                      "% "
                    ] }),
                    test.comment && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Note:" }),
                      " ",
                      test.comment
                    ] })
                  ] }) }, idx)) })
                ] }),
                match.strain?.growTips && /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { mb: 2, width: "100%" }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "subtitle2", color: "#fff", gutterBottom: true, children: "Grow Tips:" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", color: "#fff", children: match.strain.growTips })
                ] }),
                match.strain?.seedVendors && match.strain.seedVendors.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { mb: 2, width: "100%" }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "subtitle2", color: "#fff", gutterBottom: true, children: "Seed Vendors:" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Stack, { direction: "row", spacing: 1, flexWrap: "wrap", useFlexGap: true, children: match.strain.seedVendors.map((vendor, idx) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Chip,
                    {
                      label: vendor.name,
                      size: "small",
                      variant: "outlined",
                      component: "a",
                      href: vendor.url,
                      clickable: true,
                      sx: {
                        borderColor: "#7CB342",
                        color: "#9CCC65",
                        "&:hover": {
                          borderColor: "#9CCC65",
                          bgcolor: "rgba(124, 179, 66, 0.1)"
                        }
                      }
                    },
                    idx
                  )) })
                ] }),
                match.strain?.breeder && /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { mb: 2, width: "100%" }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "subtitle2", color: "#fff", gutterBottom: true, children: "Breeder:" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", color: "#fff", children: match.strain.breeder })
                ] })
              ] }),
              currentUser && /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { mt: 4 }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: {
                borderRadius: 6,
                p: 3,
                boxShadow: "none",
                border: "none"
              }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", sx: { mb: 2, color: "#fff" }, children: "Your Scan History" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Stack, { spacing: 2, children: scanHistory && Array.isArray(scanHistory) && scanHistory.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { sx: { color: "#e0e0e0" }, children: "No scans yet." }) : (scanHistory || []).map((scan, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Paper, { sx: {
                  p: 2,
                  borderRadius: 2,
                  bgcolor: "rgba(255,255,255,0.1)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(124, 179, 66, 0.3)",
                  boxShadow: "none"
                }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "#fff" }, children: scan?.status === "pending" ? "Pending scan..." : `Matched: ${scan?.strain?.name || "Unknown"}` }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "caption", sx: { color: "#e0e0e0" }, children: scan?.created })
                ] }, scan?.id || idx)) })
              ] }) }),
              result && !match && /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { mt: 3 }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "subtitle1", fontWeight: 700, children: "Raw Scan Result" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { mt: 1, p: 2, borderRadius: 4 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { style: { textAlign: "left", fontSize: 14 }, children: JSON.stringify(result, null, 2) }) })
              ] }),
              renderDetailsDialog(),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Dialog,
                {
                  open: showTopUpDialog,
                  onClose: /* @__PURE__ */ __name(() => setShowTopUpDialog(false), "onClose"),
                  maxWidth: "sm",
                  fullWidth: true,
                  fullScreen: true,
                  PaperProps: {
                    sx: {
                      bgcolor: "#111",
                      m: 0,
                      maxHeight: "100vh"
                    }
                  },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogTitle, { sx: { bgcolor: "#111", color: "#c8ff9e", fontWeight: 700, borderBottom: "1px solid rgba(124,179,66,0.3)", display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", children: "Keep Your Scans Going" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(IconButton, { onClick: /* @__PURE__ */ __name(() => setShowTopUpDialog(false), "onClick"), sx: { color: "#c8ff9e" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(CloseIcon, {}) })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { sx: { bgcolor: "#111", color: "#fff", pt: 3 }, children: [
                      topUpMessage && /* @__PURE__ */ jsxRuntimeExports.jsx(DialogContentText, { sx: { color: "#e0ffe3", mb: 2 }, children: topUpMessage }),
                      !membershipActive && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        Paper,
                        {
                          sx: {
                            p: 2,
                            mb: 3,
                            background: "linear-gradient(135deg, rgba(124,179,66,0.25), rgba(0,0,0,0.65))",
                            border: "1px solid rgba(124,179,66,0.4)",
                            borderRadius: 3
                          },
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", sx: { fontWeight: 700, color: "#c8ff9e", mb: 1 }, children: "Garden Membership · $7.99 / month" }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "#e8f5e9", mb: 1 }, children: "Unlimited monthly scan bundles, private grower community access, and priority support. Perfect if you scan often or want the full Garden experience." }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              Button,
                              {
                                variant: "contained",
                                color: "success",
                                fullWidth: true,
                                sx: { mt: 1, borderRadius: 999, textTransform: "none", fontWeight: 700 },
                                onClick: /* @__PURE__ */ __name(() => {
                                  setShowTopUpDialog(false);
                                  setShowMembershipDialog(true);
                                }, "onClick"),
                                children: "Join the Garden"
                              }
                            )
                          ]
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Divider, { sx: { borderColor: "rgba(255,255,255,0.12)", mb: 3 } }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "subtitle1", sx: { fontWeight: 700, color: "#c8ff9e", mb: 1 }, children: "Quick Top-Up Packs (3-day access window)" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "#e8f5e9", mb: 2 }, children: "Redeem on iOS or Android. Each pack reloads your credits instantly and keeps your non-member access alive for 3 more days." }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Stack, { spacing: 2, sx: { mb: 3 }, children: topUpOptions.map((pack) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        Paper,
                        {
                          sx: {
                            p: 2,
                            borderRadius: 3,
                            background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(124,179,66,0.3)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                          },
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "subtitle1", sx: { color: "#fff", fontWeight: 700 }, children: [
                                pack.credits,
                                " scans"
                              ] }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "caption", sx: { color: "#c8ff9e" }, children: "Expires 3 days after activation" })
                            ] }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              Button,
                              {
                                variant: "outlined",
                                sx: {
                                  borderColor: "rgba(200,255,158,0.7)",
                                  color: "#c8ff9e",
                                  textTransform: "none",
                                  borderRadius: 999,
                                  fontWeight: 600,
                                  "&:hover": { borderColor: "rgba(200,255,158,1)" }
                                },
                                onClick: /* @__PURE__ */ __name(() => {
                                  setAlertMsg("Checkout for scan packs happens through Apple App Store or Google Play. Launch the mobile app to complete your purchase.");
                                  setAlertOpen(true);
                                }, "onClick"),
                                children: pack.price
                              }
                            )
                          ]
                        },
                        pack.credits
                      )) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Alert,
                        {
                          severity: "info",
                          sx: {
                            bgcolor: "rgba(124, 179, 66, 0.2)",
                            color: "#e8f5e9",
                            "& .MuiAlert-icon": { color: "#c8ff9e" }
                          },
                          children: "Purchases finalize inside the Apple App Store or Google Play app. Once the store confirms your order we auto-sync credits to your account. Need a hand? Email support@strainspotter.com."
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogActions, { sx: { bgcolor: "#111", borderTop: "1px solid rgba(255,255,255,0.12)" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: /* @__PURE__ */ __name(() => setShowTopUpDialog(false), "onClick"), sx: { color: "#c8ff9e", textTransform: "none" }, children: "Close" }) })
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Dialog,
                {
                  open: showMembershipDialog,
                  onClose: /* @__PURE__ */ __name(() => setShowMembershipDialog(false), "onClose"),
                  maxWidth: "sm",
                  fullWidth: true,
                  fullScreen: true,
                  PaperProps: {
                    sx: {
                      bgcolor: "rgba(0, 0, 0, 0.95)",
                      m: 0,
                      maxHeight: "100vh"
                    }
                  },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogTitle, { sx: {
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      bgcolor: "rgba(0, 0, 0, 0.9)",
                      color: "#00e676",
                      borderBottom: "1px solid rgba(124,179,66,0.3)"
                    }, children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", sx: { fontWeight: 700 }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { component: "img", src: "/hero.png?v=13", alt: "", sx: { width: 18, height: 18, filter: "drop-shadow(0 0 4px rgba(124, 179, 66, 0.6))" } }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Garden Membership Access" })
                      ] }) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        IconButton,
                        {
                          onClick: /* @__PURE__ */ __name(() => setShowMembershipDialog(false), "onClick"),
                          sx: { color: "#fff" },
                          children: /* @__PURE__ */ jsxRuntimeExports.jsx(CloseIcon, {})
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { sx: { bgcolor: "rgba(0, 0, 0, 0.9)", color: "#fff", pt: 3 }, children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body1", sx: { mb: 3 }, children: "Membership unlocks unlimited scan refills, in-depth strain tools, and the private grower community. Join the StrainSpotter Garden to:" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { component: "ul", sx: { pl: 3, mb: 3 }, children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Access unlimited AI scan bundles every month" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Unlock reviews, ratings, and premium strain breakdowns" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Connect with certified growers in members-only chats" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Get early access to new cultivation features" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Support the AI lab that keeps strain matching sharp" })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(MembershipLogin, { onSuccess: /* @__PURE__ */ __name(() => {
                        setShowMembershipDialog(false);
                        setAlertMsg("Welcome to the Garden! Membership perks are now active.");
                        setAlertOpen(true);
                        loadCredits();
                      }, "onSuccess") })
                    ] })
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Snackbar,
                {
                  open: alertOpen,
                  autoHideDuration: 4e3,
                  onClose: /* @__PURE__ */ __name(() => setAlertOpen(false), "onClose"),
                  message: alertMsg,
                  anchorOrigin: { vertical: "top", horizontal: "center" }
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { title: "Send Feedback", placement: "left", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                Fab,
                {
                  color: "primary",
                  onClick: /* @__PURE__ */ __name(() => setShowFeedback(true), "onClick"),
                  sx: {
                    position: "fixed",
                    bottom: 24,
                    right: 24,
                    zIndex: 1e3,
                    background: "linear-gradient(135deg, #7CB342 0%, #9CCC65 100%)",
                    boxShadow: "0 8px 30px rgba(124, 179, 66, 0.4)",
                    "&:hover": {
                      background: "linear-gradient(135deg, #9CCC65 0%, #7CB342 100%)",
                      boxShadow: "0 12px 40px rgba(124, 179, 66, 0.6)",
                      transform: "scale(1.05)"
                    }
                  },
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(FeedbackIcon, {})
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                FeedbackModal,
                {
                  open: showFeedback,
                  onClose: /* @__PURE__ */ __name(() => setShowFeedback(false), "onClose"),
                  user: currentUser
                }
              )
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Box,
          {
            sx: {
              position: "sticky",
              bottom: 0,
              zIndex: 20,
              background: "linear-gradient(to top, rgba(3,10,3,0.95), rgba(3,10,3,0.4))",
              pt: 1,
              pb: "calc(env(safe-area-inset-bottom) + 8px)",
              px: 2,
              flexShrink: 0
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "file",
                  accept: "image/*",
                  style: { display: "none" },
                  ref: fileInputRef,
                  onChange: handleFileChange
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  fullWidth: true,
                  variant: "contained",
                  size: "large",
                  onClick: /* @__PURE__ */ __name(() => {
                    if (isOutOfScans) {
                      const message = starterExpired ? "Your starter access window has ended. Join the Garden membership or purchase a top-up pack within 3 days to keep scanning." : "You are out of scan credits. Join the Garden or purchase a top-up pack to continue scanning.";
                      setAlertMsg(message);
                      setAlertOpen(true);
                      setTopUpMessage(message);
                      setShowTopUpDialog(true);
                      return;
                    }
                    fileInputRef.current?.click();
                  }, "onClick"),
                  disabled: isOutOfScans || loading,
                  sx: {
                    borderRadius: 999,
                    py: 1.4,
                    fontWeight: 600,
                    textTransform: "none",
                    mb: 1
                  },
                  children: loading ? "Scanning…" : primaryLabel
                }
              ),
              !isOutOfScans && !isFounder && typeof remainingScans === "number" && remainingScans > 0 && remainingScans !== Infinity && /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", sx: { mt: 1, textAlign: "center", color: "#c8ff9e", opacity: 0.9 }, children: [
                remainingScans,
                " scan",
                remainingScans === 1 ? "" : "s",
                " remaining"
              ] })
            ]
          }
        )
      ]
    }
  ) });
}
__name(ScanWizard, "ScanWizard");
const ScanWizard$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: ScanWizard
}, Symbol.toStringTag, { value: "Module" }));
export {
  DispensaryFinder as D,
  FeedbackModal as F,
  ScanWizard as S,
  ScanWizard$1 as a
};
