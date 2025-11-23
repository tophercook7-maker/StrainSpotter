// backend/services/groupSeeder.js
// Helper functions for seeding default chat groups

import { supabaseAdmin } from '../supabaseAdmin.js';

/**
 * Ensure default global groups exist
 * Creates: StrainSpotter Lounge, All Dispensaries, All Growers
 */
export async function ensureDefaultGroups() {
  const defaultGroups = [
    {
      group_type: 'global',
      name: 'StrainSpotter Lounge',
      description: 'Main chat for everyone. Consumers, growers, dispensaries.',
      business_only: false,
      is_public: true,
    },
    {
      group_type: 'global',
      name: 'All Dispensaries',
      description: 'For dispensary owners & staff. Deals, operations, Q&A.',
      business_only: true,
      is_public: true,
    },
    {
      group_type: 'global',
      name: 'All Growers',
      description: 'Grow nerd chat. Genetics, cultivation, techniques.',
      business_only: true,
      is_public: true,
    },
  ];

  for (const g of defaultGroups) {
    const { data, error } = await supabaseAdmin
      .from('chat_groups')
      .select('*')
      .eq('group_type', g.group_type)
      .eq('name', g.name)
      .maybeSingle();

    if (error) {
      console.error('[groupSeeder] Error checking group', { name: g.name, error });
      continue;
    }

    if (!data) {
      const { data: inserted, error: insertError } = await supabaseAdmin
        .from('chat_groups')
        .insert(g)
        .select('id')
        .single();

      if (insertError) {
        console.error('[groupSeeder] Error creating group', { name: g.name, error: insertError });
      } else {
        console.log('[groupSeeder] Created default group', { name: g.name, id: inserted.id });
      }
    }
  }
}

/**
 * Ensure a ZIP group exists for a given ZIP code
 * @param {string} zipCode - ZIP code
 * @param {object} options - Optional city, state for display name
 * @returns {Promise<string>} group_id
 */
export async function ensureZipGroup(zipCode, options = {}) {
  const zip = (zipCode || '').trim();
  if (!zip) {
    throw new Error('ZIP code is required');
  }

  // Check if ZIP group already exists
  const { data: existing, error: existingError } = await supabaseAdmin
    .from('chat_groups')
    .select('id')
    .eq('group_type', 'zip')
    .eq('zip_code', zip)
    .maybeSingle();

  if (existingError) {
    console.error('[groupSeeder] Error checking ZIP group', { zip, error: existingError });
    throw existingError;
  }

  if (existing?.id) {
    return existing.id;
  }

  // Create ZIP group
  const city = options.city || '';
  const state = options.state || '';
  const name = city && state
    ? `${city} ${state} ${zip}`
    : `ZIP ${zip}`;

  const { data: newGroup, error: createError } = await supabaseAdmin
    .from('chat_groups')
    .insert({
      group_type: 'zip',
      zip_code: zip,
      name,
      description: `Local chat for ${zip}`,
      business_only: false,
      is_public: true,
    })
    .select('id')
    .single();

  if (createError) {
    console.error('[groupSeeder] Error creating ZIP group', { zip, error: createError });
    throw createError;
  }

  console.log('[groupSeeder] Created ZIP group', { zip, id: newGroup.id });
  return newGroup.id;
}

/**
 * Auto-join user to their ZIP group and default global groups
 * Called when user signs up or updates their ZIP code
 * @param {string} userId - User ID
 * @param {string} zipCode - User's ZIP code (optional)
 */
export async function autoJoinUserToGroups(userId, zipCode = null) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  // Ensure default groups exist
  await ensureDefaultGroups();

  const groupIdsToJoin = [];

  // Get default global groups
  const { data: globalGroups } = await supabaseAdmin
    .from('chat_groups')
    .select('id')
    .eq('group_type', 'global')
    .eq('is_public', true);

  if (globalGroups) {
    groupIdsToJoin.push(...globalGroups.map((g) => g.id));
  }

  // Add ZIP group if provided
  if (zipCode) {
    try {
      const zipGroupId = await ensureZipGroup(zipCode);
      groupIdsToJoin.push(zipGroupId);
    } catch (err) {
      console.error('[groupSeeder] Failed to create/join ZIP group', { userId, zipCode, error: err });
    }
  }

  // Join user to groups (skip if already member)
  for (const groupId of groupIdsToJoin) {
    const { data: existing } = await supabaseAdmin
      .from('chat_group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!existing) {
      const { error: joinError } = await supabaseAdmin
        .from('chat_group_members')
        .insert({
          group_id: groupId,
          user_id: userId,
          role: 'member',
        });

      if (joinError) {
        console.error('[groupSeeder] Error joining user to group', {
          userId,
          groupId,
          error: joinError,
        });
      }
    }
  }
}

