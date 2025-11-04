import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Avatar,
  Button
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import FeedbackIcon from '@mui/icons-material/Feedback';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DeleteIcon from '@mui/icons-material/Delete';
import { API_BASE } from '../config';

export default function FeedbackReader({ user, onBack }) {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const loadFeedback = async () => {
    try {
      setRefreshing(true);
      const res = await fetch(`${API_BASE}/api/feedback/messages`);

      if (!res.ok) {
        throw new Error('Failed to load feedback');
      }

      const data = await res.json();
      setFeedback(data || []);
      setError(null);
    } catch (err) {
      console.error('Error loading feedback:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDelete = async (messageId) => {
    if (!confirm('Are you sure you want to delete this feedback?')) {
      return;
    }

    try {
      setDeleting(messageId);
      const res = await fetch(`${API_BASE}/api/feedback/messages/${messageId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_user_id: user?.id })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete feedback');
      }

      // Remove from local state
      setFeedback(prev => prev.filter(f => f.id !== messageId));
    } catch (err) {
      console.error('Error deleting feedback:', err);
      alert('Failed to delete: ' + err.message);
    } finally {
      setDeleting(null);
    }
  };

  useEffect(() => {
    loadFeedback();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const formatFullDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <CircularProgress sx={{ color: '#7CB342' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
      py: 4,
      px: 2
    }}>
      <Box sx={{ maxWidth: 900, mx: 'auto' }}>
        {/* Header */}
        <Paper sx={{
          p: 3,
          mb: 3,
          background: 'linear-gradient(135deg, rgba(124, 179, 66, 0.1) 0%, rgba(156, 204, 101, 0.05) 100%)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(124, 179, 66, 0.2)',
          borderRadius: 3
        }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ 
                bgcolor: '#7CB342',
                width: 56,
                height: 56
              }}>
                <FeedbackIcon sx={{ fontSize: 32 }} />
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ 
                  fontWeight: 700,
                  color: '#fff',
                  mb: 0.5
                }}>
                  Feedback Reader
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  {feedback.length} {feedback.length === 1 ? 'submission' : 'submissions'}
                </Typography>
              </Box>
            </Stack>
            
            <Stack direction="row" spacing={1}>
              <Tooltip title="Refresh">
                <IconButton 
                  onClick={loadFeedback}
                  disabled={refreshing}
                  sx={{ 
                    color: '#7CB342',
                    '&:hover': { bgcolor: 'rgba(124, 179, 66, 0.1)' }
                  }}
                >
                  <RefreshIcon sx={{ 
                    animation: refreshing ? 'spin 1s linear infinite' : 'none',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' }
                    }
                  }} />
                </IconButton>
              </Tooltip>
              
              {onBack && (
                <Chip
                  label="Back"
                  onClick={onBack}
                  sx={{
                    bgcolor: 'rgba(124, 179, 66, 0.2)',
                    color: '#7CB342',
                    fontWeight: 600,
                    '&:hover': { bgcolor: 'rgba(124, 179, 66, 0.3)' }
                  }}
                />
              )}
            </Stack>
          </Stack>
        </Paper>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Empty State */}
        {!loading && feedback.length === 0 && (
          <Paper sx={{
            p: 6,
            textAlign: 'center',
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 3
          }}>
            <FeedbackIcon sx={{ fontSize: 64, color: 'rgba(255,255,255,0.3)', mb: 2 }} />
            <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>
              No Feedback Yet
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
              Feedback submissions will appear here
            </Typography>
          </Paper>
        )}

        {/* Feedback List */}
        <Stack spacing={2}>
          {feedback.map((item, index) => (
            <Card key={item.id || index} sx={{
              background: 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(124, 179, 66, 0.2)',
              borderRadius: 2,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 24px rgba(124, 179, 66, 0.2)',
                border: '1px solid rgba(124, 179, 66, 0.4)'
              }
            }}>
              <CardContent sx={{ p: 3 }}>
                {/* Header */}
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Avatar
                      src={item.sender?.avatar_url}
                      sx={{
                        bgcolor: 'rgba(124, 179, 66, 0.2)',
                        width: 32,
                        height: 32
                      }}
                    >
                      {!item.sender?.avatar_url && <PersonIcon sx={{ fontSize: 18, color: '#7CB342' }} />}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{
                        color: '#7CB342',
                        fontWeight: 600
                      }}>
                        {item.sender?.display_name || item.sender?.username || `User ${item.sender_id?.substring(0, 8)}`}
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <AccessTimeIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }} />
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                            {formatDate(item.created_at)}
                          </Typography>
                        </Stack>
                        {item.sender?.username && (
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                            • @{item.sender.username}
                          </Typography>
                        )}
                      </Stack>
                    </Box>
                  </Stack>

                  <Stack direction="row" spacing={1} alignItems="center">
                    <Tooltip title={formatFullDate(item.created_at)}>
                      <Chip
                        label={item.message_type || 'text'}
                        size="small"
                        sx={{
                          bgcolor: 'rgba(124, 179, 66, 0.2)',
                          color: '#7CB342',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}
                      />
                    </Tooltip>

                    <Tooltip title="Delete feedback">
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(item.id)}
                        disabled={deleting === item.id}
                        sx={{
                          color: '#ff5252',
                          '&:hover': {
                            bgcolor: 'rgba(255, 82, 82, 0.1)'
                          }
                        }}
                      >
                        <DeleteIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>

                <Divider sx={{ mb: 2, borderColor: 'rgba(255,255,255,0.1)' }} />

                {/* Content */}
                <Typography sx={{ 
                  color: '#fff',
                  fontSize: '1rem',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {item.content}
                </Typography>

                {/* Flags/Moderation Status */}
                {(item.is_flagged || item.is_moderated) && (
                  <Stack direction="row" spacing={1} mt={2}>
                    {item.is_flagged && (
                      <Chip
                        label="Flagged"
                        size="small"
                        color="warning"
                        sx={{ fontSize: '0.7rem' }}
                      />
                    )}
                    {item.is_moderated && (
                      <Chip
                        label={`Moderated: ${item.moderation_action || 'reviewed'}`}
                        size="small"
                        color="info"
                        sx={{ fontSize: '0.7rem' }}
                      />
                    )}
                  </Stack>
                )}
              </CardContent>
            </Card>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}

