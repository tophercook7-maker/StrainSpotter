// frontend/src/hooks/useInbox.js
// Hook for fetching DM inbox conversations

import { useEffect, useState } from 'react';
import { API_BASE } from '../config';
import { useAuth } from './useAuth';

export function useInbox() {
  const { session } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancel = false;
    
    if (!session?.access_token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const token = session.access_token;

    fetch(`${API_BASE}/api/dm/inbox`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(`Failed to load inbox: ${res.status} ${text}`);
        }
        return res.json();
      })
      .then((data) => {
        if (!cancel) {
          setConversations(data.conversations || []);
        }
      })
      .catch((err) => {
        console.error('[useInbox] error', err);
        if (!cancel) {
          setError(err?.message || 'Failed to load inbox');
          setConversations([]);
        }
      })
      .finally(() => {
        if (!cancel) {
          setLoading(false);
        }
      });

    return () => {
      cancel = true;
    };
  }, [session]);

  const reload = () => {
    // Trigger reload by updating a dependency
    // The useEffect will run again when session changes
    // For a manual reload, we could add a refresh trigger
    setLoading(true);
    setError(null);
    
    if (!session?.access_token) {
      setLoading(false);
      return;
    }

    const token = session.access_token;

    fetch(`${API_BASE}/api/dm/inbox`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(`Failed to load inbox: ${res.status} ${text}`);
        }
        return res.json();
      })
      .then((data) => {
        setConversations(data.conversations || []);
      })
      .catch((err) => {
        console.error('[useInbox] reload error', err);
        setError(err?.message || 'Failed to reload inbox');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return {
    conversations,
    loading,
    error,
    setConversations,
    reload,
  };
}

