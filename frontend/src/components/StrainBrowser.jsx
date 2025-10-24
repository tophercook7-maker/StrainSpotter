import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Button,
  CircularProgress,
  IconButton
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { API_BASE } from '../config';
const API = `${API_BASE}/api`;

// Styled components with glassmorphism
const StyledStrainCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  background: 'rgba(255, 255, 255, 0.75)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: theme.shadows[8],
    background: 'rgba(255, 255, 255, 0.85)',
    transform: 'translateY(-4px)'
  }
}));

const EffectChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
}));

const FlavorChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
  backgroundColor: theme.palette.secondary.light
}));

// Filter component
function StrainFilters({ onFilterChange }) {
  const [types, setTypes] = useState([]);
  const [effects, setEffects] = useState([]);
  const [filters, setFilters] = useState({
    type: '',
    effect: '',
    minThc: 0,
    maxThc: 30,
    search: ''
  });

  useEffect(() => {
    // Load filter options
    Promise.all([
      fetch(`${API}/types`).then(r => r.json()),
      fetch(`${API}/effects`).then(r => r.json())
    ]).then(([typeData, effectData]) => {
      setTypes(typeData);
      setEffects(effectData);
    });
  }, []);

  const handleChange = (field) => (event) => {
    const newFilters = {
      ...filters,
      [field]: event.target.value
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth>
            <InputLabel>Type</InputLabel>
            <Select value={filters.type} onChange={handleChange('type')}>
              <MenuItem value="">All</MenuItem>
              {types.map(type => (
                <MenuItem key={type} value={type}>{type}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth>
            <InputLabel>Effect</InputLabel>
            <Select value={filters.effect} onChange={handleChange('effect')}>
              <MenuItem value="">All</MenuItem>
              {effects.map(effect => (
                <MenuItem key={effect} value={effect}>{effect}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Typography gutterBottom>THC Range (%)</Typography>
          <Slider
            value={[filters.minThc, filters.maxThc]}
            onChange={(e, newValue) => {
              const newFilters = {
                ...filters,
                minThc: newValue[0],
                maxThc: newValue[1]
              };
              setFilters(newFilters);
              onFilterChange(newFilters);
            }}
            valueLabelDisplay="auto"
            min={0}
            max={30}
          />
        </Grid>
        <Grid item xs={12} sm={2}>
          <TextField
            fullWidth
            label="Search"
            value={filters.search}
            onChange={handleChange('search')}
          />
        </Grid>
      </Grid>
    </Box>
  );
}

// Strain card component
function StrainCard({ strain, onNavigate }) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <StyledStrainCard>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Typography variant="h6" gutterBottom>{strain.name}</Typography>
        <Typography color="textSecondary" gutterBottom>
          {strain.type} {strain.thc && `• ${strain.thc}% THC`} {strain.cbd && `• ${strain.cbd}% CBD`}
        </Typography>
        
        {strain.description && (
          <Typography variant="body2" sx={{ mb: 2 }}>
            {expanded ? strain.description : `${strain.description.slice(0, 150)}${strain.description.length > 150 ? '...' : ''}`}
            {strain.description.length > 150 && (
              <Button size="small" onClick={() => setExpanded(!expanded)} sx={{ ml: 1 }}>
                {expanded ? 'Less' : 'More'}
              </Button>
            )}
          </Typography>
        )}

        {strain.effects?.length > 0 && (
          <Box sx={{ mb: 1 }}>
            <Typography variant="caption" color="text.secondary">Effects:</Typography>
            <Box>
              {strain.effects.slice(0, 5).map(effect => (
                <EffectChip key={effect} label={effect} size="small" />
              ))}
            </Box>
          </Box>
        )}

        {strain.flavors?.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary">Flavors:</Typography>
            <Box>
              {strain.flavors.slice(0, 5).map(flavor => (
                <FlavorChip key={flavor} label={flavor} size="small" />
              ))}
            </Box>
          </Box>
        )}

        <Box sx={{ mt: 'auto', pt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button size="small" variant="outlined" onClick={() => onNavigate?.('seeds')} fullWidth>
            🌱 Find Seeds
          </Button>
          <Button size="small" variant="outlined" onClick={() => onNavigate?.('growers')} fullWidth>
            👨‍🌾 Find Growers
          </Button>
          <Button size="small" variant="outlined" onClick={() => onNavigate?.('dispensaries')} fullWidth>
            🏪 Find Dispensaries
          </Button>
        </Box>
      </CardContent>
    </StyledStrainCard>
  );
}

// Main strain browser
export default function StrainBrowser({ onNavigate }) {
  const [strains, setStrains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({});
  
  const loadStrains = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: 20,
        ...filters
      });
      const response = await fetch(`${API}/strains?${params}`);
      const data = await response.json();
      setStrains(data.strains || []);
      setTotalPages(data.pages || 1);
    } catch (e) {
      console.error('Error loading strains:', e);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    loadStrains();
  }, [loadStrains]);

  return (
    <Container 
      maxWidth="lg" 
      sx={{ 
        py: 4,
        minHeight: '100vh',
        background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.05) 0%, rgba(139, 195, 74, 0.05) 100%)'
      }}
    >
      {/* Back Button */}
      {onNavigate && (
        <Box sx={{ mb: 2 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => onNavigate('home')}
            sx={{ 
              textTransform: 'none', 
              fontWeight: 600,
              background: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(10px)',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.9)'
              }
            }}
          >
            Home
          </Button>
        </Box>
      )}
      
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        🌿 Browse Strain Database
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3, background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(5px)', p: 2, borderRadius: 2 }}>
        Explore our library of cannabis strains and find seeds, growers, and dispensaries.
      </Typography>

      <StrainFilters onFilterChange={setFilters} />

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : strains.length === 0 ? (
        <Box textAlign="center" p={4}>
          <Typography variant="h6" color="text.secondary">
            No strains found. Try adjusting your filters.
          </Typography>
        </Box>
      ) : (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Showing {strains.length} strains (Page {page} of {totalPages})
          </Typography>
          <Grid container spacing={3}>
            {strains.map(strain => (
              <Grid key={strain.slug} item xs={12} sm={6} md={4}>
                <StrainCard strain={strain} onNavigate={onNavigate} />
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" alignItems="center" mt={4} gap={2}>
          <Button
            variant="outlined"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            Previous
          </Button>
          <Typography>Page {page} of {totalPages}</Typography>
          <Button
            variant="outlined"
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </Button>
        </Box>
      )}
    </Container>
  );
}