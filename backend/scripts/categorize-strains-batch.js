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

// Categorization logic (same as before)
const INDICA_PATTERNS = ['kush', 'og', 'purple', 'afghani', 'northern lights', 'bubba', 'master', 'platinum', 'skywalker', 'blackberry', 'grape', 'granddaddy', 'gdp'];
const SATIVA_PATTERNS = ['haze', 'diesel', 'jack', 'durban', 'green crack', 'super silver', 'trainwreck', 'amnesia', 'acapulco', 'maui', 'tangie', 'sour'];
const HYBRID_PATTERNS = ['dream', 'cookies', 'gelato', 'cake', 'runtz', 'zkittlez', 'wedding', 'gsc', 'gg4', 'gorilla glue', 'sherbet', 'ice cream', 'mints', 'punch'];

const KNOWN_STRAINS = {
  'blue dream': 'hybrid',
  'girl scout cookies': 'hybrid',
  'og kush': 'indica',
  'sour diesel': 'sativa',
  'granddaddy purple': 'indica',
  'jack herer': 'sativa',
  'green crack': 'sativa',
  'ak-47': 'hybrid',
  'white widow': 'hybrid',
  'northern lights': 'indica',
  'pineapple express': 'hybrid',
  'super silver haze': 'sativa',
  'trainwreck': 'hybrid',
  'bubba kush': 'indica',
  'purple haze': 'sativa',
  'gorilla glue #4': 'hybrid',
  'gelato': 'hybrid',
  'wedding cake': 'hybrid',
  'zkittlez': 'indica',
  'runtz': 'hybrid',
};

function categorizeStrain(name) {
  if (!name) return null;
  
  const lowerName = name.toLowerCase().trim();
  
  // Check known strains first
  if (KNOWN_STRAINS[lowerName]) {
    const type = KNOWN_STRAINS[lowerName];
    return type.charAt(0).toUpperCase() + type.slice(1);
  }
  
  // Check patterns
  const matchesIndica = INDICA_PATTERNS.some(pattern => lowerName.includes(pattern));
  const matchesSativa = SATIVA_PATTERNS.some(pattern => lowerName.includes(pattern));
  const matchesHybrid = HYBRID_PATTERNS.some(pattern => lowerName.includes(pattern));
  
  // If matches multiple, hybrid wins
  if ((matchesIndica && matchesSativa) || (matchesIndica && matchesHybrid) || (matchesSativa && matchesHybrid)) {
    return 'Hybrid';
  }
  
  if (matchesIndica) return 'Indica';
  if (matchesSativa) return 'Sativa';
  if (matchesHybrid) return 'Hybrid';
  
  // Default to Hybrid if uncertain
  return 'Hybrid';
}

async function main() {
  console.log('🔍 Fetching strains without type...\n');

  // First get the count
  const { count: uncategorizedCount } = await supabase
    .from('strains')
    .select('*', { count: 'exact', head: true })
    .or('type.is.null,type.eq.');

  console.log(`📊 Found ${uncategorizedCount} strains without type\n`);

  if (uncategorizedCount === 0) {
    console.log('✅ All strains are already categorized!');
    return;
  }

  // Fetch all uncategorized strains in batches
  console.log('📥 Fetching uncategorized strains in batches...\n');
  const uncategorized = [];
  const fetchBatchSize = 1000;
  let offset = 0;

  while (offset < uncategorizedCount) {
    console.log(`   Fetching batch ${Math.floor(offset / fetchBatchSize) + 1}/${Math.ceil(uncategorizedCount / fetchBatchSize)}...`);

    const { data: batch, error: fetchError } = await supabase
      .from('strains')
      .select('slug, name')
      .or('type.is.null,type.eq.')
      .order('name')
      .range(offset, offset + fetchBatchSize - 1);

    if (fetchError) {
      console.error('❌ Error fetching strains:', fetchError);
      process.exit(1);
    }

    uncategorized.push(...batch);
    offset += fetchBatchSize;
  }

  console.log(`✅ Fetched ${uncategorized.length} uncategorized strains\n`);
  
  // Categorize all strains
  console.log('🔧 Categorizing strains...\n');
  const updates = uncategorized.map(strain => ({
    slug: strain.slug,
    type: categorizeStrain(strain.name)
  }));
  
  // Count by type
  const stats = {
    indica: updates.filter(u => u.type === 'Indica').length,
    sativa: updates.filter(u => u.type === 'Sativa').length,
    hybrid: updates.filter(u => u.type === 'Hybrid').length,
  };
  
  console.log('📈 Will categorize as:');
  console.log(`   🟣 Indica: ${stats.indica} (${(stats.indica / updates.length * 100).toFixed(1)}%)`);
  console.log(`   🟠 Sativa: ${stats.sativa} (${(stats.sativa / updates.length * 100).toFixed(1)}%)`);
  console.log(`   🟢 Hybrid: ${stats.hybrid} (${(stats.hybrid / updates.length * 100).toFixed(1)}%)\n`);
  
  // Update one by one (Supabase doesn't support batch UPDATE)
  console.log('🚀 Updating database...\n');
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < updates.length; i++) {
    const update = updates[i];

    if (i % 100 === 0) {
      console.log(`   Progress: ${i}/${updates.length} (${((i / updates.length) * 100).toFixed(1)}%)...`);
    }

    try {
      const { error: updateError } = await supabase
        .from('strains')
        .update({ type: update.type })
        .eq('slug', update.slug);

      if (updateError) {
        errorCount++;
      } else {
        successCount++;
      }
    } catch (e) {
      errorCount++;
    }
  }

  console.log(`   Progress: ${updates.length}/${updates.length} (100.0%)...`);
  
  console.log(`\n✅ Update complete!`);
  console.log(`   ✅ Successfully updated: ${successCount}`);
  if (errorCount > 0) {
    console.log(`   ❌ Failed: ${errorCount}`);
  }
  
  // Verify final counts
  console.log('\n🔍 Verifying final counts...\n');
  
  const { data: finalData, error: finalError } = await supabase
    .from('strains')
    .select('type');
  
  if (!finalError && finalData) {
    const finalStats = {
      indica: finalData.filter(s => s.type === 'Indica').length,
      sativa: finalData.filter(s => s.type === 'Sativa').length,
      hybrid: finalData.filter(s => s.type === 'Hybrid').length,
      uncategorized: finalData.filter(s => !s.type || s.type === '').length,
    };
    
    console.log('📊 Final Database Statistics:');
    console.log(`   🟣 Indica: ${finalStats.indica}`);
    console.log(`   🟠 Sativa: ${finalStats.sativa}`);
    console.log(`   🟢 Hybrid: ${finalStats.hybrid}`);
    if (finalStats.uncategorized > 0) {
      console.log(`   ⚪ Uncategorized: ${finalStats.uncategorized}`);
    }
    console.log(`   📊 Total: ${finalData.length}\n`);
  }
  
  console.log('✨ Categorization complete!');
}

main();

