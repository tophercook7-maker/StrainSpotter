import { useEffect, useState } from 'react';
import { API_BASE } from '../config';

export function useMergedGroupFeed(zip, radiusKm = 25) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!!zip);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!zip) return;

      setLoading(true);
      setError(null);

      try {
        const url = `${API_BASE}/api/groups/${encodeURIComponent(zip)}/merged-feed?radiusKm=${radiusKm}`;
        const res = await fetch(url);

        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(`Merged feed error ${res.status}: ${text}`);
        }

        const json = await res.json();

        if (!cancelled) {
          setData(json);
        }
      } catch (e) {
        console.error('[useMergedGroupFeed] error', {
          zip,
          radiusKm,
          message: e?.message,
          stack: e?.stack,
        });

        if (!cancelled) {
          setError(e);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [zip, radiusKm]);

  return { data, loading, error };
}

