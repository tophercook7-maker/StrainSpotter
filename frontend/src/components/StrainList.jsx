import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Pagination,
  CircularProgress,
  Alert,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Stack
} from '@mui/material';

import { API_BASE } from '../config';

function StrainList() {
  const [strains, setStrains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [minThc, setMinThc] = useState('');
  const [maxThc, setMaxThc] = useState('');
  const [selectedStrain, setSelectedStrain] = useState(null);

  const fetchStrains = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });
      
      if (typeFilter) params.append('type', typeFilter);
      if (minThc) params.append('minThc', minThc);
      if (maxThc) params.append('maxThc', maxThc);
      
      const response = await fetch(`${API_BASE}/api/strains?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setStrains(data.strains || []);
      setTotalPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching strains:', err);
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, minThc, maxThc]);

  useEffect(() => {
    fetchStrains();
  }, [fetchStrains]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
  const response = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(searchQuery)}&limit=20`);
      const data = await response.json();
      setStrains(data);
      setTotalPages(1);
      setTotal(data.length);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    window.scrollTo(0, 0);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setTypeFilter('');
    setMinThc('');
    setMaxThc('');
    setPage(1);
  };

  const handleStrainClick = (strain) => {
    setSelectedStrain(strain);
  };

  if (selectedStrain) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
        <Button 
          variant="outlined" 
          onClick={() => setSelectedStrain(null)}
          sx={{ mb: 2 }}
        >
          0 Back to List
        </Button>
        
        <Card sx={{
          bgcolor: 'rgba(255,255,255,0.7)',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
          backdropFilter: 'blur(12px)',
          borderRadius: 4,
          border: '1px solid rgba(255,255,255,0.18)'
        }}>
          <CardContent>
            <Typography variant="h4" gutterBottom>
              {selectedStrain.name}
            </Typography>
            
            {selectedStrain.type && (
              <Chip 
                label={selectedStrain.type} 
                color={
                  selectedStrain.type === 'Indica' ? 'primary' :
                  selectedStrain.type === 'Sativa' ? 'success' : 'secondary'
                }
                sx={{ mb: 2 }}
              />
            )}
            
            {selectedStrain.description && (
              <Typography variant="body1" paragraph sx={{ mt: 2 }}>
                {selectedStrain.description}
              </Typography>
            )}
            
            {selectedStrain.thc !== null && selectedStrain.thc > 0 && (
              <Typography variant="body2" color="text.secondary">
                <strong>THC:</strong> {selectedStrain.thc}%
              </Typography>
            )}
            
            {selectedStrain.cbd !== null && selectedStrain.cbd > 0 && (
              <Typography variant="body2" color="text.secondary">
                <strong>CBD:</strong> {selectedStrain.cbd}%
              </Typography>
            )}
            
            {selectedStrain.effects && selectedStrain.effects.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Effects:
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {selectedStrain.effects.map((effect, idx) => (
                    <Chip key={idx} label={effect} size="small" />
                  ))}
                </Stack>
              </Box>
            )}
            
            {selectedStrain.flavors && selectedStrain.flavors.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Flavors/Terpenes:
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {selectedStrain.flavors.map((flavor, idx) => (
                    <Chip key={idx} label={flavor} size="small" variant="outlined" />
                  ))}
                </Stack>
              </Box>
            )}
            
            {selectedStrain.lineage && selectedStrain.lineage.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Lineage:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedStrain.lineage.join(' × ')}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
  <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h3" gutterBottom>
        StrainSpotter
      </Typography>
      
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        {total.toLocaleString()} strains in database
      </Typography>

      {/* Search & Filters */}
      <Card sx={{ mb: 3, p: 2,
        bgcolor: 'rgba(255,255,255,0.7)',
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        backdropFilter: 'blur(12px)',
        borderRadius: 4,
        border: '1px solid rgba(255,255,255,0.18)'
      }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search strains"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </Grid>
          
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={typeFilter}
                label="Type"
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="Indica">Indica</MenuItem>
                <MenuItem value="Sativa">Sativa</MenuItem>
                <MenuItem value="Hybrid">Hybrid</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={6} md={2}>
            <TextField
              fullWidth
              label="Min THC %"
              type="number"
              value={minThc}
              onChange={(e) => setMinThc(e.target.value)}
            />
          </Grid>
          
          <Grid item xs={6} md={2}>
            <TextField
              fullWidth
              label="Max THC %"
              type="number"
              value={maxThc}
              onChange={(e) => setMaxThc(e.target.value)}
            />
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Stack spacing={1}>
              <Button 
                variant="contained" 
                onClick={handleSearch}
                fullWidth
              >
                Search
              </Button>
              <Button 
                variant="outlined" 
                onClick={handleClearFilters}
                size="small"
                fullWidth
              >
                Clear
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Error: {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={2}>
            {strains.map((strain) => (
              <Grid item xs={12} sm={6} md={4} key={strain.slug}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    cursor: 'pointer',
                    '&:hover': { boxShadow: 6 },
                    bgcolor: 'rgba(255,255,255,0.7)',
                    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                    backdropFilter: 'blur(12px)',
                    borderRadius: 4,
                    border: '1px solid rgba(255,255,255,0.18)'
                  }}
                  onClick={() => handleStrainClick(strain)}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom noWrap>
                      {strain.name}
                    </Typography>
                    
                    {strain.type && (
                      <Chip 
                        label={strain.type}
                        size="small"
                        color={
                          strain.type === 'Indica' ? 'primary' :
                          strain.type === 'Sativa' ? 'success' : 'secondary'
                        }
                        sx={{ mb: 1 }}
                      />
                    )}
                    
                    {strain.description && (
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {strain.description}
                      </Typography>
                    )}
                    
                    {(strain.thc !== null && strain.thc > 0) && (
                      <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        THC: {strain.thc}%
                      </Typography>
                    )}
                    
                    {strain.effects && strain.effects.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        {strain.effects.slice(0, 3).map((effect, idx) => (
                          <Chip 
                            key={idx} 
                            label={effect} 
                            size="small" 
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ))}
                        {strain.effects.length > 3 && (
                          <Typography variant="caption" color="text.secondary">
                            +{strain.effects.length - 3} more
                          </Typography>
                        )}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination 
                count={totalPages} 
                page={page} 
                onChange={handlePageChange}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
}

export default StrainList;
