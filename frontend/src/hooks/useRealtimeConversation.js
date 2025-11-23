// frontend/src/hooks/useRealtimeConversation.js
// Reusable hook for realtime message subscriptions

import { useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

/**
 * Subscribe to realtime updates for a conversation
 * @param {string} conversationId - Conversation ID to subscribe to
 * @param {function} onNewMessage - Callback when a new message is received
 */
export function useRealtimeConversation(conversationId, onNewMessage) {
  const channelRef = useRef(null);

  useEffect(() => {
    if (!conversationId || !supabase || !onNewMessage) return;

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
          if (payload?.new?.conversation_id === conversationId) {
            onNewMessage(payload.new);
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
  }, [conversationId, onNewMessage]);
}

