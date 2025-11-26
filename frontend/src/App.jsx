// DEBUG: Track App.jsx loading
const DEBUG = true;
const debugLog = (...args) => {
  if (DEBUG && typeof window !== 'undefined') {
    console.log('[DEBUG App.jsx]', new Date().toISOString(), ...args);
  }
};

debugLog('=== APP.JSX STARTING ===');
debugLog('About to import React...');

// Ensure React is available before importing MUI
import React, { useState, useEffect, Suspense } from 'react';

debugLog('React imported:', typeof React !== 'undefined');
debugLog('React version:', React?.version || 'unknown');

// Make React available globally before MUI imports
// This MUST happen before any MUI imports to prevent initialization errors
if (typeof window !== 'undefined') {
  debugLog('Setting React globally in App.jsx...');
  debugLog('window.React before:', typeof window.React);
  
  // Set React globally - use direct assignment to avoid readonly errors
  if (!window.React) {
    debugLog('window.React is missing, setting it now');
    window.React = React;
  } else {
    debugLog('window.React already exists');
  }
  
  if (typeof globalThis !== 'undefined' && !globalThis.React) {
    debugLog('Setting React on globalThis');
    globalThis.React = React;
  }
  
  debugLog('window.React after:', typeof window.React, window.React ? 'EXISTS' : 'MISSING');
}

// Now safe to import MUI - React is guaranteed to be available
debugLog('About to import MUI...');
debugLog('React check before MUI import:', typeof React !== 'undefined', typeof window?.React !== 'undefined');

import { ThemeProvider, createTheme, CssBaseline, Box, Button, Typography } from '@mui/material';

debugLog('MUI imported successfully!');
import { AuthProvider } from './contexts/AuthContext';
import { ProModeProvider } from './contexts/ProModeContext';
import MobileOnlyGuard from './components/MobileOnlyGuard';
import AgeGate from './components/AgeGate';
import Auth from './components/Auth';
import { API_BASE } from './config';
import { supabase } from './supabaseClient';
import { muiThemeOverrides } from './theme/cannabisTheme';
import GuidelinesGate from './components/GuidelinesGate';
import ErrorBoundary from './components/ErrorBoundary';
import { logEvent } from './utils/analyticsClient.js';

// Lazy-load ALL heavy components for faster initial boot
const Home = React.lazy(() => import('./components/Home'));
const ScanPage = React.lazy(() => import('./components/ScanPage'));
const HistoryPage = React.lazy(() => import('./components/HistoryPage'));
const AnalyticsDashboard = React.lazy(() => import('./components/AnalyticsDashboard'));
const ScanHistory = React.lazy(() => import('./components/ScanHistory'));
const ScanWizard = React.lazy(() => import('./components/ScanWizard'));
const ScanResultCard = React.lazy(() => import('./components/ScanResultCard'));
const FeedbackChat = React.lazy(() => import('./components/FeedbackChat'));
const GrowerDirectory = React.lazy(() => import('./components/GrowerDirectory'));
const Groups = React.lazy(() => import('./components/Groups'));
const Seeds = React.lazy(() => import('./components/Seeds'));
const Dispensaries = React.lazy(() => import('./components/Dispensaries'));
const GrowerRegistration = React.lazy(() => import('./components/GrowerRegistration'));
const Help = React.lazy(() => import('./components/Help'));
const Friends = React.lazy(() => import('./components/Friends'));
const StrainBrowser = React.lazy(() => import('./components/StrainBrowser'));
const MembershipJoin = React.lazy(() => import('./components/MembershipJoin'));
const GrowCoach = React.lazy(() => import('./components/GrowCoach'));
const MembershipAdmin = React.lazy(() => import('./components/MembershipAdmin'));
const PipelineStatus = React.lazy(() => import('./components/PipelineStatus'));
const ModerationDashboard = React.lazy(() => import('./components/ModerationDashboard'));
const Guidelines = React.lazy(() => import('./components/Guidelines'));
const ErrorViewer = React.lazy(() => import('./components/ErrorViewer'));
const EmergencyLogout = React.lazy(() => import('./components/EmergencyLogout'));
const OnboardingFlow = React.lazy(() => import('./components/OnboardingFlow'));
const FirstRunIntro = React.lazy(() => import('./components/FirstRunIntro'));
const JournalPage = React.lazy(() => import('./components/JournalPage'));
const FloatingScanButton = React.lazy(() => import('./components/FloatingScanButton'));
const ScanBalanceIndicator = React.lazy(() => import('./components/ScanBalanceIndicator'));
const BuyScansModal = React.lazy(() => import('./components/BuyScansModal'));
const AdminStatus = React.lazy(() => import('./components/AdminStatus'));

