import { useLocation, useNavigate } from 'react-router-dom'
import { Haptics, ImpactStyle } from '@capacitor/haptics'

export default function Results(){
  const nav = useNavigate()
  const { state } = useLocation()
  const data = state?.results || []
  const guess = state?.guess || null
  const photoURL = state?.photoURL || null

  async function onBack(){
    try{ await Haptics.impact({ style: ImpactStyle.Medium }) }catch{}
    nav(-1)
  }

  return (
    <div className="screen-pad" style={{paddingBottom:16}}>
      <h2>Results</h2>
      {photoURL && (
        <div className="preview" style={{marginBottom:12}}>
          <img src={photoURL} alt="Selected" />
        </div>
      )}
      {guess && <div className="hint" style={{marginBottom:10}}>Best guess: <b>{guess.guess}</b> ({Math.round(guess.confidence*100)}% confidence)</div>}
      {data.length===0 && <p>No matches found.</p>}
      <div className="results-list">
        {data.map((s,ix)=>(
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
              <div className="sub">Ratio: {s.indicaPct??'—'}% Indica / {s.sativaPct??(s.indicaPct!=null? 100-s.indicaPct : '—')}% Sativa</div>
            )}
            {s.terpenes?.length>0 && <div className="sub">Terpenes: {s.terpenes.join(', ')}</div>}

            <div style={{display:'flex', gap:8, flexWrap:'wrap', marginTop:8}}>
              {s.leaflyUrl && <a className="btn small" href={s.leaflyUrl} target="_blank" rel="noreferrer">Open on Leafly</a>}
              {s.vendors?.map((v,vi)=>(
                <a key={vi} className="btn small" href={v.url} target="_blank" rel="noreferrer">Buy seeds: {v.name}</a>
              ))}
            </div>

            <div className="src">Source: {s.source}</div>
          </div>
        ))}
      </div>

      <div style={{display:'flex', gap:10, marginTop:12}}>
        <button className="btn" onClick={onBack}>Back</button>
      </div>
    </div>
  )
}
