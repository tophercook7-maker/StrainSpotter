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

// Default remote API (Vercel backend) used when no env override is provided
const DEFAULT_REMOTE_API = 'https://backend-qp9e6f9oh-tophercook7-makers-projects.vercel.app';

// If we're on localhost but VITE_API_BASE points to a remote server (e.g., Vercel), use the local backend to avoid CORS in dev.
const resolvedForLocal = isLocalhost
  ? (isEnvLocal ? fromEnv : 'http://localhost:5181')
  : (fromEnv || DEFAULT_REMOTE_API);

export const API_BASE = resolvedForLocal.replace(/\/$/, '');

// Functions base (Edge Functions if provided, otherwise fall back to backend API routes)
// This ensures uploads/processing work even if Supabase Edge Functions aren't deployed yet.
const functionsFromEnv = import.meta.env.VITE_FUNCTIONS_BASE;
const functionsFallback = `${API_BASE}/api`;
export const FUNCTIONS_BASE = (functionsFromEnv || functionsFallback).replace(/\/$/, '');
