var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { j as jsxRuntimeExports, f as Card, h as CardContent, S as Stack, T as Typography, i as Button } from "./react-vendor-DaVUs1pH.js";
function EmptyStateCard({ title, description, actionLabel, onAction, secondaryActionLabel, onSecondaryAction, icon }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Card,
    {
      variant: "outlined",
      sx: {
        borderRadius: 3,
        borderColor: "rgba(255,255,255,0.2)",
        background: "rgba(124, 179, 66, 0.1)",
        color: "#fff",
        textAlign: "center",
        p: 2
      },
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 2, alignItems: "center", children: [
        icon,
        /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", fontWeight: 700, children: title }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", color: "rgba(255,255,255,0.8)", children: description }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: { xs: "column", sm: "row" }, spacing: 1, children: [
          actionLabel && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "contained", color: "success", onClick: onAction, children: actionLabel }),
          secondaryActionLabel && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outlined", color: "inherit", onClick: onSecondaryAction, children: secondaryActionLabel })
        ] })
      ] }) })
    }
  );
}
__name(EmptyStateCard, "EmptyStateCard");
export {
  EmptyStateCard as E
};
