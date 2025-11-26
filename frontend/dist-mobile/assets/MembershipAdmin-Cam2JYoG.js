var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { r as reactExports, j as jsxRuntimeExports, C as Container, T as Typography, i as Button, A as Alert, k as Tabs, l as Tab, f as Card, h as CardContent, bd as Table, be as TableHead, bf as TableRow, bg as TableCell, bh as TableBody, H as Chip, D as Dialog, p as DialogTitle, q as DialogContent, S as Stack, m as TextField, u as DialogActions } from "./react-vendor-DaVUs1pH.js";
import { s as supabase, a as API_BASE } from "./App-BxlAc3TE.js";
import "./vendor-qR99EfKL.js";
function MembershipAdmin({ onBack }) {
  const [tab, setTab] = reactExports.useState(0);
  const [applications, setApplications] = reactExports.useState([]);
  const [members, setMembers] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [selectedApp, setSelectedApp] = reactExports.useState(null);
  const [approveDialog, setApproveDialog] = reactExports.useState(false);
  const [approveData, setApproveData] = reactExports.useState({
    payment_received: false,
    payment_amount: "",
    payment_reference: "",
    tier: "full",
    expires_at: ""
  });
  const [sessionToken, setSessionToken] = reactExports.useState(null);
  const [accessAllowed, setAccessAllowed] = reactExports.useState(false);
  const [authChecked, setAuthChecked] = reactExports.useState(false);
  const [error, setError] = reactExports.useState(null);
  reactExports.useEffect(() => {
    checkAccess();
  }, []);
  reactExports.useEffect(() => {
    if (accessAllowed && sessionToken) {
      loadData();
    }
  }, [tab, accessAllowed, sessionToken]);
  const checkAccess = /* @__PURE__ */ __name(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError("Sign in required to view membership management.");
        setAuthChecked(true);
        return;
      }
      const res = await fetch(`${API_BASE}/api/users/onboarding-status`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (!res.ok) {
        setError("Unable to verify permissions.");
        setAuthChecked(true);
        return;
      }
      const payload = await res.json();
      if (payload?.profile?.role === "admin") {
        setAccessAllowed(true);
        setSessionToken(session.access_token);
      } else {
        setError("Admin access required.");
      }
    } catch (e) {
      console.error("[MembershipAdmin] Access check failed:", e);
      setError("Unable to verify permissions.");
    } finally {
      setAuthChecked(true);
    }
  }, "checkAccess");
  const loadData = /* @__PURE__ */ __name(async () => {
    if (!sessionToken) return;
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${sessionToken}` };
      if (tab === 0) {
        const res = await fetch(`${API_BASE}/api/membership/applications`, { headers });
        if (res.ok) setApplications(await res.json().then((d) => d.applications));
      } else {
        const res = await fetch(`${API_BASE}/api/membership/members`, { headers });
        if (res.ok) setMembers(await res.json().then((d) => d.members));
      }
    } catch (e) {
      console.error("Failed to load:", e);
    } finally {
      setLoading(false);
    }
  }, "loadData");
  const handleApprove = /* @__PURE__ */ __name(async () => {
    if (!selectedApp) return;
    try {
      const res = await fetch(`${API_BASE}/api/membership/applications/${selectedApp.id}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`
        },
        body: JSON.stringify(approveData)
      });
      if (res.ok) {
        setApproveDialog(false);
        setSelectedApp(null);
        loadData();
      }
    } catch (e) {
      console.error("Failed to approve:", e);
    }
  }, "handleApprove");
  const getStatusColor = /* @__PURE__ */ __name((status) => {
    switch (status) {
      case "pending":
        return "warning";
      case "active":
        return "success";
      case "approved":
        return "success";
      case "rejected":
        return "error";
      case "expired":
        return "default";
      case "cancelled":
        return "error";
      default:
        return "default";
    }
  }, "getStatusColor");
  if (!authChecked || loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Container, { maxWidth: "md", sx: { py: 4 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { children: "Loading..." }) });
  }
  if (!accessAllowed) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(Container, { maxWidth: "sm", sx: { py: 6 }, children: [
      onBack && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: onBack, size: "small", variant: "contained", sx: { mb: 2 }, children: "Home" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { severity: "warning", children: error || "Admin access required to view membership management." })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Container, { maxWidth: "lg", sx: { py: 4 }, children: [
    onBack && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: onBack, size: "small", variant: "contained", sx: { bgcolor: "white", color: "black", textTransform: "none", fontWeight: 700, borderRadius: 999, mb: 1, "&:hover": { bgcolor: "grey.100" } }, children: "Home" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h4", sx: { mb: 3, fontWeight: 700 }, children: "Membership Management" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { value: tab, onChange: /* @__PURE__ */ __name((e, v) => setTab(v), "onChange"), sx: { mb: 3 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Tab, { label: "Applications" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Tab, { label: "Members" })
    ] }),
    tab === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "h6", sx: { mb: 2 }, children: [
        "Membership Applications (",
        applications.length,
        ")"
      ] }),
      loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { children: "Loading..." }) : applications.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { severity: "info", children: "No applications yet" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: "Name" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: "Email" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: "Phone" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: "Status" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: "Submitted" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: "Actions" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: applications.map((app) => /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: app.full_name }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: app.email }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: app.phone || "-" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Chip, { label: app.status, color: getStatusColor(app.status), size: "small" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: new Date(app.created_at).toLocaleDateString() }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: app.status === "pending" && /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              size: "small",
              variant: "contained",
              onClick: /* @__PURE__ */ __name(() => {
                setSelectedApp(app);
                setApproveDialog(true);
              }, "onClick"),
              children: "Approve"
            }
          ) })
        ] }, app.id)) })
      ] })
    ] }) }),
    tab === 1 && /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "h6", sx: { mb: 2 }, children: [
        "Active Members (",
        members.length,
        ")"
      ] }),
      loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { children: "Loading..." }) : members.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { severity: "info", children: "No members yet" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: "Name" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: "Email" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: "Tier" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: "Status" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: "Joined" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: "Expires" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: members.map((member) => /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: member.full_name }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: member.email }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Chip, { label: member.tier, color: "primary", size: "small" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Chip, { label: member.status, color: getStatusColor(member.status), size: "small" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: new Date(member.joined_at).toLocaleDateString() }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: member.expires_at ? new Date(member.expires_at).toLocaleDateString() : "Never" })
        ] }, member.id)) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open: approveDialog, onClose: /* @__PURE__ */ __name(() => setApproveDialog(false), "onClose"), maxWidth: "sm", fullWidth: true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Approve Membership" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogContent, { children: selectedApp && /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 2, sx: { pt: 1 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Applicant:" }),
          " ",
          selectedApp.full_name,
          " (",
          selectedApp.email,
          ")"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          TextField,
          {
            label: "Payment Amount",
            type: "number",
            fullWidth: true,
            value: approveData.payment_amount,
            onChange: /* @__PURE__ */ __name((e) => setApproveData({ ...approveData, payment_amount: e.target.value }), "onChange")
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          TextField,
          {
            label: "Payment Reference",
            fullWidth: true,
            value: approveData.payment_reference,
            onChange: /* @__PURE__ */ __name((e) => setApproveData({ ...approveData, payment_reference: e.target.value }), "onChange")
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          TextField,
          {
            label: "Tier",
            select: true,
            fullWidth: true,
            value: approveData.tier,
            onChange: /* @__PURE__ */ __name((e) => setApproveData({ ...approveData, tier: e.target.value }), "onChange"),
            SelectProps: { native: true },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "full", children: "Full" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "premium", children: "Premium" })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          TextField,
          {
            label: "Expires At (optional)",
            type: "date",
            fullWidth: true,
            value: approveData.expires_at,
            onChange: /* @__PURE__ */ __name((e) => setApproveData({ ...approveData, expires_at: e.target.value }), "onChange"),
            InputLabelProps: { shrink: true }
          }
        )
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogActions, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: /* @__PURE__ */ __name(() => setApproveDialog(false), "onClick"), children: "Cancel" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleApprove, variant: "contained", children: "Approve & Create Membership" })
      ] })
    ] })
  ] });
}
__name(MembershipAdmin, "MembershipAdmin");
export {
  MembershipAdmin as default
};
