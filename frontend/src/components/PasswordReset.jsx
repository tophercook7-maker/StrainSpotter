import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Box, Card, CardContent, TextField, Button, Typography, Stack, Alert, CircularProgress } from '@mui/material';

export default function PasswordReset() {
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // When arriving from password recovery link, Supabase sets a session from the hash token
    // We just need to render the form to set a new password
    (async () => {
      try {
        const session = await supabase?.auth.getSession();
        if (session?.data?.session) {
          setReady(true);
          setInfo('Enter a new password below to complete the reset.');
        } else {
          setError('Recovery link is invalid or expired. Please request a new reset email from the Sign In screen.');
        }
      } catch {
        setError('Unable to validate session.');
      }
    })();
  }, []);

  async function updatePassword() {
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError(null);
    setInfo(null);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (error) setError(error.message);
    else setInfo('Password updated. You can now sign in with your new password.');
  }

  return (
    <Box sx={{ maxWidth: 420, mx: 'auto', py: 4 }}>
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h5">Reset Password</Typography>
            {info && <Alert severity="info">{info}</Alert>}
            {error && <Alert severity="error">{error}</Alert>}
            {ready ? (
              <>
                <TextField label="New Password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} fullWidth />
                <TextField label="Confirm Password" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} fullWidth />
                <Button variant="contained" onClick={updatePassword} disabled={loading}>
                  {loading ? <CircularProgress size={20} /> : 'Update Password'}
                </Button>
              </>
            ) : (
              <Typography variant="body2">Verifying link…</Typography>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
