var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { r as reactExports, j as jsxRuntimeExports, D as Dialog, q as DialogContent, B as Box, T as Typography, bo as MobileStepper, i as Button, a2 as CameraAltIcon, b8 as ScienceIcon, bp as PlaylistAddCheckIcon } from "./react-vendor-DaVUs1pH.js";
import "./vendor-qR99EfKL.js";
const slides = [
  {
    icon: /* @__PURE__ */ jsxRuntimeExports.jsx(CameraAltIcon, { sx: { fontSize: 48 } }),
    title: "Snap a bud or label",
    body: "Use your camera to capture the bud, jar label, or packaging. Clear lighting and sharp focus give Vision the best chance to identify the strain."
  },
  {
    icon: /* @__PURE__ */ jsxRuntimeExports.jsx(ScienceIcon, { sx: { fontSize: 48 } }),
    title: "AI compares against known strains",
    body: "We run your photo through Vision, cross-reference 35k+ strains, and rank the closest matches with transparent confidence scores."
  },
  {
    icon: /* @__PURE__ */ jsxRuntimeExports.jsx(PlaylistAddCheckIcon, { sx: { fontSize: 48 } }),
    title: "Log grows & experiences",
    body: "Save matches to your journal or grow log, track effects and ratings, and build a personal profile of what works best for you."
  }
];
function FirstRunIntro({ open, onFinish }) {
  const [index, setIndex] = reactExports.useState(0);
  const activeSlide = reactExports.useMemo(() => slides[index], [index]);
  const handleNext = /* @__PURE__ */ __name(() => {
    if (index >= slides.length - 1) {
      onFinish?.();
    } else {
      setIndex((prev) => prev + 1);
    }
  }, "handleNext");
  const handleBack = /* @__PURE__ */ __name(() => {
    setIndex((prev) => Math.max(0, prev - 1));
  }, "handleBack");
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, fullScreen: true, PaperProps: { sx: { background: "#041204", color: "#fff" } }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { sx: { display: "flex", flexDirection: "column", height: "100%", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 3 }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { children: activeSlide.icon }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h4", fontWeight: 800, children: activeSlide.title }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body1", color: "rgba(255,255,255,0.75)", sx: { maxWidth: 420 }, children: activeSlide.body }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      MobileStepper,
      {
        steps: slides.length,
        position: "static",
        activeStep: index,
        nextButton: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "contained", color: "success", onClick: handleNext, children: index === slides.length - 1 ? "Start scanning" : "Next" }),
        backButton: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleBack, disabled: index === 0, children: "Back" })
      }
    )
  ] }) });
}
__name(FirstRunIntro, "FirstRunIntro");
export {
  FirstRunIntro as default
};
