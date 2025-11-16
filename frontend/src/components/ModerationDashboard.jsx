import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Chip,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Tabs,
  Tab
} from '@mui/material';
import { API_BASE } from '../config';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningIcon from '@mui/icons-material/Warning';
import { supabase } from '../supabaseClient';

const STATUS_TABS = [
  { value: 'pending', label: 'New' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' }
];

export default function ModerationDashboard({ onBack }) {
  const [reportsByStatus, setReportsByStatus] = useState({
    pending: [],
    in_progress: [],
    resolved: []
  });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [moderatorNotes, setModeratorNotes] = useState('');
  const [actionType, setActionType] = useState('approve');
  const [error, setError] = useState(null);
  const [activeStatus, setActiveStatus] = useState('pending');
  const [sessionToken, setSessionToken] = useState(null);
  const [accessAllowed, setAccessAllowed] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    checkAccess();
  }, []);

  useEffect(() => {
    if (accessAllowed && sessionToken) {
      loadData();
    }
  }, [accessAllowed, sessionToken]);

  const checkAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError('Sign in required to access moderation tools.');
        setAuthChecked(true);
        return;
      }

      const res = await fetch(`${API_BASE}/api/users/onboarding-status`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (!res.ok) {
        setError('Failed to verify permissions.');
        setAuthChecked(true);
        return;
      }

      const payload = await res.json();
      const role = payload?.profile?.role;
      if (role === 'admin' || role === 'moderator') {
        setAccessAllowed(true);
        setSessionToken(session.access_token);
      } else {
        setError('Moderator access required.');
      }
    } catch (e) {
      console.error('[Moderation] Access check failed:', e);
      setError('Unable to verify access.');
    } finally {
      setAuthChecked(true);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${sessionToken}` };
      const reportResponses = await Promise.all(
        STATUS_TABS.map(tab =>
          fetch(`${API_BASE}/api/moderation/reports?status=${tab.value}`, { headers })
        )
      );

      const nextReports = {};
      await Promise.all(reportResponses.map(async (resp, idx) => {
        const tab = STATUS_TABS[idx];
        if (resp.ok) {
          const data = await resp.json();
          nextReports[tab.value] = data.reports || [];
        } else {
          nextReports[tab.value] = [];
        }
      }));

      setReportsByStatus((prev) => ({ ...prev, ...nextReports }));

      const statsRes = await fetch(`${API_BASE}/api/moderation/stats`, { headers });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (e) {
      console.error('[Moderation] Load error:', e);
      setError('Failed to load moderation data');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedReport) return;
    
    try {
      setError(null);
      const res = await fetch(`${API_BASE}/api/moderation/reports/${selectedReport.id}/resolve`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          action: actionType,
          moderator_notes: moderatorNotes
        })
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to resolve report');
      }
      
      setResolveDialogOpen(false);
      setSelectedReport(null);
      setModeratorNotes('');
      loadData();
    } catch (e) {
      setError(e.message);
    }
  };

  const openResolveDialog = (report, action) => {
    setSelectedReport(report);
    setActionType(action);
    setResolveDialogOpen(true);
  };

  if (!authChecked || loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <LinearProgress />
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
          {error || 'Moderator access required to view this dashboard.'}
        </Alert>
      </Container>
    );
  }

  const currentReports = reportsByStatus[activeStatus] || [];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {onBack && (
        <Button onClick={onBack} size="small" variant="contained" sx={{ bgcolor: 'white', color: 'black', textTransform: 'none', fontWeight: 700, borderRadius: 999, mb: 1, '&:hover': { bgcolor: 'grey.100' } }}>Home</Button>
      )}
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 3 }}>
        Moderation Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Stats Overview */}
      {stats && (
        <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="h3" color="warning.main" sx={{ fontWeight: 700 }}>
                {stats.pendingReports}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending Reports
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="h3" color="success.main" sx={{ fontWeight: 700 }}>
                {stats.resolvedReports}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Resolved Reports
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="h3" color="primary.main" sx={{ fontWeight: 700 }}>
                {stats.totalMessages}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Messages
              </Typography>
            </CardContent>
          </Card>
        </Stack>
      )}

      {/* Reports Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
            Report Triage
          </Typography>
          
          <Tabs
            value={activeStatus}
            onChange={(_, value) => setActiveStatus(value)}
            sx={{ mb: 2 }}
            variant="scrollable"
            allowScrollButtonsMobile
          >
            {STATUS_TABS.map((tab) => (
              <Tab
                key={tab.value}
                value={tab.value}
                label={`${tab.label} (${reportsByStatus[tab.value]?.length || 0})`}
              />
            ))}
          </Tabs>
          
          {currentReports.length === 0 ? (
            <Alert severity="info">No reports in this queue. Great job!</Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Report ID</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Message Content</TableCell>
                    <TableCell>Reporter</TableCell>
                    <TableCell>Reported</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currentReports.map((report) => (
                    <TableRow key={report.id} hover>
                      <TableCell>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                          {report.id.slice(0, 8)}...
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={report.reason} 
                          size="small" 
                          color={report.reason === 'harassment' ? 'error' : 'warning'}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 300 }} noWrap>
                          {report.messages?.content || '(message deleted)'}
                        </Typography>
                        {report.details && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                            Details: {report.details}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {report.reported_by ? (
                          <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                            {report.reported_by.slice(0, 8)}...
                          </Typography>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            Anonymous
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(report.created_at).toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="Approve (false positive)">
                            <IconButton 
                              size="small" 
                              color="success"
                              onClick={() => openResolveDialog(report, 'approve')}
                            >
                              <CheckCircleIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Warn user">
                            <IconButton 
                              size="small" 
                              color="warning"
                              onClick={() => openResolveDialog(report, 'warn')}
                            >
                              <WarningIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Remove message">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => openResolveDialog(report, 'remove')}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Resolve Dialog */}
      <Dialog open={resolveDialogOpen} onClose={() => setResolveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Resolve Report: {actionType === 'approve' ? 'Approve' : actionType === 'warn' ? 'Warn User' : 'Remove Message'}
        </DialogTitle>
        <DialogContent>
          {selectedReport && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Message Content:
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                {selectedReport.messages?.content || '(message deleted)'}
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                Reason: {selectedReport.reason}
              </Typography>
              {selectedReport.details && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Details: {selectedReport.details}
                </Typography>
              )}
            </Box>
          )}
          
          <TextField
            label="Moderator Notes (optional)"
            multiline
            rows={3}
            fullWidth
            value={moderatorNotes}
            onChange={(e) => setModeratorNotes(e.target.value)}
            placeholder="Add any notes about this decision..."
          />
          
          {actionType === 'remove' && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              This will permanently delete the message from the database.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResolveDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleResolve} 
            variant="contained" 
            color={actionType === 'remove' ? 'error' : actionType === 'warn' ? 'warning' : 'success'}
          >
            {actionType === 'approve' ? 'Approve' : actionType === 'warn' ? 'Warn User' : 'Remove Message'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
