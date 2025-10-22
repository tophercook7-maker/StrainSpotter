#!/usr/bin/env node
// Aggregate daily pipeline results into reports/pipeline-history.json
import fs from 'fs';
import path from 'path';

const repoRoot = process.cwd();
const dataDir = path.join(repoRoot, 'backend', 'data');
const reportsDir = path.join(repoRoot, 'reports');
const historyFile = path.join(reportsDir, 'pipeline-history.json');

function ensureDir(dir) { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); }

function readJSON(p, def = null) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return def; }
}

function getDateStamp(d = new Date()) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function summarize() {
  const enhancedPath = path.join(dataDir, 'strain_library_enhanced.json');
  const mainPath = path.join(dataDir, 'strain_library.json');
  const importReportPath = path.join(dataDir, 'import_report.json');

  const enhanced = readJSON(enhancedPath, []);
  const main = readJSON(mainPath, []);
  const report = readJSON(importReportPath, {});

  const totalEnhanced = Array.isArray(enhanced) ? enhanced.length : null;
  const totalMain = Array.isArray(main) ? main.length : null;

  const now = new Date();
  const entry = {
    date: now.toISOString(),
    date_utc: getDateStamp(now),
    totals: {
      strainsEnhanced: totalEnhanced,
      strainsMain: totalMain
    },
    report: report || {}
  };
  return entry;
}

function updateHistory(entry) {
  ensureDir(reportsDir);
  const history = readJSON(historyFile, []);

  // de-duplicate by date_utc (keep latest)
  const filtered = history.filter(e => e.date_utc !== entry.date_utc);
  filtered.push(entry);
  filtered.sort((a,b) => (a.date_utc < b.date_utc ? -1 : 1));

  fs.writeFileSync(historyFile, JSON.stringify(filtered, null, 2));
  console.log('[pipeline-history] Updated:', historyFile, 'entries=', filtered.length);
}

const entry = summarize();
updateHistory(entry);
