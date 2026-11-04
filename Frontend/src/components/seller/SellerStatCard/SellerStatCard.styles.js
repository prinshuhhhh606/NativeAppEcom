import { StyleSheet } from 'react-native';
import colors from '../../../theme/colors';
import radius from '../../../theme/radius';
import spacing from '../../../theme/spacing';
import typography from '../../../theme/typography';
import shadows from '../../../theme/shadows';

export const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.cardPadding,
    borderWidth: 1,
    borderColor: colors.slate200,
    ...shadows.card,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    ...typography.caption,
    color: colors.slate500,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    ...typography.h2,
    color: colors.slate900,
    fontWeight: '800',
    marginVertical: 2,
  },
  subtext: {
    ...typography.caption,
    color: colors.slate500,
  },
});

export default styles;

