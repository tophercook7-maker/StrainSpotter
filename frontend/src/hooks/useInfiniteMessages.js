// frontend/src/hooks/useInfiniteMessages.js
// Hook for infinite scroll messages with auto-scroll-to-bottom

import { useState, useEffect, useRef, useCallback } from 'react';
import { API_BASE } from '../config';
import { useAuth } from './useAuth';

/**
 * Normalize message from backend to common shape
 */
function normalizeMessage(msg, mode, currentUserId) {
  if (mode === 'group') {
    return {
      id: msg.id,
      groupId: msg.group_id,
      senderId: msg.sender_user_id,
      senderName: msg.users?.display_name || msg.users?.username || 'User',
      senderAvatarUrl: msg.users?.avatar_url || null,
      text: msg.body,
      attachments: msg.image_url ? [{ type: 'image', url: msg.image_url }] : [],
      createdAt: msg.created_at,
      isSystem: false,
      isPinned: msg.is_pinned || false,
      raw: msg, // Keep raw data for compatibility
    };
  } else {
    // DM mode
    const attachments = Array.isArray(msg.attachments)
      ? msg.attachments
      : msg.image_url
      ? [{ type: 'image', url: msg.image_url }]
      : [];
    
    return {
      id: msg.id,
      dmId: msg.conversation_id,
      senderId: msg.sender_id || msg.sender_user_id,
      senderName: msg.sender?.display_name || msg.sender?.username || msg.profiles?.display_name || msg.profiles?.username || 'User',
      senderAvatarUrl: msg.sender?.avatar_url || msg.profiles?.avatar_url || null,
      text: msg.text || msg.body || '',
      attachments,
      createdAt: msg.created_at,
      isSystem: false,
      raw: msg, // Keep raw data for compatibility
    };
  }
}

/**
 * useInfiniteMessages hook for group and DM chats
 * @param {object} options
 * @param {string} options.mode - 'group' | 'dm'
 * @param {string} options.id - groupId or conversationId
 */
