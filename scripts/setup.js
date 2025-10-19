import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ENV_PATH = path.resolve(__dirname, '../env/.env.local');

function readEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/);
  const env = {};
  for (const line of lines) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m) {
      const key = m[1];
      let val = m[2];
      // strip surrounding quotes if present
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  }
  return env;
}

function status(ok, label) {
  const mark = ok ? '✅' : '❌';
  console.log(`${mark} ${label}`);
}

(function main() {
  console.log('StrainSpotter setup check\n--------------------------');
  status(fs.existsSync(ENV_PATH), `.env present at env/.env.local`);
  const env = readEnv(ENV_PATH);

  status(!!env.SUPABASE_URL, 'SUPABASE_URL set');
  status(!!env.SUPABASE_ANON_KEY, 'SUPABASE_ANON_KEY set');

  // Google Vision via file path or inline JSON
  const gvByPath = !!env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(path.resolve(__dirname, '..', env.GOOGLE_APPLICATION_CREDENTIALS));
  const gvInline = !!env.GOOGLE_VISION_JSON;
  status(gvByPath || gvInline, 'Google Vision credentials present (file or inline JSON)');

  const port = env.PORT || '5181';
  console.log(`\nExpected backend port: ${port}`);
  console.log('Next: run "npm run dev" in backend or use VS Code task "Start Backend".');
})();
