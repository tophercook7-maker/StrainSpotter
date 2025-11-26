var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { r as reactExports, j as jsxRuntimeExports, B as Box, n as CircularProgress, P as Paper, T as Typography, i as Button, S as Stack, A as Alert, m as TextField, y as ArrowBackIcon, z as RateReviewIcon, k as Tabs, l as Tab, D as Dialog, p as DialogTitle, I as IconButton, q as DialogContent, E as Rating, u as DialogActions, f as Card, h as CardContent, H as Chip, J as EditIcon, K as DeleteIcon, M as Avatar, N as FeedbackIcon, O as SendIcon, Q as Tooltip, U as RefreshIcon, W as PersonIcon, X as AccessTimeIcon, Y as MessageIcon, Z as Divider, _ as BoltIcon, $ as WarningIcon, a0 as Grid, a1 as Fab, a2 as CameraAltIcon, a3 as SpaIcon, a4 as GroupsIcon, L as LocalFloristIcon, a5 as NoteAltIcon, a6 as PeopleIcon, a7 as MenuBookIcon, a8 as StoreIcon, C as Container, a9 as TroubleshootIcon } from "./react-vendor-DaVUs1pH.js";
import { s as supabase, i as isAuthConfigured, a as API_BASE, u as useAuth } from "./App-BxlAc3TE.js";
import { S as ScanWizard, D as DispensaryFinder, F as FeedbackModal } from "./ScanWizard-3GRG4iak.js";
import { S as ScanResultCard } from "./ScanResultCard-BGx_BhU_.js";
import StrainBrowser from "./StrainBrowser-2GO7PxJ2.js";
import { S as SeedVendorFinder } from "./SeedVendorFinder-CxxEvy7T.js";
import Groups from "./Groups-CLalY7JD.js";
import GrowCoach, { LOGBOOK_TAB_INDEX } from "./GrowCoach-Cm1-I2Km.js";
import GrowerDirectory from "./GrowerDirectory-d7DekxV7.js";
import { u as useCreditBalance } from "./useCreditBalance-C4unyUsC.js";
import BuyScansModal from "./BuyScansModal-JP2lRnaq.js";
import { i as isAdminEmail } from "./roles-MIh-dFq-.js";
import "./vendor-qR99EfKL.js";
import "./BackHeader-jwQJOBEe.js";
import "./useCanScan-DUbcGzHt.js";
import "./useStrainImage-Dsgj-zte.js";
import "./JournalDialog-z8hMBNLf.js";
import "./EmptyStateCard-BPZgdi7J.js";
import "./GrowerRegistration-BBLqKBpW.js";
function GardenGate({ onSuccess, onBack }) {
  const [mode, setMode] = reactExports.useState("welcome");
  const [loading, setLoading] = reactExports.useState(false);
  const [error, setError] = reactExports.useState("");
  const [info, setInfo] = reactExports.useState("");
  const [checkingAuth, setCheckingAuth] = reactExports.useState(true);
  const [signupEmail, setSignupEmail] = reactExports.useState("");
  const [signupPassword, setSignupPassword] = reactExports.useState("");
  const [signupName, setSignupName] = reactExports.useState("");
  const [loginEmail, setLoginEmail] = reactExports.useState("");
  const [loginPassword, setLoginPassword] = reactExports.useState("");
  const [paymentComplete, setPaymentComplete] = reactExports.useState(false);
  const [pendingEmail, setPendingEmail] = reactExports.useState("");
  const authConfigured = isAuthConfigured();
  reactExports.useEffect(() => {
    if (!supabase) {
      setCheckingAuth(false);
      return;
    }
    let isMounted = true;
    const checkAuthStatus = /* @__PURE__ */ __name(async () => {
      if (!supabase) return;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;
        if (session?.user) {
          const membership = session.user.user_metadata?.membership;
          if (membership === "club") {
            onSuccess?.();
          } else {
            setMode("payment");
          }
        }
      } catch (e) {
        console.error("Auth check failed:", e);
      } finally {
        if (isMounted) {
          setCheckingAuth(false);
        }
      }
    }, "checkAuthStatus");
    checkAuthStatus();
    return () => {
      isMounted = false;
    };
  }, [onSuccess, supabase]);
  const handleSignup = /* @__PURE__ */ __name(async () => {
    if (!supabase) {
      setError("Supabase authentication is not configured for this deployment. Please contact support.");
      return;
    }
    setError("");
    if (!signupEmail || !signupPassword || !signupName) {
      setError("Please fill in all fields");
      return;
    }
    setLoading(true);
    setInfo("");
    try {
      const { data, error: signupError } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          data: {
            username: signupName,
            membership: "none"
            // Will be upgraded after payment
          },
          emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/#/` : void 0
        }
      });
      if (signupError) throw signupError;
      if (data.user) {
        setPendingEmail(signupEmail);
        setMode("verify");
        setInfo("Check your inbox to confirm your email, then sign in.");
      }
    } catch (e) {
      setError(e.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  }, "handleSignup");
  const handleLogin = /* @__PURE__ */ __name(async () => {
    if (!supabase) {
      setError("Supabase authentication is not configured for this deployment. Please contact support.");
      return;
    }
    setError("");
    setInfo("");
    if (!loginEmail || !loginPassword) {
      setError("Please enter email and password");
      return;
    }
    setLoading(true);
    try {
      console.log("🔐 Attempting login for:", loginEmail);
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword
      });
      console.log("Login response:", { data, error: loginError });
      if (loginError) {
        console.error("Login error:", loginError);
        throw loginError;
      }
      if (data.session?.user) {
        if (!data.session.user.email_confirmed_at) {
          await supabase.auth.signOut();
          setMode("verify");
          setPendingEmail(loginEmail);
          setError("Please verify your email before entering the garden.");
          return;
        }
        console.log("✅ Login successful!", data.session.user);
        const membership = data.session.user.user_metadata?.membership;
        console.log("Membership status:", membership);
        if (membership === "club") {
          console.log("✅ User is a club member, granting access");
          onSuccess?.();
        } else {
          console.log("⚠️ User needs to pay for membership");
          setMode("payment");
        }
      }
    } catch (e) {
      console.error("❌ Login failed:", e);
      setError(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }, "handleLogin");
  const handleForgotPassword = /* @__PURE__ */ __name(async () => {
    if (!supabase) return;
    if (!loginEmail) {
      setError('Enter your email first, then tap "Forgot password".');
      return;
    }
    setLoading(true);
    setError("");
    setInfo("");
    try {
      const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/#/` : void 0;
      const { error: error2 } = await supabase.auth.resetPasswordForEmail(loginEmail, { redirectTo });
      if (error2) throw error2;
      setInfo("Password reset email sent. Check your inbox.");
    } catch (err) {
      setError(err.message || "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  }, "handleForgotPassword");
  const handleResendVerification = /* @__PURE__ */ __name(async () => {
    if (!supabase || !pendingEmail) return;
    setLoading(true);
    setError("");
    setInfo("");
    try {
      const { error: error2 } = await supabase.auth.resend({
        type: "signup",
        email: pendingEmail
      });
      if (error2) throw error2;
      setInfo("Verification email resent. Check your inbox.");
    } catch (err) {
      setError(err.message || "Failed to resend verification email.");
    } finally {
      setLoading(false);
    }
  }, "handleResendVerification");
  const handlePayment = /* @__PURE__ */ __name(async () => {
    if (!supabase) {
      setError("Supabase authentication is not configured for this deployment. Please contact support.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          membership: "club",
          membership_started: (/* @__PURE__ */ new Date()).toISOString(),
          payment_status: "active",
          subscription_tier: "premium"
        }
      });
      if (updateError) throw updateError;
      if (signupName && !user.user_metadata?.username) {
        await supabase.auth.updateUser({
          data: {
            username: signupName
          }
        });
      }
      setPaymentComplete(true);
      setTimeout(() => {
        onSuccess?.();
      }, 2e3);
    } catch (e) {
      setError(e.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  }, "handlePayment");
  if (checkingAuth) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(CircularProgress, { sx: { color: "#7cb342" } }) });
  }
  if (!authConfigured) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", p: 3 }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Paper, { sx: { p: 4, borderRadius: 6, maxWidth: 420, textAlign: "center", bgcolor: "rgba(124, 179, 66, 0.1)", border: "1px solid rgba(124, 179, 66, 0.3)", color: "#fff" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h5", sx: { mb: 2, fontWeight: 700 }, children: "Authentication Offline" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", children: "The StrainSpotter authentication service is not configured for this deployment. Please reach out to the site administrator or try again later." }),
      onBack && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outlined", sx: { mt: 3, color: "#fff", borderColor: "rgba(255,255,255,0.4)" }, onClick: onBack, children: "← Back" })
    ] }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    p: { xs: 2, sm: 3 }
  }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Paper, { sx: {
    p: { xs: 3, sm: 4 },
    borderRadius: 6,
    width: "100%",
    maxWidth: 480,
    textAlign: "center",
    background: "rgba(255,255,255,0.15)",
    backdropFilter: "blur(20px)",
    border: "2px solid rgba(124, 179, 66, 0.3)"
  }, children: [
    mode === "welcome" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h3", sx: { mb: 2, color: "#fff", fontWeight: 900 }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { component: "img", src: "/hero.png?v=13", alt: "", sx: { width: 20, height: 20, filter: "drop-shadow(0 0 4px rgba(124, 179, 66, 0.6))" } }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Enter the Garden" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { component: "img", src: "/hero.png?v=13", alt: "", sx: { width: 20, height: 20, filter: "drop-shadow(0 0 4px rgba(124, 179, 66, 0.6))" } })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body1", sx: { mb: 4, color: "#e0e0e0" }, children: "Join the StrainSpotter community to access exclusive features, unlimited scans, and connect with growers worldwide." }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 2, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            variant: "contained",
            size: "large",
            onClick: /* @__PURE__ */ __name(() => setMode("signup"), "onClick"),
            sx: {
              width: "100%",
              py: 2,
              fontSize: "1.1rem",
              fontWeight: 700,
              bgcolor: "rgba(124, 179, 66, 0.8)",
              "&:hover": { bgcolor: "rgba(124, 179, 66, 1)" }
            },
            children: "Sign Up & Join"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            variant: "outlined",
            size: "large",
            onClick: /* @__PURE__ */ __name(() => setMode("login"), "onClick"),
            sx: {
              width: "100%",
              py: 2,
              fontSize: "1.1rem",
              fontWeight: 700,
              color: "#fff",
              borderColor: "rgba(124, 179, 66, 0.6)",
              "&:hover": { borderColor: "rgba(124, 179, 66, 1)", bgcolor: "rgba(124, 179, 66, 0.1)" }
            },
            children: "I'm Already a Member"
          }
        ),
        onBack && /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            variant: "text",
            onClick: onBack,
            sx: { color: "#ccc", mt: 2 },
            children: "← Back to Home"
          }
        )
      ] })
    ] }),
    mode === "signup" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h4", sx: { mb: 3, color: "#fff", fontWeight: 900 }, children: "Create Account" }),
      error && /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { severity: "error", sx: { mb: 2 }, children: error }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 2, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          TextField,
          {
            label: "Full Name",
            value: signupName,
            onChange: /* @__PURE__ */ __name((e) => setSignupName(e.target.value), "onChange"),
            fullWidth: true,
            sx: {
              "& .MuiOutlinedInput-root": { color: "#fff" },
              "& .MuiInputLabel-root": { color: "#ccc" },
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(124, 179, 66, 0.5)" }
            }
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          TextField,
          {
            label: "Email",
            type: "email",
            value: signupEmail,
            onChange: /* @__PURE__ */ __name((e) => setSignupEmail(e.target.value), "onChange"),
            fullWidth: true,
            sx: {
              "& .MuiOutlinedInput-root": { color: "#fff" },
              "& .MuiInputLabel-root": { color: "#ccc" },
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(124, 179, 66, 0.5)" }
            }
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          TextField,
          {
            label: "Password",
            type: "password",
            value: signupPassword,
            onChange: /* @__PURE__ */ __name((e) => setSignupPassword(e.target.value), "onChange"),
            fullWidth: true,
            sx: {
              "& .MuiOutlinedInput-root": { color: "#fff" },
              "& .MuiInputLabel-root": { color: "#ccc" },
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(124, 179, 66, 0.5)" }
            }
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            variant: "contained",
            onClick: handleSignup,
            disabled: loading,
            sx: {
              width: "100%",
              py: 2,
              fontSize: "1.1rem",
              fontWeight: 700,
              bgcolor: "rgba(124, 179, 66, 0.8)",
              "&:hover": { bgcolor: "rgba(124, 179, 66, 1)" }
            },
            children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircularProgress, { size: 24, sx: { color: "#fff" } }) : "Continue to Payment"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            variant: "text",
            onClick: /* @__PURE__ */ __name(() => setMode("welcome"), "onClick"),
            sx: { color: "#ccc" },
            children: "← Back"
          }
        )
      ] })
    ] }),
    mode === "login" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h4", sx: { mb: 3, color: "#fff", fontWeight: 900 }, children: "Welcome Back" }),
      error && /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { severity: "error", sx: { mb: 2 }, children: error }),
      info && /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { severity: "info", sx: { mb: 2 }, children: info }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 2, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          TextField,
          {
            label: "Email",
            type: "email",
            value: loginEmail,
            onChange: /* @__PURE__ */ __name((e) => setLoginEmail(e.target.value), "onChange"),
            fullWidth: true,
            sx: {
              "& .MuiOutlinedInput-root": { color: "#fff" },
              "& .MuiInputLabel-root": { color: "#ccc" },
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(124, 179, 66, 0.5)" }
            }
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
            sx: {
              "& .MuiOutlinedInput-root": { color: "#fff" },
              "& .MuiInputLabel-root": { color: "#ccc" },
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(124, 179, 66, 0.5)" }
            }
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            variant: "contained",
            onClick: handleLogin,
            disabled: loading,
            sx: {
              width: "100%",
              py: 2,
              fontSize: "1.1rem",
              fontWeight: 700,
              bgcolor: "rgba(124, 179, 66, 0.8)",
              "&:hover": { bgcolor: "rgba(124, 179, 66, 1)" }
            },
            children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircularProgress, { size: 24, sx: { color: "#fff" } }) : "Login"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            variant: "text",
            onClick: handleForgotPassword,
            disabled: loading || !loginEmail,
            sx: { color: "#ccc" },
            children: "Forgot password?"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            variant: "text",
            onClick: /* @__PURE__ */ __name(() => setMode("welcome"), "onClick"),
            sx: { color: "#ccc" },
            children: "← Back"
          }
        )
      ] })
    ] }),
    mode === "verify" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h4", sx: { mb: 2, color: "#fff", fontWeight: 900 }, children: "Confirm Your Email" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body1", sx: { mb: 3, color: "#e0e0e0" }, children: [
        "We sent a confirmation link to ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: pendingEmail || signupEmail || loginEmail || "your email" }),
        ". Tap the link, then return here to finish setting up your account."
      ] }),
      error && /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { severity: "error", sx: { mb: 2 }, children: error }),
      info && /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { severity: "info", sx: { mb: 2 }, children: info }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 2, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            variant: "contained",
            onClick: handleResendVerification,
            disabled: loading || !pendingEmail,
            sx: {
              width: "100%",
              py: 2,
              fontSize: "1.1rem",
              fontWeight: 700,
              bgcolor: "rgba(124, 179, 66, 0.8)",
              "&:hover": { bgcolor: "rgba(124, 179, 66, 1)" }
            },
            children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircularProgress, { size: 24, sx: { color: "#fff" } }) : "Resend Verification Email"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            variant: "outlined",
            onClick: /* @__PURE__ */ __name(() => {
              setMode("login");
              setError("");
              setInfo("");
            }, "onClick"),
            sx: { color: "#fff", borderColor: "rgba(124, 179, 66, 0.6)" },
            children: "Return to Sign In"
          }
        )
      ] })
    ] }),
    mode === "payment" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h4", sx: { mb: 2, color: "#fff", fontWeight: 900 }, children: "Join the Club" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body1", sx: { mb: 3, color: "#e0e0e0" }, children: "Unlock StrainSpotter (20 scans) and add Monthly Member for $4.99/month (200 scans/month + perks)" }),
      error && /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { severity: "error", sx: { mb: 2 }, children: error }),
      paymentComplete ? /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { severity: "success", sx: { mb: 2 }, children: "🎉 Payment successful! Welcome to the Garden!" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 2, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { p: 3, bgcolor: "rgba(124, 179, 66, 0.1)", border: "1px solid rgba(124, 179, 66, 0.3)", borderRadius: 2, mb: 2 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", sx: { color: "#fff", mb: 1 }, children: "Membership Benefits:" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", sx: { color: "#e0e0e0", textAlign: "left" }, children: [
            "✓ 200 AI scans per month + extra top-ups (50/200/500)",
            /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
            "✓ Leave reviews & ratings",
            /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
            "✓ Access to community groups",
            /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
            "✓ Grow coach & expert tips",
            /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
            "✓ Strain browser & database",
            /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
            "✓ Priority support"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            variant: "contained",
            onClick: handlePayment,
            disabled: loading,
            sx: {
              width: "100%",
              py: 2,
              fontSize: "1.1rem",
              fontWeight: 700,
              bgcolor: "rgba(124, 179, 66, 0.8)",
              "&:hover": { bgcolor: "rgba(124, 179, 66, 1)" }
            },
            children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircularProgress, { size: 24, sx: { color: "#fff" } }) : "Pay $4.99/month"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "caption", sx: { color: "#ccc", mt: 2 }, children: "Cancel anytime. No commitments." })
      ] })
    ] })
  ] }) });
}
__name(GardenGate, "GardenGate");
function useMembershipGuard() {
  const [user, setUser] = reactExports.useState(null);
  const [isMember, setIsMember] = reactExports.useState(false);
  const [isExpired, setIsExpired] = reactExports.useState(false);
  const [loading, setLoading] = reactExports.useState(true);
  const checkMembership = reactExports.useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user || null;
      setUser(currentUser);
      let inferredTier = null;
      if (currentUser?.id && session?.access_token) {
        try {
          const resp = await fetch(`${API_BASE}/api/credits/balance`, {
            headers: { Authorization: `Bearer ${session.access_token}` }
          });
          if (resp.ok) {
            const payload = await resp.json();
            inferredTier = payload?.tier || null;
          }
        } catch (err) {
          console.warn("useMembershipGuard: failed to fetch credit balance", err);
        }
      }
      if (!inferredTier && currentUser) {
        const metadataTier = (currentUser.user_metadata?.membership || "").toLowerCase();
        if (metadataTier.includes("club")) {
          inferredTier = "monthly_member";
        }
      }
      const normalizedTier = (inferredTier || "").toLowerCase();
      const memberTiers = /* @__PURE__ */ new Set(["monthly_member", "admin"]);
      setIsMember(memberTiers.has(normalizedTier));
      setIsExpired(false);
    } catch (e) {
      console.error("Membership check failed:", e);
    } finally {
      setLoading(false);
    }
  }, []);
  reactExports.useEffect(() => {
    checkMembership();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkMembership();
    });
    return () => subscription.unsubscribe();
  }, [checkMembership]);
  const adminEmails = /* @__PURE__ */ new Set([
    "topher.cook7@gmail.com",
    "andrewbeck209@gmail.com",
    "strainspotter25feedback@gmail.com",
    "strainspotter25@gmail.com",
    "admin@strainspotter.com"
  ]);
  const isAdmin = adminEmails.has((user?.email || "").toLowerCase());
  const canLogout = isAdmin || !isMember || !isExpired;
  return {
    user,
    isMember,
    isExpired,
    canLogout,
    loading,
    refreshMembership: checkMembership
  };
}
__name(useMembershipGuard, "useMembershipGuard");
function ReviewsHub({ onBack, currentUser }) {
  const [tab, setTab] = reactExports.useState(0);
  const [myReviews, setMyReviews] = reactExports.useState([]);
  const [allReviews, setAllReviews] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [editDialog, setEditDialog] = reactExports.useState(false);
  const [editingReview, setEditingReview] = reactExports.useState(null);
  const [editRating, setEditRating] = reactExports.useState(5);
  const [editComment, setEditComment] = reactExports.useState("");
  const fetchMyReviews = reactExports.useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      setLoading(true);
      const { data, error } = await supabase.from("reviews").select("*, strains(name, slug, type)").eq("user_id", currentUser.id).order("created_at", { ascending: false });
      if (error) throw error;
      setMyReviews(data || []);
    } catch (error) {
      console.error("Error fetching my reviews:", error);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);
  const fetchAllReviews = reactExports.useCallback(async () => {
    try {
      const { data, error } = await supabase.from("reviews").select("*, strains(name, slug, type)").order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      setAllReviews(data || []);
    } catch (error) {
      console.error("Error fetching all reviews:", error);
    }
  }, []);
  reactExports.useEffect(() => {
    if (currentUser) {
      fetchMyReviews();
    }
    fetchAllReviews();
  }, [currentUser, fetchMyReviews, fetchAllReviews]);
  const handleEditClick = /* @__PURE__ */ __name((review) => {
    setEditingReview(review);
    setEditRating(review.rating);
    setEditComment(review.comment || "");
    setEditDialog(true);
  }, "handleEditClick");
  const handleUpdateReview = /* @__PURE__ */ __name(async () => {
    try {
      const { error } = await supabase.from("reviews").update({
        rating: editRating,
        comment: editComment,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", editingReview.id);
      if (error) throw error;
      setEditDialog(false);
      fetchMyReviews();
      fetchAllReviews();
    } catch (error) {
      console.error("Error updating review:", error);
      alert("Failed to update review");
    }
  }, "handleUpdateReview");
  const handleDeleteReview = /* @__PURE__ */ __name(async (reviewId) => {
    if (!confirm("Are you sure you want to delete this review?")) return;
    try {
      const { error } = await supabase.from("reviews").delete().eq("id", reviewId);
      if (error) throw error;
      fetchMyReviews();
      fetchAllReviews();
    } catch (error) {
      console.error("Error deleting review:", error);
      alert("Failed to delete review");
    }
  }, "handleDeleteReview");
  const getTypeColor = /* @__PURE__ */ __name((type) => {
    switch (type?.toLowerCase()) {
      case "indica":
        return "#9c27b0";
      case "sativa":
        return "#ff9800";
      case "hybrid":
        return "#4caf50";
      default:
        return "#757575";
    }
  }, "getTypeColor");
  const ReviewCard = /* @__PURE__ */ __name(({ review, showActions = false }) => /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { sx: {
    background: "rgba(255,255,255,0.1)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(124, 179, 66, 0.3)",
    borderRadius: 2,
    mb: 2
  }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", justifyContent: "space-between", alignItems: "flex-start", mb: 2, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 1, flex: 1, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", sx: { color: "#fff", fontWeight: 600 }, children: review.strains?.name || "Unknown Strain" }),
          review.strains?.type && /* @__PURE__ */ jsxRuntimeExports.jsx(
            Chip,
            {
              label: review.strains.type,
              size: "small",
              sx: {
                bgcolor: getTypeColor(review.strains.type),
                color: "#fff",
                fontSize: "0.7rem",
                height: 20
              }
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", alignItems: "center", spacing: 2, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Rating, { value: review.rating, readOnly: true, size: "small" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "caption", sx: { color: "#aaa" }, children: new Date(review.created_at).toLocaleDateString() })
        ] })
      ] }),
      showActions && /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", spacing: 1, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          IconButton,
          {
            size: "small",
            onClick: /* @__PURE__ */ __name(() => handleEditClick(review), "onClick"),
            sx: { color: "#7cb342" },
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(EditIcon, { fontSize: "small" })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          IconButton,
          {
            size: "small",
            onClick: /* @__PURE__ */ __name(() => handleDeleteReview(review.id), "onClick"),
            sx: { color: "#f44336" },
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(DeleteIcon, { fontSize: "small" })
          }
        )
      ] })
    ] }),
    review.comment && /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "#e0e0e0", whiteSpace: "pre-line" }, children: review.comment })
  ] }) }), "ReviewCard");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: {
    minHeight: "100vh",
    pt: "calc(env(safe-area-inset-top) + 32px)",
    px: 2,
    pb: 2,
    background: "none"
  }, children: [
    onBack && /* @__PURE__ */ jsxRuntimeExports.jsx(
      Button,
      {
        size: "small",
        variant: "outlined",
        onClick: onBack,
        startIcon: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowBackIcon, {}),
        sx: {
          color: "#fff",
          borderColor: "rgba(124, 179, 66, 0.6)",
          fontSize: "0.875rem",
          mb: 2,
          "&:hover": {
            borderColor: "rgba(124, 179, 66, 1)",
            bgcolor: "rgba(124, 179, 66, 0.1)"
          }
        },
        children: "Back"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", alignItems: "center", spacing: 2, mb: 2, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(RateReviewIcon, { sx: { fontSize: 32, color: "#7cb342" } }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h5", sx: { color: "#fff", fontWeight: 700 }, children: "Reviews Hub" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Paper, { sx: {
      mb: 2,
      background: "rgba(255,255,255,0.1)",
      backdropFilter: "blur(20px)",
      border: "1px solid rgba(124, 179, 66, 0.3)",
      borderRadius: 2
    }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Tabs,
      {
        value: tab,
        onChange: /* @__PURE__ */ __name((e, v) => setTab(v), "onChange"),
        sx: {
          borderBottom: "1px solid rgba(124, 179, 66, 0.3)",
          "& .MuiTab-root": { color: "#fff" },
          "& .Mui-selected": { color: "#7cb342" }
        },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Tab, { label: `My Reviews (${myReviews.length})` }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Tab, { label: "Community Reviews" })
        ]
      }
    ) }),
    loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { display: "flex", justifyContent: "center", py: 8 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(CircularProgress, { sx: { color: "#7cb342" } }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { children: tab === 0 ? (
      // My Reviews
      /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { children: !currentUser ? /* @__PURE__ */ jsxRuntimeExports.jsx(Paper, { sx: {
        p: 4,
        textAlign: "center",
        background: "rgba(255,255,255,0.1)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(124, 179, 66, 0.3)",
        borderRadius: 2
      }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", sx: { color: "#fff", mb: 2 }, children: "Please log in to view your reviews" }) }) : myReviews.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Paper, { sx: {
        p: 4,
        textAlign: "center",
        background: "rgba(255,255,255,0.1)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(124, 179, 66, 0.3)",
        borderRadius: 2
      }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", sx: { color: "#fff", mb: 2 }, children: "You haven't written any reviews yet" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "#e0e0e0" }, children: "Try strains and share your experience with the community!" })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { children: myReviews.map((review) => /* @__PURE__ */ jsxRuntimeExports.jsx(ReviewCard, { review, showActions: true }, review.id)) }) })
    ) : (
      // All Reviews
      /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { children: allReviews.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Paper, { sx: {
        p: 4,
        textAlign: "center",
        background: "rgba(255,255,255,0.1)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(124, 179, 66, 0.3)",
        borderRadius: 2
      }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", sx: { color: "#fff" }, children: "No reviews yet" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { children: allReviews.map((review) => /* @__PURE__ */ jsxRuntimeExports.jsx(ReviewCard, { review, showActions: false }, review.id)) }) })
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Dialog,
      {
        open: editDialog,
        onClose: /* @__PURE__ */ __name(() => setEditDialog(false), "onClose"),
        maxWidth: "sm",
        fullWidth: true,
        fullScreen: true,
        PaperProps: {
          sx: {
            background: "rgba(30, 30, 30, 0.95)",
            backdropFilter: "blur(20px)",
            border: "2px solid rgba(124, 179, 66, 0.5)",
            borderRadius: { xs: 0, sm: 3 },
            m: 0,
            maxHeight: "100vh"
          }
        },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogTitle, { sx: { color: "#fff", borderBottom: "1px solid rgba(124, 179, 66, 0.3)", display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", children: "Edit Review" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(IconButton, { onClick: /* @__PURE__ */ __name(() => setEditDialog(false), "onClick"), sx: { color: "#fff" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowBackIcon, {}) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogContent, { sx: { pt: 3 }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 3, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "#e0e0e0", mb: 1 }, children: "Rating" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Rating,
                {
                  value: editRating,
                  onChange: /* @__PURE__ */ __name((e, v) => setEditRating(v || 1), "onChange"),
                  size: "large"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              TextField,
              {
                label: "Your Review",
                multiline: true,
                rows: 4,
                value: editComment,
                onChange: /* @__PURE__ */ __name((e) => setEditComment(e.target.value), "onChange"),
                fullWidth: true,
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
            )
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogActions, { sx: { p: 2, borderTop: "1px solid rgba(124, 179, 66, 0.3)" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: /* @__PURE__ */ __name(() => setEditDialog(false), "onClick"), sx: { color: "#fff" }, children: "Cancel" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                onClick: handleUpdateReview,
                variant: "contained",
                sx: {
                  bgcolor: "#7cb342",
                  "&:hover": { bgcolor: "#689f38" }
                },
                children: "Update"
              }
            )
          ] })
        ]
      }
    )
  ] });
}
__name(ReviewsHub, "ReviewsHub");
function FeedbackReader({ user, onBack, onMessageUser, onSendFeedback }) {
  const isAdmin = user?.email === "topher.cook7@gmail.com" || user?.email === "strainspotter25@gmail.com" || user?.email === "admin@strainspotter.com" || user?.email === "andrewbeck209@gmail.com";
  const [feedback, setFeedback] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [error, setError] = reactExports.useState(null);
  const [refreshing, setRefreshing] = reactExports.useState(false);
  const [deleting, setDeleting] = reactExports.useState(null);
  const loadFeedback = /* @__PURE__ */ __name(async () => {
    try {
      setRefreshing(true);
      setError(null);
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        throw new Error("Please log in to view feedback");
      }
      const res = await fetch(`${API_BASE}/api/feedback/messages`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      if (!res.ok) {
        let errorText = "";
        try {
          errorText = await res.text();
          try {
            const errorJson = JSON.parse(errorText);
            errorText = errorJson.error || errorJson.message || errorText;
          } catch {
          }
        } catch {
          errorText = `Failed to load feedback: ${res.status} ${res.statusText}`;
        }
        throw new Error(errorText || `Failed to load feedback: ${res.status}`);
      }
      const data = await res.json();
      setFeedback(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error("Error loading feedback:", err);
      const errorMessage = err?.message || err?.toString() || "Failed to load feedback. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, "loadFeedback");
  const handleDelete = /* @__PURE__ */ __name(async (messageId) => {
    if (!confirm("Are you sure you want to delete this feedback?")) {
      return;
    }
    try {
      setDeleting(messageId);
      const res = await fetch(`${API_BASE}/api/feedback/messages/${messageId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_user_id: user?.id })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete feedback");
      }
      setFeedback((prev) => prev.filter((f) => f.id !== messageId));
    } catch (err) {
      console.error("Error deleting feedback:", err);
      alert("Failed to delete: " + err.message);
    } finally {
      setDeleting(null);
    }
  }, "handleDelete");
  reactExports.useEffect(() => {
    loadFeedback();
  }, []);
  const formatDate = /* @__PURE__ */ __name((dateString) => {
    const date = new Date(dateString);
    const now = /* @__PURE__ */ new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 6e4);
    const diffHours = Math.floor(diffMs / 36e5);
    const diffDays = Math.floor(diffMs / 864e5);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : void 0
    });
  }, "formatDate");
  const formatFullDate = /* @__PURE__ */ __name((dateString) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
  }, "formatFullDate");
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: {
      minHeight: "100vh",
      background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(CircularProgress, { sx: { color: "#7CB342" } }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)",
    py: 4,
    px: 2
  }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { maxWidth: 900, mx: "auto" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Paper, { sx: {
      p: 3,
      mb: 3,
      background: "linear-gradient(135deg, rgba(124, 179, 66, 0.1) 0%, rgba(156, 204, 101, 0.05) 100%)",
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(124, 179, 66, 0.2)",
      borderRadius: 3
    }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", alignItems: "center", justifyContent: "space-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", alignItems: "center", spacing: 2, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { sx: {
          bgcolor: "#7CB342",
          width: 56,
          height: 56
        }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(FeedbackIcon, { sx: { fontSize: 32 } }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h4", sx: {
            fontWeight: 700,
            color: "#fff",
            mb: 0.5
          }, children: "Feedback Reader" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", sx: { color: "rgba(255,255,255,0.7)" }, children: [
            feedback.length,
            " ",
            feedback.length === 1 ? "submission" : "submissions"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", spacing: 1, children: [
        onSendFeedback && /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            variant: "contained",
            startIcon: /* @__PURE__ */ jsxRuntimeExports.jsx(SendIcon, {}),
            onClick: onSendFeedback,
            sx: {
              bgcolor: "#7CB342",
              color: "#fff",
              fontWeight: 600,
              "&:hover": { bgcolor: "#9CCC65" }
            },
            children: "Send Feedback"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { title: "Refresh", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          IconButton,
          {
            onClick: loadFeedback,
            disabled: refreshing,
            sx: {
              color: "#7CB342",
              "&:hover": { bgcolor: "rgba(124, 179, 66, 0.1)" }
            },
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshIcon, { sx: {
              animation: refreshing ? "spin 1s linear infinite" : "none",
              "@keyframes spin": {
                "0%": { transform: "rotate(0deg)" },
                "100%": { transform: "rotate(360deg)" }
              }
            } })
          }
        ) }),
        onBack && /* @__PURE__ */ jsxRuntimeExports.jsx(
          Chip,
          {
            label: "Back",
            onClick: onBack,
            sx: {
              bgcolor: "rgba(124, 179, 66, 0.2)",
              color: "#7CB342",
              fontWeight: 600,
              "&:hover": { bgcolor: "rgba(124, 179, 66, 0.3)" }
            }
          }
        )
      ] })
    ] }) }),
    error && /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { severity: "error", sx: { mb: 3 }, children: error }),
    !loading && feedback.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Paper, { sx: {
      p: 6,
      textAlign: "center",
      background: "rgba(255,255,255,0.05)",
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 3
    }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(FeedbackIcon, { sx: { fontSize: 64, color: "rgba(255,255,255,0.3)", mb: 2 } }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", sx: { color: "#fff", mb: 1 }, children: "No Feedback Yet" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "rgba(255,255,255,0.6)" }, children: "Feedback submissions will appear here" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Stack, { spacing: 2, children: feedback.map((item, index) => /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { sx: {
      background: "rgba(255,255,255,0.05)",
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(124, 179, 66, 0.2)",
      borderRadius: 2,
      transition: "all 0.3s ease",
      "&:hover": {
        transform: "translateY(-2px)",
        boxShadow: "0 8px 24px rgba(124, 179, 66, 0.2)",
        border: "1px solid rgba(124, 179, 66, 0.4)"
      }
    }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { sx: { p: 3 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", alignItems: "center", justifyContent: "space-between", mb: 2, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1.5, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Avatar,
            {
              src: item.sender?.avatar_url,
              sx: {
                bgcolor: "rgba(124, 179, 66, 0.2)",
                width: 32,
                height: 32
              },
              children: !item.sender?.avatar_url && /* @__PURE__ */ jsxRuntimeExports.jsx(PersonIcon, { sx: { fontSize: 18, color: "#7CB342" } })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: {
              color: "#7CB342",
              fontWeight: 600
            }, children: item.sender?.display_name || item.sender?.username || `User ${item.sender_id?.substring(0, 8)}` }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", alignItems: "center", spacing: 0.5, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(AccessTimeIcon, { sx: { fontSize: 14, color: "rgba(255,255,255,0.5)" } }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "caption", sx: { color: "rgba(255,255,255,0.5)" }, children: formatDate(item.created_at) })
              ] }),
              item.sender?.username && /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "caption", sx: { color: "rgba(255,255,255,0.4)" }, children: [
                "• @",
                item.sender.username
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", spacing: 1, alignItems: "center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { title: formatFullDate(item.created_at), children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            Chip,
            {
              label: item.message_type || "text",
              size: "small",
              sx: {
                bgcolor: "rgba(124, 179, 66, 0.2)",
                color: "#7CB342",
                fontSize: "0.75rem",
                fontWeight: 600
              }
            }
          ) }),
          item.sender_id && onMessageUser && isAdmin && /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { title: "Message this user", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            IconButton,
            {
              size: "small",
              onClick: /* @__PURE__ */ __name(() => onMessageUser(item.sender_id, item.sender), "onClick"),
              sx: {
                color: "#7CB342",
                "&:hover": {
                  bgcolor: "rgba(124, 179, 66, 0.2)"
                }
              },
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(MessageIcon, { sx: { fontSize: 18 } })
            }
          ) }),
          isAdmin && /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { title: "Delete feedback", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            IconButton,
            {
              size: "small",
              onClick: /* @__PURE__ */ __name(() => handleDelete(item.id), "onClick"),
              disabled: deleting === item.id,
              sx: {
                color: "#ff5252",
                "&:hover": {
                  bgcolor: "rgba(255, 82, 82, 0.1)"
                }
              },
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(DeleteIcon, { sx: { fontSize: 18 } })
            }
          ) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Divider, { sx: { mb: 2, borderColor: "rgba(255,255,255,0.1)" } }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { sx: {
        color: "#fff",
        fontSize: "1rem",
        lineHeight: 1.6,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word"
      }, children: item.content }),
      (item.is_flagged || item.is_moderated) && /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", spacing: 1, mt: 2, children: [
        item.is_flagged && /* @__PURE__ */ jsxRuntimeExports.jsx(
          Chip,
          {
            label: "Flagged",
            size: "small",
            color: "warning",
            sx: { fontSize: "0.7rem" }
          }
        ),
        item.is_moderated && /* @__PURE__ */ jsxRuntimeExports.jsx(
          Chip,
          {
            label: `Moderated: ${item.moderation_action || "reviewed"}`,
            size: "small",
            color: "info",
            sx: { fontSize: "0.7rem" }
          }
        )
      ] })
    ] }) }, item.id || index)) })
  ] }) });
}
__name(FeedbackReader, "FeedbackReader");
function CreditBalance({ summary: externalSummary, loading: externalLoading }) {
  useAuth();
  const shouldUseExternal = typeof externalSummary !== "undefined" || typeof externalLoading !== "undefined";
  const { remainingScans, isUnlimited, loading: internalLoading } = useCreditBalance?.() ?? {};
  const isFounderSafe = Boolean(isUnlimited);
  const hasUnlimited = isUnlimited;
  const summary = shouldUseExternal ? externalSummary : {
    creditsRemaining: remainingScans
  };
  const loading = shouldUseExternal ? !!externalLoading : internalLoading;
  const credits = summary?.creditsRemaining ?? remainingScans ?? null;
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { display: "flex", alignItems: "center", gap: 1 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(CircularProgress, { size: 20, sx: { color: "rgba(124, 179, 66, 0.8)" } }) });
  }
  if (credits === null && !hasUnlimited) {
    return null;
  }
  const getColor = /* @__PURE__ */ __name(() => {
    if (hasUnlimited) return "primary";
    if (credits === 0) return "error";
    if (credits <= 10) return "warning";
    return "success";
  }, "getColor");
  const getLabel = /* @__PURE__ */ __name(() => {
    if (hasUnlimited) return "∞ Scans";
    const displayCredits = credits === Infinity || credits === Number.POSITIVE_INFINITY ? "∞" : credits ?? 0;
    return `${displayCredits} Scans`;
  }, "getLabel");
  const getTooltip = /* @__PURE__ */ __name(() => {
    if (hasUnlimited) {
      if (isFounderSafe || summary?.membershipTier === "founder_unlimited") {
        return "Unlimited scans (Founder)";
      }
      return "Unlimited scans (Admin)";
    }
    if (tier === "free") return `${credits} free scans remaining`;
    if (tier === "app_purchase") return `${credits} scans from your app unlock`;
    if (tier === "monthly_member") {
      return `${credits} scans remaining (monthly allotment + top-ups)`;
    }
    return `${credits} scans remaining`;
  }, "getTooltip");
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { title: getTooltip(), arrow: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
    Chip,
    {
      icon: /* @__PURE__ */ jsxRuntimeExports.jsx(BoltIcon, {}),
      label: getLabel(),
      color: getColor(),
      size: "small",
      sx: {
        fontWeight: 600,
        background: hasUnlimited ? "linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 165, 0, 0.2) 100%)" : void 0,
        backdropFilter: "blur(10px)",
        border: hasUnlimited ? "1px solid rgba(255, 215, 0, 0.5)" : void 0,
        boxShadow: !hasUnlimited && credits <= 10 ? "0 0 10px rgba(255, 152, 0, 0.4)" : void 0,
        animation: !hasUnlimited && credits === 0 ? "pulse 2s ease-in-out infinite" : void 0,
        "@keyframes pulse": {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.7 }
        }
      }
    }
  ) });
}
__name(CreditBalance, "CreditBalance");
function Garden({ onBack, onNavigate }) {
  const { user, isExpired, canLogout, loading } = useMembershipGuard();
  const [showLogoutWarning, setShowLogoutWarning] = reactExports.useState(false);
  const [showScan, setShowScan] = reactExports.useState(false);
  const [showStrainBrowser, setShowStrainBrowser] = reactExports.useState(false);
  const [showReviews, setShowReviews] = reactExports.useState(false);
  const [showDispensaryFinder, setShowDispensaryFinder] = reactExports.useState(false);
  const [showSeedFinder, setShowSeedFinder] = reactExports.useState(false);
  const [showGroups, setShowGroups] = reactExports.useState(false);
  const [showGrowCoach, setShowGrowCoach] = reactExports.useState(false);
  const [growCoachInitialTab, setGrowCoachInitialTab] = reactExports.useState(0);
  const [showGrowerDirectory, setShowGrowerDirectory] = reactExports.useState(false);
  const [showFeedback, setShowFeedback] = reactExports.useState(false);
  const [showFeedbackReader, setShowFeedbackReader] = reactExports.useState(false);
  const [showBuyScans, setShowBuyScans] = reactExports.useState(false);
  const [navValue, setNavValue] = reactExports.useState("home");
  const [activeScan, setActiveScan] = reactExports.useState(null);
  const [activeView, setActiveView] = reactExports.useState("scanner");
  reactExports.useEffect(() => {
    console.log("[Garden] mounted – bundle v2 (seedFinderStrain removed)");
  }, []);
  const handleLogout = /* @__PURE__ */ __name(async () => {
    const isAdminUser = user?.email === "topher.cook7@gmail.com" || user?.email === "strainspotter25@gmail.com" || user?.email === "admin@strainspotter.com" || user?.email === "andrewbeck209@gmail.com";
    if (!canLogout && !isAdminUser) {
      setShowLogoutWarning(true);
      return;
    }
    try {
      await supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
      onBack?.();
    } catch (e) {
      console.error("Logout failed:", e);
    }
  }, "handleLogout");
  const handleFeatureClick = /* @__PURE__ */ __name((featureName, nav) => {
    switch (nav) {
      case "scan":
        openScreen("scan", () => setShowScan(true));
        return;
      case "strains":
        openScreen("home", () => setShowStrainBrowser(true));
        return;
      case "reviews":
        openScreen("home", () => setShowReviews(true));
        return;
      case "dispensaries":
        openScreen("dispensaries", () => setShowDispensaryFinder(true));
        return;
      case "seeds":
        openScreen("home", () => setShowSeedFinder(true));
        return;
      case "groups":
        openScreen("groups", () => setShowGroups(true));
        return;
      case "grow-coach":
        setGrowCoachInitialTab(0);
        openScreen("home", () => setShowGrowCoach(true));
        return;
      case "grow-logbook":
        setGrowCoachInitialTab(LOGBOOK_TAB_INDEX);
        openScreen("home", () => setShowGrowCoach(true));
        return;
      case "growers":
        openScreen("growers", () => setShowGrowerDirectory(true));
        return;
      case "feedback-reader":
        return;
      default:
        console.warn("Unknown feature clicked:", featureName, nav);
        if (featureName.toLowerCase().includes("scan")) {
          openScreen("scan", () => setShowScan(true));
        } else {
          openScreen("home", () => setShowGroups(true));
        }
    }
  }, "handleFeatureClick");
  const isAdmin = user?.email === "topher.cook7@gmail.com" || user?.email === "strainspotter25@gmail.com" || user?.email === "admin@strainspotter.com" || user?.email === "andrewbeck209@gmail.com";
  const tiles = [
    { title: "AI Strain Scan", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(CameraAltIcon, {}), nav: "scan", color: "#00e676", description: "Identify any strain instantly", image: "📷", useEmoji: true },
    { title: "Strain Browser", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(SpaIcon, {}), nav: "strains", color: "#7cb342", description: "Explore 1000+ strains", image: "🌿", useEmoji: true },
    { title: "Reviews Hub", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RateReviewIcon, {}), nav: "reviews", color: "#ffd600", description: "Read & share experiences", image: "⭐", useEmoji: true },
    { title: "Community Groups", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(GroupsIcon, {}), nav: "groups", color: "#66bb6a", description: "Connect with growers", image: "👥", useEmoji: true },
    { title: "Grow Coach", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(LocalFloristIcon, {}), nav: "grow-coach", color: "#9ccc65", description: "Expert growing tips", image: "🌱", useEmoji: true },
    { title: "Grow Logbook", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(NoteAltIcon, {}), nav: "grow-logbook", color: "#81c784", description: "Track every stage", image: "📓", useEmoji: true },
    { title: "Grower Directory", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(PeopleIcon, {}), nav: "growers", color: "#8bc34a", description: "Find local cultivators", image: "🧑‍🌾", useEmoji: true },
    { title: "Seed Vendors", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(MenuBookIcon, {}), nav: "seeds", color: "#aed581", description: "Trusted seed sources", image: "🌾", useEmoji: true },
    { title: "Dispensaries", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(StoreIcon, {}), nav: "dispensaries", color: "#c5e1a5", description: "Find nearby shops", image: "🏪", useEmoji: true }
  ];
  const resetScreens = /* @__PURE__ */ __name((nextNav = "home") => {
    setShowScan(false);
    setShowStrainBrowser(false);
    setShowReviews(false);
    setShowDispensaryFinder(false);
    setShowSeedFinder(false);
    setShowGroups(false);
    setShowGrowCoach(false);
    setShowGrowerDirectory(false);
    setShowFeedbackReader(false);
    setNavValue(nextNav);
  }, "resetScreens");
  const openScreen = /* @__PURE__ */ __name((navId, openCallback) => {
    resetScreens(navId);
    openCallback?.();
  }, "openScreen");
  const handleScanComplete = reactExports.useCallback((scan) => {
    console.log("[GardenScanner] scan complete:", scan);
    if (!scan || !scan.id && !scan.scanId && !scan.scan_id) {
      console.warn("[GardenScanner] scan complete but no scan/id", scan);
      return;
    }
    setActiveScan(scan);
    setActiveView("result");
    setShowScan(false);
  }, []);
  const renderWithNav = /* @__PURE__ */ __name((content, navActive = navValue) => /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    width: "100%",
    maxWidth: "100vw",
    overflow: "hidden",
    overflowX: "hidden",
    backgroundColor: "background.default"
  }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { flex: 1, minHeight: 0, overflow: "hidden", overflowX: "hidden", width: "100%", maxWidth: "100vw", left: 0, right: 0, position: "relative" }, children: content }) }), "renderWithNav");
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { sx: { color: "#fff" }, children: "Loading..." }) });
  }
  if (activeView === "result" && activeScan) {
    return renderWithNav(
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Box,
        {
          sx: {
            display: "flex",
            flexDirection: "column",
            height: "100%",
            width: "100%",
            maxWidth: "100%",
            overflow: "hidden",
            overflowX: "hidden",
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
                  pt: "calc(env(safe-area-inset-top) + 8px)",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                  bgcolor: "transparent",
                  backdropFilter: "blur(8px)",
                  zIndex: 1
                },
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Button,
                    {
                      variant: "text",
                      onClick: /* @__PURE__ */ __name(() => {
                        setActiveView("scanner");
                        setActiveScan(null);
                      }, "onClick"),
                      sx: {
                        color: "#fff",
                        minWidth: "auto",
                        px: 1,
                        fontSize: "1rem",
                        fontWeight: 600
                      },
                      children: "← Back"
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
                  width: "100%",
                  maxWidth: "100vw",
                  overflowY: "auto",
                  overflowX: "hidden",
                  WebkitOverflowScrolling: "touch",
                  left: 0,
                  right: 0,
                  position: "relative",
                  paddingBottom: "calc(env(safe-area-inset-bottom) + 80px)",
                  px: 2,
                  py: 2
                },
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  ScanResultCard,
                  {
                    scan: activeScan,
                    result: activeScan,
                    isGuest: !user
                  }
                )
              }
            )
          ]
        }
      ),
      "scan"
    );
  }
  if (showScan) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      ScanWizard,
      {
        onBack: /* @__PURE__ */ __name(() => {
          setShowScan(false);
          setActiveView("scanner");
        }, "onBack"),
        onScanComplete: handleScanComplete
      }
    );
  }
  if (showStrainBrowser) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(StrainBrowser, { onBack: /* @__PURE__ */ __name(() => setShowStrainBrowser(false), "onBack") });
  }
  if (showReviews) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(ReviewsHub, { onBack: /* @__PURE__ */ __name(() => setShowReviews(false), "onBack"), currentUser: user });
  }
  if (showDispensaryFinder) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(DispensaryFinder, { onBack: /* @__PURE__ */ __name(() => setShowDispensaryFinder(false), "onBack") });
  }
  if (showGroups) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Groups, { onBack: /* @__PURE__ */ __name(() => setShowGroups(false), "onBack") });
  }
  if (showGrowCoach) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(GrowCoach, { onBack: /* @__PURE__ */ __name(() => setShowGrowCoach(false), "onBack"), initialTab: growCoachInitialTab });
  }
  if (showGrowerDirectory) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(GrowerDirectory, { onBack: /* @__PURE__ */ __name(() => setShowGrowerDirectory(false), "onBack") });
  }
  if (showFeedbackReader) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(FeedbackReader, { user, onBack: /* @__PURE__ */ __name(() => setShowFeedbackReader(false), "onBack") });
  }
  if (loading) {
    return renderWithNav(
      /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { sx: { color: "#fff" }, children: "Loading..." }) })
    );
  }
  if (showScan) {
    if (activeView === "result" && activeScan) {
      return renderWithNav(
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Box,
          {
            sx: {
              display: "flex",
              flexDirection: "column",
              height: "100%",
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
                    backdropFilter: "blur(8px)",
                    zIndex: 1
                  },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Button,
                      {
                        variant: "text",
                        onClick: /* @__PURE__ */ __name(() => {
                          setActiveView("scanner");
                          setActiveScan(null);
                        }, "onClick"),
                        sx: { color: "#fff", minWidth: "auto", px: 1 },
                        children: "← Back"
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
                    width: "100%",
                    maxWidth: "100%",
                    overflowY: "auto",
                    overflowX: "hidden",
                    WebkitOverflowScrolling: "touch",
                    paddingBottom: "calc(env(safe-area-inset-bottom) + 80px)",
                    px: 2,
                    py: 2
                  },
                  children: !activeScan ? /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", color: "text.secondary", children: "Preparing your result…" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx(
                    ScanResultCard,
                    {
                      scan: activeScan,
                      result: activeScan,
                      isGuest: !user
                    }
                  )
                }
              )
            ]
          }
        ),
        "scan"
      );
    }
    return renderWithNav(
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        ScanWizard,
        {
          onBack: /* @__PURE__ */ __name(() => resetScreens("home"), "onBack"),
          onScanComplete: /* @__PURE__ */ __name((scan) => {
            setActiveScan(scan);
            setActiveView("result");
          }, "onScanComplete")
        }
      ),
      "scan"
    );
  }
  if (showStrainBrowser) {
    return renderWithNav(/* @__PURE__ */ jsxRuntimeExports.jsx(StrainBrowser, { onBack: /* @__PURE__ */ __name(() => resetScreens("home"), "onBack") }));
  }
  if (showReviews) {
    return renderWithNav(/* @__PURE__ */ jsxRuntimeExports.jsx(ReviewsHub, { onBack: /* @__PURE__ */ __name(() => resetScreens("home"), "onBack"), currentUser: user }));
  }
  if (showDispensaryFinder) {
    return renderWithNav(/* @__PURE__ */ jsxRuntimeExports.jsx(DispensaryFinder, { onBack: /* @__PURE__ */ __name(() => resetScreens("home"), "onBack") }), "dispensaries");
  }
  if (showSeedFinder) {
    return renderWithNav(
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        SeedVendorFinder,
        {
          onBack: /* @__PURE__ */ __name(() => {
            setShowSeedFinder(false);
            resetScreens("home");
          }, "onBack")
        }
      )
    );
  }
  if (showGroups) {
    return renderWithNav(/* @__PURE__ */ jsxRuntimeExports.jsx(Groups, { onBack: /* @__PURE__ */ __name(() => resetScreens("home"), "onBack") }), "groups");
  }
  if (showGrowCoach) {
    return renderWithNav(/* @__PURE__ */ jsxRuntimeExports.jsx(GrowCoach, { onBack: /* @__PURE__ */ __name(() => resetScreens("home"), "onBack"), initialTab: growCoachInitialTab }));
  }
  if (showGrowerDirectory) {
    return renderWithNav(/* @__PURE__ */ jsxRuntimeExports.jsx(GrowerDirectory, { onBack: /* @__PURE__ */ __name(() => resetScreens("home"), "onBack") }), "growers");
  }
  if (showFeedbackReader) {
    return renderWithNav(
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        FeedbackReader,
        {
          user,
          onBack: /* @__PURE__ */ __name(() => resetScreens("home"), "onBack"),
          onSendFeedback: /* @__PURE__ */ __name(() => setShowFeedback(true), "onSendFeedback"),
          onMessageUser: isAdmin ? ((senderId, sender) => {
            resetScreens("home");
            setShowGroups(true);
            if (typeof window !== "undefined") {
              sessionStorage.setItem("openDMWith", JSON.stringify({ user_id: senderId, ...sender }));
            }
          }) : void 0
        }
      )
    );
  }
  return renderWithNav(
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: {
      display: "flex",
      flexDirection: "column",
      height: "100dvh",
      // Use dynamic viewport height for better mobile support
      width: "100%",
      maxWidth: "100vw",
      overflow: "hidden",
      overflowX: "hidden",
      position: "relative",
      backgroundImage: "url(./strainspotter-bg.jpg)",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundAttachment: "scroll",
      // Changed from 'fixed' for better mobile support
      backgroundRepeat: "no-repeat"
    }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: {
        position: "sticky",
        top: 0,
        zIndex: 10,
        paddingTop: "calc(env(safe-area-inset-top) * 0.2 + 4px)",
        paddingBottom: 0.5,
        px: 1,
        backgroundColor: "transparent",
        flexShrink: 0
      }, children: [
        isExpired && /* @__PURE__ */ jsxRuntimeExports.jsx(
          Alert,
          {
            severity: "error",
            icon: /* @__PURE__ */ jsxRuntimeExports.jsx(WarningIcon, {}),
            sx: { mb: 2, py: 0.75, fontSize: "0.85rem", width: "100%" },
            children: "Payment overdue. Update payment to continue."
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Paper, { sx: {
          p: 0.5,
          mb: 0,
          background: "transparent",
          border: "none",
          boxShadow: "none",
          width: "100%",
          maxWidth: "100%",
          overflowX: "hidden",
          overflow: "hidden"
        }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", spacing: 0.25, alignItems: "center", justifyContent: "space-between", sx: { flexWrap: "nowrap", gap: 0.25 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", spacing: 0.5, alignItems: "center", sx: { flex: 1, minWidth: 0 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Avatar,
              {
                src: "/hero.png?v=13",
                alt: "StrainSpotter",
                sx: {
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "1px solid rgba(124, 179, 66, 0.6)",
                  flexShrink: 0
                }
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { minWidth: 0, flex: 1 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "#fff", fontWeight: 700, fontSize: "0.8rem", lineHeight: 1.1, mb: 0 }, children: "The Garden" }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", spacing: 0.25, alignItems: "center", sx: { flexWrap: "nowrap", gap: 0.25, justifyContent: "flex-end" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { onClick: /* @__PURE__ */ __name(() => setShowBuyScans(true), "onClick"), sx: { cursor: "pointer" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(CreditBalance, {}) }),
            onBack && /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "text",
                size: "small",
                onClick: onBack,
                sx: {
                  color: "#CDDC39",
                  fontSize: "0.65rem",
                  py: 0.15,
                  px: 0.5,
                  minWidth: "auto",
                  textTransform: "none",
                  "&:hover": {
                    background: "rgba(124, 179, 66, 0.2)"
                  }
                },
                children: "Home"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "text",
                size: "small",
                onClick: handleLogout,
                sx: {
                  color: "#CDDC39",
                  fontSize: "0.65rem",
                  py: 0.15,
                  px: 0.5,
                  minWidth: "auto",
                  textTransform: "none",
                  "&:hover": {
                    background: "rgba(124, 179, 66, 0.2)"
                  }
                },
                children: "Logout"
              }
            )
          ] })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Box,
        {
          sx: {
            flex: 1,
            minHeight: 0,
            width: "100%",
            maxWidth: "100%",
            overflowY: "auto",
            overflowX: "hidden",
            WebkitOverflowScrolling: "touch",
            px: 1,
            pb: "calc(env(safe-area-inset-bottom) + 16px)",
            pt: 1,
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexDirection: "column"
          },
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            Grid,
            {
              container: true,
              spacing: 1,
              sx: {
                width: "100%",
                maxWidth: "100%",
                justifyContent: "flex-start",
                mx: 0,
                flex: 1,
                overflowY: "auto",
                overflowX: "hidden",
                WebkitOverflowScrolling: "touch",
                display: "flex",
                alignContent: "flex-start",
                alignItems: "stretch",
                py: 0.5,
                px: { xs: 0.5, sm: 1, md: 2 }
              },
              children: tiles.map((tile) => /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { item: true, xs: 4, sm: 3, sx: { display: "flex", justifyContent: "center", minHeight: "80px" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Paper,
                {
                  onClick: /* @__PURE__ */ __name(() => handleFeatureClick(tile.title, tile.nav), "onClick"),
                  sx: {
                    p: 1,
                    textAlign: "center",
                    cursor: "pointer",
                    background: "rgba(0, 0, 0, 0.3)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    border: "1px solid rgba(124, 179, 66, 0.3)",
                    borderRadius: 2,
                    transition: "all 0.2s ease",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
                    position: "relative",
                    overflow: "hidden",
                    width: "100%",
                    height: "100%",
                    minHeight: "80px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 0.5,
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      top: "-50%",
                      left: "-50%",
                      width: "200%",
                      height: "200%",
                      background: "radial-gradient(circle, rgba(124, 179, 66, 0.15) 0%, transparent 70%)",
                      opacity: 0,
                      transition: "opacity 0.2s ease"
                    },
                    "&:hover": {
                      background: "rgba(124, 179, 66, 0.15)",
                      border: "1px solid rgba(124, 179, 66, 0.6)",
                      transform: "translateY(-1px) scale(1.02)",
                      boxShadow: "0 4px 12px rgba(124, 179, 66, 0.4)",
                      "&::before": {
                        opacity: 1
                      }
                    },
                    "&:active": {
                      transform: "translateY(0px) scale(0.99)",
                      transition: "all 0.1s ease"
                    }
                  },
                  children: [
                    tile.useEmoji ? /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: {
                      fontSize: "1.5rem",
                      lineHeight: 1,
                      mb: 0.25,
                      filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4))",
                      transition: "all 0.2s ease",
                      textAlign: "center",
                      width: "100%"
                    }, children: tile.image }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: {
                      width: "32px",
                      height: "32px",
                      mb: 0.25,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "50%",
                      border: "1px solid rgba(124, 179, 66, 0.5)",
                      boxShadow: "0 0 8px rgba(124, 179, 66, 0.4)",
                      overflow: "hidden",
                      background: "transparent",
                      transition: "all 0.2s ease",
                      mx: "auto"
                    }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "img",
                      {
                        src: tile.image,
                        alt: tile.title,
                        style: { width: "100%", height: "100%", objectFit: "cover" }
                      }
                    ) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "caption", sx: {
                      color: "#CDDC39",
                      fontWeight: 600,
                      fontSize: "0.7rem",
                      lineHeight: 1.2,
                      mb: 0,
                      display: "block",
                      textShadow: "0 1px 3px rgba(0, 0, 0, 0.7)",
                      transition: "all 0.2s ease",
                      textAlign: "center",
                      width: "100%"
                    }, children: tile.title })
                  ]
                }
              ) }, tile.nav))
            }
          )
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Dialog,
        {
          open: showLogoutWarning,
          onClose: /* @__PURE__ */ __name(() => setShowLogoutWarning(false), "onClose"),
          fullScreen: true,
          PaperProps: {
            sx: {
              bgcolor: "#1a1a1a",
              m: 0,
              maxHeight: "100vh"
            }
          },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { sx: { bgcolor: "#ff5252", color: "#fff", borderBottom: "1px solid rgba(255,255,255,0.2)" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", spacing: 1, alignItems: "center", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(WarningIcon, {}),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Cannot Logout" })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { sx: { mt: 2, bgcolor: "#1a1a1a", color: "#fff" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body1", sx: { mb: 2 }, children: "Your membership payment is overdue. You must resolve your payment before you can logout." }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", color: "text.secondary", children: "Please update your payment method or contact support for assistance." }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  variant: "contained",
                  fullWidth: true,
                  sx: { mt: 3, bgcolor: "#7cb342", "&:hover": { bgcolor: "#689f38" } },
                  onClick: /* @__PURE__ */ __name(() => setShowLogoutWarning(false), "onClick"),
                  children: "Update Payment Method"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  variant: "outlined",
                  fullWidth: true,
                  color: "error",
                  sx: { mt: 1 },
                  onClick: /* @__PURE__ */ __name(async () => {
                    try {
                      await supabase.auth.signOut();
                      localStorage.clear();
                      sessionStorage.clear();
                      setShowLogoutWarning(false);
                      onBack?.();
                    } catch (e) {
                      console.error("Force logout failed:", e);
                    }
                  }, "onClick"),
                  children: "Force Logout Anyway"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  variant: "text",
                  fullWidth: true,
                  sx: { mt: 1 },
                  onClick: /* @__PURE__ */ __name(() => setShowLogoutWarning(false), "onClick"),
                  children: "Close"
                }
              )
            ] })
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Fab,
        {
          color: "success",
          "aria-label": "feedback",
          onClick: /* @__PURE__ */ __name(() => isAdmin ? setShowFeedbackReader(true) : setShowFeedback(true), "onClick"),
          sx: {
            position: "fixed",
            bottom: 16,
            right: 16,
            zIndex: 1e3,
            bgcolor: "#7cb342",
            "&:hover": {
              bgcolor: "#689f38"
            }
          },
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(FeedbackIcon, {})
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        FeedbackModal,
        {
          open: showFeedback,
          onClose: /* @__PURE__ */ __name(() => setShowFeedback(false), "onClose"),
          user
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        BuyScansModal,
        {
          open: showBuyScans,
          onClose: /* @__PURE__ */ __name(() => setShowBuyScans(false), "onClose"),
          currentTier: "free",
          creditsRemaining: 0
        }
      )
    ] })
  );
}
__name(Garden, "Garden");
function Home({ onNavigate }) {
  const [scanButtonBusy, setScanButtonBusy] = reactExports.useState(false);
  const [showGarden, setShowGarden] = reactExports.useState(false);
  const [inGarden, setInGarden] = reactExports.useState(false);
  const [showFeedback, setShowFeedback] = reactExports.useState(false);
  const { user } = useAuth();
  const isAdmin = isAdminEmail(user?.email);
  const handleScanClick = /* @__PURE__ */ __name(() => {
    if (scanButtonBusy) return;
    setScanButtonBusy(true);
    if (typeof onNavigate === "function") {
      onNavigate("scanner");
    }
    setTimeout(() => {
      setScanButtonBusy(false);
    }, 2500);
  }, "handleScanClick");
  if (showGarden && !inGarden) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      GardenGate,
      {
        onSuccess: /* @__PURE__ */ __name(() => {
          setInGarden(true);
        }, "onSuccess"),
        onBack: /* @__PURE__ */ __name(() => setShowGarden(false), "onBack")
      }
    );
  }
  if (inGarden) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      Garden,
      {
        onNavigate,
        onBack: /* @__PURE__ */ __name(() => {
          setInGarden(false);
          setShowGarden(false);
        }, "onBack")
      }
    );
  }
  const features = [
    {
      emoji: "📷",
      title: "AI Strain Scan",
      description: "Snap a photo of any cannabis flower, and our advanced AI instantly identifies the strain from our database of over 35,000 varieties. Get detailed strain information including genetics, effects, terpene profiles, and growing characteristics in seconds."
    },
    {
      emoji: "🌿",
      title: "Strain Browser",
      description: "Explore our comprehensive database of 35,000+ cannabis strains. Search by name, effects, terpenes, THC/CBD content, or growing difficulty. Discover new favorites, compare strains, and learn about genetics, lineage, and cultivation tips for each variety."
    },
    {
      emoji: "⭐",
      title: "Reviews Hub",
      description: "Read and share authentic strain reviews from real users. Get insights on effects, taste, growing experience, and medical benefits. Rate your experiences and help the community discover the best strains for their needs."
    },
    {
      emoji: "👥",
      title: "Community Groups",
      description: "Connect with fellow growers, enthusiasts, and cannabis professionals. Join discussions, share grow diaries, ask questions, and build your network. Whether you're a beginner or master cultivator, find your tribe here."
    },
    {
      emoji: "🌱",
      title: "Grow Coach",
      description: "Access expert growing tips, guides, and tutorials covering everything from seed to harvest. Learn about lighting, nutrients, pest management, training techniques, and harvesting. Level up your cultivation skills with proven strategies."
    },
    {
      emoji: "📓",
      title: "Grow Logbook",
      description: "Track every stage of your grow with detailed journaling. Record watering schedules, nutrient feeds, environmental conditions, and observations. Monitor progress with photos, set reminders, and build a searchable history of all your grows."
    },
    {
      emoji: "🧑‍🌾",
      title: "Grower Directory",
      description: "Find local cultivators, breeders, and cannabis professionals in your area. Browse profiles, connect with growers, share knowledge, and discover local expertise. Whether you're looking for mentors or collaborators, find them here."
    },
    {
      emoji: "🌾",
      title: "Seed Vendors",
      description: "Discover trusted seed banks and breeders with verified reviews from the community. Compare prices, shipping options, and genetics. Find the perfect seeds for your next grow with confidence from reputable sources."
    },
    {
      emoji: "🏪",
      title: "Dispensaries",
      description: "Locate nearby dispensaries using your location. Find shops with your favorite strains in stock, check hours and menus, read reviews, and get directions. Never wonder where to find quality cannabis again."
    }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Box,
    {
      component: "main",
      sx: {
        width: "100vw",
        backgroundColor: "#0a0f0a !important",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflowY: "auto",
        overflowX: "hidden",
        WebkitOverflowScrolling: "touch",
        zIndex: 100
      },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Container,
          {
            maxWidth: "md",
            sx: {
              position: "relative",
              zIndex: 1,
              py: 4,
              px: 3,
              pb: 8,
              minHeight: "auto"
            },
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 4, alignItems: "center", sx: { width: "100%" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 3, alignItems: "center", textAlign: "center", sx: { width: "100%" }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Box,
                  {
                    sx: {
                      width: 120,
                      height: 120,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, rgba(124, 179, 66, 0.2) 0%, rgba(156, 204, 101, 0.2) 100%)",
                      border: "3px solid rgba(124, 179, 66, 0.6)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 0 40px rgba(124, 179, 66, 0.6), 0 0 80px rgba(124, 179, 66, 0.3), inset 0 0 20px rgba(124, 179, 66, 0.1)",
                      animation: "pulse 3s ease-in-out infinite",
                      "@keyframes pulse": {
                        "0%, 100%": {
                          boxShadow: "0 0 40px rgba(124, 179, 66, 0.6), 0 0 80px rgba(124, 179, 66, 0.3)"
                        },
                        "50%": {
                          boxShadow: "0 0 60px rgba(124, 179, 66, 0.8), 0 0 120px rgba(124, 179, 66, 0.4)"
                        }
                      }
                    },
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "img",
                      {
                        src: "/hero.png?v=13",
                        alt: "StrainSpotter",
                        style: {
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          borderRadius: "50%"
                        }
                      }
                    )
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Typography,
                  {
                    variant: "h3",
                    sx: {
                      fontFamily: "Poppins, sans-serif",
                      fontWeight: 900,
                      background: "linear-gradient(135deg, #CDDC39 0%, #9CCC65 50%, #7CB342 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      fontSize: { xs: "2.5rem", sm: "3rem" },
                      lineHeight: 1.1,
                      textShadow: "0 0 30px rgba(124, 179, 66, 0.5)",
                      filter: "drop-shadow(0 0 20px rgba(124, 179, 66, 0.4))"
                    },
                    children: "StrainSpotter"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Typography,
                  {
                    variant: "h6",
                    sx: {
                      color: "#d0d0d0",
                      fontSize: "1.1rem",
                      maxWidth: 600,
                      lineHeight: 1.6,
                      textShadow: "0 2px 8px rgba(0, 0, 0, 0.5)",
                      fontWeight: 400
                    },
                    children: "AI-powered cannabis strain identification and comprehensive grow journaling platform"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: { xs: "column", sm: "row" }, spacing: 2, sx: { width: "100%", maxWidth: 500, mt: 1 }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Button,
                    {
                      variant: "contained",
                      size: "large",
                      fullWidth: true,
                      onClick: handleScanClick,
                      disabled: scanButtonBusy,
                      startIcon: /* @__PURE__ */ jsxRuntimeExports.jsx(CameraAltIcon, {}),
                      sx: {
                        py: 1.5,
                        textTransform: "none",
                        fontSize: "1.05rem",
                        fontWeight: 600,
                        opacity: scanButtonBusy ? 0.8 : 1,
                        borderRadius: "16px",
                        background: "linear-gradient(135deg, #7CB342 0%, #9CCC65 50%, #CDDC39 100%)",
                        boxShadow: "0 8px 32px rgba(124, 179, 66, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
                        transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
                        "&:hover": {
                          transform: scanButtonBusy ? "none" : "translateY(-3px) scale(1.02)",
                          boxShadow: "0 12px 40px rgba(124, 179, 66, 0.7), 0 0 60px rgba(124, 179, 66, 0.3)",
                          background: "linear-gradient(135deg, #8BC34A 0%, #AED581 50%, #CDDC39 100%)"
                        },
                        "&:active": {
                          transform: "translateY(-1px) scale(0.98)",
                          transition: "all 0.05s ease"
                        }
                      },
                      children: [
                        scanButtonBusy && /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Box,
                          {
                            component: "span",
                            className: "scan-button-spinner"
                          }
                        ),
                        scanButtonBusy ? "Opening scanner…" : "Scan a Strain"
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Button,
                    {
                      variant: "outlined",
                      size: "large",
                      fullWidth: true,
                      onClick: /* @__PURE__ */ __name(() => setShowGarden(true), "onClick"),
                      startIcon: /* @__PURE__ */ jsxRuntimeExports.jsx(SpaIcon, {}),
                      sx: {
                        py: 1.5,
                        fontSize: "1.05rem",
                        fontWeight: 700,
                        borderRadius: "16px",
                        border: "2px solid rgba(124, 179, 66, 0.7)",
                        color: "#CDDC39",
                        background: "rgba(124, 179, 66, 0.1)",
                        backdropFilter: "blur(10px)",
                        textTransform: "none",
                        transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
                        boxShadow: "0 4px 16px rgba(124, 179, 66, 0.2), inset 0 1px 0 rgba(124, 179, 66, 0.2)",
                        "&:hover": {
                          border: "2px solid rgba(124, 179, 66, 1)",
                          background: "rgba(124, 179, 66, 0.2)",
                          transform: "translateY(-3px) scale(1.02)",
                          boxShadow: "0 8px 32px rgba(124, 179, 66, 0.4), inset 0 1px 0 rgba(124, 179, 66, 0.3)",
                          color: "#fff"
                        },
                        "&:active": {
                          transform: "translateY(-1px) scale(0.98)",
                          transition: "all 0.05s ease"
                        }
                      },
                      children: "Enter the Garden"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Typography,
                  {
                    variant: "body2",
                    sx: {
                      color: "#7CB342",
                      fontSize: "0.95rem",
                      fontWeight: 600,
                      mt: 1
                    },
                    children: "35,000+ strains • Instant AI identification • Complete grow tools • Active community"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Divider, { sx: { width: "100%", borderColor: "rgba(124, 179, 66, 0.3)" } }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 3, sx: { width: "100%" }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Typography,
                  {
                    variant: "h5",
                    sx: {
                      color: "#CDDC39",
                      fontWeight: 700,
                      textAlign: "center",
                      textShadow: "0 2px 8px rgba(0, 0, 0, 0.5)"
                    },
                    children: "Everything You Need for Cannabis"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { container: true, spacing: 2, children: features.map((feature, index) => /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { item: true, xs: 12, sm: 6, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Paper,
                  {
                    sx: {
                      p: 3,
                      background: "rgba(0, 0, 0, 0.4)",
                      backdropFilter: "blur(12px)",
                      border: "2px solid rgba(124, 179, 66, 0.3)",
                      borderRadius: 3,
                      transition: "all 0.2s ease",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      "&:hover": {
                        background: "rgba(124, 179, 66, 0.15)",
                        border: "2px solid rgba(124, 179, 66, 0.6)",
                        transform: "translateY(-2px)",
                        boxShadow: "0 6px 20px rgba(124, 179, 66, 0.4)"
                      }
                    },
                    children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", spacing: 2, alignItems: "flex-start", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Box,
                        {
                          sx: {
                            fontSize: "3rem",
                            lineHeight: 1,
                            flexShrink: 0,
                            filter: "drop-shadow(0 3px 6px rgba(0, 0, 0, 0.4))"
                          },
                          children: feature.emoji
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { flex: 1, minWidth: 0 }, children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Typography,
                          {
                            variant: "h6",
                            sx: {
                              color: "#CDDC39",
                              fontWeight: 700,
                              mb: 1,
                              fontSize: "1.25rem",
                              textShadow: "0 2px 4px rgba(0, 0, 0, 0.7)"
                            },
                            children: feature.title
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Typography,
                          {
                            variant: "body2",
                            sx: {
                              color: "#d0d0d0",
                              lineHeight: 1.6,
                              fontSize: "0.95rem",
                              textShadow: "0 1px 3px rgba(0, 0, 0, 0.5)"
                            },
                            children: feature.description
                          }
                        )
                      ] })
                    ] })
                  }
                ) }, index)) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Divider, { sx: { width: "100%", borderColor: "rgba(124, 179, 66, 0.3)" } }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 2, alignItems: "center", sx: { width: "100%", pb: 4 }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Typography,
                  {
                    variant: "h6",
                    sx: {
                      color: "#CDDC39",
                      fontWeight: 700,
                      textAlign: "center",
                      textShadow: "0 2px 8px rgba(0, 0, 0, 0.5)"
                    },
                    children: "Ready to Get Started?"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: { xs: "column", sm: "row" }, spacing: 2, sx: { width: "100%", maxWidth: 500 }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Button,
                    {
                      variant: "contained",
                      size: "large",
                      fullWidth: true,
                      onClick: handleScanClick,
                      disabled: scanButtonBusy,
                      startIcon: /* @__PURE__ */ jsxRuntimeExports.jsx(CameraAltIcon, {}),
                      sx: {
                        py: 1.5,
                        textTransform: "none",
                        fontSize: "1.05rem",
                        fontWeight: 600,
                        borderRadius: "16px",
                        background: "linear-gradient(135deg, #7CB342 0%, #9CCC65 50%, #CDDC39 100%)",
                        boxShadow: "0 8px 32px rgba(124, 179, 66, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
                        "&:hover": {
                          background: "linear-gradient(135deg, #8BC34A 0%, #AED581 50%, #CDDC39 100%)",
                          transform: "translateY(-2px)"
                        }
                      },
                      children: "Start Scanning"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Button,
                    {
                      variant: "outlined",
                      size: "large",
                      fullWidth: true,
                      onClick: /* @__PURE__ */ __name(() => setShowGarden(true), "onClick"),
                      startIcon: /* @__PURE__ */ jsxRuntimeExports.jsx(SpaIcon, {}),
                      sx: {
                        py: 1.5,
                        fontSize: "1.05rem",
                        fontWeight: 700,
                        borderRadius: "16px",
                        border: "2px solid rgba(124, 179, 66, 0.7)",
                        color: "#CDDC39",
                        background: "rgba(124, 179, 66, 0.1)",
                        backdropFilter: "blur(10px)",
                        textTransform: "none",
                        "&:hover": {
                          border: "2px solid rgba(124, 179, 66, 1)",
                          background: "rgba(124, 179, 66, 0.2)",
                          transform: "translateY(-2px)"
                        }
                      },
                      children: "Explore the Garden"
                    }
                  )
                ] })
              ] }),
              isAdmin && /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  variant: "text",
                  size: "small",
                  startIcon: /* @__PURE__ */ jsxRuntimeExports.jsx(TroubleshootIcon, { fontSize: "small" }),
                  onClick: /* @__PURE__ */ __name(() => onNavigate("admin-status"), "onClick"),
                  sx: { color: "#A5D6A7", textTransform: "none" },
                  children: "Status & debug tools"
                }
              )
            ] })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Fab,
          {
            color: "primary",
            size: "small",
            onClick: /* @__PURE__ */ __name(() => setShowFeedback(true), "onClick"),
            sx: {
              position: "fixed",
              bottom: 16,
              right: 16,
              zIndex: 1e3,
              background: "linear-gradient(135deg, #7CB342 0%, #9CCC65 100%)",
              boxShadow: "0 4px 12px rgba(124, 179, 66, 0.3)",
              width: 48,
              height: 48
            },
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(FeedbackIcon, { fontSize: "small" })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          FeedbackModal,
          {
            open: showFeedback,
            onClose: /* @__PURE__ */ __name(() => setShowFeedback(false), "onClose"),
            user: null
          }
        )
      ]
    }
  );
}
__name(Home, "Home");
export {
  Home as default
};
