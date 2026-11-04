import { StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    padding: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: Colors.primary,
    marginBottom: 8,
  },
  changePhotoText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  genderLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  genderBtn: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
  },
  genderBtnSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySoft,
  },
  genderText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  genderTextSelected: {
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  saveBtn: {
    marginTop: 10,
  },
});

export default styles;

