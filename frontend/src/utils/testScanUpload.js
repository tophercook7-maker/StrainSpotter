// Utility to test scan upload and show RLS errors
import { API_BASE } from '../config';

export async function testScanUpload(base64, filename = 'test.jpg') {
  try {
    const res = await fetch(`${API_BASE}/uploads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, contentType: 'image/jpeg', base64 })
    });
    const data = await res.json();
    if (data.error && data.error.toLowerCase().includes('row-level security')) {
      return { ok: false, error: 'RLS error: Please run the migration SQL in Supabase.' };
    }
    return { ok: true, ...data };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
