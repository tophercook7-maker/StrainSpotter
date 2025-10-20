import { useState, useEffect } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import AgeGate from './components/AgeGate';
import Scanner from './components/Scanner';
import ScanHistory from './components/ScanHistory';
import DevDashboard from './components/DevDashboard';
import TopNav from './components/TopNav';
import FeedbackChat from './components/FeedbackChat';
import Home from './components/Home';
import GrowerDirectory from './components/GrowerDirectory';
import Groups from './components/Groups';

// Full cannabis-themed design (refined "Apple-quality" aesthetic)
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#4caf50', // Cannabis green
      light: '#81c784',
      dark: '#2e7d32',
    },
    secondary: {
      main: '#8bc34a', // Lighter green
      light: '#aed581',
      dark: '#558b2f',
    },
    background: {
      default: '#0b120b',
      paper: '#162116',
    },
    success: {
      main: '#66bb6a',
    },
  },
  typography: {
    fontFamily: 'SF Pro Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    h3: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 600,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'linear-gradient(135deg, rgba(22,33,22,0.9) 0%, rgba(12,27,12,1) 100%)',
          borderRadius: 16,
          border: '1px solid rgba(76,175,80,0.18)'
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          textTransform: 'none',
          paddingLeft: 18,
          paddingRight: 18,
          boxShadow: '0 10px 20px rgba(76,175,80,0.15)',
        },
      },
    },
  },
});

function App() {
  const [ageVerified, setAgeVerified] = useState(false);
  const [currentView, setCurrentView] = useState('home');

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
      <TopNav current={currentView} onNavigate={setCurrentView} />
      {currentView === 'home' && (
        <Home onNavigate={setCurrentView} />
      )}
      {currentView === 'scanner' && (
        <Scanner onViewHistory={() => setCurrentView('history')} />
      )}
      {currentView === 'history' && (
        <ScanHistory onBack={() => setCurrentView('scanner')} />
      )}
      {currentView === 'dev' && (
        <DevDashboard />
      )}
      {currentView === 'feedback' && (
        <FeedbackChat />
      )}
      {currentView === 'growers' && (
        <GrowerDirectory />
      )}
      {currentView === 'groups' && (
        <Groups />
      )}
    </ThemeProvider>
  );
}

export default App;
