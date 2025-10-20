import { useState } from 'react';
import { Box, Button, TextField, Typography, Card, CardContent, Alert, CircularProgress } from '@mui/material';
import { API_BASE } from '../config';

export default function VisionDiagnostic() {
  const [base64, setBase64] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64String = String(reader.result).split(',')[1];
      setBase64(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleTest = async () => {
    if (!base64) {
      setError('Please select an image first');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`${API_BASE}/api/diagnostic/vision-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64 })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `HTTP ${res.status}`);
      } else {
        setResult(data);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" sx={{ mb: 3 }}>🔬 Vision API Diagnostic</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Upload an image to see what Google Vision API detects.
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ marginBottom: 16 }}
          />
          <Button
            variant="contained"
            onClick={handleTest}
            disabled={loading || !base64}
            fullWidth
          >
            {loading ? <CircularProgress size={24} /> : 'Test Vision API'}
          </Button>
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {result && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>✅ Detection Results</Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="primary">Full Text Detected:</Typography>
              <TextField
                multiline
                fullWidth
                value={result.fullText || '(no text detected)'}
                sx={{ mt: 1, fontFamily: 'monospace', fontSize: '0.9rem' }}
                InputProps={{ readOnly: true }}
                rows={6}
              />
              <Typography variant="caption" color="text.secondary">
                Length: {result.textLength} characters
              </Typography>
            </Box>

            {result.labels && result.labels.length > 0 && (
              <Box>
                <Typography variant="subtitle2" color="primary" gutterBottom>Top Labels:</Typography>
                {result.labels.map((label, i) => (
                  <Typography key={i} variant="body2" sx={{ fontFamily: 'monospace' }}>
                    • {label.description} ({Math.round(label.score * 100)}%)
                  </Typography>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
