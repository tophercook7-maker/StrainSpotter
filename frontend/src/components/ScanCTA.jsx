import React from 'react';
import { useMembership } from '../hooks/useMembership';

// Props: supabase, onScanResult(json), onJoinClub(), getImageBase64():Promise<string>
export default function ScanCTA({ supabase, onScanResult, onJoinClub, getImageBase64 }) {
  const { status } = useMembership({ supabase });
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState(null);

  async function handleClick() {
    setErr(null);
    if (status.isMember) {
      // Member: full scan flow
      onJoinClub?.();
      return;
    }
    try {
      setBusy(true);
      const imageBase64 = await getImageBase64?.();
      if (!imageBase64) throw new Error('No image selected');
      // Basic user: scan and show results
      const json = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 })
      }).then(r => r.json());
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
        {busy ? 'Scanning…' : 'Scan'}
      </button>
      {err && <div style={{ color: 'crimson', marginTop: 8 }}>{err}</div>}
    </div>
  );
}
