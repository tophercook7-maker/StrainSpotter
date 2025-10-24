import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  FormControlLabel,
  Checkbox,
  Stack,
  Box,
  Alert
} from '@mui/material';
import { supabase } from '../supabaseClient';

const GUIDELINES_KEY = 'ss_guidelines_accepted';

export default function GuidelinesGate({ children }) {
  const [userId, setUserId] = useState(null);
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let sub;
    (async () => {
      try {
        if (!supabase) {
          setLoading(false);
          return;
        }
        const { data } = await supabase.auth.getSession();
        const user = data?.session?.user;
        setUserId(user?.id || null);

        if (user) {
          // Check if this user has accepted guidelines
          const key = `${GUIDELINES_KEY}_${user.id}`;
          const accepted = localStorage.getItem(key);
          if (accepted !== 'true') {
            setOpen(true);
          }
        }
      } catch (e) {
        console.debug('GuidelinesGate: getSession failed', e);
      } finally {
        setLoading(false);
      }
    })();

    if (supabase) {
      const listener = supabase.auth.onAuthStateChange((_e, session) => {
        const user = session?.user;
        setUserId(user?.id || null);
        
        if (user) {
          const key = `${GUIDELINES_KEY}_${user.id}`;
          const accepted = localStorage.getItem(key);
          if (accepted !== 'true') {
            setOpen(true);
          }
        } else {
          setOpen(false);
        }
      });
      sub = listener?.data?.subscription;
    }

    return () => sub?.unsubscribe?.();
  }, []);

  const handleAccept = () => {
    if (userId) {
      const key = `${GUIDELINES_KEY}_${userId}`;
      localStorage.setItem(key, 'true');
      setOpen(false);
    }
  };

  if (loading) {
    return null; // Or a loading spinner if you prefer
  }

  return (
    <>
      {children}
      <Dialog 
        open={open} 
        disableEscapeKeyDown
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Welcome to StrainSpotter</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Alert severity="info">
              Before you start, please review and accept our Community Guidelines.
            </Alert>
            
            <Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Community Guidelines
              </Typography>
              <Stack spacing={2} sx={{ mt: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="primary.light" sx={{ fontWeight: 600 }}>
                    ✓ Be Respectful
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Treat everyone with respect. No harassment, hate speech, or personal attacks.
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="primary.light" sx={{ fontWeight: 600 }}>
                    ✓ No Solicitations
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Do not sell, buy, trade, or solicit cannabis or any products. StrainSpotter is for information and community only.
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="primary.light" sx={{ fontWeight: 600 }}>
                    ✓ Privacy Matters
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Never share personal contact information (phone numbers, addresses, social media) in public spaces.
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="primary.light" sx={{ fontWeight: 600 }}>
                    ✓ Follow Local Laws
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    You are responsible for knowing and following all local, state, and federal laws regarding cannabis.
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="primary.light" sx={{ fontWeight: 600 }}>
                    ✓ Report Issues
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Use the report feature if you see content that violates these guidelines.
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <FormControlLabel
              control={
                <Checkbox 
                  checked={checked} 
                  onChange={(e) => setChecked(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Typography variant="body2">
                  I have read and agree to follow the Community Guidelines
                </Typography>
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={handleAccept}
            variant="contained"
            disabled={!checked}
            fullWidth
            size="large"
          >
            Accept & Continue
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
