
import { useEffect, useState } from 'react';
import { Box, Button, Stack, Typography, Chip, Divider, ButtonBase } from '@mui/material';
import { History as HistoryIcon, LocalFlorist } from '@mui/icons-material';
import CannabisLeafIcon from './CannabisLeafIcon';
import { API_BASE } from '../config';
import { useAuth } from '../contexts/AuthContext';

// Icon imports removed for pure text actions

import AIAssistantBubble from './AIAssistantBubble';

export default function Home({ onNavigate }) {
  const { user } = useAuth();
  const [strainCount, setStrainCount] = useState(null);
  const [membershipTier, setMembershipTier] = useState('scan-only');
  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch(`${API_BASE}/api/membership/status`, { credentials: 'include' });
        if (resp.ok) {
          const data = await resp.json();
          setMembershipTier(data.tier || 'scan-only');
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const resp = await fetch(`${API_BASE}/api/strains/count`);
        if (!resp.ok) return;
        const data = await resp.json();
        if (!cancelled) setStrainCount(typeof data.count === 'number' ? data.count : null);
      } catch {
        setStrainCount(null);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const tiles = [
    { key: 'wizard', nav: 'wizard', title: 'Scan', blurb: 'Guided scan with AI results, seeds and product near you', emoji: '📷' },
    ...(membershipTier === 'full-access'
      ? [
          // History tile only for full-access
          { key: 'history', nav: 'history', title: 'Scan History', blurb: 'View your previous scans and results', icon: HistoryIcon },
          { key: 'strains', nav: 'strains', title: 'Browse Strains', blurb: `Explore ${strainCount ? strainCount.toLocaleString() : '35k+'} strains with links to seeds & dispensaries`, icon: LocalFlorist },
          { key: 'groups', nav: 'groups', title: 'Groups & Chat', blurb: 'Connect with growers and enthusiasts', emoji: '💬' },
          { key: 'growers', nav: 'growers', title: 'Find Growers', blurb: 'Discover local cultivators and their expertise', emoji: '🧑‍🌾' },
          { key: 'dispensaries', nav: 'dispensaries', title: 'Dispensaries', blurb: 'Find nearby shops and retailers', emoji: '🛍️' },
          { key: 'seeds', nav: 'seeds', title: 'Seeds', blurb: 'Where to buy seed packs', emoji: '🌱' },
          { key: 'grow-coach', nav: 'grow-coach', title: 'Grow Coach', blurb: 'Step‑by‑step from seed to harvest', emoji: '📘' },
          { key: 'help', nav: 'help', title: 'Help & Getting Started', blurb: 'Learn how to use StrainSpotter', emoji: '📖' },
          { key: 'feedback', nav: 'feedback', title: 'Send Feedback', blurb: 'Share your thoughts and suggestions', emoji: '✉️' },
        ]
      : [
          { key: 'membership', nav: 'membership-join', title: 'Unlock Full Access', blurb: 'Upgrade to unlock all features', emoji: '💎' }
        ]
    ),
  ];

  const GlassTile = ({ title, emoji, icon: Icon, onClick, pro }) => (
    <ButtonBase
      disableRipple
      onClick={onClick}
      sx={{
        position: 'relative',
        borderRadius: 3,
        p: 0.5,
        // Phone-first: even smaller buttons
        minHeight: { xs: 64, sm: 72 },
        aspectRatio: '1 / 1',
        width: '100%',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0.75,
        // Single-layer, highly see-through glass with muted green
        background: 'rgba(20, 40, 30, 0.10)',
        border: '1px solid rgba(124,179,66,0.14)',
        backdropFilter: 'blur(3px)',
        boxShadow: '0 1px 8px rgba(0,0,0,0.10)',
        color: 'white',
        transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        outline: 'none',
        '&:focus-visible': { outline: 'none', boxShadow: 'none' },
        '&:hover': {
          transform: 'none',
          background: 'rgba(24, 52, 38, 0.12)',
          borderColor: 'rgba(124,179,66,0.22)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.12)'
        }
      }}
    >
      {pro && (
        <Chip 
          label="Pro" 
          color="success" 
          size="small" 
          sx={{ 
            position: 'absolute', 
            top: 6, 
            right: 6, 
            fontSize: '0.6rem', 
            height: 16,
            fontWeight: 700,
            backdropFilter: 'blur(8px)'
          }} 
        />
      )}
      {Icon ? (
        <Icon sx={{ 
          fontSize: { xs: 20, sm: 22 },
          color: '#7CB342',
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
        }} />
      ) : (
        <Box sx={{ 
          fontSize: { xs: 20, sm: 22 }, 
          lineHeight: 1,
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
        }} aria-hidden>
          {emoji}
        </Box>
      )}
      <Typography 
        variant="subtitle2" 
        sx={{ 
          fontWeight: 700, 
          lineHeight: 1.3, 
          fontSize: { xs: '0.65rem', sm: '0.75rem' },
          textShadow: '0 1px 2px rgba(0,0,0,0.25)',
          maxWidth: '90%'
        }}
      >
        {title}
      </Typography>

      {/* Leaf watermark */}
      <Box sx={{ position: 'absolute', bottom: 6, left: 6, opacity: 0.08 }} aria-hidden>
        <CannabisLeafIcon />
      </Box>
    </ButtonBase>
  );

  return (
    <Box sx={{ bgcolor: 'transparent', minHeight: '100vh', pb: 6 }}>
      {/* Hero Section - Mobile Optimized */}
  <Box sx={{ px: 2, pt: 4, pb: 1, textAlign: 'center', position: 'relative' }}>
        <Stack spacing={2} alignItems="center" sx={{ position: 'relative', zIndex: 1 }}>
            <img 
              src="/hero.png" 
              alt="StrainSpotter" 
              style={{ 
                width: 80, 
                height: 80,
                filter: 'drop-shadow(0 0 18px rgba(0,0,0,0.35))'
              }} 
              draggable={false} 
            />
          
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.25)' }}>
            StrainSpotter
          </Typography>
          
          <Chip 
            icon={<CannabisLeafIcon size={18} />} 
            label="AI-Powered Cannabis ID"
            sx={{ 
              bgcolor: 'rgba(255,255,255,0.10)', 
              color: '#fff',
              fontWeight: 600,
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.18)'
            }} 
          />

          {user && (
            <Typography variant="body2" sx={{ color: 'rgba(76, 175, 80, 1)', fontWeight: 700, textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
              ✓ Signed in as {user.email}
            </Typography>
          )}

          {strainCount !== null && (
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
              {strainCount.toLocaleString()} strains • and climbing 🌱
            </Typography>
          )}
        </Stack>
      </Box>

      {/* All Actions - Glass Tiles Grid */}
      <Box sx={{ px: 2, mt: 1, position: 'relative', zIndex: 10 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'white', textAlign: 'center', opacity: 0.95 }}>
          What would you like to do?
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gap: 1.25,
            gridTemplateColumns: {
              xs: 'repeat(4, minmax(0, 1fr))',
              sm: 'repeat(5, minmax(0, 1fr))',
              md: 'repeat(6, minmax(0, 1fr))'
            }
          }}
        >
          {tiles.map((t) => (
            <GlassTile
              key={t.key}
              title={t.title}
              emoji={t.emoji}
              icon={t.icon}
              pro={t.pro}
              onClick={() => onNavigate(t.nav || t.key)}
            />
          ))}
        </Box>
      </Box>
      {/* Floating AI Assistant */}
      <AIAssistantBubble onNavigate={onNavigate} />
    </Box>
  );
}
