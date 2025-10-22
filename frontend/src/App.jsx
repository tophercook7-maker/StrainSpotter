import { useState, useEffect } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import AgeGate from './components/AgeGate';
import Auth from './components/Auth';
import Scanner from './components/Scanner';
import ScanHistory from './components/ScanHistory';
import DevDashboard from './components/DevDashboard';
import TopNav from './components/TopNav';
import FeedbackChat from './components/FeedbackChat';
import Home from './components/Home';
import GrowerDirectory from './components/GrowerDirectory';
import Groups from './components/Groups';
import { muiThemeOverrides } from './theme/cannabisTheme';
import Seeds from './components/Seeds';
import Dispensaries from './components/Dispensaries';
import GrowerRegistration from './components/GrowerRegistration';
import Help from './components/Help';
import Friends from './components/Friends';
import StrainBrowser from './components/StrainBrowser';
import MembershipJoin from './components/MembershipJoin';
import MembershipAdmin from './components/MembershipAdmin';
import PipelineStatus from './components/PipelineStatus';

// Apply full marijuana-themed design with cannabis leaf icon and hero.png
const theme = createTheme(muiThemeOverrides);

function App() {
  const [ageVerified, setAgeVerified] = useState(false);
  const [currentView, setCurrentView] = useState('home');
  const isDev = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  useEffect(() => {
    const verified = localStorage.getItem('strainspotter_age_verified');
    if (verified === 'true') {
      setAgeVerified(true);
    }
  }, []);

  const handleAgeVerify = () => {
    localStorage.setItem('strainspotter_age_verified', 'true');
    setAgeVerified(true);
  };

  if (!ageVerified) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AgeGate onVerify={handleAgeVerify} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {typeof window !== 'undefined' && !/localhost|127\.0\.0\.1/.test(window.location.host) && /localhost:5181/.test(import.meta.env.VITE_API_BASE || '') && (
        <div style={{ background: '#ff5555', color: '#fff', padding: '6px 12px', textAlign: 'center', fontWeight: 700 }}>
          Warning: Frontend is calling localhost API_BASE. Update VITE_API_BASE or config.js.
        </div>
      )}
      <TopNav current={currentView} onNavigate={setCurrentView} />
      {currentView === 'home' && (
        <Home onNavigate={setCurrentView} />
      )}
      {currentView === 'scanner' && (
        <Scanner onViewHistory={() => setCurrentView('history')} />
      )}
      {currentView === 'guest-scan' && (
        <Scanner onViewHistory={() => setCurrentView('history')} />
      )}
      {currentView === 'history' && (
        <ScanHistory onBack={() => setCurrentView('scanner')} />
      )}
      {currentView === 'dev' && (
        isDev ? <DevDashboard /> : <Help onNavigate={setCurrentView} />
      )}
      {currentView === 'feedback' && (
        <FeedbackChat />
      )}
      {currentView === 'growers' && (
        <GrowerDirectory />
      )}
      {currentView === 'seeds' && (
        <Seeds />
      )}
      {currentView === 'dispensaries' && (
        <Dispensaries />
      )}
      {currentView === 'register' && (
        <GrowerRegistration />
      )}
      {currentView === 'groups' && (
        <Groups />
      )}
      {currentView === 'help' && (
        <Help onNavigate={setCurrentView} />
      )}
      {currentView === 'login' && (
        <Auth />
      )}
      {currentView === 'friends' && (
        <Friends />
      )}
      {currentView === 'strains' && (
        <StrainBrowser onNavigate={setCurrentView} />
      )}
      {currentView === 'join' && (
        <MembershipJoin />
      )}
      {currentView === 'membership-admin' && (
        <MembershipAdmin />
      )}
      {currentView === 'pipeline' && (
        <PipelineStatus />
      )}
    </ThemeProvider>
  );
}

export default App;
