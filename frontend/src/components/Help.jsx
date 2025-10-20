import { Box, Container, Typography, Card, CardContent, Stack, Button, Alert } from '@mui/material';
import CannabisLeafIcon from './CannabisLeafIcon';

export default function Help({ onNavigate }) {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} alignItems="center">
            <CannabisLeafIcon />
            <Typography variant="h4" fontWeight="bold" color="primary.light">Help & How-To</Typography>
          </Stack>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>How to get the best scan</Typography>
              <Stack spacing={1}>
                <Typography variant="body2">• Frame the whole bud (cola) inside the guide circle, avoid extreme macro.</Typography>
                <Typography variant="body2">• Use even lighting and a neutral background. Avoid glare and deep shadows.</Typography>
                <Typography variant="body2">• Take 2–3 angles of the same bud for richer features.</Typography>
                <Typography variant="body2">• If you have packaging, include the label or visible strain name.</Typography>
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Common issues and fixes</Typography>
              <Stack spacing={1}>
                <Typography variant="subtitle2">No match or low confidence</Typography>
                <Typography variant="body2">Try retaking the photo with better lighting and framing; include text if available.</Typography>
                <Typography variant="subtitle2" sx={{ mt: 1 }}>Upload error</Typography>
                <Typography variant="body2">Check your internet connection and try again. If it persists, the service may be temporarily busy.</Typography>
                <Typography variant="subtitle2" sx={{ mt: 1 }}>Stuck on processing</Typography>
                <Typography variant="body2">Close and retry the scan. If repeated, wait a minute and try again.</Typography>
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>What the app looks for</Typography>
              <Typography variant="body2" color="text.secondary">
                We analyze visual characteristics like shape, colors, and packaging text. Including a clear label or strain name
                generally yields the most accurate results.
              </Typography>
            </CardContent>
          </Card>

          <Alert severity="info">
            Questions or suggestions? Use the Feedback section to send us a message.
          </Alert>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button variant="contained" onClick={() => onNavigate?.('scanner')}>Open Scanner</Button>
            <Button variant="outlined" onClick={() => onNavigate?.('feedback')}>Open Feedback</Button>
          </Stack>

          <Typography variant="caption" color="text.secondary">
            For privacy, we don’t require login. Scans may be stored for improving the service.
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
