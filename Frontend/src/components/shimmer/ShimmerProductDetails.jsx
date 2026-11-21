import React from 'react';
import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
import ShimmerProvider from './ShimmerContext';
import ShimmerBox from './ShimmerBox';
import ShimmerProductCarousel from './ShimmerProductCarousel';

const { width } = Dimensions.get('window');

/**
 * ShimmerProductDetails: Full-screen skeleton matching ProductDetailsScreen.jsx.
 * Replaces the full-screen spinner with an instant preview of product details.
 */
export const ShimmerProductDetails = () => {
  return (
    <ShimmerProvider>
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {/* Main Product Image Carousel Placeholder */}
          <View style={styles.imageGalleryContainer}>
            <ShimmerBox width={width} height={340} borderRadius={0} />
            {/* Gallery pagination dots */}
            <View style={styles.dotsRow}>
              <ShimmerBox width={8} height={8} borderRadius={4} style={{ marginHorizontal: 3 }} />
              <ShimmerBox width={18} height={8} borderRadius={4} style={{ marginHorizontal: 3 }} />
              <ShimmerBox width={8} height={8} borderRadius={4} style={{ marginHorizontal: 3 }} />
            </View>
          </View>

          {/* Core Info Section */}
          <View style={styles.infoCard}>
            {/* Category & Brand pill */}
            <ShimmerBox width={85} height={14} borderRadius={4} style={{ marginBottom: 8 }} />

            {/* Product Title (2 lines) */}
            <ShimmerBox width="94%" height={18} borderRadius={4} style={{ marginBottom: 6 }} />
            <ShimmerBox width="70%" height={18} borderRadius={4} style={{ marginBottom: 12 }} />

            {/* Rating row */}
            <View style={styles.ratingRow}>
              <ShimmerBox width={55} height={20} borderRadius={6} />
              <ShimmerBox width={80} height={14} borderRadius={4} style={{ marginLeft: 8 }} />
              <ShimmerBox width={70} height={14} borderRadius={4} style={{ marginLeft: 'auto' }} />
            </View>

            {/* Price & Discount breakdown */}
            <View style={styles.priceContainer}>
              <ShimmerBox width={90} height={26} borderRadius={6} />
              <ShimmerBox width={60} height={18} borderRadius={4} style={{ marginLeft: 10 }} />
              <ShimmerBox width={65} height={20} borderRadius={6} style={{ marginLeft: 10 }} />
            </View>
            <ShimmerBox width={120} height={12} borderRadius={3} style={{ marginBottom: 14 }} />

            {/* Delivery Pincode Box */}
            <View style={styles.pincodeBox}>
              <View style={{ flex: 1 }}>
                <ShimmerBox width={120} height={12} borderRadius={3} style={{ marginBottom: 6 }} />
                <ShimmerBox width={180} height={14} borderRadius={4} />
              </View>
              <ShimmerBox width={65} height={28} borderRadius={8} />
            </View>

            {/* Variants selection (Colors / Sizes) */}
            <View style={styles.variantsSection}>
              <ShimmerBox width={90} height={14} borderRadius={4} style={{ marginBottom: 10 }} />
              <View style={styles.chipsRow}>
                <ShimmerBox width={50} height={32} borderRadius={8} style={{ marginRight: 8 }} />
                <ShimmerBox width={50} height={32} borderRadius={8} style={{ marginRight: 8 }} />
                <ShimmerBox width={50} height={32} borderRadius={8} style={{ marginRight: 8 }} />
                <ShimmerBox width={50} height={32} borderRadius={8} />
              </View>
            </View>

            {/* Description placeholder */}
            <View style={{ marginTop: 14 }}>
              <ShimmerBox width={100} height={14} borderRadius={4} style={{ marginBottom: 8 }} />
              <ShimmerBox width="100%" height={12} borderRadius={3} style={{ marginBottom: 5 }} />
              <ShimmerBox width="96%" height={12} borderRadius={3} style={{ marginBottom: 5 }} />
              <ShimmerBox width="80%" height={12} borderRadius={3} />
            </View>
          </View>

          {/* Related products horizontal carousel */}
          <ShimmerProductCarousel count={3} titleWidth={130} style={{ marginTop: 16 }} />
        </ScrollView>

        {/* Bottom Sticky Action Bar */}
        <View style={styles.bottomBar}>
          <View style={styles.quantityPlaceholder}>
            <ShimmerBox width={85} height={42} borderRadius={10} />
          </View>
          <View style={styles.actionButtons}>
            <ShimmerBox width="48%" height={44} borderRadius={12} />
            <ShimmerBox width="48%" height={44} borderRadius={12} />
          </View>
        </View>
      </View>
    </ShimmerProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    paddingBottom: 85,
  },
  imageGalleryContainer: {
    width: '100%',
    backgroundColor: '#E2E8F0',
    position: 'relative',
  },
  dotsRow: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  pincodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginVertical: 12,
  },
  variantsSection: {
    marginVertical: 6,
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  quantityPlaceholder: {
    marginRight: 12,
  },
  actionButtons: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

export default React.memo(ShimmerProductDetails);
