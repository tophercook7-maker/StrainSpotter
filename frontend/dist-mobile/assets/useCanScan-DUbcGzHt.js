var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { r as reactExports, j as jsxRuntimeExports, F as Fade, P as Paper, T as Typography, B as Box, S as Stack, at as Zoom, au as Slide, av as LinearProgress, H as Chip, aw as keyframes } from "./react-vendor-DaVUs1pH.js";
import { u as useCreditBalance } from "./useCreditBalance-C4unyUsC.js";
import { c as useProMode } from "./App-BxlAc3TE.js";
const pulse = keyframes`
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
`;
const glow = keyframes`
  0%, 100% {
    box-shadow: 0 0 10px rgba(124, 179, 66, 0.5);
  }
  50% {
    box-shadow: 0 0 20px rgba(124, 179, 66, 0.8), 0 0 30px rgba(124, 179, 66, 0.6);
  }
`;
const SCAN_PHASES = {
  uploading: {
    title: "Uploading Image",
    description: "Securely uploading your photo to our servers…",
    why: "We compress and encrypt your image for fast, secure processing.",
    icon: "📤",
    color: "#2196F3"
  },
  processing: {
    title: "Processing Image",
    description: "Extracting text and visual features…",
    why: "Running Google Vision AI to read labels and analyze your photo.",
    icon: "🔍",
    color: "#FF9800"
  },
  matching: {
    title: "Matching Strain",
    description: "Searching our database of 35,000+ strains…",
    why: "Comparing visual features and text against our comprehensive strain library.",
    icon: "🧬",
    color: "#9C27B0"
  },
  analyzing: {
    title: "AI Analysis",
    description: "Decoding label details and generating insights…",
    why: "Our AI extracts THC, CBD, effects, flavors, and warnings from the label.",
    icon: "🤖",
    color: "#00BCD4"
  },
  finalizing: {
    title: "Finalizing Results",
    description: "Compiling your complete strain breakdown…",
    why: "Combining all analyses into a comprehensive result card.",
    icon: "✨",
    color: "#4CAF50"
  }
};
function AnimatedScanProgress({
  phase,
  message,
  progress = null,
  error = null
}) {
  const [currentStepIndex, setCurrentStepIndex] = reactExports.useState(0);
  const [completedSteps, setCompletedSteps] = reactExports.useState(/* @__PURE__ */ new Set());
  const [showWhy, setShowWhy] = reactExports.useState(false);
  const phaseKeys = Object.keys(SCAN_PHASES);
  const currentPhaseIndex = phase ? phaseKeys.indexOf(phase) : -1;
  reactExports.useEffect(() => {
    if (currentPhaseIndex >= 0) {
      setCurrentStepIndex(currentPhaseIndex);
      const completed = /* @__PURE__ */ new Set();
      for (let i = 0; i < currentPhaseIndex; i++) {
        completed.add(phaseKeys[i]);
      }
      setCompletedSteps(completed);
    }
  }, [phase, currentPhaseIndex, phaseKeys]);
  const currentPhase = phase ? SCAN_PHASES[phase] : null;
  if (error) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Fade, { in: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Paper,
      {
        sx: {
          p: 3,
          borderRadius: 3,
          background: "linear-gradient(135deg, rgba(244, 67, 54, 0.2), rgba(0, 0, 0, 0.6))",
          border: "2px solid rgba(244, 67, 54, 0.5)",
          textAlign: "center"
        },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", sx: { color: "#ff5252", mb: 1, fontWeight: 700 }, children: "⚠️ Scan Error" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "rgba(255, 255, 255, 0.9)" }, children: error })
        ]
      }
    ) });
  }
  if (!phase || !currentPhase) {
    return null;
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { width: "100%", maxWidth: 600, mx: "auto" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Fade, { in: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Paper,
    {
      sx: {
        p: 4,
        borderRadius: 4,
        background: "linear-gradient(135deg, rgba(0, 0, 0, 0.7), rgba(20, 30, 20, 0.9))",
        border: `2px solid ${currentPhase.color}40`,
        boxShadow: `0 8px 32px ${currentPhase.color}20`,
        position: "relative",
        overflow: "hidden"
      },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Box,
          {
            sx: {
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `linear-gradient(135deg, ${currentPhase.color}10, transparent)`,
              animation: `${glow} 2s ease-in-out infinite`,
              pointerEvents: "none"
            }
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 3, sx: { position: "relative", zIndex: 1 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { textAlign: "center" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Zoom, { in: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              Typography,
              {
                variant: "h3",
                sx: {
                  fontSize: "3rem",
                  mb: 1,
                  animation: phase ? `${pulse} 2s ease-in-out infinite` : "none"
                },
                children: currentPhase.icon
              }
            ) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Slide, { direction: "down", in: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              Typography,
              {
                variant: "h5",
                sx: {
                  color: currentPhase.color,
                  fontWeight: 700,
                  mb: 0.5,
                  textShadow: `0 0 10px ${currentPhase.color}40`
                },
                children: currentPhase.title
              }
            ) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Typography,
              {
                variant: "body1",
                sx: {
                  color: "rgba(255, 255, 255, 0.9)",
                  mb: 1
                },
                children: message || currentPhase.description
              }
            ),
            currentPhase.why && /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Box,
              {
                sx: {
                  mt: 2,
                  p: 2,
                  borderRadius: 2,
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  "&:hover": {
                    background: "rgba(255, 255, 255, 0.08)"
                  }
                },
                onClick: /* @__PURE__ */ __name(() => setShowWhy(!showWhy), "onClick"),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Typography,
                    {
                      variant: "caption",
                      sx: {
                        color: "rgba(255, 255, 255, 0.7)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 0.5
                      },
                      children: [
                        showWhy ? "▼" : "▶",
                        " Why does this take time?"
                      ]
                    }
                  ),
                  showWhy && /* @__PURE__ */ jsxRuntimeExports.jsx(Fade, { in: showWhy, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Typography,
                    {
                      variant: "body2",
                      sx: {
                        color: "rgba(255, 255, 255, 0.85)",
                        mt: 1,
                        textAlign: "left",
                        fontSize: "0.875rem",
                        lineHeight: 1.6
                      },
                      children: currentPhase.why
                    }
                  ) })
                ]
              }
            )
          ] }),
          progress !== null ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              LinearProgress,
              {
                variant: "determinate",
                value: progress,
                sx: {
                  height: 8,
                  borderRadius: 4,
                  bgcolor: "rgba(255, 255, 255, 0.1)",
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 4,
                    background: `linear-gradient(90deg, ${currentPhase.color}, ${currentPhase.color}CC)`,
                    boxShadow: `0 0 10px ${currentPhase.color}60`
                  }
                }
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Typography,
              {
                variant: "caption",
                sx: {
                  color: "rgba(255, 255, 255, 0.7)",
                  mt: 0.5,
                  display: "block",
                  textAlign: "right"
                },
                children: [
                  Math.round(progress),
                  "%"
                ]
              }
            )
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            LinearProgress,
            {
              sx: {
                height: 8,
                borderRadius: 4,
                bgcolor: "rgba(255, 255, 255, 0.1)",
                "& .MuiLinearProgress-bar": {
                  borderRadius: 4,
                  background: `linear-gradient(90deg, ${currentPhase.color}, ${currentPhase.color}CC)`,
                  boxShadow: `0 0 10px ${currentPhase.color}60`,
                  animation: "pulse 2s ease-in-out infinite"
                }
              }
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Stack, { direction: "row", spacing: 1, justifyContent: "center", flexWrap: "wrap", children: phaseKeys.map((key, index) => {
              const stepPhase = SCAN_PHASES[key];
              const isActive = phase === key;
              const isCompleted = completedSteps.has(key);
              const isPending = index > currentPhaseIndex;
              return /* @__PURE__ */ jsxRuntimeExports.jsx(
                Chip,
                {
                  label: stepPhase.icon,
                  size: "small",
                  sx: {
                    bgcolor: isCompleted ? `${stepPhase.color}30` : isActive ? `${stepPhase.color}40` : "rgba(255, 255, 255, 0.1)",
                    color: isCompleted || isActive ? stepPhase.color : "rgba(255, 255, 255, 0.5)",
                    border: `1px solid ${isCompleted ? stepPhase.color : isActive ? `${stepPhase.color}80` : "rgba(255, 255, 255, 0.2)"}`,
                    fontWeight: isActive ? 700 : 500,
                    fontSize: "1.2rem",
                    height: 36,
                    width: 36,
                    borderRadius: "50%",
                    animation: isActive ? `${pulse} 2s ease-in-out infinite` : "none",
                    transition: "all 0.3s ease",
                    opacity: isPending ? 0.4 : 1
                  }
                },
                key
              );
            }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Typography,
              {
                variant: "caption",
                sx: {
                  color: "rgba(255, 255, 255, 0.6)",
                  mt: 1,
                  display: "block",
                  textAlign: "center"
                },
                children: [
                  "Step ",
                  currentPhaseIndex + 1,
                  " of ",
                  phaseKeys.length
                ]
              }
            )
          ] })
        ] })
      ]
    }
  ) }) });
}
__name(AnimatedScanProgress, "AnimatedScanProgress");
function useCanScan() {
  const { remainingScans, isUnlimited, loading, error } = useCreditBalance();
  const { isFounder, founderUnlimitedEnabled } = useProMode();
  const safeRemaining = Number.isFinite(remainingScans) ? remainingScans : isUnlimited ? Number.POSITIVE_INFINITY : 0;
  const canScan = isFounder && founderUnlimitedEnabled || isUnlimited || safeRemaining > 0;
  return {
    canScan,
    remainingScans: safeRemaining,
    isFounder: Boolean(isFounder && founderUnlimitedEnabled),
    // Only true if both are true
    summary: { remainingScans: safeRemaining, isUnlimited: isUnlimited || isFounder && founderUnlimitedEnabled },
    loading,
    error
  };
}
__name(useCanScan, "useCanScan");
export {
  AnimatedScanProgress as A,
  useCanScan as u
};
