import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import ShimmerProvider from './ShimmerContext';
import ShimmerBox from './ShimmerBox';

/**
 * ShimmerOrderDetails: Full-screen skeleton for OrderDetailsScreen and TrackOrderScreen.
 */
export const ShimmerOrderDetails = () => {
  return (
    <ShimmerProvider>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        {/* Status card */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View>
              <ShimmerBox width={130} height={16} borderRadius={4} style={{ marginBottom: 6 }} />
              <ShimmerBox width={90} height={12} borderRadius={3} />
            </View>
            <ShimmerBox width={85} height={24} borderRadius={12} />
          </View>
        </View>

        {/* Live Tracking Timeline */}
        <View style={styles.card}>
          <ShimmerBox width={140} height={16} borderRadius={4} style={{ marginBottom: 14 }} />
          {[1, 2, 3, 4].map((step, idx) => (
            <View key={idx} style={styles.timelineRow}>
              <View style={styles.timelineDot}>
                <ShimmerBox width={16} height={16} borderRadius={8} />
                {idx < 3 && <View style={styles.timelineLine} />}
              </View>
              <View style={{ flex: 1, paddingBottom: 16 }}>
                <ShimmerBox width={110} height={14} borderRadius={3} style={{ marginBottom: 4 }} />
                <ShimmerBox width={180} height={11} borderRadius={3} />
              </View>
            </View>
          ))}
        </View>

        {/* Delivery Address Card */}
        <View style={styles.card}>
          <ShimmerBox width={110} height={15} borderRadius={4} style={{ marginBottom: 10 }} />
          <ShimmerBox width={140} height={13} borderRadius={3} style={{ marginBottom: 6 }} />
          <ShimmerBox width="90%" height={11} borderRadius={3} style={{ marginBottom: 4 }} />
          <ShimmerBox width="60%" height={11} borderRadius={3} />
        </View>

        {/* Ordered Items Card */}
        <View style={styles.card}>
          <ShimmerBox width={120} height={15} borderRadius={4} style={{ marginBottom: 12 }} />
          {[1, 2].map((_, idx) => (
            <View key={idx} style={styles.itemRow}>
              <ShimmerBox width={50} height={50} borderRadius={8} style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <ShimmerBox width="85%" height={13} borderRadius={3} style={{ marginBottom: 5 }} />
                <ShimmerBox width={70} height={11} borderRadius={3} style={{ marginBottom: 5 }} />
                <ShimmerBox width={60} height={14} borderRadius={3} />
              </View>
            </View>
          ))}
        </View>

        {/* Payment Summary */}
        <View style={styles.card}>
          <ShimmerBox width={130} height={15} borderRadius={4} style={{ marginBottom: 10 }} />
          <View style={[styles.rowBetween, { marginBottom: 6 }]}>
            <ShimmerBox width={70} height={12} borderRadius={3} />
            <ShimmerBox width={50} height={12} borderRadius={3} />
          </View>
          <View style={[styles.rowBetween, { marginBottom: 6 }]}>
            <ShimmerBox width={80} height={12} borderRadius={3} />
            <ShimmerBox width={55} height={12} borderRadius={3} />
          </View>
          <View style={[styles.rowBetween, { paddingTop: 8, borderTopWidth: 1, borderColor: '#F1F5F9' }]}>
            <ShimmerBox width={90} height={15} borderRadius={4} />
            <ShimmerBox width={75} height={18} borderRadius={4} />
          </View>
        </View>
      </ScrollView>
    </ShimmerProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
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
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timelineRow: {
    flexDirection: 'row',
  },
  timelineDot: {
    alignItems: 'center',
    marginRight: 12,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
});

export default React.memo(ShimmerOrderDetails);
