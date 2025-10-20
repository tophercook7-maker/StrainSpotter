import { useState, useRef } from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  AppBar,
  Toolbar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  Chip,
  Stack,
  Divider,
  Grid
} from '@mui/material';
import { CameraAlt, History, Close } from '@mui/icons-material';
import { API_BASE } from '../config';

// Simple cannabis leaf SVG icon
function LeafIcon(props) {
  return (
    <Box component="svg" width={28} height={28} viewBox="0 0 64 64" fill="none" sx={{ color: '#4caf50' }} {...props}>
      <path
        d="M32 6c2.8 8.2 9.6 14 18 16-8.4 2-15.2 7.8-18 16-2.8-8.2-9.6-14-18-16 8.4-2 15.2-7.8 18-16ZM32 44c-3.5-6.5-9.9-10.7-18-12 4 5.3 7.1 11.1 8.5 17.3 3.1 1.5 6.2 2.7 9.5 3.7v-9ZM32 44c3.5-6.5 9.9-10.7 18-12-4 5.3-7.1 11.1-8.5 17.3-3.1 1.5-6.2 2.7-9.5 3.7v-9Z"
        fill="currentColor"
      />
    </Box>
  );
}

// API base now comes from config

function Scanner({ onViewHistory }) {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [matchedStrain, setMatchedStrain] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageCapture = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImage(file);
    setImagePreview(URL.createObjectURL(file));
    setError(null);
  };

  // Function to match detected text with strain names
  const findMatchingStrain = async (detectedText) => {
    if (!detectedText) return null;

    try {
      // Try exact match first using search
      const searchResponse = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(detectedText)}&limit=5`);
      const searchResults = await searchResponse.json();
      
      if (searchResults && searchResults.length > 0) {
        // Get full details of first match
        const strainResponse = await fetch(`${API_BASE}/api/strains/${searchResults[0].slug}`);
        if (strainResponse.ok) {
          return await strainResponse.json();
        }
      }

      // If no exact match, try word by word
      const words = detectedText.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      for (const word of words) {
        const wordResponse = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(word)}&limit=1`);
        const wordResults = await wordResponse.json();
        if (wordResults && wordResults.length > 0) {
          const strainResponse = await fetch(`${API_BASE}/api/strains/${wordResults[0].slug}`);
          if (strainResponse.ok) {
            return await strainResponse.json();
          }
        }
      }
    } catch (err) {
      console.error('Error matching strain:', err);
    }
    
    return null;
  };

  // Helper: compress and convert image file to base64
  const fileToBase64Resized = (file, maxDim = 1600, quality = 0.85) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);
            const reader = new FileReader();
            reader.onload = () => {
              const base64 = String(reader.result).split(',')[1];
              resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob || file);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = (e) => {
        URL.revokeObjectURL(url);
        reject(e);
      };
      img.src = url;
    });

  const parseErrorResponse = async (res) => {
    try {
      const data = await res.json();
      return data?.error || `HTTP ${res.status}`;
  } catch {
      try {
        const text = await res.text();
        return text || `HTTP ${res.status}`;
      } catch {
        return `HTTP ${res.status}`;
      }
    }
  };

  const handleScan = async () => {
    if (!image) {
      setError('Please select an image first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Convert image to compressed base64 (reduces upload failures)
      const base64 = await fileToBase64Resized(image, 1600, 0.85);

      // Step 1: Upload image
      const uploadResponse = await fetch(`${API_BASE}/api/uploads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: image.name,
          contentType: image.type,
          base64: base64
        })
      });

      if (!uploadResponse.ok) {
        const msg = await parseErrorResponse(uploadResponse);
        throw new Error(`Upload failed: ${msg}`);
      }

      const uploadData = await uploadResponse.json();
      const scanId = uploadData.id;

      // Step 2: Process with Google Vision
      const processResponse = await fetch(`${API_BASE}/api/scans/${scanId}/process`, {
        method: 'POST'
      });

      if (!processResponse.ok) {
        const msg = await parseErrorResponse(processResponse);
        throw new Error(`Processing failed: ${msg}`);
      }

      const processData = await processResponse.json();
      const detectedText = processData.result?.textAnnotations?.[0]?.description || '';

      // Step 3: Match with strain database
      const strain = await findMatchingStrain(detectedText);

      if (strain) {
        setMatchedStrain(strain);
      } else {
        setError('No matching strain found. Try a clearer image of the label or packaging.');
      }

      setShowResult(true);

    } catch (err) {
      setError(err.message || 'Scan failed. Please try again.');
      console.error('Scan error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setImage(null);
    setImagePreview(null);
    setMatchedStrain(null);
    setShowResult(false);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* App Bar removed - using global TopNav */}

      <Container maxWidth="sm" sx={{ py: 4 }}>
        {/* Hero Card */}
        <Card 
          sx={{ 
            mb: 3,
            overflow: 'hidden',
            border: '2px solid #4caf50',
            bgcolor: 'transparent'
          }}
        >
          <Box sx={{ position: 'relative', height: 220 }}>
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                backgroundImage: 'url(/hero.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'saturate(1.1)'
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0.7) 100%)'
              }}
            />
          </Box>
          <CardContent sx={{ background: 'linear-gradient(135deg, #2d5a2d 0%, #1f3a1f 100%)' }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <LeafIcon />
              <Typography variant="h4" fontWeight="bold" color="primary.light">
                Identify Your Strain
              </Typography>
            </Stack>
            <Typography variant="body1" color="text.secondary">
              Snap a photo of your cannabis product, bud, or packaging label and let AI identify the exact strain with complete info.
            </Typography>
          </CardContent>
        </Card>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Image Preview */}
        {imagePreview && (
          <Card sx={{ mb: 3 }}>
            <Box
              component="img"
              src={imagePreview}
              alt="Preview"
              sx={{
                width: '100%',
                maxHeight: 500,
                objectFit: 'contain',
                bgcolor: 'black'
              }}
            />
          </Card>
        )}

        {/* Action Buttons */}
        <Stack spacing={2}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={handleImageCapture}
          />
          
          {!imagePreview ? (
            <Button
              variant="contained"
              size="large"
              fullWidth
              startIcon={<CameraAlt />}
              onClick={() => fileInputRef.current?.click()}
              sx={{ 
                py: 3,
                fontSize: '1.2rem',
                background: 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #388e3c 30%, #4caf50 90%)',
                }
              }}
            >
              📸 Take or Upload Photo
            </Button>
          ) : (
            <>
              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handleScan}
                disabled={loading}
                sx={{ 
                  py: 3,
                  fontSize: '1.1rem',
                  background: 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)',
                }}
              >
                {loading ? (
                  <><CircularProgress size={24} color="inherit" sx={{ mr: 1 }} /> Scanning...</>
                ) : (
                  '🔬 Scan & Identify Strain'
                )}
              </Button>
              
              <Button
                variant="outlined"
                size="large"
                fullWidth
                onClick={handleReset}
                disabled={loading}
                sx={{ borderColor: '#4caf50', color: '#4caf50' }}
              >
                Take Another Photo
              </Button>
            </>
          )}
        </Stack>

        {/* How it Works */}
        {!imagePreview && (
          <Card sx={{ mt: 4, bgcolor: 'background.paper' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary.light">
                📋 How It Works
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body1" fontWeight="bold" color="text.primary">
                    1. Capture Clear Image
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Take a photo of the bud, packaging, or label with good lighting
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body1" fontWeight="bold" color="text.primary">
                    2. AI Analysis
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Google Vision AI reads text and analyzes visual characteristics
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body1" fontWeight="bold" color="text.primary">
                    3. Strain Match
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Get exact strain info: THC/CBD%, effects, flavors, and more
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        )}
      </Container>

      {/* Results Dialog */}
      <Dialog 
        open={showResult} 
        onClose={() => setShowResult(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, #2c2c2c 0%, #1f3a1f 100%)',
            border: '2px solid #4caf50'
          }
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid #4caf50' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={1} alignItems="center">
              <LeafIcon />
              <Typography variant="h5" fontWeight="bold" color="primary.light">
                Strain Identified
              </Typography>
            </Stack>
            <IconButton onClick={() => setShowResult(false)} sx={{ color: '#4caf50' }}>
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {matchedStrain ? (
            <>
              {/* Strain Name */}
              <Typography variant="h4" gutterBottom fontWeight="bold" color="primary.main">
                {matchedStrain.name}
              </Typography>

              {/* Type Badge */}
              {matchedStrain.type && (
                <Chip
                  label={matchedStrain.type}
                  size="large"
                  sx={{
                    mb: 2,
                    bgcolor: matchedStrain.type === 'Indica' ? '#7b1fa2' :
                             matchedStrain.type === 'Sativa' ? '#f57c00' : '#00897b',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '1rem'
                  }}
                />
              )}

              {/* Description */}
              {matchedStrain.description && (
                <Typography variant="body1" paragraph color="text.primary" sx={{ my: 2 }}>
                  {matchedStrain.description}
                </Typography>
              )}

              <Divider sx={{ my: 2, bgcolor: 'rgba(76, 175, 80, 0.3)' }} />

              {/* THC/CBD Info */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                {matchedStrain.thc !== null && matchedStrain.thc > 0 && (
                  <Grid item xs={6}>
                    <Card sx={{ bgcolor: 'rgba(76, 175, 80, 0.1)', border: '1px solid #4caf50' }}>
                      <CardContent>
                        <Typography variant="caption" color="text.secondary">THC Content</Typography>
                        <Typography variant="h4" fontWeight="bold" color="primary.main">
                          {matchedStrain.thc}%
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
                {matchedStrain.cbd !== null && matchedStrain.cbd > 0 && (
                  <Grid item xs={6}>
                    <Card sx={{ bgcolor: 'rgba(76, 175, 80, 0.1)', border: '1px solid #4caf50' }}>
                      <CardContent>
                        <Typography variant="caption" color="text.secondary">CBD Content</Typography>
                        <Typography variant="h4" fontWeight="bold" color="primary.main">
                          {matchedStrain.cbd}%
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>

              {/* Effects */}
              {matchedStrain.effects && matchedStrain.effects.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" gutterBottom color="primary.light">
                    Effects
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {matchedStrain.effects.map((effect, idx) => (
                      <Chip 
                        key={idx} 
                        label={effect}
                        sx={{ 
                          bgcolor: 'rgba(139, 195, 74, 0.2)', 
                          color: '#8bc34a',
                          border: '1px solid #8bc34a'
                        }}
                      />
                    ))}
                  </Stack>
                </Box>
              )}

              {/* Flavors/Terpenes */}
              {matchedStrain.flavors && matchedStrain.flavors.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" gutterBottom color="primary.light">
                    Flavors & Terpenes
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {matchedStrain.flavors.map((flavor, idx) => (
                      <Chip 
                        key={idx} 
                        label={flavor}
                        variant="outlined"
                        sx={{ borderColor: '#66bb6a', color: '#66bb6a' }}
                      />
                    ))}
                  </Stack>
                </Box>
              )}

              {/* Lineage */}
              {matchedStrain.lineage && matchedStrain.lineage.length > 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom color="primary.light">
                    Genetics
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {matchedStrain.lineage.join(' × ')}
                  </Typography>
                </Box>
              )}

              <Button
                variant="contained"
                fullWidth
                onClick={handleReset}
                sx={{ 
                  mt: 3,
                  py: 1.5,
                  background: 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)',
                }}
              >
                Scan Another Strain
              </Button>
            </>
          ) : (
            <Alert severity="info">
              No strain match found. The image may not contain readable strain information.
            </Alert>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default Scanner;
