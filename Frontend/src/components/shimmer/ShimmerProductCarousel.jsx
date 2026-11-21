import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import ShimmerBox from './ShimmerBox';
import ShimmerProductCard from './ShimmerProductCard';

/**
 * ShimmerProductCarousel: Horizontal carousel skeleton with heading for Home Screen feeds.
 */
export const ShimmerProductCarousel = ({
  count = 4,
  titleWidth = 140,
  cardWidth = 155,
  style,
}) => {
  const items = Array.from({ length: count });

  return (
    <View style={[styles.container, style]}>
      {/* Header bar */}
      <View style={styles.header}>
        <ShimmerBox width={titleWidth} height={18} borderRadius={4} />
        <ShimmerBox width={55} height={14} borderRadius={4} />
      </View>

      {/* Horizontal Cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {items.map((_, idx) => (
          <ShimmerProductCard
            key={idx}
            cardWidth={cardWidth}
            style={{ marginRight: 12, marginBottom: 0 }}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
});

export default React.memo(ShimmerProductCarousel);
