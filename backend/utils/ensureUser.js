import crypto from 'node:crypto';

/**
 * Ensure a row exists in public.users for the given userId.
 * Falls back to synthetic email/username values if uniqueness constraints block inserts.
 * Returns { ok: boolean, created?: boolean, error?: any }.
 */
export async function ensureUserRecord({
  client,
  userId,
  emailHint,
  usernameHint,
  loggerPrefix = '[ensureUser]'
}) {
  if (!client) {
    console.error(`${loggerPrefix} No Supabase client available to ensure user.`);
    return { ok: false, error: 'client-unavailable' };
  }
  if (!userId) {
    console.error(`${loggerPrefix} Missing userId when ensuring user record.`);
    return { ok: false, error: 'missing-user-id' };
  }

  const shortId = userId.substring(0, 8);
  const safeUsername = (usernameHint && typeof usernameHint === 'string' && usernameHint.trim())
    ? usernameHint.trim().substring(0, 64)
    : `user_${shortId}`;
  const safeEmail = (emailHint && typeof emailHint === 'string' && emailHint.includes('@'))
    ? emailHint.trim().toLowerCase()
    : `${shortId}@placeholder.local`;

  // Quick success path if the row already exists
  const { data: existing, error: existingErr } = await client
    .from('users')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (existing) {
    return { ok: true, created: false };
  }
  if (existingErr) {
    console.error(`${loggerPrefix} Failed to check existing user`, existingErr);
    return { ok: false, error: existingErr };
  }

  const nowIso = new Date().toISOString();
  const attempts = [
    { email: safeEmail, username: safeUsername },
    {
      email: `${shortId}+${Date.now()}@placeholder.local`,
      username: `${safeUsername}_${crypto.randomBytes(2).toString('hex')}`
    },
    {
      email: `${shortId}-${crypto.randomBytes(3).toString('hex')}@placeholder.local`,
      username: `${safeUsername}_${crypto.randomBytes(2).toString('hex')}`
    }
  ];

  let lastError = null;
  for (const attempt of attempts) {
    const { error: insertErr } = await client
      .from('users')
      .insert({
        id: userId,
        username: attempt.username.substring(0, 64),
        email: attempt.email.toLowerCase(),
        created_at: nowIso
      })
      .select()
      .maybeSingle();

    if (!insertErr) {
      console.log(`${loggerPrefix} Ensured user ${userId} (${attempt.email})`);
      return { ok: true, created: true };
    }

    lastError = insertErr;
    if (insertErr?.code === '23505') {
      console.warn(`${loggerPrefix} Unique constraint hit while ensuring user (${insertErr.message}). Retrying with fallback values.`);
      continue;
    }

    console.error(`${loggerPrefix} Failed to ensure user`, insertErr);
    return { ok: false, error: insertErr };
  }

  // Final sanity check in case another process created the row
  const { data: finalCheck } = await client
    .from('users')
    .select('id')
    .eq('id', userId)
    .maybeSingle();
  if (finalCheck) {
    return { ok: true, created: false };
  }

  return { ok: false, error: lastError || 'unknown-error' };
}

