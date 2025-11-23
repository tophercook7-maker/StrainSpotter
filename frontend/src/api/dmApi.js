// ===============================================
// FILE: frontend/src/api/dmApi.js
// Simple API helpers for DM conversations & messages
// ===============================================

import { API_BASE } from '../config';
import { supabase } from '../supabaseClient';

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.access_token}`,
  };
}

export async function fetchDMConversations() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/dm`, {
    method: 'GET',
    headers,
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error('Failed to load DM conversations');
  }
  return res.json();
}

export async function openDMWithUser(otherUserId) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/dm/open`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify({ userId: otherUserId }),
  });
  if (!res.ok) {
    throw new Error('Failed to open DM');
  }
  return res.json();
}

export async function fetchDMMessages(conversationId, { before, limit = 50 } = {}) {
  const headers = await getAuthHeaders();
  const params = new URLSearchParams();
  if (before) params.set('before', before);
  if (limit) params.set('limit', String(limit));

  const query = params.toString();
  const url = `${API_BASE}/api/dm/${conversationId}/messages${query ? `?${query}` : ''}`;

  const res = await fetch(url, {
    method: 'GET',
    headers,
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('Failed to load DM messages');
  }
  return res.json();
}

export async function sendDMMessage(conversationId, payload) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/dm/${conversationId}/messages`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error('Failed to send DM message');
  }
  return res.json();
}

