// Cannabis/Marijuana Theme Configuration
export const cannabisTheme = {
  colors: {
    // Primary greens (cannabis leaf inspired)
    primary: {
      main: '#4caf50',      // Cannabis green
      light: '#81c784',     // Light green
      dark: '#388e3c',      // Dark green
      contrast: '#ffffff'
    },
    // Secondary (earth tones)
    secondary: {
      main: '#8bc34a',      // Lime green
      light: '#aed581',
      dark: '#689f38',
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
      primary: '#ffffff',
      secondary: '#b0b0b0',
      disabled: '#757575'
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
    primary: 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)',
    dark: 'linear-gradient(135deg, #2c2c2c 0%, #1f3a1f 100%)',
    hero: 'linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0.7) 100%)',
    card: 'linear-gradient(135deg, #2d5a2d 0%, #1f3a1f 100%)'
  },
  // Border styles
  borders: {
    primary: '2px solid #4caf50',
    subtle: '1px solid rgba(76, 175, 80, 0.3)',
    glow: '0 0 10px rgba(76, 175, 80, 0.5)'
  },
  // Shadows
  shadows: {
    card: '0 4px 20px rgba(0, 0, 0, 0.5)',
    elevated: '0 8px 30px rgba(0, 0, 0, 0.7)',
    glow: '0 0 20px rgba(76, 175, 80, 0.3)'
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
      default: cannabisTheme.colors.background.default,
      paper: cannabisTheme.colors.background.paper
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
          backgroundImage: cannabisTheme.gradients.dark,
          border: cannabisTheme.borders.subtle,
          boxShadow: cannabisTheme.shadows.card
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        contained: {
          backgroundImage: cannabisTheme.gradients.primary,
          '&:hover': {
            backgroundImage: 'linear-gradient(45deg, #388e3c 30%, #4caf50 90%)'
          }
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: cannabisTheme.gradients.dark,
          borderBottom: cannabisTheme.borders.primary
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
