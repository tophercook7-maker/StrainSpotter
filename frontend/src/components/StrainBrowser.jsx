import React, { useState, useEffect } from 'react';
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
  CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';

const API_BASE = 'http://localhost:5181/api';

// Styled components
const StrainCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  '&:hover': {
    boxShadow: theme.shadows[4]
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
      fetch(`${API_BASE}/types`).then(r => r.json()),
      fetch(`${API_BASE}/effects`).then(r => r.json())
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
function StrainCard({ strain }) {
  return (
    <StrainCard>
      <CardContent>
        <Typography variant="h6" gutterBottom>{strain.name}</Typography>
        <Typography color="textSecondary" gutterBottom>
          {strain.type} {strain.thc && `• ${strain.thc}% THC`}
        </Typography>
        
        {strain.description && (
          <Typography variant="body2" sx={{ mb: 2 }}>
            {strain.description.slice(0, 150)}...
          </Typography>
        )}

        {strain.effects?.length > 0 && (
          <Box sx={{ mb: 1 }}>
            {strain.effects.map(effect => (
              <EffectChip key={effect} label={effect} size="small" />
            ))}
          </Box>
        )}

        {strain.flavors?.length > 0 && (
          <Box>
            {strain.flavors.map(flavor => (
              <FlavorChip key={flavor} label={flavor} size="small" />
            ))}
          </Box>
        )}
      </CardContent>
    </StrainCard>
  );
}

// Main strain browser
export default function StrainBrowser() {
  const [strains, setStrains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({});
  
  useEffect(() => {
    loadStrains();
  }, [page, filters]);

  const loadStrains = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: 20,
        ...filters
      });
      const response = await fetch(`${API_BASE}/strains?${params}`);
      const data = await response.json();
      setStrains(data.strains);
    } catch (e) {
      console.error('Error loading strains:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Strain Library
      </Typography>

      <StrainFilters onFilterChange={setFilters} />

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {strains.map(strain => (
            <Grid key={strain.slug} item xs={12} sm={6} md={4}>
              <StrainCard strain={strain} />
            </Grid>
          ))}
        </Grid>
      )}

      <Box display="flex" justifyContent="center" mt={4}>
        <Button
          disabled={page === 1}
          onClick={() => setPage(p => p - 1)}
        >
          Previous
        </Button>
        <Box mx={2}>Page {page}</Box>
        <Button
          onClick={() => setPage(p => p + 1)}
        >
          Next
        </Button>
      </Box>
    </Container>
  );
}