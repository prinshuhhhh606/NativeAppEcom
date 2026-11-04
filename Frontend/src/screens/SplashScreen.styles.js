import { StyleSheet, Dimensions } from 'react-native';
import { Colors } from '../constants/colors';

const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logoContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: Colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: Colors.primaryLight,
  },
  logoText: {
    fontSize: 44,
  },
  appName: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 6,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  panIndiaBadge: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F57F17',
    marginLeft: 6,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  loader: {
    marginBottom: 10,
  },
  footerText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
});

export default styles;

