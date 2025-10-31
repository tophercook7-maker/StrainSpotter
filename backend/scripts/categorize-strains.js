#!/usr/bin/env node

/**
 * Categorize all strains in the database
 * - Checks which strains are missing type (indica/sativa/hybrid)
 * - Attempts to auto-categorize based on name patterns and common knowledge
 * - Updates the database with proper categorization
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load env from ../env/.env.local (same as backend)
dotenv.config({ path: new URL('../../env/.env.local', import.meta.url).pathname });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Common strain name patterns for categorization
const INDICA_PATTERNS = [
  'kush', 'og', 'purple', 'afghani', 'northern lights', 'granddaddy',
  'bubba', 'master', 'platinum', 'skywalker', 'blackberry', 'grape',
  'blueberry kush', 'hindu', 'la confidential', 'death star'
];

const SATIVA_PATTERNS = [
  'haze', 'diesel', 'jack', 'durban', 'green crack', 'super silver',
  'sour diesel', 'trainwreck', 'amnesia', 'acapulco', 'maui',
  'tangie', 'super lemon', 'strawberry cough', 'ghost train'
];

const HYBRID_PATTERNS = [
  'dream', 'cookies', 'gelato', 'cake', 'runtz', 'zkittlez', 'wedding',
  'gsc', 'gg4', 'gorilla glue', 'blue dream', 'girl scout', 'sherbet',
  'ice cream', 'cherry pie', 'pineapple express', 'white widow'
];

// Known strains with definitive types
const KNOWN_STRAINS = {
  // Indica-dominant
  'northern lights': 'indica',
  'granddaddy purple': 'indica',
  'purple kush': 'indica',
  'bubba kush': 'indica',
  'og kush': 'indica',
  'master kush': 'indica',
  'afghan kush': 'indica',
  'hindu kush': 'indica',
  'la confidential': 'indica',
  'blueberry': 'indica',
  'grape ape': 'indica',
  'purple urkle': 'indica',
  'skywalker og': 'indica',
  'death star': 'indica',
  'kosher kush': 'indica',
  'platinum kush': 'indica',
  'blackberry kush': 'indica',
  '9 lb hammer': 'indica',
  
  // Sativa-dominant
  'sour diesel': 'sativa',
  'green crack': 'sativa',
  'jack herer': 'sativa',
  'durban poison': 'sativa',
  'super silver haze': 'sativa',
  'super lemon haze': 'sativa',
  'trainwreck': 'sativa',
  'amnesia haze': 'sativa',
  'acapulco gold': 'sativa',
  'maui wowie': 'sativa',
  'tangie': 'sativa',
  'strawberry cough': 'sativa',
  'ghost train haze': 'sativa',
  'green haze': 'sativa',
  'lemon haze': 'sativa',
  'chocolope': 'sativa',
  'clementine': 'sativa',
  'golden goat': 'sativa',
  
  // Hybrid
  'blue dream': 'hybrid',
  'girl scout cookies': 'hybrid',
  'gsc': 'hybrid',
  'gelato': 'hybrid',
  'wedding cake': 'hybrid',
  'gg4': 'hybrid',
  'gorilla glue': 'hybrid',
  'gorilla glue #4': 'hybrid',
  'white widow': 'hybrid',
  'pineapple express': 'hybrid',
  'cherry pie': 'hybrid',
  'ice cream cake': 'hybrid',
  'runtz': 'hybrid',
  'zkittlez': 'hybrid',
  'gelato #41': 'hybrid',
  'sherbet': 'hybrid',
  'sunset sherbet': 'hybrid',
  'do-si-dos': 'hybrid',
  'cookies and cream': 'hybrid',
  'wedding pie': 'hybrid',
  'purple punch': 'hybrid',
  'mimosa': 'hybrid',
  'cereal milk': 'hybrid',
  'apple fritter': 'hybrid',
  'mac 1': 'hybrid',
  'sundae driver': 'hybrid',
  'kush mints': 'hybrid',
  'animal cookies': 'hybrid',
  'biscotti': 'hybrid',
  'gelatti': 'hybrid',
  'tropicana cookies': 'hybrid',
  'forbidden fruit': 'hybrid',
  'lava cake': 'hybrid',
  'oreoz': 'hybrid',
  'birthday cake': 'hybrid',
  'layer cake': 'hybrid',
  'banana kush': 'hybrid',
  'mango kush': 'hybrid',
  'lemon cake': 'hybrid',
  'orange cookies': 'hybrid',
  'mandarin cookies': 'hybrid',
  'pink cookies': 'hybrid',
  'platinum cookies': 'hybrid',
  'monster cookies': 'hybrid',
  'gorilla cookies': 'hybrid',
  'gmo cookies': 'hybrid',
  'animal mints': 'hybrid',
  'thin mint': 'hybrid',
  'peanut butter breath': 'hybrid',
  'motorbreath': 'hybrid',
  'jet fuel': 'hybrid',
  'fire og': 'hybrid',
  'tahoe og': 'hybrid',
  'alien og': 'hybrid',
  'ghost og': 'hybrid',
  'larry og': 'hybrid',
  'sfv og': 'hybrid',
  'triangle kush': 'hybrid',
  'headband': 'hybrid',
  'candyland': 'hybrid',
  'strawberry banana': 'hybrid',
  'banana punch': 'hybrid',
  'watermelon zkittlez': 'hybrid',
  'watermelon': 'hybrid',
  'papaya': 'hybrid',
  'guava': 'hybrid',
  'mochi': 'hybrid',
  'bacio gelato': 'hybrid',
  'lilac diesel': 'hybrid',
  'pink rozay': 'hybrid',
  'georgia pie': 'hybrid',
  'horchata': 'hybrid',
  'wookies': 'hybrid',
  'space cake': 'hybrid',
  'lemon og': 'hybrid',
  'lemon kush': 'hybrid',
  'lemon skunk': 'hybrid',
  'orange creamsicle': 'hybrid',
  'sour tangie': 'hybrid',
  'cherry punch': 'hybrid',
  'fruit punch': 'hybrid',
  'strawberry shortcake': 'hybrid',
  'blueberry muffin': 'hybrid',
  'blue cookies': 'hybrid',
  'blue cheese': 'hybrid',
  'cheese': 'hybrid',
  'fpog': 'hybrid',
  'black diamond': 'hybrid',
  'zookies': 'hybrid',
  'dolato': 'hybrid',
  'jungle cake': 'hybrid',
  'la kush cake': 'hybrid',
  'king louis': 'hybrid',
  'khalifa kush': 'hybrid',
  'venom og': 'hybrid',
  'white fire og': 'hybrid',
  'wifi og': 'hybrid',
  'platinum og': 'hybrid',
  'pink kush': 'hybrid',
  'cookies kush': 'hybrid',
  'sour kush': 'hybrid',
  'critical kush': 'hybrid',
  'cali kush': 'hybrid',
  'billy kimber': 'hybrid',
  'mk ultra': 'hybrid',
  'g13': 'hybrid',
  'lsd': 'hybrid',
  'gods gift': 'hybrid',
  'superglue': 'hybrid',
  'moby dick': 'hybrid',
  'cotton candy': 'hybrid',
  'super skunk': 'hybrid',
  'skunk 1': 'hybrid',
  'dutch treat': 'hybrid',
  'alaskan thunder fuck': 'hybrid',
  'cinderella 99': 'hybrid',
  'harlequin': 'hybrid'
};

function categorizeStrain(name) {
  if (!name) return null;

  const lowerName = name.toLowerCase().trim();

  // Check known strains first
  if (KNOWN_STRAINS[lowerName]) {
    // Capitalize the type from known strains (they're stored lowercase)
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
  console.log('🔍 Fetching all strains from database...\n');

  // First, get the total count
  const { count: totalCount, error: countError } = await supabase
    .from('strains')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('❌ Error getting count:', countError);
    process.exit(1);
  }

  console.log(`📊 Total strains in database: ${totalCount}`);
  console.log('📥 Fetching all strains in batches...\n');

  // Fetch all strains in batches of 1000
  const allStrains = [];
  const batchSize = 1000;
  let offset = 0;

  while (offset < totalCount) {
    console.log(`   Fetching batch ${Math.floor(offset / batchSize) + 1}/${Math.ceil(totalCount / batchSize)}...`);

    const { data: batch, error: fetchError } = await supabase
      .from('strains')
      .select('slug, name, type')
      .order('name')
      .range(offset, offset + batchSize - 1);

    if (fetchError) {
      console.error('❌ Error fetching strains:', fetchError);
      process.exit(1);
    }

    allStrains.push(...batch);
    offset += batchSize;
  }

  console.log(`✅ Fetched ${allStrains.length} strains\n`);
  
  // Categorize strains
  const stats = {
    total: allStrains.length,
    hasType: 0,
    missingType: 0,
    indica: 0,
    sativa: 0,
    hybrid: 0,
    other: 0,
    updated: 0
  };
  
  const strainsToUpdate = [];
  
  for (const strain of allStrains) {
    const currentType = strain.type?.toLowerCase();
    
    if (currentType && ['indica', 'sativa', 'hybrid'].includes(currentType)) {
      stats.hasType++;
      stats[currentType]++;
    } else {
      stats.missingType++;
      const suggestedType = categorizeStrain(strain.name);
      
      if (suggestedType) {
        strainsToUpdate.push({
          slug: strain.slug,
          name: strain.name,
          oldType: strain.type,
          newType: suggestedType
        });
      }
    }
  }
  
  console.log('📈 Current Statistics:');
  console.log(`   ✅ Strains with type: ${stats.hasType}`);
  console.log(`   ❌ Strains missing type: ${stats.missingType}`);
  console.log(`   🟣 Indica: ${stats.indica}`);
  console.log(`   🟠 Sativa: ${stats.sativa}`);
  console.log(`   🟢 Hybrid: ${stats.hybrid}`);
  console.log(`   ⚪ Other: ${stats.other}\n`);
  
  if (strainsToUpdate.length === 0) {
    console.log('✅ All strains are already categorized!');
    return;
  }
  
  console.log(`🔧 Found ${strainsToUpdate.length} strains to categorize\n`);
  console.log('Sample strains to update:');
  strainsToUpdate.slice(0, 10).forEach(s => {
    console.log(`   "${s.name}" → ${s.newType}`);
  });
  
  if (strainsToUpdate.length > 10) {
    console.log(`   ... and ${strainsToUpdate.length - 10} more\n`);
  }
  
  // Update strains in batches
  console.log('\n🚀 Updating strains...');
  
  for (const strain of strainsToUpdate) {
    const { error: updateError } = await supabase
      .from('strains')
      .update({ type: strain.newType })
      .eq('slug', strain.slug);

    if (updateError) {
      console.error(`   ❌ Error updating ${strain.name}:`, updateError.message);
    } else {
      stats.updated++;
      // Increment the lowercase version of the type for stats
      const typeKey = strain.newType.toLowerCase();
      stats[typeKey]++;
    }
  }
  
  console.log(`\n✅ Updated ${stats.updated} strains!\n`);
  
  console.log('📊 Final Statistics:');
  console.log(`   🟣 Indica: ${stats.indica}`);
  console.log(`   🟠 Sativa: ${stats.sativa}`);
  console.log(`   🟢 Hybrid: ${stats.hybrid}`);
  console.log(`   ⚪ Other: ${stats.other}\n`);
  
  console.log('✨ Categorization complete!');
}

main().catch(console.error);

