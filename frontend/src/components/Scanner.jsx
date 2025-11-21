import { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Paper,
  Stack,
} from '@mui/material';
import CannabisLeafIcon from './CannabisLeafIcon';
import { API_BASE } from '../config';
import { useMembership } from '../membership/MembershipContext';

export default function Scanner({ onViewHistory }) {
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const {
    isMember,
    starterRemaining,
    memberRemaining,
    memberCap,
    extraCredits,
    totalAvailableScans,
    starterCap,
    registerScanConsumed,
    requestMembershipPurchase,
    requestTopupPurchase,
  } = useMembership();

  // Now everyone depends on totalAvailableScans, including members.
  const canScan = totalAvailableScans > 0;
  const lowCredits = totalAvailableScans > 0 && totalAvailableScans <= 5;

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!canScan) {
      setError(
        `You're out of scans. Members get ${memberCap} scans included; you can also top up scan packs any time.`
      );
      return;
    }

    setError('');
    setResult(null);
    setUploading(true);
    setProcessing(false);

    try {
      const reader = new FileReader();
      const filePromise = new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Failed to read file'));
      });
      reader.readAsDataURL(file);

      const dataUrl = await filePromise;
      const base64 = String(dataUrl).split(',')[1];

      // Upload image
      const uploadRes = await fetch(`${API_BASE}/api/uploads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64, filename: file.name }),
      });

      if (!uploadRes.ok) {
        const body = await uploadRes.json().catch(() => ({}));
        throw new Error(body.error || 'Upload failed');
      }

      const uploadData = await uploadRes.json();
      const scanId = uploadData.id;

      setUploading(false);
      setProcessing(true);

      // Process scan
      const processRes = await fetch(
        `${API_BASE}/api/scans/${scanId}/process`,
        {
          method: 'POST',
        }
      );

      if (!processRes.ok) {
        const body = await processRes.json().catch(() => ({}));
        throw new Error(body.error || 'Processing failed');
      }

      const processData = await processRes.json();
      setResult(processData);

      // ✅ Count only successful scans for everyone
      registerScanConsumed();
      setProcessing(false);
    } catch (err) {
      console.error('[Scanner] Error during scan', err);
      setError(err.message || 'Scan failed. Please try again.');
      setUploading(false);
      setProcessing(false);
    }
  };

  const handleScanClick = () => {
    if (!canScan) {
      setError(
        `You're out of scans. Members get ${memberCap} scans included; you can also top up scan packs any time.`
      );
      return;
    }
    const input = document.getElementById('scanner-file-input');
    if (input) {
      input.click();
    }
  };

  const isBusy = uploading || processing;

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Paper
        elevation={6}
        sx={{
          p: 3,
          borderRadius: 3,
          background:
            'radial-gradient(circle at top, rgba(76,175,80,0.18), rgba(12,20,12,0.98))',
          border: '1px solid rgba(134, 239, 172, 0.5)',
        }}
      >
        {/* Header + membership / credits summary */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            mb: 2,
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <CannabisLeafIcon sx={{ fontSize: 32, color: '#4caf50' }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Strain Scanner
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: 'rgba(255,255,255,0.65)' }}
              >
                Snap a label or package to spot the strain.
              </Typography>
            </Box>
          </Box>

          <Box sx={{ textAlign: 'right', minWidth: 160 }}>
            {isMember ? (
              <>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'rgba(163, 230, 186, 0.9)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  Member
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(255,255,255,0.9)',
                    fontWeight: 500,
                  }}
                >
                  Included scans: {memberCap - memberRemaining}/{memberCap}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: 'rgba(190, 242, 100, 0.9)' }}
                >
                  Scans left: {totalAvailableScans}
                  {extraCredits > 0 ? ' (with top-ups)' : ''}
                </Typography>
              </>
            ) : (
              <>
                <Typography
                  variant="caption"
                  sx={{ color: 'rgba(248, 250, 252, 0.7)' }}
                >
                  Starter scans used:{' '}
                  <strong>{starterCap - starterRemaining}</strong> / {starterCap}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    mt: 0.25,
                    color:
                      totalAvailableScans === 0
                        ? '#fecaca'
                        : totalAvailableScans <= 5
                        ? '#fde68a'
                        : '#bbf7d0',
                    fontWeight: 600,
                  }}
                >
                  Scans available: {totalAvailableScans}
                </Typography>
                {extraCredits > 0 && (
                  <Typography
                    variant="caption"
                    sx={{ color: 'rgba(190, 242, 100, 0.9)' }}
                  >
                    Includes {extraCredits} top-up scans
                  </Typography>
                )}
              </>
            )}
          </Box>
        </Box>

        {/* Membership + top-up CTA strip */}
        <Stack
          direction="row"
          spacing={1}
          sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
        >
          <Typography
            variant="caption"
            sx={{ color: 'rgba(255,255,255,0.55)' }}
          >
            Members get {memberCap} scans included plus Garden, Reviews, and
            Logbook access.
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              size="small"
              onClick={requestMembershipPurchase}
              sx={{
                textTransform: 'none',
                borderRadius: 999,
                borderColor: 'rgba(74, 222, 128, 0.9)',
                color: '#bbf7d0',
                px: 1.8,
                py: 0.3,
                fontSize: '0.72rem',
              }}
            >
              Go member
            </Button>
            <Button
              variant="text"
              size="small"
              onClick={() => requestTopupPurchase('pack_50')}
              sx={{
                textTransform: 'none',
                color: 'rgba(209, 250, 229, 0.9)',
                fontSize: '0.7rem',
              }}
            >
              Buy 50 scans
            </Button>
          </Stack>
        </Stack>

        {/* File input */}
        <input
          id="scanner-file-input"
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {/* Main scan button */}
        <Box sx={{ textAlign: 'center', mt: 1.5 }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleScanClick}
            disabled={isBusy || !canScan}
            sx={{
              borderRadius: 999,
              px: 4,
              py: 1.4,
              textTransform: 'none',
              fontWeight: 700,
              background: canScan
                ? 'linear-gradient(135deg, #4caf50, #8bc34a)'
                : 'linear-gradient(135deg, #6b7280, #4b5563)',
              boxShadow: canScan
                ? '0 0 16px rgba(76, 175, 80, 0.6)'
                : 'none',
            }}
          >
            {uploading && 'Uploading…'}
            {processing && !uploading && 'Processing…'}
            {!uploading &&
              !processing &&
              (canScan ? 'Take or choose photo' : 'Out of scans')}
          </Button>

          <Box sx={{ mt: 1.5 }}>
            <Button
              variant="text"
              size="small"
              onClick={onViewHistory}
              sx={{ textTransform: 'none', color: '#a7f3d0' }}
            >
              View Scan Logbook
            </Button>
          </Box>
        </Box>

        {/* Low-credits prompt (nudge just before empty) */}
        {lowCredits && (
          <Box
            sx={{
              mt: 2,
              p: 1.2,
              borderRadius: 2,
              backgroundColor: 'rgba(30, 64, 38, 0.95)',
              border: '1px solid rgba(190, 242, 100, 0.7)',
            }}
          >
            <Typography
              variant="body2"
              sx={{ color: '#e5fee0', mb: 0.5, fontWeight: 500 }}
            >
              You're running low on scans.
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'rgba(226,232,240,0.75)' }}
            >
              Go member to lock in your {memberCap}-scan pack and full app
              access, or top up a scan pack now so you never hit a hard stop.
            </Typography>
            <Stack
              direction="row"
              spacing={1}
              sx={{ mt: 0.8, flexWrap: 'wrap' }}
            >
              <Button
                size="small"
                variant="contained"
                onClick={requestMembershipPurchase}
                sx={{
                  textTransform: 'none',
                  borderRadius: 999,
                  fontSize: '0.72rem',
                  px: 1.8,
                  py: 0.2,
                  background:
                    'linear-gradient(135deg, #22c55e, #a3e635)',
                }}
              >
                Go member
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => requestTopupPurchase('pack_20')}
                sx={{
                  textTransform: 'none',
                  borderRadius: 999,
                  fontSize: '0.72rem',
                  px: 1.6,
                  py: 0.2,
                  borderColor: 'rgba(190, 242, 100, 0.85)',
                  color: '#e5fee0',
                }}
              >
                Top up 20 scans
              </Button>
            </Stack>
          </Box>
        )}

        {/* Hard stop prompt when user has no scans */}
        {!canScan && (
          <Box
            sx={{
              mt: 2,
              p: 1.2,
              borderRadius: 2,
              backgroundColor: 'rgba(69, 10, 10, 0.96)',
              border: '1px solid rgba(248, 113, 113, 0.85)',
            }}
          >
            <Typography
              variant="body2"
              sx={{ color: '#fee2e2', mb: 0.5, fontWeight: 500 }}
            >
              You're out of scans.
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'rgba(254,226,226,0.85)' }}
            >
              Become a member to get {memberCap} scans included and full
              feature access, or buy a scan pack to keep going.
            </Typography>
            <Stack
              direction="row"
              spacing={1}
              sx={{ mt: 0.8, flexWrap: 'wrap' }}
            >
              <Button
                size="small"
                variant="contained"
                onClick={requestMembershipPurchase}
                sx={{
                  textTransform: 'none',
                  borderRadius: 999,
                  fontSize: '0.72rem',
                  px: 1.8,
                  py: 0.2,
                  background:
                    'linear-gradient(135deg, #ef4444, #f97316)',
                }}
              >
                Unlock membership
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => requestTopupPurchase('pack_20')}
                sx={{
                  textTransform: 'none',
                  borderRadius: 999,
                  fontSize: '0.72rem',
                  px: 1.6,
                  py: 0.2,
                  borderColor: 'rgba(248, 250, 252, 0.8)',
                  color: '#fee2e2',
                }}
              >
                Buy scans only
              </Button>
            </Stack>
          </Box>
        )}

        {/* Error text */}
        {error && (
          <Typography
            variant="body2"
            sx={{ mt: 2, color: '#fecaca', textAlign: 'center' }}
          >
            {error}
          </Typography>
        )}

        {/* Dev / debug result block (keep or trim later) */}
        {result && (
          <Box sx={{ mt: 3 }}>
            <Typography
              variant="subtitle2"
              sx={{ mb: 1, color: 'rgba(255,255,255,0.75)' }}
            >
              Latest scan payload (dev view)
            </Typography>
            <pre
              style={{
                maxHeight: 240,
                overflow: 'auto',
                background: 'rgba(15,23,15,0.9)',
                borderRadius: 12,
                padding: 12,
                fontSize: 12,
              }}
            >
              {JSON.stringify(result, null, 2)}
            </pre>
          </Box>
        )}

        {/* Progress indicator */}
        {isBusy && (
          <Box
            sx={{
              mt: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1.5,
            }}
          >
            <CircularProgress size={20} />
            <Typography
              variant="body2"
              sx={{ color: 'rgba(255,255,255,0.75)' }}
            >
              Working your magic with Google Vision…
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
