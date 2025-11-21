import React, { useState } from 'react';
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

export default function Scanner(props) {
  const { onViewHistory, onBack, onNavigate } = props;
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [result, setResult] = useState(null);
  const [debugEvents, setDebugEvents] = useState([]);

  function logDebug(message) {
    const line = `[${new Date().toISOString()}] ${message}`;
    setDebugEvents(prev => [...prev, line].slice(-20));
    console.log('[Scanner]', message);
  }

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
      const msg = `You're out of scans. Members get ${memberCap} scans included; you can also top up scan packs any time.`;
      setErrorMessage(msg);
      logDebug(`ERROR: ${msg}`);
      return;
    }

    setErrorMessage('');
    setResult(null);
    setUploading(true);
    setProcessing(false);
    logDebug('Scan started');

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
        let body = null;
        try {
          body = await uploadRes.json();
        } catch {}
        const err = new Error(body?.error || `Scan server error (${uploadRes.status})`);
        err.responseJson = body;
        throw err;
      }

      const uploadData = await uploadRes.json();
      const scanId = uploadData.id;
      logDebug('Upload complete');

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
        let body = null;
        try {
          body = await processRes.json();
        } catch {}
        const err = new Error(body?.error || `Scan server error (${processRes.status})`);
        err.responseJson = body;
        throw err;
      }

      const processData = await processRes.json();
      setResult(processData);
      logDebug('Scan processing complete');

      // ✅ Count only successful scans for everyone
      registerScanConsumed();
      setProcessing(false);
    } catch (err) {
      console.error('[Scanner] scan error', err);
      let msg =
        err?.responseJson?.error ||
        err?.message ||
        'Something went wrong while scanning. Please try again.';
      setErrorMessage(msg);
      logDebug(`ERROR: ${msg}`);
      setUploading(false);
      setProcessing(false);
    }
  };

  const handleScanClick = () => {
    if (!canScan) {
      const msg = `You're out of scans. Members get ${memberCap} scans included; you can also top up scan packs any time.`;
      setErrorMessage(msg);
      logDebug(`ERROR: ${msg}`);
      return;
    }
    const input = document.getElementById('scanner-file-input');
    if (input) {
      input.click();
    }
  };

  const isBusy = uploading || processing;

  return (
    <div
      className="scanner-root"
      style={{
        minHeight: '100vh',
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#050c08',
        color: '#f5fff5',
      }}
    >
      {/* TOP BAR */}
      <div
        style={{
          padding: '0 16px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <button
          type="button"
          onClick={onBack || (() => onNavigate?.('home'))}
          style={{
            border: 'none',
            background: 'transparent',
            color: '#f5fff5',
            fontSize: 16,
            cursor: 'pointer',
            padding: '4px 8px',
          }}
        >
          ‹ Back
        </button>
        <span style={{ fontSize: 14, opacity: 0.85 }}>Scanner</span>
        <span style={{ width: 40 }} /> {/* spacer */}
      </div>

      {/* MAIN SCROLL AREA */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0 16px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <Box sx={{ maxWidth: 600, mx: 'auto', width: '100%' }}>
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

        {/* Error panel */}
        {errorMessage && (
          <div
            style={{
              padding: 12,
              borderRadius: 12,
              backgroundColor: 'rgba(180, 40, 40, 0.2)',
              border: '1px solid rgba(255, 120, 120, 0.5)',
              fontSize: 13,
              marginTop: 16,
            }}
          >
            <strong>Scan error:</strong>
            <div style={{ marginTop: 4 }}>{errorMessage}</div>
          </div>
        )}

        {/* Debug log */}
        {debugEvents.length > 0 && (
          <div
            style={{
              marginTop: 8,
              padding: 8,
              borderRadius: 8,
              backgroundColor: 'rgba(255,255,255,0.03)',
              fontSize: 11,
              maxHeight: 120,
              overflowY: 'auto',
            }}
          >
            <div style={{ opacity: 0.7, marginBottom: 4 }}>
              Scanner log (last 20 events)
            </div>
            {debugEvents.map((line, idx) => (
              <div key={idx} style={{ whiteSpace: 'pre-wrap' }}>
                {line}
              </div>
            ))}
          </div>
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
      </div>
    </div>
  );
}
