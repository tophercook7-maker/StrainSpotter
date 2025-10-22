
import { AppBar, Toolbar, Button, Box, Typography, Stack, IconButton, Drawer, List, ListItem, ListItemButton, ListItemText } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CannabisLeafIcon from './CannabisLeafIcon';
import { cannabisTheme } from '../theme/cannabisTheme';
import { useState } from 'react';

const NAV_TABS = [
  { id: 'home', label: 'Home' },
  { id: 'scanner', label: 'Scanner' },
  { id: 'strains', label: 'Browse Strains' },
  { id: 'history', label: 'History' },
  { id: 'join', label: 'Join Club' },
  { id: 'friends', label: 'Friends' },
  { id: 'growers', label: 'Growers' },
  { id: 'register', label: 'Register' },
  { id: 'seeds', label: 'Seeds' },
  { id: 'dispensaries', label: 'Dispensaries' },
  { id: 'groups', label: 'Groups' },
  { id: 'help', label: 'Help' },
  { id: 'feedback', label: 'Feedback' },
  { id: 'pipeline', label: 'Pipeline' }
];

// Only show Dev tab if window location is localhost or user is dev
const isDev = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export default function TopNav({ current, onNavigate }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

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
            {NAV_TABS.map(tab => (
              <Tab key={tab.id} id={tab.id} label={tab.label} />
            ))}
            {isDev && <Tab id="dev" label="Dev" />}
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
            {NAV_TABS.map(tab => (
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
            {isDev && (
              <ListItem key="dev" disablePadding>
                <ListItemButton
                  selected={current === 'dev'}
                  onClick={() => onNavigate('dev')}
                  tabIndex={0}
                  aria-current={current === 'dev' ? 'page' : undefined}
                >
                  <ListItemText primary="Dev" />
                </ListItemButton>
              </ListItem>
            )}
          </List>
        </Box>
      </Drawer>
    </>
  );
}
