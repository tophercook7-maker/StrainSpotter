import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Box, TextField, Grid, Card, CardContent, Typography, Chip, Stack, Button,
  InputAdornment, Select, MenuItem, FormControl, InputLabel, CircularProgress,
  Dialog, DialogTitle, DialogContent, IconButton, Tabs, Tab, Paper, List,
  ListItem, ListItemText, ListItemIcon, Slider, Tooltip, Snackbar, Alert, Container
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
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
import NoteAltIcon from '@mui/icons-material/NoteAlt';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import { supabase } from '../supabaseClient';
import { API_BASE } from '../config';
import SeedVendorFinder from './SeedVendorFinder';
import JournalDialog from './JournalDialog';
import EmptyStateCard from './EmptyStateCard';

const STRAINS_PER_PAGE = 100; // Display 100 strains at a time
const FETCH_BATCH_SIZE = 1000; // Fetch 1000 strains per database query

// Helper: safely resolve best strain image URL (prioritize thumbnail for performance)
const getStrainImageUrl = (strain) => {
  if (!strain) return null;
  const candidates = [
    strain.thumbnail_url, // Prioritize thumbnail for faster loading
    strain.image_url,
    strain.photo_url,
    strain.main_image,
    strain.leafly_image,
    strain.hero_image_url,
    strain.image,
    strain.imageUrl,
  ];
  return candidates.find((u) => typeof u === 'string' && u.startsWith('http')) || null;
};

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
  const [allStrainsLoaded, setAllStrainsLoaded] = useState(false);

  // New state for enhancements
  const [sortBy, setSortBy] = useState('type'); // type, name, thc, rating
  const [thcRange, setThcRange] = useState([0, 35]); // THC% range filter
  const [favorites, setFavorites] = useState([]); // Array of favorite strain slugs
  const [showFilters, setShowFilters] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [showSeedFinder, setShowSeedFinder] = useState(false);
  const [showingFavorites, setShowingFavorites] = useState(false);
  const [journalDialogOpen, setJournalDialogOpen] = useState(false);
  const [journalDefaults, setJournalDefaults] = useState(null);
  
  // Pagination state - limit rendering to prevent freeze with 35k strains
  const [maxToShow, setMaxToShow] = useState(300); // Start with 300 to keep it snappy

  const observerTarget = useRef(null);

  const handleLogExperience = (strain) => {
    if (!strain) return;
    setJournalDefaults({
      strain_name: strain.name,
      strain_slug: strain.slug
    });
    setJournalDialogOpen(true);
  };

  // Detect user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('[StrainBrowser] Location obtained successfully');
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLoadingLocation(false);
        },
        (error) => {
          console.log('[StrainBrowser] Location denied or unavailable:', error.message);
          // Fallback to San Francisco if location denied
          setUserLocation({ lat: 37.7749, lng: -122.4194 });
          setLoadingLocation(false);
        },
        {
          timeout: 5000,
          maximumAge: 300000, // 5 min cache
          enableHighAccuracy: false
        }
      );
    } else {
      console.log('[StrainBrowser] Geolocation not supported');
      // Fallback if geolocation not supported
      setUserLocation({ lat: 37.7749, lng: -122.4194 });
      setLoadingLocation(false);
    }
  }, []);

  // Fetch ALL strains on mount
  const fetchStrainsFromSupabase = useCallback(async () => {
    if (!supabase) return [];
    let allData = [];
    let from = 0;
    const batchSize = FETCH_BATCH_SIZE;
    let hasMoreData = true;

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

        if (count && allData.length < count) {
          from += batchSize;
        } else {
          hasMoreData = false;
        }
      } else {
        hasMoreData = false;
      }
    }

    return allData;
  }, [supabase]);

  const fetchStrainsFromApi = useCallback(async () => {
    let results = [];
    let pageIndex = 1;
    let totalPages = 1;

    while (pageIndex <= totalPages) {
      const res = await fetch(`${API_BASE}/api/strains?page=${pageIndex}&limit=${FETCH_BATCH_SIZE}`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} when fetching strains from API`);
      }
      const payload = await res.json();
      const pageStrains = Array.isArray(payload?.strains) ? payload.strains : [];
      results = [...results, ...pageStrains];

      totalPages = payload?.pages || 1;
      if (pageStrains.length === 0) {
        break;
      }
      pageIndex += 1;
    }

    return results;
  }, [API_BASE]);

  const fetchAllStrains = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching ALL strains from database...');

      let allData = [];
      let usedSupabase = false;

      if (supabase) {
        try {
          allData = await fetchStrainsFromSupabase();
          usedSupabase = allData.length > 0;
          if (usedSupabase) {
            console.log(`✅ Loaded ${allData.length} total strains from Supabase!`);
          } else {
            console.warn('Supabase returned 0 strains, attempting API fallback...');
          }
        } catch (supabaseError) {
          console.error('❌ Supabase error fetching strains:', supabaseError);
        }
      }

      if (!allData.length) {
        console.log('🌐 Falling back to local API for strain data...');
        allData = await fetchStrainsFromApi();
        console.log(`✅ Loaded ${allData.length} strains via API fallback`);
      }

      if (!allData.length) {
        throw new Error('No strain data returned from Supabase or API');
      }

      setStrains(allData);
      setAllStrainsLoaded(true);
      setHasMore(false);
    } catch (error) {
      console.error('❌ Error fetching strains:', error);
      setStrains([]);
    } finally {
      setLoading(false);
    }
  }, [fetchStrainsFromApi, fetchStrainsFromSupabase, supabase]);

  useEffect(() => {
    fetchAllStrains();
  }, [fetchAllStrains]);

  // Sort strains
  const sortStrains = useCallback((strainsToSort) => {
    const sorted = [...strainsToSort];
    const typeOrder = { 'indica': 1, 'sativa': 2, 'hybrid': 3 };

    switch (sortBy) {
      case 'type': {
        // Sort by type: Indica > Sativa > Hybrid > Unknown
        return sorted.sort((a, b) => {
          const aType = (a.type || 'unknown').toLowerCase();
          const bType = (b.type || 'unknown').toLowerCase();
          const aOrder = typeOrder[aType] || 4;
          const bOrder = typeOrder[bType] || 4;
          if (aOrder !== bOrder) return aOrder - bOrder;
          // If same type, sort by name
          return (a.name || '').localeCompare(b.name || '');
        });
      }
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
  }, [sortBy]);

  // Apply THC filter
  const applyThcFilter = useCallback((strainsToFilter) => {
    return strainsToFilter.filter(strain => {
      const thc = parseFloat(strain.thc) || 0;
      return thc >= thcRange[0] && thc <= thcRange[1];
    });
  }, [thcRange]);

  // Filter strains when search/type/sort/thc changes
  const filterStrains = useCallback(() => {
    setShowingFavorites(false);
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

    if (showFilters) {
      filtered = applyThcFilter(filtered);
    } else {
      filtered = filtered.filter(s => {
        const thcValue = s.thc ?? 0;
        return thcValue >= thcRange[0] && thcValue <= thcRange[1];
      });
    }

    filtered = sortStrains(filtered);
    setFilteredStrains(filtered);
  }, [strains, searchQuery, typeFilter, showFilters, thcRange, sortStrains, applyThcFilter]);

  useEffect(() => {
    filterStrains();
  }, [filterStrains]);

  // Use maxToShow to limit visible strains and prevent freeze
  const visibleStrains = useMemo(
    () => (Array.isArray(displayedStrains) ? displayedStrains.slice(0, maxToShow) : []),
    [displayedStrains, maxToShow]
  );

  // Reset displayed strains when filtered strains change
  useEffect(() => {
    setDisplayedStrains(filteredStrains.slice(0, STRAINS_PER_PAGE));
    setPage(0);
    setHasMore(filteredStrains.length > STRAINS_PER_PAGE);
    setMaxToShow(300); // Reset to initial limit when filters change
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

  const handleStrainClick = async (strain) => {
    setSelectedStrain(strain);
    setDetailsOpen(true);
    setDetailsTab(0);
    fetchVendorsForStrain(strain.name);
    fetchDispensariesForStrain();
    fetchReviewsForStrain(strain.slug, strain);
  };

  const fetchVendorsForStrain = async (strainName) => {
    try {
      // Use live seed vendor search API
      const apiBase = API_BASE || 'http://localhost:5181';
      const response = await fetch(`${apiBase}/api/seeds-live?strain=${encodeURIComponent(strainName)}&limit=20`);
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

  const fetchDispensariesForStrain = async () => {
    try {
      // Use live dispensary search API with user location
      if (!userLocation) {
        setDispensaries([]);
        return;
      }

      const apiBase = API_BASE || 'http://localhost:5181';
      const response = await fetch(
        `${apiBase}/api/dispensaries-live?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=100&limit=20`
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

  const fetchReviewsForStrain = async (strainSlug, strainForFallback) => {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('reviews')
          .select('*')
          .eq('strain_slug', strainSlug)
          .order('created_at', { ascending: false })
          .limit(10);
        if (error) throw error;
        if (data && data.length) {
          setReviews(data);
          return;
        }
      }

      const res = await fetch(`${API_BASE}/api/strains/${strainSlug}/reviews`);
      if (res.ok) {
        const payload = await res.json().catch(() => ({}));
        const reviewList = Array.isArray(payload?.reviews) ? payload.reviews : [];
        setReviews(reviewList);
        return;
      }

      throw new Error(`HTTP ${res.status} when fetching reviews`);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      const fallbackReviews = strainForFallback?.reviews;
      setReviews(Array.isArray(fallbackReviews) ? fallbackReviews : []);
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
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, bgcolor: 'rgba(124, 179, 66, 0.15)', borderRadius: 2 }}>
                <Typography variant="caption" sx={{ color: '#e0e0e0' }}>Type</Typography>
                <Typography variant="h6" sx={{ color: '#fff', textTransform: 'capitalize' }}>{selectedStrain.type || 'Unknown'}</Typography>
              </Paper>
            </Grid>
            {selectedStrain.thc && (
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, bgcolor: 'rgba(124, 179, 66, 0.2)', borderRadius: 2 }}>
                  <Typography variant="caption" sx={{ color: '#e0e0e0' }}>THC</Typography>
                  <Typography variant="h5" sx={{ color: '#7cb342', fontWeight: 700 }}>{selectedStrain.thc}%</Typography>
                </Paper>
              </Grid>
            )}
            {selectedStrain.cbd && (
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, bgcolor: 'rgba(33, 150, 243, 0.2)', borderRadius: 2 }}>
                  <Typography variant="caption" sx={{ color: '#e0e0e0' }}>CBD</Typography>
                  <Typography variant="h5" sx={{ color: '#2196f3', fontWeight: 700 }}>{selectedStrain.cbd}%</Typography>
                </Paper>
              </Grid>
            )}
            <Grid item xs={12} sm={selectedStrain.cbd ? 3 : 6}>
              <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
                <Typography variant="caption" sx={{ color: '#e0e0e0' }}>Common effects</Typography>
                <Typography variant="body2" sx={{ color: '#fff' }}>
                  {selectedStrain.effects?.slice(0, 3).join(', ') || '—'}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
                <Typography variant="caption" sx={{ color: '#e0e0e0' }}>Flavors</Typography>
                <Typography variant="body2" sx={{ color: '#fff' }}>
                  {selectedStrain.flavors?.slice(0, 3).join(', ') || '—'}
                </Typography>
              </Paper>
            </Grid>
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
                // Navigate to seed vendors (no strain pre-fill needed)
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
  if (showSeedFinder) {
    return (
      <SeedVendorFinder
        onBack={() => {
          setShowSeedFinder(false);
          setDetailsOpen(true);
        }}
      />
    );
  }

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      // Fallback: go back in history if available
      if (window.history.length > 1) {
        window.history.back();
      }
    }
  };

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden', // Important so only the inner area scrolls
        pt: 'env(safe-area-inset-top)', // Account for iOS safe area
      }}
    >
      {/* Header (fixed) */}
      <Box
        sx={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          p: 2,
          gap: 1.5,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          bgcolor: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(10px)',
          zIndex: 1,
        }}
      >
        <IconButton
          edge="start"
          onClick={handleBack}
          sx={{ color: '#fff' }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#fff', flex: 1 }}>
          Strain Browser
        </Typography>
      </Box>

      {/* Scrollable content */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0, // CRITICAL for flex scrolling
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch', // iOS momentum scroll
        }}
      >
        <Container maxWidth="md" sx={{ py: 2 }}>

      {/* Hero Section */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <Box
          sx={{
            width: { xs: 80, sm: 100 },
            height: { xs: 80, sm: 100 },
            borderRadius: '50%',
            background: 'transparent',
            border: '2px solid rgba(124, 179, 66, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 30px rgba(124, 179, 66, 0.5)',
            overflow: 'hidden',
            animation: 'pulse 3s ease-in-out infinite',
            '@keyframes pulse': {
              '0%': { boxShadow: '0 0 20px rgba(124, 179, 66, 0.4)' },
              '50%': { boxShadow: '0 0 40px rgba(124, 179, 66, 0.7)' },
              '100%': { boxShadow: '0 0 20px rgba(124, 179, 66, 0.4)' }
            }
          }}
        >
          <img
            src="/hero.png?v=13"
            alt="StrainSpotter"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </Box>
      </Box>

      <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ mb: 2 }}>
        <Box component="img" src="/hero.png?v=13" alt="" sx={{ width: 24, height: 24, borderRadius: '50%', filter: 'drop-shadow(0 0 4px rgba(124, 179, 66, 0.6))' }} />
        <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700 }}>Strain Browser</Typography>
      </Stack>

      <Paper sx={{ p: 2, mb: 2, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', border: '1px solid rgba(124, 179, 66, 0.3)', borderRadius: 2 }}>
        <Grid container spacing={1.5}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search strains by name, effects, flavors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  filterStrains();
                }
              }}
              slotProps={{
                input: {
                  startAdornment: (<InputAdornment position="start"><SearchIcon sx={{ color: '#7cb342', fontSize: 20 }} /></InputAdornment>),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setSearchQuery('')}
                        sx={{ color: '#fff', padding: '4px' }}
                      >
                        <CloseIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </InputAdornment>
                  ),
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
                <MenuItem value="type">Type (I→S→H)</MenuItem>
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
          {showingFavorites && (
            <Button
              size="small"
              variant="text"
              onClick={() => {
                setShowingFavorites(false);
                filterStrains();
              }}
              sx={{ color: '#7cb342' }}
            >
              Show all strains
            </Button>
          )}
          {favorites.length > 0 && (
            <Tooltip title="View favorites">
              <Chip
                size="small"
                icon={<FavoriteIcon sx={{ fontSize: 16 }} />}
                label={`${favorites.length}`}
                onClick={() => {
                      if (favorites.length === 0) {
                        setSnackbar({ open: true, message: 'No favorites yet. Tap the heart on any strain to save it.', severity: 'warning' });
                        return;
                      }
                      // Filter to show only favorites
                      setSearchQuery('');
                      setTypeFilter('all');
                      const favStrains = strains.filter(s => favorites.includes(s.slug));
                      setFilteredStrains(favStrains);
                      setDisplayedStrains(favStrains.slice(0, STRAINS_PER_PAGE));
                      setHasMore(false);
                      setShowingFavorites(true);
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

      {!loading && favorites.length === 0 && (
        <Box sx={{ mb: 3 }}>
          <EmptyStateCard
            title="No favorites yet"
            description="Tap the heart icon on any strain to pin it here for quick access."
            icon={<FavoriteBorderIcon sx={{ fontSize: 48, color: '#ff4081' }} />}
          />
        </Box>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress sx={{ color: '#7cb342' }} /></Box>
      ) : (
        <>
          <Stack spacing={1}>
            {visibleStrains.map((strain) => {
              const indicaPercent = strain.type === 'indica' ? 100 : strain.type === 'sativa' ? 0 : 50;
              const sativaPercent = 100 - indicaPercent;
              const typeColor = strain.type === 'indica' ? '#7b1fa2' : strain.type === 'sativa' ? '#f57c00' : '#00897b';
              const strainNumber = filteredStrains.findIndex(s => s.slug === strain.slug) + 1;

              return (
                <Paper
                  key={strain.slug}
                  onClick={() => handleStrainClick(strain)}
                  sx={{
                    p: 1.5,
                    cursor: 'pointer',
                    background: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(20px)',
                    border: `2px solid ${typeColor}40`,
                    borderRadius: 2,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateX(4px)',
                      border: `2px solid ${typeColor}`,
                      boxShadow: `0 4px 16px ${typeColor}40`,
                    }
                  }}
                >
                  {/* Strain Image */}
                  <Box
                    sx={{
                      width: '100%',
                      aspectRatio: '16/9',
                      overflow: 'hidden',
                      borderRadius: 1,
                      mb: 1,
                      bgcolor: 'rgba(0,0,0,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: 120,
                      position: 'relative'
                    }}
                  >
                    {/* Image or placeholder */}
                    {(() => {
                      const imageUrl = getStrainImageUrl(strain);
                      return imageUrl ? (
                        <Box
                          component="img"
                          src={imageUrl}
                          alt={strain.name || 'Strain photo'}
                          loading="lazy"
                          sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block',
                            background: '#111'
                          }}
                          onError={(e) => {
                            // Hide broken image and show placeholder
                            e.currentTarget.style.display = 'none';
                            const placeholder = e.currentTarget.parentElement?.querySelector('.strain-placeholder');
                            if (placeholder) {
                              placeholder.style.display = 'flex';
                            }
                          }}
                        />
                      ) : null;
                    })()}
                    {/* Placeholder - shown when no image or image fails */}
                    <Box
                      className="strain-placeholder"
                      sx={{
                        display: getStrainImageUrl(strain) ? 'none' : 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        height: '100%',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        background: 'linear-gradient(135deg, rgba(124, 179, 66, 0.15) 0%, rgba(0, 0, 0, 0.4) 100%)',
                        border: '1px solid rgba(124, 179, 66, 0.2)',
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'rgba(200, 230, 201, 0.6)',
                          fontSize: 11,
                          textAlign: 'center',
                          px: 2,
                          fontWeight: 500,
                        }}
                      >
                        No strain photo yet
                      </Typography>
                    </Box>
                  </Box>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    {/* Strain Number */}
                    <Typography variant="caption" sx={{
                      color: '#7cb342',
                      fontWeight: 700,
                      fontSize: '0.7rem',
                      minWidth: 32,
                      textAlign: 'right',
                      opacity: 0.7
                    }}>
                      #{strainNumber}
                    </Typography>

                    {/* Favorite Icon */}
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(strain.slug);
                      }}
                      sx={{
                        color: favorites.includes(strain.slug) ? '#ff4081' : '#666',
                        padding: '2px',
                        '&:hover': {
                          color: '#ff4081',
                          transform: 'scale(1.2)',
                        },
                      }}
                    >
                      {favorites.includes(strain.slug) ? <FavoriteIcon sx={{ fontSize: 18 }} /> : <FavoriteBorderIcon sx={{ fontSize: 18 }} />}
                    </IconButton>

                    {/* Strain Name */}
                    <Typography variant="body1" sx={{
                      color: '#fff',
                      fontWeight: 700,
                      flex: 1,
                      fontSize: '0.85rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {strain.name}
                    </Typography>

                    {/* Indica/Sativa Ratio */}
                    <Stack direction="row" alignItems="center" spacing={0.3} sx={{ minWidth: 55, flexShrink: 0 }}>
                      <Typography variant="caption" sx={{ color: '#7b1fa2', fontWeight: 600, fontSize: '0.65rem' }}>
                        I{indicaPercent}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#666', fontSize: '0.65rem' }}>|</Typography>
                      <Typography variant="caption" sx={{ color: '#f57c00', fontWeight: 600, fontSize: '0.65rem' }}>
                        S{sativaPercent}
                      </Typography>
                    </Stack>

                    {/* THC % */}
                    {strain.thc && (
                      <Chip
                        label={`${strain.thc}%`}
                        size="small"
                        sx={{
                          bgcolor: '#7cb342',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '0.65rem',
                          height: 20,
                          minWidth: 40,
                          flexShrink: 0,
                          '& .MuiChip-label': { px: 0.5 }
                        }}
                      />
                    )}

                    {/* Type Badge */}
                    <Chip
                      label={strain.type || 'Unk'}
                      size="small"
                      sx={{
                        bgcolor: typeColor,
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.65rem',
                        height: 20,
                        minWidth: 45,
                        flexShrink: 0,
                        textTransform: 'capitalize',
                        '& .MuiChip-label': { px: 0.5 }
                      }}
                    />
                  </Stack>
                </Paper>
              );
            })}
          </Stack>

          {/* Load more button if there are more strains than maxToShow */}
          {Array.isArray(displayedStrains) && displayedStrains.length > maxToShow && (
            <Box sx={{ textAlign: 'center', padding: '16px 0' }}>
              <Button
                type="button"
                onClick={() => setMaxToShow((prev) => prev + 300)}
                variant="contained"
                sx={{
                  padding: '10px 18px',
                  borderRadius: 999,
                  fontWeight: 600,
                  fontSize: 14,
                  bgcolor: '#7cb342',
                  '&:hover': { bgcolor: '#689f38' }
                }}
              >
                Load 300 more strains
              </Button>
            </Box>
          )}

          {/* Infinite scroll trigger */}
          <Box ref={observerTarget} sx={{ py: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            {hasMore && displayedStrains.length > 0 && (
              <>
                <CircularProgress size={30} sx={{ color: '#7cb342' }} />
                <Typography variant="body2" sx={{ color: '#7cb342', fontWeight: 600 }}>
                  Loading more strains...
                </Typography>
              </>
            )}
            {!hasMore && displayedStrains.length > 0 && displayedStrains.length === filteredStrains.length && (
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
                  All {filteredStrains.length} strains displayed!
                </Typography>
                <Box component="img" src="/hero.png?v=13" alt="" sx={{ width: 16, height: 16, borderRadius: '50%', filter: 'drop-shadow(0 0 4px rgba(124, 179, 66, 0.6))' }} />
              </Stack>
            )}
          </Box>
        </>
      )}

      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen
        slotProps={{
          paper: {
            sx: {
              background: 'linear-gradient(135deg, rgba(30, 30, 30, 0.98) 0%, rgba(20, 20, 20, 0.98) 100%)',
              backdropFilter: 'blur(20px)',
              border: '2px solid rgba(124, 179, 66, 0.3)',
              borderRadius: { xs: 0, sm: 4 },
              m: 0,
              maxHeight: '100vh'
            }
          }
        }}
      >
        <DialogTitle sx={{
          color: '#fff',
          fontWeight: 700,
          borderBottom: '1px solid rgba(124, 179, 66, 0.3)',
          pt: 'calc(env(safe-area-inset-top) + 16px)'
        }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>{selectedStrain?.name}</Typography>
              <Chip label={selectedStrain?.type || 'Unknown'} size="small" sx={{ bgcolor: getTypeColor(selectedStrain?.type), color: '#fff', fontWeight: 600, mt: 1 }} />
            </Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                size="small"
                variant="contained"
                startIcon={<NoteAltIcon />}
                onClick={() => handleLogExperience(selectedStrain)}
              >
                Log experience
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<LibraryBooksIcon />}
                onClick={() => {
                  setDetailsOpen(false);
                  window.dispatchEvent(new CustomEvent('nav:set-view', { detail: 'grow-coach' }));
                }}
                sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
              >
                Grow log
              </Button>
              <IconButton onClick={() => setDetailsOpen(false)} sx={{ color: '#fff' }}><CloseIcon /></IconButton>
            </Stack>
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
      <JournalDialog
        open={journalDialogOpen}
        defaults={journalDefaults}
        onClose={() => setJournalDialogOpen(false)}
        onSaved={() => {
          setJournalDialogOpen(false);
          setSnackbar({ open: true, message: 'Journal entry saved.', severity: 'success' });
        }}
      />
        </Container>
      </Box>
    </Box>
  );
}
