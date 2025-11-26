var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { r as reactExports, j as jsxRuntimeExports, C as Container, i as Button, B as Box, T as Typography, av as LinearProgress, f as Card, h as CardContent, A as Alert, S as Stack, H as Chip, D as Dialog, p as DialogTitle, q as DialogContent, m as TextField, u as DialogActions } from "./react-vendor-DaVUs1pH.js";
import { a as API_BASE, s as supabase } from "./App-BxlAc3TE.js";
import "./vendor-qR99EfKL.js";
function MembershipJoin() {
  const [strainStats, setStrainStats] = reactExports.useState({ count: null, lastUpdated: null });
  reactExports.useEffect(() => {
    (async () => {
      try {
        const [countRes, updatedRes] = await Promise.all([
          fetch(`${API_BASE}/api/strains/count`),
          fetch(`${API_BASE}/api/strains/last-updated`)
        ]);
        const countData = await countRes.json();
        const updatedData = await updatedRes.json();
        setStrainStats({
          count: countData.count,
          lastUpdated: updatedData.lastUpdated ? new Date(updatedData.lastUpdated) : null
        });
      } catch {
      }
    })();
  }, []);
  const [showLogin, setShowLogin] = reactExports.useState(false);
  const [loginEmail, setLoginEmail] = reactExports.useState("");
  const [loginPassword, setLoginPassword] = reactExports.useState("");
  const [loginError, setLoginError] = reactExports.useState(null);
  const [user, setUser] = reactExports.useState(null);
  const [status, setStatus] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  const [applying, setApplying] = reactExports.useState(false);
  const [showForm, setShowForm] = reactExports.useState(false);
  const [formData, setFormData] = reactExports.useState({
    email: "",
    full_name: "",
    phone: "",
    message: ""
  });
  const [error, setError] = reactExports.useState(null);
  const [success, setSuccess] = reactExports.useState(null);
  const [pricingPackages, setPricingPackages] = reactExports.useState([]);
  const [pricingRole, setPricingRole] = reactExports.useState(null);
  const [pricingLoading, setPricingLoading] = reactExports.useState(true);
  const [pricingError, setPricingError] = reactExports.useState(null);
  const getSessionId = reactExports.useCallback(() => {
    let sid = localStorage.getItem("ss-session-id");
    if (!sid) {
      sid = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("ss-session-id", sid);
    }
    return sid;
  }, []);
  const loadStatus = reactExports.useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/membership/status`, {
        headers: { "x-session-id": getSessionId() }
      });
      if (res.ok) {
        setStatus(await res.json());
      }
    } catch (e) {
      console.error("Failed to load status:", e);
    } finally {
      setLoading(false);
    }
  }, [getSessionId]);
  reactExports.useEffect(() => {
    loadStatus();
  }, [loadStatus]);
  reactExports.useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/credits/packages`);
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Unable to load pricing");
        }
        setPricingPackages(Array.isArray(data.packages) ? data.packages : []);
        setPricingRole(data.role || null);
      } catch (e) {
        console.error("Pricing load error:", e);
        setPricingError(e.message || "Failed to load pricing");
      } finally {
        setPricingLoading(false);
      }
    })();
  }, []);
  const handleLogin = /* @__PURE__ */ __name(async () => {
    setLoginError(null);
    if (!loginEmail || !loginPassword) {
      setLoginError("Please enter both email and password.");
      return;
    }
    try {
      const { error: error2 } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
      if (error2) {
        setLoginError(error2.message);
        return;
      }
      setShowLogin(false);
    } catch (error2) {
      console.error("Supabase login failed:", error2);
      setLoginError("Login failed. Please try again.");
    }
  }, "handleLogin");
  reactExports.useEffect(() => {
    let listener;
    const getSession = /* @__PURE__ */ __name(async () => {
      const sessionObj = await supabase.auth.getSession?.();
      if (sessionObj?.data?.session?.user) setUser(sessionObj.data.session.user);
    }, "getSession");
    getSession();
    listener = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => {
      listener?.data?.unsubscribe && listener.data.unsubscribe();
    };
  }, []);
  if (user) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(Container, { maxWidth: "md", sx: { py: 4 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          onClick: /* @__PURE__ */ __name(() => window.location.href = "/", "onClick"),
          variant: "contained",
          sx: { position: "absolute", top: 16, left: 16, bgcolor: "#388e3c", color: "white", fontWeight: 700, borderRadius: 999, boxShadow: "0 2px 8px 0 rgba(46,125,50,0.18)", zIndex: 10, textTransform: "none", px: 3, py: 1 },
          children: "Home"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { mt: 8, textAlign: "center" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "h4", sx: { fontWeight: 700, color: "#2e7d32", mb: 2 }, children: [
          "Welcome, ",
          user.email,
          "!"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body1", sx: { color: "#388e3c", mb: 2 }, children: "You are now logged in and have full access to all features." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "contained", color: "error", sx: { borderRadius: 999, px: 4, py: 1, fontWeight: 600 }, onClick: /* @__PURE__ */ __name(async () => {
          await supabase.auth.signOut();
          setUser(null);
        }, "onClick"), children: "Logout" })
      ] })
    ] });
  }
  const handleSubmit = /* @__PURE__ */ __name(async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setApplying(true);
    try {
      const res = await fetch(`${API_BASE}/api/membership/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Application failed");
        return;
      }
      setSuccess("Application submitted! We will review and be in touch via email within 24-48 hours. Thank you!");
      setShowForm(false);
      setFormData({ email: "", full_name: "", phone: "", message: "" });
    } catch (e2) {
      console.error("Membership apply error:", e2);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setApplying(false);
    }
  }, "handleSubmit");
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Container, { maxWidth: "md", sx: { py: 4 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(LinearProgress, {}) });
  }
  const appUnlockPackage = pricingPackages.find((pkg) => pkg.type === "app_purchase");
  const membershipPackage = pricingPackages.find((pkg) => pkg.type === "membership");
  const topUpPackages = pricingPackages.filter((pkg) => pkg.type === "top_up");
  const priceLabel = /* @__PURE__ */ __name((pkg) => pkg ? `$${pkg.effectivePrice.toFixed(2)}` : "", "priceLabel");
  const perScanLabel = /* @__PURE__ */ __name((pkg) => {
    if (!pkg?.credits) return "";
    const cost = pkg.effectivePrice / pkg.credits;
    if (cost < 1) return `${(cost * 100).toFixed(1)}¢ per scan`;
    return `$${cost.toFixed(2)} per scan`;
  }, "perScanLabel");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Container, { maxWidth: "md", sx: { py: 4, position: "relative" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Button,
      {
        onClick: /* @__PURE__ */ __name(() => window.location.href = "/", "onClick"),
        variant: "contained",
        sx: {
          position: "absolute",
          top: 16,
          left: 16,
          bgcolor: "#388e3c",
          color: "white",
          fontWeight: 700,
          borderRadius: 999,
          boxShadow: "0 2px 8px 0 rgba(46,125,50,0.18)",
          zIndex: 10,
          textTransform: "none",
          px: 3,
          py: 1
        },
        children: "Home"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { mb: 2, display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column", opacity: 0.95 }, children: [
      strainStats.count !== null && /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", sx: { fontWeight: 600, color: "#388e3c", textAlign: "center", fontSize: "1rem", mb: 0.5 }, children: [
        "Over ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontWeight: 800 }, children: strainStats.count.toLocaleString() }),
        " strains in our database"
      ] }),
      strainStats.lastUpdated && /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "caption", sx: { color: "#388e3c", textAlign: "center" }, children: [
        "Updated ",
        strainStats.lastUpdated.toLocaleDateString(void 0, { month: "short", day: "numeric", year: "numeric" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h4", sx: { mb: 3, fontWeight: 700, color: "#2e7d32", textShadow: "0 2px 12px rgba(46,125,50,0.2)" }, children: "Welcome to StrainSpotter Membership" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { sx: { mb: 3, borderRadius: 3, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(56,142,60,0.18)", backdropFilter: "blur(8px)" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", sx: { color: "#388e3c", mb: 1 }, children: "Simple Pricing" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", color: "text.secondary", sx: { mb: 2 }, children: "One-time unlock for the first 20 scans, then $4.99/month for 200 scans + optional top-ups (50 / 200 / 500)." }),
      pricingLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(LinearProgress, {}) : pricingError ? /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { severity: "warning", children: pricingError }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: { xs: "column", sm: "row" }, spacing: 2, sx: { mb: 2 }, children: [
          appUnlockPackage && /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { variant: "outlined", sx: { flex: 1, borderColor: "rgba(56,142,60,0.25)" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "subtitle2", color: "text.secondary", children: "Step 1" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", sx: { color: "#2e7d32", mb: 1 }, children: "Unlock the App" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h4", sx: { fontWeight: 700, color: "#1b5e20" }, children: priceLabel(appUnlockPackage) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", color: "text.secondary", children: "20 scans included. Unlock Groups, Grow Coach, and The Garden forever." })
          ] }) }),
          membershipPackage && /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { variant: "outlined", sx: { flex: 1, borderColor: "rgba(56,142,60,0.25)" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "subtitle2", color: "text.secondary", children: "Step 2" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", sx: { color: "#2e7d32", mb: 1 }, children: "Monthly Member" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "h4", sx: { fontWeight: 700, color: "#1b5e20" }, children: [
              priceLabel(membershipPackage),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { component: "span", variant: "body2", color: "text.secondary", children: "/month" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", color: "text.secondary", children: "200 AI scans each month + priority support. Cancel anytime." }),
            pricingRole === "moderator" && membershipPackage.moderatorDiscount && /* @__PURE__ */ jsxRuntimeExports.jsx(Chip, { label: `${membershipPackage.moderatorDiscount.percent}% moderator discount`, size: "small", color: "success", sx: { mt: 1 } })
          ] }) })
        ] }),
        topUpPackages.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 1, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "subtitle2", color: "text.secondary", children: "Need more scans?" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Stack, { direction: { xs: "column", sm: "row" }, spacing: 1, children: topUpPackages.map((pkg) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            Chip,
            {
              label: `${pkg.credits} scans • ${priceLabel(pkg)} • ${perScanLabel(pkg)}`,
              variant: "outlined",
              sx: { borderColor: "rgba(56,142,60,0.4)" }
            },
            pkg.id
          )) })
        ] })
      ] })
    ] }) }),
    status?.isMember ? /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: {
      mt: 3,
      p: 4,
      borderRadius: 4,
      background: "rgba(255,255,255,0.15)",
      boxShadow: "0 8px 32px 0 rgba(46,125,50,0.25)",
      backdropFilter: "blur(12px)",
      border: "1px solid rgba(56,142,60,0.25)",
      color: "#2e7d32",
      fontWeight: 600
    }, children: "You're an active member! Enjoy unlimited access to all features." }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { sx: {
      mb: 3,
      borderRadius: 4,
      background: "rgba(255,255,255,0.10)",
      boxShadow: "0 8px 32px 0 rgba(46,125,50,0.18)",
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(56,142,60,0.18)",
      color: "#388e3c"
    }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", sx: { mb: 2, color: "#388e3c" }, children: "Basic Access" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: {
        background: "rgba(255,255,255,0.10)",
        borderRadius: 2,
        p: 2,
        color: "#388e3c",
        fontWeight: 500,
        boxShadow: "0 2px 8px 0 rgba(46,125,50,0.10)",
        border: "1px solid rgba(56,142,60,0.10)"
      }, children: [
        "You have access to the scanner and results.",
        /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
        /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Unlock Full Access:" }),
        " ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
        /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { style: { margin: "8px 0 0 16px", color: "#388e3c" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Sign up for membership to enjoy exclusive strain data, grow guides, chat/groups, dispensary/grower access, and more." }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "contained", sx: { mt: 2, bgcolor: "#388e3c", color: "white", fontWeight: 700, borderRadius: 2, boxShadow: "0 2px 8px 0 rgba(46,125,50,0.18)" }, onClick: /* @__PURE__ */ __name(() => setShowForm(true), "onClick"), children: "Join Now" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outlined", sx: { mt: 2, ml: 2, borderRadius: 2, fontWeight: 700 }, onClick: /* @__PURE__ */ __name(() => setShowLogin(true), "onClick"), children: "Login to Unlock Full Access" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open: showLogin, onClose: /* @__PURE__ */ __name(() => setShowLogin(false), "onClose"), children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Login" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 2, sx: { pt: 1 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "contained", color: "primary", sx: { borderRadius: 999, px: 4, py: 1, fontWeight: 600 }, onClick: /* @__PURE__ */ __name(async () => {
          const { error: error2 } = await supabase.auth.signInWithOAuth({ provider: "google" });
          if (error2) setLoginError("Google login failed: " + error2.message);
        }, "onClick"), children: "Login with Google" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "contained", color: "secondary", sx: { borderRadius: 999, px: 4, py: 1, fontWeight: 600 }, onClick: /* @__PURE__ */ __name(async () => {
          const { error: error2 } = await supabase.auth.signInWithOAuth({ provider: "apple" });
          if (error2) setLoginError("Apple login failed: " + error2.message);
        }, "onClick"), children: "Login with Apple" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: /* @__PURE__ */ __name((e) => {
          e.preventDefault();
          handleLogin();
        }, "onSubmit"), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            TextField,
            {
              label: "Email",
              type: "email",
              value: loginEmail,
              onChange: /* @__PURE__ */ __name((e) => setLoginEmail(e.target.value), "onChange"),
              fullWidth: true,
              autoFocus: true,
              sx: { mt: 1 },
              required: true
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            TextField,
            {
              label: "Password",
              type: "password",
              value: loginPassword,
              onChange: /* @__PURE__ */ __name((e) => setLoginPassword(e.target.value), "onChange"),
              fullWidth: true,
              sx: { mt: 2 },
              required: true
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", variant: "outlined", sx: { mt: 2, borderRadius: 999, px: 3, py: 1, fontWeight: 600 }, children: "Login with Email" })
        ] }),
        loginError && /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { severity: "error", sx: { mt: 2 }, children: loginError })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogActions, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: /* @__PURE__ */ __name(() => setShowLogin(false), "onClick"), children: "Cancel" }) })
    ] }),
    error && /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { severity: "error", sx: { mt: 2 }, onClose: /* @__PURE__ */ __name(() => setError(null), "onClose"), children: error }),
    success && /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { severity: "success", sx: { mt: 2 }, onClose: /* @__PURE__ */ __name(() => setSuccess(null), "onClose"), children: success }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: showForm, onClose: /* @__PURE__ */ __name(() => setShowForm(false), "onClose"), maxWidth: "sm", fullWidth: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Membership Application" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 2, sx: { pt: 1 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          TextField,
          {
            label: "Email",
            type: "email",
            required: true,
            fullWidth: true,
            value: formData.email,
            onChange: /* @__PURE__ */ __name((e) => setFormData({ ...formData, email: e.target.value }), "onChange")
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          TextField,
          {
            label: "Full Name",
            required: true,
            fullWidth: true,
            value: formData.full_name,
            onChange: /* @__PURE__ */ __name((e) => setFormData({ ...formData, full_name: e.target.value }), "onChange")
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          TextField,
          {
            label: "Phone (optional)",
            fullWidth: true,
            value: formData.phone,
            onChange: /* @__PURE__ */ __name((e) => setFormData({ ...formData, phone: e.target.value }), "onChange")
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          TextField,
          {
            label: "Message (optional)",
            multiline: true,
            rows: 3,
            fullWidth: true,
            value: formData.message,
            onChange: /* @__PURE__ */ __name((e) => setFormData({ ...formData, message: e.target.value }), "onChange"),
            placeholder: "Tell us why you want to join..."
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { severity: "info", children: "After submitting, our team will review your application and contact you with payment instructions." })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogActions, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: /* @__PURE__ */ __name(() => setShowForm(false), "onClick"), disabled: applying, children: "Cancel" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", variant: "contained", disabled: applying, children: applying ? "Submitting..." : "Submit Application" })
      ] })
    ] }) })
  ] });
}
__name(MembershipJoin, "MembershipJoin");
export {
  MembershipJoin as default
};
