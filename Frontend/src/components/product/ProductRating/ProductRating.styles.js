import { StyleSheet } from 'react-native';
import colors from '../../../theme/colors';
import typography from '../../../theme/typography';
import radius from '../../../theme/radius';

export const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
    gap: 3,
  },
  ratingText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
  },
  reviewCount: {
    ...typography.caption,
    color: colors.slate500,
    marginLeft: 6,
  },
});

export default styles;

