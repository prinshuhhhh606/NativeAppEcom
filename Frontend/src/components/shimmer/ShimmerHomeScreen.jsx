import React from 'react';
import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
import ShimmerProvider from './ShimmerContext';
import ShimmerBox from './ShimmerBox';
import ShimmerBanner from './ShimmerBanner';
import ShimmerCategory from './ShimmerCategory';
import ShimmerProductCarousel from './ShimmerProductCarousel';
import ShimmerProductGrid from './ShimmerProductGrid';

const { width: _width } = Dimensions.get('window');

/**
 * ShimmerHomeScreen: Complete composite skeleton placeholder for the Home Screen.
 * Replaces blank spaces and spinners during initial home feed fetch.
 */
export const ShimmerHomeScreen = () => {
  return (
    <ShimmerProvider>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header Placeholder (Delivery Address + Notifications) */}
        <View style={styles.headerRow}>
          <View>
            <ShimmerBox width={90} height={12} borderRadius={3} style={{ marginBottom: 5 }} />
            <ShimmerBox width={150} height={16} borderRadius={4} />
          </View>
          <View style={styles.headerIcons}>
            <ShimmerBox width={36} height={36} borderRadius={18} style={{ marginRight: 8 }} />
            <ShimmerBox width={36} height={36} borderRadius={18} />
          </View>
        </View>

        {/* Search Bar Placeholder */}
        <View style={styles.searchBar}>
          <ShimmerBox width="100%" height={44} borderRadius={12} />
        </View>

        {/* Hero Promotional Banner */}
        <ShimmerBanner />

        {/* Categories Bar */}
        <ShimmerCategory />

        {/* Flash Deals Card Section */}
        <View style={styles.flashDealsContainer}>
          <View style={styles.flashHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <ShimmerBox width={95} height={18} borderRadius={4} />
              <ShimmerBox width={70} height={20} borderRadius={10} style={{ marginLeft: 8 }} />
            </View>
            <ShimmerBox width={60} height={14} borderRadius={4} />
          </View>
          <ShimmerProductCarousel count={3} cardWidth={150} titleWidth={0} />
        </View>

        {/* Trending Products Carousel */}
        <ShimmerProductCarousel count={4} titleWidth={160} />

        {/* Best Sellers Section */}
        <View style={styles.sectionHeader}>
          <ShimmerBox width={140} height={18} borderRadius={4} />
          <ShimmerBox width={50} height={14} borderRadius={4} />
        </View>
        <ShimmerProductGrid count={4} />
      </ScrollView>
    </ShimmerProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBar: {
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  flashDealsContainer: {
    backgroundColor: '#FFF7ED',
    marginVertical: 12,
    paddingVertical: 14,
    borderRadius: 20,
    marginHorizontal: 12,
  },
  flashHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
    marginTop: 8,
  },
});

export default React.memo(ShimmerHomeScreen);
