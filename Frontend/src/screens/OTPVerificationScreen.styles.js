import { StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 6,
  },
  phoneText: {
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  demoHintBox: {
    backgroundColor: '#FFFDE7',
    borderWidth: 1,
    borderColor: '#FFF59D',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginVertical: 16,
  },
  demoHintText: {
    fontSize: 13,
    color: '#F57F17',
    fontWeight: '600',
  },
  otpInput: {
    width: '100%',
    height: 56,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: 10,
    color: Colors.primary,
    backgroundColor: Colors.surfaceAlt,
    marginVertical: 16,
  },
  otpInputFocused: {
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },
  verifyBtn: {
    width: '100%',
    marginTop: 10,
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
  },
  resendText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  resendAction: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
    marginLeft: 6,
  },
});

export default styles;

