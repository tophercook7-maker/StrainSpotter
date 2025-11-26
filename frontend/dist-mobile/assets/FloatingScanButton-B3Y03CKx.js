var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { j as jsxRuntimeExports, Q as Tooltip, a1 as Fab, a2 as CameraAltIcon } from "./react-vendor-DaVUs1pH.js";
import { u as useAuth } from "./App-BxlAc3TE.js";
import "./vendor-qR99EfKL.js";
function FloatingScanButton({ onClick }) {
  const { user } = useAuth();
  if (!user) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { title: "Start a new scan", placement: "left", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
    Fab,
    {
      color: "primary",
      onClick,
      sx: {
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 1500,
        boxShadow: "0 12px 32px rgba(0,0,0,0.25)"
      },
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(CameraAltIcon, {})
    }
  ) });
}
__name(FloatingScanButton, "FloatingScanButton");
export {
  FloatingScanButton as default
};
