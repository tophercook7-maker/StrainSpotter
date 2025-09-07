import express from 'express'
import cors from 'cors'

const app = express()
app.use(cors())
app.use(express.json({limit:'10mb'}))

// ---- Mock catalog data (extendable) ----
const SEED_VENDORS = {
  'Blue Dream': [
    {name:'ILGM', url:'https://ilgm.com/products/blue-dream-feminized'},
    {name:'Seedsman', url:'https://www.seedsman.com/blue-dream-seeds'}
  ],
  'OG Kush': [
    {name:'ILGM', url:'https://ilgm.com/products/og-kush-feminized'},
    {name:'Herbies', url:'https://herbiesheadshop.com/cannabis-seeds/og-kush'}
  ],
  'Sour Diesel': [
    {name:'Seedsman', url:'https://www.seedsman.com/sour-diesel-seeds'},
    {name:'Herbies', url:'https://herbiesheadshop.com/cannabis-seeds/sour-diesel'}
  ]
}
const BASE = [
  { name:'Blue Dream', lineage:'Blueberry × Haze', thc:18, cbd:1, indicaPct:40, terpenes:['Myrcene','Pinene','Caryophyllene'] },
  { name:'OG Kush', lineage:'Chemdawg × Hindu Kush', thc:20, cbd:0.5, indicaPct:55, terpenes:['Limonene','Myrcene','Caryophyllene'] },
  { name:'Sour Diesel', lineage:'Chemdawg 91 × Super Skunk', thc:19, cbd:0.3, indicaPct:30, terpenes:['Limonene','Myrcene'] }
]
const leaflyLink = n => n ? `https://www.leafly.com/search?q=${encodeURIComponent(n)}` : null
const norm = it => ({
  name: it.name||'Unknown',
  lineage: it.lineage||'—',
  thc: typeof it.thc==='number'?it.thc:null,
  cbd: typeof it.cbd==='number'?it.cbd:null,
  indicaPct: typeof it.indicaPct==='number'?it.indicaPct:null,
  sativaPct: typeof it.sativaPct==='number'?it.sativaPct: (typeof it.indicaPct==='number'? 100-it.indicaPct : null),
  terpenes: it.terpenes||[],
  vendors: it.vendors||SEED_VENDORS[it.name]||[],
  leaflyUrl: it.leaflyUrl||leaflyLink(it.name),
  source: it.source||'mock'
})

// ---- /api/match  (image -> best guess) ----
// Accepts: { filename, mime, dataURL? } (we only use filename hint here)
app.post('/api/match', (req,res)=>{
  const { filename='' } = req.body||{}
  const low = (filename||'').toLowerCase()
  let guess = 'OG Kush', confidence = 0.61
  if (low.includes('blue')) { guess='Blue Dream'; confidence=0.82 }
  if (low.includes('sour')) { guess='Sour Diesel'; confidence=0.79 }
  res.json({ guess, confidence })
})

// ---- /api/search?q=Blue%20Dream  (catalog lookup) ----
app.get('/api/search', (req,res)=>{
  const q = (req.query.q||'').toLowerCase()
  const list = BASE.map(s => ({...s, _score: s.name.toLowerCase().includes(q)?2:1}))
    .sort((a,b)=>b._score-a._score)
    .map(({_score,...s})=>norm(s))
  res.json({ items: list })
})

// Health
app.get('/api/health', (_,res)=>res.json({ok:true}))

const PORT = process.env.PORT || 5179
app.listen(PORT, ()=>console.log(`[server] listening on http://localhost:${PORT}`))
