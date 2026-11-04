import { StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

export const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  // Variant Backgrounds
  primary: {
    backgroundColor: Colors.primarySoft,
  },
  primaryText: {
    color: Colors.primaryDark,
  },
  success: {
    backgroundColor: Colors.successLight,
  },
  successText: {
    color: Colors.success,
  },
  warning: {
    backgroundColor: Colors.warningLight,
  },
  warningText: {
    color: Colors.warning,
  },
  discount: {
    backgroundColor: '#E8F5E9',
  },
  discountText: {
    color: '#2E7D32',
  },
  dark: {
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  darkText: {
    color: Colors.white,
  },
});

export default styles;

