// Import React first to ensure it's loaded before anything else
import React from 'react'
import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './ErrorBoundary.jsx';
// Vercel Speed Insights for React (use '/react', not '/next' in Vite apps)
import { SpeedInsights } from '@vercel/speed-insights/react'
// Vercel Analytics for tracking page views and user behavior
import { Analytics } from '@vercel/analytics/react'

// Ensure React is available globally for debugging
window.React = React;
window.ReactDOM = ReactDOM;

console.log('StrainSpotter main.jsx loading...');
console.log('Protocol:', window.location.protocol);
console.log('Hostname:', window.location.hostname);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
    {/* Collect real-user performance metrics in Vercel */}
    <SpeedInsights />
    {/* Track page views and user behavior in Vercel Analytics */}
    <Analytics />
  </StrictMode>,
)

console.log('StrainSpotter rendered!');
