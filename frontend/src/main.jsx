// Import React first to ensure it's loaded before anything else
import React, { Suspense } from 'react'
import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { createRoot } from 'react-dom/client'
import './index.css'
import ErrorBoundary from './ErrorBoundary.jsx';
// Vercel Speed Insights for React (use '/react', not '/next' in Vite apps)
import { SpeedInsights } from '@vercel/speed-insights/react'
// Vercel Analytics for tracking page views and user behavior

// Lazy-load App for faster initial boot
const App = React.lazy(() => import('./App.jsx'));

// Ensure React is available globally for debugging
window.React = React;
window.ReactDOM = ReactDOM;

console.log('StrainSpotter main.jsx loading...');
console.log('Protocol:', window.location.protocol);
console.log('Hostname:', window.location.hostname);

function Root() {
  return (
    <Suspense
      fallback={
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
      }
    >
      <App />
    </Suspense>
  );
}

// Render boot screen immediately, then lazy-load the app
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <Root />
    </ErrorBoundary>
    {/* Collect real-user performance metrics in Vercel */}
    <SpeedInsights />
  </StrictMode>,
)

// Remove splash screen once React is ready
const splash = document.getElementById('splash-root');
if (splash && splash.parentNode) {
  splash.parentNode.removeChild(splash);
}

console.log('StrainSpotter rendered!');
