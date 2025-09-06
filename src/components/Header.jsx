import { useNavigate } from 'react-router-dom'
export default function Header(){
  const nav = useNavigate()
  return (
    <header className="topbar">
      <button className="backbtn" onClick={()=>nav(-1)} aria-label="Back">‹ Back</button>
      <div className="topbar-title">StrainSpotter</div>
    </header>
  )
}
