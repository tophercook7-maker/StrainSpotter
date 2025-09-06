import fs from 'fs'
import { parse } from 'csv-parse/sync'

const inPath = process.argv[2] || 'src/data/strains.csv'
const outPath = process.argv[3] || 'src/data/strains.json'

if (!fs.existsSync(inPath)) {
  console.error(`No CSV at ${inPath}.`)
  process.exit(0)
}

const text = fs.readFileSync(inPath, 'utf8')
const rows = parse(text, { columns:true, skip_empty_lines:true })

const out = rows.map(r=>({
  name: r.name?.trim(),
  type: r.type?.trim() || '',
  aliases: (r.aliases||'').split('|').map(s=>s.trim()).filter(Boolean),
  parents: (r.parents||'').split('|').map(s=>s.trim()).filter(Boolean),
  terpenes: (r.terpenes||'').split('|').map(s=>s.trim()).filter(Boolean),
  thc: r.thc?.trim() || '',
  cbd: r.cbd?.trim() || '',
  notes: r.notes?.trim() || ''
})).filter(x=>x.name)

fs.writeFileSync(outPath, JSON.stringify(out, null, 2))
console.log(`Wrote ${out.length} strains to ${outPath}`)
