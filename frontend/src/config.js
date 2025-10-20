// Centralized configuration for frontend
// Priority: VITE_API_BASE > localhost Express during dev > Supabase Functions in prod
const fromEnv = import.meta.env.VITE_API_BASE;
const isLocalhost = typeof window !== 'undefined' && /localhost|127\.0\.0\.1/.test(window.location.host);
const fallback = isLocalhost ? 'http://localhost:5181' : 'https://rdqpxixsbqcsyfewcmbz.functions.supabase.co';
export const API_BASE = (fromEnv || fallback).replace(/\/$/, '');
