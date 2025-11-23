// frontend/src/hooks/useZipChat.js
// Hook for ZIP-based group chat

import { useEffect, useState, useCallback } from 'react';
import { API_BASE } from '../config';
import { useAuth } from './useAuth';

export function useZipChat(zipCode) {
  const { session } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const loadMessages = useCallback(async () => {
    if (!zipCode) return;
    setLoading(true);
    setError(null);

    try {
      const token = session?.access_token;
      if (!token) {
        throw new Error('Not authenticated');
      }

      const res = await fetch(`${API_BASE}/api/chat/zip/${zipCode}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.error('[useZipChat] loadMessages non-OK', res.status, text);
        throw new Error('Failed to load messages');
      }

      const data = await res.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error('[useZipChat] loadMessages error', err);
      setError(err?.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [zipCode, session]);

  const sendMessage = useCallback(
    async (body) => {
      if (!zipCode || !body.trim()) return;
      setSending(true);
      setError(null);

      try {
        const token = session?.access_token;
        if (!token) {
          throw new Error('Not authenticated');
        }

        const res = await fetch(`${API_BASE}/api/chat/zip/send`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ zipCode, body }),
        });

        if (!res.ok) {
          const text = await res.text().catch(() => '');
          console.error('[useZipChat] sendMessage non-OK', res.status, text);
          throw new Error('Failed to send message');
        }

        const data = await res.json();
        if (data.message) {
          setMessages((prev) => [data.message, ...prev]);
        }
      } catch (err) {
        console.error('[useZipChat] sendMessage error', err);
        setError(err?.message || 'Failed to send message');
      } finally {
        setSending(false);
      }
    },
    [zipCode, session]
  );

  useEffect(() => {
    if (!zipCode) return;
    loadMessages();
  }, [zipCode, loadMessages]);

  return {
    messages,
    loading,
    sending,
    error,
    sendMessage,
    reload: loadMessages,
  };
}

