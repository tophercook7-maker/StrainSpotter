var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { j as jsxRuntimeExports } from "./react-vendor-DaVUs1pH.js";
import { A as App } from "./App-BxlAc3TE.js";
import { u as useLocation, L as Link } from "./router-vendor-CizxVMW3.js";
import "./vendor-qR99EfKL.js";
function WebAppShell() {
  const location = useLocation();
  const isAppRoute = location.pathname.startsWith("/app");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "web-app-shell",
      style: {
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#050705"
      },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "nav",
          {
            className: "web-nav",
            style: {
              padding: "12px 20px",
              borderBottom: "1px solid rgba(124,179,66,0.2)",
              background: "rgba(5,7,5,0.95)",
              backdropFilter: "blur(10px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "16px",
              position: "sticky",
              top: 0,
              zIndex: 1e3
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Link,
                {
                  to: "/",
                  className: "web-nav-logo",
                  style: {
                    fontSize: "1.25rem",
                    fontWeight: 700,
                    color: "#7CB342",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "🍃" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "StrainSpotter" })
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  className: "web-nav-links",
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: "20px"
                  },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Link,
                      {
                        to: "/",
                        style: {
                          color: "#9CCC65",
                          textDecoration: "none",
                          fontSize: "0.9375rem",
                          transition: "color 0.2s"
                        },
                        onMouseEnter: /* @__PURE__ */ __name((e) => e.target.style.color = "#CDDC39", "onMouseEnter"),
                        onMouseLeave: /* @__PURE__ */ __name((e) => e.target.style.color = "#9CCC65", "onMouseLeave"),
                        children: "Home"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Link,
                      {
                        to: "/app",
                        style: {
                          color: isAppRoute ? "#CDDC39" : "#9CCC65",
                          textDecoration: "none",
                          fontSize: "0.9375rem",
                          fontWeight: isAppRoute ? 600 : 400,
                          transition: "color 0.2s"
                        },
                        onMouseEnter: /* @__PURE__ */ __name((e) => !isAppRoute && (e.target.style.color = "#CDDC39"), "onMouseEnter"),
                        onMouseLeave: /* @__PURE__ */ __name((e) => !isAppRoute && (e.target.style.color = "#9CCC65"), "onMouseLeave"),
                        children: "App"
                      }
                    )
                  ]
                }
              )
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "main",
          {
            className: "web-app-main",
            style: {
              flex: 1,
              minHeight: 0,
              overflow: "auto"
            },
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(App, {})
          }
        )
      ]
    }
  );
}
__name(WebAppShell, "WebAppShell");
export {
  WebAppShell as default
};
