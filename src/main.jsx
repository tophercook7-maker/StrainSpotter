import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import './styles.css'
import Header from './components/Header.jsx'
import Home from './pages/Home.jsx'
import Identify from './pages/Identify.jsx'
import Capture from './pages/Capture.jsx'
import Online from './pages/Online.jsx'
import Library from './pages/Library.jsx'

function App(){
  return (
    <div className="app-wrap">
      <img className="bg-img" src="bg.jpg" alt="" />
      <div className="bg-dim" />
      <Header/>
      <div className="content">
        <Routes>
          <Route path="/" element={<Home/>} />
          <Route path="/identify" element={<Identify/>} />
          <Route path="/capture" element={<Capture/>} />
          <Route path="/online" element={<Online/>} />
          <Route path="/library" element={<Library/>} />
          <Route path="*" element={<Home/>} />
        </Routes>
      </div>
      <nav className="bottombar">
        <Link className="tab" to="/">Home</Link>
        <Link className="tab" to="/identify">Identify</Link>
        <Link className="tab" to="/online">Online</Link>
        <Link className="tab" to="/library">Library</Link>
      </nav>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter basename="/">
    <App/>
  </BrowserRouter>
)
