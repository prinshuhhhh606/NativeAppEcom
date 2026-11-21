import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import ShimmerBox from './ShimmerBox';

/**
 * ShimmerCategory: Circular icon category carousel skeleton for Home Screen.
 */
export const ShimmerCategory = ({ count = 6, style }) => {
  const items = Array.from({ length: count });

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.scrollContent, style]}
    >
      {items.map((_, idx) => (
        <View key={idx} style={styles.item}>
          <ShimmerBox width={60} height={60} borderRadius={30} style={styles.circle} />
          <ShimmerBox width={50} height={10} borderRadius={3} style={{ marginTop: 6 }} />
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  item: {
    alignItems: 'center',
    marginRight: 16,
  },
  circle: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
});

export default React.memo(ShimmerCategory);
