/**
 * Generate a random 4-character business code
 * Format: 4 characters from 'ABCDEFGHJKMNPQRSTUVWXYZ23456789' (no confusing chars like I, L, O, 0, 1)
 * @returns {string} 4-character business code
 */
export function generateBusinessCode() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * Validate business code format
 * @param {string} code - Business code to validate
 * @returns {boolean} True if valid format
 */
export function isValidBusinessCode(code) {
  if (!code || typeof code !== 'string') return false;
  // Format: 4 characters from allowed set
  return /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$/.test(code);
}

