import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Stack, Paper, Button, TextField, Rating, Chip,
  Grid, Card, CardContent, IconButton, Divider, Avatar, CircularProgress,
  Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RateReviewIcon from '@mui/icons-material/RateReview';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { supabase } from '../supabaseClient';
import { BackHeader } from './BackHeader';

export default function ReviewsHub({ onBack, currentUser }) {
  const [tab, setTab] = useState(0); // 0 = My Reviews, 1 = All Reviews
  const [myReviews, setMyReviews] = useState([]);
  const [allReviews, setAllReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editDialog, setEditDialog] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');

  const fetchMyReviews = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reviews')
        .select('*, strains(name, slug, type)')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setMyReviews(data || []);
    } catch (error) {
      console.error('Error fetching my reviews:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  const fetchAllReviews = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*, strains(name, slug, type)')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      setAllReviews(data || []);
    } catch (error) {
      console.error('Error fetching all reviews:', error);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchMyReviews();
    }
    fetchAllReviews();
  }, [currentUser, fetchMyReviews, fetchAllReviews]);

  const handleEditClick = (review) => {
    setEditingReview(review);
    setEditRating(review.rating);
    setEditComment(review.comment || '');
    setEditDialog(true);
  };

  const handleUpdateReview = async () => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({
          rating: editRating,
          comment: editComment,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingReview.id);
      
      if (error) throw error;
      
      setEditDialog(false);
      fetchMyReviews();
      fetchAllReviews();
    } catch (error) {
      console.error('Error updating review:', error);
      alert('Failed to update review');
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    
    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);
      
      if (error) throw error;
      
      fetchMyReviews();
      fetchAllReviews();
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Failed to delete review');
    }
  };

  const getTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'indica': return '#9c27b0';
      case 'sativa': return '#ff9800';
      case 'hybrid': return '#4caf50';
      default: return '#757575';
    }
  };

  const ReviewCard = ({ review, showActions = false }) => (
    <Card sx={{ 
      background: 'rgba(255,255,255,0.1)', 
      backdropFilter: 'blur(20px)', 
      border: '1px solid rgba(124, 179, 66, 0.3)', 
      borderRadius: 2,
      mb: 1.5
    }}>
      <CardContent sx={{ p: 1.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Stack spacing={1} flex={1}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
                {review.strains?.name || 'Unknown Strain'}
              </Typography>
              {review.strains?.type && (
                <Chip 
                  label={review.strains.type} 
                  size="small" 
                  sx={{ 
                    bgcolor: getTypeColor(review.strains.type), 
                    color: '#fff', 
                    fontSize: '0.7rem',
                    height: 20
                  }} 
                />
              )}
            </Stack>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Rating value={review.rating} readOnly size="small" />
              <Typography variant="caption" sx={{ color: '#aaa' }}>
                {new Date(review.created_at).toLocaleDateString()}
              </Typography>
            </Stack>
          </Stack>
          {showActions && (
            <Stack direction="row" spacing={1}>
              <IconButton 
                size="small" 
                onClick={() => handleEditClick(review)}
                sx={{ color: '#7cb342' }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton 
                size="small" 
                onClick={() => handleDeleteReview(review.id)}
                sx={{ color: '#f44336' }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Stack>
          )}
        </Stack>
        
        {review.comment && (
          <Typography variant="body2" sx={{ color: '#e0e0e0', whiteSpace: 'pre-line' }}>
            {review.comment}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{
      minHeight: '100vh',
      pt: 'calc(env(safe-area-inset-top) + 32px)',
      px: 2,
      pb: 2,
      background: 'none'
    }}>
      {/* Header - using BackHeader style */}
      <BackHeader title="Reviews Hub" onBack={onBack} />

      {/* Tabs */}
      <Paper sx={{ 
        mb: 1.5, 
        background: 'rgba(255,255,255,0.1)', 
        backdropFilter: 'blur(20px)', 
        border: '1px solid rgba(124, 179, 66, 0.3)', 
        borderRadius: 2 
      }}>
        <Tabs 
          value={tab} 
          onChange={(e, v) => setTab(v)} 
          sx={{ 
            borderBottom: '1px solid rgba(124, 179, 66, 0.3)',
            '& .MuiTab-root': { color: '#fff' },
            '& .Mui-selected': { color: '#7cb342' }
          }}
        >
          <Tab label={`My Reviews (${myReviews.length})`} />
          <Tab label="Community Reviews" />
        </Tabs>
      </Paper>

      {/* Content */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: '#7cb342' }} />
        </Box>
      ) : (
        <Box>
          {tab === 0 ? (
            // My Reviews
            <Box>
              {!currentUser ? (
                <Paper sx={{ 
                  p: 4, 
                  textAlign: 'center', 
                  background: 'rgba(255,255,255,0.1)', 
                  backdropFilter: 'blur(20px)', 
                  border: '1px solid rgba(124, 179, 66, 0.3)', 
                  borderRadius: 2 
                }}>
                  <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
                    Please log in to view your reviews
                  </Typography>
                </Paper>
              ) : myReviews.length === 0 ? (
                <Paper sx={{ 
                  p: 4, 
                  textAlign: 'center', 
                  background: 'rgba(255,255,255,0.1)', 
                  backdropFilter: 'blur(20px)', 
                  border: '1px solid rgba(124, 179, 66, 0.3)', 
                  borderRadius: 2 
                }}>
                  <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
                    You haven't written any reviews yet
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
                    Try strains and share your experience with the community!
                  </Typography>
                </Paper>
              ) : (
                <Box>
                  {myReviews.map(review => (
                    <ReviewCard key={review.id} review={review} showActions={true} />
                  ))}
                </Box>
              )}
            </Box>
          ) : (
            // All Reviews
            <Box>
              {allReviews.length === 0 ? (
                <Paper sx={{ 
                  p: 4, 
                  textAlign: 'center', 
                  background: 'rgba(255,255,255,0.1)', 
                  backdropFilter: 'blur(20px)', 
                  border: '1px solid rgba(124, 179, 66, 0.3)', 
                  borderRadius: 2 
                }}>
                  <Typography variant="h6" sx={{ color: '#fff' }}>
                    No reviews yet
                  </Typography>
                </Paper>
              ) : (
                <Box>
                  {allReviews.map(review => (
                    <ReviewCard key={review.id} review={review} showActions={false} />
                  ))}
                </Box>
              )}
            </Box>
          )}
        </Box>
      )}

      {/* Edit Dialog */}
      <Dialog
        open={editDialog}
        onClose={() => setEditDialog(false)}
        maxWidth="sm"
        fullWidth
        fullScreen
        PaperProps={{
          sx: {
            background: 'rgba(30, 30, 30, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '2px solid rgba(124, 179, 66, 0.5)',
            borderRadius: { xs: 0, sm: 3 },
            m: 0,
            maxHeight: '100vh'
          }
        }}
      >
        <DialogTitle sx={{ color: '#fff', borderBottom: '1px solid rgba(124, 179, 66, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Edit Review</Typography>
          <IconButton onClick={() => setEditDialog(false)} sx={{ color: '#fff' }}>
            <ArrowBackIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="body2" sx={{ color: '#e0e0e0', mb: 1 }}>
                Rating
              </Typography>
              <Rating 
                value={editRating} 
                onChange={(e, v) => setEditRating(v || 1)} 
                size="large"
              />
            </Box>
            <TextField
              label="Your Review"
              multiline
              rows={4}
              value={editComment}
              onChange={(e) => setEditComment(e.target.value)}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
                  '& fieldset': { borderColor: 'rgba(124, 179, 66, 0.5)' },
                  '&:hover fieldset': { borderColor: 'rgba(124, 179, 66, 0.7)' },
                  '&.Mui-focused fieldset': { borderColor: '#7cb342' }
                },
                '& .MuiInputLabel-root': { color: '#fff' }
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(124, 179, 66, 0.3)' }}>
          <Button onClick={() => setEditDialog(false)} sx={{ color: '#fff' }}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateReview} 
            variant="contained"
            sx={{ 
              bgcolor: '#7cb342', 
              '&:hover': { bgcolor: '#689f38' } 
            }}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
