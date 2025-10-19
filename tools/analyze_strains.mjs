import fs from 'fs';
import path from 'path';

const strains = JSON.parse(fs.readFileSync(
  path.join(process.cwd(), 'backend', 'data', 'strain_library.json'), 
  'utf-8'
));

// Type distribution
const typeCount = strains.reduce((acc, strain) => {
  const type = strain.type || 'Unknown';
  acc[type] = (acc[type] || 0) + 1;
  return acc;
}, {});

// Lab test statistics
const withTests = strains.filter(s => s.labTestResults?.length > 0);
const totalTests = strains.reduce((sum, s) => sum + (s.labTestResults?.length || 0), 0);

// THC/CBD distribution
const thcStats = strains.reduce((acc, s) => {
  if (s.thc !== null) {
    acc.count++;
    acc.total += s.thc;
    acc.min = Math.min(acc.min, s.thc);
    acc.max = Math.max(acc.max, s.thc);
  }
  return acc;
}, { count: 0, total: 0, min: Infinity, max: -Infinity });

const cbdStats = strains.reduce((acc, s) => {
  if (s.cbd !== null) {
    acc.count++;
    acc.total += s.cbd;
    acc.min = Math.min(acc.min, s.cbd);
    acc.max = Math.max(acc.max, s.cbd);
  }
  return acc;
}, { count: 0, total: 0, min: Infinity, max: -Infinity });

// Top effects and flavors
const effectCount = strains.reduce((acc, s) => {
  (s.effects || []).forEach(effect => {
    acc[effect] = (acc[effect] || 0) + 1;
  });
  return acc;
}, {});

const flavorCount = strains.reduce((acc, s) => {
  (s.flavors || []).forEach(flavor => {
    acc[flavor] = (acc[flavor] || 0) + 1;
  });
  return acc;
}, {});

console.log('\nStrain Type Distribution:');
Object.entries(typeCount).forEach(([type, count]) => {
  console.log(`${type}: ${count} (${((count/strains.length)*100).toFixed(1)}%)`);
});

console.log('\nLab Testing Coverage:');
console.log(`Strains with lab tests: ${withTests.length} (${((withTests.length/strains.length)*100).toFixed(1)}%)`);
console.log(`Total number of test results: ${totalTests}`);
console.log(`Average tests per strain: ${(totalTests/withTests.length).toFixed(1)}`);

console.log('\nTHC/CBD Statistics:');
console.log(`THC data available: ${thcStats.count} strains`);
console.log(`Average THC: ${(thcStats.total/thcStats.count).toFixed(1)}%`);
console.log(`THC range: ${thcStats.min.toFixed(1)}% - ${thcStats.max.toFixed(1)}%`);
console.log(`\nCBD data available: ${cbdStats.count} strains`);
console.log(`Average CBD: ${(cbdStats.total/cbdStats.count).toFixed(1)}%`);
console.log(`CBD range: ${cbdStats.min.toFixed(1)}% - ${cbdStats.max.toFixed(1)}%`);

console.log('\nTop 10 Effects:');
Object.entries(effectCount)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .forEach(([effect, count]) => {
    console.log(`${effect}: ${count} strains`);
  });

console.log('\nTop 10 Terpenes/Flavors:');
Object.entries(flavorCount)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .forEach(([flavor, count]) => {
    console.log(`${flavor}: ${count} strains`);
  });