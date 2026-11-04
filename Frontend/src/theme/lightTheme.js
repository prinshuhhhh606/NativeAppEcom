import colors from './colors';
import typography from './typography';
import spacing from './spacing';
import radius from './radius';
import shadows from './shadows';
import dimensions from './dimensions';

export const lightTheme = {
  isDark: false,
  colors: {
    ...colors,
    background: '#F8FAFC',
    backgroundAlt: '#F1F5F9',
    surface: '#FFFFFF',
    surfaceCard: '#FFFFFF',
    surfaceHeader: '#FFFFFF',
    surfaceSubtle: '#F8FAFC',

    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    textInverse: '#FFFFFF',

    border: '#E2E8F0',
    borderLight: '#F1F5F9',
    borderFocused: '#E64A19',

    divider: '#E2E8F0',
    backdrop: 'rgba(15, 23, 42, 0.65)',
  },
  typography,
  spacing,
  radius,
  shadows,
  dimensions,
};

export default lightTheme;

