var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { r as reactExports, j as jsxRuntimeExports, B as Box, i as Button, f as Card, h as CardContent, T as Typography, S as Stack, m as TextField } from "./react-vendor-DaVUs1pH.js";
import { a as API_BASE } from "./App-BxlAc3TE.js";
import "./vendor-qR99EfKL.js";
function FeedbackChat({ onBack }) {
  const [messages, setMessages] = reactExports.useState([]);
  const [input, setInput] = reactExports.useState("");
  const [posting, setPosting] = reactExports.useState(false);
  const [testingEmail, setTestingEmail] = reactExports.useState(false);
  const [testResult, setTestResult] = reactExports.useState(null);
  const load = /* @__PURE__ */ __name(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/feedback/messages`);
      if (res.ok) {
        setMessages(await res.json());
      }
    } catch (e) {
      console.error("[Feedback] Load error:", e);
    }
  }, "load");
  const sendTestEmail = /* @__PURE__ */ __name(async () => {
    setTestingEmail(true);
    setTestResult(null);
    try {
      const res = await fetch(`${API_BASE}/diagnostic/email-test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: "strainspotter25feedback@gmail.com" })
      });
      const data = await res.json();
      setTestResult(data.ok ? "Email sent!" : `Error: ${data.error || "Unknown"}`);
    } catch {
      setTestResult("Network error");
    }
    setTestingEmail(false);
  }, "sendTestEmail");
  reactExports.useEffect(() => {
    load();
  }, []);
  const send = /* @__PURE__ */ __name(async () => {
    const content = input.trim();
    if (!content) return;
    setPosting(true);
    try {
      console.log("[Feedback] Sending to:", `${API_BASE}/api/feedback/messages`);
      const res = await fetch(`${API_BASE}/api/feedback/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkcXB4aXhzYnFjc3lmZXdjbWJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMjI3NTMsImV4cCI6MjA3NTY5ODc1M30.rTbYZNKNv1szvzjA2D828OVt7qUZVSXgi4G_tUqm3mA"
        },
        body: JSON.stringify({ content, user_id: null })
      });
      if (res.ok) {
        setInput("");
        await load();
      } else {
        const errText = await res.text();
        console.error("[Feedback] Send failed:", errText);
        alert("Failed to send feedback. Please try again.");
      }
    } catch (e) {
      console.error("[Feedback] Error:", e);
      alert("Network error sending feedback.");
    } finally {
      setPosting(false);
    }
  }, "send");
  const handleKeyPress = /* @__PURE__ */ __name((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }, "handleKeyPress");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { p: 2 }, children: [
    onBack && /* @__PURE__ */ jsxRuntimeExports.jsx(
      Button,
      {
        onClick: onBack,
        size: "small",
        variant: "contained",
        sx: {
          bgcolor: "white",
          color: "black",
          textTransform: "none",
          fontWeight: 700,
          borderRadius: 999,
          mb: 2,
          "&:hover": { bgcolor: "grey.100" }
        },
        children: "Home"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { sx: {
      bgcolor: "rgba(255,255,255,0.7)",
      boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
      backdropFilter: "blur(12px)",
      borderRadius: 4,
      border: "1px solid rgba(255,255,255,0.18)"
    }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", sx: { mb: 2 }, children: "Feedback" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 1, sx: { mb: 2, maxHeight: 300, overflow: "auto" }, children: [
        messages.map((m) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { p: 1, bgcolor: "background.default", borderRadius: 1 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", color: "text.secondary", children: new Date(m.created_at).toLocaleString() }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body1", children: m.content })
        ] }, m.id)),
        messages.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", color: "text.secondary", children: "No feedback yet. Be the first!" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", spacing: 1, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          TextField,
          {
            fullWidth: true,
            size: "small",
            placeholder: "Type feedback... (press Enter to send)",
            value: input,
            onChange: /* @__PURE__ */ __name((e) => setInput(e.target.value), "onChange"),
            onKeyPress: handleKeyPress
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            variant: "outlined",
            size: "small",
            onClick: sendTestEmail,
            disabled: testingEmail,
            sx: { textTransform: "none" },
            children: testingEmail ? "Sending..." : "Send Test Email"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "contained", onClick: send, disabled: posting, children: "Send" })
      ] }),
      testResult && /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { px: 2, pb: 1 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", color: testResult === "Email sent!" ? "success.main" : "error.main", children: testResult }) })
    ] }) })
  ] });
}
__name(FeedbackChat, "FeedbackChat");
export {
  FeedbackChat as default
};
