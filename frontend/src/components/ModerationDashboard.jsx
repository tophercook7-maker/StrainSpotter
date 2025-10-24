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
  Tooltip
} from '@mui/material';
import { API_BASE } from '../config';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningIcon from '@mui/icons-material/Warning';

export default function ModerationDashboard({ onBack }) {
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [moderatorNotes, setModeratorNotes] = useState('');
  const [actionType, setActionType] = useState('approve');
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [reportsRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/api/moderation/reports?status=pending`),
        fetch(`${API_BASE}/api/moderation/stats`)
      ]);
      
      if (reportsRes.ok) {
        const reportsData = await reportsRes.json();
        setReports(reportsData.reports || []);
      }
      
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
        headers: { 'Content-Type': 'application/json' },
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

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <LinearProgress />
      </Container>
    );
  }

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
            Pending Reports
          </Typography>
          
          {reports.length === 0 ? (
            <Alert severity="info">No pending reports. Great job!</Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Report ID</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Message Content</TableCell>
                    <TableCell>Reported</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reports.map((report) => (
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