export function useInfiniteMessages({ mode, id }) {
  const { session } = useAuth();
  const [messages, setMessages] = useState([]);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [error, setError] = useState(null);

  const scrollToBottomRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const isNearBottomRef = useRef(true);
  const shouldAutoScrollRef = useRef(true);

  // Track if user is near bottom of scroll
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const distanceFromBottom = container.scrollHeight - (container.scrollTop + container.clientHeight);
    isNearBottomRef.current = distanceFromBottom < 200;
  }, []);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback((behavior = 'smooth') => {
    if (scrollToBottomRef.current) {
      scrollToBottomRef.current.scrollIntoView({ behavior, block: 'end' });
    }
  }, []);

  // Load initial messages
  useEffect(() => {
    if (!id || !session?.access_token) {
      setMessages([]);
      setPinnedMessages([]);
      setIsLoadingInitial(false);
      return;
    }

    let cancel = false;
    setIsLoadingInitial(true);
    setError(null);
    shouldAutoScrollRef.current = true;

    const token = session.access_token;
    const url = mode === 'group'
      ? `${API_BASE}/api/groups/${id}/messages?limit=50`
      : `${API_BASE}/api/dm/${id}/messages?limit=50`;

    fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          console.error('[useInfiniteMessages] Failed to load messages', res.status, res.statusText);
          // Don't throw - set error state and return empty data
          if (!cancel) {
            setError(new Error(`Failed to load messages (${res.status})`));
            setIsLoadingInitial(false);
            setHasMore(false);
          }
          return { messages: [], pinned: [], hasMore: false, error: 'unavailable' };
        }
        return res.json();
      })
      .then((data) => {
        if (cancel) return;

        // Handle backend error flag
        if (data.error) {
          console.warn('[useInfiniteMessages] backend indicated error', data.error);
        }

        const incoming = data.messages || [];
        const normalizedMessages = incoming.map(msg => 
          normalizeMessage(msg, mode, session?.user?.id)
        );

        // Sort by createdAt ascending (oldest first)
        normalizedMessages.sort((a, b) => 
          new Date(a.createdAt) - new Date(b.createdAt)
        );

        setMessages(normalizedMessages);
        
        if (mode === 'group' && data.pinned) {
          const normalizedPinned = (data.pinned || []).map(msg => 
            normalizeMessage(msg, mode, session?.user?.id)
          );
          setPinnedMessages(normalizedPinned);
        }

        setHasMore(data.hasMore || false);
        setNextCursor(data.nextCursor || null);

        // Auto-scroll to bottom after initial load
        setTimeout(() => {
          scrollToBottom('auto');
          isNearBottomRef.current = true;
        }, 100);
      })
      .catch((err) => {
        console.error('[useInfiniteMessages] error', err);
        if (!cancel) {
          // Don't throw - set empty state instead
          setMessages([]);
          setHasMore(false);
          setError('Unable to load messages');
        }
      })
      .finally(() => {
        if (!cancel) {
          setIsLoadingInitial(false);
        }
      });

    return () => {
      cancel = true;
    };
  }, [id, mode, session]);

  // Load more (older) messages
  const loadMore = useCallback(async () => {
    if (!id || !session?.access_token || isLoadingMore || !hasMore || !nextCursor) {
      return;
    }

    setIsLoadingMore(true);
    setError(null);

    // Preserve scroll position
    const container = scrollContainerRef.current;
    const oldScrollHeight = container ? container.scrollHeight : 0;

    const token = session.access_token;
    const url = mode === 'group'
      ? `${API_BASE}/api/groups/${id}/messages?limit=50&before=${encodeURIComponent(nextCursor)}`
      : `${API_BASE}/api/dm/${id}/messages?limit=50&before=${encodeURIComponent(nextCursor)}`;

    try {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Failed to load more messages: ${res.status} ${text}`);
      }

      const data = await res.json();
      const normalizedMessages = (data.messages || []).map(msg => 
        normalizeMessage(msg, mode, session?.user?.id)
      );

      // Sort by createdAt ascending
      normalizedMessages.sort((a, b) => 
        new Date(a.createdAt) - new Date(b.createdAt)
      );

      // Prepend older messages
      setMessages((prev) => {
        const combined = [...normalizedMessages, ...prev];
        // Remove duplicates by id
        const unique = combined.reduce((acc, msg) => {
          if (!acc.find(m => m.id === msg.id)) {
            acc.push(msg);
          }
          return acc;
        }, []);
        return unique.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      });

      setHasMore(data.hasMore || false);
      setNextCursor(data.nextCursor || null);

      // Restore scroll position
      if (container) {
        const newScrollHeight = container.scrollHeight;
        const scrollDiff = newScrollHeight - oldScrollHeight;
        container.scrollTop += scrollDiff;
      }
    } catch (err) {
      console.error('[useInfiniteMessages] loadMore error', err);
      setError(err?.message || 'Failed to load more messages');
    } finally {
      setIsLoadingMore(false);
    }
  }, [id, mode, session, isLoadingMore, hasMore, nextCursor]);

  // Handle new message (from realtime or send)
  const onNewMessage = useCallback((newMsg) => {
    const normalized = normalizeMessage(newMsg, mode, session?.user?.id);
    
    setMessages((prev) => {
      // Check if message already exists
      if (prev.find(m => m.id === normalized.id)) {
        return prev;
      }
      return [...prev, normalized].sort((a, b) => 
        new Date(a.createdAt) - new Date(b.createdAt)
      );
    });

    // Auto-scroll if user is near bottom
    if (isNearBottomRef.current) {
      setTimeout(() => {
        scrollToBottom('smooth');
      }, 100);
    }
  }, [mode, session, scrollToBottom]);

  return {
    messages,
    pinnedMessages,
    isLoadingInitial,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    scrollToBottomRef,
    scrollContainerRef,
    onNewMessage,
    scrollToBottom,
    handleScroll,
  };
}

