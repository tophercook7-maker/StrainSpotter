import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export default function BottomBar(){
  const nav = useNavigate()
  const loc = useLocation()
  const [canBack,setCanBack] = useState(false)
  useEffect(()=>{ setCanBack(window.history.length > 1 && loc.pathname !== '/') },[loc])

  return (
    <div className="bottombar">
      <button className="bb-btn" onClick={()=> canBack ? nav(-1) : nav('/')}>
        {canBack ? 'Back' : 'Home'}
      </button>
      <button className="bb-btn" onClick={()=> nav('/')}>Home</button>
    </div>
  )
}
