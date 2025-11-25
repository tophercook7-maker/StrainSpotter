# Strain Image Scraper - Cost & Scheduling Guide

## Cost Analysis

### What the Scraper Does:
1. **HTTP Requests** to seed bank websites (free, external)
2. **Database Writes** to Supabase `strain_images` table (storing text URLs)
3. **No Image Storage** - We only store URLs, not the actual images

### Supabase Costs:

**Free Tier Limits:**
- Database: 500MB storage
- Bandwidth: 2GB/month
- Database writes: Reasonable limits (not explicitly capped on free tier)

**What We're Storing:**
- Each record: ~200-500 bytes (canonical_name, image_url, metadata)
- 1000 strains = ~200-500KB (very small!)
- Even 10,000 strains = ~2-5MB (well within free tier)

**Estimated Monthly Cost:**
- **Free tier**: $0/month (you're fine!)
- **Pro tier** ($25/month): Only needed if you exceed free tier limits
- **Database writes**: Minimal - we're doing ~10-100 writes per run
- **Bandwidth**: Near zero (we're not serving images, just storing URLs)

### Recommendation:
- **Daily runs are safe** on free tier
- **Hourly runs are also fine** (only ~720 writes/month if you have 10 strains)
- You'd need to scrape **thousands of strains daily** to approach limits

## Scheduling Options

### Option 1: Vercel Cron (Recommended for Serverless)
If your backend is deployed on Vercel, add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/scrape-strain-images",
      "schedule": "0 2 * * *"
    }
  ]
}
```

Then create `backend/routes/cron.js`:
```javascript
import express from 'express';
import { run } from '../scripts/scrapeStrainImagesFromSeedBanks.js';

const router = express.Router();

router.get('/scrape-strain-images', async (req, res) => {
  // Verify cron secret (optional but recommended)
  if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await run();
    res.json({ success: true, message: 'Scraper completed' });
  } catch (err) {
    console.error('[cron] Scraper failed', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
```

### Option 2: Local Cron Job (For Development/Testing)
Add to your crontab (`crontab -e`):

```bash
# Run daily at 2 AM
0 2 * * * cd /path/to/strainspotter/backend && node scripts/scrapeStrainImagesFromSeedBanks.js >> logs/scraper.log 2>&1

# Or hourly (for testing)
0 * * * * cd /path/to/strainspotter/backend && node scripts/scrapeStrainImagesFromSeedBanks.js >> logs/scraper.log 2>&1
```

### Option 3: Render.com Cron Job
If using Render.com, add a Cron Job:
- Schedule: `0 2 * * *` (daily at 2 AM)
- Command: `cd backend && node scripts/scrapeStrainImagesFromSeedBanks.js`

### Option 4: GitHub Actions (Free)
Create `.github/workflows/scrape-images.yml`:

```yaml
name: Scrape Strain Images

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
  workflow_dispatch:  # Manual trigger

jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd backend && npm install
      - run: cd backend && node scripts/scrapeStrainImagesFromSeedBanks.js
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

## Cost Optimization Tips

1. **Run Less Frequently**: Daily is usually enough (strains don't change hourly)
2. **Only Scrape New Strains**: Modify scraper to skip existing images
3. **Batch Processing**: Process multiple strains in one run
4. **Cache Results**: Don't re-scrape if image URL hasn't changed

## Monitoring Usage

Check your Supabase dashboard:
- **Database**: Storage usage (should stay < 10MB for images table)
- **Bandwidth**: Should be near zero (we're not serving images)
- **API Calls**: Minimal (only writes, no reads from scraper)

## When to Upgrade

You'd need to upgrade if:
- Database exceeds 500MB (unlikely with just image URLs)
- You need more than 2GB bandwidth/month (only if serving images)
- You exceed 50K monthly active users (not related to scraper)

**Bottom Line**: Running daily or even hourly is **completely safe** on the free tier. The scraper only stores small text URLs, not actual images.

