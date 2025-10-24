// Cannabis/Marijuana Theme Configuration
export const cannabisTheme = {
  colors: {
    // Primary greens (muted sage/olive green - less vivid)
    primary: {
      main: '#7CB342',      // Muted olive green
      light: '#9CCC65',     // Soft sage
      dark: '#558B2F',      // Deep olive
      contrast: '#000000'
    },
    // Secondary (earth tones)
    secondary: {
      main: '#9E9D24',      // Muted earth yellow
      light: '#C5E1A5',
      dark: '#827717',
      contrast: '#000000'
    },
    // Strain type colors
    strainTypes: {
      indica: '#7b1fa2',    // Purple
      sativa: '#f57c00',    // Orange
      hybrid: '#00897b'     // Teal
    },
    // Backgrounds
    background: {
      default: '#1a1a1a',   // Dark background
      paper: '#2c2c2c',     // Card background
      elevated: '#1f3a1f'   // Dark green tint
    },
    // Text
    text: {
      primary: '#9CCC65',    // Soft sage green for main text
      secondary: '#7CB342',  // Muted olive green for secondary text
      disabled: '#558B2F'    // Deep olive for disabled text
    },
    // Accents
    accent: {
      gold: '#ffd700',      // Premium/verified
      warning: '#ff9800',
      error: '#f44336',
      success: '#4caf50',
      info: '#2196f3'
    }
  },
  // Cannabis leaf icon SVG path
  leafIcon: {
    viewBox: '0 0 64 64',
    path: 'M32 6c2.8 8.2 9.6 14 18 16-8.4 2-15.2 7.8-18 16-2.8-8.2-9.6-14-18-16 8.4-2 15.2-7.8 18-16ZM32 44c-3.5-6.5-9.9-10.7-18-12 4 5.3 7.1 11.1 8.5 17.3 3.1 1.5 6.2 2.7 9.5 3.7v-9ZM32 44c3.5-6.5 9.9-10.7 18-12-4 5.3-7.1 11.1-8.5 17.3-3.1 1.5-6.2 2.7-9.5 3.7v-9Z'
  },
  // Gradient presets
  gradients: {
    primary: 'linear-gradient(45deg, #7CB342 30%, #9CCC65 90%)',
    dark: 'linear-gradient(135deg, #2c2c2c 0%, #1f3a1f 100%)',
    hero: 'linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0.7) 100%)',
    card: 'linear-gradient(135deg, #2d5a2d 0%, #1f3a1f 100%)'
  },
  // Border styles
  borders: {
    primary: '2px solid #7CB342',
    subtle: '1px solid rgba(124, 179, 66, 0.3)',
    glow: '0 0 10px rgba(124, 179, 66, 0.4)'
  },
  // Shadows
  shadows: {
    card: '0 4px 20px rgba(0, 0, 0, 0.5)',
    elevated: '0 8px 30px rgba(0, 0, 0, 0.7)',
    glow: '0 0 20px rgba(124, 179, 66, 0.25)'
  }
};

// MUI theme overrides
export const muiThemeOverrides = {
  palette: {
    mode: 'dark',
    primary: {
      main: cannabisTheme.colors.primary.main,
      light: cannabisTheme.colors.primary.light,
      dark: cannabisTheme.colors.primary.dark
    },
    secondary: {
      main: cannabisTheme.colors.secondary.main,
      light: cannabisTheme.colors.secondary.light,
      dark: cannabisTheme.colors.secondary.dark
    },
    background: {
      default: 'transparent',
      paper: 'transparent'
    },
    text: {
      primary: cannabisTheme.colors.text.primary,
      secondary: cannabisTheme.colors.text.secondary
    }
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          // Glassmorphism: translucent background so themed background shows through
          backgroundColor: 'rgba(32, 64, 32, 0.35)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: cannabisTheme.borders.subtle,
          boxShadow: cannabisTheme.shadows.card
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          textTransform: 'none'
        },
        contained: {
          // Semi-transparent with subtle glow
          backgroundColor: 'rgba(124, 179, 66, 0.25)',
          border: '1px solid rgba(124, 179, 66, 0.5)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          boxShadow: '0 6px 20px rgba(124, 179, 66, 0.2)',
          '&:hover': {
            backgroundColor: 'rgba(124, 179, 66, 0.35)'
          }
        },
        outlined: {
          backgroundColor: 'rgba(255, 255, 255, 0.06)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)'
        },
        text: {
          backgroundColor: 'transparent',
          '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.06)' }
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          // Translucent app bar
          backgroundColor: 'rgba(0,0,0,0.35)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderBottom: cannabisTheme.borders.primary
        }
      }
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderRight: cannabisTheme.borders.subtle
        }
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: 'rgba(25, 25, 25, 0.6)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: cannabisTheme.borders.subtle,
          boxShadow: cannabisTheme.shadows.elevated
        }
      }
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 }
  }
};
