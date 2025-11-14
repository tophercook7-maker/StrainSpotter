import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  Checkbox,
  FormControlLabel,
  Alert,
  Stack
} from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import { useOnboardingStatus } from '../hooks/useOnboardingStatus';
import { supabase } from '../supabaseClient';
import { API_BASE } from '../config';

const personas = [
  { value: 'enthusiast', label: 'Enthusiast', description: 'I explore strains, dispensaries, and community content.' },
  { value: 'grower', label: 'Grower', description: 'I cultivate, test, and share knowledge with others.' },
  { value: 'operator', label: 'Business', description: 'I run a dispensary, delivery service, or cannabis brand.' }
];

export default function OnboardingFlow() {
  const { user } = useAuth();
  const { onboardingRequired, loading, profile, refresh, needsDisplayName, needsPersona, needsRole, error } = useOnboardingStatus();
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState('');
  const [persona, setPersona] = useState('');
  const [notifications, setNotifications] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      const personaTag = profile.profile_tags?.find(tag => tag.startsWith('persona:'));
      setPersona(personaTag ? personaTag.replace('persona:', '') : '');
      setNotifications(profile.profile_tags?.some(tag => tag.startsWith('notify:')) || false);
    }
  }, [profile]);

  const steps = useMemo(() => [
    { label: 'Profile', description: 'Set your public name so others recognize you.' },
    { label: 'Role', description: 'Tell us how you use StrainSpotter.' },
    { label: 'Preferences', description: 'Stay in the loop with community updates.' }
  ], []);

  const open = Boolean(user && onboardingRequired);

  const canContinueProfile = displayName.trim().length >= 2;
  const canContinuePersona = Boolean(persona);

  const handleSubmit = async () => {
    if (!supabase || !user) return;
    setSaving(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Session expired. Please sign in again.');
      }
      const response = await fetch(`${API_BASE}/api/users/onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          display_name: displayName.trim(),
          role: persona === 'grower' ? 'grower' : persona === 'operator' ? 'operator' : 'member',
          persona,
          notifications
        })
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to save onboarding data');
      }
      setSubmitSuccess(true);
      await refresh();
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('[OnboardingFlow] Submit failed:', err);
      setSubmitError(err.message || 'Failed to complete onboarding');
    } finally {
      setSaving(false);
    }
  };

  const showStepper = needsDisplayName || needsPersona || needsRole;

  if (!open) return null;

  return (
    <Dialog open fullScreen PaperProps={{ sx: { background: '#041204', color: '#fff' } }}>
      <DialogTitle sx={{ textAlign: 'center', fontWeight: 700, color: '#CDDC39', pt: 4 }}>
        Welcome to StrainSpotter
      </DialogTitle>
      <DialogContent
        sx={{
          maxWidth: 520,
          mx: 'auto',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          pt: 1,
          pb: 6
        }}
      >
        <Box
          sx={{
            overflowY: 'auto',
            pr: 1,
            flex: 1,
            '&::-webkit-scrollbar': { width: 6 },
            '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.2)', borderRadius: 999 }
          }}
        >
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {showStepper && (
          <Box sx={{ mb: 3 }}>
            <Stepper activeStep={step} alternativeLabel>
              {steps.map((item) => (
                <Step key={item.label}>
                  <StepLabel>{item.label}</StepLabel>
                </Step>
              ))}
            </Stepper>
            <Typography variant="body2" sx={{ mt: 1, textAlign: 'center', color: '#ccc' }}>
              {steps[step]?.description}
            </Typography>
          </Box>
        )}

        {/* Step 0: Display Name */}
        {step === 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>
              How should the community address you?
            </Typography>
            <TextField
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              label="Display Name"
              fullWidth
              autoFocus
              inputProps={{ maxLength: 60 }}
              helperText="Shown in chats, groups, and grower directory."
              sx={{
                '& .MuiOutlinedInput-root': { color: '#fff' },
                '& .MuiInputLabel-root': { color: '#bbb' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' }
              }}
            />
          </Box>
        )}

        {/* Step 1: Persona */}
        {step === 1 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>
              Choose your primary role
            </Typography>
            <ToggleButtonGroup
              exclusive
              fullWidth
              color="success"
              value={persona}
              onChange={(_e, next) => next && setPersona(next)}
              orientation="vertical"
            >
              {personas.map((p) => (
                <ToggleButton
                  key={p.value}
                  value={p.value}
                  sx={{
                    mb: 1,
                    textTransform: 'none',
                    justifyContent: 'flex-start',
                    borderRadius: 2,
                    bgcolor: persona === p.value ? 'rgba(124,179,66,0.25)' : 'rgba(255,255,255,0.05)'
                  }}
                >
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {p.label}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#ccc' }}>
                      {p.description}
                    </Typography>
                  </Box>
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>
        )}

        {/* Step 2: Notifications */}
        {step === 2 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>
              Stay in the loop?
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: '#ccc' }}>
              Receive occasional emails about new groups, grower spotlights, and product updates. You can change this anytime in settings.
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                  sx={{ color: '#CDDC39' }}
                />
              }
              label="Yes, send me StrainSpotter updates"
            />
          </Box>
        )}

        {submitError && (
          <Alert severity="error" sx={{ mt: 3 }}>
            {submitError}
          </Alert>
        )}
        {submitSuccess && (
          <Alert severity="success" sx={{ mt: 3 }}>
            Profile updated! You’re all set.
          </Alert>
        )}

        </Box>
        <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
          {step > 0 && (
            <Button
              variant="outlined"
              onClick={() => setStep((prev) => Math.max(prev - 1, 0))}
              sx={{ flex: 1 }}
            >
              Back
            </Button>
          )}
          {step < steps.length - 1 && (
            <Button
              variant="contained"
              disabled={
                saving ||
                (step === 0 && !canContinueProfile) ||
                (step === 1 && !canContinuePersona)
              }
              onClick={() => setStep((prev) => Math.min(prev + 1, steps.length - 1))}
              sx={{ flex: 1, bgcolor: '#7CB342', color: '#fff', '&:hover': { bgcolor: '#8bc34a' } }}
            >
              Continue
            </Button>
          )}
          {step === steps.length - 1 && (
            <Button
              variant="contained"
              disabled={saving || !canContinueProfile || !canContinuePersona}
              onClick={handleSubmit}
              sx={{ flex: 1, bgcolor: '#7CB342', color: '#fff', '&:hover': { bgcolor: '#8bc34a' } }}
            >
              {saving ? 'Saving…' : 'Finish'}
            </Button>
          )}
        </Stack>
        {!loading && !onboardingRequired && (
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Button onClick={() => setStep(0)} size="small" sx={{ color: '#ccc' }}>
              Revisit onboarding
            </Button>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

