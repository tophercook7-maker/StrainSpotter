/**
 * Admin Authentication Middleware
 * Protects admin-only endpoints by verifying user authentication and admin status
 */

import { supabaseAdmin } from '../supabaseAdmin.js';

// List of admin email addresses
const ADMIN_EMAILS = [
  'strainspotter25@gmail.com',
  'admin@strainspotter.com',
  'topher.cook7@gmail.com' // Topher is also an admin
];

/**
 * Middleware to require admin authentication
 * Checks Authorization header for valid JWT token and verifies admin status
 */
export async function requireAdmin(req, res, next) {
  try {
    // Get authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ 
        error: 'Authentication required',
        hint: 'Include Authorization: Bearer <token> header'
      });
    }

    // Extract token
    const token = authHeader.replace('Bearer ', '').trim();
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Invalid authorization header',
        hint: 'Format: Authorization: Bearer <token>'
      });
    }

    // Verify token and get user
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      console.error('[adminAuth] Token verification failed:', error?.message || 'No user');
      return res.status(401).json({ 
        error: 'Invalid or expired token',
        hint: 'Please sign in again'
      });
    }

    // Check if user is admin
    if (!ADMIN_EMAILS.includes(user.email)) {
      console.warn(`[adminAuth] Non-admin user attempted admin access: ${user.email}`);
      return res.status(403).json({ 
        error: 'Admin access required',
        hint: 'This endpoint is restricted to administrators'
      });
    }

    // Attach user to request for downstream use
    req.user = user;
    req.isAdmin = true;

    console.log(`[adminAuth] Admin access granted: ${user.email}`);
    next();
  } catch (e) {
    console.error('[adminAuth] Unexpected error:', e);
    return res.status(500).json({ 
      error: 'Authentication error',
      details: e.message
    });
  }
}

/**
 * Optional admin check - allows request to proceed but sets req.isAdmin flag
 * Useful for endpoints that have different behavior for admins vs regular users
 */
export async function optionalAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      req.isAdmin = false;
      return next();
    }

    const token = authHeader.replace('Bearer ', '').trim();
    
    if (!token) {
      req.isAdmin = false;
      return next();
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      req.isAdmin = false;
      return next();
    }

    req.user = user;
    req.isAdmin = ADMIN_EMAILS.includes(user.email);
    
    if (req.isAdmin) {
      console.log(`[adminAuth] Admin detected: ${user.email}`);
    }
    
    next();
  } catch (e) {
    console.error('[adminAuth] Optional admin check error:', e);
    req.isAdmin = false;
    next();
  }
}

/**
 * Check if a user ID is an admin (for use in route handlers)
 */
export async function isAdmin(userId) {
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (error || !user) {
      return false;
    }

    return ADMIN_EMAILS.includes(user.email);
  } catch (e) {
    console.error('[adminAuth] isAdmin check error:', e);
    return false;
  }
}

/**
 * Get admin emails list (for use in other modules)
 */
export function getAdminEmails() {
  return [...ADMIN_EMAILS];
}

