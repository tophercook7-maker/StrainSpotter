import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export default function TopBar(){
  const nav = useNavigate()
  const loc = useLocation()
  if (loc.pathname === '/') return null

  const [canBack,setCanBack] = useState(false)
  useEffect(()=>{ setCanBack(window.history.length > 1 && loc.pathname !== '/') },[loc])

  return (
    <div className="topbar">
      <button type="button" className="navbtn" onClick={()=> canBack ? nav(-1) : nav('/')}>
        {canBack ? 'Back' : 'Home'}
      </button>
      <div className="title">StrainSpotter</div>
      <div className="spacer" />
    </div>
  )
}
