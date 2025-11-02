#!/usr/bin/env node

/**
 * Grant owner/admin/moderator access with lifetime Garden membership.
 *
 * Usage:
 *   node backend/scripts/grant_owner_access.js --email user@example.com --username newowner [--password SuperSecret123] [--role owner|admin]
 *
 * - Ensures the auth user exists (creates if missing, password optional).
 * - Syncs the public.users row and marks them as admin-level in metadata.
 * - Grants a comped, full-access membership and activates moderator perks.
 */

import crypto from 'node:crypto';
import { supabaseAdmin } from '../supabaseAdmin.js';
import { ensureUserRecord } from '../utils/ensureUser.js';

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {};
  for (let i = 0; i < args.length; i += 1) {
    const key = args[i];
    if (!key.startsWith('--')) continue;
    const value = args[i + 1];
    switch (key) {
      case '--email':
        parsed.email = value;
        i += 1;
        break;
      case '--username':
        parsed.username = value;
        i += 1;
        break;
      case '--password':
        parsed.password = value;
        i += 1;
        break;
      case '--role':
        parsed.role = value;
        i += 1;
        break;
      default:
        console.warn(`Ignoring unknown option ${key}`);
    }
  }
  return parsed;
}

function generatePassword() {
  return crypto.randomBytes(12).toString('base64url');
}

async function findAuthUserByEmail(email) {
  if (!supabaseAdmin) return null;
  const normalized = email.toLowerCase();
  const perPage = 1000;
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) {
      console.warn('[grant-owner] listUsers error:', error.message);
      return null;
    }
    const users = data?.users || [];
    const match = users.find((u) => (u.email || '').toLowerCase() === normalized);
    if (match) return match;
    if (users.length < perPage) break; // exhausted results
  }
  return null;
}

