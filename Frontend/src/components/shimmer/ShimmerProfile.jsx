import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import ShimmerProvider from './ShimmerContext';
import ShimmerBox from './ShimmerBox';

/**
 * ShimmerProfile: User profile screen skeleton placeholder.
 */
export const ShimmerProfile = () => {
  return (
    <ShimmerProvider>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <ShimmerBox width={80} height={80} borderRadius={40} style={styles.avatar} />
          <ShimmerBox width={140} height={18} borderRadius={4} style={{ marginBottom: 6 }} />
          <ShimmerBox width={110} height={13} borderRadius={3} style={{ marginBottom: 10 }} />
          <ShimmerBox width={90} height={20} borderRadius={10} style={{ marginBottom: 14 }} />
          <ShimmerBox width={120} height={32} borderRadius={16} />
        </View>

        {/* Quick Access Grid */}
        <View style={styles.quickGrid}>
          {[1, 2, 3].map((_, idx) => (
            <View key={idx} style={styles.quickItem}>
              <ShimmerBox width={36} height={36} borderRadius={18} style={{ marginBottom: 6 }} />
              <ShimmerBox width={50} height={11} borderRadius={3} />
            </View>
          ))}
        </View>

        {/* Menu Rows */}
        <View style={styles.menuCard}>
          {[1, 2, 3, 4, 5].map((_, idx) => (
            <View key={idx} style={styles.menuRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ShimmerBox width={32} height={32} borderRadius={8} style={{ marginRight: 12 }} />
                <ShimmerBox width={130} height={14} borderRadius={3} />
              </View>
              <ShimmerBox width={14} height={14} borderRadius={3} />
            </View>
          ))}
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
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  avatar: {
    marginBottom: 12,
  },
  quickGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickItem: {
    alignItems: 'center',
    flex: 1,
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#F8FAFC',
  },
});

export default React.memo(ShimmerProfile);
