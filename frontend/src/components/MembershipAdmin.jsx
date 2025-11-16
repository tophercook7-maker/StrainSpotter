import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  Chip,
  Stack,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Alert
} from '@mui/material';
import { API_BASE } from '../config';
import { supabase } from '../supabaseClient';

export default function MembershipAdmin({ onBack }) {
  const [tab, setTab] = useState(0);
  const [applications, setApplications] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [approveDialog, setApproveDialog] = useState(false);
  const [approveData, setApproveData] = useState({
    payment_received: false,
    payment_amount: '',
    payment_reference: '',
    tier: 'full',
    expires_at: ''
  });
  const [sessionToken, setSessionToken] = useState(null);
  const [accessAllowed, setAccessAllowed] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAccess();
  }, []);

  useEffect(() => {
    if (accessAllowed && sessionToken) {
      loadData();
    }
  }, [tab, accessAllowed, sessionToken]);

  const checkAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError('Sign in required to view membership management.');
        setAuthChecked(true);
        return;
      }

      const res = await fetch(`${API_BASE}/api/users/onboarding-status`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (!res.ok) {
        setError('Unable to verify permissions.');
        setAuthChecked(true);
        return;
      }

      const payload = await res.json();
      if (payload?.profile?.role === 'admin') {
        setAccessAllowed(true);
        setSessionToken(session.access_token);
      } else {
        setError('Admin access required.');
      }
    } catch (e) {
      console.error('[MembershipAdmin] Access check failed:', e);
      setError('Unable to verify permissions.');
    } finally {
      setAuthChecked(true);
    }
  };

  const loadData = async () => {
    if (!sessionToken) return;
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${sessionToken}` };
      if (tab === 0) {
        const res = await fetch(`${API_BASE}/api/membership/applications`, { headers });
        if (res.ok) setApplications(await res.json().then(d => d.applications));
      } else {
        const res = await fetch(`${API_BASE}/api/membership/members`, { headers });
        if (res.ok) setMembers(await res.json().then(d => d.members));
      }
    } catch (e) {
      console.error('Failed to load:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedApp) return;

    try {
      const res = await fetch(`${API_BASE}/api/membership/applications/${selectedApp.id}/approve`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`
        },
        body: JSON.stringify(approveData)
      });

      if (res.ok) {
        setApproveDialog(false);
        setSelectedApp(null);
        loadData();
      }
    } catch (e) {
      console.error('Failed to approve:', e);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'active': return 'success';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'expired': return 'default';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  if (!authChecked || loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  if (!accessAllowed) {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        {onBack && (
          <Button onClick={onBack} size="small" variant="contained" sx={{ mb: 2 }}>
            Home
          </Button>
        )}
        <Alert severity="warning">
          {error || 'Admin access required to view membership management.'}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {onBack && (
        <Button onClick={onBack} size="small" variant="contained" sx={{ bgcolor: 'white', color: 'black', textTransform: 'none', fontWeight: 700, borderRadius: 999, mb: 1, '&:hover': { bgcolor: 'grey.100' } }}>Home</Button>
      )}
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
        Membership Management
      </Typography>

      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="Applications" />
        <Tab label="Members" />
      </Tabs>

      {tab === 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Membership Applications ({applications.length})
            </Typography>
            {loading ? (
              <Typography>Loading...</Typography>
            ) : applications.length === 0 ? (
              <Alert severity="info">No applications yet</Alert>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Submitted</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {applications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell>{app.full_name}</TableCell>
                      <TableCell>{app.email}</TableCell>
                      <TableCell>{app.phone || '-'}</TableCell>
                      <TableCell>
                        <Chip label={app.status} color={getStatusColor(app.status)} size="small" />
                      </TableCell>
                      <TableCell>{new Date(app.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {app.status === 'pending' && (
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => {
                              setSelectedApp(app);
                              setApproveDialog(true);
                            }}
                          >
                            Approve
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Active Members ({members.length})
            </Typography>
            {loading ? (
              <Typography>Loading...</Typography>
            ) : members.length === 0 ? (
              <Alert severity="info">No members yet</Alert>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Tier</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Joined</TableCell>
                    <TableCell>Expires</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>{member.full_name}</TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>
                        <Chip label={member.tier} color="primary" size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip label={member.status} color={getStatusColor(member.status)} size="small" />
                      </TableCell>
                      <TableCell>{new Date(member.joined_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {member.expires_at ? new Date(member.expires_at).toLocaleDateString() : 'Never'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={approveDialog} onClose={() => setApproveDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Approve Membership</DialogTitle>
        <DialogContent>
          {selectedApp && (
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Typography variant="body2">
                <strong>Applicant:</strong> {selectedApp.full_name} ({selectedApp.email})
              </Typography>
              <TextField
                label="Payment Amount"
                type="number"
                fullWidth
                value={approveData.payment_amount}
                onChange={(e) => setApproveData({ ...approveData, payment_amount: e.target.value })}
              />
              <TextField
                label="Payment Reference"
                fullWidth
                value={approveData.payment_reference}
                onChange={(e) => setApproveData({ ...approveData, payment_reference: e.target.value })}
              />
              <TextField
                label="Tier"
                select
                fullWidth
                value={approveData.tier}
                onChange={(e) => setApproveData({ ...approveData, tier: e.target.value })}
                SelectProps={{ native: true }}
              >
                <option value="full">Full</option>
                <option value="premium">Premium</option>
              </TextField>
              <TextField
                label="Expires At (optional)"
                type="date"
                fullWidth
                value={approveData.expires_at}
                onChange={(e) => setApproveData({ ...approveData, expires_at: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialog(false)}>Cancel</Button>
          <Button onClick={handleApprove} variant="contained">
            Approve & Create Membership
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
