import { StyleSheet } from 'react-native';
import colors from '../../../theme/colors';
import radius from '../../../theme/radius';

export const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.slate200,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  cardSkeleton: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.slate200,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});

export default styles;

