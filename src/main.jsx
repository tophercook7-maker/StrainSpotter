import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import './styles.css'
import Header from './components/Header.jsx'
import FloatingBack from './components/FloatingBack.jsx'
import Home from './pages/Home.jsx'
import Identify from './pages/Identify.jsx'
import Capture from './pages/Capture.jsx'
import Online from './pages/Online.jsx'
import Library from './pages/Library.jsx'
import AgeGate from './pages/AgeGate.jsx'
import Privacy from './pages/Privacy.jsx'

function Shell(){
  const { pathname } = useLocation()
  return (
    <div className="app-wrap">
      <img className="bg-img" src="bg.jpg" alt="" />
      <div className="bg-dim" />
      <div className="content">
        {needsGate ? <AgeGate/> : null}
        <Header/>
        <Routes>
          <Route path="/age" element={<AgeGate/>} />
          <Route path="/" element={<Home/>} />
          <Route path="/identify" element={<Identify/>} />
          <Route path="/capture" element={<Capture/>} />
          <Route path="/online" element={<Online/>} />
          <Route path="/library" element={<Library/>} />
          <Route path="/privacy" element={<Privacy/>} />
          <Route path="*" element={<Home/>} />
        </Routes>
      </div>
      <FloatingBack/>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter basename="/">
    <Shell/>
  </BrowserRouter>
)
