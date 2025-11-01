/**
 * Grower Directory + Messaging API Routes
 *
 * Endpoints for:
 * - Grower profile management
 * - Directory listing and search
 * - Messaging between members
 * - Moderation
 * - Blocking users
 */

import express from 'express';
import { supabase } from '../supabaseClient.js';
import { supabaseAdmin } from '../supabaseAdmin.js';

const router = express.Router();

// ============================================
// GROWER PROFILE ENDPOINTS
// ============================================

/**
 * POST /api/growers/profile/setup
 * Initial grower profile setup
 */
router.post('/profile/setup', async (req, res) => {
  try {
    const {
      userId,
      isGrower,
      licenseStatus,
      experienceYears,
      bio,
      specialties,
      city,
      state,
      country,
      farmName,
      acceptsMessages,
      optInDirectory,
      phone,
      address,
      contactRiskAcknowledged
    } = req.body;

    // Validate required fields
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    if (isGrower && experienceYears < 3) {
      return res.status(400).json({
        error: 'Minimum 3 years of growing experience required to be listed in directory'
      });
    }

    // Validate contact info risk acknowledgment
    if ((phone || address) && !contactRiskAcknowledged) {
      return res.status(400).json({
        error: 'You must acknowledge the risks before adding contact information'
      });
    }

    const client = supabaseAdmin ?? supabase;

    // Update profile with grower information
    const { data, error } = await client
      .from('profiles')
      .update({
        is_grower: isGrower,
        grower_license_status: licenseStatus,
        grower_experience_years: experienceYears,
        grower_bio: bio,
        grower_specialties: specialties,
        grower_city: city,
        grower_state: state,
        grower_country: country || 'USA',
        grower_farm_name: farmName,
        grower_accepts_messages: acceptsMessages,
        grower_listed_in_directory: optInDirectory,
        grower_directory_consent_date: optInDirectory ? new Date().toISOString() : null,
        grower_phone: phone || null,
        grower_address: address || null,
        grower_contact_risk_acknowledged: contactRiskAcknowledged || false,
        grower_contact_risk_acknowledged_date: (phone || address) ? new Date().toISOString() : null,
        grower_last_active: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error setting up grower profile:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true, profile: data });
  } catch (e) {
    console.error('Error in grower profile setup:', e);
    res.status(500).json({ error: String(e) });
  }
});

/**
 * PUT /api/growers/profile/update
 * Update grower profile (freely editable)
 */
router.put('/profile/update', async (req, res) => {
  try {
    const {
      userId,
      bio,
      specialties,
      city,
      state,
      farmName,
      acceptsMessages,
      phone,
      address,
      contactRiskAcknowledged,
      profileImageUrl
    } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Validate contact info risk acknowledgment
    if ((phone || address) && !contactRiskAcknowledged) {
      return res.status(400).json({
        error: 'You must acknowledge the risks before adding contact information'
      });
    }

    const client = supabaseAdmin ?? supabase;

    const updateData = {
      grower_bio: bio,
      grower_specialties: specialties,
      grower_city: city,
      grower_state: state,
      grower_farm_name: farmName,
      grower_accepts_messages: acceptsMessages,
      grower_last_active: new Date().toISOString()
    };

    // Only update contact info if provided
    if (phone !== undefined) {
      updateData.grower_phone = phone;
      if (phone && contactRiskAcknowledged) {
        updateData.grower_contact_risk_acknowledged = true;
        updateData.grower_contact_risk_acknowledged_date = new Date().toISOString();
      }
    }

    if (address !== undefined) {
      updateData.grower_address = address;
      if (address && contactRiskAcknowledged) {
        updateData.grower_contact_risk_acknowledged = true;
        updateData.grower_contact_risk_acknowledged_date = new Date().toISOString();
      }
    }

    if (profileImageUrl !== undefined) {
      updateData.grower_profile_image_url = profileImageUrl;
      // Reset approval status when image changes
      updateData.grower_image_approved = false;
      updateData.grower_image_moderated_by = null;
      updateData.grower_image_moderated_at = null;
    }

    const { data, error } = await client
      .from('profiles')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating grower profile:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true, profile: data });
  } catch (e) {
    console.error('Error in grower profile update:', e);
    res.status(500).json({ error: String(e) });
  }
});

/**
 * GET /api/growers/profile/:userId
 * Get specific grower profile
 */
router.get('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const client = supabaseAdmin ?? supabase;

    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .eq('is_grower', true)
      .single();

    if (error) {
      console.error('Error fetching grower profile:', error);
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'Grower profile not found' });
    }

    res.json(data);
  } catch (e) {
    console.error('Error in get grower profile:', e);
    res.status(500).json({ error: String(e) });
  }
});

/**
 * POST /api/growers/profile/opt-in
 * Opt into directory listing
 */
router.post('/profile/opt-in', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const client = supabaseAdmin ?? supabase;

    const { data, error } = await client
      .from('profiles')
      .update({
        grower_listed_in_directory: true,
        grower_directory_consent_date: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error opting into directory:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true, profile: data });
  } catch (e) {
    console.error('Error in opt-in:', e);
    res.status(500).json({ error: String(e) });
  }
});

/**
 * POST /api/growers/profile/opt-out
 * Opt out of directory listing
 */
router.post('/profile/opt-out', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const client = supabaseAdmin ?? supabase;

    const { data, error } = await client
      .from('profiles')
      .update({
        grower_listed_in_directory: false
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error opting out of directory:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true, profile: data });
  } catch (e) {
    console.error('Error in opt-out:', e);
    res.status(500).json({ error: String(e) });
  }
});

// ============================================
// GROWER DIRECTORY ENDPOINTS
// ============================================

/**
 * GET /api/growers
 * List all growers in directory (with 3+ years experience)
 */
router.get('/', async (req, res) => {
  try {
    const { state, licenseStatus, specialty, limit = 50, offset = 0 } = req.query;
    const client = supabaseAdmin ?? supabase;

    let query = client
      .from('profiles')
      .select('*')
      .eq('is_grower', true)
      .eq('grower_listed_in_directory', true)
      .gte('grower_experience_years', 3)
      .order('grower_last_active', { ascending: false });

    // Apply filters
    if (state) {
      query = query.eq('grower_state', state);
    }

    if (licenseStatus) {
      query = query.eq('grower_license_status', licenseStatus);
    }

    if (specialty) {
      query = query.contains('grower_specialties', [specialty]);
    }

    // Pagination
    query = query.range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching growers:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({
      growers: data || [],
      total: count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (e) {
    console.error('Error in list growers:', e);
    res.status(500).json({ error: String(e) });
  }
});

/**
 * GET /api/growers/search
 * Search growers by name, location, or specialty
 */
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query (q) is required' });
    }

    const client = supabaseAdmin ?? supabase;

    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('is_grower', true)
      .eq('grower_listed_in_directory', true)
      .gte('grower_experience_years', 3)
      .or(`grower_farm_name.ilike.%${q}%,grower_city.ilike.%${q}%,grower_state.ilike.%${q}%,grower_bio.ilike.%${q}%`)
      .order('grower_last_active', { ascending: false })
      .limit(parseInt(limit));

    if (error) {
      console.error('Error searching growers:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ growers: data || [] });
  } catch (e) {
    console.error('Error in search growers:', e);
    res.status(500).json({ error: String(e) });
  }
});

export default router;
