// backend/routes/cron.js
// Cron job endpoints for scheduled tasks

import express from 'express';
import { run } from '../scripts/scrapeStrainImagesFromSeedBanks.js';

const router = express.Router();

/**
 * GET /api/cron/scrape-strain-images
 * Scheduled endpoint for scraping strain images
 * 
 * Security: Should be protected by Vercel cron secret or similar
 * Usage: Set up in vercel.json crons or call via cron job
 */
router.get('/scrape-strain-images', async (req, res) => {
  // Optional: Verify cron secret (set CRON_SECRET env var)
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers['authorization'];
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.warn('[cron] Unauthorized scraper request');
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  try {
    console.log('[cron] Starting scheduled strain image scraper...');
    
    // Run scraper with skipExisting=true to minimize database writes
    await run({ skipExisting: true });
    
    res.json({ 
      success: true, 
      message: 'Scraper completed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('[cron] Scraper failed', err);
    res.status(500).json({ 
      error: 'Scraper failed', 
      message: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;

