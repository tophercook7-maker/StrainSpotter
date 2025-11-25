// Quick script to check strain and image counts
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (!process.env.VERCEL) {
  dotenv.config({ path: join(__dirname, '../../env/.env.local') });
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkStats() {
  console.log('🔍 Checking strain and image stats...\n');

  try {
    // Load from JSON file (where the app actually loads from)
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    const strainPath = path.join(__dirname, '../data/strain_library.json');
    let strainsFromJSON = [];
    let jsonStrainCount = 0;
    
    if (fs.existsSync(strainPath)) {
      try {
        const rawStrains = fs.readFileSync(strainPath, 'utf8');
        strainsFromJSON = JSON.parse(rawStrains);
        if (Array.isArray(strainsFromJSON)) {
          jsonStrainCount = strainsFromJSON.length;
        }
      } catch (err) {
        console.warn('⚠️  Could not read JSON file:', err.message);
      }
    }

    // Get total unique strains from strains table (database)
    const { data: strainsData, error: strainsError } = await supabase
      .from('strains')
      .select('name', { count: 'exact' });

    const strainsFromTable = new Set();
    if (strainsData) {
      strainsData.forEach(strain => {
        if (strain.name) {
          strainsFromTable.add(strain.name.toUpperCase());
        }
      });
    }

    // Get unique canonical strain names from scans table
    const { data: scansData, error: scansError } = await supabase
      .from('scans')
      .select('canonical_strain_name, result');

    const scanStrainNames = new Set();
    if (scansData) {
      scansData.forEach(scan => {
        if (scan.canonical_strain_name) {
          scanStrainNames.add(scan.canonical_strain_name.toUpperCase());
        }
        if (scan.result?.canonical_strain?.name) {
          scanStrainNames.add(scan.result.canonical_strain.name.toUpperCase());
        }
      });
    }

    // Combine all sources and get unique total
    const jsonStrainNames = new Set();
    if (Array.isArray(strainsFromJSON)) {
      strainsFromJSON.forEach(strain => {
        if (strain?.name) {
          jsonStrainNames.add(strain.name.toUpperCase());
        }
      });
    }

    const allUniqueStrains = new Set([...jsonStrainNames, ...strainsFromTable, ...scanStrainNames]);
    const totalUniqueStrains = allUniqueStrains.size;

    // Get images count
    const { data: imagesData, error: imagesError } = await supabase
      .from('strain_images')
      .select('canonical_name, image_url', { count: 'exact' });

    const totalImages = imagesData?.length || 0;
    const imagesWithUrl = imagesData?.filter(img => img.image_url).length || 0;

    // Get coverage percentage
    const coverage = totalUniqueStrains > 0 
      ? ((imagesWithUrl / totalUniqueStrains) * 100).toFixed(1)
      : 0;

    console.log('📊 STATS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Total unique strains:     ${totalUniqueStrains}`);
    console.log(`  └─ From JSON file:      ${jsonStrainNames.size} (${jsonStrainCount} total in file)`);
    console.log(`  └─ From strains table:  ${strainsFromTable.size}`);
    console.log(`  └─ From scans table:    ${scanStrainNames.size}`);
    console.log('');
    console.log(`Total images in DB:       ${totalImages}`);
    console.log(`Images with URLs:         ${imagesWithUrl}`);
    console.log('');
    console.log(`Coverage:                 ${coverage}%`);
    console.log(`Missing images:           ${totalUniqueStrains - imagesWithUrl}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

checkStats().then(() => process.exit(0)).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

