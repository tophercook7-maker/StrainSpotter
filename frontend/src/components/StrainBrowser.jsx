import { useState, useEffect, useRef } from 'react';
import {
  Box, TextField, Grid, Card, CardContent, Typography, Chip, Stack, Button,
  InputAdornment, Select, MenuItem, FormControl, InputLabel, CircularProgress,
  Dialog, DialogTitle, DialogContent, IconButton, Tabs, Tab, Paper, List,
  ListItem, ListItemText, ListItemIcon, Slider, Tooltip, Snackbar, Alert
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import StoreIcon from '@mui/icons-material/Store';
import SpaIcon from '@mui/icons-material/Spa';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import VerifiedIcon from '@mui/icons-material/Verified';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import SortIcon from '@mui/icons-material/Sort';
import FilterListIcon from '@mui/icons-material/FilterList';
import { supabase } from '../supabaseClient';
import SeedVendorFinder from './SeedVendorFinder';

const STRAINS_PER_PAGE = 100; // Display 100 strains at a time
const FETCH_BATCH_SIZE = 1000; // Fetch 1000 strains per database query

export default function StrainBrowser({ onBack }) {
  const [strains, setStrains] = useState([]);
  const [filteredStrains, setFilteredStrains] = useState([]);
  const [displayedStrains, setDisplayedStrains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedStrain, setSelectedStrain] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsTab, setDetailsTab] = useState(0);
  const [vendors, setVendors] = useState([]);
  const [dispensaries, setDispensaries] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalStrains, setTotalStrains] = useState(0);
  const [allStrainsLoaded, setAllStrainsLoaded] = useState(false);

  // New state for enhancements
  const [sortBy, setSortBy] = useState('name'); // name, thc, rating
  const [thcRange, setThcRange] = useState([0, 35]); // THC% range filter
  const [favorites, setFavorites] = useState([]); // Array of favorite strain slugs
  const [showFilters, setShowFilters] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [showSeedFinder, setShowSeedFinder] = useState(false);
  const [seedFinderStrain, setSeedFinderStrain] = useState(null);

  const observerTarget = useRef(null);

  // Detect user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLoadingLocation(false);
        },
        () => {
          // Fallback to San Francisco if location denied
          setUserLocation({ lat: 37.7749, lng: -122.4194 });
          setLoadingLocation(false);
        }
      );
    } else {
      // Fallback if geolocation not supported
      setUserLocation({ lat: 37.7749, lng: -122.4194 });
      setLoadingLocation(false);
    }
  }, []);

  // Fetch ALL strains on mount
  useEffect(() => {
    fetchAllStrains();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter strains when search/type/sort/thc changes
  useEffect(() => {
    filterStrains();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, typeFilter, strains, sortBy, thcRange]);

  // Reset displayed strains when filtered strains change
  useEffect(() => {
    setDisplayedStrains(filteredStrains.slice(0, STRAINS_PER_PAGE));
    setPage(0);
  }, [filteredStrains]);

  // Infinite scroll observer - load more displayed strains from filtered list
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

      // Check if we've displayed all filtered strains
      const hasMoreToDisplay = end < filteredStrains.length;
      setHasMore(hasMoreToDisplay);
    };

    const currentTarget = observerTarget.current;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
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
  }, [hasMore, loading, page, filteredStrains]);

  const fetchAllStrains = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching ALL strains from database...');

      let allData = [];
      let from = 0;
      const batchSize = FETCH_BATCH_SIZE;
      let hasMoreData = true;

      // Fetch in batches until we have all strains
      while (hasMoreData) {
        const to = from + batchSize - 1;

        const { data, error, count } = await supabase
          .from('strains')
          .select('*', { count: 'exact' })
          .order('name')
          .range(from, to);

        if (error) throw error;

        if (data && data.length > 0) {
          allData = [...allData, ...data];
          console.log(`   Loaded ${allData.length} strains...`);

          // Check if we have more data
          if (count && allData.length < count) {
            from += batchSize;
          } else {
            hasMoreData = false;
          }
        } else {
          hasMoreData = false;
        }
      }

      console.log(`✅ Loaded ${allData.length} total strains!`);
      setStrains(allData);
      setTotalStrains(allData.length);
      setAllStrainsLoaded(true);
      setHasMore(false); // All strains loaded, no more to fetch

    } catch (error) {
      console.error('❌ Error fetching strains:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterStrains = () => {
    let filtered = [...strains];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.name?.toLowerCase().includes(query) ||
        s.description?.toLowerCase().includes(query) ||
        s.effects?.some(e => e.toLowerCase().includes(query)) ||
        s.flavors?.some(f => f.toLowerCase().includes(query))
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(s => s.type?.toLowerCase() === typeFilter);
    }

    // THC range filter (only if filters are shown)
    if (showFilters) {
      filtered = applyThcFilter(filtered);
    }

    // Sort
    filtered = sortStrains(filtered);

    setFilteredStrains(filtered);
  };

  const handleStrainClick = async (strain) => {
    setSelectedStrain(strain);
    setDetailsOpen(true);
    setDetailsTab(0);
    fetchVendorsForStrain(strain.slug, strain.name);
    fetchDispensariesForStrain(strain.slug);
    fetchReviewsForStrain(strain.slug);
  };

  const fetchVendorsForStrain = async (strainSlug, strainName) => {
    try {
      // Use live seed vendor search API
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5181';
      const response = await fetch(`${API_BASE}/api/seeds-live?strain=${encodeURIComponent(strainName)}&limit=20`);
      const data = await response.json();

      // Transform results to match expected format
      const transformedVendors = (data.results || []).map(vendor => ({
        seed_vendors: {
          name: vendor.name,
          website: vendor.website,
          country: vendor.country,
          rating: vendor.rating || 0,
          verified: vendor.verified || false
        },
        price: vendor.price || 'N/A',
        seed_count: vendor.seed_count || 10,
        url: vendor.website,
        in_stock: vendor.in_stock !== false
      }));

      setVendors(transformedVendors);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      setVendors([]);
    }
  };

  const fetchDispensariesForStrain = async (strainSlug) => {
    try {
      // Use live dispensary search API with user location
      if (!userLocation) {
        setDispensaries([]);
        return;
      }

      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5181';
      const response = await fetch(
        `${API_BASE}/api/dispensaries-live?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=100&limit=20`
      );
      const data = await response.json();

      // Transform results to match expected format
      const transformedDispensaries = (data.results || []).map(disp => ({
        dispensaries: {
          name: disp.name,
          city: disp.city || disp.address?.split(',')[1]?.trim() || 'Unknown',
          state: disp.state || disp.address?.split(',')[2]?.trim() || '',
          rating: disp.rating || 0,
          verified: disp.verified || false,
          website: disp.website || null
        },
        price_per_eighth: disp.price_per_eighth || 'N/A',
        price_per_ounce: disp.price_per_ounce || 'N/A',
        distance: disp.distance,
        in_stock: true
      }));

      setDispensaries(transformedDispensaries);
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

  // Curated cannabis stock images (royalty-free from Pexels/Unsplash)
  const CANNABIS_IMAGES = [
    'https://images.unsplash.com/photo-1536964310528-e47dd655ecf3?w=400&h=300&fit=crop', // Purple cannabis buds
    'https://images.unsplash.com/photo-1605440698600-1372eb28f0f4?w=400&h=300&fit=crop', // Green cannabis plant
    'https://images.unsplash.com/photo-1587857180061-f0d22c0e8e8d?w=400&h=300&fit=crop', // Cannabis flower close-up
    'https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=400&h=300&fit=crop', // Cannabis leaves
    'https://images.unsplash.com/photo-1608797178974-15b35a64ede9?w=400&h=300&fit=crop', // Cannabis bud macro
    'https://images.unsplash.com/photo-1610896922783-c7a180a6ae0e?w=400&h=300&fit=crop', // Cannabis plant growing
    'https://images.unsplash.com/photo-1623278979014-8b6e2e3e8a5e?w=400&h=300&fit=crop', // Cannabis trichomes
    'https://images.unsplash.com/photo-1628258334105-2a0b3d6efee1?w=400&h=300&fit=crop', // Cannabis jar
    'https://images.unsplash.com/photo-1615671524827-c1fe3973b648?w=400&h=300&fit=crop', // Cannabis field
    'https://images.unsplash.com/photo-1616244656431-9b4a5b2c6f6e?w=400&h=300&fit=crop', // Cannabis close-up
  ];

  // Generate a strain image URL
  const getStrainImageUrl = (strain) => {
    // If strain has a valid image URL, use it
    if (strain.image_url && !strain.image_url.includes('yourdomain.com')) {
      return strain.image_url;
    }

    // Use hash of strain name to consistently pick from curated cannabis images
    const seed = strain.slug || strain.name.toLowerCase().replace(/\s+/g, '-');
    const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const imageIndex = hash % CANNABIS_IMAGES.length;

    return CANNABIS_IMAGES[imageIndex];
  };

  // Load favorites from localStorage on mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem('strainFavorites');
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (e) {
        console.error('Error loading favorites:', e);
      }
    }
  }, []);

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('strainFavorites', JSON.stringify(favorites));
  }, [favorites]);

  // Toggle favorite
  const toggleFavorite = (strainSlug) => {
    setFavorites(prev => {
      const isFavorite = prev.includes(strainSlug);
      if (isFavorite) {
        setSnackbar({ open: true, message: 'Removed from favorites', severity: 'info' });
        return prev.filter(s => s !== strainSlug);
      } else {
        setSnackbar({ open: true, message: 'Added to favorites! ⭐', severity: 'success' });
        return [...prev, strainSlug];
      }
    });
  };

  // Sort strains
  const sortStrains = (strainsToSort) => {
    const sorted = [...strainsToSort];
    switch (sortBy) {
      case 'name':
        return sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      case 'thc':
        return sorted.sort((a, b) => (parseFloat(b.thc) || 0) - (parseFloat(a.thc) || 0));
      case 'rating':
        // For now, sort by name if no rating field exists
        return sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      default:
        return sorted;
    }
  };

  // Apply THC filter
  const applyThcFilter = (strainsToFilter) => {
    return strainsToFilter.filter(strain => {
      const thc = parseFloat(strain.thc) || 0;
      return thc >= thcRange[0] && thc <= thcRange[1];
    });
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
          <Stack spacing={2} sx={{ mb: 3 }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<SearchIcon />}
              onClick={() => {
                setSeedFinderStrain({ name: selectedStrain.name, slug: selectedStrain.slug });
                setShowSeedFinder(true);
                setDetailsOpen(false);
              }}
              sx={{
                bgcolor: 'rgba(124, 179, 66, 0.3)',
                color: '#fff',
                border: '1px solid rgba(124, 179, 66, 0.6)',
                backdropFilter: 'blur(10px)',
                '&:hover': {
                  bgcolor: 'rgba(124, 179, 66, 0.5)',
                  border: '1px solid rgba(124, 179, 66, 0.8)',
                }
              }}
            >
              Search All Seed Banks for {selectedStrain?.name}
            </Button>
          </Stack>
          {vendors.length === 0 ? (
            <Stack spacing={2} sx={{ textAlign: 'center', py: 4 }}>
              <Typography sx={{ color: '#e0e0e0' }}>
                No seed vendors found for this strain
              </Typography>
              <Typography variant="caption" sx={{ color: '#aaa' }}>
                Click the button above to search all seed banks
              </Typography>
            </Stack>
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
          <Alert severity="info" sx={{ mb: 2, bgcolor: 'rgba(33, 150, 243, 0.1)', color: '#90caf9', border: '1px solid rgba(33, 150, 243, 0.3)' }}>
            <Typography variant="body2">
              Showing dispensaries within 100 miles of your location. Call ahead to confirm {selectedStrain?.name} is in stock.
            </Typography>
          </Alert>
          {dispensaries.length === 0 ? (
            <Stack spacing={2} sx={{ textAlign: 'center', py: 4 }}>
              <Typography sx={{ color: '#e0e0e0' }}>
                {loadingLocation ? 'Detecting your location...' : 'No dispensaries found within 100 miles'}
              </Typography>
              {userLocation && (
                <Typography variant="caption" sx={{ color: '#aaa' }}>
                  Searching near: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                </Typography>
              )}
            </Stack>
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
                          {d.distance && <Chip label={`${d.distance.toFixed(1)} mi`} size="small" sx={{ ml: 1, height: 18, fontSize: '0.65rem', bgcolor: 'rgba(124, 179, 66, 0.2)', color: '#7cb342' }} />}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
                          <AttachMoneyIcon sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                          {d.price_per_eighth !== 'N/A' ? `$${d.price_per_eighth}/eighth` : 'Price varies'}
                          {d.price_per_ounce !== 'N/A' && ` • $${d.price_per_ounce}/oz`}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#aaa' }}>Rating: {d.dispensaries?.rating}/5</Typography>
                        {d.dispensaries?.website && <Button size="small" href={d.dispensaries.website} target="_blank" sx={{ mt: 1, color: '#7cb342' }}>Visit Website →</Button>}
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

  // Show SeedVendorFinder if requested
  if (showSeedFinder && seedFinderStrain) {
    return (
      <SeedVendorFinder
        onBack={() => {
          setShowSeedFinder(false);
          setSeedFinderStrain(null);
          setDetailsOpen(true);
        }}
        strainName={seedFinderStrain.name}
        strainSlug={seedFinderStrain.slug}
      />
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', p: 2, background: 'none' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700 }}>🌿 Strain Browser</Typography>
        {onBack && (
          <Button size="small" variant="outlined" onClick={onBack} sx={{ color: '#fff', borderColor: 'rgba(124, 179, 66, 0.6)', fontSize: '0.875rem', '&:hover': { borderColor: 'rgba(124, 179, 66, 1)', bgcolor: 'rgba(124, 179, 66, 0.1)' } }}>
            ← Back
          </Button>
        )}
      </Stack>

      <Paper sx={{ p: 2, mb: 2, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', border: '1px solid rgba(124, 179, 66, 0.3)', borderRadius: 2 }}>
        <Grid container spacing={1.5}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search strains..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (<InputAdornment position="start"><SearchIcon sx={{ color: '#7cb342', fontSize: 20 }} /></InputAdornment>),
                  sx: { color: '#fff', fontSize: '0.875rem', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(124, 179, 66, 0.5)' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(124, 179, 66, 0.8)' }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#7cb342' } }
                }
              }}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: '#fff', fontSize: '0.875rem' }}>Type</InputLabel>
              <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} label="Type" sx={{ color: '#fff', fontSize: '0.875rem', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(124, 179, 66, 0.5)' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(124, 179, 66, 0.8)' }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#7cb342' } }}>
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="indica">Indica</MenuItem>
                <MenuItem value="sativa">Sativa</MenuItem>
                <MenuItem value="hybrid">Hybrid</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: '#fff', fontSize: '0.875rem' }}>Sort</InputLabel>
              <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} label="Sort" sx={{ color: '#fff', fontSize: '0.875rem', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(124, 179, 66, 0.5)' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(124, 179, 66, 0.8)' }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#7cb342' } }}>
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="thc">THC %</MenuItem>
                <MenuItem value="rating">Rating</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4} md={2}>
            <Button
              fullWidth
              size="small"
              variant={showFilters ? "contained" : "outlined"}
              onClick={() => setShowFilters(!showFilters)}
              startIcon={<FilterListIcon fontSize="small" />}
              sx={{
                color: showFilters ? '#000' : '#fff',
                bgcolor: showFilters ? '#7cb342' : 'transparent',
                borderColor: 'rgba(124, 179, 66, 0.6)',
                fontSize: '0.875rem',
                '&:hover': {
                  borderColor: 'rgba(124, 179, 66, 1)',
                  bgcolor: showFilters ? '#7cb342' : 'rgba(124, 179, 66, 0.1)'
                }
              }}
            >
              Filters
            </Button>
          </Grid>
        </Grid>

        {/* Advanced Filters */}
        {showFilters && (
          <Box sx={{ mt: 3, p: 2, background: 'rgba(124, 179, 66, 0.1)', borderRadius: 2, border: '1px solid rgba(124, 179, 66, 0.3)' }}>
            <Typography variant="subtitle2" sx={{ color: '#7cb342', fontWeight: 700, mb: 2 }}>
              Advanced Filters
            </Typography>
            <Box sx={{ px: 2 }}>
              <Typography variant="body2" sx={{ color: '#fff', mb: 1 }}>
                THC Range: {thcRange[0]}% - {thcRange[1]}%
              </Typography>
              <Slider
                value={thcRange}
                onChange={(e, newValue) => setThcRange(newValue)}
                valueLabelDisplay="auto"
                min={0}
                max={35}
                sx={{
                  color: '#7cb342',
                  '& .MuiSlider-thumb': {
                    bgcolor: '#7cb342',
                  },
                  '& .MuiSlider-track': {
                    bgcolor: '#7cb342',
                  },
                  '& .MuiSlider-rail': {
                    bgcolor: 'rgba(124, 179, 66, 0.3)',
                  },
                }}
              />
            </Box>
          </Box>
        )}

        <Stack direction="row" justifyContent="space-between" alignItems="center" mt={2}>
          <Typography variant="caption" sx={{ color: '#e0e0e0', fontSize: '0.8rem' }}>
            {loading ? (
              'Loading strains...'
            ) : (
              <>
                Showing {displayedStrains.length} of {filteredStrains.length} strains
                {filteredStrains.length < strains.length && ` (filtered from ${strains.length} total)`}
                {!allStrainsLoaded && ' - Loading all strains...'}
              </>
            )}
          </Typography>
          {favorites.length > 0 && (
            <Tooltip title="View favorites">
              <Chip
                size="small"
                icon={<FavoriteIcon sx={{ fontSize: 16 }} />}
                label={`${favorites.length}`}
                onClick={() => {
                  // Filter to show only favorites
                  setSearchQuery('');
                  setTypeFilter('all');
                  const favStrains = strains.filter(s => favorites.includes(s.slug));
                  setFilteredStrains(favStrains);
                  setSnackbar({ open: true, message: 'Showing favorites only', severity: 'info' });
                }}
                sx={{
                  bgcolor: 'rgba(255, 64, 129, 0.2)',
                  color: '#ff4081',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  height: 24,
                  '&:hover': { bgcolor: 'rgba(255, 64, 129, 0.3)' }
                }}
              />
            </Tooltip>
          )}
        </Stack>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress sx={{ color: '#7cb342' }} /></Box>
      ) : (
        <>
          <Grid container spacing={2}>
            {displayedStrains.map((strain) => (
              <Grid item xs={6} sm={4} md={3} lg={2} key={strain.slug}>
                <Card sx={{ position: 'relative', cursor: 'pointer', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', border: '1px solid rgba(124, 179, 66, 0.3)', borderRadius: 2, transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-4px)', border: '1px solid rgba(124, 179, 66, 0.8)', boxShadow: '0 8px 24px rgba(124, 179, 66, 0.3)' } }}>
                  {/* Favorite Button */}
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(strain.slug);
                    }}
                    sx={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      zIndex: 10,
                      bgcolor: 'rgba(0,0,0,0.6)',
                      color: favorites.includes(strain.slug) ? '#ff4081' : '#fff',
                      padding: '4px',
                      '&:hover': {
                        bgcolor: 'rgba(0,0,0,0.8)',
                        transform: 'scale(1.1)',
                      },
                    }}
                  >
                    {favorites.includes(strain.slug) ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
                  </IconButton>

                  <Box
                    onClick={() => handleStrainClick(strain)}
                    sx={{
                      height: 120,
                      backgroundImage: `url(${getStrainImageUrl(strain)})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundColor: getTypeColor(strain.type),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      cursor: 'pointer',
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: `linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.5) 100%)`,
                      }
                    }}
                  >
                    <SpaIcon sx={{ fontSize: 48, color: '#fff', opacity: 0.3, zIndex: 0 }} />
                  </Box>

                  <CardContent onClick={() => handleStrainClick(strain)} sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600, mb: 0.5, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {strain.name}
                    </Typography>
                    <Chip label={strain.type || 'Unknown'} size="small" sx={{ bgcolor: getTypeColor(strain.type), color: '#fff', fontWeight: 600, fontSize: '0.65rem', height: 18, mb: 0.5 }} />
                    {strain.thc && (
                      <Typography variant="caption" sx={{ color: '#7cb342', fontWeight: 600, display: 'block', fontSize: '0.7rem' }}>
                        THC: {strain.thc}%
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Infinite scroll trigger */}
          <Box ref={observerTarget} sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
            {hasMore && displayedStrains.length > 0 && (
              <Typography variant="body2" sx={{ color: '#7cb342' }}>Scroll for more...</Typography>
            )}
            {!hasMore && displayedStrains.length > 0 && displayedStrains.length === filteredStrains.length && (
              <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
                All {filteredStrains.length} strains displayed! 🌿
              </Typography>
            )}
          </Box>
        </>
      )}

      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth slotProps={{ paper: { sx: { background: 'linear-gradient(135deg, rgba(30, 30, 30, 0.98) 0%, rgba(20, 20, 20, 0.98) 100%)', backdropFilter: 'blur(20px)', border: '2px solid rgba(124, 179, 66, 0.3)', borderRadius: 4 } } }}>
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

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

