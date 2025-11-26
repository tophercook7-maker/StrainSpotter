var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { r as reactExports } from "./react-vendor-DaVUs1pH.js";
import { a as API_BASE } from "./App-BxlAc3TE.js";
function useStrainImage(canonicalName) {
  const [imageUrl, setImageUrl] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(false);
  reactExports.useEffect(() => {
    if (!canonicalName || typeof canonicalName !== "string" || canonicalName.trim().length === 0) {
      setImageUrl(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    async function fetchImage() {
      try {
        setLoading(true);
        const normalizedName = canonicalName.trim().toUpperCase();
        const res = await fetch(
          `${API_BASE}/api/strain-images?canonicalName=${encodeURIComponent(normalizedName)}`
        );
        if (!res.ok) {
          console.warn("[useStrainImage] Non-200 response:", res.status);
          if (!cancelled) {
            setImageUrl(null);
          }
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setImageUrl(data.imageUrl || null);
        }
      } catch (err) {
        console.error("[useStrainImage] Error fetching strain image:", err);
        if (!cancelled) {
          setImageUrl(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    __name(fetchImage, "fetchImage");
    fetchImage();
    return () => {
      cancelled = true;
    };
  }, [canonicalName]);
  return { imageUrl, loading };
}
__name(useStrainImage, "useStrainImage");
export {
  useStrainImage as u
};
