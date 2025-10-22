import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Resolve paths relative to this file to be robust in serverless and local
const backendDir = path.join(new URL('../', import.meta.url).pathname);
const projectRoot = path.join(backendDir, '..');
const historyPath = path.join(projectRoot, 'reports', 'pipeline-history.json');
const importReportPath = path.join(backendDir, 'data', 'import_report.json');

function readJsonSafe(p) {
  try {
    if (fs.existsSync(p)) {
      const raw = fs.readFileSync(p, 'utf8');
      return JSON.parse(raw);
    }
  } catch (e) {
    return { error: e.message };
  }
  return null;
}

// GET /api/pipeline/history - full scrape/run history
router.get('/history', (req, res) => {
  const data = readJsonSafe(historyPath);
  if (!data) return res.status(404).json({ error: 'pipeline history not found' });
  res.json(data);
});

// GET /api/pipeline/latest - most recent run summary
router.get('/latest', (req, res) => {
  const data = readJsonSafe(historyPath);
  if (!data) return res.status(404).json({ error: 'pipeline history not found' });
  const latest = Array.isArray(data) && data.length ? data[data.length - 1] : data;
  res.json(latest || {});
});

// GET /api/pipeline/import-report - detailed import metrics from last run
router.get('/import-report', (req, res) => {
  const data = readJsonSafe(importReportPath);
  if (!data) return res.status(404).json({ error: 'import report not found' });
  res.json(data);
});

export default router;
