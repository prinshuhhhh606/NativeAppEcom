/**
 * Bharat Bazaar - Centralized Typography Tokens
 * Standardized scale for clean visual hierarchy across Android & iOS
 */
import { Platform } from 'react-native';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

export const fontWeights = {
  regular: '400',
  medium: '500',
  semiBold: '600',
  bold: '700',
  extraBold: '800',
};

export const typography = {
  display: {
    fontFamily,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: fontWeights.extraBold,
    letterSpacing: -0.5,
  },
  h1: {
    fontFamily,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: fontWeights.bold,
    letterSpacing: -0.3,
  },
  h2: {
    fontFamily,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: fontWeights.bold,
    letterSpacing: -0.2,
  },
  h3: {
    fontFamily,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: fontWeights.semiBold,
  },
  subheading: {
    fontFamily,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: fontWeights.medium,
  },
  bodyLarge: {
    fontFamily,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: fontWeights.regular,
  },
  bodyMedium: {
    fontFamily,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: fontWeights.regular,
  },
  bodySmall: {
    fontFamily,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: fontWeights.regular,
  },
  caption: {
    fontFamily,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: fontWeights.medium,
  },
  button: {
    fontFamily,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.2,
  },
  buttonSmall: {
    fontFamily,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: fontWeights.semiBold,
  },
  label: {
    fontFamily,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: fontWeights.semiBold,
  },
};

export default typography;

