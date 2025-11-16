import { Card, CardContent, Stack, Typography, Button } from '@mui/material';

export default function EmptyStateCard({ title, description, actionLabel, onAction, secondaryActionLabel, onSecondaryAction, icon }) {
  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 3,
        borderColor: 'rgba(255,255,255,0.2)',
        background: 'rgba(0,0,0,0.35)',
        color: '#fff',
        textAlign: 'center',
        p: 2
      }}
    >
      <CardContent>
        <Stack spacing={2} alignItems="center">
          {icon}
          <Typography variant="h6" fontWeight={700}>
            {title}
          </Typography>
          <Typography variant="body2" color="rgba(255,255,255,0.8)">
            {description}
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            {actionLabel && (
              <Button variant="contained" color="success" onClick={onAction}>
                {actionLabel}
              </Button>
            )}
            {secondaryActionLabel && (
              <Button variant="outlined" color="inherit" onClick={onSecondaryAction}>
                {secondaryActionLabel}
              </Button>
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}


