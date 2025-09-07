import { useEffect, useState } from 'react'
import { Preferences } from '@capacitor/preferences'
import { Share } from '@capacitor/share'

export default function Library(){
  const [items, setItems] = useState([])
  useEffect(()=>{
    (async ()=>{
      const { value } = await Preferences.get({ key:'library' })
      setItems(value ? JSON.parse(value) : [])
    })()
  }, [])
  async function clearAll(){
    await Preferences.set({ key:'library', value: JSON.stringify([]) })
    setItems([])
  }
  async function shareItem(it){
    try{
      await Share.share({ title: `Strain: ${it.name}`, text: `${it.name} — THC ${it.thc??'?' }% / ${it.indicaPct??'?' }% Indica`, url: it.leaflyUrl||undefined, dialogTitle:'Share strain'})
    }catch{}
  }
  return (
    <div className="screen-pad">
      <h2>Library</h2>
      {items.length===0 && <p>No saved items yet.</p>}
      <div className="results-list">
        {items.map((s,ix)=>(
          <div key={ix} className="strain-card">
            <div className="strain-row">
              <div className="strain-name">{s.name}</div>
              <div style={{display:'flex', gap:6}}>
                {typeof s.thc==='number' && <div className="pill">THC {s.thc}%</div>}
                {typeof s.cbd==='number' && <div className="pill">CBD {s.cbd}%</div>}
              </div>
            </div>
            <div className="sub">Lineage: {s.lineage}</div>
            {(s.indicaPct!=null || s.sativaPct!=null) && (
              <div className="sub">Ratio: {s.indicaPct??'—'}% Indica / {s.sativaPct??(s.indicaPct!=null?100-s.indicaPct:'—')}% Sativa</div>
            )}
            <div style={{display:'flex', gap:8, marginTop:8, flexWrap:'wrap'}}>
              {s.leaflyUrl && <a className="btn small" href={s.leaflyUrl} target="_blank" rel="noreferrer">Open on Leafly</a>}
              <button className="btn small" onClick={()=>shareItem(s)}>Share</button>
            </div>
          </div>
        ))}
      </div>
      {items.length>0 && <button className="btn" style={{marginTop:12}} onClick={clearAll}>Clear Library</button>}
    </div>
  )
}
