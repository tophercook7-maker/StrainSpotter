var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { r as reactExports, j as jsxRuntimeExports, C as Container, i as Button, S as Stack, T as Typography, A as Alert, f as Card, h as CardContent, H as Chip, Z as Divider, B as Box } from "./react-vendor-DaVUs1pH.js";
import { s as supabase, a as API_BASE } from "./App-BxlAc3TE.js";
import "./vendor-qR99EfKL.js";
function ErrorViewer({ onBack }) {
  const [errors, setErrors] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [message, setMessage] = reactExports.useState("");
  const loadErrors = /* @__PURE__ */ __name(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setMessage("Sign in as an admin to view recent errors.");
        setErrors([]);
        return;
      }
      const resp = await fetch(`${API_BASE}/api/admin/errors/recent?limit=100`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (!resp.ok) {
        const text = await resp.text();
        setMessage(text || "Failed to load errors");
        setErrors([]);
        return;
      }
      const data = await resp.json();
      setErrors(data.errors || []);
      setMessage(data.message || "");
    } catch (e) {
      setMessage(`Connection error: ${e.message}`);
      setErrors([]);
    } finally {
      setLoading(false);
    }
  }, "loadErrors");
  reactExports.useEffect(() => {
    loadErrors();
  }, []);
  const getStatusColor = /* @__PURE__ */ __name((status) => {
    if (status >= 500) return "error";
    if (status >= 400) return "warning";
    return "default";
  }, "getStatusColor");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Container, { maxWidth: "lg", sx: { py: 4 }, children: [
    onBack && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: onBack, size: "small", variant: "contained", sx: { bgcolor: "white", color: "black", textTransform: "none", fontWeight: 700, borderRadius: 999, mb: 1, "&:hover": { bgcolor: "grey.100" } }, children: "Home" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", justifyContent: "space-between", alignItems: "center", sx: { mb: 3 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h4", fontWeight: "bold", children: "🚨 Error Logs" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "contained", onClick: loadErrors, disabled: loading, children: "Refresh" })
    ] }),
    message && /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { severity: "info", sx: { mb: 3 }, children: message }),
    loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { children: "Loading..." }) : errors.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { severity: "success", children: "✅ No recent errors! Everything is running smoothly." }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Stack, { spacing: 2, children: errors.map((err, idx) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      Card,
      {
        sx: {
          bgcolor: (err.status_code || 0) >= 500 ? "rgba(211, 47, 47, 0.05)" : "rgba(255, 152, 0, 0.05)",
          border: `1px solid ${(err.status_code || 0) >= 500 ? "#d32f2f44" : "#ff980044"}`
        },
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", spacing: 2, alignItems: "center", sx: { mb: 2 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Chip,
              {
                label: `${err.status_code ?? "n/a"}`,
                color: getStatusColor(err.status_code ?? 0),
                size: "small"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Chip,
              {
                label: err.method || "SERVER",
                variant: "outlined",
                size: "small"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "caption", color: "text.secondary", children: new Date(err.created_at).toLocaleString() }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "caption", color: "text.secondary", sx: { ml: "auto" }, children: [
              "User: ",
              err.user_id || "n/a"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", fontWeight: "bold", sx: { mb: 1 }, children: [
            "Endpoint: ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("code", { children: err.path })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body1", color: "error.main", sx: { mb: 2 }, children: [
            "❌ ",
            err.message
          ] }),
          err.context?.client && /* @__PURE__ */ jsxRuntimeExports.jsxs(Alert, { severity: "info", sx: { mb: 2 }, children: [
            "Client crash on ",
            err.context.client.currentView || err.context.client.location || "unknown view",
            /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
            err.context.client.userAgent
          ] }),
          err.stack && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Divider, { sx: { my: 2 } }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "caption", color: "text.secondary", sx: { mb: 1, display: "block" }, children: "Stack Trace:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Box,
              {
                component: "pre",
                sx: {
                  bgcolor: "rgba(0,0,0,0.05)",
                  p: 2,
                  borderRadius: 1,
                  fontSize: "0.75rem",
                  overflow: "auto",
                  maxHeight: 200
                },
                children: err.stack
              }
            )
          ] })
        ] })
      },
      idx
    )) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Alert, { severity: "info", sx: { mt: 4 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", fontWeight: "bold", sx: { mb: 1 }, children: "💡 How to view full logs:" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", component: "div", children: [
        "• ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "PM2 logs:" }),
        " ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("code", { children: "pm2 logs strainspotter-backend" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", component: "div", children: [
        "• ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "PM2 errors only:" }),
        " ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("code", { children: "pm2 logs strainspotter-backend --err" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", component: "div", children: [
        "• ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "PM2 flush logs:" }),
        " ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("code", { children: "pm2 flush" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", component: "div", sx: { mt: 1 }, children: [
        "• ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Browser console:" }),
        " Open DevTools (F12) → Console tab to see frontend errors"
      ] })
    ] })
  ] });
}
__name(ErrorViewer, "ErrorViewer");
export {
  ErrorViewer as default
};
