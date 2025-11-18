// Import React first to ensure it's loaded before anything else
import React from 'react'
import { StrictMode, Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './ErrorBoundary.jsx';
import BootScreen from './components/BootScreen.jsx';
// Vercel Speed Insights for React (use '/react', not '/next' in Vite apps)
import { SpeedInsights } from '@vercel/speed-insights/react'
// Vercel Analytics for tracking page views and user behavior

// Ensure React is available globally for debugging
window.React = React;
window.ReactDOM = ReactDOM;

console.log('StrainSpotter main.jsx loading...');
console.log('Protocol:', window.location.protocol);
console.log('Hostname:', window.location.hostname);

// Render boot screen immediately, then lazy-load the app
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <Suspense fallback={<BootScreen />}>
        <App />
      </Suspense>
    </ErrorBoundary>
    {/* Collect real-user performance metrics in Vercel */}
    <SpeedInsights />
  </StrictMode>,
)

console.log('StrainSpotter rendered!');
