import hero from '../assets/icon-hero.png'
import { useNavigate } from 'react-router-dom'
export default function Home(){
  const nav = useNavigate()
  return (
    <div className="home">
      <h1 className="hero-title">StrainSpotter</h1>
      <img src={hero} alt="Hero" className="hero-icon" />
      <p className="hero-sub">Identify strains, capture photos, search catalogs, and manage your library.</p>
      <section className="tab-grid">
        <button className="tab-card" onClick={()=>nav('/identify')}>
          <div className="tab-title">Identify</div>
          <div className="tab-sub">Match a plant photo</div>
        </button>
        <button className="tab-card" onClick={()=>nav('/capture')}>
          <div className="tab-title">Capture</div>
          <div className="tab-sub">Take or add photos</div>
        </button>
        <button className="tab-card" onClick={()=>nav('/online')}>
          <div className="tab-title">Online</div>
          <div className="tab-sub">Leafly & SeedFinder</div>
        </button>
        <button className="tab-card" onClick={()=>nav('/library')}>
          <div className="tab-title">Library</div>
          <div className="tab-sub">Saved matches</div>
        </button>
      </section>
    </div>
  )
}
