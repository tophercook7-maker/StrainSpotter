import { useState, useEffect, useRef } from 'react';
import {
  Box, TextField, Grid, Card, CardContent, Typography, Chip, Stack, Button,
  InputAdornment, Select, MenuItem, FormControl, InputLabel, CircularProgress,
  Dialog, DialogTitle, DialogContent, IconButton, Tabs, Tab, Paper, List,
  ListItem, ListItemText, ListItemIcon
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import StoreIcon from '@mui/icons-material/Store';
import SpaIcon from '@mui/icons-material/Spa';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import VerifiedIcon from '@mui/icons-material/Verified';
import { supabase } from '../supabaseClient';

const STRAINS_PER_PAGE = 100; // Load 100 strains at a time

export default function StrainBrowser({ onBack }) {
  const [strains, setStrains] = useState([]);
  const [filteredStrains, setFilteredStrains] = useState([]);
  const [displayedStrains, setDisplayedStrains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedStrain, setSelectedStrain] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsTab, setDetailsTab] = useState(0);
  const [vendors, setVendors] = useState([]);
  const [dispensaries, setDispensaries] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const observerTarget = useRef(null);

  // Fetch initial strains on mount
  useEffect(() => {
    fetchStrains(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter strains when search/type changes
  useEffect(() => {
    filterStrains();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, typeFilter, strains]);

  // Reset displayed strains when filtered strains change
  useEffect(() => {
    setDisplayedStrains(filteredStrains.slice(0, STRAINS_PER_PAGE));
    setPage(0);
  }, [filteredStrains]);

  // Infinite scroll observer
  useEffect(() => {
    const loadMoreDisplayedStrains = () => {
      const nextPage = page + 1;
      const start = nextPage * STRAINS_PER_PAGE;
      const end = start + STRAINS_PER_PAGE;
      const moreStrains = filteredStrains.slice(start, end);

      if (moreStrains.length > 0) {
        setDisplayedStrains(prev => [...prev, ...moreStrains]);
        setPage(nextPage);
      }

      // Check if we need to fetch more from database
      if (end >= strains.length && hasMore) {
        fetchMoreStrains();
      }

      // Update hasMore based on filtered strains
      setHasMore(end < filteredStrains.length || hasMore);
    };

    const currentTarget = observerTarget.current;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMoreDisplayedStrains();
        }
      },
      { threshold: 0.1 }
    );

    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, loadingMore, loading, page, filteredStrains, strains]);

  const fetchStrains = async (pageNum = 0) => {
    try {
      setLoading(true);
      const from = pageNum * STRAINS_PER_PAGE;
      const to = from + STRAINS_PER_PAGE - 1;

      const { data, error } = await supabase
        .from('strains')
        .select('*')
        .order('name')
        .range(from, to);

      if (error) throw error;
      setStrains(data || []);
      setHasMore(data && data.length === STRAINS_PER_PAGE);
    } catch (error) {
      console.error('Error fetching strains:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMoreStrains = async () => {
    try {
      setLoadingMore(true);
      const nextBatch = Math.floor(strains.length / STRAINS_PER_PAGE);
      const from = nextBatch * STRAINS_PER_PAGE;
      const to = from + STRAINS_PER_PAGE - 1;

      const { data, error } = await supabase
        .from('strains')
        .select('*')
        .order('name')
        .range(from, to);

      if (error) throw error;

      if (data && data.length > 0) {
        setStrains(prev => [...prev, ...data]);
        setHasMore(data.length === STRAINS_PER_PAGE);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching more strains:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const filterStrains = () => {
    let filtered = [...strains];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.name?.toLowerCase().includes(query) ||
        s.description?.toLowerCase().includes(query) ||
        s.effects?.some(e => e.toLowerCase().includes(query)) ||
        s.flavors?.some(f => f.toLowerCase().includes(query))
      );
    }
    if (typeFilter !== 'all') {
      filtered = filtered.filter(s => s.type?.toLowerCase() === typeFilter);
    }
    setFilteredStrains(filtered);
  };

  const handleStrainClick = async (strain) => {
    setSelectedStrain(strain);
    setDetailsOpen(true);
    setDetailsTab(0);
    fetchVendorsForStrain(strain.slug);
    fetchDispensariesForStrain(strain.slug);
    fetchReviewsForStrain(strain.slug);
  };

  const fetchVendorsForStrain = async (strainSlug) => {
    try {
      const { data, error } = await supabase.from('vendor_strains').select('*, seed_vendors (*)').eq('strain_slug', strainSlug).eq('in_stock', true);
      if (error) throw error;
      setVendors(data || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      setVendors([]);
    }
  };

  const fetchDispensariesForStrain = async (strainSlug) => {
    try {
      const { data, error } = await supabase.from('dispensary_strains').select('*, dispensaries (*)').eq('strain_slug', strainSlug).eq('in_stock', true);
      if (error) throw error;
      setDispensaries(data || []);
    } catch (error) {
      console.error('Error fetching dispensaries:', error);
      setDispensaries([]);
    }
  };

  const fetchReviewsForStrain = async (strainSlug) => {
    try {
      const { data, error } = await supabase.from('reviews').select('*').eq('strain_slug', strainSlug).order('created_at', { ascending: false }).limit(10);
      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews([]);
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

  const renderDetailsTab = () => {
    if (!selectedStrain) return null;
    switch (detailsTab) {
      case 0: return (
        <Box>
          <Typography variant="body1" sx={{ color: '#fff', mb: 2 }}>{selectedStrain.description || 'No description available'}</Typography>
          {selectedStrain.effects && selectedStrain.effects.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ color: '#7cb342', fontWeight: 700, mb: 1 }}>Effects:</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {selectedStrain.effects.map((effect, idx) => (
                  <Chip key={idx} label={effect} size="small" sx={{ bgcolor: 'rgba(124, 179, 66, 0.3)', color: '#fff', mb: 1 }} />
                ))}
              </Stack>
            </Box>
          )}
          {selectedStrain.flavors && selectedStrain.flavors.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ color: '#7cb342', fontWeight: 700, mb: 1 }}>Flavors:</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {selectedStrain.flavors.map((flavor, idx) => (
                  <Chip key={idx} label={flavor} size="small" sx={{ bgcolor: 'rgba(255, 152, 0, 0.3)', color: '#fff', mb: 1 }} />
                ))}
              </Stack>
            </Box>
          )}
          <Grid container spacing={2} sx={{ mt: 2 }}>
            {selectedStrain.thc && (
              <Grid item xs={6}>
                <Paper sx={{ p: 2, bgcolor: 'rgba(124, 179, 66, 0.2)', borderRadius: 2 }}>
                  <Typography variant="caption" sx={{ color: '#e0e0e0' }}>THC</Typography>
                  <Typography variant="h5" sx={{ color: '#7cb342', fontWeight: 700 }}>{selectedStrain.thc}%</Typography>
                </Paper>
              </Grid>
            )}
            {selectedStrain.cbd && (
              <Grid item xs={6}>
                <Paper sx={{ p: 2, bgcolor: 'rgba(33, 150, 243, 0.2)', borderRadius: 2 }}>
                  <Typography variant="caption" sx={{ color: '#e0e0e0' }}>CBD</Typography>
                  <Typography variant="h5" sx={{ color: '#2196f3', fontWeight: 700 }}>{selectedStrain.cbd}%</Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </Box>
      );
      case 1: return (
        <Box>
          {vendors.length === 0 ? (
            <Typography sx={{ color: '#e0e0e0', textAlign: 'center', py: 4 }}>No seed vendors found for this strain</Typography>
          ) : (
            <List>
              {vendors.map((v, idx) => (
                <ListItem key={idx} sx={{ bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2, mb: 2, border: '1px solid rgba(124, 179, 66, 0.3)' }}>
                  <ListItemIcon><LocalFloristIcon sx={{ color: '#7cb342' }} /></ListItemIcon>
                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography sx={{ color: '#fff', fontWeight: 600 }}>{v.seed_vendors?.name}</Typography>
                        {v.seed_vendors?.verified && <VerifiedIcon sx={{ fontSize: 16, color: '#2196f3' }} />}
                      </Stack>
                    }
                    secondary={
                      <Stack spacing={0.5} sx={{ mt: 1 }}>
                        <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
                          <AttachMoneyIcon sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                          ${v.price} for {v.seed_count} seeds
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#aaa' }}>{v.seed_vendors?.country} • Rating: {v.seed_vendors?.rating}/5</Typography>
                        {v.url && <Button size="small" href={v.url} target="_blank" sx={{ mt: 1, color: '#7cb342' }}>Visit Store →</Button>}
                      </Stack>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      );
      case 2: return (
        <Box>
          {dispensaries.length === 0 ? (
            <Typography sx={{ color: '#e0e0e0', textAlign: 'center', py: 4 }}>No dispensaries found for this strain</Typography>
          ) : (
            <List>
              {dispensaries.map((d, idx) => (
                <ListItem key={idx} sx={{ bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2, mb: 2, border: '1px solid rgba(124, 179, 66, 0.3)' }}>
                  <ListItemIcon><StoreIcon sx={{ color: '#7cb342' }} /></ListItemIcon>
                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography sx={{ color: '#fff', fontWeight: 600 }}>{d.dispensaries?.name}</Typography>
                        {d.dispensaries?.verified && <VerifiedIcon sx={{ fontSize: 16, color: '#2196f3' }} />}
                      </Stack>
                    }
                    secondary={
                      <Stack spacing={0.5} sx={{ mt: 1 }}>
                        <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
                          <LocationOnIcon sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                          {d.dispensaries?.city}, {d.dispensaries?.state}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
                          <AttachMoneyIcon sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                          ${d.price_per_eighth}/eighth • ${d.price_per_ounce}/oz
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#aaa' }}>Rating: {d.dispensaries?.rating}/5</Typography>
                      </Stack>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      );
      case 3: return (
        <Box>
          {reviews.length === 0 ? (
            <Typography sx={{ color: '#e0e0e0', textAlign: 'center', py: 4 }}>No reviews yet for this strain</Typography>
          ) : (
            <Stack spacing={2}>
              {reviews.map((review) => (
                <Paper key={review.id} sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(124, 179, 66, 0.3)', borderRadius: 2 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="subtitle2" sx={{ color: '#7cb342', fontWeight: 600 }}>Rating: {review.rating}/5</Typography>
                    <Typography variant="caption" sx={{ color: '#aaa' }}>{new Date(review.created_at).toLocaleDateString()}</Typography>
                  </Stack>
                  <Typography variant="body2" sx={{ color: '#fff' }}>{review.comment}</Typography>
                </Paper>
              ))}
            </Stack>
          )}
        </Box>
      );
      default: return null;
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', p: 3, background: 'none' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h4" sx={{ color: '#fff', fontWeight: 700 }}>🌿 Strain Browser</Typography>
        {onBack && (
          <Button variant="outlined" onClick={onBack} sx={{ color: '#fff', borderColor: 'rgba(124, 179, 66, 0.6)', '&:hover': { borderColor: 'rgba(124, 179, 66, 1)', bgcolor: 'rgba(124, 179, 66, 0.1)' } }}>
            ← Back to Garden
          </Button>
        )}
      </Stack>

      <Paper sx={{ p: 3, mb: 3, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', border: '2px solid rgba(124, 179, 66, 0.3)', borderRadius: 4 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <TextField fullWidth placeholder="Search strains by name, effects, flavors..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (<InputAdornment position="start"><SearchIcon sx={{ color: '#7cb342' }} /></InputAdornment>),
                sx: { color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(124, 179, 66, 0.5)' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(124, 179, 66, 0.8)' }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#7cb342' } }
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel sx={{ color: '#fff' }}>Type</InputLabel>
              <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} label="Type" sx={{ color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(124, 179, 66, 0.5)' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(124, 179, 66, 0.8)' }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#7cb342' } }}>
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="indica">Indica</MenuItem>
                <MenuItem value="sativa">Sativa</MenuItem>
                <MenuItem value="hybrid">Hybrid</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        <Typography variant="body2" sx={{ color: '#e0e0e0', mt: 2 }}>
          Showing {displayedStrains.length} of {filteredStrains.length} strains
          {filteredStrains.length < strains.length && ` (${strains.length} total loaded)`}
        </Typography>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress sx={{ color: '#7cb342' }} /></Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {displayedStrains.map((strain) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={strain.slug}>
                <Card onClick={() => handleStrainClick(strain)} sx={{ cursor: 'pointer', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', border: '2px solid rgba(124, 179, 66, 0.3)', borderRadius: 4, transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-8px)', border: '2px solid rgba(124, 179, 66, 0.8)', boxShadow: '0 12px 32px rgba(124, 179, 66, 0.4)' } }}>
                  <Box sx={{ height: 160, background: `linear-gradient(135deg, ${getTypeColor(strain.type)}55 0%, ${getTypeColor(strain.type)}88 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <SpaIcon sx={{ fontSize: 64, color: '#fff', opacity: 0.8 }} />
                  </Box>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, mb: 1 }}>{strain.name}</Typography>
                    <Chip label={strain.type || 'Unknown'} size="small" sx={{ bgcolor: getTypeColor(strain.type), color: '#fff', fontWeight: 600, mb: 1 }} />
                    <Typography variant="body2" sx={{ color: '#e0e0e0', mb: 2, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {strain.description || 'No description available'}
                    </Typography>
                    {strain.thc && <Typography variant="caption" sx={{ color: '#7cb342', fontWeight: 600 }}>THC: {strain.thc}%</Typography>}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Infinite scroll trigger */}
          <Box ref={observerTarget} sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
            {loadingMore && <CircularProgress sx={{ color: '#7cb342' }} size={32} />}
            {!loadingMore && hasMore && displayedStrains.length > 0 && (
              <Typography variant="body2" sx={{ color: '#7cb342' }}>Scroll for more...</Typography>
            )}
            {!hasMore && displayedStrains.length > 0 && (
              <Typography variant="body2" sx={{ color: '#e0e0e0' }}>All strains loaded! 🌿</Typography>
            )}
          </Box>
        </>
      )}

      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { background: 'linear-gradient(135deg, rgba(30, 30, 30, 0.98) 0%, rgba(20, 20, 20, 0.98) 100%)', backdropFilter: 'blur(20px)', border: '2px solid rgba(124, 179, 66, 0.3)', borderRadius: 4 } }}>
        <DialogTitle sx={{ color: '#fff', fontWeight: 700, borderBottom: '1px solid rgba(124, 179, 66, 0.3)' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>{selectedStrain?.name}</Typography>
              <Chip label={selectedStrain?.type || 'Unknown'} size="small" sx={{ bgcolor: getTypeColor(selectedStrain?.type), color: '#fff', fontWeight: 600, mt: 1 }} />
            </Box>
            <IconButton onClick={() => setDetailsOpen(false)} sx={{ color: '#fff' }}><CloseIcon /></IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Tabs value={detailsTab} onChange={(e, v) => setDetailsTab(v)} sx={{ borderBottom: '1px solid rgba(124, 179, 66, 0.3)', mb: 3 }}>
            <Tab label="Overview" sx={{ color: '#fff', '&.Mui-selected': { color: '#7cb342' } }} />
            <Tab label={`Seed Vendors (${vendors.length})`} sx={{ color: '#fff', '&.Mui-selected': { color: '#7cb342' } }} />
            <Tab label={`Dispensaries (${dispensaries.length})`} sx={{ color: '#fff', '&.Mui-selected': { color: '#7cb342' } }} />
            <Tab label={`Reviews (${reviews.length})`} sx={{ color: '#fff', '&.Mui-selected': { color: '#7cb342' } }} />
          </Tabs>
          {renderDetailsTab()}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

