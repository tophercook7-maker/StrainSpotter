import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import App from '../App.jsx';

export default function WebAppShell() {
  const location = useLocation();
  const isAppRoute = location.pathname.startsWith('/app');

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#050705',
      }}
    >
      {/* Top Navigation */}
      <nav
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
        }}
      >
        <Link
          to="/"
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
            }}
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
            }}
          >
            App
          </Link>
        </div>
      </nav>

      {/* Main Content Area */}
      <main
        style={{
          flex: 1,
          minHeight: 0,
        }}
      >
        <App />
      </main>
    </div>
  );
}

