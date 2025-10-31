import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load env from ../env/.env.local
dotenv.config({ path: new URL('../../env/.env.local', import.meta.url).pathname });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkStrainCount() {
  try {
    console.log('🔍 Checking strain count in database...\n');

    // Get total count
    const { count: totalCount, error: countError } = await supabase
      .from('strains')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Error getting total count:', countError);
      return;
    }

    console.log(`📊 Total strains in database: ${totalCount}\n`);

    // Get count by type
    const { data: typeData, error: typeError } = await supabase
      .from('strains')
      .select('type');

    if (typeError) {
      console.error('❌ Error getting type data:', typeError);
      return;
    }

    // Count by type
    const typeCounts = {
      'Indica': 0,
      'Sativa': 0,
      'Hybrid': 0,
      'Unknown': 0
    };

    typeData.forEach(strain => {
      const type = strain.type;
      if (type === 'Indica' || type === 'Sativa' || type === 'Hybrid') {
        typeCounts[type]++;
      } else {
        typeCounts['Unknown']++;
      }
    });

    console.log('📈 Breakdown by type:');
    console.log(`   Indica: ${typeCounts.Indica} (${(typeCounts.Indica / totalCount * 100).toFixed(1)}%)`);
    console.log(`   Sativa: ${typeCounts.Sativa} (${(typeCounts.Sativa / totalCount * 100).toFixed(1)}%)`);
    console.log(`   Hybrid: ${typeCounts.Hybrid} (${(typeCounts.Hybrid / totalCount * 100).toFixed(1)}%)`);
    if (typeCounts.Unknown > 0) {
      console.log(`   Unknown: ${typeCounts.Unknown} (${(typeCounts.Unknown / totalCount * 100).toFixed(1)}%)`);
    }

    console.log('\n✅ Count check complete!');

    if (totalCount < 35000) {
      console.log('\n⚠️  WARNING: You mentioned having 35,000 strains, but only', totalCount, 'were found.');
      console.log('   This could mean:');
      console.log('   1. The strains haven\'t been imported yet');
      console.log('   2. They\'re in a different table');
      console.log('   3. The import failed');
      console.log('\n   Would you like help importing your strain data?');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkStrainCount();

