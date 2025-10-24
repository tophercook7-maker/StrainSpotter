
import { AppBar, Toolbar, Button, Box, Typography, Stack, IconButton, Drawer, List, ListItem, ListItemButton, ListItemText } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CannabisLeafIcon from './CannabisLeafIcon';
import { cannabisTheme } from '../theme/cannabisTheme';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';
import { API_BASE } from '../config';

const BASE_TABS = [
  { id: 'scanner', label: 'Scanner' },
  { id: 'strains', label: 'Browse Strains' },
  { id: 'history', label: 'History' },
  { id: 'friends', label: 'Friends' },
  { id: 'growers', label: 'Growers' },
  { id: 'register', label: 'Register' },
  { id: 'seeds', label: 'Seeds' },
  { id: 'dispensaries', label: 'Dispensaries' },
  { id: 'groups', label: 'Groups' },
  { id: 'help', label: 'Help' },
  { id: 'guidelines', label: 'Guidelines' },
  { id: 'feedback', label: 'Feedback' },
  { id: 'pipeline', label: 'Pipeline' },
  { id: 'moderation', label: 'Moderation' }
];

// Add errors tab only in development
const isDev = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export default function TopNav({ current, onNavigate }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [strainCount, setStrainCount] = useState(null);

  // Track auth state so we can show Home only for new (logged-out) users
  useEffect(() => {
    let sub;
    (async () => {
      try {
        if (!supabase) return;
        const { data } = await supabase.auth.getSession();
        setIsLoggedIn(!!data?.session?.user);
      } catch (e) {
        console.debug('TopNav: getSession failed', e);
      }
    })();
    if (supabase) {
      const listener = supabase.auth.onAuthStateChange((_event, session) => {
        setIsLoggedIn(!!session?.user);
      });
      sub = listener?.data?.subscription;
    }
    return () => sub?.unsubscribe?.();
  }, []);

  // Fetch strain count for subtle header counter
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const resp = await fetch(`${API_BASE}/api/strains/count`);
        if (!resp.ok) return;
        const data = await resp.json();
        if (!cancelled) setStrainCount(typeof data.count === 'number' ? data.count : null);
      } catch {
        // Silent fail; counter is optional UI
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const navTabs = useMemo(() => {
    const tabs = [...BASE_TABS];
    if (!isLoggedIn) {
      // Show Home first for new users, plus a Login entry to keep auth fully in-app
      tabs.unshift({ id: 'home', label: 'Home' });
      tabs.push({ id: 'login', label: 'Login' });
    }
    // Add error viewer in development only
    if (isDev) {
      tabs.push({ id: 'errors', label: '🚨 Errors' });
    }
    return tabs;
  }, [isLoggedIn]);

  const handleDrawerToggle = () => setDrawerOpen((v) => !v);

  const Tab = ({ id, label }) => (
    <Button
      color={current === id ? 'primary' : 'inherit'}
      variant={current === id ? 'contained' : 'text'}
      onClick={() => onNavigate(id)}
      sx={{
        mr: 1,
        fontWeight: current === id ? 700 : 400,
        boxShadow: current === id ? '0 0 0 2px #4caf50' : undefined,
        outline: current === id ? '2px solid #4caf50' : undefined,
        outlineOffset: current === id ? '2px' : undefined,
        borderRadius: 2,
        transition: 'all 0.15s',
        '&:focus': {
          outline: '2px solid #ffeb3b',
          outlineOffset: '2px',
        }
      }}
      tabIndex={0}
      aria-current={current === id ? 'page' : undefined}
    >
      {label}
    </Button>
  );

  return (
    <>
      <AppBar 
        position="sticky" 
        sx={{ 
          mb: 2, 
          backgroundImage: cannabisTheme.gradients.dark,
          borderBottom: cannabisTheme.borders.primary
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { xs: 'inline-flex', md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mr: 3 }}>
            <Box component="img" src="/hero.png" alt="StrainSpotter Logo" sx={{ width: 32, height: 32, mr: 1, filter: 'drop-shadow(0 0 6px #4caf5088)' }} draggable={false} />
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 700,
                color: cannabisTheme.colors.primary.light,
                letterSpacing: '0.5px'
              }}
            >
              StrainSpotter
            </Typography>
          </Stack>
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
            {navTabs.map(tab => (
              <Tab key={tab.id} id={tab.id} label={tab.label} />
            ))}
            {strainCount !== null && (
              <Typography variant="caption" sx={{ ml: 2, opacity: 0.8, color: '#c8e6c9' }}>
                {strainCount.toLocaleString()} strains • and climbing
              </Typography>
            )}
          </Box>
        </Toolbar>
      </AppBar>
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        sx={{ zIndex: 1300 }}
      >
        <Box sx={{ width: 240 }} role="presentation" onClick={handleDrawerToggle}>
          <List>
            {navTabs.map(tab => (
              <ListItem key={tab.id} disablePadding>
                <ListItemButton
                  selected={current === tab.id}
                  onClick={() => onNavigate(tab.id)}
                  tabIndex={0}
                  aria-current={current === tab.id ? 'page' : undefined}
                >
                  <ListItemText primary={tab.label} />
                </ListItemButton>
              </ListItem>
            ))}
            {strainCount !== null && (
              <ListItem key="strain-count" sx={{ px: 2 }}>
                <ListItemText primaryTypographyProps={{ variant: 'caption', sx: { opacity: 0.8 } }} primary={`${strainCount.toLocaleString()} strains • and climbing`} />
              </ListItem>
            )}
          </List>
        </Box>
      </Drawer>
    </>
  );
}
