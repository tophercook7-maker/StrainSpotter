// tools/full_pipeline.mjs
// Orchestrates: scrape -> enhance -> import -> report
import { execSync, spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const log = (...a) => console.log('[full_pipeline]', ...a);
const toolsDir = path.join(process.cwd(), 'tools');
const dataDir = path.join(process.cwd(), 'backend', 'data');

function runNodeScript(script, args = []) {
  log(`Running: ${script} ${args.join(' ')}`);
  execSync(`node ${path.join(toolsDir, script)} ${args.join(' ')}`, { stdio: 'inherit' });
}

function fileExists(p) { return fs.existsSync(p); }

async function main() {
  // 1. Scrape all sources
  runNodeScript('scrape_strain_sources.mjs');

  // 2. Enhance/clean/merge
  runNodeScript('enhance_library.mjs');

  // 3. Copy enhanced to main for import
  const enhanced = path.join(dataDir, 'strain_library_enhanced.json');
  const mainLib = path.join(dataDir, 'strain_library.json');
  if (fileExists(enhanced)) {
    fs.copyFileSync(enhanced, mainLib);
    log('Copied enhanced library to main import file.');
  } else {
    throw new Error('Enhanced library not found!');
  }

  // 4. Import to Supabase
  runNodeScript('import_to_supabase_robust.mjs');

  // 5. Report summary
  log('--- FINAL REPORT ---');
  // Count in DB
  try {
    const out = execSync(`node -e "import('dotenv').then(({default:dotenv})=>{dotenv.config({path:'env/.env.local'}); return import('@supabase/supabase-js')}).then(({createClient})=>{const sb=createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.SUPABASE_ANON_KEY); return sb.from('strains').select('*',{count:'exact',head:true});}).then(({count,error})=>{if(error)console.error(error.message); else console.log('DB strains count:',count);}).catch(e=>console.error(e.message));}"`, { encoding: 'utf8' });
    process.stdout.write(out);
  } catch (e) { log('DB count failed:', e.message); }

  // Show import report
  const reportFile = path.join(dataDir, 'import_report.json');
  if (fileExists(reportFile)) {
    const report = fs.readFileSync(reportFile, 'utf8');
    log('Import report:', report);
  }

  // Sample a few strains with effects
  try {
    const jq = `jq -c '[.[] | select(.effects and (.effects | length > 0))] | .[:5]' ${enhanced}`;
    const sample = execSync(jq, { encoding: 'utf8' });
    log('Sample strains with effects:', sample);
  } catch (e) { log('jq sample failed:', e.message); }

  log('Pipeline complete.');
}

main().catch(e => { log('Pipeline error:', e); process.exit(1); });
