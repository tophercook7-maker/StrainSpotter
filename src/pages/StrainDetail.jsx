import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { leafly, seedfinder, wikileaf, allbud, images } from '../utils/providers'
import { openInApp } from '../utils/open'
import { searchStrains } from '../utils/strainSearch'
import StrainCard from '../components/StrainCard'

export default function StrainDetail(){
  const nav = useNavigate()
  const [sp] = useSearchParams()
  const [q,setQ] = useState(sp.get('q') || '')
  const [local,setLocal] = useState([])

  useEffect(()=>{ if(!q) setQ('cannabis strain') },[])
  useEffect(()=>{ setLocal(searchStrains(q, 8)) },[q])

  const links = useMemo(()=>[
    { name:'Leafly', url: leafly(q) },
    { name:'SeedFinder', url: seedfinder(q) },
    { name:'Wikileaf', url: wikileaf(q) },
    { name:'AllBud', url: allbud(q) },
    { name:'Images', url: images(q) },
  ],[q])

  return (
    <div className="page">
      <h2 style={{marginBottom:6}}>Strain Detail</h2>
      <div className="card" style={{marginBottom:10}}>
        <label style={{display:'block',fontSize:12,opacity:.8,marginBottom:6}}>Query / Strain</label>
        <div className="row" style={{gap:8, alignItems:'stretch', flexWrap:'wrap'}}>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="e.g., Blue Dream" />
          <button onClick={()=>nav(`/online?q=${encodeURIComponent(q)}`)}>Web</button>
        </div>
      </div>

      {local.length > 0 && (
        <div className="card" style={{marginBottom:12}}>
          <div style={{marginBottom:8, fontWeight:700}}>Local matches</div>
          <div className="grid" style={{gridTemplateColumns:'1fr', gap:8}}>
            {local.map((it,idx)=>(
              <StrainCard key={it.name+idx} item={it} onOpen={()=>openInApp(leafly(it.name))}/>
            ))}
          </div>
        </div>
      )}

      <div className="grid" style={{gridTemplateColumns:'1fr 1fr', gap:10}}>
        {links.map(x=>(
          <button key={x.name} className="tab-card" onClick={()=>openInApp(x.url)}>
            <div className="tab-title">{x.name}</div>
            <div className="tab-sub">Open {x.name}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
