import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import App from '../App.jsx';

export default function WebAppShell() {
  const location = useLocation();
  const isAppRoute = location.pathname.startsWith('/app');

  return (
    <div
      className="web-app-shell"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#050705',
      }}
    >
      {/* Top Navigation */}
      <nav
        className="web-nav"
        style={{
          padding: '12px 20px',
          borderBottom: '1px solid rgba(124,179,66,0.2)',
          background: 'rgba(5,7,5,0.95)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          position: 'sticky',
          top: 0,
          zIndex: 1000,
        }}
      >
        <Link
          to="/"
          className="web-nav-logo"
          style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: '#7CB342',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>🍃</span>
          <span>StrainSpotter</span>
        </Link>
        <div
          className="web-nav-links"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
          }}
        >
          <Link
            to="/"
            style={{
              color: '#9CCC65',
              textDecoration: 'none',
              fontSize: '0.9375rem',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => e.target.style.color = '#CDDC39'}
            onMouseLeave={(e) => e.target.style.color = '#9CCC65'}
          >
            Home
          </Link>
          <Link
            to="/app"
            style={{
              color: isAppRoute ? '#CDDC39' : '#9CCC65',
              textDecoration: 'none',
              fontSize: '0.9375rem',
              fontWeight: isAppRoute ? 600 : 400,
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => !isAppRoute && (e.target.style.color = '#CDDC39')}
            onMouseLeave={(e) => !isAppRoute && (e.target.style.color = '#9CCC65')}
          >
            App
          </Link>
        </div>
      </nav>

      {/* Main Content Area */}
      <main
        className="web-app-main"
        style={{
          flex: 1,
          minHeight: 0,
          overflow: 'auto',
        }}
      >
        <App />
      </main>
    </div>
  );
}

