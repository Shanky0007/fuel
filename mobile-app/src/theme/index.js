export const colors = {
    // Primary Gradient - Vibrant Purple to Blue
    primary: '#6366F1', // Indigo 500
    primaryDark: '#4F46E5', // Indigo 600
    primaryLight: '#818CF8', // Indigo 400

    // Accent Colors - Energetic & Fresh
    accent: '#EC4899', // Pink 500
    accentLight: '#F472B6', // Pink 400
    success: '#10B981', // Emerald 500
    successLight: '#34D399', // Emerald 400
    warning: '#F59E0B', // Amber 500
    error: '#EF4444', // Red 500

    // Backgrounds - Modern & Clean
    background: '#F8FAFC', // Slate 50
    backgroundDark: '#F1F5F9', // Slate 100
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',

    // Text Colors
    text: '#0F172A', // Slate 900
    textSecondary: '#475569', // Slate 600
    textLight: '#94A3B8', // Slate 400
    textMuted: '#CBD5E1', // Slate 300

    // Utility
    white: '#FFFFFF',
    black: '#000000',
    border: '#E2E8F0', // Slate 200
    borderLight: '#F1F5F9', // Slate 100

    // Gradients (for LinearGradient or background)
    gradientPrimary: ['#6366F1', '#8B5CF6', '#EC4899'], // Indigo to Purple to Pink
    gradientSuccess: ['#10B981', '#059669'], // Emerald gradient
    gradientCard: ['#FFFFFF', '#F8FAFC'], // Subtle card gradient
};

export const spacing = {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 48,
};

export const borderRadius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
};

export const shadows = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    lg: {
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 6,
    },
};

export const typography = {
    h1: { fontSize: 32, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
    h2: { fontSize: 24, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
    h3: { fontSize: 20, fontWeight: '600', color: colors.text },
    body: { fontSize: 16, fontWeight: '400', color: colors.text, lineHeight: 24 },
    bodyBold: { fontSize: 16, fontWeight: '600', color: colors.text },
    caption: { fontSize: 14, fontWeight: '400', color: colors.textLight },
    small: { fontSize: 12, fontWeight: '400', color: colors.textMuted },
};