import PasswordReset from './components/PasswordReset';
// NEW imports:
import { MembershipProvider } from './membership/MembershipContext';
import FeatureGate from './components/FeatureGate';
// Apply full marijuana-themed design with cannabis leaf icon and hero.png
const theme = createTheme(muiThemeOverrides);

function App() {
  debugLog('=== App() FUNCTION CALLED ===');
  
  const [ageVerified, setAgeVerified] = useState(false);
  const [currentView, setCurrentView] = useState('home');
  const [activeScan, setActiveScan] = useState(null);
  const [showIntro, setShowIntro] = useState(() => {
    debugLog('Initializing showIntro state...');
    if (typeof window === 'undefined') {
      return false;
    }
    try {
      const introComplete = localStorage.getItem('ss_intro_complete') !== 'true';
      debugLog('showIntro initial value:', introComplete);
      return introComplete;
    } catch (e) {
      debugLog('Error reading localStorage:', e);
      return false;
    }
  });
  const [showGlobalBuyScans, setShowGlobalBuyScans] = useState(false);
  // Dev-only dashboard removed from navigation

  debugLog('App state initialized - ageVerified:', ageVerified, 'currentView:', currentView);

  useEffect(() => {
    debugLog('App useEffect[0] running...');
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

  useEffect(() => {
    const handler = (event) => {
      if (event?.detail) {
        setCurrentView(event.detail);
      }
    };
    window.addEventListener('nav:set-view', handler);
    return () => window.removeEventListener('nav:set-view', handler);
  }, []);

  useEffect(() => {
    logEvent('app_start', { mode: import.meta.env.MODE, apiBase: API_BASE });
  }, []);

  // Stay on Home by default; no auto-redirect to Scanner so users see actions clearly

  const handleAgeVerify = () => {
    localStorage.setItem('strainspotter_age_verified', 'true');
    setAgeVerified(true);
  };

  debugLog('App render - ageVerified:', ageVerified);
  
  if (!ageVerified) {
    debugLog('Rendering AgeGate...');
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AgeGate onVerify={handleAgeVerify} />
      </ThemeProvider>
    );
  }

  debugLog('Rendering main App UI...');
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <ProModeProvider>
          <MembershipProvider>
            <MobileOnlyGuard>
          {/* Global background layer - clean, solid background for Apple inspections */}
          <div style={{
            position: 'fixed', 
            inset: 0, 
            zIndex: 0,
            width: '100vw',
            maxWidth: '100vw',
            overflow: 'hidden',
            backgroundColor: 'transparent', // Transparent to show background image
          }} />
          <ErrorBoundary>
            <GuidelinesGate>
          {typeof window !== 'undefined' && !/localhost|127\.0\.0\.1/.test(window.location.host) && /localhost:5181/.test(import.meta.env.VITE_API_BASE || '') && (
            <div style={{ background: '#ff5555', color: '#fff', padding: '6px 12px', textAlign: 'center', fontWeight: 700 }}>
              Warning: Frontend is calling localhost API_BASE. Update VITE_API_BASE or config.js.
            </div>
          )}
          {/* No navigation bar - all actions are on-screen buttons */}
          <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '100vw', overflowX: 'hidden', overflow: currentView === 'home' ? 'visible' : 'hidden', left: 0, right: 0 }}>
            <Suspense fallback={null}>
              <OnboardingFlow />
            </Suspense>
            <Suspense fallback={null}>
              <FirstRunIntro
                open={showIntro}
                onFinish={() => {
                  try {
                    localStorage.setItem('ss_intro_complete', 'true');
                  } catch {
                    // Ignore localStorage errors
                  }
                  setShowIntro(false);
                  setCurrentView('home');
                }}
              />
            </Suspense>
            <Suspense fallback={null}>
              <ScanBalanceIndicator onBuyCredits={() => setShowGlobalBuyScans(true)} />
            </Suspense>
            {currentView === 'home' && (
              <Suspense fallback={null}>
                <Home onNavigate={setCurrentView} />
              </Suspense>
            )}
            {['scanner', 'guest-scan', 'scan'].includes(currentView) && (
              <Suspense
                fallback={
                  <div style={{ padding: 16, color: '#C5E1A5' }}>
                    Opening scanner…
                  </div>
                }
              >
                <ScanPage
                  onBack={() => setCurrentView('home')}
                  onNavigate={(view) => setCurrentView(view)}
                  onScanComplete={(scan) => {
                    setActiveScan(scan);
                    setCurrentView('result');
                  }}
                />
              </Suspense>
            )}
            {currentView === 'wizard' && (
              <Suspense fallback={<div style={{ padding: 16, color: '#C5E1A5' }}>Loading scanner...</div>}>
                <ScanWizard
                  onBack={() => setCurrentView('home')}
                  onScanComplete={(scan) => {
                    setActiveScan(scan);
                    setCurrentView('result');
                  }}
                />
              </Suspense>
            )}
            {currentView === 'result' && activeScan && (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100vh',
                  width: '100%',
                  maxWidth: '100vw',
                  overflow: 'hidden',
                  overflowX: 'hidden',
                  bgcolor: 'transparent', // Transparent to show background image
                }}
              >
                {/* Fixed header with back button */}
                <Box
                  sx={{
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 2,
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    bgcolor: 'rgba(0,0,0,0.3)',
                    backdropFilter: 'blur(8px)',
                    zIndex: 1,
                  }}
                >
                  <Button
                    variant="text"
                    onClick={() => setCurrentView('home')}
                    sx={{ color: '#fff', minWidth: 'auto', px: 1 }}
                  >
                    ← Back
                  </Button>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#fff', flex: 1 }}>
                    Scan Result
                  </Typography>
                </Box>

                {/* Scrollable content */}
                <Box
                  sx={{
                    flex: 1,
                    minHeight: 0,
                    width: '100%',
                    maxWidth: '100vw',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    WebkitOverflowScrolling: 'touch',
                    left: 0,
                    right: 0,
                    position: 'relative',
                    paddingBottom: 'calc(env(safe-area-inset-bottom) + 80px)',
                    px: 2,
                    py: 2,
                  }}
                >
                  {!activeScan ? (
                    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Preparing your result…
                      </Typography>
                    </Box>
                  ) : (
                    <Suspense fallback={<div style={{ padding: 16, color: '#C5E1A5' }}>Loading result...</div>}>
                      <ScanResultCard
                        scan={activeScan}
                        result={activeScan}
                        isGuest={false}
                      />
                    </Suspense>
                  )}
                </Box>
              </Box>
            )}
            {/* LOGBOOK-style view: gate for non-members */}
            {currentView === 'history' && (
              <FeatureGate featureKey="logbook">
                <Suspense fallback={<div style={{ padding: 16, color: '#C5E1A5' }}>Loading history...</div>}>
                  <ScanHistory
                    onBack={() => setCurrentView('home')}
                    onSelectScan={(scan) => {
                      setActiveScan(scan);
                      setCurrentView('result');
                    }}
                  />
                </Suspense>
              </FeatureGate>
            )}
            {currentView === 'feedback' && (
              <Suspense fallback={<div style={{ padding: 16, color: '#C5E1A5' }}>Loading feedback...</div>}>
                <FeedbackChat onBack={() => setCurrentView('home')} />
              </Suspense>
            )}
            {/* GARDEN-style: grower directory / registration / groups */}
            {currentView === 'growers' && (
              <FeatureGate featureKey="garden">
                <Suspense fallback={<div style={{ padding: 16, color: '#C5E1A5' }}>Loading directory...</div>}>
                  <GrowerDirectory onNavigate={setCurrentView} onBack={() => setCurrentView('home')} />
                </Suspense>
              </FeatureGate>
            )}
            {currentView === 'register' && (
              <FeatureGate featureKey="garden">
                <Suspense fallback={<div style={{ padding: 16, color: '#C5E1A5' }}>Loading registration...</div>}>
                  <GrowerRegistration onBack={() => setCurrentView('home')} />
                </Suspense>
              </FeatureGate>
            )}
            {currentView === 'groups' && (
              <FeatureGate featureKey="garden">
                <Suspense fallback={<div style={{ padding: 16, color: '#C5E1A5' }}>Loading groups...</div>}>
                  <Groups onNavigate={setCurrentView} onBack={() => setCurrentView('home')} />
                </Suspense>
              </FeatureGate>
            )}
            {currentView === 'friends' && (
              <FeatureGate featureKey="garden">
                <Suspense fallback={<div style={{ padding: 16, color: '#C5E1A5' }}>Loading friends...</div>}>
                  <Friends onBack={() => setCurrentView('home')} />
                </Suspense>
              </FeatureGate>
            )}
            {/* REVIEWS-style: seeds / dispensaries / strains browser */}
            {currentView === 'seeds' && (
              <FeatureGate featureKey="reviews">
                <Suspense fallback={<div style={{ padding: 16, color: '#C5E1A5' }}>Loading seeds...</div>}>
                  <Seeds onBack={() => setCurrentView('home')} />
                </Suspense>
              </FeatureGate>
            )}
            {currentView === 'dispensaries' && (
              <FeatureGate featureKey="reviews">
                <Suspense fallback={<div style={{ padding: 16, color: '#C5E1A5' }}>Loading dispensaries...</div>}>
                  <Dispensaries onBack={() => setCurrentView('home')} />
                </Suspense>
              </FeatureGate>
            )}
            {currentView === 'grow-coach' && (
              <Suspense fallback={<div style={{ padding: 16, color: '#C5E1A5' }}>Loading grow coach...</div>}>
                <GrowCoach onBack={() => setCurrentView('home')} />
              </Suspense>
            )}
            {currentView === 'membership-join' && (
              <Suspense fallback={<div style={{ padding: 16, color: '#C5E1A5' }}>Loading membership...</div>}>
                <MembershipJoin onBack={() => setCurrentView('home')} />
              </Suspense>
            )}
            {currentView === 'help' && (
              <Suspense fallback={<div style={{ padding: 16, color: '#C5E1A5' }}>Loading help...</div>}>
                <Help onNavigate={setCurrentView} onBack={() => setCurrentView('home')} />
              </Suspense>
            )}
            {currentView === 'login' && (
              <Auth onBack={() => setCurrentView('home')} />
            )}
            {currentView === 'admin-status' && (
              <Suspense fallback={<div style={{ padding: 16, color: '#C5E1A5' }}>Loading admin...</div>}>
                <AdminStatus onBack={() => setCurrentView('home')} onNavigate={setCurrentView} />
              </Suspense>
            )}
            {currentView === 'journal' && (
              <Suspense fallback={<div style={{ padding: 16, color: '#C5E1A5' }}>Loading journal...</div>}>
                <JournalPage onBack={() => setCurrentView('home')} />
              </Suspense>
            )}
            {currentView === 'strains' && (
              <FeatureGate featureKey="reviews">
                <Suspense fallback={<div style={{ padding: 16, color: '#C5E1A5' }}>Loading strains...</div>}>
                  <StrainBrowser onNavigate={setCurrentView} />
                </Suspense>
              </FeatureGate>
            )}
            {currentView === 'membership-admin' && (
              <Suspense fallback={<div style={{ padding: 16, color: '#C5E1A5' }}>Loading admin...</div>}>
                <MembershipAdmin onBack={() => setCurrentView('home')} />
              </Suspense>
            )}
            {currentView === 'pipeline' && (
              <Suspense fallback={<div style={{ padding: 16, color: '#C5E1A5' }}>Loading pipeline...</div>}>
                <PipelineStatus onBack={() => setCurrentView('home')} />
              </Suspense>
            )}
            {currentView === 'moderation' && (
              <Suspense fallback={<div style={{ padding: 16, color: '#C5E1A5' }}>Loading moderation...</div>}>
                <ModerationDashboard onBack={() => setCurrentView('home')} />
              </Suspense>
            )}
            {currentView === 'guidelines' && (
              <Suspense fallback={<div style={{ padding: 16, color: '#C5E1A5' }}>Loading guidelines...</div>}>
                <Guidelines onBack={() => setCurrentView('home')} />
              </Suspense>
            )}
            {currentView === 'reset' && (
              <PasswordReset onBack={() => setCurrentView('home')} />
            )}
            {currentView === 'errors' && (
              <Suspense fallback={<div style={{ padding: 16, color: '#C5E1A5' }}>Loading errors...</div>}>
                <ErrorViewer onBack={() => setCurrentView('home')} />
              </Suspense>
            )}
            {currentView === 'emergency-logout' && (
              <Suspense fallback={<div style={{ padding: 16, color: '#C5E1A5' }}>Loading...</div>}>
                <EmergencyLogout />
              </Suspense>
            )}
            {currentView === 'analytics' && (
              <Suspense fallback={null}>
                <AnalyticsDashboard onBack={() => setCurrentView('home')} />
              </Suspense>
            )}
            {currentView === 'history' && (
              <Suspense fallback={null}>
                <HistoryPage onBack={() => setCurrentView('home')} />
              </Suspense>
            )}
            <Suspense fallback={null}>
              {/* FloatingScanButton removed per user request */}
            </Suspense>
          </div>
        </GuidelinesGate>
      </ErrorBoundary>
        </MobileOnlyGuard>
        <Suspense fallback={null}>
          <BuyScansModal open={showGlobalBuyScans} onClose={() => setShowGlobalBuyScans(false)} />
        </Suspense>
          </MembershipProvider>
        </ProModeProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
