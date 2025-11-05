import { MD3DarkTheme } from 'react-native-paper';

// StrainSpotter Cannabis Theme
export const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#7CB342', // Cannabis green
    primaryContainer: '#558B2F',
    secondary: '#CDDC39', // Lime green
    secondaryContainer: '#9CCC65',
    tertiary: '#8BC34A',
    background: '#121212', // Dark background
    surface: '#1E1E1E',
    surfaceVariant: '#2A2A2A',
    error: '#CF6679',
    onPrimary: '#FFFFFF',
    onSecondary: '#000000',
    onBackground: '#FFFFFF',
    onSurface: '#FFFFFF',
    outline: 'rgba(124, 179, 66, 0.4)',
    elevation: {
      level0: 'transparent',
      level1: 'rgba(124, 179, 66, 0.05)',
      level2: 'rgba(124, 179, 66, 0.08)',
      level3: 'rgba(124, 179, 66, 0.11)',
      level4: 'rgba(124, 179, 66, 0.12)',
      level5: 'rgba(124, 179, 66, 0.14)',
    },
  },
  roundness: 12,
};

// Custom colors for specific components
export const customColors = {
  glassmorphism: {
    background: 'rgba(124, 179, 66, 0.15)',
    border: 'rgba(124, 179, 66, 0.4)',
    shadow: 'rgba(124, 179, 66, 0.2)',
  },
  gradient: {
    start: 'rgba(124, 179, 66, 0.15)',
    end: 'rgba(156, 204, 101, 0.1)',
  },
  creditChip: {
    admin: '#FFD700',
    success: '#7CB342',
    warning: '#FFA726',
    error: '#EF5350',
  },
};

// Typography
export const typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
};

// Spacing
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border radius
export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 9999,
};

