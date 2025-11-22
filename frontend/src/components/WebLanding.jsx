import React from 'react';
import { Link } from 'react-router-dom';

export default function WebLanding() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom, rgba(5,7,5,0.95), rgba(10,20,10,0.98))',
        color: '#f5fff5',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      {/* Hero Section */}
      <div
        style={{
          maxWidth: '960px',
          margin: '0 auto',
          padding: '80px 20px 60px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: '64px',
            marginBottom: '16px',
          }}
        >
          🍃
        </div>
        <h1
          style={{
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: 700,
            margin: '0 0 24px',
            background: 'linear-gradient(135deg, #7CB342, #CDDC39)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          StrainSpotter
        </h1>
        <p
          style={{
            fontSize: 'clamp(1.125rem, 2vw, 1.5rem)',
            margin: '0 0 40px',
            opacity: 0.9,
            lineHeight: 1.6,
            maxWidth: '700px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          AI-powered cannabis scanner & community. Scan packages, decode labels, connect with growers and dispensaries.
        </p>
        <div
          style={{
            display: 'flex',
            gap: '16px',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Link
            to="/app"
            style={{
              padding: '14px 28px',
              borderRadius: '999px',
              border: 'none',
              background: 'linear-gradient(135deg, #7CB342, #9CCC65)',
              color: '#04140a',
              fontSize: '16px',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-block',
              boxShadow: '0 4px 12px rgba(124,179,66,0.4)',
            }}
          >
            Launch App
          </Link>
          <Link
            to="/app"
            style={{
              padding: '14px 28px',
              borderRadius: '999px',
              border: '2px solid rgba(124,179,66,0.6)',
              background: 'transparent',
              color: '#7CB342',
              fontSize: '16px',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            Sign In
          </Link>
        </div>
      </div>

      {/* Features Sections */}
      <div
        style={{
          maxWidth: '960px',
          margin: '0 auto',
          padding: '60px 20px',
        }}
      >
        {/* For Consumers */}
        <section
          style={{
            marginBottom: '60px',
            padding: '40px',
            borderRadius: '16px',
            background: 'rgba(124,179,66,0.08)',
            border: '1px solid rgba(124,179,66,0.2)',
          }}
        >
          <h2
            style={{
              fontSize: '2rem',
              fontWeight: 700,
              margin: '0 0 16px',
              color: '#CDDC39',
            }}
          >
            For Consumers
          </h2>
          <p
            style={{
              fontSize: '1.125rem',
              lineHeight: 1.7,
              opacity: 0.9,
              marginBottom: '24px',
            }}
          >
            Point your camera at any cannabis package or bud. StrainSpotter instantly:
          </p>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
            }}
          >
            <li style={{ marginBottom: '12px', paddingLeft: '24px', position: 'relative' }}>
              <span style={{ position: 'absolute', left: 0 }}>📸</span>
              <strong>Scans labels & packages</strong> — Reads THC/CBD, batch info, lab results
            </li>
            <li style={{ marginBottom: '12px', paddingLeft: '24px', position: 'relative' }}>
              <span style={{ position: 'absolute', left: 0 }}>🔍</span>
              <strong>Matches strains visually</strong> — AI identifies closest strain matches
            </li>
            <li style={{ marginBottom: '12px', paddingLeft: '24px', position: 'relative' }}>
              <span style={{ position: 'absolute', left: 0 }}>💬</span>
              <strong>Connects you to community</strong> — Join groups, chat with growers & dispensaries
            </li>
            <li style={{ marginBottom: '12px', paddingLeft: '24px', position: 'relative' }}>
              <span style={{ position: 'absolute', left: 0 }}>📊</span>
              <strong>AI summaries</strong> — Effects, use cases, and grower notes
            </li>
          </ul>
        </section>

        {/* For Growers */}
        <section
          style={{
            marginBottom: '60px',
            padding: '40px',
            borderRadius: '16px',
            background: 'rgba(205,220,57,0.08)',
            border: '1px solid rgba(205,220,57,0.2)',
          }}
        >
          <h2
            style={{
              fontSize: '2rem',
              fontWeight: 700,
              margin: '0 0 16px',
              color: '#CDDC39',
            }}
          >
            For Growers
          </h2>
          <p
            style={{
              fontSize: '1.125rem',
              lineHeight: 1.7,
              opacity: 0.9,
              marginBottom: '24px',
            }}
          >
            Share your expertise and connect with the community:
          </p>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
            }}
          >
            <li style={{ marginBottom: '12px', paddingLeft: '24px', position: 'relative' }}>
              <span style={{ position: 'absolute', left: 0 }}>📌</span>
              <strong>Pin announcements</strong> — Highlight important updates in group chats
            </li>
            <li style={{ marginBottom: '12px', paddingLeft: '24px', position: 'relative' }}>
              <span style={{ position: 'absolute', left: 0 }}>📝</span>
              <strong>Grow logs & journals</strong> — Document your cultivation journey
            </li>
            <li style={{ marginBottom: '12px', paddingLeft: '24px', position: 'relative' }}>
              <span style={{ position: 'absolute', left: 0 }}>👥</span>
              <strong>Connect with dispensaries</strong> — Build relationships and share knowledge
            </li>
          </ul>
        </section>

        {/* For Dispensaries */}
        <section
          style={{
            marginBottom: '60px',
            padding: '40px',
            borderRadius: '16px',
            background: 'rgba(124,179,66,0.08)',
            border: '1px solid rgba(124,179,66,0.2)',
          }}
        >
          <h2
            style={{
              fontSize: '2rem',
              fontWeight: 700,
              margin: '0 0 16px',
              color: '#CDDC39',
            }}
          >
            For Dispensaries
          </h2>
          <p
            style={{
              fontSize: '1.125rem',
              lineHeight: 1.7,
              opacity: 0.9,
              marginBottom: '24px',
            }}
          >
            Engage customers and showcase your products:
          </p>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
            }}
          >
            <li style={{ marginBottom: '12px', paddingLeft: '24px', position: 'relative' }}>
              <span style={{ position: 'absolute', left: 0 }}>📌</span>
              <strong>Pin menus & batch info</strong> — Highlight new arrivals and lab results
            </li>
            <li style={{ marginBottom: '12px', paddingLeft: '24px', position: 'relative' }}>
              <span style={{ position: 'absolute', left: 0 }}>💬</span>
              <strong>Customer support</strong> — Answer questions in group chats
            </li>
            <li style={{ marginBottom: '12px', paddingLeft: '24px', position: 'relative' }}>
              <span style={{ position: 'absolute', left: 0 }}>🌿</span>
              <strong>Product discovery</strong> — Help customers find the right strains
            </li>
          </ul>
        </section>
      </div>

      {/* Footer */}
      <footer
        style={{
          maxWidth: '960px',
          margin: '0 auto',
          padding: '40px 20px',
          borderTop: '1px solid rgba(124,179,66,0.2)',
          textAlign: 'center',
          opacity: 0.7,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '24px',
            flexWrap: 'wrap',
            marginBottom: '16px',
          }}
        >
          <a href="#" style={{ color: '#9CCC65', textDecoration: 'none' }}>
            Privacy
          </a>
          <a href="#" style={{ color: '#9CCC65', textDecoration: 'none' }}>
            Terms
          </a>
          <a href="#" style={{ color: '#9CCC65', textDecoration: 'none' }}>
            Contact
          </a>
        </div>
        <p style={{ margin: 0, fontSize: '0.875rem' }}>
          © {new Date().getFullYear()} StrainSpotter. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

