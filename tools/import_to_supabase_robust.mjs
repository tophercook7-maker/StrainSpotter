#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve('env/.env.local') });

const DATA_FILE = path.join(process.cwd(), 'backend', 'data', 'strain_library.json');

function loadRows() {
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  const arr = JSON.parse(raw);
  return arr.map(x => ({
    slug: x.slug,
    name: x.name,
    type: x.type,
    description: x.description,
    effects: x.effects,
    flavors: x.flavors,
    lineage: x.lineage,
    thc: x.thc,
    cbd: x.cbd,
    lab_test_results: x.labTestResults
  }));
}

async function run() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error('Missing SUPABASE_URL or key');
    process.exit(1);
  }
  const sb = createClient(url, key);
  const rows = loadRows();

  let ok = 0, updatedByName = 0, fail = 0;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    try {
      const { error } = await sb.from('strains').upsert([r], { onConflict: 'slug' });
      if (error) {
        if (/idx_strains_name_ci|duplicate key value/.test(error.message)) {
          const { error: updErr } = await sb.from('strains').update(r).eq('name', r.name);
          if (updErr) {
            fail++;
            if (fail < 15) console.error(`[update-by-name fail] ${r.name}:`, updErr.message);
          } else {
            updatedByName++;
          }
        } else {
          fail++;
          if (fail < 15) console.error(`[upsert fail] ${r.name}:`, error.message);
        }
      } else {
        ok++;
      }
      if ((i+1) % 250 === 0) {
        console.log(`[progress] ${i+1}/${rows.length} -> ok=${ok} updatedByName=${updatedByName} fail=${fail}`);
      }
    } catch (e) {
      fail++;
      if (fail < 15) console.error(`[exception] ${r.name}:`, e.message);
    }
  }

  console.log(`[done] ok=${ok} updatedByName=${updatedByName} fail=${fail}`);

  // Count rows in DB
  const { count, error: cntErr } = await sb.from('strains').select('*', { count: 'exact', head: true });
  if (cntErr) {
    console.error('[count error]', cntErr.message);
  } else {
    console.log(`[db] total strains in DB: ${count}`);
  }
}

run().catch(err => { console.error(err); process.exit(1); });
