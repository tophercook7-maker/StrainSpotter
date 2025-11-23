// frontend/src/hooks/useStartDM.js
// Hook for starting DM conversations from various integration points

import { useState, useCallback } from 'react';
import { API_BASE } from '../config';
import { useAuth } from './useAuth';

export function useStartDM() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const startConversation = useCallback(
    async (targetUserId, targetBusinessId) => {
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      if (!targetUserId && !targetBusinessId) {
        throw new Error('targetUserId or targetBusinessId is required');
      }

      setLoading(true);
      setError(null);

      try {
        const token = session.access_token;

        const res = await fetch(`${API_BASE}/api/dm/start`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            targetUserId: targetUserId || null,
            targetBusinessId: targetBusinessId || null,
          }),
        });

        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(`Failed to start conversation: ${res.status} ${text}`);
        }

        const data = await res.json();
        return data.conversation;
      } catch (err) {
        console.error('[useStartDM] error', err);
        setError(err?.message || 'Failed to start conversation');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [session]
  );

  return {
    startConversation,
    loading,
    error,
  };
}

