var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { r as reactExports, j as jsxRuntimeExports, B as Box, C as Container, S as Stack, y as ArrowBackIcon, T as Typography, i as Button, n as CircularProgress, A as Alert, a2 as CameraAltIcon, f as Card, h as CardContent, D as Dialog, p as DialogTitle, L as LocalFloristIcon, ai as CloseIcon, q as DialogContent, u as DialogActions } from "./react-vendor-DaVUs1pH.js";
import { s as supabase, a as API_BASE, C as CannabisLeafIcon } from "./App-BxlAc3TE.js";
import { E as EmptyStateCard } from "./EmptyStateCard-BPZgdi7J.js";
import { b as useNavigate } from "./router-vendor-CizxVMW3.js";
import "./vendor-qR99EfKL.js";
function ScanHistory({ onBack, onSelectScan }) {
  const navigate = useNavigate();
  const [scans, setScans] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [error, setError] = reactExports.useState(null);
  const [selectedScan, setSelectedScan] = reactExports.useState(null);
  const [strainDetails, setStrainDetails] = reactExports.useState(null);
  const [loadingDetails, setLoadingDetails] = reactExports.useState(false);
  const fetchScans = reactExports.useCallback(async () => {
    try {
      setLoading(true);
      let userId = null;
      try {
        const session = await supabase?.auth.getSession();
        userId = session?.data?.session?.user?.id || null;
      } catch (sessionError) {
        console.debug("[ScanHistory] getSession failed", sessionError);
      }
      const url = userId ? `${API_BASE}/api/scans?user_id=${encodeURIComponent(userId)}` : `${API_BASE}/api/scans`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch scans");
      const data = await response.json();
      setScans(data.scans || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  reactExports.useEffect(() => {
    fetchScans();
  }, [fetchScans]);
  const handleViewStrain = /* @__PURE__ */ __name(async (scan) => {
    if (onSelectScan && typeof onSelectScan === "function") {
      onSelectScan(scan);
      return;
    }
    if (!scan.matched_strain_slug) return;
    setSelectedScan(scan);
    setLoadingDetails(true);
    try {
      const response = await fetch(`${API_BASE}/api/strains/${scan.matched_strain_slug}`);
      if (response.ok) {
        const data = await response.json();
        setStrainDetails(data);
      } else {
        setStrainDetails(null);
      }
    } catch (err) {
      console.error("Failed to load strain details:", err);
      setStrainDetails(null);
    } finally {
      setLoadingDetails(false);
    }
  }, "handleViewStrain");
  const handleCloseDialog = /* @__PURE__ */ __name(() => {
    setSelectedScan(null);
    setStrainDetails(null);
  }, "handleCloseDialog");
  const isCapacitor = typeof window !== "undefined" && (window.Capacitor || window.location.protocol === "capacitor:" || /iPhone|iPad|iPod|Android/i.test(window.navigator.userAgent));
  const GARDEN_TOP_PAD = isCapacitor ? "calc(env(safe-area-inset-top) + 20px)" : "20px";
  const handleBack = /* @__PURE__ */ __name(() => {
    if (onBack) {
      onBack();
    } else if (navigate) {
      navigate("/garden");
    } else {
      window.history.back();
    }
  }, "handleBack");
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
              pt: GARDEN_TOP_PAD,
              px: 2,
              pb: 1,
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              bgcolor: "transparent",
              backdropFilter: "blur(10px)",
              zIndex: 1
            },
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(Container, { maxWidth: "md", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", justifyContent: "space-between", alignItems: "center", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", spacing: 1, alignItems: "center", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  IconButton,
                  {
                    edge: "start",
                    onClick: handleBack,
                    sx: { color: "#fff", mr: 1 },
                    "aria-label": "Go back",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowBackIcon, {})
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(CannabisLeafIcon, { style: { height: 28, color: "#7cb342" } }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h5", fontWeight: 700, sx: { color: "#fff" }, children: "Scan History" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Stack, { direction: "row", spacing: 1, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  variant: "contained",
                  color: "success",
                  startIcon: /* @__PURE__ */ jsxRuntimeExports.jsx(CannabisLeafIcon, { style: { height: 20 } }),
                  onClick: /* @__PURE__ */ __name(() => navigate("/garden"), "onClick"),
                  sx: { textTransform: "none" },
                  children: "Garden"
                }
              ) })
            ] }) })
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
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Container, { maxWidth: "md", sx: { py: 4 }, children: [
              loading && /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { display: "flex", justifyContent: "center", py: 6 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(CircularProgress, {}) }),
              !loading && error && /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { severity: "error", sx: { mb: 3 }, children: error }),
              !loading && !error && scans.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
                EmptyStateCard,
                {
                  title: "No scans yet",
                  description: "Upload your first bud photo to see AI matches and build your history.",
                  icon: /* @__PURE__ */ jsxRuntimeExports.jsx(CameraAltIcon, { sx: { fontSize: 56, color: "#7cb342" } }),
                  actionLabel: "Start a scan",
                  onAction: /* @__PURE__ */ __name(() => window.dispatchEvent(new CustomEvent("nav:set-view", { detail: "scanner" })), "onAction"),
                  secondaryActionLabel: "Back to home",
                  onSecondaryAction: onBack
                }
              ),
              !loading && !error && scans.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(Stack, { spacing: 2, children: scans.map((scan) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                Card,
                {
                  variant: "outlined",
                  sx: { borderRadius: 3, background: "rgba(255,255,255,0.08)" },
                  children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", justifyContent: "space-between", alignItems: "center", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", fontWeight: 600, children: scan.matched_strain_name || "Unknown Strain" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", color: "text.secondary", children: [
                          "Scanned on ",
                          new Date(scan.created_at).toLocaleString()
                        ] })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Stack, { direction: "row", spacing: 1, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Button,
                        {
                          size: "small",
                          variant: "contained",
                          color: "success",
                          onClick: /* @__PURE__ */ __name(() => handleViewStrain(scan), "onClick"),
                          disabled: !scan.matched_strain_slug,
                          children: "View Details"
                        }
                      ) })
                    ] }),
                    scan.notes && /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { mt: 1 }, children: scan.notes })
                  ] })
                },
                scan.id
              )) })
            ] })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Dialog,
          {
            open: Boolean(selectedScan),
            onClose: handleCloseDialog,
            maxWidth: "sm",
            fullWidth: true,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", justifyContent: "space-between", alignItems: "center", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(LocalFloristIcon, { color: "success" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", fontWeight: 600, children: "Strain Details" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    onClick: handleCloseDialog,
                    size: "small",
                    color: "inherit",
                    startIcon: /* @__PURE__ */ jsxRuntimeExports.jsx(CloseIcon, { fontSize: "small" }),
                    children: "Close"
                  }
                )
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { dividers: true, children: [
                loadingDetails && /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { display: "flex", justifyContent: "center", py: 4 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(CircularProgress, {}) }),
                !loadingDetails && strainDetails && /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 2, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", children: strainDetails.name }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", color: "text.secondary", children: strainDetails.description || "No description available." }),
                  Array.isArray(strainDetails.effects) && strainDetails.effects.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "subtitle2", gutterBottom: true, children: "Effects" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", children: strainDetails.effects.join(", ") })
                  ] }),
                  Array.isArray(strainDetails.flavors) && strainDetails.flavors.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "subtitle2", gutterBottom: true, children: "Flavors" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", children: strainDetails.flavors.join(", ") })
                  ] })
                ] }),
                !loadingDetails && !strainDetails && /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { severity: "info", children: "Strain details not available." })
              ] }),
              selectedScan && /* @__PURE__ */ jsxRuntimeExports.jsx(DialogActions, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "caption", color: "text.secondary", sx: { px: 2, pb: 1 }, children: [
                "Scan ID: ",
                selectedScan.id
              ] }) })
            ]
          }
        )
      ]
    }
  );
}
__name(ScanHistory, "ScanHistory");
export {
  ScanHistory as default
};
