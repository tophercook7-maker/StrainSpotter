var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { r as reactExports, j as jsxRuntimeExports, D as Dialog, p as DialogTitle, B as Box, _ as BoltIcon, T as Typography, I as IconButton, ai as CloseIcon, q as DialogContent, n as CircularProgress, A as Alert, am as StarIcon, f as Card, h as CardContent, bq as CardActions, i as Button, H as Chip, br as OfferIcon, u as DialogActions } from "./react-vendor-DaVUs1pH.js";
import { l as logEvent, s as supabase, a as API_BASE } from "./App-BxlAc3TE.js";
import "./vendor-qR99EfKL.js";
function BuyScansModal({ open, onClose, currentTier = "free", creditsRemaining = 0 }) {
  const [packages, setPackages] = reactExports.useState([]);
  const [role, setRole] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  const [purchasing, setPurchasing] = reactExports.useState(false);
  const [error, setError] = reactExports.useState(null);
  const [success, setSuccess] = reactExports.useState(null);
  reactExports.useEffect(() => {
    if (open) {
      logEvent("credits_modal_opened");
      fetchPackages();
    }
  }, [open]);
  const fetchPackages = /* @__PURE__ */ __name(async () => {
    setLoading(true);
    setError(null);
    try {
      let token = null;
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        token = session?.access_token || null;
      }
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await fetch(`${API_BASE}/api/credits/packages`, { headers });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to load packages");
      }
      setPackages(Array.isArray(data.packages) ? data.packages : []);
      setRole(data.role || null);
    } catch (err) {
      console.error("Failed to fetch packages:", err);
      setError(err.message || "Failed to load packages");
    } finally {
      setLoading(false);
    }
  }, "fetchPackages");
  const handlePurchasePackage = /* @__PURE__ */ __name(async (packageId) => {
    logEvent("credits_cta_clicked", { type: "top_up", packageId });
    setPurchasing(true);
    setError(null);
    setSuccess(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Please sign in to purchase credits");
        setPurchasing(false);
        return;
      }
      setError("Top-up purchases are coming soon! Contact support and mention the package you want.");
    } catch (err) {
      console.error("Purchase error:", err);
      setError("Purchase failed. Please try again.");
    } finally {
      setPurchasing(false);
    }
  }, "handlePurchasePackage");
  const handleUpgradeTier = /* @__PURE__ */ __name(async (tierId) => {
    logEvent("credits_cta_clicked", { type: "membership", tierId });
    setPurchasing(true);
    setError(null);
    setSuccess(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Please sign in to upgrade");
        setPurchasing(false);
        return;
      }
      setError("Membership billing inside the app is coming soon. Contact support to upgrade manually.");
    } catch (err) {
      console.error("Upgrade error:", err);
      setError("Upgrade failed. Please try again.");
    } finally {
      setPurchasing(false);
    }
  }, "handleUpgradeTier");
  const tierAliases = reactExports.useMemo(() => ({
    premium: "monthly_member",
    member: "monthly_member",
    moderator: "monthly_member"
  }), []);
  const normalizedTier = reactExports.useMemo(() => {
    const lowered = (currentTier || "").toLowerCase();
    return tierAliases[lowered] || lowered || "free";
  }, [currentTier, tierAliases]);
  const packageGroups = reactExports.useMemo(() => {
    return {
      appUnlock: packages.find((pkg) => pkg.type === "app_purchase"),
      membership: packages.find((pkg) => pkg.type === "membership"),
      topUps: packages.filter((pkg) => pkg.type === "top_up")
    };
  }, [packages]);
  const priceLabel = /* @__PURE__ */ __name((pkg) => {
    if (!pkg) return "";
    return `$${pkg.effectivePrice.toFixed(2)}`;
  }, "priceLabel");
  const perScanLabel = /* @__PURE__ */ __name((pkg) => {
    if (!pkg?.credits) return "";
    const cost = pkg.effectivePrice / pkg.credits;
    if (cost < 1) return `${(cost * 100).toFixed(1)}¢ per scan`;
    return `$${cost.toFixed(2)} per scan`;
  }, "perScanLabel");
  const renderPriceStack = /* @__PURE__ */ __name((pkg, { showRecurringLabel = false } = {}) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "h4", color: "primary", gutterBottom: true, children: [
      priceLabel(pkg),
      showRecurringLabel && /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { component: "span", variant: "body2", color: "text.secondary", children: "/month" })
    ] }),
    pkg?.moderatorDiscount && /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", color: "text.secondary", sx: { textDecoration: "line-through" }, children: [
      "$",
      pkg.price.toFixed(2)
    ] })
  ] }), "renderPriceStack");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Dialog,
    {
      open,
      onClose,
      maxWidth: "md",
      fullWidth: true,
      PaperProps: {
        sx: {
          background: "linear-gradient(135deg, rgba(18, 18, 18, 0.98) 0%, rgba(30, 30, 30, 0.98) 100%)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(124, 179, 66, 0.2)"
        }
      },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogTitle, { sx: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid rgba(124, 179, 66, 0.2)"
        }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { display: "flex", alignItems: "center", gap: 1 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(BoltIcon, { sx: { color: "#7CB342" } }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", children: "Get More Scans" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(IconButton, { onClick: onClose, size: "small", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CloseIcon, {}) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogContent, { sx: { mt: 2 }, children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { display: "flex", justifyContent: "center", p: 4 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(CircularProgress, {}) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          error && /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { severity: "error", sx: { mb: 2 }, onClose: /* @__PURE__ */ __name(() => setError(null), "onClose"), children: error }),
          success && /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { severity: "success", sx: { mb: 2 }, children: success }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { mb: 3, p: 2, background: "rgba(124, 179, 66, 0.1)", borderRadius: 2 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", color: "text.secondary", children: [
              "Current Plan: ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: normalizedTier.replace("_", " ").toUpperCase() })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", color: "text.secondary", children: [
              "Scans Remaining: ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: creditsRemaining })
            ] })
          ] }),
          (packageGroups.appUnlock || packageGroups.membership) && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "h6", sx: { mb: 2, display: "flex", alignItems: "center", gap: 1 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(StarIcon, { sx: { color: "#FFD700" } }),
              "Membership & Unlocks"
            ] }),
            role === "moderator" && /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { severity: "info", sx: { mb: 2 }, children: "Moderator pricing applied automatically." }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, mb: 4 }, children: [
              packageGroups.appUnlock && normalizedTier === "free" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Card,
                {
                  sx: {
                    background: "linear-gradient(135deg, rgba(124, 179, 66, 0.12) 0%, rgba(156, 204, 101, 0.08) 100%)",
                    border: "1px solid rgba(124, 179, 66, 0.25)"
                  },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", gutterBottom: true, children: "Unlock StrainSpotter" }),
                      renderPriceStack(packageGroups.appUnlock),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body1", color: "text.secondary", gutterBottom: true, children: [
                        packageGroups.appUnlock.scans,
                        " starter scans (one-time)"
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", color: "text.secondary", children: "Own the app forever and unlock Groups, Grower tools, and the Garden." })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(CardActions, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      Button,
                      {
                        fullWidth: true,
                        variant: "contained",
                        color: "primary",
                        disabled: purchasing,
                        onClick: /* @__PURE__ */ __name(() => handleUpgradeTier("app_purchase"), "onClick"),
                        children: [
                          "Unlock for ",
                          priceLabel(packageGroups.appUnlock)
                        ]
                      }
                    ) })
                  ]
                },
                "app_purchase"
              ),
              packageGroups.membership && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Card,
                {
                  sx: {
                    background: "linear-gradient(135deg, rgba(124, 179, 66, 0.15) 0%, rgba(156, 204, 101, 0.12) 100%)",
                    border: "1px solid rgba(124, 179, 66, 0.35)",
                    position: "relative"
                  },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Chip,
                      {
                        label: "BEST VALUE",
                        size: "small",
                        color: "success",
                        sx: { position: "absolute", top: -10, right: 12, fontWeight: 700 }
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", gutterBottom: true, children: "Monthly Member" }),
                      renderPriceStack(packageGroups.membership, { showRecurringLabel: true }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body1", color: "text.secondary", gutterBottom: true, children: [
                        packageGroups.membership.scansPerMonth || 200,
                        " scans/month + community perks"
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", color: "text.secondary", children: "Includes Groups, Grow Coach, Grower Directory, error reporting, and more." }),
                      packageGroups.membership.moderatorDiscount && /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Chip,
                        {
                          label: `${packageGroups.membership.moderatorDiscount.percent}% moderator discount`,
                          size: "small",
                          color: "success",
                          sx: { mt: 1 }
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(CardActions, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Button,
                      {
                        fullWidth: true,
                        variant: "contained",
                        color: "primary",
                        disabled: purchasing || normalizedTier === "monthly_member",
                        onClick: /* @__PURE__ */ __name(() => handleUpgradeTier("monthly_member"), "onClick"),
                        children: normalizedTier === "monthly_member" ? "Membership Active" : "Upgrade to Monthly Member"
                      }
                    ) })
                  ]
                },
                "monthly_member"
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "h6", sx: { mb: 2, display: "flex", alignItems: "center", gap: 1 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(OfferIcon, { sx: { color: "#7CB342" } }),
            "Buy Credit Packs"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }, children: packageGroups.topUps.map((pkg) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Card,
            {
              sx: {
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(124, 179, 66, 0.2)",
                transition: "all 0.2s ease",
                "&:hover": {
                  transform: "translateY(-2px)",
                  border: "1px solid rgba(124, 179, 66, 0.5)"
                }
              },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "h6", gutterBottom: true, children: [
                    pkg.credits,
                    " Scans"
                  ] }),
                  renderPriceStack(pkg),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", color: "text.secondary", children: perScanLabel(pkg) }),
                  pkg.moderatorDiscount && /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Chip,
                    {
                      label: `${pkg.moderatorDiscount.percent}% moderator discount`,
                      size: "small",
                      color: "success",
                      sx: { mt: 1 }
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(CardActions, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    fullWidth: true,
                    variant: "outlined",
                    color: "primary",
                    disabled: purchasing,
                    onClick: /* @__PURE__ */ __name(() => handlePurchasePackage(pkg.id), "onClick"),
                    children: "Buy Now"
                  }
                ) })
              ]
            },
            pkg.id
          )) })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogActions, { sx: { borderTop: "1px solid rgba(124, 179, 66, 0.2)", p: 2 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: onClose, color: "inherit", children: "Close" }) })
      ]
    }
  );
}
__name(BuyScansModal, "BuyScansModal");
export {
  BuyScansModal as default
};
