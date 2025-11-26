var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { r as reactExports, j as jsxRuntimeExports, S as Stack, n as CircularProgress, H as Chip, _ as BoltIcon, A as Alert, i as Button } from "./react-vendor-DaVUs1pH.js";
import { u as useCreditBalance } from "./useCreditBalance-C4unyUsC.js";
import { u as useAuth } from "./App-BxlAc3TE.js";
import "./vendor-qR99EfKL.js";
function ScanBalanceIndicator({ onBuyCredits }) {
  useAuth();
  const { remainingScans, isUnlimited, loading } = useCreditBalance?.() ?? {};
  const hasUnlimited = isUnlimited;
  const summary = {
    creditsRemaining: remainingScans,
    remainingScans,
    isUnlimited,
    unlimited: isUnlimited
  };
  const state = reactExports.useMemo(() => {
    if (!summary) return null;
    if (hasUnlimited) return "unlimited";
    const credits = summary.creditsRemaining ?? 0;
    if (credits <= 0) return "empty";
    if (credits <= 5) return "low";
    return "ok";
  }, [summary, hasUnlimited]);
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", spacing: 1, alignItems: "center", sx: { mb: 2 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CircularProgress, { size: 16 }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Chip, { size: "small", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(BoltIcon, {}), label: "Checking credits…" })
    ] });
  }
  if (!summary) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 1, sx: { mb: 2 }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Chip,
      {
        icon: /* @__PURE__ */ jsxRuntimeExports.jsx(BoltIcon, {}),
        label: hasUnlimited ? "Unlimited scans" : `Scans left: ${summary.creditsRemaining === Infinity || summary.creditsRemaining === Number.POSITIVE_INFINITY ? "∞" : summary.creditsRemaining ?? 0}`,
        color: hasUnlimited ? "primary" : state === "ok" ? "success" : state === "low" ? "warning" : "default",
        variant: "outlined",
        onClick: /* @__PURE__ */ __name(() => window.location.reload(), "onClick"),
        sx: hasUnlimited ? {
          background: "linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 165, 0, 0.2) 100%)",
          border: "1px solid rgba(255, 215, 0, 0.5)"
        } : void 0
      }
    ),
    state === "low" && !hasUnlimited && /* @__PURE__ */ jsxRuntimeExports.jsx(
      Alert,
      {
        severity: "warning",
        action: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { color: "inherit", size: "small", onClick: onBuyCredits, children: "Buy top-up" }),
        children: "Only a few scans remaining. Top up before your next session."
      }
    ),
    state === "empty" && !hasUnlimited && /* @__PURE__ */ jsxRuntimeExports.jsx(
      Alert,
      {
        severity: "error",
        action: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { color: "inherit", size: "small", onClick: onBuyCredits, children: "Add scans" }),
        children: "You're out of scans. Add a top-up pack or upgrade membership."
      }
    )
  ] });
}
__name(ScanBalanceIndicator, "ScanBalanceIndicator");
export {
  ScanBalanceIndicator as default
};
