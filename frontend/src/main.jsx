// Import React first to ensure it's loaded before anything else
import React, { Suspense } from 'react'
import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import ErrorBoundary from './ErrorBoundary.jsx';
// Vercel Speed Insights for React (use '/react', not '/next' in Vite apps)
import { SpeedInsights } from '@vercel/speed-insights/react'
// Vercel Analytics for tracking page views and user behavior

// Lazy-load components for faster initial boot
const App = React.lazy(() => import('./App.jsx'));
const WebLanding = React.lazy(() => import('./components/WebLanding.jsx'));
const WebAppShell = React.lazy(() => import('./components/WebAppShell.jsx'));

// Ensure React is available globally for debugging
window.React = React;
window.ReactDOM = ReactDOM;

console.log('StrainSpotter main.jsx loading...');
console.log('Protocol:', window.location.protocol);
console.log('Hostname:', window.location.hostname);

// Detect if we're running in Capacitor (iOS/Android app)
const isCapacitor = typeof window !== 'undefined' && window.location.protocol === 'capacitor:';

// Loading fallback component
const LoadingFallback = () => (
  <div
    style={{
      width: '100%',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#050705',
      color: '#C5E1A5',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      fontSize: '1rem',
    }}
  >
    Loading StrainSpotter…
  </div>
);

// Root component for Capacitor (iOS/Android) - direct App render
function CapacitorRoot() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <App />
    </Suspense>
  );
}

// Root component for web - uses React Router
function WebRoot() {
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
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      {isCapacitor ? <CapacitorRoot /> : <WebRoot />}
    </ErrorBoundary>
    {/* Collect real-user performance metrics in Vercel */}
    {!isCapacitor && <SpeedInsights />}
  </StrictMode>,
)

// Remove splash screen once React is ready
const splash = document.getElementById('splash-root');
if (splash && splash.parentNode) {
  splash.parentNode.removeChild(splash);
}

console.log('StrainSpotter rendered!');

// Remove splash screen once React is ready
const splash = document.getElementById('splash-root');
if (splash && splash.parentNode) {
  splash.parentNode.removeChild(splash);
}

console.log('StrainSpotter rendered!');
