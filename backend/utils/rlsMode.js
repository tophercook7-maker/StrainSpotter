import { supabase } from '../supabaseClient.js';
import { supabaseAdmin } from '../supabaseAdmin.js';

const RLS_MODE = (process.env.RLS_MODE || 'dev').toLowerCase();
const ALLOW_SERVICE_SHORTCUTS = RLS_MODE !== 'prod';

export function getUserScopedClient() {
  if (ALLOW_SERVICE_SHORTCUTS && supabaseAdmin) {
    return supabaseAdmin;
  }
  return supabase;
}

export function getPrivilegedClient() {
  return supabaseAdmin ?? supabase;
}

export function getRlsConfig() {
  return {
    mode: RLS_MODE,
    allowServiceShortcuts: ALLOW_SERVICE_SHORTCUTS,
    usingServiceRole: Boolean(supabaseAdmin)
  };
}

export function isProdRls() {
  return RLS_MODE === 'prod';
}

