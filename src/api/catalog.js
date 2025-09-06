const LEAFLY_URL = import.meta.env.VITE_LEAFLY_URL || '';
const LEAFLY_KEY = import.meta.env.VITE_LEAFLY_KEY || '';
const SEEDF_URL  = import.meta.env.VITE_SEEDF_URL  || '';
const SEEDF_KEY  = import.meta.env.VITE_SEEDF_KEY  || '';

async function safeFetch(url, opts){
  try{ const r=await fetch(url,opts); if(!r.ok) throw 0; return await r.json(); }catch{ return null; }
}

function normalize(item){
  // Expect optional: item.indicaPct, item.sativaPct, item.vendors[]
  const indica = typeof item.indicaPct==='number' ? item.indicaPct : (item.indica ?? null);
  const sativa = typeof item.sativaPct==='number' ? item.sativaPct : (item.sativa ?? (indica!=null? 100-indica : null));
  return {
    name: item.name || 'Unknown',
    lineage: item.lineage || '—',
    thc: typeof item.thc==='number' ? item.thc : null,
    cbd: typeof item.cbd==='number' ? item.cbd : null,
    indicaPct: indica,
    sativaPct: sativa,
    terpenes: item.terpenes || [],
    image: item.image || null,
    vendors: item.vendors || [],
    leaflyUrl: item.leaflyUrl || leaflyLink(item.name),
    source: item.source || 'mock',
    url: item.url || null
  }
}

function leaflyLink(name){
  if(!name) return null;
  const slug = encodeURIComponent(name.trim());
  return `https://www.leafly.com/search?q=${slug}`;
}

// Simple curated vendor links by strain (extendable)
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
};

function mockSearch(q){
  const base = [
    { name:'Blue Dream', lineage:'Blueberry × Haze', thc:18, cbd:1, indicaPct:40, terpenes:['Myrcene','Pinene','Caryophyllene'] },
    { name:'OG Kush', lineage:'Chemdawg × Hindu Kush', thc:20, cbd:0.5, indicaPct:55, terpenes:['Limonene','Myrcene','Caryophyllene'] },
    { name:'Sour Diesel', lineage:'Chemdawg 91 × Super Skunk', thc:19, cbd:0.3, indicaPct:30, terpenes:['Limonene','Myrcene'] }
  ];
  const qq = (q||'').toLowerCase();
  const sorted = base.map(s => ({
      ...s,
      vendors: SEED_VENDORS[s.name]||[],
      source:'mock',
      _score: s.name.toLowerCase().includes(qq)?2:1
    }))
    .sort((a,b)=>b._score-a._score)
    .map(({_score,...s})=>normalize(s));
  return sorted;
}

export async function searchCatalogs({ query }){
  const out = [];

  if(LEAFLY_URL && LEAFLY_KEY){
    const j = await safeFetch(`${LEAFLY_URL}?q=${encodeURIComponent(query)}`, {
      headers:{ Authorization:`Bearer ${LEAFLY_KEY}` }
    });
    if(j?.items?.length){
      j.items.forEach(i=>out.push(normalize({...i, source:'leafly'})));
    }
  }

  if(SEEDF_URL && SEEDF_KEY){
    const j = await safeFetch(`${SEEDF_URL}?q=${encodeURIComponent(query)}`, {
      headers:{ 'x-api-key': SEEDF_KEY }
    });
    if(j?.items?.length){
      j.items.forEach(i=>out.push(normalize({...i, source:'seedfinder'})));
    }
  }

  if(out.length===0) return mockSearch(query);

  const seen = new Set();
  return out.filter(r=>{ const k=r.name.toLowerCase(); if(seen.has(k)) return false; seen.add(k); return true; });
}
