import { StyleSheet } from 'react-native';
import colors from '../../../theme/colors';
import radius from '../../../theme/radius';
import spacing from '../../../theme/spacing';
import typography from '../../../theme/typography';
import shadows from '../../../theme/shadows';

export const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.button,
  },
  // Sizes
  sizeSmall: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    minHeight: 34,
  },
  sizeMedium: {
    paddingVertical: spacing.buttonPaddingVertical,
    paddingHorizontal: spacing.buttonPaddingHorizontal,
    minHeight: 46,
  },
  sizeLarge: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    minHeight: 52,
  },

  // Variants
  variantPrimary: {
    backgroundColor: colors.primary,
    ...shadows.sm,
  },
  variantSecondary: {
    backgroundColor: colors.secondary,
    ...shadows.sm,
  },
  variantOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  variantGhost: {
    backgroundColor: 'transparent',
  },
  variantDanger: {
    backgroundColor: colors.error,
    ...shadows.sm,
  },
  variantSuccess: {
    backgroundColor: colors.success,
    ...shadows.sm,
  },

  // Text Variants
  textBase: {
    ...typography.button,
    textAlign: 'center',
  },
  textSmall: {
    fontSize: 12,
  },
  textMedium: {
    fontSize: 14,
  },
  textLarge: {
    fontSize: 16,
  },

  textPrimary: {
    color: colors.white,
  },
  textSecondary: {
    color: colors.white,
  },
  textOutline: {
    color: colors.primary,
  },
  textGhost: {
    color: colors.primary,
  },
  textDanger: {
    color: colors.white,
  },
  textSuccess: {
    color: colors.white,
  },

  // State Modifiers
  disabled: {
    opacity: 0.55,
    elevation: 0,
    shadowOpacity: 0,
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});

export default styles;

