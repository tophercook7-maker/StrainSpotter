import React from 'react';
import { useMembership } from '../hooks/useMembership';

// Props: supabase, onScanResult(json), onJoinClub(), getImageBase64():Promise<string>
export default function ScanCTA({ supabase, onScanResult, onJoinClub, getImageBase64 }) {
  const { gated, status, doTryMeScan } = useMembership({ supabase });
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState(null);

  async function handleClick() {
    setErr(null);
    if (status.isMember) {
      // Delegate to full scan flow outside Try Me (likely your existing backend route)
      onJoinClub?.();
      return;
    }
    if (!gated.canScan) {
      onJoinClub?.();
      return;
    }
    try {
      setBusy(true);
      const imageBase64 = await getImageBase64?.();
      if (!imageBase64) throw new Error('No image selected');
      const json = await doTryMeScan({ imageBase64 });
      onScanResult?.(json);
    } catch (e) {
      setErr(e?.message || 'Scan failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button disabled={busy} onClick={handleClick}>
        {busy ? 'Scanning…' : gated.cta}
      </button>
      {err && <div style={{ color: 'crimson', marginTop: 8 }}>{err}</div>}
    </div>
  );
}
