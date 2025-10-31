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

async function checkSample() {
  console.log('🔍 Checking sample strains...\n');
  
  // Get total count
  const { count: totalCount } = await supabase
    .from('strains')
    .select('*', { count: 'exact', head: true });
  
  console.log(`📊 Total strains: ${totalCount}\n`);
  
  // Get sample of 20 strains
  const { data: sample } = await supabase
    .from('strains')
    .select('slug, name, type')
    .limit(20);
  
  console.log('📋 Sample of first 20 strains:');
  sample.forEach((s, i) => {
    console.log(`   ${i + 1}. "${s.name}" → ${s.type || '(no type)'}`);
  });
  
  // Count by type (fetch ALL strains in batches)
  console.log('\n🔍 Counting all strains by type...');
  
  const allStrains = [];
  const batchSize = 1000;
  let offset = 0;
  
  while (offset < totalCount) {
    const { data: batch } = await supabase
      .from('strains')
      .select('type')
      .range(offset, offset + batchSize - 1);
    
    allStrains.push(...batch);
    offset += batchSize;
  }
  
  const stats = {
    indica: allStrains.filter(s => s.type === 'Indica').length,
    sativa: allStrains.filter(s => s.type === 'Sativa').length,
    hybrid: allStrains.filter(s => s.type === 'Hybrid').length,
    uncategorized: allStrains.filter(s => !s.type || s.type === '').length,
  };
  
  console.log('\n📊 Complete Statistics:');
  console.log(`   🟣 Indica: ${stats.indica} (${(stats.indica / totalCount * 100).toFixed(1)}%)`);
  console.log(`   🟠 Sativa: ${stats.sativa} (${(stats.sativa / totalCount * 100).toFixed(1)}%)`);
  console.log(`   🟢 Hybrid: ${stats.hybrid} (${(stats.hybrid / totalCount * 100).toFixed(1)}%)`);
  console.log(`   ⚪ Uncategorized: ${stats.uncategorized} (${(stats.uncategorized / totalCount * 100).toFixed(1)}%)`);
  console.log(`   📊 Total: ${allStrains.length}\n`);
}

checkSample();

