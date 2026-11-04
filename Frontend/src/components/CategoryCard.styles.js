import { StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

export const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginRight: 16,
    width: 72,
  },
  imageWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surface,
    padding: 3,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  imageWrapperSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySoft,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  title: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  titleSelected: {
    color: Colors.primary,
    fontWeight: '700',
  },
});

export default styles;

