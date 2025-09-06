import { useLocation, useNavigate } from 'react-router-dom'

export default function BottomBack(){
  const { pathname } = useLocation()
  const nav = useNavigate()
  if (pathname === '/') return null
  return (
    <button className="backbottom" onClick={()=>nav(-1)} aria-label="Back">‹ Back</button>
  )
}
