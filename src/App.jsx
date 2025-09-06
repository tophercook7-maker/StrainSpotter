import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Capture from './pages/Capture.jsx'
import Library from './pages/Library.jsx'
import Identify from './pages/Identify.jsx'
import IdentifyOnline from './pages/IdentifyOnline.jsx'
import AgeGate, { isAgeOk } from './pages/AgeGate.jsx'
import { StoreProvider } from './store.jsx'

function HomeFab(){
  const nav = useNavigate()
  const { pathname } = useLocation()
  if (pathname === '/') return null
  return (
    <button className="home-fab" onClick={()=>nav('/')}>
      Home
    </button>
  )
}

export default function App(){
  if(!isAgeOk()) return <AgeGate/>
  return (
    <div className="app">
      <StoreProvider>
        <HomeFab/>
        <main className="main">
          <Routes>
            <Route path="/" element={<Home/>}/>
            <Route path="/capture" element={<Capture/>}/>
            <Route path="/identify" element={<Identify/>}/>
            <Route path="/online" element={<IdentifyOnline/>}/>
            <Route path="/library" element={<Library/>}/>
          </Routes>
        </main>
      </StoreProvider>
    </div>
  )
}
