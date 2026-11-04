import { StyleSheet } from 'react-native';
import colors from '../../../theme/colors';
import radius from '../../../theme/radius';
import spacing from '../../../theme/spacing';
import shadows from '../../../theme/shadows';

export const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.slate200,
    padding: spacing.cardPadding,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  cardFlat: {
    borderWidth: 1,
    borderColor: colors.slate200,
    elevation: 0,
    shadowOpacity: 0,
  },
  cardElevated: {
    ...shadows.md,
  },
  cardHighlight: {
    borderColor: colors.primaryLight,
  },
});

export default styles;

