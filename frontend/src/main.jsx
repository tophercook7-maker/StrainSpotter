import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './ErrorBoundary.jsx';
// Vercel Speed Insights for React (use '/react', not '/next' in Vite apps)
import { SpeedInsights } from '@vercel/speed-insights/react'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
    {/* Collect real-user performance metrics in Vercel */}
    <SpeedInsights />
  </StrictMode>,
)
