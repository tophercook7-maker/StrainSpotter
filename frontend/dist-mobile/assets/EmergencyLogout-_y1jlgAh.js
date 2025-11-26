var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { r as reactExports, j as jsxRuntimeExports, B as Box, P as Paper, bk as LogoutIcon, T as Typography, i as Button } from "./react-vendor-DaVUs1pH.js";
import { s as supabase } from "./App-BxlAc3TE.js";
import "./vendor-qR99EfKL.js";
function EmergencyLogout() {
  const [loading, setLoading] = reactExports.useState(false);
  const [message, setMessage] = reactExports.useState("");
  const handleEmergencyLogout = /* @__PURE__ */ __name(async () => {
    setLoading(true);
    setMessage("Logging out...");
    try {
      await supabase.auth.signOut();
      setMessage("✅ Logged out successfully!");
      setTimeout(() => {
        window.location.href = "/";
      }, 1e3);
    } catch (error) {
      console.error("Emergency logout error:", error);
      setMessage("❌ Logout failed: " + error.message);
    } finally {
      setLoading(false);
    }
  }, "handleEmergencyLogout");
  const handleFullReset = /* @__PURE__ */ __name(async () => {
    setLoading(true);
    setMessage("Performing full reset...");
    try {
      await supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
      setMessage("✅ Full reset complete! Redirecting...");
      setTimeout(() => {
        window.location.href = "/";
      }, 1e3);
    } catch (error) {
      console.error("Full reset error:", error);
      setMessage("❌ Reset failed: " + error.message);
    } finally {
      setLoading(false);
    }
  }, "handleFullReset");
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Box,
    {
      sx: {
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
        p: 2
      },
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Paper,
        {
          elevation: 8,
          sx: {
            p: 4,
            maxWidth: 500,
            width: "100%",
            background: "linear-gradient(135deg, rgba(255, 82, 82, 0.1) 0%, rgba(255, 107, 107, 0.1) 100%)",
            border: "2px solid #ff5252",
            borderRadius: 3
          },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { textAlign: "center", mb: 3 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(LogoutIcon, { sx: { fontSize: 64, color: "#ff5252", mb: 2 } }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h4", sx: { color: "#fff", fontWeight: 700, mb: 1 }, children: "Emergency Logout" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "rgba(255, 255, 255, 0.7)", mb: 2 }, children: "This will log you out immediately, bypassing all membership checks." }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "caption", sx: { color: "rgba(255, 255, 255, 0.5)" }, children: 'Use "Full Reset" to also clear age verification and see the age gate again.' })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "contained",
                fullWidth: true,
                size: "large",
                onClick: handleEmergencyLogout,
                disabled: loading,
                startIcon: /* @__PURE__ */ jsxRuntimeExports.jsx(LogoutIcon, {}),
                sx: {
                  bgcolor: "#ff5252",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "1.1rem",
                  py: 1.5,
                  mb: 2,
                  "&:hover": {
                    bgcolor: "#ff1744"
                  },
                  "&:disabled": {
                    bgcolor: "#666",
                    color: "#999"
                  }
                },
                children: loading ? "Logging Out..." : "Force Logout Now"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "outlined",
                fullWidth: true,
                size: "large",
                onClick: handleFullReset,
                disabled: loading,
                sx: {
                  borderColor: "#ff9800",
                  color: "#ff9800",
                  fontWeight: 700,
                  fontSize: "1rem",
                  py: 1.5,
                  "&:hover": {
                    borderColor: "#f57c00",
                    bgcolor: "rgba(255, 152, 0, 0.1)"
                  },
                  "&:disabled": {
                    borderColor: "#666",
                    color: "#999"
                  }
                },
                children: loading ? "Resetting..." : "Full Reset (Clear Age Gate Too)"
              }
            ),
            message && /* @__PURE__ */ jsxRuntimeExports.jsx(
              Typography,
              {
                variant: "body1",
                sx: {
                  mt: 3,
                  p: 2,
                  bgcolor: "rgba(0, 0, 0, 0.3)",
                  borderRadius: 2,
                  color: "#fff",
                  textAlign: "center",
                  fontWeight: 600
                },
                children: message
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { mt: 3, textAlign: "center" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "caption", sx: { color: "rgba(255, 255, 255, 0.5)" }, children: "This is a developer tool for emergency logout situations." }) })
          ]
        }
      )
    }
  );
}
__name(EmergencyLogout, "EmergencyLogout");
export {
  EmergencyLogout as default
};
