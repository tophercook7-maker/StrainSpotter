var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { r as reactExports, j as jsxRuntimeExports, B as Box, C as Container, i as Button, T as Typography, A as Alert, f as Card, h as CardContent, S as Stack, m as TextField, k as Tabs, l as Tab, n as CircularProgress, aI as List, aJ as ListItem, aL as ListItemAvatar, M as Avatar, aK as ListItemText, H as Chip } from "./react-vendor-DaVUs1pH.js";
import { a as API_BASE } from "./App-BxlAc3TE.js";
import "./vendor-qR99EfKL.js";
function Friends({ userId = "demo-user", onBack }) {
  const [tab, setTab] = reactExports.useState(0);
  const [friends, setFriends] = reactExports.useState([]);
  const [sent, setSent] = reactExports.useState([]);
  const [received, setReceived] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [error, setError] = reactExports.useState(null);
  const [friendUsername, setFriendUsername] = reactExports.useState("");
  const fetchFriends = reactExports.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/friends?user_id=${userId}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to load friends");
      }
      const data = await res.json();
      setFriends(data.friends || []);
      setSent(data.sent || []);
      setReceived(data.received || []);
      setError(null);
    } catch (e) {
      console.error("Friends fetch error:", e);
      setError(e.message);
      setFriends([]);
      setSent([]);
      setReceived([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);
  reactExports.useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);
  const sendRequest = /* @__PURE__ */ __name(async () => {
    if (!friendUsername.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/api/friends/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, friend_id: "friend-user-id" })
        // Replace with actual lookup
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to send request");
      }
      setFriendUsername("");
      fetchFriends();
    } catch (e) {
      setError(e.message);
    }
  }, "sendRequest");
  const acceptRequest = /* @__PURE__ */ __name(async (friendshipId) => {
    try {
      const res = await fetch(`${API_BASE}/api/friends/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendship_id: friendshipId })
      });
      if (!res.ok) throw new Error("Failed to accept");
      fetchFriends();
    } catch (e) {
      setError(e.message);
    }
  }, "acceptRequest");
  const rejectRequest = /* @__PURE__ */ __name(async (friendshipId) => {
    try {
      const res = await fetch(`${API_BASE}/api/friends/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendship_id: friendshipId })
      });
      if (!res.ok) throw new Error("Failed to reject");
      fetchFriends();
    } catch (e) {
      setError(e.message);
    }
  }, "rejectRequest");
  const removeFriend = /* @__PURE__ */ __name(async (friendshipId) => {
    try {
      const res = await fetch(`${API_BASE}/api/friends/${friendshipId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove");
      fetchFriends();
    } catch (e) {
      setError(e.message);
    }
  }, "removeFriend");
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { minHeight: "100vh" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Container, { maxWidth: "md", sx: { py: 4 }, children: [
    onBack && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: onBack, size: "small", variant: "contained", sx: { bgcolor: "white", color: "black", textTransform: "none", fontWeight: 700, borderRadius: 999, mb: 1, "&:hover": { bgcolor: "grey.100" } }, children: "Home" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h4", gutterBottom: true, children: "Friends" }),
    error && /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { severity: "error", sx: { mb: 2 }, children: error }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { sx: { mb: 3 }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", gutterBottom: true, children: "Add Friend" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", spacing: 2, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          TextField,
          {
            placeholder: "Enter username",
            value: friendUsername,
            onChange: /* @__PURE__ */ __name((e) => setFriendUsername(e.target.value), "onChange"),
            fullWidth: true
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "contained", onClick: sendRequest, children: "Send Request" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { value: tab, onChange: /* @__PURE__ */ __name((_, v) => setTab(v), "onChange"), sx: { mb: 2 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Tab, { label: `Friends (${friends.length})` }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Tab, { label: `Requests (${received.length})` }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Tab, { label: `Sent (${sent.length})` })
    ] }),
    loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircularProgress, {}) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      tab === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(List, { children: friends.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", color: "text.secondary", children: "No friends yet" }) : friends.map((f) => {
        const friend = f.user_id === userId ? f.friend : f.users;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(ListItem, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ListItemAvatar, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { src: friend?.avatar_url, children: friend?.username?.[0] || "?" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(ListItemText, { primary: friend?.username || "Unknown", secondary: `Friends since ${new Date(f.accepted_at).toLocaleDateString()}` }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "small", color: "error", onClick: /* @__PURE__ */ __name(() => removeFriend(f.id), "onClick"), children: "Remove" })
        ] }, f.id);
      }) }),
      tab === 1 && /* @__PURE__ */ jsxRuntimeExports.jsx(List, { children: received.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", color: "text.secondary", children: "No pending requests" }) : received.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsxs(ListItem, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ListItemAvatar, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { src: r.users?.avatar_url, children: r.users?.username?.[0] || "?" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(ListItemText, { primary: r.users?.username || "Unknown", secondary: `Requested ${new Date(r.requested_at).toLocaleDateString()}` }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", spacing: 1, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "small", variant: "contained", onClick: /* @__PURE__ */ __name(() => acceptRequest(r.id), "onClick"), children: "Accept" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "small", variant: "outlined", onClick: /* @__PURE__ */ __name(() => rejectRequest(r.id), "onClick"), children: "Reject" })
        ] })
      ] }, r.id)) }),
      tab === 2 && /* @__PURE__ */ jsxRuntimeExports.jsx(List, { children: sent.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", color: "text.secondary", children: "No sent requests" }) : sent.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs(ListItem, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ListItemAvatar, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { src: s.friend?.avatar_url, children: s.friend?.username?.[0] || "?" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(ListItemText, { primary: s.friend?.username || "Unknown", secondary: `Sent ${new Date(s.requested_at).toLocaleDateString()}` }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Chip, { label: "Pending", size: "small" })
      ] }, s.id)) })
    ] })
  ] }) });
}
__name(Friends, "Friends");
export {
  Friends as default
};
