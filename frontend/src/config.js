// Centralized configuration for frontend
// Priority: VITE_API_BASE > localhost Express during dev > Supabase (REST) in prod
const fromEnv = import.meta.env.VITE_API_BASE;
const isLocalhost = typeof window !== 'undefined' && /localhost|127\.0\.0\.1/.test(window.location.host);
const fallback = isLocalhost ? 'http://localhost:5181' : 'https://rdqpxixsbqcsyfewcmbz.supabase.co/rest/v1';
export const API_BASE = (fromEnv || fallback).replace(/\/$/, '');

// Functions base (Edge Functions if provided, otherwise fall back to backend API routes)
// This ensures uploads/processing work even if Supabase Edge Functions aren't deployed yet.
const functionsFromEnv = import.meta.env.VITE_FUNCTIONS_BASE;
const functionsFallback = `${API_BASE}/api`;
export const FUNCTIONS_BASE = (functionsFromEnv || functionsFallback).replace(/\/$/, '');
