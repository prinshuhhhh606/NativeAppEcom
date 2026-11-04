import { StyleSheet } from 'react-native';
import colors from '../../../theme/colors';
import radius from '../../../theme/radius';
import spacing from '../../../theme/spacing';
import typography from '../../../theme/typography';

export const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs + 2,
  },
  label: {
    ...typography.label,
    color: colors.slate700,
  },
  requiredStar: {
    color: colors.error,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.slate50,
    borderWidth: 1.2,
    borderColor: colors.slate200,
    borderRadius: radius.input,
    paddingHorizontal: spacing.inputPaddingHorizontal,
    minHeight: 48,
  },
  inputWrapperFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  inputWrapperError: {
    borderColor: colors.error,
    backgroundColor: colors.errorSoft,
  },
  inputWrapperDisabled: {
    backgroundColor: colors.slate100,
    borderColor: colors.slate200,
  },
  input: {
    flex: 1,
    ...typography.bodyMedium,
    color: colors.slate900,
    paddingVertical: spacing.inputPaddingVertical,
  },
  leftIcon: {
    marginRight: spacing.sm,
  },
  rightIcon: {
    marginLeft: spacing.sm,
    padding: spacing.xxs,
  },
  helperText: {
    ...typography.caption,
    color: colors.slate500,
    marginTop: spacing.xxs + 2,
    marginLeft: 2,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xxs + 2,
    marginLeft: 2,
    fontWeight: '600',
  },
});

export default styles;

