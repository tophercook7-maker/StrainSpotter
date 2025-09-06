import { useNavigate } from 'react-router-dom'

export default function Home(){
  const nav = useNavigate()
  return (
    <div className="screen-pad">
      <h1 className="brand">StrainSpotter</h1>

      {/* Hero stays as-is via your bg.jpg + layout */}

      <div className="home-actions">
        <button className="btn-big" onClick={()=>nav('/identify')}>Identify</button>
        <button className="btn-big" onClick={()=>nav('/capture')}>Capture</button>
        <button className="btn-big" onClick={()=>nav('/online')}>Online</button>
        <button className="btn-big" onClick={()=>nav('/library')}>Library</button>
      </div>
    </div>
  )
}
