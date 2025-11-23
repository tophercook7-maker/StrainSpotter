// backend/config/proMode.js
// Central toggle for "pro mode" / business features.

const RAW_FLAG =
  (process.env.PRO_MODE ||
    process.env.PRO_FEATURES ||
    process.env.STRIANSPOTTER_PRO_MODE ||
    'false')
    .toString()
    .toLowerCase();

export const PRO_MODE_ENABLED = RAW_FLAG === 'true';

// Simple helper for callsites that expect a function:
export function isProModeEnabled() {
  return PRO_MODE_ENABLED;
}

// Default export for callsites that do:
//   import proMode from './config/proMode.js';
const proMode = {
  enabled: PRO_MODE_ENABLED,
  label: process.env.PRO_MODE_LABEL || 'Standard',
};

export default proMode;

// Access codes from environment variables (for dispensary/grower roles)
const DISPENSARY_ACCESS_CODE = process.env.DISPENSARY_ACCESS_CODE || '';
const GROWER_ACCESS_CODE = process.env.GROWER_ACCESS_CODE || '';

/**
 * Resolve pro role from access code
 * @param {string} code - Access code to validate
 * @returns {string|null} 'dispensary', 'grower', or null if invalid
 */
export function resolveProRoleForCode(code) {
  if (!code) return null;

  const trimmed = String(code).trim();

  if (DISPENSARY_ACCESS_CODE && trimmed === DISPENSARY_ACCESS_CODE) {
    return 'dispensary';
  }

  if (GROWER_ACCESS_CODE && trimmed === GROWER_ACCESS_CODE) {
    return 'grower';
  }

  return null;
}

/**
 * Get pro role from request (from authenticated profile or header)
 * @param {object} req - Express request object
 * @returns {string|null} 'dispensary', 'grower', or null
 */
export function getProRoleFromRequest(req) {
  // Option 1: from authenticated profile (preferred)
  if (req.user?.profile?.pro_role && req.user?.profile?.pro_enabled) {
    return req.user.profile.pro_role;
  }

  // Option 2: from header if provided (e.g. X-Pro-Role)
  const headerRole = req.headers['x-pro-role'];
  if (headerRole === 'dispensary' || headerRole === 'grower') {
    return headerRole;
  }

  return null;
}
