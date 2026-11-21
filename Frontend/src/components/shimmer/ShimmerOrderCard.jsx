import React from 'react';
import { View, StyleSheet } from 'react-native';
import ShimmerBox from './ShimmerBox';

/**
 * ShimmerOrderCard: Skeleton matching the order history cards in MyOrdersScreen.jsx.
 */
export const ShimmerOrderCard = ({ style }) => {
  return (
    <View style={[styles.card, style]}>
      {/* Top Header: Order # and Status badge */}
      <View style={styles.topRow}>
        <View>
          <ShimmerBox width={120} height={14} borderRadius={3} style={{ marginBottom: 4 }} />
          <ShimmerBox width={85} height={11} borderRadius={3} />
        </View>
        <ShimmerBox width={75} height={22} borderRadius={11} />
      </View>

      {/* Middle Item info: Image + title + price */}
      <View style={styles.itemRow}>
        <ShimmerBox width={64} height={64} borderRadius={10} style={{ marginRight: 12 }} />
        <View style={{ flex: 1 }}>
          <ShimmerBox width="90%" height={14} borderRadius={3} style={{ marginBottom: 6 }} />
          <ShimmerBox width="60%" height={12} borderRadius={3} style={{ marginBottom: 8 }} />
          <ShimmerBox width={75} height={16} borderRadius={4} />
        </View>
      </View>

      {/* Bottom Actions Row */}
      <View style={styles.bottomRow}>
        <ShimmerBox width={90} height={12} borderRadius={3} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <ShimmerBox width={80} height={32} borderRadius={8} />
          <ShimmerBox width={80} height={32} borderRadius={8} />
        </View>
      </View>
    </View>
  );
};

export const ShimmerOrderList = ({ count = 4, style }) => {
  const items = Array.from({ length: count });
  return (
    <View style={[styles.list, style]}>
      {items.map((_, idx) => (
        <ShimmerOrderCard key={idx} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
  },
});

export default React.memo(ShimmerOrderCard);
