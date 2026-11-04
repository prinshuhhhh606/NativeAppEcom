import { StyleSheet } from 'react-native';
import colors from '../../../theme/colors';
import spacing from '../../../theme/spacing';
import typography from '../../../theme/typography';
import shadows from '../../../theme/shadows';

export const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate200,
    ...shadows.sm,
  },
  inner: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenHorizontal,
  },
  leftAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  titleWrapperLeftAlign: {
    alignItems: 'flex-start',
    marginLeft: spacing.xs,
  },
  title: {
    ...typography.h3,
    color: colors.slate900,
  },
  subtitle: {
    ...typography.caption,
    color: colors.slate500,
    marginTop: 1,
  },
  rightAction: {
    minWidth: 40,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
});

export default styles;

