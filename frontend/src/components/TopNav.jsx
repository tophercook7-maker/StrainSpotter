import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import MenuIcon from '@mui/icons-material/Menu';
import SpaIcon from '@mui/icons-material/Spa';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CannabisLeafIcon from './CannabisLeafIcon';

// Simple, no-auth top nav. No "Sign in to start scanning" banner.
export default function TopNav({ current, onNavigate }) {
  const handleNav = (view) => () => {
    if (onNavigate) onNavigate(view);
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        top: 0,
        background: 'transparent',
        borderBottom: '1px solid rgba(124, 179, 66, 0.5)',
        backdropFilter: 'blur(14px)',
      }}
    >
      <Toolbar sx={{ minHeight: 64, px: 2 }}>
        {/* Left: Logo + Title */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1 }}>
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              overflow: 'hidden',
              border: '2px solid rgba(156, 204, 101, 0.9)',
              boxShadow: '0 0 16px rgba(124, 179, 66, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(124, 179, 66, 0.2)',
            }}
          >
            {/* Hero-based icon */}
            <img
              src="/hero.png?v=13"
              alt="StrainSpotter"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                letterSpacing: 0.5,
                background: 'linear-gradient(135deg, #CDDC39 0%, #9CCC65 50%, #7CB342 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              StrainSpotter
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'rgba(200, 230, 200, 0.8)', display: 'flex', alignItems: 'center', gap: 0.5 }}
            >
              <CannabisLeafIcon size={14} />
              AI Strain Scanner
            </Typography>
          </Box>
        </Box>

        {/* Right: Simple nav buttons */}
        <Stack
          direction="row"
          spacing={1}
          sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center' }}
        >
          <Button
            size="small"
            onClick={handleNav('home')}
            sx={{
              textTransform: 'none',
              fontWeight: current === 'home' ? 700 : 500,
              color: current === 'home' ? '#CDDC39' : 'rgba(230, 240, 230, 0.85)',
            }}
          >
            Home
          </Button>

          <Button
            size="small"
            startIcon={<CameraAltIcon sx={{ fontSize: 18 }} />}
            onClick={handleNav('scanner')}
            sx={{
              textTransform: 'none',
              fontWeight: current === 'scanner' ? 700 : 500,
              color: current === 'scanner' ? '#CDDC39' : 'rgba(230, 240, 230, 0.85)',
            }}
          >
            Scan
          </Button>

          <Button
            size="small"
            startIcon={<SpaIcon sx={{ fontSize: 18 }} />}
            onClick={handleNav('groups')}
            sx={{
              textTransform: 'none',
              fontWeight: current === 'groups' ? 700 : 500,
              color: current === 'groups' ? '#CDDC39' : 'rgba(230, 240, 230, 0.85)',
            }}
          >
            Garden
          </Button>

          <IconButton
            size="small"
            onClick={handleNav('help')}
            sx={{ color: current === 'help' ? '#CDDC39' : 'rgba(230, 240, 230, 0.85)' }}
          >
            <HelpOutlineIcon fontSize="small" />
          </IconButton>
        </Stack>

        {/* Compact menu on very small screens - still no sign-in banner */}
        <IconButton
          edge="end"
          sx={{ display: { xs: 'flex', sm: 'none' }, color: 'rgba(230, 240, 230, 0.9)' }}
          onClick={handleNav('home')}
          aria-label="Home menu"
        >
          <MenuIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}