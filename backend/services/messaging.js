// backend/services/messaging.js
// Messaging service for ZIP-based groups and DMs

import { supabaseAdmin } from '../supabaseAdmin.js';

/**
 * Get or create a ZIP group conversation
 * @param {object} params
 * @param {string} params.zipCode - ZIP code
 * @param {string} params.country - Country code (default: 'US')
 * @param {string} params.userId - User ID creating/joining the group
 * @returns {Promise<string>} conversation_id
 */
export async function getOrCreateZipConversation({ zipCode, country = 'US', userId }) {
  const zip = (zipCode || '').trim();
  if (!zip) {
    throw new Error('Zip code is required for zip group conversation.');
  }

  // 1) Look up existing zip group
  const { data: existing, error: existingError } = await supabaseAdmin
    .from('zip_groups')
    .select('id, conversation_id')
    .eq('zip_code', zip)
    .eq('country', country)
    .maybeSingle();

  if (existingError) {
    console.error('[messaging] getOrCreateZipConversation lookup error', existingError);
    throw existingError;
  }

  if (existing?.conversation_id) {
    return existing.conversation_id;
  }

  // 2) Create new conversation + zip_group
  const title = `${zip} — Local StrainTalk`;
  const slug = `zip-${country.toLowerCase()}-${zip}`;

  const { data: conv, error: convError } = await supabaseAdmin
    .from('conversations')
    .insert({
      is_group: true,
      slug,
      title,
      description: `Local chat for ${zip} (${country})`,
      created_by: userId || null,
    })
    .select('id')
    .single();

  if (convError) {
    console.error('[messaging] create conversation error', convError);
    throw convError;
  }

  const conversationId = conv.id;

  const { error: zipInsertError } = await supabaseAdmin.from('zip_groups').insert({
    zip_code: zip,
    country,
    conversation_id: conversationId,
  });

  if (zipInsertError) {
    console.error('[messaging] create zip_group error', zipInsertError);
    throw zipInsertError;
  }

  // 3) If we know userId, join them as owner
  if (userId) {
    const { error: memberError } = await supabaseAdmin
      .from('conversation_members')
      .insert({
        conversation_id: conversationId,
        user_id: userId,
        role: 'owner',
      });

    if (memberError) {
      console.error('[messaging] add owner membership error', memberError);
      // don't throw; group still exists
    }
  }

  return conversationId;
}

/**
 * Join a ZIP group and send a message
 * @param {object} params
 * @param {string} params.zipCode - ZIP code
 * @param {string} params.country - Country code (default: 'US')
 * @param {string} params.userId - User ID sending the message
 * @param {string} params.body - Message body
 * @returns {Promise<object>} { conversationId, message }
 */
export async function joinZipGroupAndSendMessage({ zipCode, country = 'US', userId, body }) {
  if (!userId) throw new Error('userId required to send message.');

  const conversationId = await getOrCreateZipConversation({ zipCode, country, userId });

  // ensure membership
  const { data: membership, error: membershipError } = await supabaseAdmin
    .from('conversation_members')
    .select('role')
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)
    .maybeSingle();

  if (membershipError) {
    console.error('[messaging] membership lookup error', membershipError);
  }

  if (!membership) {
    const { error: addError } = await supabaseAdmin
      .from('conversation_members')
      .insert({
        conversation_id: conversationId,
        user_id: userId,
        role: 'member',
      });

    if (addError) {
      console.error('[messaging] join conversation error', addError);
      throw addError;
    }
  }

  // insert message
  const { data: msg, error: msgError } = await supabaseAdmin
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: userId,
      body,
    })
    .select('id, created_at, body, sender_id')
    .single();

  if (msgError) {
    console.error('[messaging] send message error', msgError);
    throw msgError;
  }

  return { conversationId, message: msg };
}

