/**
 * Dark Mode Theme Configuration
 * Professional & Consistent Design System
 */

export const darkTheme = {
  colors: {
    // Background colors
    background: '#0F0F0F',
    surface: '#1A1A1A',
    card: '#1E1E1E',
    elevated: '#242424',

    // Primary colors - Cyan/Teal
    primary: '#06B6D4',
    primaryDark: '#0891B2',
    primaryLight: '#22D3EE',
    primaryGlow: 'rgba(6, 182, 212, 0.3)',

    // Accent colors - Purple
    accent: '#8B5CF6',
    accentDark: '#7C3AED',
    accentLight: '#A78BFA',
    accentGlow: 'rgba(139, 92, 246, 0.3)',

    // Secondary colors - Pink
    secondary: '#EC4899',
    secondaryDark: '#DB2777',
    secondaryLight: '#F472B6',

    // Text colors
    text: '#FFFFFF',
    textSecondary: '#A3A3A3',
    textTertiary: '#737373',
    textDisabled: '#525252',
    textOnPrimary: '#000000',

    // Border and divider
    border: '#2E2E2E',
    borderLight: '#3A3A3A',
    divider: '#252525',

    // Status colors
    success: '#10B981',
    successLight: '#34D399',
    successGlow: 'rgba(16, 185, 129, 0.3)',
    warning: '#F59E0B',
    warningLight: '#FBBF24',
    error: '#EF4444',
    errorLight: '#F87171',
    info: '#3B82F6',
    infoLight: '#60A5FA',

    // Station status colors
    stationOpen: '#10B981',
    stationClosed: '#EF4444',
    stationMaintenance: '#F59E0B',

    // Disabled state
    disabled: '#525252',
    disabledBackground: '#1A1A1A',

    // Overlay
    overlay: 'rgba(0, 0, 0, 0.6)',
    overlayLight: 'rgba(0, 0, 0, 0.4)',

    // Gradient colors for use with LinearGradient
    gradientPrimary: ['#06B6D4', '#8B5CF6'],
    gradientAccent: ['#8B5CF6', '#EC4899'],
    gradientSuccess: ['#10B981', '#06B6D4'],
    gradientWarning: ['#F59E0B', '#FBBF24'],

    // Utility
    white: '#FFFFFF',
    black: '#000000',
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
  },

  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    round: 9999,
  },

  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    display: 40,
  },

  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },

  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 4,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 8,
    },
    glow: {
      shadowColor: '#06B6D4',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 8,
    },
    glowAccent: {
      shadowColor: '#8B5CF6',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 8,
    },
  },

  animation: {
    fast: 150,
    normal: 250,
    slow: 400,
  },
};

export default darkTheme;
