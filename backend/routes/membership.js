// Membership & Trial Management Routes
// POST /api/membership/master-key - Instantly upgrade to full-access with master key
router.post('/master-key', express.json(), async (req, res, next) => {
  try {
    const { user_id, key } = req.body;
    const MASTER_KEY = process.env.MASTER_KEY || 'KING123';
    if (key !== MASTER_KEY) {
      return res.status(403).json({ error: 'Invalid master key' });
    }
    if (!user_id) {
      return res.status(400).json({ error: 'user_id required' });
    }
    // Upsert membership to full-access
    const { data: existing } = await db
      .from('memberships')
      .select('*')
      .eq('user_id', user_id)
      .maybeSingle();
    let membership;
    if (existing) {
      const { data, error } = await db
        .from('memberships')
        .update({ tier: 'full-access', status: 'active' })
        .eq('user_id', user_id)
        .select()
        .single();
      if (error) return res.status(500).json({ error: error.message });
      membership = data;
    } else {
      const { data, error } = await db
        .from('memberships')
        .insert({ user_id, tier: 'full-access', status: 'active', email: '', full_name: '' })
        .select()
        .single();
      if (error) return res.status(500).json({ error: error.message });
      membership = data;
    }
    res.json({ success: true, membership });
  } catch (e) {
    next(e);
  }
});
import express from 'express';
import { supabase } from '../supabaseClient.js';
import { supabaseAdmin } from '../supabaseAdmin.js';
import { checkAccess } from '../middleware/membershipCheck.js';

const router = express.Router();
const db = supabaseAdmin ?? supabase;

// Constants
const TRIAL_SCAN_LIMIT = 2;
const TRIAL_SEARCH_LIMIT = 2;
const TRIAL_DURATION_DAYS = 7;

// GET /api/membership/status - Check current membership/trial status
router.get('/status', checkAccess, async (req, res, next) => {
  try {
    const response = {
      status: req.membershipStatus,
  tier: req.tier || 'scan-only'
    };

    if (req.membershipStatus === 'trial' || req.membershipStatus === 'trial_expired') {
      response.trial = {
        scanCount: req.trial.scan_count,
        scanLimit: TRIAL_SCAN_LIMIT,
        scansRemaining: Math.max(0, TRIAL_SCAN_LIMIT - req.trial.scan_count),
        searchCount: req.trial.search_count,
        searchLimit: TRIAL_SEARCH_LIMIT,
        searchesRemaining: Math.max(0, TRIAL_SEARCH_LIMIT - req.trial.search_count),
        expiresAt: req.trial.trial_expires_at,
        isExpired: req.membershipStatus === 'trial_expired'
      };
    }

    res.json(response);
  } catch (e) {
    next(e);
  }
});

// POST /api/membership/apply - Submit membership application
router.post('/apply', express.json(), async (req, res, next) => {
  try {
    const { email, full_name, phone, message } = req.body;

    if (!email || !full_name) {
      return res.status(400).json({ error: 'Email and full name are required' });
    }

    // Check for existing application
    const { data: existing } = await db
      .from('membership_applications')
      .select('*')
      .eq('email', email)
      .eq('status', 'pending')
      .maybeSingle();

    if (existing) {
      return res.status(400).json({
        error: 'Application already exists',
        message: 'You already have a pending membership application'
      });
    }

    // Create application
    const { data, error } = await db
      .from('membership_applications')
      .insert({
        email,
        full_name,
        phone: phone || null,
        message: message || null
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({
      success: true,
      application: data,
      message: 'Application submitted successfully! We will review and contact you soon.'
    });
  } catch (e) {
    next(e);
  }
});

// GET /api/membership/applications - List all applications (admin)
router.get('/applications', async (req, res, next) => {
  try {
    const { status } = req.query;

    let query = db
      .from('membership_applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ applications: data });
  } catch (e) {
    next(e);
  }
});

// POST /api/membership/applications/:id/approve - Approve application (admin)
router.post('/applications/:id/approve', express.json(), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { payment_received, payment_amount, payment_reference, expires_at, tier } = req.body;

    // Get application
    const { data: app, error: appError } = await db
      .from('membership_applications')
      .select('*')
      .eq('id', id)
      .single();

    if (appError || !app) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Update application status
    await db
      .from('membership_applications')
      .update({
        status: 'approved',
        payment_received: payment_received || false,
        payment_amount: payment_amount || null,
        payment_reference: payment_reference || null,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', id);

    // Create membership
    const { data: membership, error: memberError } = await db
      .from('memberships')
      .insert({
        email: app.email,
        full_name: app.full_name,
        phone: app.phone,
        status: 'active',
  tier: tier || 'full-access',
        payment_amount: payment_amount || null,
        payment_reference: payment_reference || null,
        expires_at: expires_at || null
      })
      .select()
      .single();

    if (memberError) {
      return res.status(500).json({ error: memberError.message });
    }

    res.json({
      success: true,
      membership,
      message: 'Membership activated successfully'
    });
  } catch (e) {
    next(e);
  }
});

// GET /api/membership/members - List all members (admin)
router.get('/members', async (req, res, next) => {
  try {
    const { status, tier } = req.query;

    let query = db
      .from('memberships')
      .select('*')
      .order('joined_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (tier) {
      query = query.eq('tier', tier === 'scan-only' || tier === 'full-access' ? tier : (tier === 'trial' ? 'scan-only' : 'full-access'));
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ members: data, count: data.length });
  } catch (e) {
    next(e);
  }
});

// POST /api/membership/members/:id/update - Update member status (admin)
router.post('/members/:id/update', express.json(), async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await db
      .from('memberships')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true, membership: data });
  } catch (e) {
    next(e);
  }
});

export default router;
