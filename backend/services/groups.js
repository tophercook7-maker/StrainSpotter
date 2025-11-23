// backend/services/groups.js
// Helper functions for ZIP groups and feed posts

import { supabaseAdmin } from '../supabaseAdmin.js';

/**
 * Ensure a ZIP group exists, create if it doesn't
 * @param {string} zipCode - ZIP code
 * @param {string} country - Country code (default: 'US')
 * @param {object} options - Optional city, state
 * @returns {Promise<string>} group_id
 */
export async function ensureZipGroup(zipCode, country = 'US', options = {}) {
  const zip = (zipCode || '').trim();
  if (!zip) {
    throw new Error('Zip code is required');
  }

  // Check if group exists
  const { data: existing, error: existingError } = await supabaseAdmin
    .from('zip_groups')
    .select('id')
    .eq('zip_code', zip)
    .eq('country', country)
    .maybeSingle();

  if (existingError) {
    console.error('[groups] ensureZipGroup lookup error', existingError);
    throw existingError;
  }

  if (existing?.id) {
    // Update city/state if provided and different
    if (options.city || options.state) {
      const updates = {};
      if (options.city) updates.city = options.city;
      if (options.state) updates.state = options.state;

      await supabaseAdmin
        .from('zip_groups')
        .update(updates)
        .eq('id', existing.id);
    }
    return existing.id;
  }

  // Create new group
  const { data: newGroup, error: createError } = await supabaseAdmin
    .from('zip_groups')
    .insert({
      zip_code: zip,
      country,
      city: options.city || null,
      state: options.state || null,
    })
    .select('id')
    .single();

  if (createError) {
    console.error('[groups] ensureZipGroup create error', createError);
    throw createError;
  }

  return newGroup.id;
}

