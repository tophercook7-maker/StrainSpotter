import { useState, useEffect } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import MobileOnlyGuard from './components/MobileOnlyGuard';
import AgeGate from './components/AgeGate';
import Auth from './components/Auth';
import Scanner from './components/Scanner';
import ScanHistory from './components/ScanHistory';
import ScanWizard from './components/ScanWizard';
// Navigation components removed in favor of on-screen action buttons
import FeedbackChat from './components/FeedbackChat';
import { API_BASE } from './config';
import { supabase } from './supabaseClient';
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
import GrowCoach from './components/GrowCoach';
import MembershipAdmin from './components/MembershipAdmin';
import PipelineStatus from './components/PipelineStatus';
import ModerationDashboard from './components/ModerationDashboard';
import Guidelines from './components/Guidelines';
import GuidelinesGate from './components/GuidelinesGate';
import ErrorViewer from './components/ErrorViewer';
import ErrorBoundary from './components/ErrorBoundary';
import EmergencyLogout from './components/EmergencyLogout';
import OnboardingFlow from './components/OnboardingFlow';

import PasswordReset from './components/PasswordReset';
// Apply full marijuana-themed design with cannabis leaf icon and hero.png
const theme = createTheme(muiThemeOverrides);

function App() {
  const [ageVerified, setAgeVerified] = useState(false);
  const [currentView, setCurrentView] = useState('home');
  // Dev-only dashboard removed from navigation

  useEffect(() => {
    const verified = localStorage.getItem('strainspotter_age_verified');
    if (verified === 'true') {
      setAgeVerified(true);
    }
    // Handle Supabase auth redirect hashes for recovery/magic link
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash;
      if (hash === '#/emergency-logout') {
        setCurrentView('emergency-logout');
      } else if (/type=recovery/.test(hash)) {
        setCurrentView('reset');
        // DON'T clear hash yet - Supabase needs it to establish the recovery session
        // The PasswordReset component will handle it
      } else if (/access_token=/.test(hash)) {
        // Signed in via magic link; go home
        setCurrentView('home');
        // Ensure user record exists immediately after magic link
        // Grab the session and call backend /api/users/ensure with id + email
        (async () => {
          try {
            const { data } = await supabase.auth.getSession();
            const user = data?.session?.user;
            if (user?.id) {
              const email = user.email || undefined;
              const username = email ? email.split('@')[0] : undefined;
              await fetch(`${API_BASE}/api/users/ensure`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.id, email, username })
              });
            }
          } catch (e) {
            console.warn('[onboard] ensure user after magic link failed:', e);
          }
        })();
        // Clean up hash after magic link to avoid re-triggering
        setTimeout(() => {
          history.replaceState(null, '', window.location.pathname + window.location.search);
        }, 1000);
      }
    }
  }, []);

  // Stay on Home by default; no auto-redirect to Scanner so users see actions clearly

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
      <AuthProvider>
        <MobileOnlyGuard>
          {/* Global background layer - restored, no dark filter or overlay */}
          <div style={{
            position: 'fixed', inset: 0, zIndex: 0,
            backgroundImage: 'url(/strainspotter-bg.jpg)',
            backgroundSize: 'cover', backgroundPosition: 'center'
          }} />
          <ErrorBoundary>
            <GuidelinesGate>
          {typeof window !== 'undefined' && !/localhost|127\.0\.0\.1/.test(window.location.host) && /localhost:5181/.test(import.meta.env.VITE_API_BASE || '') && (
            <div style={{ background: '#ff5555', color: '#fff', padding: '6px 12px', textAlign: 'center', fontWeight: 700 }}>
              Warning: Frontend is calling localhost API_BASE. Update VITE_API_BASE or config.js.
            </div>
          )}
          {/* No navigation bar - all actions are on-screen buttons */}
          <div style={{ position: 'relative', zIndex: 10 }}>
            <OnboardingFlow />
            {currentView === 'home' && (
              <Home onNavigate={setCurrentView} />
            )}
            {currentView === 'scanner' && (
              <Scanner onViewHistory={() => setCurrentView('history')} onBack={() => setCurrentView('home')} />
            )}
            {currentView === 'guest-scan' && (
              <Scanner onViewHistory={() => setCurrentView('history')} onBack={() => setCurrentView('home')} />
            )}
            {currentView === 'wizard' && (
              <ScanWizard onBack={() => setCurrentView('home')} />
            )}
            {currentView === 'history' && (
              <ScanHistory onBack={() => setCurrentView('home')} />
            )}
            {currentView === 'feedback' && (
              <FeedbackChat onBack={() => setCurrentView('home')} />
            )}
            {currentView === 'growers' && (
              <GrowerDirectory onNavigate={setCurrentView} onBack={() => setCurrentView('home')} />
            )}
            {currentView === 'seeds' && (
              <Seeds onBack={() => setCurrentView('home')} />
            )}
            {currentView === 'dispensaries' && (
              <Dispensaries onBack={() => setCurrentView('home')} />
            )}
            {currentView === 'register' && (
              <GrowerRegistration onBack={() => setCurrentView('home')} />
            )}
            {currentView === 'groups' && (
              <Groups onNavigate={setCurrentView} onBack={() => setCurrentView('home')} />
            )}
            {currentView === 'grow-coach' && (
              <GrowCoach onBack={() => setCurrentView('home')} />
            )}
            {currentView === 'membership-join' && (
              <MembershipJoin onBack={() => setCurrentView('home')} />
            )}
            {currentView === 'help' && (
              <Help onNavigate={setCurrentView} onBack={() => setCurrentView('home')} />
            )}
            {currentView === 'login' && (
              <Auth onBack={() => setCurrentView('home')} />
            )}
            {currentView === 'friends' && (
              <Friends onBack={() => setCurrentView('home')} />
            )}
            {currentView === 'strains' && (
              <StrainBrowser onNavigate={setCurrentView} />
            )}
            {currentView === 'membership-admin' && (
              <MembershipAdmin onBack={() => setCurrentView('home')} />
            )}
            {currentView === 'pipeline' && (
              <PipelineStatus onBack={() => setCurrentView('home')} />
            )}
            {currentView === 'moderation' && (
              <ModerationDashboard onBack={() => setCurrentView('home')} />
            )}
            {currentView === 'guidelines' && (
              <Guidelines onBack={() => setCurrentView('home')} />
            )}
            {currentView === 'reset' && (
              <PasswordReset onBack={() => setCurrentView('home')} />
            )}
            {currentView === 'errors' && (
              <ErrorViewer onBack={() => setCurrentView('home')} />
            )}
            {currentView === 'emergency-logout' && (
              <EmergencyLogout />
            )}
          </div>
        </GuidelinesGate>
      </ErrorBoundary>
        </MobileOnlyGuard>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
