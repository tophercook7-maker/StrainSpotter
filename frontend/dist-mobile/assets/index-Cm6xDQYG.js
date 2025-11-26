const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./App-BxlAc3TE.js","./vendor-qR99EfKL.js","./react-vendor-DaVUs1pH.js","./WebLanding-CbfE3ZWZ.js","./router-vendor-CizxVMW3.js","./WebAppShell-Pu7pMWaf.js"])))=>i.map(i=>d[i]);
var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { A as __vitePreload } from "./vendor-qR99EfKL.js";
import { R as React, j as jsxRuntimeExports, d as ReactDOM, e as clientExports, r as reactExports } from "./react-vendor-DaVUs1pH.js";
import { B as BrowserRouter, R as Routes, a as Route } from "./router-vendor-CizxVMW3.js";
(/* @__PURE__ */ __name(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) return;
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) processPreload(link);
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") continue;
      for (const node of mutation.addedNodes) if (node.tagName === "LINK" && node.rel === "modulepreload") processPreload(node);
    }
  }).observe(document, {
    childList: true,
    subtree: true
  });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials") fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  __name(getFetchOpts, "getFetchOpts");
  function processPreload(link) {
    if (link.ep) return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
  __name(processPreload, "processPreload");
}, "polyfill"))();
const _ErrorBoundary = class _ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
        color: "white",
        backgroundColor: "red",
        padding: 32,
        minHeight: "100vh",
        fontSize: "16px"
      }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { children: "Something went wrong." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("pre", { style: { whiteSpace: "pre-wrap", wordBreak: "break-word" }, children: [
          String(this.state.error),
          this.state.error?.stack
        ] })
      ] });
    }
    return this.props.children;
  }
};
__name(_ErrorBoundary, "ErrorBoundary");
let ErrorBoundary = _ErrorBoundary;
if (typeof window !== "undefined") {
  window.React = React;
  window.ReactDOM = ReactDOM;
  if (typeof globalThis !== "undefined") {
    globalThis.React = React;
    globalThis.ReactDOM = ReactDOM;
  }
  try {
    Object.defineProperty(window, "React", {
      value: React,
      writable: false,
      configurable: false
    });
  } catch (e) {
  }
}
const App = React.lazy(() => {
  if (typeof window !== "undefined" && !window.React) {
    window.React = React;
  }
  return __vitePreload(() => import("./App-BxlAc3TE.js").then((n) => n.d), true ? __vite__mapDeps([0,1,2]) : void 0, import.meta.url).then((module) => {
    return module;
  }).catch((error) => {
    console.error("[CRITICAL] Failed to load App.jsx:", error);
    throw error;
  });
});
const WebLanding = React.lazy(() => __vitePreload(() => import("./WebLanding-CbfE3ZWZ.js"), true ? __vite__mapDeps([3,2,1,4]) : void 0, import.meta.url));
const WebAppShell = React.lazy(() => __vitePreload(() => import("./WebAppShell-Pu7pMWaf.js"), true ? __vite__mapDeps([5,2,1,0,4]) : void 0, import.meta.url));
const SpeedInsights = React.lazy(
  () => typeof window !== "undefined" && window.location.protocol !== "capacitor:" ? __vitePreload(() => import("./react-vendor-DaVUs1pH.js").then((n) => n.bv), true ? __vite__mapDeps([2,1]) : void 0, import.meta.url).then((m) => ({ default: m.SpeedInsights })) : Promise.resolve({ default: /* @__PURE__ */ __name(() => null, "default") })
);
if (typeof window !== "undefined") {
  console.log("StrainSpotter main.jsx loading...");
  console.log("Protocol:", window.location?.protocol);
  console.log("Hostname:", window.location?.hostname);
}
const isCapacitor = typeof window !== "undefined" && window.location.protocol === "capacitor:";
const LoadingScreen = /* @__PURE__ */ __name(() => {
  const [progress, setProgress] = reactExports.useState(0);
  const [status, setStatus] = reactExports.useState("Initializing...");
  const [dots, setDots] = reactExports.useState("");
  reactExports.useEffect(() => {
    const statuses = [
      { text: "Loading core libraries...", progress: 20 },
      { text: "Initializing React framework...", progress: 40 },
      { text: "Setting up UI components...", progress: 60 },
      { text: "Connecting to services...", progress: 80 },
      { text: "Almost ready...", progress: 95 }
    ];
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < statuses.length) {
        setStatus(statuses[currentIndex].text);
        setProgress(statuses[currentIndex].progress);
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 300);
    const dotInterval = setInterval(() => {
      setDots((prev) => prev.length >= 3 ? "" : prev + ".");
    }, 500);
    return () => {
      clearInterval(interval);
      clearInterval(dotInterval);
    };
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      style: {
        width: "100%",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0a1f0a 0%, #1a3a1a 50%, #0a1f0a 100%)",
        color: "#C5E1A5",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        position: "relative",
        overflow: "hidden"
      },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            style: {
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `
            radial-gradient(circle at 20% 30%, rgba(124, 179, 66, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(156, 204, 101, 0.1) 0%, transparent 50%)
          `,
              animation: "pulse 3s ease-in-out infinite"
            }
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      ` }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            style: {
              width: 100,
              height: 100,
              borderRadius: "50%",
              background: "linear-gradient(135deg, rgba(124, 179, 66, 0.3), rgba(156, 204, 101, 0.3))",
              border: "3px solid rgba(124, 179, 66, 0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24,
              boxShadow: "0 0 40px rgba(124, 179, 66, 0.4)",
              animation: "float 2s ease-in-out infinite"
            },
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              "img",
              {
                src: "/hero.png?v=13",
                alt: "StrainSpotter",
                style: {
                  width: "80%",
                  height: "80%",
                  objectFit: "cover",
                  borderRadius: "50%"
                }
              }
            )
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "h1",
          {
            style: {
              fontSize: "2rem",
              fontWeight: 700,
              margin: "0 0 8px 0",
              background: "linear-gradient(135deg, #CDDC39, #9CCC65)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text"
            },
            children: "StrainSpotter"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "p",
          {
            style: {
              fontSize: "0.95rem",
              margin: "0 0 24px 0",
              opacity: 0.9,
              minHeight: "1.5em"
            },
            children: [
              status,
              dots
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            style: {
              width: "80%",
              maxWidth: 300,
              height: 4,
              background: "rgba(124, 179, 66, 0.2)",
              borderRadius: 2,
              overflow: "hidden",
              marginBottom: 16
            },
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                style: {
                  width: `${progress}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #7CB342, #9CCC65)",
                  borderRadius: 2,
                  transition: "width 0.3s ease",
                  boxShadow: "0 0 10px rgba(124, 179, 66, 0.5)"
                }
              }
            )
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "p",
          {
            style: {
              fontSize: "0.75rem",
              opacity: 0.6,
              textAlign: "center",
              maxWidth: 280,
              margin: "16px 0 0 0",
              lineHeight: 1.4
            },
            children: "Loading 35,000+ strain database and AI models for instant identification"
          }
        )
      ]
    }
  );
}, "LoadingScreen");
const LoadingFallback = LoadingScreen;
function RootApp() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { fallback: /* @__PURE__ */ jsxRuntimeExports.jsx(LoadingFallback, {}), children: /* @__PURE__ */ jsxRuntimeExports.jsx(App, {}) });
}
__name(RootApp, "RootApp");
function CapacitorRoot() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(RootApp, {});
}
__name(CapacitorRoot, "CapacitorRoot");
function WebRoot() {
  React.useEffect(() => {
    if (typeof document !== "undefined") {
      document.body.classList.add("web-root");
      return () => {
        document.body.classList.remove("web-root");
      };
    }
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(BrowserRouter, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { fallback: /* @__PURE__ */ jsxRuntimeExports.jsx(LoadingFallback, {}), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Routes, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/", element: /* @__PURE__ */ jsxRuntimeExports.jsx(WebLanding, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/app/*", element: /* @__PURE__ */ jsxRuntimeExports.jsx(WebAppShell, {}) })
  ] }) }) });
}
__name(WebRoot, "WebRoot");
try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element not found");
  }
  const root = clientExports.createRoot(rootElement);
  root.render(
    /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.StrictMode, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(ErrorBoundary, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(reactExports.Suspense, { fallback: /* @__PURE__ */ jsxRuntimeExports.jsx(LoadingScreen, {}), children: [
      isCapacitor ? /* @__PURE__ */ jsxRuntimeExports.jsx(CapacitorRoot, {}) : /* @__PURE__ */ jsxRuntimeExports.jsx(WebRoot, {}),
      !isCapacitor && /* @__PURE__ */ jsxRuntimeExports.jsx(SpeedInsights, {})
    ] }) }) })
  );
  setTimeout(() => {
    const splash = document.getElementById("splash-root");
    if (splash && splash.parentNode) {
      splash.style.opacity = "0";
      splash.style.transition = "opacity 0.3s ease";
      setTimeout(() => {
        if (splash.parentNode) {
          splash.parentNode.removeChild(splash);
        }
      }, 300);
    }
  }, 500);
} catch (error) {
  console.error("Failed to render app:", error);
  console.error("Error stack:", error.stack);
  const rootEl = document.getElementById("root");
  if (rootEl) {
    rootEl.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        background: #0C1910;
        color: #C5E1A5;
        font-family: system-ui;
        text-align: center;
        padding: 24px;
      ">
        <h1>Loading Error</h1>
        <p style="color: #ff6b6b; margin: 16px 0;">${String(error)}</p>
        <pre style="background: rgba(0,0,0,0.3); padding: 16px; border-radius: 8px; font-size: 12px; max-width: 90%; overflow: auto; text-align: left;">
          ${error.stack || "No stack trace"}
        </pre>
        <button onclick="location.reload()" style="
          margin-top: 16px;
          padding: 12px 24px;
          background: #7CB342;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          cursor: pointer;
        ">Reload</button>
      </div>
    `;
  }
  const splash = document.getElementById("splash-root");
  if (splash && splash.parentNode) {
    splash.parentNode.removeChild(splash);
  }
}
