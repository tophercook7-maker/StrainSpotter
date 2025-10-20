// Utility to test scan upload and show RLS errors
import { API_BASE } from '../config';

export async function testScanUpload(base64, filename = 'test.jpg') {
  try {
    const res = await fetch(`${API_BASE}/api/uploads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, contentType: 'image/jpeg', base64 })
    });

    // Try to read JSON; fall back to text for non-JSON errors
    let data;
    try {
      data = await res.json();
    } catch {
      const text = await res.text();
      return { ok: false, error: text || `HTTP ${res.status}` };
    }

    if (!res.ok) {
      const baseMsg = data?.error || `HTTP ${res.status}`;
      const hint = data?.hint ? ` Hint: ${data.hint}` : '';
      return { ok: false, error: `${baseMsg}${hint}` };
    }

    // Specific RLS guidance (backend sends a hint when service role is missing)
    if (data?.error && /row-level security/i.test(data.error)) {
      const hint = data?.hint || 'Add SUPABASE_SERVICE_ROLE_KEY to env/.env.local and restart the backend.';
      return { ok: false, error: `RLS error: ${hint}` };
    }

    return { ok: true, ...data };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
