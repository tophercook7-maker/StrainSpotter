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
      default: '#1a1a1a', // Use a valid dark color for background
      paper: '#2c2c2c'    // Use a valid card color for paper
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
          backgroundColor: 'none',
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
          backgroundColor: 'rgba(124, 179, 66, 0.3)',
          border: '2px solid rgba(124, 179, 66, 0.6)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 6px 20px rgba(124, 179, 66, 0.2)',
          '&:hover': {
            backgroundColor: 'rgba(124, 179, 66, 0.5)',
            border: '2px solid rgba(124, 179, 66, 0.8)'
          }
        },
        outlined: {
          backgroundColor: 'rgba(124, 179, 66, 0.2)',
          border: '2px solid rgba(124, 179, 66, 0.5)',
          backdropFilter: 'blur(10px)',
          '&:hover': {
            backgroundColor: 'rgba(124, 179, 66, 0.3)',
            border: '2px solid rgba(124, 179, 66, 0.7)'
          }
        },
        text: {
          backgroundColor: 'rgba(124, 179, 66, 0.15)',
          backdropFilter: 'blur(10px)',
          '&:hover': {
            backgroundColor: 'rgba(124, 179, 66, 0.25)'
          }
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1a1a1a',
          borderBottom: cannabisTheme.borders.primary
        }
      }
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#2c2c2c',
          borderRight: cannabisTheme.borders.subtle
        }
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: '#2c2c2c',
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
