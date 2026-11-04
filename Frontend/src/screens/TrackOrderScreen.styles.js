import { StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollContent: {
    padding: 20,
  },
  infoCard: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  value: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  deliveryHighlight: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.success,
    marginTop: 8,
  },
  timelineSection: {
    paddingLeft: 6,
    marginBottom: 24,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  stepRow: {
    flexDirection: 'row',
    minHeight: 64,
  },
  indicatorCol: {
    alignItems: 'center',
    width: 30,
  },
  circle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleCompleted: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  circleCurrent: {
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
    borderWidth: 2.5,
  },
  pulseInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 4,
  },
  lineCompleted: {
    backgroundColor: Colors.primary,
  },
  stepInfo: {
    flex: 1,
    marginLeft: 14,
    paddingTop: 1,
  },
  stepStatus: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  stepStatusCompleted: {
    color: Colors.primaryDark,
  },
  stepStatusCurrent: {
    color: Colors.primary,
    fontWeight: '800',
  },
  stepTime: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  currentBadge: {
    backgroundColor: '#EFF6FF',
    borderColor: '#93C5FD',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1D4ED8',
    letterSpacing: 0.5,
  },
  activeTrackingCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activeTrackingText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#166534',
  },
  activeTrackingSub: {
    fontSize: 11,
    color: '#15803D',
    marginTop: 2,
  },
  courierCard: {
    backgroundColor: Colors.primarySoft,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  courierTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primaryDark,
    marginBottom: 4,
  },
  courierText: {
    fontSize: 13,
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  otpRow: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  otpLabel: {
    color: '#1E40AF',
    fontWeight: '700',
  },
  otpValue: {
    color: '#1E40AF',
    fontWeight: '900',
    letterSpacing: 3,
    fontSize: 16,
  },
  actionButtonsContainer: {
    marginTop: 24,
    gap: 12,
  },
  continueShoppingBtn: {
    width: '100%',
  },
  viewOrdersBtn: {
    width: '100%',
  },

  // Real-Time Contact Cards & Actions
  contactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  contactAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  contactAvatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  contactName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  contactSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  contactCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  contactCallBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  sellerCallBtn: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  sellerCallBtnText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
  },

  // Security OTP Box
  otpSecurityCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  otpCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  otpCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E40AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  otpBadgeContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    marginVertical: 6,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  otpLargeText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#1D4ED8',
    letterSpacing: 8,
    textAlign: 'center',
  },
  otpHelpNotice: {
    fontSize: 11,
    color: '#3B82F6',
    textAlign: 'center',
    marginTop: 4,
  },

  // Live Sync Banner
  liveSyncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 12,
  },
  liveSyncLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  liveSyncText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  liveSyncTime: {
    color: '#94A3B8',
    fontSize: 11,
  },

  // Google Maps External Banner
  googleMapsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 4,
    marginBottom: 14,
  },
  googleMapsBannerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1D4ED8',
  },
});

export default styles;

