import express from 'express';
const router = express.Router();

let maintenance = false;
let settings = {
  effectsWeight: 0.3,
  thcWeight: 0.2,
  flavorWeight: 0.2,
  typeWeight: 0.3,
  maintenanceMode: false,
  impersonateUser: ''
};

// Maintenance mode toggle
router.post('/maintenance', (req, res) => {
  maintenance = !!req.body.maintenance;
  settings.maintenanceMode = maintenance;
  res.json({ maintenance });
});

// Get/set settings
router.post('/settings', (req, res) => {
  settings = { ...settings, ...req.body };
  res.json(settings);
});

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), memory: process.memoryUsage() });
});

// Refresh/reindex data
router.post('/refresh', (req, res) => {
  // TODO: Implement real refresh
  res.json({ refreshed: true, time: new Date() });
});

// Logs (dummy)
router.get('/logs', (req, res) => {
  res.type('text').send('No logs yet. (Demo)');
});

export default router;
