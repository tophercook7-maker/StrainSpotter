// frontend/src/hooks/useConversationMessages.js
// Hook for fetching and sending messages in a DM conversation

import { useEffect, useState, useCallback } from 'react';
import { API_BASE } from '../config';
import { useAuth } from './useAuth';

export function useConversationMessages(conversationId) {
  const { session } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  // Load messages
  useEffect(() => {
    if (!conversationId || !session?.access_token) {
      setMessages([]);
      return;
    }

    let cancel = false;
    setLoading(true);
    setError(null);

    const token = session.access_token;

    fetch(`${API_BASE}/api/dm/${conversationId}/messages?limit=50`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(`Failed to load messages: ${res.status} ${text}`);
        }
        return res.json();
      })
      .then((data) => {
        if (!cancel) {
          const list = data.messages || [];
          // Reverse to show oldest → newest (messages come back newest first)
          setMessages(list.slice().reverse());
        }
      })
      .catch((err) => {
        console.error('[useConversationMessages] error', err);
        if (!cancel) {
          setError(err?.message || 'Failed to load messages');
          setMessages([]);
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
  }, [conversationId, session]);

  // Send message
  const sendMessage = useCallback(
    async (body, imageUrl) => {
      if (!conversationId || (!body && !imageUrl)) {
        return;
      }

      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      setSending(true);
      setError(null);

      try {
        const token = session.access_token;

        const res = await fetch(`${API_BASE}/api/dm/${conversationId}/messages`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ body, imageUrl }),
        });

        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(`Failed to send message: ${res.status} ${text}`);
        }

        const data = await res.json();
        if (data.message) {
          setMessages((prev) => [...prev, data.message]);
        }
      } catch (err) {
        console.error('[useConversationMessages] sendMessage error', err);
        setError(err?.message || 'Failed to send message');
        throw err;
      } finally {
        setSending(false);
      }
    },
    [conversationId, session]
  );

  const reload = useCallback(() => {
    if (!conversationId || !session?.access_token) {
      return;
    }

    setLoading(true);
    setError(null);

    const token = session.access_token;

    fetch(`${API_BASE}/api/dm/${conversationId}/messages?limit=50`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(`Failed to load messages: ${res.status} ${text}`);
        }
        return res.json();
      })
      .then((data) => {
        const list = data.messages || [];
        setMessages(list.slice().reverse());
      })
      .catch((err) => {
        console.error('[useConversationMessages] reload error', err);
        setError(err?.message || 'Failed to reload messages');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [conversationId, session]);

  return {
    messages,
    loading,
    sending,
    error,
    sendMessage,
    setMessages,
    reload,
  };
}

