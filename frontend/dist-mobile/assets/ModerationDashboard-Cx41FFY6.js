var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { r as reactExports, j as jsxRuntimeExports, C as Container, av as LinearProgress, i as Button, A as Alert, T as Typography, S as Stack, f as Card, h as CardContent, k as Tabs, l as Tab, bi as TableContainer, P as Paper, bd as Table, be as TableHead, bf as TableRow, bg as TableCell, bh as TableBody, H as Chip, Q as Tooltip, I as IconButton, bj as CheckCircleIcon, $ as WarningIcon, K as DeleteIcon, D as Dialog, p as DialogTitle, q as DialogContent, B as Box, m as TextField, u as DialogActions } from "./react-vendor-DaVUs1pH.js";
import { s as supabase, a as API_BASE } from "./App-BxlAc3TE.js";
import "./vendor-qR99EfKL.js";
const STATUS_TABS = [
  { value: "pending", label: "New" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" }
];
function ModerationDashboard({ onBack }) {
  const [reportsByStatus, setReportsByStatus] = reactExports.useState({
    pending: [],
    in_progress: [],
    resolved: []
  });
  const [stats, setStats] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  const [selectedReport, setSelectedReport] = reactExports.useState(null);
  const [resolveDialogOpen, setResolveDialogOpen] = reactExports.useState(false);
  const [moderatorNotes, setModeratorNotes] = reactExports.useState("");
  const [actionType, setActionType] = reactExports.useState("approve");
  const [error, setError] = reactExports.useState(null);
  const [activeStatus, setActiveStatus] = reactExports.useState("pending");
  const [sessionToken, setSessionToken] = reactExports.useState(null);
  const [accessAllowed, setAccessAllowed] = reactExports.useState(false);
  const [authChecked, setAuthChecked] = reactExports.useState(false);
  reactExports.useEffect(() => {
    checkAccess();
  }, []);
  reactExports.useEffect(() => {
    if (accessAllowed && sessionToken) {
      loadData();
    }
  }, [accessAllowed, sessionToken]);
  const checkAccess = /* @__PURE__ */ __name(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError("Sign in required to access moderation tools.");
        setAuthChecked(true);
        return;
      }
      const res = await fetch(`${API_BASE}/api/users/onboarding-status`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (!res.ok) {
        setError("Failed to verify permissions.");
        setAuthChecked(true);
        return;
      }
      const payload = await res.json();
      const role = payload?.profile?.role;
      if (role === "admin" || role === "moderator") {
        setAccessAllowed(true);
        setSessionToken(session.access_token);
      } else {
        setError("Moderator access required.");
      }
    } catch (e) {
      console.error("[Moderation] Access check failed:", e);
      setError("Unable to verify access.");
    } finally {
      setAuthChecked(true);
    }
  }, "checkAccess");
  const loadData = /* @__PURE__ */ __name(async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${sessionToken}` };
      const reportResponses = await Promise.all(
        STATUS_TABS.map(
          (tab) => fetch(`${API_BASE}/api/moderation/reports?status=${tab.value}`, { headers })
        )
      );
      const nextReports = {};
      await Promise.all(reportResponses.map(async (resp, idx) => {
        const tab = STATUS_TABS[idx];
        if (resp.ok) {
          const data = await resp.json();
          nextReports[tab.value] = data.reports || [];
        } else {
          nextReports[tab.value] = [];
        }
      }));
      setReportsByStatus((prev) => ({ ...prev, ...nextReports }));
      const statsRes = await fetch(`${API_BASE}/api/moderation/stats`, { headers });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (e) {
      console.error("[Moderation] Load error:", e);
      setError("Failed to load moderation data");
    } finally {
      setLoading(false);
    }
  }, "loadData");
  const handleResolve = /* @__PURE__ */ __name(async () => {
    if (!selectedReport) return;
    try {
      setError(null);
      const res = await fetch(`${API_BASE}/api/moderation/reports/${selectedReport.id}/resolve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          action: actionType,
          moderator_notes: moderatorNotes
        })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to resolve report");
      }
      setResolveDialogOpen(false);
      setSelectedReport(null);
      setModeratorNotes("");
      loadData();
    } catch (e) {
      setError(e.message);
    }
  }, "handleResolve");
  const openResolveDialog = /* @__PURE__ */ __name((report, action) => {
    setSelectedReport(report);
    setActionType(action);
    setResolveDialogOpen(true);
  }, "openResolveDialog");
  if (!authChecked || loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Container, { maxWidth: "lg", sx: { py: 4 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(LinearProgress, {}) });
  }
  if (!accessAllowed) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(Container, { maxWidth: "sm", sx: { py: 6 }, children: [
      onBack && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: onBack, size: "small", variant: "contained", sx: { mb: 2 }, children: "Home" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { severity: "warning", children: error || "Moderator access required to view this dashboard." })
    ] });
  }
  const currentReports = reportsByStatus[activeStatus] || [];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Container, { maxWidth: "lg", sx: { py: 4 }, children: [
    onBack && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: onBack, size: "small", variant: "contained", sx: { bgcolor: "white", color: "black", textTransform: "none", fontWeight: 700, borderRadius: 999, mb: 1, "&:hover": { bgcolor: "grey.100" } }, children: "Home" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h4", sx: { fontWeight: 800, mb: 3 }, children: "Moderation Dashboard" }),
    error && /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { severity: "error", sx: { mb: 3 }, onClose: /* @__PURE__ */ __name(() => setError(null), "onClose"), children: error }),
    stats && /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", spacing: 2, sx: { mb: 4 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { sx: { flex: 1 }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h3", color: "warning.main", sx: { fontWeight: 700 }, children: stats.pendingReports }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", color: "text.secondary", children: "Pending Reports" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { sx: { flex: 1 }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h3", color: "success.main", sx: { fontWeight: 700 }, children: stats.resolvedReports }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", color: "text.secondary", children: "Resolved Reports" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { sx: { flex: 1 }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h3", color: "primary.main", sx: { fontWeight: 700 }, children: stats.totalMessages }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", color: "text.secondary", children: "Total Messages" })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", sx: { mb: 2, fontWeight: 700 }, children: "Report Triage" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Tabs,
        {
          value: activeStatus,
          onChange: /* @__PURE__ */ __name((_, value) => setActiveStatus(value), "onChange"),
          sx: { mb: 2 },
          variant: "scrollable",
          allowScrollButtonsMobile: true,
          children: STATUS_TABS.map((tab) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            Tab,
            {
              value: tab.value,
              label: `${tab.label} (${reportsByStatus[tab.value]?.length || 0})`
            },
            tab.value
          ))
        }
      ),
      currentReports.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { severity: "info", children: "No reports in this queue. Great job!" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(TableContainer, { component: Paper, variant: "outlined", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: "Report ID" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: "Reason" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: "Message Content" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: "Reporter" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: "Reported" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { align: "right", children: "Actions" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: currentReports.map((report) => /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { hover: true, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "caption", sx: { fontFamily: "monospace" }, children: [
            report.id.slice(0, 8),
            "..."
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            Chip,
            {
              label: report.reason,
              size: "small",
              color: report.reason === "harassment" ? "error" : "warning"
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(TableCell, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { maxWidth: 300 }, noWrap: true, children: report.messages?.content || "(message deleted)" }),
            report.details && /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "caption", color: "text.secondary", sx: { display: "block", mt: 0.5 }, children: [
              "Details: ",
              report.details
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: report.reported_by ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "caption", sx: { fontFamily: "monospace" }, children: [
            report.reported_by.slice(0, 8),
            "..."
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "caption", color: "text.secondary", children: "Anonymous" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "caption", color: "text.secondary", children: new Date(report.created_at).toLocaleString() }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { align: "right", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", spacing: 1, justifyContent: "flex-end", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { title: "Approve (false positive)", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              IconButton,
              {
                size: "small",
                color: "success",
                onClick: /* @__PURE__ */ __name(() => openResolveDialog(report, "approve"), "onClick"),
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircleIcon, {})
              }
            ) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { title: "Warn user", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              IconButton,
              {
                size: "small",
                color: "warning",
                onClick: /* @__PURE__ */ __name(() => openResolveDialog(report, "warn"), "onClick"),
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(WarningIcon, {})
              }
            ) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { title: "Remove message", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              IconButton,
              {
                size: "small",
                color: "error",
                onClick: /* @__PURE__ */ __name(() => openResolveDialog(report, "remove"), "onClick"),
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(DeleteIcon, {})
              }
            ) })
          ] }) })
        ] }, report.id)) })
      ] }) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open: resolveDialogOpen, onClose: /* @__PURE__ */ __name(() => setResolveDialogOpen(false), "onClose"), maxWidth: "sm", fullWidth: true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogTitle, { children: [
        "Resolve Report: ",
        actionType === "approve" ? "Approve" : actionType === "warn" ? "Warn User" : "Remove Message"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
        selectedReport && /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { mb: 2 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "subtitle2", color: "text.secondary", children: "Message Content:" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body1", sx: { mb: 2, p: 1, bgcolor: "grey.100", borderRadius: 1 }, children: selectedReport.messages?.content || "(message deleted)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "subtitle2", color: "text.secondary", children: [
            "Reason: ",
            selectedReport.reason
          ] }),
          selectedReport.details && /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", color: "text.secondary", sx: { mt: 1 }, children: [
            "Details: ",
            selectedReport.details
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          TextField,
          {
            label: "Moderator Notes (optional)",
            multiline: true,
            rows: 3,
            fullWidth: true,
            value: moderatorNotes,
            onChange: /* @__PURE__ */ __name((e) => setModeratorNotes(e.target.value), "onChange"),
            placeholder: "Add any notes about this decision..."
          }
        ),
        actionType === "remove" && /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { severity: "warning", sx: { mt: 2 }, children: "This will permanently delete the message from the database." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogActions, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: /* @__PURE__ */ __name(() => setResolveDialogOpen(false), "onClick"), children: "Cancel" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            onClick: handleResolve,
            variant: "contained",
            color: actionType === "remove" ? "error" : actionType === "warn" ? "warning" : "success",
            children: actionType === "approve" ? "Approve" : actionType === "warn" ? "Warn User" : "Remove Message"
          }
        )
      ] })
    ] })
  ] });
}
__name(ModerationDashboard, "ModerationDashboard");
export {
  ModerationDashboard as default
};
