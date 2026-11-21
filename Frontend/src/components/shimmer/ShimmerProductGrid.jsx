import React from 'react';
import { View, StyleSheet } from 'react-native';
import ShimmerProductCard from './ShimmerProductCard';
import ShimmerProvider from './ShimmerContext';

/**
 * ShimmerProductGrid: 2-column product grid skeleton for ProductList, Search, Category, Wishlist.
 */
export const ShimmerProductGrid = ({ count = 6, style }) => {
  const items = Array.from({ length: count });

  return (
    <ShimmerProvider>
      <View style={[styles.grid, style]}>
        {items.map((_, idx) => (
          <ShimmerProductCard key={idx} />
        ))}
      </View>
    </ShimmerProvider>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
});

export default React.memo(ShimmerProductGrid);
