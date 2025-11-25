import { useEffect, useState } from 'react';
import { API_BASE } from '../config';

/**
 * Hook to fetch strain image URL from the strain-images API
 * @param {string|null} canonicalName - The canonical strain name (e.g., "SCOTT'S OG")
 * @returns {{imageUrl: string|null, loading: boolean}} - The image URL and loading state
 */
export function useStrainImage(canonicalName) {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!canonicalName || typeof canonicalName !== 'string' || canonicalName.trim().length === 0) {
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
          console.warn('[useStrainImage] Non-200 response:', res.status);
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
        console.error('[useStrainImage] Error fetching strain image:', err);
        if (!cancelled) {
          setImageUrl(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchImage();

    return () => {
      cancelled = true;
    };
  }, [canonicalName]);

  return { imageUrl, loading };
}

