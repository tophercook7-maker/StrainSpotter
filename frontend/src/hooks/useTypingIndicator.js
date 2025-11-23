// frontend/src/hooks/useTypingIndicator.js
// Hook for typing indicators in group chats and DMs

import { useState, useEffect, useRef, useCallback } from 'react';
import { API_BASE } from '../config';
import { useAuth } from './useAuth';

/**
 * useTypingIndicator hook
 * @param {object} options
 * @param {string} options.scope - 'group' | 'dm'
 * @param {string} options.id - groupId or conversationId
 * @param {string} options.currentUserId - Current user ID
 */
export function useTypingIndicator({ scope, id, currentUserId }) {
  const { session } = useAuth();
  const [typingUsers, setTypingUsers] = useState([]);
  const typingTimeoutRef = useRef(null);
  const lastTypingSentRef = useRef(0);

  // Poll for typing users
  useEffect(() => {
    if (!id || !scope || !session?.access_token) {
      setTypingUsers([]);
      return;
    }

    const pollTyping = async () => {
      try {
        const token = session.access_token;
        const res = await fetch(`${API_BASE}/api/chat/typing?scope=${scope}&id=${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (res.ok) {
          const data = await res.json();
          setTypingUsers(data.users || []);
        }
      } catch (err) {
        console.error('[useTypingIndicator] poll error', err);
      }
    };

    // Poll immediately, then every 3 seconds
    pollTyping();
    const interval = setInterval(pollTyping, 3000);

    return () => clearInterval(interval);
  }, [id, scope, session]);

  // Notify typing (throttled)
  const notifyTyping = useCallback(() => {
    if (!id || !scope || !session?.access_token || !currentUserId) {
      return;
    }

    const now = Date.now();
    // Throttle: only send typing notification max once per 2 seconds
    if (now - lastTypingSentRef.current < 2000) {
      return;
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Send typing: true
    const token = session.access_token;
    fetch(`${API_BASE}/api/chat/typing`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        scope,
        id,
        isTyping: true,
      }),
    }).catch(err => {
      console.error('[useTypingIndicator] notifyTyping error', err);
    });

    lastTypingSentRef.current = now;

    // Set timeout to send typing: false after 5 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      fetch(`${API_BASE}/api/chat/typing`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scope,
          id,
          isTyping: false,
        }),
      }).catch(err => {
        console.error('[useTypingIndicator] stopTyping error', err);
      });
    }, 5000);
  }, [id, scope, session, currentUserId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      // Send typing: false on unmount
      if (id && scope && session?.access_token && currentUserId) {
        fetch(`${API_BASE}/api/chat/typing`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            scope,
            id,
            isTyping: false,
          }),
        }).catch(() => {
          // Ignore errors on cleanup
        });
      }
    };
  }, [id, scope, session, currentUserId]);

  return {
    typingUsers,
    notifyTyping,
  };
}

