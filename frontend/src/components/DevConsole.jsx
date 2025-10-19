import React, { useState, useRef, useEffect } from 'react';
import { Box, Drawer, IconButton, Typography, TextField, Button, Slider } from '@mui/material';
import { TerminalIcon } from '@heroicons/react/outline';

// Gesture detection constants
const GESTURE_THRESHOLD = 100;
const DIAGONAL_THRESHOLD = 45;

const DevConsole = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [settings, setSettings] = useState({
    effectsWeight: 0.3,
    thcWeight: 0.2,
    flavorWeight: 0.2,
    typeWeight: 0.3,
    maintenanceMode: false,
    impersonateUser: '',
  });
  const [health, setHealth] = useState(null);
  const [logs, setLogs] = useState('');

  const [pressTimer, setPressTimer] = useState(null);

  const handleTouchStart = () => {
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 800); // 800ms long press
    setPressTimer(timer);
  };

  const handleTouchEnd = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
  };

  const handleTouchMove = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
  };

  const handleSettingChange = (setting) => (event, value) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const applySettings = async () => {
    try {
      await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
    } catch (error) {
      console.error('Failed to apply settings:', error);
    }
  };

  const toggleMaintenance = async () => {
    setSettings(prev => ({ ...prev, maintenanceMode: !prev.maintenanceMode }));
    await fetch('/api/admin/maintenance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ maintenance: !settings.maintenanceMode })
    });
  };

  const fetchHealth = async () => {
    const res = await fetch('/api/admin/health');
    setHealth(await res.json());
  };

  const fetchLogs = async () => {
    const res = await fetch('/api/admin/logs');
    setLogs(await res.text());
  };

  const refreshData = async () => {
    await fetch('/api/admin/refresh', { method: 'POST' });
  };

  return (
    <>
      <IconButton
        sx={{
          position: 'fixed',
          top: 16,
          right: 16,
          opacity: 0.01, // Nearly invisible
          touchAction: 'none'
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <TerminalIcon />
      </IconButton>

      <Drawer
        anchor="right"
        open={isOpen}
        onClose={() => setIsOpen(false)}
        PaperProps={{
          sx: {
            width: '80%',
            maxWidth: 400,
            p: 2,
            bgcolor: '#1a1a1a',
            color: '#00ff00'
          }
        }}
      >
        <Typography variant="h6" sx={{ mb: 3, fontFamily: 'monospace' }}>
          StrainSpotter Dev Console
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Recommendation Weights
          </Typography>
          <Typography>Effects Weight</Typography>
          <Slider
            value={settings.effectsWeight}
            onChange={handleSettingChange('effectsWeight')}
            step={0.1}
            min={0}
            max={1}
            sx={{ mb: 2 }}
          />
          <Typography>THC Weight</Typography>
          <Slider
            value={settings.thcWeight}
            onChange={handleSettingChange('thcWeight')}
            step={0.1}
            min={0}
            max={1}
            sx={{ mb: 2 }}
          />
          <Typography>Flavor Weight</Typography>
          <Slider
            value={settings.flavorWeight}
            onChange={handleSettingChange('flavorWeight')}
            step={0.1}
            min={0}
            max={1}
            sx={{ mb: 2 }}
          />
          <Typography>Type Weight</Typography>
          <Slider
            value={settings.typeWeight}
            onChange={handleSettingChange('typeWeight')}
            step={0.1}
            min={0}
            max={1}
            sx={{ mb: 2 }}
          />
        </Box>

        <Button
          variant="contained"
          onClick={applySettings}
          sx={{
            bgcolor: '#00ff00',
            color: '#000',
            '&:hover': {
              bgcolor: '#00dd00'
            }
          }}
        >
          Apply Settings
        </Button>

        <Button
          variant="outlined"
          onClick={toggleMaintenance}
          sx={{ mt: 2, color: settings.maintenanceMode ? '#f00' : '#00ff00', borderColor: settings.maintenanceMode ? '#f00' : '#00ff00' }}
        >
          {settings.maintenanceMode ? 'Disable' : 'Enable'} Maintenance Mode
        </Button>

        <Button variant="outlined" onClick={fetchHealth} sx={{ mt: 2, color: '#00ff00', borderColor: '#00ff00' }}>
          Check API Health
        </Button>
        {health && (
          <Box sx={{ mt: 1, fontFamily: 'monospace', fontSize: 12 }}>
            {JSON.stringify(health, null, 2)}
          </Box>
        )}

        <Button variant="outlined" onClick={refreshData} sx={{ mt: 2, color: '#00ff00', borderColor: '#00ff00' }}>
          Refresh Data
        </Button>

        <Button variant="outlined" onClick={fetchLogs} sx={{ mt: 2, color: '#00ff00', borderColor: '#00ff00' }}>
          View Logs
        </Button>
        {logs && (
          <Box sx={{ mt: 1, fontFamily: 'monospace', fontSize: 12, maxHeight: 200, overflow: 'auto', bgcolor: '#111' }}>
            <pre>{logs}</pre>
          </Box>
        )}

        <TextField
          label="Impersonate User (ID)"
          value={settings.impersonateUser}
          onChange={e => setSettings(prev => ({ ...prev, impersonateUser: e.target.value }))}
          sx={{ mt: 2, input: { color: '#00ff00' } }}
          InputLabelProps={{ style: { color: '#00ff00' } }}
        />
      </Drawer>
    </>
  );
};

export default DevConsole;