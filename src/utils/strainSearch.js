import Fuse from 'fuse.js'
import db from '../data/strains.json'

const norms = s => (s||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
const expanded = db.map(d => ({
  ...d,
  _haystack: [
    d.name,
    ...(d.aliases||[]),
    ...(d.parents||[]),
    (d.notes||'')
  ].join(' ').toLowerCase()
}))

const fuse = new Fuse(expanded, {
  includeScore: true,
  threshold: 0.32,
  ignoreLocation: true,
  keys: [
    { name:'name', weight: 0.6 },
    { name:'aliases', weight: 0.25 },
    { name:'parents', weight: 0.1 },
    { name:'notes', weight: 0.05 },
    { name:'_haystack', weight: 0.2 }
  ],
})

export function searchStrains(q, limit=12){
  if(!q || !q.trim()) return []
  const qq = norms(q)
  return fuse.search(qq).slice(0,limit).map(r=>({ score:r.score, ...r.item }))
}
export function allStrains(){ return db }
