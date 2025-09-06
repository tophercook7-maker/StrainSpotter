import { useState } from 'react'
import { searchOnlineByName } from '../api/online'
export default function IdentifyOnline(){
  const [q, setQ] = useState('Blue Dream')
  const [links, setLinks] = useState([])
  async function run(){ const r = await searchOnlineByName(q); setLinks(r) }
  return (
    <div className="card">
      <h2>Online Catalog Search</h2>
      <div className="row" style={{flexWrap:'wrap',gap:8}}>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Strain name"/>
        <button onClick={run}>Search</button>
      </div>
      <div className="grid" style={{marginTop:12}}>
        {links.map((l,i)=>(<a key={i} href={l.url} target="_blank" rel="noreferrer">{l.label}</a>))}
      </div>
    </div>
  )
}
