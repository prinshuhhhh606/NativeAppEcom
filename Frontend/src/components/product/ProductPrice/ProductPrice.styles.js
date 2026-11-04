import { StyleSheet } from 'react-native';
import colors from '../../../theme/colors';
import typography from '../../../theme/typography';
import spacing from '../../../theme/spacing';

export const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
  },
  price: {
    ...typography.h3,
    color: colors.slate900,
    fontWeight: '800',
  },
  priceLarge: {
    ...typography.h2,
    fontWeight: '800',
    color: colors.slate950,
  },
  priceSmall: {
    ...typography.bodyMedium,
    fontWeight: '700',
  },
  mrp: {
    ...typography.bodySmall,
    color: colors.slate400,
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    backgroundColor: colors.successSoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    ...typography.caption,
    color: colors.successDark,
    fontWeight: '700',
  },
});

export default styles;

