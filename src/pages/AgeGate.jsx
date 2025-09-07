import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function AgeGate(){
  const nav = useNavigate()
  const [seen, setSeen] = useState(false)
  useEffect(()=>{
    const ok = localStorage.getItem('age_verified')==='yes'
    if(ok){ nav('/', { replace:true }) } else { setSeen(true) }
  }, [nav])
  if(!seen) return null
  return (
    <div className="screen-pad" style={{textAlign:'center'}}>
      <h2>21+ Only</h2>
      <p>This app provides information about cannabis strains.</p>
      <div style={{display:'flex', gap:10, justifyContent:'center', marginTop:12}}>
        <button className="btn" onClick={()=>{ localStorage.setItem('age_verified','yes'); nav('/', {replace:true}) }}>I am 21+</button>
        <button className="btn" onClick={()=>{ localStorage.setItem('age_verified','no'); alert('You must be 21+'); }}>I am under 21</button>
      </div>
      <p style={{marginTop:10, opacity:.8}}>See our <a href="/privacy" className="link">Privacy</a></p>
    </div>
  )
}
