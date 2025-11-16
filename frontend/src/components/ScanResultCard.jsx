import {
  Card,
  CardContent,
  Typography,
  Chip,
  Stack,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  Box
} from '@mui/material';

function CandidateList({ candidates = [], onViewStrain }) {
  if (!candidates.length) return null;
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
        Other possible matches
      </Typography>
      <List dense>
        {candidates.map((candidate) => (
          <ListItem
            key={candidate.strain_slug || candidate.name}
            secondaryAction={
              <Button
                size="small"
                variant="outlined"
                onClick={() => onViewStrain?.(candidate)}
              >
                View strain
              </Button>
            }
          >
            <ListItemText
              primary={candidate.name}
              secondary={`Confidence ${candidate.confidence ?? 0}% • ${candidate.type || 'Unknown type'}`}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}

export default function ScanResultCard({
  result,
  onSaveMatch,
  onLogExperience,
  onReportMismatch,
  onViewStrain
}) {
  if (!result?.match) {
    return (
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6">No clear match found</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            We couldn’t confidently match this photo to a known strain. Try another angle or add a note to your grow log so we can keep improving the model.
          </Typography>
          <Button sx={{ mt: 2 }} variant="outlined" onClick={onReportMismatch}>
            Report issue
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { match, candidates = [] } = result;

  return (
    <Card sx={{ mt: 3 }}>
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="overline" color="text.secondary">
            Top match
          </Typography>
          <Chip
            label={`${match.confidence ?? 0}% confidence`}
            size="small"
            color={match.confidence >= 70 ? 'success' : match.confidence >= 40 ? 'warning' : 'default'}
          />
        </Stack>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {match.name}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
          {match.type || 'Unknown type'}
        </Typography>

        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mb: 2 }}>
          {(match.effects || []).slice(0, 4).map((effect) => (
            <Chip key={effect} label={effect} size="small" variant="outlined" />
          ))}
        </Stack>

        {match.description && (
          <Typography variant="body2" sx={{ mb: 2 }}>
            {match.description.slice(0, 220)}
            {match.description.length > 220 ? '…' : ''}
          </Typography>
        )}

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button variant="contained" onClick={onSaveMatch}>
            Save this match
          </Button>
          <Button variant="outlined" onClick={onLogExperience}>
            Log experience
          </Button>
          <Button color="secondary" onClick={onReportMismatch}>
            Report mismatch
          </Button>
        </Stack>

        <Divider sx={{ my: 3 }} />

        <CandidateList candidates={candidates} onViewStrain={onViewStrain} />
      </CardContent>
    </Card>
  );
}


