// DEBUG: Track module loading (disabled in production for performance)
const DEBUG = import.meta.env.DEV;
const debugLog = (...args) => {
  if (DEBUG && typeof window !== 'undefined') {
    console.log('[DEBUG]', new Date().toISOString(), ...args);
  }
};

debugLog('=== MAIN.JSX STARTING ===');
debugLog('Window available:', typeof window !== 'undefined');
debugLog('Location:', typeof window !== 'undefined' ? window.location?.href : 'N/A');

// Import React first to ensure it's loaded before anything else
debugLog('Importing React...');
import React, { Suspense, useState, useEffect } from 'react'
import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import ErrorBoundary from './ErrorBoundary.jsx';

debugLog('React imported:', typeof React !== 'undefined');
debugLog('ReactDOM imported:', typeof ReactDOM !== 'undefined');

// Ensure React is available globally BEFORE any other imports that might need it
// This is critical for MUI and other React-dependent libraries
// Set it immediately and ensure it's not overwritten
if (typeof window !== 'undefined') {
  debugLog('Setting React globally...');
  // Set React globally immediately
  window.React = React;
  window.ReactDOM = ReactDOM;
  
  debugLog('React set on window:', typeof window.React !== 'undefined');
  
  // Also set it on the global object for ES modules that might check there
  if (typeof globalThis !== 'undefined') {
    globalThis.React = React;
    globalThis.ReactDOM = ReactDOM;
    debugLog('React set on globalThis:', typeof globalThis.React !== 'undefined');
  }
  
  // Ensure React is available before any module evaluation
  try {
    Object.defineProperty(window, 'React', {
      value: React,
      writable: false,
      configurable: false
    });
    debugLog('React property defined on window');
  } catch (e) {
    debugLog('Error defining React property:', e);
  }
  
  debugLog('Final check - window.React:', typeof window.React, window.React ? 'EXISTS' : 'MISSING');
}

// Lazy-load components for faster initial boot
// Ensure React is available before lazy-loading App (which imports MUI)
const App = React.lazy(() => {
  debugLog('=== LAZY LOADING APP ===');
  debugLog('React available:', typeof React !== 'undefined');
  debugLog('window.React available:', typeof window !== 'undefined' && typeof window.React !== 'undefined');
  
  // Ensure React is available before importing App
  if (typeof window !== 'undefined' && !window.React) {
    debugLog('Setting window.React in lazy loader');
    window.React = React;
  }
  
  debugLog('Importing App.jsx...');
  const startTime = Date.now();
  return import('./App.jsx').then(module => {
    const loadTime = Date.now() - startTime;
    debugLog(`App.jsx loaded successfully in ${loadTime}ms`);
    debugLog('App module:', Object.keys(module));
    return module;
  }).catch(error => {
    debugLog('ERROR loading App.jsx:', error);
    debugLog('Error details:', error.message, error.stack);
    console.error('[CRITICAL] Failed to load App.jsx:', error);
    throw error;
  });
});
const WebLanding = React.lazy(() => import('./components/WebLanding.jsx'));
const WebAppShell = React.lazy(() => import('./components/WebAppShell.jsx'));

// Lazy-load SpeedInsights only for web (not Capacitor)
const SpeedInsights = React.lazy(() => 
  typeof window !== 'undefined' && window.location.protocol !== 'capacitor:'
    ? import('@vercel/speed-insights/react').then(m => ({ default: m.SpeedInsights }))
    : Promise.resolve({ default: () => null })
);

// React is already set globally above - this is just for reference

// Safe logging - only if window is available
if (typeof window !== 'undefined') {
  console.log('StrainSpotter main.jsx loading...');
  console.log('Protocol:', window.location?.protocol);
  console.log('Hostname:', window.location?.hostname);
}

// Detect if we're running in Capacitor (iOS/Android app)
const isCapacitor = typeof window !== 'undefined' && window.location.protocol === 'capacitor:';

