import colors from './colors';
import typography from './typography';
import spacing from './spacing';
import radius from './radius';
import dimensions from './dimensions';

export const darkTheme = {
  isDark: true,
  colors: {
    ...colors,
    primary: '#FF7043',
    primaryLight: '#FFAB91',
    primaryDark: '#D84315',
    primarySoft: '#2D1600',

    secondary: '#F8FAFC',
    secondaryLight: '#E2E8F0',
    secondaryDark: '#94A3B8',
    secondarySoft: '#1E293B',

    background: '#0B0F19',
    backgroundAlt: '#111827',
    surface: '#151E2E',
    surfaceCard: '#1E293B',
    surfaceHeader: '#111827',
    surfaceSubtle: '#1E293B',

    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    textInverse: '#0F172A',

    border: '#334155',
    borderLight: '#1E293B',
    borderFocused: '#FF7043',

    divider: '#334155',
    backdrop: 'rgba(0, 0, 0, 0.8)',
  },
  typography,
  spacing,
  radius,
  shadows: {
    none: { elevation: 0 },
    sm: { elevation: 1 },
    md: { elevation: 2 },
    lg: { elevation: 4 },
    xl: { elevation: 6 },
    card: { elevation: 2 },
    primaryGlow: { elevation: 4 },
  },
  dimensions,
};

export default darkTheme;

