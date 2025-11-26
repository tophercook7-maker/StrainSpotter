const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./Home-BtSaBtrJ.js","./react-vendor-DaVUs1pH.js","./vendor-qR99EfKL.js","./ScanWizard-3GRG4iak.js","./SeedVendorFinder-CxxEvy7T.js","./BackHeader-jwQJOBEe.js","./ScanResultCard-BGx_BhU_.js","./useStrainImage-Dsgj-zte.js","./useCanScan-DUbcGzHt.js","./useCreditBalance-C4unyUsC.js","./StrainBrowser-2GO7PxJ2.js","./JournalDialog-z8hMBNLf.js","./EmptyStateCard-BPZgdi7J.js","./Groups-CLalY7JD.js","./GrowCoach-Cm1-I2Km.js","./GrowerDirectory-d7DekxV7.js","./GrowerRegistration-BBLqKBpW.js","./BuyScansModal-JP2lRnaq.js","./roles-MIh-dFq-.js","./ScanPage-CswYfv2A.js","./HistoryPage-WKqUYRAb.js","./AnalyticsDashboard-DXOPpt0y.js","./ScanHistory-DtdhQvzh.js","./router-vendor-CizxVMW3.js","./FeedbackChat-BOLRVgu1.js","./Seeds-DJXGhCAz.js","./Dispensaries-55twzzgv.js","./Help-CoGL6l-t.js","./Friends-Cndj6Li8.js","./MembershipJoin-BtpMS-Hu.js","./MembershipAdmin-Cam2JYoG.js","./PipelineStatus-CAxhMqHj.js","./ModerationDashboard-Cx41FFY6.js","./Guidelines-BXztXynZ.js","./ErrorViewer-BvaX2f3-.js","./EmergencyLogout-_y1jlgAh.js","./OnboardingFlow-CPeYAnlO.js","./FirstRunIntro-Dy621NAN.js","./JournalPage-D69lYRdD.js","./FloatingScanButton-B3Y03CKx.js","./ScanBalanceIndicator-v9tIH_4m.js","./AdminStatus-CqvuM8ri.js"])))=>i.map(i=>d[i]);
var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { B as createClient, A as __vitePreload } from "./vendor-qR99EfKL.js";
import { r as reactExports, j as jsxRuntimeExports, B as Box, C as Container, T as Typography, F as Fade, f as Card, h as CardContent, G as Grow, L as LocalFloristIcon, S as Stack, V as VerifiedIcon, i as Button, A as Alert, k as Tabs, l as Tab, m as TextField, n as CircularProgress, o as Link, D as Dialog, p as DialogTitle, q as DialogContent, s as FormControlLabel, t as Checkbox, u as DialogActions, R as React, v as ThemeProvider, w as createTheme, x as CssBaseline } from "./react-vendor-DaVUs1pH.js";
const SUPABASE_URL = "https://rdqpxixsbqcsyfewcmbz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkcXB4aXhzYnFjc3lmZXdjbWJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMjI3NTMsImV4cCI6MjA3NTY5ODc1M30.rTbYZNKNv1szvzjA2D828OVt7qUZVSXgi4G_tUqm3mA";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Explicitly use localStorage for web to keep users signed in across reloads
    storage: typeof window !== "undefined" ? window.localStorage : void 0
  }
});
function isAuthConfigured() {
  return Boolean(SUPABASE_ANON_KEY);
}
__name(isAuthConfigured, "isAuthConfigured");
const AuthContext = reactExports.createContext({
  user: null,
  session: null,
  loading: true,
  signOut: /* @__PURE__ */ __name(() => {
  }, "signOut")
});
const envCandidates = [
  "https://strainspotter.onrender.com",
  void 0,
  "https://strainspotter.onrender.com",
  void 0
].map((value) => typeof value === "string" ? value.trim() : "").filter(Boolean);
const fromEnv = envCandidates.length ? envCandidates[0] : "";
const isLocalhost = typeof window !== "undefined" && /localhost|127\.0\.0\.1/.test(window.location.host);
const isEnvLocal = fromEnv && /localhost|127\.0\.0\.1/.test(fromEnv);
const isCapacitor = typeof window !== "undefined" && window.location.protocol === "capacitor:";
const DEFAULT_REMOTE_API = "https://strainspotter.onrender.com";
const resolvedForLocal = isCapacitor ? !fromEnv || /localhost|127\.0\.0\.1/.test(fromEnv) ? DEFAULT_REMOTE_API : fromEnv : isLocalhost ? isEnvLocal ? fromEnv : "http://localhost:5181" : fromEnv || DEFAULT_REMOTE_API;
const API_BASE = resolvedForLocal.replace(/\/$/, "");
console.log("[Config] API_BASE:", API_BASE);
console.log("[Config] isCapacitor:", isCapacitor);
console.log("[Config] isLocalhost:", isLocalhost);
if (!isLocalhost && !isCapacitor && !fromEnv) {
  console.warn("[Config] VITE_API_BASE not set. Falling back to default remote API.");
}
const functionsFallback = `${API_BASE}/api`;
const FUNCTIONS_BASE = functionsFallback.replace(/\/$/, "");
const FOUNDER_EMAIL = "topher.cook7@gmail.com";
const FOUNDER_UNLIMITED_ENABLED = true;
function isFounderUser(user) {
  if (!user) return false;
  const email = user.email?.toLowerCase() ?? "";
  if (email === "topher.cook7@gmail.com" || email === "strainspotter25@gmail.com") {
    return true;
  }
  const metadata = user.user_metadata || {};
  if (metadata.role === "founder" || metadata.isFounder === true) {
    return true;
  }
  return false;
}
__name(isFounderUser, "isFounderUser");
function isFounderEmail(email) {
  if (!email || typeof email !== "string") return false;
  return email.toLowerCase().trim() === FOUNDER_EMAIL.toLowerCase();
}
__name(isFounderEmail, "isFounderEmail");
function augmentSession(session) {
  if (!session?.user?.email) return session;
  const email = session.user.email;
  if (isFounderEmail(email)) {
    return {
      ...session,
      user: {
        ...session.user,
        creditStatus: {
          unlimited: true,
          remainingScans: Number.POSITIVE_INFINITY,
          membershipTier: "founder_unlimited",
          isMember: true,
          canScan: true
        }
      }
    };
  }
  return session;
}
__name(augmentSession, "augmentSession");
function AuthProvider({ children }) {
  const [user, setUser] = reactExports.useState(null);
  const [session, setSession] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  const isFounder = isFounderUser(user || session?.user);
  const email = (session?.user?.email || user?.email || "").toLowerCase().trim();
  reactExports.useEffect(() => {
    if (email) {
      console.log("[FounderDebug]", {
        email,
        FOUNDER_UNLIMITED_ENABLED,
        isFounder
      });
    }
  }, [email, isFounder]);
  reactExports.useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data: { session: session2 } }) => {
      console.log("[AuthContext] Initial session:", session2?.user?.email || "none");
      const augmentedSession = augmentSession(session2);
      setSession(augmentedSession);
      setUser(augmentedSession?.user ?? null);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session2) => {
        console.log("[AuthContext] Auth state change:", event, session2?.user?.email || "none");
        const augmentedSession = augmentSession(session2);
        setSession(augmentedSession);
        setUser(augmentedSession?.user ?? null);
        setLoading(false);
        if (session2?.user?.id && (event === "SIGNED_IN" || event === "USER_UPDATED")) {
          try {
            await fetch(`${API_BASE}/api/users/ensure`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                user_id: session2.user.id,
                email: session2.user.email,
                username: session2.user.user_metadata?.username || session2.user.email?.split("@")[0] || `user_${session2.user.id.substring(0, 8)}`
              })
            });
            console.log("[AuthContext] User record ensured for:", session2.user.email);
          } catch (err) {
            console.error("[AuthContext] Failed to ensure user record:", err);
          }
        }
      }
    );
    return () => subscription.unsubscribe();
  }, []);
  const signOut = /* @__PURE__ */ __name(async () => {
    if (supabase) {
      await supabase.auth.signOut();
      console.log("[AuthContext] User signed out");
    }
  }, "signOut");
  const value = {
    user,
    session,
    loading,
    signOut,
    // Founder flags — exposed for hooks to use
    isFounder: Boolean(isFounder),
    FOUNDER_UNLIMITED_ENABLED: Boolean(FOUNDER_UNLIMITED_ENABLED)
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AuthContext.Provider, { value, children });
}
__name(AuthProvider, "AuthProvider");
function useAuth() {
  const context = reactExports.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
__name(useAuth, "useAuth");
const ProModeContext = reactExports.createContext(null);
function ProModeProvider({ children }) {
  const { user, session } = useAuth();
  const [proRole, setProRole] = reactExports.useState(null);
  const [proEnabled, setProEnabled] = reactExports.useState(false);
  const [proLoading, setProLoading] = reactExports.useState(false);
  const founderValue = reactExports.useMemo(() => {
    const isFounder = isFounderUser(user || session?.user);
    const envFlag = true;
    const founderUnlimitedEnabled = isFounder && envFlag;
    return { isFounder, founderUnlimitedEnabled };
  }, [user, session]);
  reactExports.useEffect(() => {
    try {
      const raw = localStorage.getItem("strainspotter_pro_mode");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && (parsed.proRole === "dispensary" || parsed.proRole === "grower")) {
        setProRole(parsed.proRole);
        setProEnabled(!!parsed.proEnabled);
      }
    } catch (e) {
      console.warn("[ProMode] Failed to parse local storage", e);
    }
  }, []);
  function persist(next) {
    try {
      localStorage.setItem("strainspotter_pro_mode", JSON.stringify(next));
    } catch (e) {
      console.warn("[ProMode] Failed to persist", e);
    }
  }
  __name(persist, "persist");
  async function activateProWithCode(code) {
    setProLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/pro/validate-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ code })
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        let errorMessage = "Invalid access code. Please check and try again.";
        try {
          const errorData = JSON.parse(text);
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch {
        }
        throw new Error(errorMessage);
      }
      const data = await res.json();
      if (!data.ok || !data.role) {
        throw new Error("Invalid response from server.");
      }
      setProRole(data.role);
      setProEnabled(true);
      persist({ proRole: data.role, proEnabled: true });
      return { ok: true, role: data.role };
    } catch (err) {
      console.error("[ProMode] activateProWithCode error", err);
      throw err;
    } finally {
      setProLoading(false);
    }
  }
  __name(activateProWithCode, "activateProWithCode");
  function clearProMode() {
    setProRole(null);
    setProEnabled(false);
    persist({ proRole: null, proEnabled: false });
  }
  __name(clearProMode, "clearProMode");
  const value = {
    proRole,
    proEnabled,
    proLoading,
    activateProWithCode,
    clearProMode,
    // Founder flags
    isFounder: founderValue.isFounder,
    founderUnlimitedEnabled: founderValue.founderUnlimitedEnabled
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(ProModeContext.Provider, { value, children });
}
__name(ProModeProvider, "ProModeProvider");
function useProMode() {
  const ctx = reactExports.useContext(ProModeContext);
  if (!ctx) throw new Error("useProMode must be used within ProModeProvider");
  return ctx;
}
__name(useProMode, "useProMode");
function MobileOnlyGuard({ children }) {
  const [isMobile, setIsMobile] = reactExports.useState(true);
  const [isProduction, setIsProduction] = reactExports.useState(false);
  const [isWeb, setIsWeb] = reactExports.useState(false);
  reactExports.useEffect(() => {
    const isWebMode = typeof window !== "undefined" && window.location.protocol !== "capacitor:";
    setIsWeb(isWebMode);
    const isProd = true;
    setIsProduction(isProd);
    const checkDevice = /* @__PURE__ */ __name(() => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i.test(userAgent);
      const isSmallScreen = window.innerWidth <= 1024;
      setIsMobile(isMobileDevice || isSmallScreen);
    }, "checkDevice");
    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);
  if (isWeb) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children });
  }
  if (!isProduction) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bgcolor: "rgba(255, 152, 0, 0.9)",
        color: "#fff",
        py: 0.5,
        px: 2,
        zIndex: 9999,
        textAlign: "center",
        fontSize: "0.75rem",
        fontWeight: 600
      }, children: "🔧 DEV MODE - Desktop access enabled for development" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { pt: { xs: 0, sm: 4 } }, children })
    ] });
  }
  if (isProduction && !isMobile) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Container, { maxWidth: "sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: {
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      px: 3,
      background: "linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)"
    }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: {
      bgcolor: "rgba(124, 179, 66, 0.1)",
      border: "2px solid rgba(124, 179, 66, 0.3)",
      borderRadius: 4,
      p: 4,
      maxWidth: 400
    }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h4", sx: {
        color: "#9CCC65",
        fontWeight: 700,
        mb: 2,
        fontSize: { xs: "1.5rem", sm: "2rem" }
      }, children: "📱 Mobile Only" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body1", sx: {
        color: "#fff",
        mb: 3,
        lineHeight: 1.6
      }, children: "StrainSpotter is designed exclusively for mobile devices and tablets." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: {
        color: "rgba(255, 255, 255, 0.7)",
        mb: 2
      }, children: "Please access this app from:" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: {
        bgcolor: "rgba(0, 0, 0, 0.3)",
        borderRadius: 2,
        p: 2,
        mb: 3
      }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "#9CCC65", mb: 1 }, children: "📱 iPhone or Android phone" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "#9CCC65" }, children: "📱 iPad or Android tablet" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "caption", sx: {
        color: "rgba(255, 255, 255, 0.5)",
        display: "block",
        mt: 2
      }, children: "Scan the QR code with your mobile device or visit this URL on your phone" })
    ] }) }) });
  }
  return children;
}
__name(MobileOnlyGuard, "MobileOnlyGuard");
function AgeGate({ onVerify }) {
  const [show, setShow] = reactExports.useState(false);
  reactExports.useEffect(() => {
    setShow(true);
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Box,
    {
      sx: {
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0a1f0a 0%, #1a3a1a 25%, #2d5a2d 50%, #1a3a1a 75%, #0a1f0a 100%)",
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            radial-gradient(circle at 20% 30%, rgba(76, 175, 80, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(139, 195, 74, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(124, 179, 66, 0.1) 0%, transparent 70%)
          `,
          animation: "pulse 8s ease-in-out infinite",
          "@keyframes pulse": {
            "0%, 100%": { opacity: 0.5 },
            "50%": { opacity: 1 }
          }
        },
        "&::after": {
          content: '""',
          position: "absolute",
          top: "-50%",
          left: "-50%",
          width: "200%",
          height: "200%",
          background: `
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(76, 175, 80, 0.03) 2px,
              rgba(76, 175, 80, 0.03) 4px
            )
          `,
          animation: "scan 20s linear infinite",
          "@keyframes scan": {
            "0%": { transform: "translateY(0)" },
            "100%": { transform: "translateY(50px)" }
          }
        }
      },
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(Container, { maxWidth: "sm", sx: { position: "relative", zIndex: 1 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Fade, { in: show, timeout: 1e3, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        Card,
        {
          elevation: 24,
          sx: {
            background: "linear-gradient(135deg, rgba(28, 28, 28, 0.95) 0%, rgba(31, 58, 31, 0.95) 100%)",
            backdropFilter: "blur(20px)",
            border: "2px solid transparent",
            backgroundClip: "padding-box",
            position: "relative",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: "inherit",
              padding: "2px",
              background: "linear-gradient(135deg, #4caf50, #8bc34a, #4caf50)",
              WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              WebkitMaskComposite: "xor",
              maskComposite: "exclude",
              animation: "borderGlow 3s ease-in-out infinite",
              "@keyframes borderGlow": {
                "0%, 100%": { opacity: 0.5 },
                "50%": { opacity: 1 }
              }
            }
          },
          children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { sx: { p: 5, textAlign: "center" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Grow, { in: show, timeout: 1200, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { position: "relative", display: "inline-block", mb: 2 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                LocalFloristIcon,
                {
                  sx: {
                    fontSize: 120,
                    color: "#4caf50",
                    filter: "drop-shadow(0 0 30px rgba(76, 175, 80, 0.8))",
                    animation: "float 3s ease-in-out infinite",
                    "@keyframes float": {
                      "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
                      "50%": { transform: "translateY(-10px) rotate(5deg)" }
                    }
                  }
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Box,
                {
                  sx: {
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "140px",
                    height: "140px",
                    border: "2px solid rgba(76, 175, 80, 0.3)",
                    borderRadius: "50%",
                    animation: "ripple 2s ease-out infinite",
                    "@keyframes ripple": {
                      "0%": {
                        transform: "translate(-50%, -50%) scale(0.8)",
                        opacity: 1
                      },
                      "100%": {
                        transform: "translate(-50%, -50%) scale(1.5)",
                        opacity: 0
                      }
                    }
                  }
                }
              )
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Typography,
              {
                variant: "h2",
                gutterBottom: true,
                fontWeight: "900",
                sx: {
                  background: "linear-gradient(135deg, #4caf50 0%, #8bc34a 50%, #4caf50 100%)",
                  backgroundSize: "200% auto",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  animation: "shimmer 3s linear infinite",
                  letterSpacing: "2px",
                  textShadow: "0 0 40px rgba(76, 175, 80, 0.5)",
                  "@keyframes shimmer": {
                    "0%": { backgroundPosition: "0% center" },
                    "100%": { backgroundPosition: "200% center" }
                  }
                },
                children: "StrainSpotter"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Typography,
              {
                variant: "h6",
                sx: {
                  color: "#8bc34a",
                  fontWeight: 500,
                  mb: 4,
                  textShadow: "0 0 20px rgba(139, 195, 74, 0.3)"
                },
                children: "AI-Powered Cannabis Strain Identification"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Box,
              {
                sx: {
                  my: 4,
                  p: 4,
                  background: "linear-gradient(135deg, rgba(76, 175, 80, 0.15) 0%, rgba(139, 195, 74, 0.15) 100%)",
                  borderRadius: 3,
                  border: "1px solid rgba(76, 175, 80, 0.4)",
                  boxShadow: "inset 0 0 20px rgba(76, 175, 80, 0.1)",
                  position: "relative",
                  overflow: "hidden",
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    top: 0,
                    left: "-100%",
                    width: "100%",
                    height: "100%",
                    background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)",
                    animation: "shine 3s infinite",
                    "@keyframes shine": {
                      "0%": { left: "-100%" },
                      "100%": { left: "100%" }
                    }
                  }
                },
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", alignItems: "center", justifyContent: "center", spacing: 1, mb: 2, children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(VerifiedIcon, { sx: { color: "#4caf50", fontSize: 32 } }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h4", fontWeight: "bold", sx: { color: "#4caf50" }, children: "Age Verification" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(VerifiedIcon, { sx: { color: "#4caf50", fontSize: 32 } })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", paragraph: true, sx: { color: "#fff", fontWeight: 500 }, children: "You must be 21 years or older" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body1", sx: { color: "rgba(255, 255, 255, 0.8)", lineHeight: 1.8 }, children: 'By clicking "I am 21+", you confirm that you meet the age requirement for cannabis-related content in your jurisdiction.' })
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "contained",
                size: "large",
                fullWidth: true,
                onClick: onVerify,
                sx: {
                  py: 3,
                  fontSize: "1.3rem",
                  fontWeight: "bold",
                  background: "linear-gradient(135deg, #4caf50 0%, #66bb6a 50%, #4caf50 100%)",
                  backgroundSize: "200% auto",
                  boxShadow: "0 8px 30px rgba(76, 175, 80, .4)",
                  borderRadius: 3,
                  position: "relative",
                  overflow: "hidden",
                  transition: "all 0.3s ease",
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "linear-gradient(135deg, transparent 0%, rgba(255, 255, 255, 0.2) 50%, transparent 100%)",
                    transform: "translateX(-100%)",
                    transition: "transform 0.6s"
                  },
                  "&:hover": {
                    background: "linear-gradient(135deg, #388e3c 0%, #4caf50 50%, #388e3c 100%)",
                    backgroundSize: "200% auto",
                    boxShadow: "0 12px 40px rgba(76, 175, 80, .6)",
                    transform: "translateY(-2px)",
                    "&::before": {
                      transform: "translateX(100%)"
                    }
                  },
                  "&:active": {
                    transform: "translateY(0px)"
                  }
                },
                children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", alignItems: "center", spacing: 2, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Box,
                    {
                      component: "img",
                      src: "/hero.png?v=13",
                      alt: "",
                      sx: {
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        filter: "drop-shadow(0 0 8px rgba(255, 255, 255, 0.8))",
                        animation: "spin 10s linear infinite",
                        "@keyframes spin": {
                          "0%": { transform: "rotate(0deg)" },
                          "100%": { transform: "rotate(360deg)" }
                        }
                      }
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "I am 21 or Older" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Box,
                    {
                      component: "img",
                      src: "/hero.png?v=13",
                      alt: "",
                      sx: {
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        filter: "drop-shadow(0 0 8px rgba(255, 255, 255, 0.8))",
                        animation: "spin 10s linear infinite reverse"
                      }
                    }
                  )
                ] })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Typography,
              {
                variant: "caption",
                display: "block",
                sx: {
                  mt: 4,
                  color: "rgba(255, 255, 255, 0.5)",
                  lineHeight: 1.6,
                  fontSize: "0.85rem"
                },
                children: [
                  "Cannabis is for medical and recreational use in accordance with state laws.",
                  /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
                  "Please consume responsibly and know your local regulations."
                ]
              }
            )
          ] })
        }
      ) }) })
    }
  );
}
__name(AgeGate, "AgeGate");
function Auth({ onBack }) {
  const [email, setEmail] = reactExports.useState("");
  const [password, setPassword] = reactExports.useState("");
  const [mode, setMode] = reactExports.useState("signin");
  const [loading, setLoading] = reactExports.useState(false);
  const [error, setError] = reactExports.useState(null);
  const [user, setUser] = reactExports.useState(null);
  const [info, setInfo] = reactExports.useState(null);
  reactExports.useEffect(() => {
    if (!supabase) return;
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user || null));
    return () => authListener?.subscription?.unsubscribe();
  }, []);
  async function signIn() {
    if (!isAuthConfigured()) {
      setError("Auth not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
      return;
    }
    setLoading(true);
    setError(null);
    setInfo(null);
    const { data, error: error2 } = await supabase.auth.signInWithPassword({ email, password });
    if (error2) {
      setError(error2.message);
    } else {
      const confirmedAt = data?.user?.email_confirmed_at || data?.session?.user?.email_confirmed_at;
      if (!confirmedAt) {
        await supabase.auth.signOut();
        setError("Please verify your email before signing in. Check your inbox for the confirmation link.");
        setInfo(null);
        return;
      }
      try {
        const { data: data2 } = await supabase.auth.getSession();
        const user2 = data2?.session?.user;
        if (user2?.id) {
          const { data: profile } = await supabase.from("profiles").select("username, avatar_url").eq("user_id", user2.id).single();
          if (!profile?.username || !profile?.avatar_url) {
            try {
              await fetch(`${API_BASE}/api/profile-generator/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  email: user2.email,
                  userId: user2.id
                })
              });
            } catch (e) {
              console.warn("[auth] Failed to generate profile:", e);
            }
          } else {
            await fetch(`${API_BASE}/api/users/ensure`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ user_id: user2.id, email: user2.email, username: profile.username })
            });
          }
        }
      } catch (e) {
        console.warn("[auth] ensure user after sign-in failed:", e);
      }
      if (onBack) {
        setTimeout(() => onBack(), 500);
      }
    }
    setLoading(false);
  }
  __name(signIn, "signIn");
  async function signUp() {
    if (!isAuthConfigured()) {
      setError("Auth not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
      return;
    }
    setLoading(true);
    setError(null);
    setInfo(null);
    const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/#/` : void 0;
    const { data, error: error2 } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo
      }
    });
    setLoading(false);
    if (error2) {
      setError(error2.message);
    } else if (data?.user?.identities?.length === 0) {
      setError('This email is already registered. Please sign in, or use "Forgot password" to reset.');
    } else {
      setError(null);
      setInfo("Check your inbox to verify your email. You can sign in once you confirm.");
      setMode("signin");
    }
  }
  __name(signUp, "signUp");
  async function signOut() {
    await supabase?.auth.signOut();
  }
  __name(signOut, "signOut");
  async function sendMagicLink() {
    if (!isAuthConfigured()) {
      setError("Auth not configured.");
      return;
    }
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const redirectTo = typeof window !== "undefined" ? window.location.origin : void 0;
      const { error: error2 } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } });
      if (error2) setError(error2.message);
      else setInfo("Magic link sent. Check your email and click the link to sign in.");
    } finally {
      setLoading(false);
    }
  }
  __name(sendMagicLink, "sendMagicLink");
  async function forgotPassword() {
    if (!isAuthConfigured()) {
      setError("Auth not configured.");
      return;
    }
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/#/` : void 0;
      const { error: error2 } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error2) setError(error2.message);
      else setInfo("Password reset email sent. Check your email and click the link to reset your password. The link expires in 1 hour.");
    } finally {
      setLoading(false);
    }
  }
  __name(forgotPassword, "forgotPassword");
  const ALLOWLIST = [
    "your@email.com",
    // <-- add your email(s) here
    "friend1@email.com",
    "friend2@email.com",
    "andrewbeck209@gmail.com"
    // Add more emails as needed
  ];
  if (!isAuthConfigured()) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { severity: "info", children: "Auth is not configured. You can still browse features." });
  }
  const isDev = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
  if (user && !isDev && !ALLOWLIST.includes(user.email)) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { severity: "error", children: "This app is restricted. Only select users can access StrainSpotter web. Please use the mobile app." });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { maxWidth: 420, mx: "auto", py: 4, background: "transparent" }, children: [
    onBack && /* @__PURE__ */ jsxRuntimeExports.jsx(
      Button,
      {
        onClick: onBack,
        size: "small",
        variant: "contained",
        sx: {
          mb: 2,
          bgcolor: "#7CB342",
          color: "white",
          textTransform: "none",
          fontWeight: 700,
          borderRadius: 999,
          "&:hover": { bgcolor: "#689f38" }
        },
        children: "← Home"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { sx: { background: "rgba(255,255,255,0.15)", backdropFilter: "blur(12px)", border: "2px solid rgba(0,0,0,0.12)", boxShadow: "none" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 2, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { display: "flex", justifyContent: "center", mb: 2 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        Box,
        {
          sx: {
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: "transparent",
            border: "2px solid rgba(124, 179, 66, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 30px rgba(124, 179, 66, 0.4)",
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
      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h5", sx: { color: "black", fontSize: "2rem", fontWeight: 700, textAlign: "center" }, children: "Account" }),
      user ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", children: [
          "Signed in as ",
          user.email
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outlined", onClick: signOut, children: "Sign Out" })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { value: mode === "reset" ? false : mode, onChange: /* @__PURE__ */ __name((_e, v) => setMode(v), "onChange"), "aria-label": "auth mode", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Tab, { label: "Sign In", value: "signin" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Tab, { label: "Sign Up", value: "signup" })
        ] }),
        mode !== "reset" && /* @__PURE__ */ jsxRuntimeExports.jsx(TextField, { label: "Email", type: "email", value: email, onChange: /* @__PURE__ */ __name((e) => setEmail(e.target.value), "onChange"), fullWidth: true, sx: { background: "rgba(255,255,255,0.10)", color: "black", fontSize: "1.15rem", borderRadius: 2, input: { color: "black" } }, InputLabelProps: { style: { color: "black", fontWeight: 600 } } }),
        mode === "signin" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TextField, { label: "Password", type: "password", value: password, onChange: /* @__PURE__ */ __name((e) => setPassword(e.target.value), "onChange"), fullWidth: true, sx: { background: "rgba(255,255,255,0.10)", color: "black", fontSize: "1.15rem", borderRadius: 2, input: { color: "black" } }, InputLabelProps: { style: { color: "black", fontWeight: 600 } } }),
          error && /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { severity: "error", sx: { fontSize: "1.1rem", color: "black", background: "rgba(255,255,255,0.10)" }, children: error }),
          info && /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { severity: "info", sx: { fontSize: "1.1rem", color: "black", background: "rgba(255,255,255,0.10)" }, children: info }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: { xs: "column", sm: "row" }, spacing: 1, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "contained", onClick: signIn, disabled: loading, sx: { fontSize: "1.1rem", color: "black", background: "rgba(255,255,255,0.20)", border: "1.5px solid black", boxShadow: "none", fontWeight: 700 }, children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircularProgress, { size: 20 }) : "Sign In" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outlined", onClick: sendMagicLink, disabled: loading, sx: { fontSize: "1.1rem", color: "black", border: "1.5px solid black", fontWeight: 700 }, children: "Send Magic Link" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "text", onClick: /* @__PURE__ */ __name(() => {
              setMode("reset");
              setInfo(null);
              setError(null);
            }, "onClick"), disabled: loading, sx: { fontSize: "1.1rem", color: "black", fontWeight: 700 }, children: "Forgot Password?" })
          ] })
        ] }),
        mode === "signup" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TextField, { label: "Password", type: "password", value: password, onChange: /* @__PURE__ */ __name((e) => setPassword(e.target.value), "onChange"), fullWidth: true, sx: { background: "rgba(255,255,255,0.10)", color: "black", fontSize: "1.15rem", borderRadius: 2, input: { color: "black" } }, InputLabelProps: { style: { color: "black", fontWeight: 600 } } }),
          error && /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { severity: "error", sx: { fontSize: "1.1rem", color: "black", background: "rgba(255,255,255,0.10)" }, children: error }),
          info && /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { severity: "info", sx: { fontSize: "1.1rem", color: "black", background: "rgba(255,255,255,0.10)" }, children: info }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: { xs: "column", sm: "row" }, spacing: 1, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "contained", onClick: signUp, disabled: loading, sx: { fontSize: "1.1rem", color: "black", background: "rgba(255,255,255,0.20)", border: "1.5px solid black", boxShadow: "none", fontWeight: 700 }, children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircularProgress, { size: 20 }) : "Create Account" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { component: "button", onClick: /* @__PURE__ */ __name(() => setMode("signin"), "onClick"), sx: { alignSelf: "center", color: "black", fontWeight: 700 }, children: "Already registered? Sign in" })
          ] })
        ] }),
        mode === "reset" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "black" }, children: "Enter your account email and we’ll send you a reset link." }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            TextField,
            {
              label: "Account Email",
              type: "email",
              value: email,
              onChange: /* @__PURE__ */ __name((e) => setEmail(e.target.value), "onChange"),
              fullWidth: true,
              sx: { background: "rgba(255,255,255,0.10)", color: "black", fontSize: "1.15rem", borderRadius: 2, input: { color: "black" } },
              InputLabelProps: { style: { color: "black", fontWeight: 600 } }
            }
          ),
          error && /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { severity: "error", sx: { fontSize: "1.1rem", color: "black", background: "rgba(255,255,255,0.10)" }, children: error }),
          info && /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { severity: "info", sx: { fontSize: "1.1rem", color: "black", background: "rgba(255,255,255,0.10)" }, children: info }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: { xs: "column", sm: "row" }, spacing: 1, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "contained", onClick: forgotPassword, disabled: loading || !email, sx: { fontSize: "1.1rem", color: "black", background: "rgba(255,255,255,0.20)", border: "1.5px solid black", boxShadow: "none", fontWeight: 700 }, children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircularProgress, { size: 20 }) : "Send Reset Email" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "text", onClick: /* @__PURE__ */ __name(() => {
              setMode("signin");
              setInfo(null);
              setError(null);
            }, "onClick"), sx: { fontSize: "1.1rem", color: "black", fontWeight: 700 }, children: "Back to Sign In" })
          ] })
        ] })
      ] })
    ] }) }) })
  ] });
}
__name(Auth, "Auth");
const cannabisTheme = {
  colors: {
    // Primary greens (muted sage/olive green - less vivid)
    primary: {
      main: "#7CB342",
      // Muted olive green
      light: "#9CCC65",
      // Soft sage
      dark: "#558B2F"
    },
    // Secondary (earth tones)
    secondary: {
      main: "#9E9D24",
      // Muted earth yellow
      light: "#C5E1A5",
      dark: "#827717"
    },
    // Text
    text: {
      primary: "#9CCC65",
      // Soft sage green for main text
      secondary: "#7CB342"
    }
  },
  // Cannabis leaf icon SVG path
  leafIcon: {
    viewBox: "0 0 64 64",
    path: "M32 6c2.8 8.2 9.6 14 18 16-8.4 2-15.2 7.8-18 16-2.8-8.2-9.6-14-18-16 8.4-2 15.2-7.8 18-16ZM32 44c-3.5-6.5-9.9-10.7-18-12 4 5.3 7.1 11.1 8.5 17.3 3.1 1.5 6.2 2.7 9.5 3.7v-9ZM32 44c3.5-6.5 9.9-10.7 18-12-4 5.3-7.1 11.1-8.5 17.3-3.1 1.5-6.2 2.7-9.5 3.7v-9Z"
  },
  // Border styles
  borders: {
    primary: "2px solid #7CB342",
    subtle: "1px solid rgba(124, 179, 66, 0.3)"
  },
  // Shadows
  shadows: {
    card: "0 4px 20px rgba(0, 0, 0, 0.5)",
    elevated: "0 8px 30px rgba(0, 0, 0, 0.7)"
  }
};
const muiThemeOverrides = {
  palette: {
    mode: "dark",
    primary: {
      main: cannabisTheme.colors.primary.main,
      light: cannabisTheme.colors.primary.light,
      dark: cannabisTheme.colors.primary.dark
    },
    secondary: {
      main: cannabisTheme.colors.secondary.main,
      light: cannabisTheme.colors.secondary.light,
      dark: cannabisTheme.colors.secondary.dark
    },
    background: {
      default: "#1a1a1a",
      // Use a valid dark color for background
      paper: "#2c2c2c"
      // Use a valid card color for paper
    },
    text: {
      primary: cannabisTheme.colors.text.primary,
      secondary: cannabisTheme.colors.text.secondary
    }
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "none",
          border: cannabisTheme.borders.subtle,
          boxShadow: cannabisTheme.shadows.card
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          textTransform: "none",
          // Disable hover on touch devices to prevent double-tap issue
          "@media (hover: none)": {
            "&:hover": {
              backgroundColor: "inherit"
            }
          }
        },
        contained: {
          backgroundColor: "rgba(124, 179, 66, 0.3)",
          border: "2px solid rgba(124, 179, 66, 0.6)",
          backdropFilter: "blur(10px)",
          boxShadow: "0 6px 20px rgba(124, 179, 66, 0.2)",
          // Only apply hover on devices with hover capability (desktop)
          "@media (hover: hover)": {
            "&:hover": {
              backgroundColor: "rgba(124, 179, 66, 0.5)",
              border: "2px solid rgba(124, 179, 66, 0.8)"
            }
          },
          // Active state for touch devices
          "&:active": {
            backgroundColor: "rgba(124, 179, 66, 0.5)",
            transform: "scale(0.98)"
          }
        },
        outlined: {
          backgroundColor: "rgba(124, 179, 66, 0.2)",
          border: "2px solid rgba(124, 179, 66, 0.5)",
          backdropFilter: "blur(10px)",
          // Only apply hover on devices with hover capability (desktop)
          "@media (hover: hover)": {
            "&:hover": {
              backgroundColor: "rgba(124, 179, 66, 0.3)",
              border: "2px solid rgba(124, 179, 66, 0.7)"
            }
          },
          // Active state for touch devices
          "&:active": {
            backgroundColor: "rgba(124, 179, 66, 0.3)",
            transform: "scale(0.98)"
          }
        },
        text: {
          backgroundColor: "rgba(124, 179, 66, 0.15)",
          backdropFilter: "blur(10px)",
          // Only apply hover on devices with hover capability (desktop)
          "@media (hover: hover)": {
            "&:hover": {
              backgroundColor: "rgba(124, 179, 66, 0.25)"
            }
          },
          // Active state for touch devices
          "&:active": {
            backgroundColor: "rgba(124, 179, 66, 0.25)",
            transform: "scale(0.98)"
          }
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#1a1a1a",
          borderBottom: cannabisTheme.borders.primary
        }
      }
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: "#2c2c2c",
          borderRight: cannabisTheme.borders.subtle
        }
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: "#2c2c2c",
          border: cannabisTheme.borders.subtle,
          boxShadow: cannabisTheme.shadows.elevated
        }
      }
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 }
  }
};
const GUIDELINES_KEY = "ss_guidelines_accepted";
function GuidelinesGate({ children }) {
  const [userId, setUserId] = reactExports.useState(null);
  const [open, setOpen] = reactExports.useState(false);
  const [checked, setChecked] = reactExports.useState(false);
  const [loading, setLoading] = reactExports.useState(true);
  reactExports.useEffect(() => {
    let sub;
    (async () => {
      try {
        if (!supabase) {
          setLoading(false);
          return;
        }
        const { data } = await supabase.auth.getSession();
        const user = data?.session?.user;
        setUserId(user?.id || null);
        if (user) {
          const key = `${GUIDELINES_KEY}_${user.id}`;
          const accepted = localStorage.getItem(key);
          if (accepted !== "true") {
            setOpen(true);
          }
        }
      } catch (e) {
        console.debug("GuidelinesGate: getSession failed", e);
      } finally {
        setLoading(false);
      }
    })();
    if (supabase) {
      const listener = supabase.auth.onAuthStateChange((_e, session) => {
        const user = session?.user;
        setUserId(user?.id || null);
        if (user) {
          const key = `${GUIDELINES_KEY}_${user.id}`;
          const accepted = localStorage.getItem(key);
          if (accepted !== "true") {
            setOpen(true);
          }
        } else {
          setOpen(false);
        }
      });
      sub = listener?.data?.subscription;
    }
    return () => sub?.unsubscribe?.();
  }, []);
  const handleAccept = /* @__PURE__ */ __name(() => {
    if (userId) {
      const key = `${GUIDELINES_KEY}_${userId}`;
      localStorage.setItem(key, "true");
      setOpen(false);
    }
  }, "handleAccept");
  if (loading) {
    return null;
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    children,
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Dialog,
      {
        open,
        disableEscapeKeyDown: true,
        maxWidth: "sm",
        fullWidth: true,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { sx: { fontWeight: 700 }, children: "Welcome to StrainSpotter" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 3, sx: { mt: 1 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { severity: "info", children: "Before you start, please review and accept our Community Guidelines." }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", gutterBottom: true, sx: { fontWeight: 600 }, children: "Community Guidelines" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 2, sx: { mt: 2 }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "subtitle2", color: "primary.light", sx: { fontWeight: 600 }, children: "✓ Be Respectful" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", color: "text.secondary", children: "Treat everyone with respect. No harassment, hate speech, or personal attacks." })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "subtitle2", color: "primary.light", sx: { fontWeight: 600 }, children: "✓ No Solicitations" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", color: "text.secondary", children: "Do not sell, buy, trade, or solicit cannabis or any products. StrainSpotter is for information and community only." })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "subtitle2", color: "primary.light", sx: { fontWeight: 600 }, children: "✓ Privacy Matters" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", color: "text.secondary", children: "Never share personal contact information (phone numbers, addresses, social media) in public spaces." })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "subtitle2", color: "primary.light", sx: { fontWeight: 600 }, children: "✓ Follow Local Laws" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", color: "text.secondary", children: "You are responsible for knowing and following all local, state, and federal laws regarding cannabis." })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "subtitle2", color: "primary.light", sx: { fontWeight: 600 }, children: "✓ Report Issues" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", color: "text.secondary", children: "Use the report feature if you see content that violates these guidelines." })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              FormControlLabel,
              {
                control: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Checkbox,
                  {
                    checked,
                    onChange: /* @__PURE__ */ __name((e) => setChecked(e.target.checked), "onChange"),
                    color: "primary"
                  }
                ),
                label: /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", children: "I have read and agree to follow the Community Guidelines" })
              }
            )
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogActions, { sx: { p: 2 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              onClick: handleAccept,
              variant: "contained",
              disabled: !checked,
              fullWidth: true,
              size: "large",
              children: "Accept & Continue"
            }
          ) })
        ]
      }
    )
  ] });
}
__name(GuidelinesGate, "GuidelinesGate");
const _ErrorBoundary = class _ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("\n🔥 FRONTEND ERROR CAUGHT BY BOUNDARY 🔥");
    console.error("═══════════════════════════════════════════════════════");
    console.error("Time:", (/* @__PURE__ */ new Date()).toISOString());
    console.error("Error Message:", error?.message || "Unknown error");
    console.error("Error Stack:", error?.stack || "No stack trace");
    console.error("Error String:", error?.toString() || String(error));
    console.error("Component Stack:", errorInfo?.componentStack || "No component stack");
    console.error("Full Error Object:", error);
    console.error("Full Error Info:", errorInfo);
    console.error("═══════════════════════════════════════════════════════\n");
    this.sendClientError(error, errorInfo);
  }
  async sendClientError(error, errorInfo) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers = { "Content-Type": "application/json" };
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }
      await fetch(`${API_BASE}/api/admin/errors/client`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: error?.message || error?.toString() || "Unknown error",
          stack: error?.stack || "No stack trace",
          componentStack: errorInfo?.componentStack || "No component stack",
          errorString: error?.toString() || String(error),
          location: window.location.href,
          currentView: window.location.pathname,
          platform: navigator?.platform || null,
          userAgent: navigator?.userAgent || null,
          fullError: error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
          } : null
        })
      });
    } catch (e) {
      console.warn("[ErrorBoundary] Failed to report client error:", e);
    }
  }
  render() {
    if (this.state.hasError) {
      return /* @__PURE__ */ jsxRuntimeExports.jsx(Container, { maxWidth: "md", sx: { py: 8 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { sx: { bgcolor: "rgba(211, 47, 47, 0.05)", border: "2px solid #d32f2f44" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h4", gutterBottom: true, color: "error", children: "🚨 Something went wrong" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { severity: "error", sx: { mb: 3 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body1", fontWeight: "bold", children: this.state.error && this.state.error.toString() }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", color: "text.secondary", sx: { mb: 2 }, children: "The application encountered an error. This has been logged to the console." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { mb: 3 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "caption", color: "text.secondary", sx: { display: "block", mb: 1 }, children: "Component Stack:" }),
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
                maxHeight: 300
              },
              children: this.state.errorInfo && this.state.errorInfo.componentStack
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            variant: "contained",
            onClick: /* @__PURE__ */ __name(() => window.location.reload(), "onClick"),
            sx: { mr: 2 },
            children: "Reload Page"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            variant: "outlined",
            onClick: /* @__PURE__ */ __name(() => {
              this.setState({ hasError: false, error: null, errorInfo: null });
              window.history.back();
            }, "onClick"),
            children: "Go Back"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Alert, { severity: "info", sx: { mt: 3 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "caption", fontWeight: "bold", children: "💡 For developers:" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "caption", display: "block", children: "• Open browser DevTools (F12) → Console tab for full error details" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "caption", display: "block", children: [
            "• Check backend errors at: ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("code", { children: "http://localhost:5173/errors" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "caption", display: "block", children: [
            "• PM2 logs: ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("code", { children: "pm2 logs strainspotter-backend" })
          ] })
        ] })
      ] }) }) });
    }
    return this.props.children;
  }
};
__name(_ErrorBoundary, "ErrorBoundary");
let ErrorBoundary = _ErrorBoundary;
async function logEvent(eventName, context = {}) {
  try {
    let token = null;
    if (supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      token = session?.access_token || null;
    }
    await fetch(`${API_BASE}/api/analytics/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...token ? { Authorization: `Bearer ${token}` } : {}
      },
      body: JSON.stringify({
        event_name: eventName,
        context,
        platform: navigator?.userAgentData?.platform || navigator?.platform || "unknown",
        session_id: localStorage.getItem("ss-session-id")
      })
    });
  } catch (err) {
    console.warn("[analytics] Failed to send event", eventName, err);
  }
}
__name(logEvent, "logEvent");
function PasswordReset({ onBack }) {
  const [newPassword, setNewPassword] = reactExports.useState("");
  const [confirm, setConfirm] = reactExports.useState("");
  const [loading, setLoading] = reactExports.useState(false);
  const [error, setError] = reactExports.useState(null);
  const [info, setInfo] = reactExports.useState("");
  const [ready, setReady] = reactExports.useState(false);
  const [showPassword, setShowPassword] = reactExports.useState(false);
  reactExports.useEffect(() => {
    let timeout;
    let cleanup = false;
    timeout = setTimeout(async () => {
      try {
        if (!supabase || !supabase.auth) {
          setError("Supabase client not initialized. Please reload the page.");
          return;
        }
        const { data, error: sessionError } = await supabase.auth.getSession();
        console.log("[PasswordReset] Session check:", data?.session?.user?.email || "none");
        if (data?.session) {
          setReady(true);
          setInfo("Enter a new password below to complete the reset.");
          if (!cleanup && typeof window !== "undefined") {
            setTimeout(() => {
              history.replaceState(null, "", window.location.pathname + window.location.search);
            }, 500);
          }
        } else {
          console.error("[PasswordReset] No session found:", sessionError);
          setError("Recovery link is invalid or expired. Please request a new reset email from the Sign In screen.");
        }
      } catch (err) {
        console.error("[PasswordReset] Session error:", err);
        setError("Unable to validate session. Please request a new reset link.");
      }
    }, 1500);
    return () => {
      cleanup = true;
      clearTimeout(timeout);
    };
  }, []);
  async function updatePassword() {
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      console.log("[PasswordReset] Updating password");
      const { data, error: error2 } = await supabase.auth.updateUser({ password: newPassword });
      if (error2) {
        console.error("[PasswordReset] Error:", error2);
        setError(error2.message);
      } else {
        console.log("[PasswordReset] Password updated successfully");
        if (data?.user?.id) {
          try {
            await fetch(`${"https://strainspotter.onrender.com"}/api/users/ensure`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ user_id: data.user.id })
            });
          } catch (err) {
            console.warn("[PasswordReset] Failed to ensure user record:", err);
          }
        }
        setInfo("✅ Password updated! You are now signed in. Redirecting to home...");
        setTimeout(() => {
          if (onBack) {
            onBack();
          } else {
            window.location.hash = "#/";
          }
        }, 2e3);
      }
    } catch (err) {
      console.error("[PasswordReset] Catch error:", err);
      setError("Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  }
  __name(updatePassword, "updatePassword");
  function goToLogin() {
    if (onBack) {
      onBack();
      setTimeout(() => {
        window.location.hash = "#/login";
      }, 100);
    } else {
      window.location.hash = "#/login";
    }
  }
  __name(goToLogin, "goToLogin");
  function goHome() {
    if (onBack) {
      onBack();
    } else {
      window.location.hash = "#/";
    }
  }
  __name(goHome, "goHome");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { maxWidth: 420, mx: "auto", py: 4 }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Button,
      {
        onClick: goHome,
        size: "small",
        variant: "contained",
        sx: {
          mb: 2,
          bgcolor: "#7CB342",
          color: "white",
          textTransform: "none",
          fontWeight: 700,
          borderRadius: 999,
          "&:hover": { bgcolor: "#689f38" }
        },
        children: "← Home"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 2, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h5", children: "Reset Password" }),
      info && /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { severity: "success", children: info }),
      error && /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { severity: "error", children: error }),
      ready ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          TextField,
          {
            label: "New Password",
            type: showPassword ? "text" : "password",
            value: newPassword,
            onChange: /* @__PURE__ */ __name((e) => setNewPassword(e.target.value), "onChange"),
            fullWidth: true,
            autoComplete: "new-password",
            helperText: /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                size: "small",
                onClick: /* @__PURE__ */ __name(() => setShowPassword(!showPassword), "onClick"),
                sx: { textTransform: "none", p: 0, minWidth: 0 },
                children: [
                  showPassword ? "Hide" : "Show",
                  " password"
                ]
              }
            )
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          TextField,
          {
            label: "Confirm Password",
            type: showPassword ? "text" : "password",
            value: confirm,
            onChange: /* @__PURE__ */ __name((e) => setConfirm(e.target.value), "onChange"),
            fullWidth: true,
            autoComplete: "new-password"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "contained", onClick: updatePassword, disabled: loading, fullWidth: true, children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircularProgress, { size: 20 }) : "Update Password & Sign In" })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: !error ? /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", children: "Verifying recovery link…" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Alert, { severity: "warning", sx: { mt: 1 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { mb: 1 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Link Expired" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { mb: 2 }, children: 'Password reset links expire after 1 hour. Please request a new one from the Sign In page using the "Forgot Password?" button.' }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 1, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "contained", onClick: goToLogin, fullWidth: true, children: "Go to Sign In & Request New Link" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outlined", onClick: goHome, fullWidth: true, children: "Back to Home" })
        ] })
      ] }) })
    ] }) }) })
  ] });
}
__name(PasswordReset, "PasswordReset");
const STARTER_FREE_SCANS = 20;
const MEMBER_SCAN_CAP = 150;
const MEMBER_KEY = "strainspotter_is_member";
const STARTER_USED_KEY = "strainspotter_starter_scans_used";
const EXTRA_CREDITS_KEY = "strainspotter_extra_scan_credits";
const MEMBER_USED_KEY = "strainspotter_member_scans_used";
const TOPUP_PACKS = [
  { id: "pack_20", label: "20 scans", credits: 20 },
  { id: "pack_50", label: "50 scans", credits: 50 },
  { id: "pack_100", label: "100 scans", credits: 100 }
];
const MembershipContext = reactExports.createContext(null);
function MembershipProvider({ children }) {
  const [initialized, setInitialized] = reactExports.useState(false);
  const [isMember, setIsMember] = reactExports.useState(false);
  const [starterUsed, setStarterUsed] = reactExports.useState(0);
  const [extraCredits, setExtraCredits] = reactExports.useState(0);
  const [memberUsed, setMemberUsed] = reactExports.useState(0);
  reactExports.useEffect(() => {
    try {
      const storedMember = localStorage.getItem(MEMBER_KEY);
      const storedStarter = localStorage.getItem(STARTER_USED_KEY);
      const storedExtra = localStorage.getItem(EXTRA_CREDITS_KEY);
      const storedMemberUsed = localStorage.getItem(MEMBER_USED_KEY);
      if (storedMember === "true") {
        setIsMember(true);
      }
      if (storedStarter != null) {
        const n = parseInt(storedStarter, 10);
        if (!Number.isNaN(n) && n >= 0) setStarterUsed(n);
      }
      if (storedExtra != null) {
        const n = parseInt(storedExtra, 10);
        if (!Number.isNaN(n) && n >= 0) setExtraCredits(n);
      }
      if (storedMemberUsed != null) {
        const n = parseInt(storedMemberUsed, 10);
        if (!Number.isNaN(n) && n >= 0) setMemberUsed(n);
      }
    } catch {
    } finally {
      setInitialized(true);
    }
  }, []);
  const persistMember = reactExports.useCallback((next) => {
    setIsMember(next);
    try {
      localStorage.setItem(MEMBER_KEY, next ? "true" : "false");
    } catch {
    }
  }, []);
  const persistStarterUsed = reactExports.useCallback((next) => {
    setStarterUsed(next);
    try {
      localStorage.setItem(STARTER_USED_KEY, String(next));
    } catch {
    }
  }, []);
  const persistExtraCredits = reactExports.useCallback((next) => {
    setExtraCredits(next);
    try {
      localStorage.setItem(EXTRA_CREDITS_KEY, String(next));
    } catch {
    }
  }, []);
  const persistMemberUsed = reactExports.useCallback((next) => {
    setMemberUsed(next);
    try {
      localStorage.setItem(MEMBER_USED_KEY, String(next));
    } catch {
    }
  }, []);
  const starterRemaining = Math.max(0, STARTER_FREE_SCANS - starterUsed);
  const memberRemaining = Math.max(0, MEMBER_SCAN_CAP - memberUsed);
  const totalAvailableScans = isMember ? memberRemaining + extraCredits : starterRemaining + extraCredits;
  const registerScanConsumed = reactExports.useCallback(() => {
    if (isMember) {
      if (extraCredits > 0) {
        const nextExtra = Math.max(0, extraCredits - 1);
        persistExtraCredits(nextExtra);
      } else if (memberRemaining > 0) {
        const used = memberUsed + 1;
        persistMemberUsed(used);
      }
    } else {
      if (extraCredits > 0) {
        const nextExtra = Math.max(0, extraCredits - 1);
        persistExtraCredits(nextExtra);
      } else if (starterRemaining > 0) {
        const used = starterUsed + 1;
        persistStarterUsed(used);
      }
    }
  }, [
    isMember,
    extraCredits,
    starterRemaining,
    memberRemaining,
    starterUsed,
    memberUsed,
    persistExtraCredits,
    persistStarterUsed,
    persistMemberUsed
  ]);
  const markMember = reactExports.useCallback(() => {
    persistMember(true);
  }, [persistMember]);
  const resetMembership = reactExports.useCallback(() => {
    persistMember(false);
    persistStarterUsed(0);
    persistExtraCredits(0);
    persistMemberUsed(0);
  }, [persistMember, persistStarterUsed, persistExtraCredits, persistMemberUsed]);
  const applyTopupCredits = reactExports.useCallback(
    (credits) => {
      if (!credits || credits <= 0) return;
      const next = extraCredits + credits;
      persistExtraCredits(next);
    },
    [extraCredits, persistExtraCredits]
  );
  const requestMembershipPurchase = reactExports.useCallback(() => {
    console.log("[Membership] requestMembershipPurchase() – hook for native IAP");
    markMember();
  }, [markMember]);
  const requestTopupPurchase = reactExports.useCallback(
    (packId) => {
      console.log(
        "[Membership] requestTopupPurchase() – hook for native IAP, packId=",
        packId
      );
      const pack = TOPUP_PACKS.find((p) => p.id === packId);
      if (!pack) return;
      applyTopupCredits(pack.credits);
    },
    [applyTopupCredits]
  );
  const value = {
    initialized,
    isMember,
    starterUsed,
    starterRemaining,
    memberUsed,
    memberRemaining,
    memberCap: MEMBER_SCAN_CAP,
    extraCredits,
    totalAvailableScans,
    starterCap: STARTER_FREE_SCANS,
    markMember,
    resetMembership,
    registerScanConsumed,
    applyTopupCredits,
    requestMembershipPurchase,
    requestTopupPurchase,
    topupPacks: TOPUP_PACKS
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(MembershipContext.Provider, { value, children });
}
__name(MembershipProvider, "MembershipProvider");
function useMembership() {
  const ctx = reactExports.useContext(MembershipContext);
  if (!ctx) {
    throw new Error("useMembership must be used within MembershipProvider");
  }
  return ctx;
}
__name(useMembership, "useMembership");
function CannabisLeafIcon({ size = 28, color, sx, ...props }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Box,
    {
      component: "svg",
      width: size,
      height: size,
      viewBox: cannabisTheme.leafIcon.viewBox,
      fill: "none",
      sx: {
        color: color || cannabisTheme.colors.primary.main,
        ...sx
      },
      ...props,
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "path",
        {
          d: cannabisTheme.leafIcon.path,
          fill: "currentColor"
        }
      )
    }
  );
}
__name(CannabisLeafIcon, "CannabisLeafIcon");
function featureLabel(featureKey) {
  switch (featureKey) {
    case "garden":
      return "Garden";
    case "reviews":
      return "Reviews";
    case "logbook":
      return "Logbook";
    default:
      return "This feature";
  }
}
__name(featureLabel, "featureLabel");
function FeatureGate({ featureKey, children }) {
  const {
    isMember,
    totalAvailableScans,
    requestMembershipPurchase,
    requestTopupPurchase
  } = useMembership();
  const label = featureLabel(featureKey);
  if (isMember) {
    return children;
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Box,
    {
      sx: {
        maxWidth: 520,
        mx: "auto",
        mt: 5,
        p: 3,
        borderRadius: 3,
        border: "1px solid rgba(134, 239, 172, 0.5)",
        background: "radial-gradient(circle at top, rgba(16, 185, 129, 0.16), rgba(10, 15, 10, 0.96))",
        boxShadow: "0 0 24px rgba(16, 185, 129, 0.35)",
        textAlign: "center"
      },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { display: "flex", justifyContent: "center", mb: 2 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(CannabisLeafIcon, { sx: { fontSize: 40, color: "#4caf50" } }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h5", sx: { mb: 1, fontWeight: 700 }, children: "Members Only" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Typography,
          {
            variant: "body1",
            sx: { mb: 1.5, color: "rgba(255,255,255,0.9)" },
            children: [
              label,
              " unlocks when you join StrainSpotter as a member."
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Typography,
          {
            variant: "body2",
            sx: { mb: 2.5, color: "rgba(255,255,255,0.7)" },
            children: "Members get unlimited scans plus full access to Garden, Reviews, and Logbook tools to track grows, stash, and sessions."
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Stack,
          {
            direction: "row",
            spacing: 1.5,
            sx: { justifyContent: "center", flexWrap: "wrap" },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  variant: "contained",
                  size: "large",
                  onClick: requestMembershipPurchase,
                  sx: {
                    borderRadius: 999,
                    px: 4,
                    py: 1.1,
                    textTransform: "none",
                    fontWeight: 700,
                    background: "linear-gradient(135deg, #4caf50, #8bc34a)",
                    boxShadow: "0 0 18px rgba(76, 175, 80, 0.6)"
                  },
                  children: "Unlock membership"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  variant: "outlined",
                  size: "large",
                  onClick: /* @__PURE__ */ __name(() => requestTopupPurchase("pack_20"), "onClick"),
                  sx: {
                    borderRadius: 999,
                    px: 3,
                    py: 1.1,
                    textTransform: "none",
                    fontWeight: 600,
                    borderColor: "rgba(148, 163, 184, 0.8)",
                    color: "rgba(226, 232, 240, 0.95)"
                  },
                  children: "Just buy scans"
                }
              )
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Typography,
          {
            variant: "caption",
            sx: { display: "block", mt: 2, color: "rgba(148,163,184,0.8)" },
            children: "You can keep scanning with top-ups even without membership, but members always get the best experience."
          }
        ),
        totalAvailableScans > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
          Typography,
          {
            variant: "caption",
            sx: {
              display: "block",
              mt: 0.75,
              color: "rgba(190, 242, 100, 0.9)"
            },
            children: "You still have some scan credits left for the scanner."
          }
        )
      ]
    }
  );
}
__name(FeatureGate, "FeatureGate");
const debugLog = /* @__PURE__ */ __name((...args) => {
  if (typeof window !== "undefined") {
    console.log("[DEBUG App.jsx]", (/* @__PURE__ */ new Date()).toISOString(), ...args);
  }
}, "debugLog");
debugLog("=== APP.JSX STARTING ===");
debugLog("About to import React...");
debugLog("React imported:", typeof React !== "undefined");
debugLog("React version:", React?.version || "unknown");
if (typeof window !== "undefined") {
  debugLog("Setting React globally in App.jsx...");
  debugLog("window.React before:", typeof window.React);
  if (!window.React) {
    debugLog("window.React is missing, setting it now");
    Object.defineProperty(window, "React", {
      value: React,
      writable: false,
      configurable: false,
      enumerable: true
    });
  } else {
    debugLog("window.React already exists");
  }
  if (typeof globalThis !== "undefined" && !globalThis.React) {
    debugLog("Setting React on globalThis");
    Object.defineProperty(globalThis, "React", {
      value: React,
      writable: false,
      configurable: false,
      enumerable: true
    });
  }
  debugLog("window.React after:", typeof window.React, window.React ? "EXISTS" : "MISSING");
}
debugLog("About to import MUI...");
debugLog("React check before MUI import:", typeof React !== "undefined", typeof window?.React !== "undefined");
debugLog("MUI imported successfully!");
const Home = React.lazy(() => __vitePreload(() => import("./Home-BtSaBtrJ.js"), true ? __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18]) : void 0, import.meta.url));
const ScanPage = React.lazy(() => __vitePreload(() => import("./ScanPage-CswYfv2A.js"), true ? __vite__mapDeps([19,1,2,6,7,8,9]) : void 0, import.meta.url));
const HistoryPage = React.lazy(() => __vitePreload(() => import("./HistoryPage-WKqUYRAb.js"), true ? __vite__mapDeps([20,1,2,6,7]) : void 0, import.meta.url));
const AnalyticsDashboard = React.lazy(() => __vitePreload(() => import("./AnalyticsDashboard-DXOPpt0y.js"), true ? __vite__mapDeps([21,1,2]) : void 0, import.meta.url));
const ScanHistory = React.lazy(() => __vitePreload(() => import("./ScanHistory-DtdhQvzh.js"), true ? __vite__mapDeps([22,1,2,12,23]) : void 0, import.meta.url));
const ScanWizard = React.lazy(() => __vitePreload(() => import("./ScanWizard-3GRG4iak.js").then((n) => n.a), true ? __vite__mapDeps([3,1,2,4,5,6,7,8,9]) : void 0, import.meta.url));
const ScanResultCard = React.lazy(() => __vitePreload(() => import("./ScanResultCard-BGx_BhU_.js").then((n) => n.a), true ? __vite__mapDeps([6,1,2,7]) : void 0, import.meta.url));
const FeedbackChat = React.lazy(() => __vitePreload(() => import("./FeedbackChat-BOLRVgu1.js"), true ? __vite__mapDeps([24,1,2]) : void 0, import.meta.url));
const GrowerDirectory = React.lazy(() => __vitePreload(() => import("./GrowerDirectory-d7DekxV7.js"), true ? __vite__mapDeps([15,1,2,16]) : void 0, import.meta.url));
const Groups = React.lazy(() => __vitePreload(() => import("./Groups-CLalY7JD.js"), true ? __vite__mapDeps([13,1,2,5]) : void 0, import.meta.url));
const Seeds = React.lazy(() => __vitePreload(() => import("./Seeds-DJXGhCAz.js"), true ? __vite__mapDeps([25,1,2,23]) : void 0, import.meta.url));
const Dispensaries = React.lazy(() => __vitePreload(() => import("./Dispensaries-55twzzgv.js"), true ? __vite__mapDeps([26,1,2,23]) : void 0, import.meta.url));
const GrowerRegistration = React.lazy(() => __vitePreload(() => import("./GrowerRegistration-BBLqKBpW.js"), true ? __vite__mapDeps([16,1,2]) : void 0, import.meta.url));
const Help = React.lazy(() => __vitePreload(() => import("./Help-CoGL6l-t.js"), true ? __vite__mapDeps([27,1,2]) : void 0, import.meta.url));
const Friends = React.lazy(() => __vitePreload(() => import("./Friends-Cndj6Li8.js"), true ? __vite__mapDeps([28,1,2]) : void 0, import.meta.url));
const StrainBrowser = React.lazy(() => __vitePreload(() => import("./StrainBrowser-2GO7PxJ2.js"), true ? __vite__mapDeps([10,1,2,4,5,11,12,7]) : void 0, import.meta.url));
const MembershipJoin = React.lazy(() => __vitePreload(() => import("./MembershipJoin-BtpMS-Hu.js"), true ? __vite__mapDeps([29,1,2]) : void 0, import.meta.url));
const GrowCoach = React.lazy(() => __vitePreload(() => import("./GrowCoach-Cm1-I2Km.js"), true ? __vite__mapDeps([14,1,2,12,5]) : void 0, import.meta.url));
const MembershipAdmin = React.lazy(() => __vitePreload(() => import("./MembershipAdmin-Cam2JYoG.js"), true ? __vite__mapDeps([30,1,2]) : void 0, import.meta.url));
const PipelineStatus = React.lazy(() => __vitePreload(() => import("./PipelineStatus-CAxhMqHj.js"), true ? __vite__mapDeps([31,1,2]) : void 0, import.meta.url));
const ModerationDashboard = React.lazy(() => __vitePreload(() => import("./ModerationDashboard-Cx41FFY6.js"), true ? __vite__mapDeps([32,1,2]) : void 0, import.meta.url));
const Guidelines = React.lazy(() => __vitePreload(() => import("./Guidelines-BXztXynZ.js"), true ? __vite__mapDeps([33,1,2]) : void 0, import.meta.url));
const ErrorViewer = React.lazy(() => __vitePreload(() => import("./ErrorViewer-BvaX2f3-.js"), true ? __vite__mapDeps([34,1,2]) : void 0, import.meta.url));
const EmergencyLogout = React.lazy(() => __vitePreload(() => import("./EmergencyLogout-_y1jlgAh.js"), true ? __vite__mapDeps([35,1,2]) : void 0, import.meta.url));
const OnboardingFlow = React.lazy(() => __vitePreload(() => import("./OnboardingFlow-CPeYAnlO.js"), true ? __vite__mapDeps([36,1,2]) : void 0, import.meta.url));
const FirstRunIntro = React.lazy(() => __vitePreload(() => import("./FirstRunIntro-Dy621NAN.js"), true ? __vite__mapDeps([37,1,2]) : void 0, import.meta.url));
const JournalPage = React.lazy(() => __vitePreload(() => import("./JournalPage-D69lYRdD.js"), true ? __vite__mapDeps([38,1,2,12,11]) : void 0, import.meta.url));
React.lazy(() => __vitePreload(() => import("./FloatingScanButton-B3Y03CKx.js"), true ? __vite__mapDeps([39,1,2]) : void 0, import.meta.url));
const ScanBalanceIndicator = React.lazy(() => __vitePreload(() => import("./ScanBalanceIndicator-v9tIH_4m.js"), true ? __vite__mapDeps([40,1,2,9]) : void 0, import.meta.url));
const BuyScansModal = React.lazy(() => __vitePreload(() => import("./BuyScansModal-JP2lRnaq.js"), true ? __vite__mapDeps([17,1,2]) : void 0, import.meta.url));
const AdminStatus = React.lazy(() => __vitePreload(() => import("./AdminStatus-CqvuM8ri.js"), true ? __vite__mapDeps([41,1,2,18]) : void 0, import.meta.url));
const theme = createTheme(muiThemeOverrides);
function App() {
  debugLog("=== App() FUNCTION CALLED ===");
  const [ageVerified, setAgeVerified] = reactExports.useState(false);
  const [currentView, setCurrentView] = reactExports.useState("home");
  const [activeScan, setActiveScan] = reactExports.useState(null);
  const [showIntro, setShowIntro] = reactExports.useState(() => {
    debugLog("Initializing showIntro state...");
    if (typeof window === "undefined") {
      return false;
    }
    try {
      const introComplete = localStorage.getItem("ss_intro_complete") !== "true";
      debugLog("showIntro initial value:", introComplete);
      return introComplete;
    } catch (e) {
      debugLog("Error reading localStorage:", e);
      return false;
    }
  });
  const [showGlobalBuyScans, setShowGlobalBuyScans] = reactExports.useState(false);
  debugLog("App state initialized - ageVerified:", ageVerified, "currentView:", currentView);
  reactExports.useEffect(() => {
    debugLog("App useEffect[0] running...");
    const verified = localStorage.getItem("strainspotter_age_verified");
    if (verified === "true") {
      setAgeVerified(true);
    }
    if (typeof window !== "undefined" && window.location.hash) {
      const hash = window.location.hash;
      if (hash === "#/emergency-logout") {
        setCurrentView("emergency-logout");
      } else if (/type=recovery/.test(hash)) {
        setCurrentView("reset");
      } else if (/access_token=/.test(hash)) {
        setCurrentView("home");
        (async () => {
          try {
            const { data } = await supabase.auth.getSession();
            const user = data?.session?.user;
            if (user?.id) {
              const email = user.email || void 0;
              const username = email ? email.split("@")[0] : void 0;
              await fetch(`${API_BASE}/api/users/ensure`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: user.id, email, username })
              });
            }
          } catch (e) {
            console.warn("[onboard] ensure user after magic link failed:", e);
          }
        })();
        setTimeout(() => {
          history.replaceState(null, "", window.location.pathname + window.location.search);
        }, 1e3);
      }
    }
  }, []);
  reactExports.useEffect(() => {
    const handler = /* @__PURE__ */ __name((event) => {
      if (event?.detail) {
        setCurrentView(event.detail);
      }
    }, "handler");
    window.addEventListener("nav:set-view", handler);
    return () => window.removeEventListener("nav:set-view", handler);
  }, []);
  reactExports.useEffect(() => {
    logEvent("app_start", { mode: "production", apiBase: API_BASE });
  }, []);
  const handleAgeVerify = /* @__PURE__ */ __name(() => {
    localStorage.setItem("strainspotter_age_verified", "true");
    setAgeVerified(true);
  }, "handleAgeVerify");
  debugLog("App render - ageVerified:", ageVerified);
  if (!ageVerified) {
    debugLog("Rendering AgeGate...");
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(ThemeProvider, { theme, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CssBaseline, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(AgeGate, { onVerify: handleAgeVerify })
    ] });
  }
  debugLog("Rendering main App UI...");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(ThemeProvider, { theme, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CssBaseline, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AuthProvider, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(ProModeProvider, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(MembershipProvider, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(MobileOnlyGuard, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
          position: "fixed",
          inset: 0,
          zIndex: 0,
          width: "100vw",
          maxWidth: "100vw",
          overflow: "hidden",
          backgroundColor: "transparent"
          // Transparent to show background image
        } }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(ErrorBoundary, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(GuidelinesGate, { children: [
          typeof window !== "undefined" && !/localhost|127\.0\.0\.1/.test(window.location.host) && /localhost:5181/.test("https://strainspotter.onrender.com") && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { background: "#ff5555", color: "#fff", padding: "6px 12px", textAlign: "center", fontWeight: 700 }, children: "Warning: Frontend is calling localhost API_BASE. Update VITE_API_BASE or config.js." }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "relative", zIndex: 10, width: "100%", maxWidth: "100vw", overflowX: "hidden", overflow: currentView === "home" ? "visible" : "hidden", left: 0, right: 0 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { fallback: null, children: /* @__PURE__ */ jsxRuntimeExports.jsx(OnboardingFlow, {}) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { fallback: null, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              FirstRunIntro,
              {
                open: showIntro,
                onFinish: /* @__PURE__ */ __name(() => {
                  try {
                    localStorage.setItem("ss_intro_complete", "true");
                  } catch {
                  }
                  setShowIntro(false);
                  setCurrentView("home");
                }, "onFinish")
              }
            ) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { fallback: null, children: /* @__PURE__ */ jsxRuntimeExports.jsx(ScanBalanceIndicator, { onBuyCredits: /* @__PURE__ */ __name(() => setShowGlobalBuyScans(true), "onBuyCredits") }) }),
            currentView === "home" && /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { fallback: null, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Home, { onNavigate: setCurrentView }) }),
            ["scanner", "guest-scan", "scan"].includes(currentView) && /* @__PURE__ */ jsxRuntimeExports.jsx(
              reactExports.Suspense,
              {
                fallback: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: 16, color: "#C5E1A5" }, children: "Opening scanner…" }),
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  ScanPage,
                  {
                    onBack: /* @__PURE__ */ __name(() => setCurrentView("home"), "onBack"),
                    onNavigate: /* @__PURE__ */ __name((view) => setCurrentView(view), "onNavigate"),
                    onScanComplete: /* @__PURE__ */ __name((scan) => {
                      setActiveScan(scan);
                      setCurrentView("result");
                    }, "onScanComplete")
                  }
                )
              }
            ),
            currentView === "wizard" && /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { fallback: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: 16, color: "#C5E1A5" }, children: "Loading scanner..." }), children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              ScanWizard,
              {
                onBack: /* @__PURE__ */ __name(() => setCurrentView("home"), "onBack"),
                onScanComplete: /* @__PURE__ */ __name((scan) => {
                  setActiveScan(scan);
                  setCurrentView("result");
                }, "onScanComplete")
              }
            ) }),
            currentView === "result" && activeScan && /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Box,
              {
                sx: {
                  display: "flex",
                  flexDirection: "column",
                  height: "100vh",
                  width: "100%",
                  maxWidth: "100vw",
                  overflow: "hidden",
                  overflowX: "hidden",
                  bgcolor: "transparent"
                  // Transparent to show background image
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
                        bgcolor: "rgba(0,0,0,0.3)",
                        backdropFilter: "blur(8px)",
                        zIndex: 1
                      },
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Button,
                          {
                            variant: "text",
                            onClick: /* @__PURE__ */ __name(() => setCurrentView("home"), "onClick"),
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
                      children: !activeScan ? /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", color: "text.secondary", children: "Preparing your result…" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { fallback: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: 16, color: "#C5E1A5" }, children: "Loading result..." }), children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                        ScanResultCard,
                        {
                          scan: activeScan,
                          result: activeScan,
                          isGuest: false
                        }
                      ) })
                    }
                  )
                ]
              }
            ),
            currentView === "history" && /* @__PURE__ */ jsxRuntimeExports.jsx(FeatureGate, { featureKey: "logbook", children: /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { fallback: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: 16, color: "#C5E1A5" }, children: "Loading history..." }), children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              ScanHistory,
              {
                onBack: /* @__PURE__ */ __name(() => setCurrentView("home"), "onBack"),
                onSelectScan: /* @__PURE__ */ __name((scan) => {
                  setActiveScan(scan);
                  setCurrentView("result");
                }, "onSelectScan")
              }
            ) }) }),
            currentView === "feedback" && /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { fallback: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: 16, color: "#C5E1A5" }, children: "Loading feedback..." }), children: /* @__PURE__ */ jsxRuntimeExports.jsx(FeedbackChat, { onBack: /* @__PURE__ */ __name(() => setCurrentView("home"), "onBack") }) }),
            currentView === "growers" && /* @__PURE__ */ jsxRuntimeExports.jsx(FeatureGate, { featureKey: "garden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { fallback: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: 16, color: "#C5E1A5" }, children: "Loading directory..." }), children: /* @__PURE__ */ jsxRuntimeExports.jsx(GrowerDirectory, { onNavigate: setCurrentView, onBack: /* @__PURE__ */ __name(() => setCurrentView("home"), "onBack") }) }) }),
            currentView === "register" && /* @__PURE__ */ jsxRuntimeExports.jsx(FeatureGate, { featureKey: "garden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { fallback: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: 16, color: "#C5E1A5" }, children: "Loading registration..." }), children: /* @__PURE__ */ jsxRuntimeExports.jsx(GrowerRegistration, { onBack: /* @__PURE__ */ __name(() => setCurrentView("home"), "onBack") }) }) }),
            currentView === "groups" && /* @__PURE__ */ jsxRuntimeExports.jsx(FeatureGate, { featureKey: "garden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { fallback: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: 16, color: "#C5E1A5" }, children: "Loading groups..." }), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Groups, { onNavigate: setCurrentView, onBack: /* @__PURE__ */ __name(() => setCurrentView("home"), "onBack") }) }) }),
            currentView === "friends" && /* @__PURE__ */ jsxRuntimeExports.jsx(FeatureGate, { featureKey: "garden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { fallback: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: 16, color: "#C5E1A5" }, children: "Loading friends..." }), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Friends, { onBack: /* @__PURE__ */ __name(() => setCurrentView("home"), "onBack") }) }) }),
            currentView === "seeds" && /* @__PURE__ */ jsxRuntimeExports.jsx(FeatureGate, { featureKey: "reviews", children: /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { fallback: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: 16, color: "#C5E1A5" }, children: "Loading seeds..." }), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Seeds, { onBack: /* @__PURE__ */ __name(() => setCurrentView("home"), "onBack") }) }) }),
            currentView === "dispensaries" && /* @__PURE__ */ jsxRuntimeExports.jsx(FeatureGate, { featureKey: "reviews", children: /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { fallback: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: 16, color: "#C5E1A5" }, children: "Loading dispensaries..." }), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Dispensaries, { onBack: /* @__PURE__ */ __name(() => setCurrentView("home"), "onBack") }) }) }),
            currentView === "grow-coach" && /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { fallback: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: 16, color: "#C5E1A5" }, children: "Loading grow coach..." }), children: /* @__PURE__ */ jsxRuntimeExports.jsx(GrowCoach, { onBack: /* @__PURE__ */ __name(() => setCurrentView("home"), "onBack") }) }),
            currentView === "membership-join" && /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { fallback: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: 16, color: "#C5E1A5" }, children: "Loading membership..." }), children: /* @__PURE__ */ jsxRuntimeExports.jsx(MembershipJoin, { onBack: /* @__PURE__ */ __name(() => setCurrentView("home"), "onBack") }) }),
            currentView === "help" && /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { fallback: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: 16, color: "#C5E1A5" }, children: "Loading help..." }), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Help, { onNavigate: setCurrentView, onBack: /* @__PURE__ */ __name(() => setCurrentView("home"), "onBack") }) }),
            currentView === "login" && /* @__PURE__ */ jsxRuntimeExports.jsx(Auth, { onBack: /* @__PURE__ */ __name(() => setCurrentView("home"), "onBack") }),
            currentView === "admin-status" && /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { fallback: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: 16, color: "#C5E1A5" }, children: "Loading admin..." }), children: /* @__PURE__ */ jsxRuntimeExports.jsx(AdminStatus, { onBack: /* @__PURE__ */ __name(() => setCurrentView("home"), "onBack"), onNavigate: setCurrentView }) }),
            currentView === "journal" && /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { fallback: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: 16, color: "#C5E1A5" }, children: "Loading journal..." }), children: /* @__PURE__ */ jsxRuntimeExports.jsx(JournalPage, { onBack: /* @__PURE__ */ __name(() => setCurrentView("home"), "onBack") }) }),
            currentView === "strains" && /* @__PURE__ */ jsxRuntimeExports.jsx(FeatureGate, { featureKey: "reviews", children: /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { fallback: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: 16, color: "#C5E1A5" }, children: "Loading strains..." }), children: /* @__PURE__ */ jsxRuntimeExports.jsx(StrainBrowser, { onNavigate: setCurrentView }) }) }),
            currentView === "membership-admin" && /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { fallback: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: 16, color: "#C5E1A5" }, children: "Loading admin..." }), children: /* @__PURE__ */ jsxRuntimeExports.jsx(MembershipAdmin, { onBack: /* @__PURE__ */ __name(() => setCurrentView("home"), "onBack") }) }),
            currentView === "pipeline" && /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { fallback: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: 16, color: "#C5E1A5" }, children: "Loading pipeline..." }), children: /* @__PURE__ */ jsxRuntimeExports.jsx(PipelineStatus, { onBack: /* @__PURE__ */ __name(() => setCurrentView("home"), "onBack") }) }),
            currentView === "moderation" && /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { fallback: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: 16, color: "#C5E1A5" }, children: "Loading moderation..." }), children: /* @__PURE__ */ jsxRuntimeExports.jsx(ModerationDashboard, { onBack: /* @__PURE__ */ __name(() => setCurrentView("home"), "onBack") }) }),
            currentView === "guidelines" && /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { fallback: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: 16, color: "#C5E1A5" }, children: "Loading guidelines..." }), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Guidelines, { onBack: /* @__PURE__ */ __name(() => setCurrentView("home"), "onBack") }) }),
            currentView === "reset" && /* @__PURE__ */ jsxRuntimeExports.jsx(PasswordReset, { onBack: /* @__PURE__ */ __name(() => setCurrentView("home"), "onBack") }),
            currentView === "errors" && /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { fallback: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: 16, color: "#C5E1A5" }, children: "Loading errors..." }), children: /* @__PURE__ */ jsxRuntimeExports.jsx(ErrorViewer, { onBack: /* @__PURE__ */ __name(() => setCurrentView("home"), "onBack") }) }),
            currentView === "emergency-logout" && /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { fallback: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: 16, color: "#C5E1A5" }, children: "Loading..." }), children: /* @__PURE__ */ jsxRuntimeExports.jsx(EmergencyLogout, {}) }),
            currentView === "analytics" && /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { fallback: null, children: /* @__PURE__ */ jsxRuntimeExports.jsx(AnalyticsDashboard, { onBack: /* @__PURE__ */ __name(() => setCurrentView("home"), "onBack") }) }),
            currentView === "history" && /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { fallback: null, children: /* @__PURE__ */ jsxRuntimeExports.jsx(HistoryPage, { onBack: /* @__PURE__ */ __name(() => setCurrentView("home"), "onBack") }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { fallback: null })
          ] })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { fallback: null, children: /* @__PURE__ */ jsxRuntimeExports.jsx(BuyScansModal, { open: showGlobalBuyScans, onClose: /* @__PURE__ */ __name(() => setShowGlobalBuyScans(false), "onClose") }) })
    ] }) }) })
  ] });
}
__name(App, "App");
const App$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: App
}, Symbol.toStringTag, { value: "Module" }));
export {
  App as A,
  CannabisLeafIcon as C,
  ErrorBoundary as E,
  FUNCTIONS_BASE as F,
  SUPABASE_ANON_KEY as S,
  API_BASE as a,
  useMembership as b,
  useProMode as c,
  App$1 as d,
  isAuthConfigured as i,
  logEvent as l,
  supabase as s,
  useAuth as u
};
