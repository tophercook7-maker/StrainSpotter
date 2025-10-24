// Centralized configuration for frontend
// Local-first: when running on localhost, prefer the local Express API even if VITE_API_BASE is set to a remote URL.
const fromEnv = import.meta.env.VITE_API_BASE;
const isLocalhost = typeof window !== 'undefined' && /localhost|127\.0\.0\.1/.test(window.location.host);
const isEnvLocal = typeof fromEnv === 'string' && /localhost|127\.0\.0\.1/.test(fromEnv);
// If we're on localhost but VITE_API_BASE points to a remote server (e.g., Vercel), use the local backend to avoid CORS in dev.
const resolvedForLocal = isLocalhost ? (isEnvLocal ? fromEnv : 'http://localhost:5181') : (fromEnv || 'https://rdqpxixsbqcsyfewcmbz.supabase.co/rest/v1');
export const API_BASE = resolvedForLocal.replace(/\/$/, '');

// Functions base (Edge Functions if provided, otherwise fall back to backend API routes)
// This ensures uploads/processing work even if Supabase Edge Functions aren't deployed yet.
const functionsFromEnv = import.meta.env.VITE_FUNCTIONS_BASE;
const functionsFallback = `${API_BASE}/api`;
export const FUNCTIONS_BASE = (functionsFromEnv || functionsFallback).replace(/\/$/, '');
