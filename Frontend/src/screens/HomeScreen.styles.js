import { StyleSheet, Dimensions } from 'react-native';
import { Colors } from '../constants/colors';

const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingBottom: 24,
  },

  // ==========================================
  // 1. HERO CAROUSEL BANNERS
  // ==========================================
  bannerSection: {
    marginTop: 10,
    marginBottom: 18,
  },
  bannerSlide: {
    width: width - 32,
    marginHorizontal: 16,
    height: 195,
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1E1B4B',
    elevation: 6,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    opacity: 0.9,
  },
  bannerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    padding: 20,
    justifyContent: 'space-between',
  },
  bannerTag: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  bannerTagText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 28,
    maxWidth: '85%',
    letterSpacing: -0.4,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.92)',
    fontWeight: '600',
    marginTop: 4,
  },
  bannerBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 22,
    marginTop: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  bannerBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: 0.3,
  },

  // ==========================================
  // SECTION HEADERS (COLORFUL & MODERN)
  // ==========================================
  section: {
    marginBottom: 26,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionIndicator: {
    width: 4,
    height: 18,
    borderRadius: 2,
    backgroundColor: '#2563EB',
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  seeAllPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  seeAllBtn: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563EB',
  },

  categoriesScroll: {
    paddingLeft: 16,
    paddingRight: 6,
  },
  horizontalList: {
    paddingLeft: 16,
    paddingRight: 6,
  },
  horizontalCardWrapper: {
    marginRight: 14,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    gap: 12,
  },

  // ==========================================
  // 2. PAN INDIA VIP GUARANTEE CARD
  // ==========================================
  infoCard: {
    marginHorizontal: 16,
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    elevation: 4,
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
  infoIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  infoTextCol: {
    flex: 1,
  },
  infoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  infoBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  infoBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#0F172A',
  },
  infoSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 16,
    fontWeight: '500',
  },
  infoActionText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38BDF8',
    marginTop: 4,
  },

  // ==========================================
  // 3. FLASH DEALS (VIBRANT GRADIENT STYLE)
  // ==========================================
  flashSection: {
    marginBottom: 26,
    backgroundColor: '#FFF7ED',
    paddingVertical: 18,
    borderRadius: 24,
    marginHorizontal: 12,
    borderWidth: 1.5,
    borderColor: '#FDBA74',
    elevation: 3,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  flashHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  flashTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flashIconPill: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#EA580C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flashTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#C2410C',
    letterSpacing: -0.4,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
    borderWidth: 1,
    borderColor: '#F97316',
  },
  timerText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#F97316',
    letterSpacing: 0.5,
  },

  // ==========================================
  // 4. FEATURED SELLERS & ARTISANS
  // ==========================================
  sellerCard: {
    width: 255,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 3,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  sellerBanner: {
    width: '100%',
    height: 80,
    backgroundColor: '#E2E8F0',
  },
  sellerBody: {
    padding: 14,
    marginTop: -28,
  },
  sellerLogoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  sellerLogo: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    backgroundColor: '#F8FAFC',
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  sellerName: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 8,
    letterSpacing: -0.2,
  },
  sellerSpecialty: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
    marginTop: 2,
    height: 32,
    fontWeight: '500',
  },
  sellerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  sellerRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  sellerRatingText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
  },
  sellerCity: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },

  // ==========================================
  // 5. SPECIAL OFFERS & BANK DEALS
  // ==========================================
  offerCard: {
    width: 275,
    borderRadius: 20,
    padding: 16,
    marginRight: 14,
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  offerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  offerTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  offerDesc: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.92)',
    marginTop: 4,
    lineHeight: 16,
    fontWeight: '500',
  },
  offerCodeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  offerCode: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.2,
  },
  offerTapText: {
    fontSize: 10,
    color: '#FDE047',
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // ==========================================
  // 6. POPULAR BRANDS
  // ==========================================
  brandCard: {
    width: 112,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  brandEmojiBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  brandEmoji: {
    fontSize: 26,
  },
  brandName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  brandDiscount: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
    marginTop: 3,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },

  // ==========================================
  // 7. TRUST FEATURES GRID (WHY SHOP WITH US)
  // ==========================================
  trustSection: {
    marginTop: 10,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  trustGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  trustCard: {
    width: (width - 42) / 2,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  trustIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  trustTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  trustDesc: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 1,
  },
});

export default styles;
