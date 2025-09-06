import { useLocation, useNavigate } from 'react-router-dom'

export default function FloatingBack(){
  const nav = useNavigate()
  const { pathname } = useLocation()
  if (pathname === '/') return null   // hide on Home
  return (
    <button className="floatBack" onClick={()=>nav(-1)} aria-label="Back">
      ‹ Back
    </button>
  )
}
