import { StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

export const styles = StyleSheet.create({
  buttonBase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingHorizontal: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  // Sizes
  sizeSmall: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  sizeMedium: {
    height: 48,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  sizeLarge: {
    height: 54,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  // Variants
  variantPrimary: {
    backgroundColor: Colors.primary,
  },
  variantSecondary: {
    backgroundColor: Colors.secondary,
  },
  variantAccent: {
    backgroundColor: Colors.accent,
  },
  variantOutline: {
    backgroundColor: Colors.transparent,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    elevation: 0,
    shadowOpacity: 0,
  },
  variantOutlineSecondary: {
    backgroundColor: Colors.transparent,
    borderWidth: 1.5,
    borderColor: Colors.border,
    elevation: 0,
    shadowOpacity: 0,
  },
  variantGhost: {
    backgroundColor: Colors.transparent,
    elevation: 0,
    shadowOpacity: 0,
  },
  variantDanger: {
    backgroundColor: Colors.danger,
  },
  variantSuccess: {
    backgroundColor: Colors.success,
  },
  // State
  disabled: {
    opacity: 0.55,
    elevation: 0,
    shadowOpacity: 0,
  },
  // Text Styles
  textBase: {
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  textSizeSmall: {
    fontSize: 13,
  },
  textSizeMedium: {
    fontSize: 15,
  },
  textSizeLarge: {
    fontSize: 16,
  },
  textPrimary: {
    color: Colors.white,
  },
  textSecondary: {
    color: Colors.white,
  },
  textAccent: {
    color: Colors.black,
  },
  textOutline: {
    color: Colors.primary,
  },
  textOutlineSecondary: {
    color: Colors.textPrimary,
  },
  textGhost: {
    color: Colors.primary,
  },
  textDanger: {
    color: Colors.white,
  },
  textSuccess: {
    color: Colors.white,
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});

export default styles;

