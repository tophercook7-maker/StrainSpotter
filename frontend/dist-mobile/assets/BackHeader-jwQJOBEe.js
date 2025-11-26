var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { j as jsxRuntimeExports, B as Box, I as IconButton, y as ArrowBackIcon, T as Typography } from "./react-vendor-DaVUs1pH.js";
function BackHeader({ title, onBack }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Box,
    {
      sx: {
        display: "flex",
        alignItems: "center",
        paddingTop: "calc(env(safe-area-inset-top, 0px) + 4px)",
        paddingBottom: 0.5,
        px: 1.5,
        gap: 1,
        flexShrink: 0,
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        backgroundColor: "transparent",
        backdropFilter: "blur(8px)",
        minHeight: 44,
        // Reduced header height
        maxHeight: 44
      },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          IconButton,
          {
            edge: "start",
            onClick: onBack,
            sx: {
              color: "#fff",
              "&:hover": {
                backgroundColor: "rgba(124, 179, 66, 0.2)"
              }
            },
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowBackIcon, {})
          }
        ),
        title && /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", fontWeight: 600, sx: { color: "#fff", flex: 1 }, children: title })
      ]
    }
  );
}
__name(BackHeader, "BackHeader");
export {
  BackHeader as B
};
