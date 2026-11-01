import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Switch,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import StatCard from '../../components/cards/StatCard';
import DeliveryCard from '../../components/cards/DeliveryCard';
import RequestCard from '../../components/cards/RequestCard';
import StatusBadge from '../../components/common/StatusBadge';
import Colors from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { useDelivery } from '../../context/DeliveryContext';
import { formatPrice } from '../../utils/helpers';

export const DashboardScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { partner } = useAuth();
  const {
    isOnline,
    toggleAvailability,
    dashboardData,
    requests,
    activeDeliveries,
    loading,
    fetchOperationsData,
    acceptRequest,
    declineRequest,
  } = useDelivery();

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good Morning';
    if (hours < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const kpis = dashboardData?.kpis || {
    todayDeliveries: 3,
    activeDeliveries: activeDeliveries.length,
    pendingRequests: requests.length,
    todayEarnings: partner?.earnings?.todayEarned || 420,
    weekEarnings: partner?.earnings?.weekEarned || 3250,
    availableBalance: partner?.earnings?.available || 1450,
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Rider Header */}
      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top + 8 : 14 }]}>
        <View style={styles.riderRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarEmoji}>🛵</Text>
          </View>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.riderName}>{partner?.name || 'Rajesh Kumar'}</Text>
            <Text style={styles.vehicleText}>
              {partner?.vehicleType || 'Bike'} ({partner?.vehicleNumber || 'DL-04-CK-8821'})
            </Text>
          </View>
        </View>

        {/* Online / Offline Toggle */}
        <View style={styles.availabilityBox}>
          <View style={styles.statusPill}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isOnline ? Colors.success : '#94A3B8' },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                { color: isOnline ? Colors.success : Colors.textMuted },
              ]}>
              {isOnline ? 'ON DUTY' : 'OFFLINE'}
            </Text>
          </View>
          <Switch
            value={isOnline}
            onValueChange={toggleAvailability}
            trackColor={{ false: '#E2E8F0', true: '#99F6E4' }}
            thumbColor={isOnline ? Colors.primary : '#94A3B8'}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 80 },
        ]}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchOperationsData} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}>
        {/* Urgent Request Banner if any */}
        {requests.length > 0 && (
          <TouchableOpacity
            style={styles.requestAlertBanner}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Requests')}>
            <View style={styles.alertLeft}>
              <Text style={styles.alertBell}>🔔</Text>
              <View>
                <Text style={styles.alertTitle}>
                  {requests.length} New Delivery Request{requests.length > 1 ? 's' : ''}!
                </Text>
                <Text style={styles.alertSub}>Tap to review store details and accept.</Text>
              </View>
            </View>
            <Text style={styles.alertArrow}>→</Text>
          </TouchableOpacity>
        )}

        {/* Today's Earnings Hero Card */}
        <View style={styles.earningsHero}>
          <View style={styles.earningsHeader}>
            <Text style={styles.earningsLabel}>TODAY'S EARNINGS</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Earnings')}>
              <Text style={styles.viewWallet}>View Ledger →</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.earningsValue}>{formatPrice(kpis.todayEarnings)}</Text>
          <View style={styles.earningsFooter}>
            <Text style={styles.earningsFootText}>
              Available Balance: <Text style={{ fontWeight: '900' }}>{formatPrice(kpis.availableBalance)}</Text>
            </Text>
            <View style={styles.instantBadge}>
              <Text style={styles.instantText}>⚡ Instant Payout</Text>
            </View>
          </View>
        </View>

        {/* 4-Stat KPI Grid */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCol}>
            <StatCard
              title="Today Delivered"
              value={kpis.todayDeliveries}
              subtitle="Orders completed"
              icon="✅"
              color={Colors.success}
            />
          </View>
          <View style={styles.kpiCol}>
            <StatCard
              title="Active In Transit"
              value={activeDeliveries.length}
              subtitle="Pending doorstep drop"
              icon="📦"
              color={Colors.info}
            />
          </View>
          <View style={styles.kpiCol}>
            <StatCard
              title="Acceptance Rate"
              value={`${partner?.acceptanceRate || 96}%`}
              subtitle="Platform benchmark"
              icon="🎯"
              color="#6366F1"
            />
          </View>
          <View style={styles.kpiCol}>
            <StatCard
              title="Rider Rating"
              value={`${partner?.rating || 4.85} ★`}
              subtitle="248 ratings"
              icon="⭐"
              color="#F59E0B"
            />
          </View>
        </View>

        {/* Active Deliveries Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>In-Progress Deliveries</Text>
          {activeDeliveries.length > 0 && (
            <TouchableOpacity onPress={() => navigation.navigate('Deliveries')}>
              <Text style={styles.seeAllText}>View All ({activeDeliveries.length})</Text>
            </TouchableOpacity>
          )}
        </View>

        {activeDeliveries.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🛵</Text>
            <Text style={styles.emptyTitle}>No active deliveries right now</Text>
            <Text style={styles.emptySub}>
              {isOnline
                ? 'Stay online. Nearby stores will dispatch requests to you shortly.'
                : 'You are currently offline. Switch to ON DUTY to receive orders.'}
            </Text>
          </View>
        ) : (
          activeDeliveries.slice(0, 2).map((del) => (
            <DeliveryCard
              key={del._id || del.deliveryNumber}
              delivery={del}
              onPress={() => navigation.navigate('Deliveries')}
              actionLabel="Manage Delivery Workflow →"
              onAction={() => navigation.navigate('Deliveries')}
            />
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
  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  riderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#CCFBF1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#99F6E4',
  },
  avatarEmoji: {
    fontSize: 24,
  },
  greeting: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  riderName: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  vehicleText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  availabilityBox: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  scrollContent: {
    padding: 16,
  },
  requestAlertBanner: {
    backgroundColor: '#0D9488',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    elevation: 3,
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  alertLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  alertBell: {
    fontSize: 22,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.white,
  },
  alertSub: {
    fontSize: 11,
    color: '#CCFBF1',
    marginTop: 1,
  },
  alertArrow: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.white,
  },
  earningsHero: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    elevation: 3,
  },
  earningsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  earningsLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  viewWallet: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2DD4BF',
  },
  earningsValue: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.white,
    marginVertical: 8,
  },
  earningsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 10,
  },
  earningsFootText: {
    fontSize: 12,
    color: '#CBD5E1',
  },
  instantBadge: {
    backgroundColor: '#134E4A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  instantText: {
    color: '#5EEAD4',
    fontSize: 10,
    fontWeight: '800',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  kpiCol: {
    width: '48.5%',
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
  seeAllText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
  },
  emptyCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyIcon: {
    fontSize: 38,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  emptySub: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 17,
  },
});

export default DashboardScreen;

