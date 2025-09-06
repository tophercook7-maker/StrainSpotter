import { useRef, useState } from 'react'

export default function Identify(){
  const fileRef = useRef(null)
  const [imgURL, setImgURL] = useState(null)

  function onPick(e){
    const f = e.target.files?.[0]
    if(!f) return
    const url = URL.createObjectURL(f)
    setImgURL(url)
    // TODO: run model / send to backend for matching
  }

  return (
    <div className="screen-pad">
      <h2>Identify</h2>
      <p>Select a plant photo to begin matching.</p>

      <div className="picker-row">
        <button className="btn" onClick={()=>fileRef.current?.click()}>Choose Photo</button>
        <input ref={fileRef} type="file" accept="image/*" onChange={onPick} style={{display:'none'}} />
      </div>

      {imgURL && (
        <div className="preview">
          <img src={imgURL} alt="Selected" />
          <div className="hint">Next: run match against catalogs.</div>
        </div>
      )}
    </div>
  )
}
