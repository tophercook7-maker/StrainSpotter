// frontend/src/components/ZipFeed.jsx
// Component for displaying ZIP group feed posts

import React from 'react';
import { Box, Card, CardContent, Typography, Chip, CircularProgress, Alert } from '@mui/material';
import { useZipFeed } from '../hooks/useZipFeed';

export function ZipFeed({ zipCode }) {
  const { posts, loading, error } = useZipFeed(zipCode);

  if (!zipCode) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" sx={{ color: '#BDBDBD' }}>
          Set your ZIP code to see local feed.
        </Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress sx={{ color: '#7cb342' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  // Separate pinned and normal posts
  const pinned = posts.filter((p) => p.is_pinned);
  const normal = posts.filter((p) => !p.is_pinned);

  const renderPost = (post) => {
    const authorName = post.business?.name || 'Member';
    const postTypeLabel = post.post_type || 'general';

    return (
      <Card
        key={post.id}
        sx={{
          mb: 2,
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(124, 179, 66, 0.2)',
          borderRadius: 3,
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Typography variant="caption" sx={{ color: '#BDBDBD', textTransform: 'capitalize' }}>
              {authorName} • {postTypeLabel}
            </Typography>
            {post.is_pinned && (
              <Chip
                label="Pinned"
                size="small"
                sx={{
                  bgcolor: 'rgba(255, 167, 38, 0.2)',
                  color: '#FFB74D',
                  fontSize: '0.7rem',
                  height: 20,
                }}
              />
            )}
          </Box>

          {post.title && (
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#E8F5E9', mb: 1 }}>
              {post.title}
            </Typography>
          )}

          {post.body && (
            <Typography variant="body2" sx={{ color: '#E0E0E0', mb: 2, whiteSpace: 'pre-wrap' }}>
              {post.body}
            </Typography>
          )}

          {post.image_url && (
            <Box sx={{ mb: 2 }}>
              <img
                src={post.image_url}
                alt="Post attachment"
                style={{
                  width: '100%',
                  borderRadius: '12px',
                  maxHeight: '400px',
                  objectFit: 'cover',
                }}
              />
            </Box>
          )}

          {post.strain_slug && (
            <Chip
              label={`Strain: ${post.strain_slug}`}
              variant="outlined"
              size="small"
              sx={{
                mt: 1,
                borderColor: 'rgba(124, 179, 66, 0.3)',
                color: '#A5D6A7',
                fontSize: '0.75rem',
              }}
            />
          )}

          {post.scan_id && (
            <Chip
              label="Scan attached"
              variant="outlined"
              size="small"
              sx={{
                mt: 1,
                ml: 1,
                borderColor: 'rgba(100, 181, 246, 0.3)',
                color: '#90CAF9',
                fontSize: '0.75rem',
              }}
            />
          )}
        </CardContent>
      </Card>
    );
  };

  if (posts.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" sx={{ color: '#BDBDBD', textAlign: 'center' }}>
          No posts yet. Be the first to post!
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {pinned.length > 0 && (
        <Box sx={{ mb: 3 }}>
          {pinned.map(renderPost)}
        </Box>
      )}
      {normal.length > 0 && (
        <Box>
          {normal.map(renderPost)}
        </Box>
      )}
    </Box>
  );
}

