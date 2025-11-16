// Centralized configuration for frontend
// Local-first: when running on localhost, prefer the local Express API even if env points remote.
const envCandidates = [
  import.meta.env.VITE_API_BASE,
  import.meta.env.VITE_API_BASE_URL,
  import.meta.env.VITE_BACKEND_URL,
  import.meta.env.VITE_API_URL
].map((value) => (typeof value === 'string' ? value.trim() : '')).filter(Boolean);

const fromEnv = envCandidates.length ? envCandidates[0] : '';
const isLocalhost = typeof window !== 'undefined' && /localhost|127\.0\.0\.1/.test(window.location.host);
const isEnvLocal = fromEnv && /localhost|127\.0\.0\.1/.test(fromEnv);
const isCapacitor = typeof window !== 'undefined' && window.location.protocol === 'capacitor:';

// Default remote API (Render backend) used when no env override is provided
const DEFAULT_REMOTE_API = 'https://strainspotter.onrender.com';

// If we're on localhost but VITE_API_BASE points to a remote server (e.g., Vercel), use the local backend to avoid CORS in dev.
// If we're in Capacitor (mobile app), always use the remote API
const resolvedForLocal = isCapacitor
  ? (!fromEnv || /localhost|127\.0\.0\.1/.test(fromEnv) ? DEFAULT_REMOTE_API : fromEnv)
  : isLocalhost
    ? (isEnvLocal ? fromEnv : 'http://localhost:5181')
    : (fromEnv || DEFAULT_REMOTE_API);

export const API_BASE = resolvedForLocal.replace(/\/$/, '');

// Log configuration on startup for debugging
console.log('[Config] API_BASE:', API_BASE);
console.log('[Config] isCapacitor:', isCapacitor);
console.log('[Config] isLocalhost:', isLocalhost);

if (!isLocalhost && !isCapacitor && !fromEnv) {
  console.warn('[Config] VITE_API_BASE not set. Falling back to default remote API.');
}

// Functions base (Edge Functions if provided, otherwise fall back to backend API routes)
// This ensures uploads/processing work even if Supabase Edge Functions aren't deployed yet.
const functionsFromEnv = import.meta.env.VITE_FUNCTIONS_BASE;
const functionsFallback = `${API_BASE}/api`;
export const FUNCTIONS_BASE = (functionsFromEnv || functionsFallback).replace(/\/$/, '');
