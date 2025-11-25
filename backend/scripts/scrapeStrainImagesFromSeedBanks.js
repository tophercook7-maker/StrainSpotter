// backend/scripts/scrapeStrainImagesFromSeedBanks.js
// Simple scraper to fetch hero images from seed bank vendor pages

import 'dotenv/config';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import { getKnownSeedBankStrains } from '../services/seedBankKnownStrains.js';
import { ensureBucketExists } from '../supabaseAdmin.js';

// Load env from ../env/.env.local
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (!process.env.VERCEL) {
  dotenv.config({ path: join(__dirname, '../../env/.env.local') });
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Fetch hero image URL from a seed bank vendor page
 * @param {string} url - The seed bank page URL
 * @returns {Promise<string|null>} Image URL or null if not found
 */
async function fetchHeroImage(url) {
  try {
    const res = await fetch(url, { 
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; StrainSpotter/1.0; +https://strainspotter.com)'
      }
    });
    
    if (!res.ok) {
      console.error('[scraper] Non-200 for', url, res.status);
      return null;
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // Try OpenGraph image first (most reliable)
    const og = $('meta[property="og:image"]').attr('content');
    if (og) {
      // Handle relative URLs
      if (og.startsWith('http')) return og;
      return new URL(og, url).toString();
    }

    // Fallback: first reasonably large img tag
    // Look for common product image selectors
    const productImg = $('img.product-image, img.hero-image, img.main-image').first().attr('src') ||
                       $('img[class*="product"]').first().attr('src') ||
                       $('img[class*="hero"]').first().attr('src');
    
    if (productImg) {
      if (productImg.startsWith('http')) return productImg;
      return new URL(productImg, url).toString();
    }

    // Last resort: first img tag
    const firstImg = $('img').first().attr('src');
    if (firstImg) {
      if (firstImg.startsWith('http')) return firstImg;
      return new URL(firstImg, url).toString();
    }

    return null;
  } catch (err) {
    console.error('[scraper] Error fetching', url, err.message);
    return null;
  }
}

/**
 * Download image from URL and upload to Supabase Storage
 * @param {string} imageUrl - External image URL
 * @param {string} canonicalName - Strain name for file naming
 * @returns {Promise<string|null>} Supabase Storage public URL or null
 */
async function downloadAndUploadImage(imageUrl, canonicalName) {
  try {
    console.log('[scraper] Downloading image from', imageUrl);
    
    // Download image
    const imageResponse = await fetch(imageUrl, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; StrainSpotter/1.0; +https://strainspotter.com)'
      }
    });
    
    if (!imageResponse.ok) {
      console.error('[scraper] Failed to download image', imageResponse.status);
      return null;
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(imageBuffer);
    
    // Determine content type from response or URL
    const contentType = imageResponse.headers.get('content-type') || 
                       (imageUrl.match(/\.(jpg|jpeg)$/i) ? 'image/jpeg' : 
                        imageUrl.match(/\.png$/i) ? 'image/png' : 
                        imageUrl.match(/\.webp$/i) ? 'image/webp' : 'image/jpeg');
    
    // Create safe filename from canonical name
    const safeName = canonicalName
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .substring(0, 50);
    
    const extension = contentType.includes('png') ? 'png' : 
                     contentType.includes('webp') ? 'webp' : 'jpg';
    const storagePath = `strain-images/${safeName}.${extension}`;
    
    // Ensure bucket exists
    await ensureBucketExists('strain-images', { public: true });
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('strain-images')
      .upload(storagePath, buffer, {
        contentType,
        upsert: true, // Overwrite if exists
        cacheControl: '3600' // Cache for 1 hour
      });
    
    if (uploadError) {
      console.error('[scraper] Upload error', uploadError.message);
      return null;
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('strain-images')
      .getPublicUrl(storagePath);
    
    const publicUrl = urlData?.publicUrl;
    console.log('[scraper] ✓ Uploaded to', publicUrl);
    
    return publicUrl;
  } catch (err) {
    console.error('[scraper] Error downloading/uploading image', err.message);
    return null;
  }
}

/**
 * Upsert strain image into database
 * @param {object} params
 * @param {string} params.canonicalName
 * @param {string} params.seedBankName
 * @param {string} params.seedBankUrl
 * @param {string|null} params.imageUrl - External image URL (will be downloaded and stored)
 * @param {boolean} params.downloadImages - Whether to download and store images (default: true)
 */
async function upsertStrainImage({ canonicalName, seedBankName, seedBankUrl, imageUrl, downloadImages = true }) {
  if (!imageUrl) {
    console.log('[scraper] No image URL for', canonicalName);
    return;
  }

  let finalImageUrl = imageUrl;
  
  // Download and upload to Supabase Storage if enabled
  if (downloadImages) {
    const storedUrl = await downloadAndUploadImage(imageUrl, canonicalName);
    if (storedUrl) {
      finalImageUrl = storedUrl;
      console.log('[scraper] Using stored image:', finalImageUrl);
    } else {
      console.warn('[scraper] Failed to store image, using original URL');
      // Fall back to original URL if storage fails
    }
  }

  const { error } = await supabase
    .from('strain_images')
    .upsert(
      {
        canonical_name: canonicalName.toUpperCase(), // Normalize to uppercase
        seed_bank_name: seedBankName || null,
        seed_bank_url: seedBankUrl || null,
        image_url: finalImageUrl, // Now points to Supabase Storage or original URL
        source: downloadImages && finalImageUrl.includes('supabase') ? 'stored' : 'seed-vendor',
        updated_at: new Date().toISOString(),
      },
      { 
        onConflict: 'canonical_name',
        ignoreDuplicates: false 
      }
    );

  if (error) {
    console.error('[scraper] upsert error', canonicalName, error.message);
  } else {
    console.log('[scraper] ✓ upserted image for', canonicalName);
  }
}

/**
 * Search for seed bank URL for a strain that doesn't have one
 * Uses generic seed bank search URLs
 * @param {string} canonicalName - Strain name to search for
 * @returns {Promise<string|null>} Seed bank URL or null
 */
async function findSeedBankUrlForStrain(canonicalName) {
  // Clean up strain name for URL
  const cleaned = canonicalName.replace(/['\"]/g, '').trim();
  const searchQuery = encodeURIComponent(cleaned);
  const slugName = cleaned.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  
  // Common seed bank search patterns - try multiple sources
  const seedBankPatterns = [
    // ILGM (most common, has many strains)
    `https://ilgm.com/seeds/cannabis-seeds?q=${searchQuery}`,
    // Leafly (strain info, often has images)
    `https://www.leafly.com/strains/${slugName}`,
    // Seedsman
    `https://www.seedsman.com/en/search?q=${searchQuery}`,
    // Homegrown Cannabis Co
    `https://homegrowncannabisco.com/search?q=${searchQuery}`,
  ];
  
  // For now, try ILGM first (most reliable)
  // TODO: Actually search each URL and find which one has the strain
  return seedBankPatterns[0];
}

/**
 * Main scraper function - runs continuously until all strains have images
 * @param {object} options
 * @param {boolean} options.skipExisting - Skip strains that already have images (default: true)
 * @param {boolean} options.downloadImages - Download and store images in Supabase Storage (default: true)
 * @param {boolean} options.runUntilComplete - Run continuously until all strains have images (default: true)
 * @param {number} options.maxRetries - Max retries per strain (default: 3)
 */
async function run(options = {}) {
  const { 
    skipExisting = true, 
    downloadImages = true,
    runUntilComplete = true,
    maxRetries = 3 
  } = options;
  
  console.log('[scraper] Starting strain image scraper...');
  console.log('[scraper] Options:', { skipExisting, downloadImages, runUntilComplete });
  
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[scraper] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  // Ensure bucket exists
  await ensureBucketExists('strain-images', { public: true });
  
  let totalSuccess = 0;
  let totalFailed = 0;
  let totalSkipped = 0;
  let iteration = 0;
  
  do {
    iteration++;
    console.log(`\n[scraper] ========== ITERATION ${iteration} ==========`);
    
    // Get fresh list of all strains from database
    const list = await getKnownSeedBankStrains();
    console.log('[scraper] Found', list.length, 'strains in database');

  // If skipExisting, check which strains already have images
  let existingImages = new Set();
  if (skipExisting) {
    try {
      const { data } = await supabase
        .from('strain_images')
        .select('canonical_name')
        .not('image_url', 'is', null);
      
      if (data) {
        existingImages = new Set(data.map(row => row.canonical_name.toUpperCase()));
        console.log('[scraper] Found', existingImages.size, 'existing images (will skip)');
      }
    } catch (err) {
      console.warn('[scraper] Could not check existing images, will scrape all:', err.message);
    }
  }

  // Filter to only strains that need images
    const strainsNeedingImages = list.filter(item => {
      const normalizedName = item.canonicalName.toUpperCase();
      return !skipExisting || !existingImages.has(normalizedName);
    });
    
    console.log('[scraper] Strains needing images:', strainsNeedingImages.length);
    
    if (strainsNeedingImages.length === 0 && runUntilComplete) {
      console.log('[scraper] ✅ All strains have images! Stopping.');
      break;
    }

    let successCount = 0;
    let failCount = 0;
    let skippedCount = 0;

    for (const item of strainsNeedingImages) {
      let { canonicalName, seedBankName, seedBankUrl } = item;
      const normalizedName = canonicalName.toUpperCase();

      // Skip if already exists (double-check)
      if (skipExisting && existingImages.has(normalizedName)) {
        console.log('[scraper] ⊘ Skipping', canonicalName, '(already has image)');
        skippedCount++;
        totalSkipped++;
        continue;
      }

      // If no seedBankUrl, try to find one
      if (!seedBankUrl) {
        console.log('[scraper] 🔍 No seedBankUrl for', canonicalName, '- searching...');
        seedBankUrl = await findSeedBankUrlForStrain(canonicalName);
        if (!seedBankUrl) {
          console.log('[scraper] ⚠ Could not find seedBankUrl for', canonicalName);
          failCount++;
          totalFailed++;
          // Small delay before next strain
          await new Promise((r) => setTimeout(r, 500));
          continue;
        }
        console.log('[scraper] ✓ Found seedBankUrl for', canonicalName);
      }

      console.log('[scraper] Fetching image for', canonicalName, 'from', seedBankUrl);
      
      let retries = 0;
      let imageUrl = null;
      
      // Retry logic
      while (retries < maxRetries && !imageUrl) {
        imageUrl = await fetchHeroImage(seedBankUrl);
        if (!imageUrl && retries < maxRetries - 1) {
          retries++;
          console.log('[scraper] Retry', retries, 'for', canonicalName);
          await new Promise((r) => setTimeout(r, 2000)); // Wait before retry
        }
      }
      
      if (imageUrl) {
        await upsertStrainImage({ 
          canonicalName, 
          seedBankName, 
          seedBankUrl, 
          imageUrl,
          downloadImages 
        });
        successCount++;
        totalSuccess++;
        // Update existingImages set to avoid re-checking
        existingImages.add(normalizedName);
      } else {
        console.log('[scraper] ✗ No image found for', canonicalName, 'after', maxRetries, 'retries');
        failCount++;
        totalFailed++;
      }

      // Be nice: small delay so we don't hammer any single site
      await new Promise((r) => setTimeout(r, 1500));
    }

    console.log(`[scraper] Iteration ${iteration} complete. Success: ${successCount}, Failed: ${failCount}, Skipped: ${skippedCount}`);
    console.log(`[scraper] TOTALS - Success: ${totalSuccess}, Failed: ${totalFailed}, Skipped: ${totalSkipped}`);
    
    // If runUntilComplete is true and there are still strains needing images, continue
    if (runUntilComplete) {
      const remainingNeedingImages = strainsNeedingImages.length - successCount - skippedCount;
      if (remainingNeedingImages > 0) {
        console.log(`[scraper] ${remainingNeedingImages} strains still need images. Waiting 30 seconds before next iteration...`);
        await new Promise((r) => setTimeout(r, 30000)); // Wait 30 seconds between iterations
        continue; // Loop again
      } else {
        console.log('[scraper] ✅ All strains have images! Stopping.');
        break; // All done
      }
    } else {
      break; // Not running until complete, exit after one iteration
    }
    
  } while (runUntilComplete);

  console.log('\n[scraper] ========== FINAL SUMMARY ==========');
  console.log('[scraper] Total iterations:', iteration);
  console.log('[scraper] Total success:', totalSuccess);
  console.log('[scraper] Total failed:', totalFailed);
  console.log('[scraper] Total skipped:', totalSkipped);
  console.log('[scraper] Done!');
}

// Run if called directly (ESM way to check if this is the main module)
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('scrapeStrainImagesFromSeedBanks.js')) {
  run().catch((e) => {
    console.error('[scraper] Fatal error', e);
    process.exit(1);
  });
}

export { run, fetchHeroImage, upsertStrainImage };

