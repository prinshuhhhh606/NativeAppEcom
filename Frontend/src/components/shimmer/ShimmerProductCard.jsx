import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import ShimmerBox from './ShimmerBox';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 36) / 2;

/**
 * ShimmerProductCard: Exact layout skeleton matching ProductCard.jsx.
 */
export const ShimmerProductCard = ({ style, cardWidth = CARD_WIDTH }) => {
  return (
    <View style={[styles.card, { width: cardWidth }, style]}>
      {/* Product Image Placeholder */}
      <View style={styles.imageContainer}>
        <ShimmerBox
          width="100%"
          height={cardWidth * 1.05}
          borderRadius={0}
        />
        {/* Wishlist button placeholder */}
        <View style={styles.wishlistPlaceholder}>
          <ShimmerBox width={28} height={28} borderRadius={14} />
        </View>
        {/* Discount badge placeholder */}
        <View style={styles.badgePlaceholder}>
          <ShimmerBox width={46} height={16} borderRadius={4} />
        </View>
      </View>

      {/* Product Content */}
      <View style={styles.content}>
        {/* Category */}
        <ShimmerBox width={55} height={10} borderRadius={3} style={{ marginBottom: 6 }} />

        {/* Title Lines */}
        <ShimmerBox width="92%" height={12} borderRadius={3} style={{ marginBottom: 4 }} />
        <ShimmerBox width="68%" height={12} borderRadius={3} style={{ marginBottom: 8 }} />

        {/* Rating row */}
        <View style={styles.ratingRow}>
          <ShimmerBox width={42} height={15} borderRadius={4} />
          <ShimmerBox width={32} height={11} borderRadius={3} style={{ marginLeft: 6 }} />
        </View>

        {/* Price row */}
        <View style={styles.priceRow}>
          <ShimmerBox width={65} height={16} borderRadius={4} />
          <ShimmerBox width={45} height={13} borderRadius={3} style={{ marginLeft: 8 }} />
        </View>

        {/* Free delivery badge */}
        <ShimmerBox width="78%" height={10} borderRadius={3} style={{ marginBottom: 10 }} />

        {/* Add to Cart button */}
        <ShimmerBox width="100%" height={32} borderRadius={6} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    backgroundColor: '#F8FAFC',
  },
  wishlistPlaceholder: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  badgePlaceholder: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
  content: {
    padding: 10,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
});

export default React.memo(ShimmerProductCard);
