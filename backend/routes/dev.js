import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');

router.get('/stats', (req, res) => {
  try {
    // total strains from JSON file
    const libPath = path.join(DATA_DIR, 'strain_library.json');
    let totalStrains = 0;
    if (fs.existsSync(libPath)) {
      const raw = fs.readFileSync(libPath, 'utf8');
      const arr = JSON.parse(raw);
      totalStrains = Array.isArray(arr) ? arr.length : 0;
    }

    // last import report if exists
    const reportPath = path.join(DATA_DIR, 'import_report.json');
    let importReport = null;
    if (fs.existsSync(reportPath)) {
      importReport = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    }

    res.json({ totalStrains, importReport });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;
