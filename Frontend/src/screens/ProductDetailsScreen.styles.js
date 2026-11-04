import { StyleSheet, Dimensions } from 'react-native';
import { Colors } from '../constants/colors';

const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollContent: {
    paddingBottom: 110,
  },

  // Image Gallery & Zoom
  galleryContainer: {
    width,
    height: width * 0.95,
    backgroundColor: '#F8F9FA',
    position: 'relative',
  },
  galleryImage: {
    width,
    height: '100%',
    resizeMode: 'contain',
  },
  zoomHintBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  zoomHintText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '600',
  },
  wishlistFloatBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  paginationRow: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.6)',
    marginHorizontal: 3,
  },
  activeDot: {
    width: 16,
    backgroundColor: Colors.primary,
  },

  // Thumbnails row
  thumbnailsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FAFBFD',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  thumbnailItem: {
    width: 54,
    height: 54,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
    backgroundColor: Colors.white,
  },
  thumbnailActive: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  thumbnailImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  // Basic Info Section
  infoSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  stockBadgeText: {
    color: '#2E7D32',
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    lineHeight: 26,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E7D32',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 10,
    gap: 3,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.white,
  },
  reviewCount: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
  },
  price: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.textPrimary,
    marginRight: 10,
  },
  originalPrice: {
    fontSize: 16,
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
    marginRight: 10,
  },
  discountBadge: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    color: '#D32F2F',
    fontSize: 13,
    fontWeight: '800',
  },
  taxInfo: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
  },

  // Seller Card Section
  sellerSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: '#FAFAFB',
  },
  sellerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sellerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  sellerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  sellerAvatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#3730A3',
  },
  sellerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sellerName: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  sellerSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  visitStoreBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  visitStoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },

  // Trust Badges Grid
  trustRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  trustItem: {
    alignItems: 'center',
    width: '24%',
  },
  trustIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  trustLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 13,
  },

  // Pincode & Serviceability Section
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  pincodeBox: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  pincodeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pincodePrompt: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  changePincode: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  deliveryStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  deliveryDateText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.success,
    marginLeft: 6,
  },
  codText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },

  // Variants
  variantRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  variantChip: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.surfaceAlt,
  },
  variantChipSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySoft,
  },
  variantChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  variantChipTextSelected: {
    color: Colors.primaryDark,
    fontWeight: '700',
  },

  // Quantity
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    minWidth: 24,
    textAlign: 'center',
  },

  // Specifications Table
  specTable: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ECEFF1',
    overflow: 'hidden',
  },
  specRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  specRowEven: {
    backgroundColor: '#F8FAFC',
  },
  specRowOdd: {
    backgroundColor: Colors.white,
  },
  specKey: {
    width: '40%',
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  specValue: {
    width: '60%',
    fontSize: 13,
    color: Colors.textPrimary,
  },

  // Frequently Bought Together Bundle
  bundleCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  bundleItemsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  bundleThumb: {
    width: 65,
    height: 65,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E7FF',
    backgroundColor: Colors.white,
  },
  bundlePlus: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primary,
  },
  bundlePricesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E0F2FE',
    paddingTop: 10,
    marginBottom: 10,
  },
  bundleLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  bundleTotalPrice: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  bundleSaveBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  bundleBtn: {
    backgroundColor: '#0284C7',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  bundleBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '800',
  },

  // Customer Reviews Summary & Cards
  reviewSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },
  reviewBigScore: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 16,
    borderRightWidth: 1,
    borderRightColor: Colors.borderLight,
  },
  reviewScoreNum: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  reviewScoreStars: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  reviewScoreCount: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  reviewBarsCol: {
    flex: 1,
    gap: 4,
  },
  starBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  starBarLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    width: 24,
  },
  barTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 3,
  },
  userReviewCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  userReviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userReviewName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  verifiedBuyerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  verifiedBuyerText: {
    fontSize: 11,
    color: Colors.success,
    fontWeight: '600',
  },
  userReviewComment: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginTop: 4,
  },

  // Description & Highlights
  descriptionText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  highlightBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginRight: 10,
  },
  highlightText: {
    fontSize: 13,
    color: Colors.textPrimary,
    flex: 1,
  },

  // Modal Zoom
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomImage: {
    width: width * 0.95,
    height: width * 0.95,
    resizeMode: 'contain',
  },

  // Bottom Sticky Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    gap: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 8,
  },
  cartBtn: {
    flex: 1,
  },
  buyNowBtn: {
    flex: 1,
  },
});

export default styles;