// Enhanced loading screen with visuals and progress
const LoadingScreen = () => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Initializing...');
  const [dots, setDots] = useState('');

  useEffect(() => {
    const statuses = [
      { text: 'Loading core libraries...', progress: 20 },
      { text: 'Initializing React framework...', progress: 40 },
      { text: 'Setting up UI components...', progress: 60 },
      { text: 'Connecting to services...', progress: 80 },
      { text: 'Almost ready...', progress: 95 },
    ];

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < statuses.length) {
        setStatus(statuses[currentIndex].text);
        setProgress(statuses[currentIndex].progress);
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 300);

    const dotInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    return () => {
      clearInterval(interval);
      clearInterval(dotInterval);
    };
  }, []);

  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0a1f0a 0%, #1a3a1a 50%, #0a1f0a 100%)',
        color: '#C5E1A5',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated background */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 20% 30%, rgba(124, 179, 66, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(156, 204, 101, 0.1) 0%, transparent 50%)
          `,
          animation: 'pulse 3s ease-in-out infinite',
        }}
      />
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>

      {/* Logo */}
      <div
        style={{
          width: 100,
          height: 100,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(124, 179, 66, 0.3), rgba(156, 204, 101, 0.3))',
          border: '3px solid rgba(124, 179, 66, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
          boxShadow: '0 0 40px rgba(124, 179, 66, 0.4)',
          animation: 'float 2s ease-in-out infinite',
        }}
      >
        <img
          src="/hero.png?v=13"
          alt="StrainSpotter"
          style={{
            width: '80%',
            height: '80%',
            objectFit: 'cover',
            borderRadius: '50%',
          }}
        />
      </div>

      {/* Title */}
      <h1
        style={{
          fontSize: '2rem',
          fontWeight: 700,
          margin: '0 0 8px 0',
          background: 'linear-gradient(135deg, #CDDC39, #9CCC65)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        StrainSpotter
      </h1>

      {/* Status text */}
      <p
        style={{
          fontSize: '0.95rem',
          margin: '0 0 24px 0',
          opacity: 0.9,
          minHeight: '1.5em',
        }}
      >
        {status}{dots}
      </p>

      {/* Progress bar */}
      <div
        style={{
          width: '80%',
          maxWidth: 300,
          height: 4,
          background: 'rgba(124, 179, 66, 0.2)',
          borderRadius: 2,
          overflow: 'hidden',
          marginBottom: 16,
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #7CB342, #9CCC65)',
            borderRadius: 2,
            transition: 'width 0.3s ease',
            boxShadow: '0 0 10px rgba(124, 179, 66, 0.5)',
          }}
        />
      </div>

      {/* Why it takes time */}
      <p
        style={{
          fontSize: '0.75rem',
          opacity: 0.6,
          textAlign: 'center',
          maxWidth: 280,
          margin: '16px 0 0 0',
          lineHeight: 1.4,
        }}
      >
        Loading 35,000+ strain database and AI models for instant identification
      </p>
    </div>
  );
};

// Loading fallback component
const LoadingFallback = LoadingScreen;

// Root app component with providers (shared between Capacitor and web)
function RootApp() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <App />
    </Suspense>
  );
}

// Root component for Capacitor (iOS/Android) - direct App render
function CapacitorRoot() {
  return <RootApp />;
}

// Root component for web - uses React Router
function WebRoot() {
  // Add web-root class to body for web-specific styling
  React.useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.classList.add('web-root');
      return () => {
        document.body.classList.remove('web-root');
      };
    }
  }, []);

  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<WebLanding />} />
          <Route path="/app/*" element={<WebAppShell />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

// Render based on environment
debugLog('=== STARTING RENDER ===');
debugLog('isCapacitor:', isCapacitor);

try {
  debugLog('Looking for root element...');
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found');
  }
  debugLog('Root element found:', rootElement);

  debugLog('Creating React root...');
  const root = createRoot(rootElement);
  debugLog('React root created');
  
  debugLog('Rendering app...');
  root.render(
    <StrictMode>
      <ErrorBoundary>
        <Suspense fallback={<LoadingScreen />}>
          {isCapacitor ? <CapacitorRoot /> : <WebRoot />}
          {/* Collect real-user performance metrics in Vercel - lazy loaded */}
          {!isCapacitor && <SpeedInsights />}
        </Suspense>
      </ErrorBoundary>
    </StrictMode>
  );
  debugLog('App render called successfully');
  
  // Remove splash screen after a short delay to ensure React has mounted
  setTimeout(() => {
    debugLog('Attempting to remove splash screen...');
    const splash = document.getElementById('splash-root');
    if (splash && splash.parentNode) {
      debugLog('Removing splash screen');
      splash.style.opacity = '0';
      splash.style.transition = 'opacity 0.3s ease';
      setTimeout(() => {
        if (splash.parentNode) {
          splash.parentNode.removeChild(splash);
          debugLog('Splash screen removed');
        }
      }, 300);
    } else {
      debugLog('Splash screen not found or already removed');
    }
  }, 500); // Increased delay to ensure app has time to mount
  
  debugLog('StrainSpotter rendered!');
} catch (error) {
  debugLog('ERROR during render:', error);
  console.error('Failed to render app:', error);
  console.error('Error stack:', error.stack);
  
  const rootEl = document.getElementById('root');
  if (rootEl) {
    rootEl.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        background: #0C1910;
        color: #C5E1A5;
        font-family: system-ui;
        text-align: center;
        padding: 24px;
      ">
        <h1>Loading Error</h1>
        <p style="color: #ff6b6b; margin: 16px 0;">${String(error)}</p>
        <pre style="background: rgba(0,0,0,0.3); padding: 16px; border-radius: 8px; font-size: 12px; max-width: 90%; overflow: auto; text-align: left;">
          ${error.stack || 'No stack trace'}
        </pre>
        <button onclick="location.reload()" style="
          margin-top: 16px;
          padding: 12px 24px;
          background: #7CB342;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          cursor: pointer;
        ">Reload</button>
      </div>
    `;
  }
  
  // Also try to remove splash
  const splash = document.getElementById('splash-root');
  if (splash && splash.parentNode) {
    splash.parentNode.removeChild(splash);
  }
}
