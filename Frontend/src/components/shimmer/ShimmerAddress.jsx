import React from 'react';
import { View, StyleSheet } from 'react-native';
import ShimmerProvider from './ShimmerContext';
import ShimmerBox from './ShimmerBox';

/**
 * ShimmerAddress: Skeleton placeholder for AddressScreen and CheckoutScreen address selection.
 */
export const ShimmerAddress = ({ count = 3, style }) => {
  const items = Array.from({ length: count });

  return (
    <ShimmerProvider>
      <View style={[styles.container, style]}>
        {items.map((_, idx) => (
          <View key={idx} style={styles.card}>
            <View style={styles.headerRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ShimmerBox width={120} height={15} borderRadius={4} />
                <ShimmerBox width={50} height={18} borderRadius={6} style={{ marginLeft: 8 }} />
              </View>
              <ShimmerBox width={20} height={20} borderRadius={10} />
            </View>

            <View style={{ marginVertical: 8 }}>
              <ShimmerBox width="92%" height={12} borderRadius={3} style={{ marginBottom: 5 }} />
              <ShimmerBox width="75%" height={12} borderRadius={3} style={{ marginBottom: 5 }} />
              <ShimmerBox width={140} height={12} borderRadius={3} />
            </View>

            <View style={styles.footerRow}>
              <ShimmerBox width={110} height={13} borderRadius={3} />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <ShimmerBox width={45} height={24} borderRadius={6} />
                <ShimmerBox width={55} height={24} borderRadius={6} />
              </View>
            </View>
          </View>
        ))}
      </View>
    </ShimmerProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
  },
});

export default React.memo(ShimmerAddress);
