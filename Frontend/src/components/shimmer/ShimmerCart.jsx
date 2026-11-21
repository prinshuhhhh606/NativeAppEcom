import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import ShimmerProvider from './ShimmerContext';
import ShimmerBox from './ShimmerBox';

/**
 * ShimmerCart: Skeleton for CartScreen during cart synchronizations or initial load.
 */
export const ShimmerCart = () => {
  return (
    <ShimmerProvider>
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {/* Delivery Pincode bar */}
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <View>
                <ShimmerBox width={100} height={12} borderRadius={3} style={{ marginBottom: 4 }} />
                <ShimmerBox width={160} height={14} borderRadius={4} />
              </View>
              <ShimmerBox width={65} height={26} borderRadius={6} />
            </View>
          </View>

          {/* Cart Items */}
          {[1, 2].map((_, idx) => (
            <View key={idx} style={styles.card}>
              <View style={styles.itemRow}>
                <ShimmerBox width={72} height={72} borderRadius={10} style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <ShimmerBox width="90%" height={14} borderRadius={3} style={{ marginBottom: 6 }} />
                  <ShimmerBox width="60%" height={12} borderRadius={3} style={{ marginBottom: 8 }} />
                  <View style={styles.rowBetween}>
                    <ShimmerBox width={70} height={16} borderRadius={4} />
                    <ShimmerBox width={85} height={28} borderRadius={6} />
                  </View>
                </View>
              </View>
            </View>
          ))}

          {/* Coupon Bar */}
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <ShimmerBox width={140} height={14} borderRadius={4} />
              <ShimmerBox width={60} height={26} borderRadius={6} />
            </View>
          </View>

          {/* Bill Details Summary */}
          <View style={styles.card}>
            <ShimmerBox width={110} height={15} borderRadius={4} style={{ marginBottom: 12 }} />
            <View style={[styles.rowBetween, { marginBottom: 8 }]}>
              <ShimmerBox width={80} height={13} borderRadius={3} />
              <ShimmerBox width={60} height={13} borderRadius={3} />
            </View>
            <View style={[styles.rowBetween, { marginBottom: 8 }]}>
              <ShimmerBox width={95} height={13} borderRadius={3} />
              <ShimmerBox width={50} height={13} borderRadius={3} />
            </View>
            <View style={[styles.rowBetween, { paddingTop: 10, borderTopWidth: 1, borderColor: '#F1F5F9' }]}>
              <ShimmerBox width={100} height={16} borderRadius={4} />
              <ShimmerBox width={80} height={20} borderRadius={4} />
            </View>
          </View>
        </ScrollView>

        {/* Sticky Checkout Bar */}
        <View style={styles.bottomBar}>
          <div>
            <ShimmerBox width={60} height={12} borderRadius={3} style={{ marginBottom: 4 }} />
            <ShimmerBox width={90} height={20} borderRadius={4} />
          </div>
          <ShimmerBox width={150} height={44} borderRadius={12} />
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
    padding: 16,
    paddingBottom: 90,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemRow: {
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 8,
  },
});

export default React.memo(ShimmerCart);
