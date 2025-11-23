// frontend/src/hooks/useZipFeed.js
// Hook for fetching ZIP group feed posts

import { useEffect, useState, useCallback } from 'react';
import { API_BASE } from '../config';
import { useAuth } from './useAuth';

export function useZipFeed(zipCode) {
  const { session } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadFeed = useCallback(async () => {
    if (!zipCode) {
      setPosts([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = session?.access_token;
      const headers = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE}/api/groups/${encodeURIComponent(zipCode)}/feed`, {
        headers,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.error('[useZipFeed] loadFeed non-OK', res.status, text);
        throw new Error('Failed to load feed');
      }

      const data = await res.json();
      setPosts(data.posts || []);
    } catch (err) {
      console.error('[useZipFeed] loadFeed error', err);
      setError(err?.message || 'Failed to load feed');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [zipCode, session]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const createPost = useCallback(
    async (postData) => {
      if (!zipCode || !session?.access_token) {
        throw new Error('Not authenticated or ZIP code missing');
      }

      try {
        const res = await fetch(`${API_BASE}/api/groups/${encodeURIComponent(zipCode)}/posts`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(postData),
        });

        if (!res.ok) {
          const text = await res.text().catch(() => '');
          console.error('[useZipFeed] createPost non-OK', res.status, text);
          throw new Error('Failed to create post');
        }

        const data = await res.json();
        // Reload feed to get updated list
        await loadFeed();
        return data.post;
      } catch (err) {
        console.error('[useZipFeed] createPost error', err);
        throw err;
      }
    },
    [zipCode, session, loadFeed]
  );

  const pinPost = useCallback(
    async (postId, pinnedUntil) => {
      if (!zipCode || !session?.access_token) {
        throw new Error('Not authenticated or ZIP code missing');
      }

      try {
        const res = await fetch(
          `${API_BASE}/api/groups/${encodeURIComponent(zipCode)}/posts/${postId}/pin`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ pinnedUntil }),
          }
        );

        if (!res.ok) {
          const text = await res.text().catch(() => '');
          console.error('[useZipFeed] pinPost non-OK', res.status, text);
          throw new Error('Failed to pin post');
        }

        const data = await res.json();
        // Reload feed to get updated list
        await loadFeed();
        return data.post;
      } catch (err) {
        console.error('[useZipFeed] pinPost error', err);
        throw err;
      }
    },
    [zipCode, session, loadFeed]
  );

  const addReaction = useCallback(
    async (postId, reactionType = 'like') => {
      if (!zipCode || !session?.access_token) {
        throw new Error('Not authenticated or ZIP code missing');
      }

      try {
        const res = await fetch(
          `${API_BASE}/api/groups/${encodeURIComponent(zipCode)}/posts/${postId}/reaction`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ reactionType }),
          }
        );

        if (!res.ok) {
          const text = await res.text().catch(() => '');
          console.error('[useZipFeed] addReaction non-OK', res.status, text);
          throw new Error('Failed to add reaction');
        }

        const data = await res.json();
        // Reload feed to get updated reactions
        await loadFeed();
        return data;
      } catch (err) {
        console.error('[useZipFeed] addReaction error', err);
        throw err;
      }
    },
    [zipCode, session, loadFeed]
  );

  return {
    posts,
    loading,
    error,
    reload: loadFeed,
    createPost,
    pinPost,
    addReaction,
    setPosts,
  };
}

