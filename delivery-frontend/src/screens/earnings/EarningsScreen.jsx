import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomHeader from '../../components/common/CustomHeader';
import CustomButton from '../../components/common/CustomButton';
import Colors from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { deliveryService } from '../../services/deliveryService';
import { formatPrice, formatDate } from '../../utils/helpers';

export const EarningsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { partner } = useAuth();

  const [earnings, setEarnings] = useState(partner?.earnings || {
    available: 1450,
    pending: 680,
    totalEarned: 18200,
    todayEarned: 420,
    weekEarned: 3250,
    monthEarned: 14800,
  });

  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEarningsData();
  }, []);

  const loadEarningsData = async () => {
    setLoading(true);
    try {
      const res = await deliveryService.getEarnings();
      if (res.data?.earnings) setEarnings(res.data.earnings);
      if (res.data?.recentTransactions) setLedger(res.data.recentTransactions);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawPrompt = () => {
    if (earnings.available < 100) {
      Alert.alert('Minimum Threshold', 'Minimum withdrawal amount is ₹100.');
      return;
    }
    navigation.navigate('Payouts');
  };

  return (
    <View style={styles.container}>
      <CustomHeader
        title="Fleet Wallet & Earnings"
        subtitle="Daily payouts & transparent delivery ledger"
        rightAction={
          <TouchableOpacity onPress={() => navigation.navigate('Payouts')}>
            <Text style={styles.payoutsLink}>Payouts →</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 80 },
        ]}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadEarningsData} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}>
        {/* Wallet Balance Hero */}
        <View style={styles.walletHero}>
          <Text style={styles.walletLabel}>AVAILABLE FOR WITHDRAWAL</Text>
          <Text style={styles.walletValue}>{formatPrice(earnings.available)}</Text>

          <View style={styles.withdrawRow}>
            <CustomButton
              title="Request Payout Withdrawal ⚡"
              variant="primary"
              size="medium"
              onPress={handleWithdrawPrompt}
              style={styles.withdrawBtn}
            />
          </View>

          <View style={styles.walletDivider} />

          <View style={styles.walletFootGrid}>
            <View>
              <Text style={styles.footLabel}>Pending In-Transit COD</Text>
              <Text style={styles.footValue}>{formatPrice(earnings.pending)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.footLabel}>All-Time Earnings</Text>
              <Text style={styles.footValueHighlight}>{formatPrice(earnings.totalEarned)}</Text>
            </View>
          </View>
        </View>

        {/* Breakdown Grid */}
        <View style={styles.breakdownGrid}>
          <View style={styles.breakdownCard}>
            <Text style={styles.breakdownLabel}>Today</Text>
            <Text style={styles.breakdownValue}>{formatPrice(earnings.todayEarned)}</Text>
            <Text style={styles.breakdownSub}>3 Deliveries</Text>
          </View>
          <View style={styles.breakdownCard}>
            <Text style={styles.breakdownLabel}>This Week</Text>
            <Text style={styles.breakdownValue}>{formatPrice(earnings.weekEarned)}</Text>
            <Text style={styles.breakdownSub}>Mon - Sun</Text>
          </View>
          <View style={styles.breakdownCard}>
            <Text style={styles.breakdownLabel}>This Month</Text>
            <Text style={styles.breakdownValue}>{formatPrice(earnings.monthEarned)}</Text>
            <Text style={styles.breakdownSub}>Oct 2026</Text>
          </View>
        </View>

        {/* Recent Ledger History */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Earnings Ledger</Text>
          <Text style={styles.liveIndicator}>Live Real-Time</Text>
        </View>

        {ledger.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={{ fontSize: 28, marginBottom: 6 }}>🧾</Text>
            <Text style={styles.emptyTitle}>No recent delivery credits</Text>
            <Text style={styles.emptySub}>
              Complete orders to see trip credits, surge bonuses, and COD entries.
            </Text>
          </View>
        ) : (
          ledger.map((item) => (
            <View key={item._id} style={styles.ledgerCard}>
              <View style={styles.ledgerLeft}>
                <View style={styles.ledgerIconCircle}>
                  <Text style={{ fontSize: 13 }}>💰</Text>
                </View>
                <View>
                  <Text style={styles.ledgerOrderNum}>Order #{item.orderNumber}</Text>
                  <Text style={styles.ledgerDesc}>{item.description}</Text>
                  <Text style={styles.ledgerDate}>{formatDate(item.date)}</Text>
                </View>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.ledgerAmount}>+{formatPrice(item.totalEarned)}</Text>
                <View style={styles.settledBadge}>
                  <Text style={styles.settledText}>{item.status}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  payoutsLink: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
  },
  content: {
    padding: 16,
  },
  walletHero: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
  },
  walletLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  walletValue: {
    fontSize: 34,
    fontWeight: '900',
    color: Colors.white,
    marginVertical: 6,
  },
  withdrawRow: {
    marginTop: 6,
    marginBottom: 14,
  },
  withdrawBtn: {
    backgroundColor: Colors.primary,
  },
  walletDivider: {
    height: 1,
    backgroundColor: '#334155',
    marginBottom: 12,
  },
  walletFootGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footLabel: {
    fontSize: 11,
    color: '#94A3B8',
  },
  footValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#CBD5E1',
    marginTop: 2,
  },
  footValueHighlight: {
    fontSize: 14,
    fontWeight: '900',
    color: '#2DD4BF',
    marginTop: 2,
  },
  breakdownGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  breakdownCard: {
    width: '31%',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  breakdownValue: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.textPrimary,
    marginTop: 4,
  },
  breakdownSub: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  liveIndicator: {
    fontSize: 11,
    color: Colors.success,
    fontWeight: '800',
  },
  ledgerCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ledgerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  ledgerIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#CCFBF1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ledgerOrderNum: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  ledgerDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 15,
  },
  ledgerDate: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  ledgerAmount: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.success,
  },
  settledBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  settledText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  emptyCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  emptySub: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
});

export default EarningsScreen;

