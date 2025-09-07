import { useRef, useState } from 'react'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import { toast } from '../ui/toast'
import { useNavigate } from 'react-router-dom'

async function apiMatch(filename){
  const r = await fetch('/api/match', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ filename }) })
  if(!r.ok) throw new Error('match failed'); return await r.json()
}
async function apiSearch(q){
  const r = await fetch('/api/search?q='+encodeURIComponent(q))
  if(!r.ok) throw new Error('search failed'); const j = await r.json(); return j.items||[]
}

export default function Identify(){
  const fileRef = useRef(null)
  const nav = useNavigate()
  const [imgURL, setImgURL] = useState(null)
  const [busy, setBusy] = useState(false)

  async function runFlow(fakeFile, url){
    try{ await Haptics.impact({ style: ImpactStyle.Light }) }catch{}
    setBusy(true)
    try{
      const guess = await apiMatch(fakeFile.name||'photo.jpg')
      const results = await apiSearch(guess.guess)
      try{ await Haptics.impact({ style: ImpactStyle.Medium }) }catch{}
      nav('/results', { state: { results, guess, photoURL: url } })
    }catch(err){
      await toast('Identify failed. Try again.')
      console.error(err)
    }finally{ setBusy(false) }
  }

  async function onPick(e){
    const f = e.target.files?.[0]; if(!f) return
    const url = URL.createObjectURL(f); setImgURL(url)
    await runFlow(f, url)
  }

  async function onUseCamera(){
    try{
      const photo = await Camera.getPhoto({ resultType: CameraResultType.Uri, source: CameraSource.Camera, quality: 80 })
      const resp = await fetch(photo.webPath); const blob = await resp.blob()
      const file = new File([blob], 'camera.jpg', {type: blob.type || 'image/jpeg'})
      const url = URL.createObjectURL(blob); setImgURL(url)
      await runFlow(file, url)
    }catch{ await toast('Camera canceled or unavailable.') }
  }

  return (
    <div className="screen-pad">
      <h2>Identify</h2>
      <p>Select a plant photo or use the camera to find likely matches.</p>
      <div className="picker-row" style={{display:'flex', gap:10, flexWrap:'wrap'}}>
        <button className="btn" onClick={()=>fileRef.current?.click()} disabled={busy}>{busy ? 'Processing…' : 'Choose Photo'}</button>
        <button className="btn" onClick={onUseCamera} disabled={busy}>Use Camera</button>
        <input ref={fileRef} type="file" accept="image/*" onChange={onPick} style={{display:'none'}} />
      </div>
      {imgURL && (
        <div className="preview">
          <img src={imgURL} alt="Selected" />
          <div className="hint">Searching catalogs based on the photo…</div>
        </div>
      )}
      {busy && <div className="spinner" aria-label="Loading" />}
    </div>
  )
}
