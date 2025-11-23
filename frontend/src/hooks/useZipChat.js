// frontend/src/hooks/useZipChat.js
// Hook for ZIP-based group chat with realtime updates

import { useEffect, useState, useCallback, useRef } from 'react';
import { API_BASE } from '../config';
import { useAuth } from './useAuth';
import { supabase } from '../supabaseClient';

export function useZipChat(zipCode) {
  const { session, user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);
  const channelRef = useRef(null);
  const presenceChannelRef = useRef(null);

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
      
      // Get conversation ID from first message or create subscription
      if (data.messages && data.messages.length > 0) {
        const firstMsg = data.messages[0];
        if (firstMsg.conversation_id) {
          setConversationId(firstMsg.conversation_id);
        }
      }
    } catch (err) {
      console.error('[useZipChat] loadMessages error', err);
      setError(err?.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [zipCode, session]);

  // Realtime subscription for new messages
  useEffect(() => {
    if (!conversationId || !supabase) return;

    // Clean up previous channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`conversation-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (payload?.new) {
            setMessages((prev) => {
              // Avoid duplicates
              const exists = prev.some((m) => m.id === payload.new.id);
              if (exists) return prev;
              return [payload.new, ...prev];
            });
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [conversationId]);

  // Presence subscription for online users
  useEffect(() => {
    if (!conversationId || !user?.id || !supabase) return;

    // Clean up previous presence channel
    if (presenceChannelRef.current) {
      supabase.removeChannel(presenceChannelRef.current);
    }

    const presenceChannel = supabase.channel(`presence-${conversationId}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const userIds = Object.keys(state);
        setActiveUsers(userIds);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('[useZipChat] User joined', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('[useZipChat] User left', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            online_at: new Date().toISOString(),
            user_id: user.id,
          });
        }
      });

    presenceChannelRef.current = presenceChannel;

    return () => {
      if (presenceChannelRef.current) {
        presenceChannelRef.current.unsubscribe();
        presenceChannelRef.current = null;
      }
    };
  }, [conversationId, user?.id]);

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
          setConversationId(data.conversationId || conversationId);
          // Message will be added via realtime subscription, but add it here too for immediate feedback
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === data.message.id);
            if (exists) return prev;
            return [data.message, ...prev];
          });
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
    conversationId,
    activeUsers,
  };
}

