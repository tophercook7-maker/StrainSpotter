import { BottomNavigation, BottomNavigationAction, Paper, Box, IconButton, Drawer, List, ListItem, ListItemIcon, ListItemText, Divider, Typography, Stack } from '@mui/material';
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

// Icons
import ScannerIcon from '@mui/icons-material/QrCodeScanner';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import HistoryIcon from '@mui/icons-material/History';
import MenuIcon from '@mui/icons-material/Menu';
import GroupIcon from '@mui/icons-material/Group';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import StoreIcon from '@mui/icons-material/Store';
import SpaIcon from '@mui/icons-material/Spa';
import HelpIcon from '@mui/icons-material/Help';
import FeedbackIcon from '@mui/icons-material/Feedback';
import PolicyIcon from '@mui/icons-material/Policy';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import LoginIcon from '@mui/icons-material/Login';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BugReportIcon from '@mui/icons-material/BugReport';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

const isDev = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export default function MobileNav({ current, onNavigate }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    let sub;
    (async () => {
      try {
        if (!supabase) return;
        const { data } = await supabase.auth.getSession();
        setIsLoggedIn(!!data?.session?.user);
      } catch (e) {
        console.debug('MobileNav: getSession failed', e);
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

  const mainTabs = [
    { id: 'home', icon: <HomeIcon />, label: 'Home', show: !isLoggedIn },
    { id: 'scanner', icon: <ScannerIcon />, label: 'Scan', show: true },
    { id: 'strains', icon: <SearchIcon />, label: 'Browse', show: true },
    { id: 'history', icon: <HistoryIcon />, label: 'History', show: true },
  ];

  const menuItems = [
    { id: 'history', icon: <HistoryIcon />, label: 'Scan History', divider: false },
    { id: 'friends', icon: <GroupIcon />, label: 'Friends', divider: false },
    { id: 'groups', icon: <GroupIcon />, label: 'Groups', divider: false },
    { id: 'growers', icon: <LocalFloristIcon />, label: 'Growers', divider: false },
    { id: 'dispensaries', icon: <StoreIcon />, label: 'Dispensaries', divider: false },
    { id: 'seeds', icon: <SpaIcon />, label: 'Seeds', divider: true },
    { id: 'register', icon: <PersonAddIcon />, label: 'Register Strain', divider: false },
    { id: 'help', icon: <HelpIcon />, label: 'Help', divider: false },
    { id: 'feedback', icon: <FeedbackIcon />, label: 'Feedback', divider: false },
    { id: 'guidelines', icon: <PolicyIcon />, label: 'Guidelines', divider: true },
    { id: 'login', icon: <LoginIcon />, label: 'Login', show: !isLoggedIn, divider: false },
    { id: 'pipeline', icon: <DashboardIcon />, label: 'Pipeline', show: isDev, divider: false },
    { id: 'errors', icon: <BugReportIcon />, label: 'Errors', show: isDev, divider: false },
    { id: 'moderation', icon: <AdminPanelSettingsIcon />, label: 'Moderation', show: isDev, divider: false },
  ].filter(item => item.show !== false);

  const visibleMainTabs = mainTabs.filter(tab => tab.show);
  const currentIndex = visibleMainTabs.findIndex(tab => tab.id === current);

  return (
    <>
      {/* Mobile-first: Minimal top header with branding and menu */}
      <Paper 
        elevation={3} 
        sx={{ 
          position: 'sticky', 
          top: 0, 
          zIndex: 1100,
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Box 
              component="img" 
              src="/hero.png" 
              alt="StrainSpotter" 
              sx={{ width: 32, height: 32, mr: 1.5, filter: 'drop-shadow(0 0 4px #4caf5088)' }} 
              draggable={false} 
            />
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
              StrainSpotter
            </Typography>
          </Box>
          <IconButton onClick={() => setDrawerOpen(true)} edge="end">
            <MenuIcon />
          </IconButton>
        </Box>
      </Paper>

      {/* Bottom Navigation - Primary actions */}
      <Paper 
        sx={{ 
          position: 'fixed', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          zIndex: 1100,
          borderTop: '1px solid',
          borderColor: 'divider'
        }} 
        elevation={8}
      >
        <BottomNavigation
          value={currentIndex === -1 ? false : currentIndex}
          onChange={(event, newValue) => {
            if (newValue !== false) {
              onNavigate(visibleMainTabs[newValue].id);
            }
          }}
          showLabels
          sx={{ 
            height: 64,
            '& .MuiBottomNavigationAction-root': {
              minWidth: 60,
              color: 'text.secondary',
              '&.Mui-selected': {
                color: 'primary.main',
              }
            }
          }}
        >
          {visibleMainTabs.map((tab) => (
            <BottomNavigationAction
              key={tab.id}
              label={tab.label}
              icon={tab.icon}
            />
          ))}
        </BottomNavigation>
      </Paper>

      {/* Drawer for additional menu items */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{ zIndex: 1200 }}
      >
        <Box sx={{ width: 280, pt: 2 }} role="presentation">
          <Stack spacing={1} sx={{ px: 2, pb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Menu</Typography>
            <Typography variant="caption" color="text.secondary">
              Explore more features
            </Typography>
          </Stack>
          <Divider />
          <List>
            {menuItems.map((item) => (
              <Box key={item.id}>
                <ListItem 
                  button 
                  selected={current === item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setDrawerOpen(false);
                  }}
                  sx={{
                    '&.Mui-selected': {
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      '& .MuiListItemIcon-root': {
                        color: 'primary.contrastText'
                      }
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: current === item.id ? 'inherit' : 'text.secondary' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.label}
                    primaryTypographyProps={{
                      fontWeight: current === item.id ? 600 : 400
                    }}
                  />
                </ListItem>
                {item.divider && <Divider sx={{ my: 1 }} />}
              </Box>
            ))}
          </List>
        </Box>
      </Drawer>
    </>
  );
}
