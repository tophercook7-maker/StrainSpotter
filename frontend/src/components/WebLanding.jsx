import React from 'react';
import { Link } from 'react-router-dom';

export default function WebLanding() {
  const features = [
    {
      emoji: '📷',
      title: 'AI Strain Scan',
      description: 'Snap a photo of any cannabis flower, and our advanced AI instantly identifies the strain from our database of over 35,000 varieties. Get detailed strain information including genetics, effects, terpene profiles, and growing characteristics in seconds.',
    },
    {
      emoji: '🌿',
      title: 'Strain Browser',
      description: 'Explore our comprehensive database of 35,000+ cannabis strains. Search by name, effects, terpenes, THC/CBD content, or growing difficulty. Discover new favorites, compare strains, and learn about genetics, lineage, and cultivation tips for each variety.',
    },
    {
      emoji: '⭐',
      title: 'Reviews Hub',
      description: 'Read and share authentic strain reviews from real users. Get insights on effects, taste, growing experience, and medical benefits. Rate your experiences and help the community discover the best strains for their needs.',
    },
    {
      emoji: '👥',
      title: 'Community Groups',
      description: 'Connect with fellow growers, enthusiasts, and cannabis professionals. Join discussions, share grow diaries, ask questions, and build your network. Whether you\'re a beginner or master cultivator, find your tribe here.',
    },
    {
      emoji: '🌱',
      title: 'Grow Coach',
      description: 'Access expert growing tips, guides, and tutorials covering everything from seed to harvest. Learn about lighting, nutrients, pest management, training techniques, and harvesting. Level up your cultivation skills with proven strategies.',
    },
    {
      emoji: '📓',
      title: 'Grow Logbook',
      description: 'Track every stage of your grow with detailed journaling. Record watering schedules, nutrient feeds, environmental conditions, and observations. Monitor progress with photos, set reminders, and build a searchable history of all your grows.',
    },
    {
      emoji: '🧑‍🌾',
      title: 'Grower Directory',
      description: 'Find local cultivators, breeders, and cannabis professionals in your area. Browse profiles, connect with growers, share knowledge, and discover local expertise. Whether you\'re looking for mentors or collaborators, find them here.',
    },
    {
      emoji: '🌾',
      title: 'Seed Vendors',
      description: 'Discover trusted seed banks and breeders with verified reviews from the community. Compare prices, shipping options, and genetics. Find the perfect seeds for your next grow with confidence from reputable sources.',
    },
    {
      emoji: '🏪',
      title: 'Dispensaries',
      description: 'Locate nearby dispensaries using your location. Find shops with your favorite strains in stock, check hours and menus, read reviews, and get directions. Never wonder where to find quality cannabis again.',
    }
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0a0f0a',
        color: '#f5fff5',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
        width: '100%',
        overflowX: 'hidden',
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
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(124, 179, 66, 0.2) 0%, rgba(156, 204, 101, 0.2) 100%)',
            border: '3px solid rgba(124, 179, 66, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            boxShadow: '0 0 40px rgba(124, 179, 66, 0.6), 0 0 80px rgba(124, 179, 66, 0.3)',
          }}
        >
          <img
            src="/hero.png?v=13"
            alt="StrainSpotter"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '50%',
            }}
          />
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

      {/* All Features Showcase */}
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '60px 20px',
        }}
      >
        <h2
          style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            textAlign: 'center',
            margin: '0 0 48px',
            color: '#CDDC39',
          }}
        >
          Everything You Need for Cannabis
        </h2>
        
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px',
            marginBottom: '60px',
          }}
        >
          {features.map((feature, index) => (
            <div
              key={index}
              style={{
                padding: '32px',
                borderRadius: '16px',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '2px solid rgba(124, 179, 66, 0.3)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(124, 179, 66, 0.15)';
                e.currentTarget.style.borderColor = 'rgba(124, 179, 66, 0.6)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.4)';
                e.currentTarget.style.borderColor = 'rgba(124, 179, 66, 0.3)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div
                style={{
                  fontSize: '3rem',
                  marginBottom: '16px',
                  textAlign: 'center',
                }}
              >
                {feature.emoji}
              </div>
              <h3
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  margin: '0 0 12px',
                  color: '#CDDC39',
                  textAlign: 'center',
                }}
              >
                {feature.title}
              </h3>
              <p
                style={{
                  fontSize: '1rem',
                  lineHeight: 1.6,
                  opacity: 0.9,
                  margin: 0,
                  color: '#d0d0d0',
                }}
              >
                {feature.description}
              </p>
            </div>
          ))}
        </div>
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

