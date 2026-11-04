import { StyleSheet } from 'react-native';
import colors from '../../../theme/colors';
import radius from '../../../theme/radius';
import typography from '../../../theme/typography';

export const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.badge,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // Color variants
  variantSuccess: {
    backgroundColor: colors.successSoft,
  },
  textSuccess: {
    color: colors.successDark,
  },

  variantWarning: {
    backgroundColor: colors.warningSoft,
  },
  textWarning: {
    color: colors.warningDark,
  },

  variantError: {
    backgroundColor: colors.errorSoft,
  },
  textError: {
    color: colors.errorDark,
  },

  variantInfo: {
    backgroundColor: colors.infoSoft,
  },
  textInfo: {
    color: colors.infoDark,
  },

  variantPrimary: {
    backgroundColor: colors.primarySoft,
  },
  textPrimary: {
    color: colors.primaryDark,
  },

  variantNeutral: {
    backgroundColor: colors.slate100,
  },
  textNeutral: {
    color: colors.slate700,
  },
});

export default styles;