async function main() {
  if (!supabaseAdmin) {
    console.error('Service role client unavailable. Set SUPABASE_SERVICE_ROLE_KEY and SUPABASE_URL.');
    process.exit(1);
  }

  const { email, username, password, role } = parseArgs();
  if (!email) {
    console.error('Missing required --email argument.');
    process.exit(1);
  }

  const trimmedUsername = (username && username.trim()) || email.split('@')[0];
  const generatedPassword = password || generatePassword();
  const nowIso = new Date().toISOString();
  const normalizedRole = (role || 'owner').toLowerCase();
  const compReason = normalizedRole === 'owner' ? 'owner' : normalizedRole;
  const isOwner = normalizedRole === 'owner';

  let authUser = null;

  let publicUserRow = null;
  const { data: existingPublicUser, error: publicUserErr } = await supabaseAdmin
    .from('users')
    .select('id, email')
    .eq('email', email)
    .maybeSingle();
  if (publicUserErr) {
    console.warn('[grant-owner] Failed to query public.users:', publicUserErr.message);
  } else if (existingPublicUser) {
    publicUserRow = existingPublicUser;
  }

  if (publicUserRow?.id) {
    try {
      authUser = await supabaseAdmin.auth.admin.getUserById(publicUserRow.id).then((res) => res?.data?.user ?? null);
    } catch (err) {
      console.warn('[grant-owner] getUserById fallback failed:', err.message);
    }
  }

  if (!authUser) {
    try {
      authUser = await findAuthUserByEmail(email);
    } catch (err) {
      console.warn('[grant-owner] listUsers lookup failed:', err.message);
    }
  }

  if (!authUser) {
    console.log(`[grant-owner] Creating auth user for ${email}`);
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: generatedPassword,
      email_confirm: true,
      user_metadata: {
        username: trimmedUsername,
        membership: 'club',
        membership_started: nowIso,
        role: normalizedRole,
        role_label: normalizedRole,
        moderator: true,
        owner: isOwner
      }
    });
    if (error) {
      if (error.message && /already been registered/i.test(error.message)) {
        console.warn('[grant-owner] Auth user already exists, fetching details via listUsers fallback.');
        authUser = await findAuthUserByEmail(email);
        if (!authUser) {
          console.error('[grant-owner] Could not resolve existing auth user. Please provide the user ID.');
          process.exit(1);
        }
      } else {
        console.error('[grant-owner] Failed to create auth user:', error.message);
        process.exit(1);
      }
    } else {
      authUser = data.user;
    }
  } else {
    console.log(`[grant-owner] Found existing auth user ${authUser.id}, updating metadata`);
    const mergedMetadata = {
      ...authUser.user_metadata,
      username: trimmedUsername,
      membership: 'club',
      membership_started: authUser.user_metadata?.membership_started || nowIso,
      role: normalizedRole,
      role_label: normalizedRole,
      moderator: true,
      owner: isOwner
    };
    const { error } = await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
      user_metadata: mergedMetadata
    });
    if (error) {
      console.error('[grant-owner] Failed to update auth metadata:', error.message);
      process.exit(1);
    }
  }

  const userId = authUser.id;

  // Ensure public.users entry exists
  const ensureResult = await ensureUserRecord({
    client: supabaseAdmin,
    userId,
    emailHint: email,
    usernameHint: trimmedUsername,
    loggerPrefix: '[grant-owner]'
  });
  if (!ensureResult.ok) {
    console.error('[grant-owner] Failed to ensure public.users row:', ensureResult.error);
    process.exit(1);
  }

  // Ensure latest email/username are stored
  await supabaseAdmin
    .from('users')
    .upsert(
      {
        id: userId,
        email,
        username: trimmedUsername,
        created_at: ensureResult.created ? nowIso : undefined
      },
      { onConflict: 'id' }
    );

  // Grant comped membership
  await supabaseAdmin.from('memberships').delete().eq('user_id', userId);
  let membershipTier = 'full';
  let membershipUpsert = await supabaseAdmin
    .from('memberships')
    .insert(
      {
        user_id: userId,
        email,
        tier: membershipTier,
        status: 'active',
        comped: true,
        comped_reason: compReason,
        comped_started_at: nowIso,
        comped_ended_at: null,
        joined_at: nowIso,
        expires_at: null,
        payment_method: 'comped',
        payment_reference: 'owner-comp',
        updated_at: nowIso
      }
    )
    .select('user_id');
  if (membershipUpsert.error) {
    if (membershipUpsert.error.message?.includes('memberships_tier_check')) {
      console.warn('[grant-owner] Tier check failed, retrying with scan-only tier fallback.');
      membershipTier = 'trial';
      membershipUpsert = await supabaseAdmin
        .from('memberships')
        .insert(
          {
            user_id: userId,
            email,
            tier: membershipTier,
            status: 'active',
            comped: true,
            comped_reason: compReason,
            comped_started_at: nowIso,
            comped_ended_at: null,
            joined_at: nowIso,
            expires_at: null,
            payment_method: 'comped',
            payment_reference: 'owner-comp',
            updated_at: nowIso
          }
        )
        .select('user_id');
      if (membershipUpsert.error) {
        console.error('[grant-owner] Failed to upsert membership (fallback):', membershipUpsert.error.message);
        process.exit(1);
      }
    } else {
      console.error('[grant-owner] Failed to upsert membership:', membershipUpsert.error.message);
      process.exit(1);
    }
  }

  // Activate moderator row
  try {
    await supabaseAdmin.from('moderators').delete().eq('user_id', userId);
    const moderatorInsert = await supabaseAdmin
      .from('moderators')
      .insert({
        user_id: userId,
        assigned_at: nowIso,
        is_active: true,
        permissions: ['moderate_messages', 'moderate_images', 'warn_users']
      })
      .select('user_id');
    if (moderatorInsert.error) {
      throw moderatorInsert.error;
    }
  } catch (err) {
    console.warn('[grant-owner] Skipping moderator insert:', err.message || err);
  }

  // Trigger membership refresh to align bundles
  try {
    await supabaseAdmin.rpc('refresh_comp_membership_for_user', { p_user_id: userId });
  } catch (err) {
    console.warn('[grant-owner] refresh_comp_membership_for_user failed:', err.message);
  }

  console.log('✅ Owner access granted.');
  console.log(`   User ID: ${userId}`);
  console.log(`   Email:   ${email}`);
  console.log(`   Username:${trimmedUsername}`);
  console.log(`   Role:    ${normalizedRole}`);
  console.log(`   Tier:    ${membershipTier}`);
  if (!password) {
    console.log(`   Generated password: ${generatedPassword}`);
    console.log('   (Share securely with the new owner and ask them to change it immediately.)');
  }
}

main().catch((err) => {
  console.error('[grant-owner] Unhandled error:', err);
  process.exit(1);
});
