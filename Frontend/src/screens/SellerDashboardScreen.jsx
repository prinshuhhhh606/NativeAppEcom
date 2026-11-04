import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppIcon from '../components/AppIcon';
import CustomButton from '../components/CustomButton';
import DashboardStatCard from '../components/seller/DashboardStatCard';
import OrderStatusBadge from '../components/seller/OrderStatusBadge';
import { useAuth } from '../context/AuthContext';
import sellerService from '../services/sellerService';
import { formatPrice } from '../utils/helpers';

export const SellerDashboardScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user, logout, refreshProfile, switchMode } = useAuth();

  const [metrics, setMetrics] = useState({
    totalSales: 0,
    todaySales: 0,
    totalOrders: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    activeProducts: 0,
    lowStockCount: 0,
    pendingPayout: 0,
    recentOrders: [],
    vacationMode: false,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isHindi, setIsHindi] = useState(false);

  const sellerStatus = user?.status || 'pending_verification';
  const isApproved = sellerStatus === 'approved';
  const isPending = sellerStatus === 'pending_verification' || sellerStatus === 'under_review';
  const isRejected = sellerStatus === 'rejected';

  const loadDashboard = useCallback(async () => {
    try {
      // Parallelize profile sync and dashboard metrics retrieval
      const dashboardPromise = isApproved ? sellerService.getDashboard() : Promise.resolve(null);
      const [_, res] = await Promise.all([
        refreshProfile().catch(() => {}),
        dashboardPromise.catch(() => null),
      ]);

      if (res) {
        const overview = res?.overview || res?.metrics || {};
        const breakdown = res?.ordersBreakdown || {};

        setMetrics({
          totalSales: overview.totalRevenue ?? overview.grossSales ?? 0,
          todaySales: overview.todaySales ?? 0,
          totalOrders: overview.totalOrders ?? 0,
          pendingOrders: breakdown.processing ?? breakdown.placed ?? 0,
          deliveredOrders: breakdown.delivered ?? 0,
          activeProducts: overview.activeProducts ?? overview.totalProducts ?? 0,
          lowStockCount: overview.lowStockAlerts ?? overview.lowStockCount ?? 0,
          pendingPayout: overview.pendingBalance ?? overview.pendingPayout ?? 0,
          recentOrders: res?.recentOrders || [],
          vacationMode: res?.vacationMode ?? user?.storeAutomation?.vacationMode?.enabled ?? false,
        });
      }
    } catch (e) {
      console.warn('Dashboard fetch error:', e?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isApproved, refreshProfile, user?.storeAutomation]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  const handleLogout = () => {
    Alert.alert(
      isHindi ? 'लॉगआउट करें' : 'Logout Seller Studio',
      isHindi ? 'क्या आप निश्चित रूप से बाहर निकलना चाहते हैं?' : 'Are you sure you want to log out of your store?',
      [
        { text: isHindi ? 'रद्द करें' : 'Cancel', style: 'cancel' },
        {
          text: isHindi ? 'लॉगआउट' : 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            navigation.replace('MainApp');
          },
        },
      ]
    );
  };

  const storeName = user?.storeName || user?.businessName || 'Bharat Bazaar Merchant';
  const ownerName = user?.name || user?.fullName || 'Store Owner';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* Header Bar */}
      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top + 8 : 14 }]}>
        <View style={styles.headerLeft}>
          <View style={styles.storeAvatar}>
            <AppIcon name="storefront" size={20} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.storeName} numberOfLines={1}>
              {storeName}
            </Text>
            <Text style={styles.storeSub}>
              {ownerName} • {isApproved ? 'Verified Partner' : 'Verification Needed'}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.customerModeBtn}
            onPress={async () => {
              await switchMode('customer');
              navigation.navigate('MainApp');
            }}
            activeOpacity={0.8}>
            <AppIcon name="cart-outline" size={15} color="#FFFFFF" />
            <Text style={styles.customerModeBtnText}>
              {isHindi ? 'खरीदारी' : 'Shop'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.langBtn}
            onPress={() => setIsHindi(!isHindi)}
            activeOpacity={0.7}>
            <Text style={styles.langBtnText}>{isHindi ? 'English' : 'हिन्दी'}</Text>
          </TouchableOpacity>

          <View
            style={[
              styles.statusPill,
              isApproved
                ? styles.statusApproved
                : isPending
                ? styles.statusPending
                : styles.statusRejected,
            ]}>
            <Text
              style={[
                styles.statusText,
                isApproved
                  ? styles.statusTextApproved
                  : isPending
                  ? styles.statusTextPending
                  : styles.statusTextRejected,
              ]}>
              {isApproved ? 'ACTIVE' : isPending ? 'IN REVIEW' : 'REJECTED'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />}>
        {/* Vacation Mode Notice */}
        {metrics.vacationMode && (
          <View style={styles.vacationBanner}>
            <AppIcon name="airplane" size={18} color="#D97706" />
            <Text style={styles.vacationText}>
              {isHindi ? 'स्टोर अवकाश मोड पर है (Vacation Mode Active)' : 'Store on Vacation Mode: Listings are paused.'}
            </Text>
          </View>
        )}

        {/* Dual Access Quick Switch Card */}
        <View style={styles.dualAccessCard}>
          <View style={styles.dualAccessLeft}>
            <View style={styles.dualAccessIconWrap}>
              <AppIcon name="bag-handle" size={20} color="#059669" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.dualAccessTitle}>
                {isHindi ? 'ग्राहक खरीदारी मोड' : 'Customer Shopping Mode'}
              </Text>
              <Text style={styles.dualAccessSub}>
                {isHindi
                  ? 'अपनी इसी लॉगिन से भारत बाज़ार पर खरीदारी करें। कोई नया खाता नहीं चाहिए।'
                  : 'Shop as customer with unified session & persistent cart.'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.dualAccessActionBtn}
            onPress={async () => {
              await switchMode('customer');
              navigation.navigate('MainApp');
            }}
            activeOpacity={0.85}>
            <Text style={styles.dualAccessActionText}>
              {isHindi ? 'खरीदारी शुरू करें →' : 'Continue Shopping →'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* CASE 1: PENDING APPROVAL */}
        {isPending && (
          <View style={styles.noticeCard}>
            <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
              <AppIcon name="hourglass-outline" size={28} color="#D97706" />
            </View>
            <Text style={styles.noticeTitle}>
              {isHindi ? 'खाता व्यवस्थापक अनुमोदन के लिए प्रतीक्षारत है' : 'Waiting for Admin Approval'}
            </Text>
            <Text style={styles.noticeDesc}>
              {isHindi
                ? 'आपका विक्रेता पंजीकरण सफलतापूर्वक सबमिट हो गया है। कृपया व्यवस्थापक द्वारा स्वीकृत होने की प्रतीक्षा करें।'
                : 'Your seller registration has been submitted successfully. Please wait for Admin approval to access all dashboard features.'}
            </Text>
          </View>
        )}

        {/* CASE 2: REJECTED */}
        {isRejected && (
          <View style={[styles.noticeCard, { borderColor: '#FECACA', backgroundColor: '#FEF2F2' }]}>
            <View style={[styles.iconCircle, { backgroundColor: '#FEE2E2' }]}>
              <AppIcon name="close-circle" size={28} color="#DC2626" />
            </View>
            <Text style={[styles.noticeTitle, { color: '#991B1B' }]}>
              {isHindi ? 'स्टोर आवेदन अस्वीकृत' : 'Application Rejected'}
            </Text>
            <Text style={[styles.noticeDesc, { color: '#B91C1C' }]}>
              {user?.rejectionReason ||
                (isHindi
                  ? 'व्यवस्थापक द्वारा आपका विक्रेता खाता अस्वीकृत कर दिया गया है।'
                  : 'Your seller account has been rejected by Admin.')}
            </Text>
          </View>
        )}

        {/* CASE 3: OPERATIONAL SELLER STUDIO (APPROVED) */}
        {isApproved && (
          <>
            {/* KPI Metrics Grid */}
            <View style={styles.gridRow}>
              <DashboardStatCard
                label={isHindi ? 'कुल बिक्री (GMV)' : 'Gross Sales'}
                value={formatPrice(metrics.totalSales)}
                subtext={isHindi ? `आज: ${formatPrice(metrics.todaySales)}` : `Today: ${formatPrice(metrics.todaySales)}`}
                iconName="cash-outline"
                iconColor="#059669"
                style={styles.halfCard}
              />
              <DashboardStatCard
                label={isHindi ? 'कुल ऑर्डर्स' : 'Total Orders'}
                value={String(metrics.totalOrders)}
                subtext={isHindi ? `लंबित: ${metrics.pendingOrders}` : `Pending: ${metrics.pendingOrders}`}
                iconName="cart-outline"
                iconColor="#2563EB"
                style={styles.halfCard}
              />
            </View>

            <View style={styles.gridRow}>
              <DashboardStatCard
                label={isHindi ? 'सक्रिय उत्पाद' : 'Live Catalog'}
                value={String(metrics.activeProducts)}
                subtext={isHindi ? `कम स्टॉक: ${metrics.lowStockCount}` : `Low Stock: ${metrics.lowStockCount}`}
                iconName="cube-outline"
                iconColor="#D97706"
                style={styles.halfCard}
              />
              <DashboardStatCard
                label={isHindi ? 'उपलब्ध सेटलमेंट' : 'Settlement'}
                value={formatPrice(metrics.pendingPayout)}
                subtext={isHindi ? 'T+2 बैंक पेआउट' : 'T+2 Bank Payout'}
                iconName="wallet-outline"
                iconColor="#7C3AED"
                style={styles.halfCard}
              />
            </View>

            {/* Quick Operational Launchpad */}
            <Text style={styles.sectionHeading}>
              {isHindi ? 'स्टोर संचालन केंद्र' : 'Seller Studio Operations'}
            </Text>

            <View style={styles.launchpadGrid}>
              <TouchableOpacity
                style={styles.launchCard}
                onPress={() => navigation.navigate('SellerProducts')}
                activeOpacity={0.75}>
                <View style={[styles.launchIconCircle, { backgroundColor: '#EFF6FF' }]}>
                  <AppIcon name="cube" size={20} color="#2563EB" />
                </View>
                <Text style={styles.launchTitle}>{isHindi ? 'उत्पाद सूची' : 'Products'}</Text>
                <Text style={styles.launchDesc}>{isHindi ? 'कैटलॉग और मूल्य' : 'Catalog & pricing'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.launchCard}
                onPress={() => navigation.navigate('SellerAddProduct')}
                activeOpacity={0.75}>
                <View style={[styles.launchIconCircle, { backgroundColor: '#ECFDF5' }]}>
                  <AppIcon name="add-circle" size={20} color="#059669" />
                </View>
                <Text style={styles.launchTitle}>{isHindi ? '+ नया जोड़ें' : '+ Add Product'}</Text>
                <Text style={styles.launchDesc}>{isHindi ? 'नया आइटम लिस्ट करें' : 'Create new listing'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.launchCard}
                onPress={() => navigation.navigate('SellerOrders')}
                activeOpacity={0.75}>
                <View style={[styles.launchIconCircle, { backgroundColor: '#FAF5FF' }]}>
                  <AppIcon name="cart" size={20} color="#9333EA" />
                </View>
                <Text style={styles.launchTitle}>{isHindi ? 'ऑर्डर्स और शिपिंग' : 'Orders & Ship'}</Text>
                <Text style={styles.launchDesc}>{isHindi ? 'थोक पैकिंग और पर्ची' : 'Bulk pack & dispatch'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.launchCard}
                onPress={() => navigation.navigate('SellerInventory')}
                activeOpacity={0.75}>
                <View style={[styles.launchIconCircle, { backgroundColor: '#FFFBEB' }]}>
                  <AppIcon name="layers" size={20} color="#D97706" />
                </View>
                <Text style={styles.launchTitle}>{isHindi ? 'इन्वेंट्री स्टॉक' : 'Inventory'}</Text>
                <Text style={styles.launchDesc}>{isHindi ? 'बारकोड और स्टॉक समायोजन' : 'Barcodes & stock +/-'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.launchCard}
                onPress={() => navigation.navigate('SellerAccounting')}
                activeOpacity={0.75}>
                <View style={[styles.launchIconCircle, { backgroundColor: '#F0FDF4' }]}>
                  <AppIcon name="calculator-outline" size={20} color="#16A34A" />
                </View>
                <Text style={styles.launchTitle}>{isHindi ? 'जीएसटी और लेजर' : 'GST & Tax'}</Text>
                <Text style={styles.launchDesc}>{isHindi ? 'GSTR-1 और पेआउट्स' : 'GSTR-1 & payouts'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.launchCard}
                onPress={() => navigation.navigate('SellerSettings')}
                activeOpacity={0.75}>
                <View style={[styles.launchIconCircle, { backgroundColor: '#F1F5F9' }]}>
                  <AppIcon name="settings-outline" size={20} color="#475569" />
                </View>
                <Text style={styles.launchTitle}>{isHindi ? 'स्टोर सेटिंग्स' : 'Settings'}</Text>
                <Text style={styles.launchDesc}>{isHindi ? 'अवकाश मोड और जोन' : 'Hours & 20KM zones'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.launchCard}
                onPress={() => navigation.navigate('SellerStaff')}
                activeOpacity={0.75}>
                <View style={[styles.launchIconCircle, { backgroundColor: '#EFF6FF' }]}>
                  <AppIcon name="people-outline" size={20} color="#3B82F6" />
                </View>
                <Text style={styles.launchTitle}>{isHindi ? 'स्टाफ और शिफ्ट्स' : 'Staff & Team'}</Text>
                <Text style={styles.launchDesc}>{isHindi ? 'भूमिकाएं और उपस्थिति' : 'Roles & attendance'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.launchCard}
                onPress={() => navigation.navigate('SellerKyc')}
                activeOpacity={0.75}>
                <View style={[styles.launchIconCircle, { backgroundColor: '#FDF2F8' }]}>
                  <AppIcon name="shield-checkmark-outline" size={20} color="#DB2777" />
                </View>
                <Text style={styles.launchTitle}>{isHindi ? 'केवाईसी प्रोफाइल' : 'KYC Status'}</Text>
                <Text style={styles.launchDesc}>{isHindi ? 'जीएसटी और बैंक खाता' : 'GSTIN & bank details'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.launchCard}
                onPress={async () => {
                  await switchMode('customer');
                  navigation.navigate('MainApp');
                }}
                activeOpacity={0.75}>
                <View style={[styles.launchIconCircle, { backgroundColor: '#EFF6FF' }]}>
                  <AppIcon name="bag-handle" size={20} color="#2563EB" />
                </View>
                <Text style={styles.launchTitle}>{isHindi ? 'ग्राहक स्टोर' : 'Shop Online'}</Text>
                <Text style={styles.launchDesc}>{isHindi ? 'ब्राउज़ व खरीदारी' : 'Browse as customer'}</Text>
              </TouchableOpacity>
            </View>

            {/* Recent Orders Preview */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>
                {isHindi ? 'हाल के ऑर्डर्स' : 'Recent Customer Orders'}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('SellerOrders')}>
                <Text style={styles.seeAllText}>{isHindi ? 'सभी देखें →' : 'View All →'}</Text>
              </TouchableOpacity>
            </View>

            {metrics.recentOrders.length === 0 ? (
              <View style={styles.emptyOrdersCard}>
                <AppIcon name="file-tray-outline" size={32} color="#94A3B8" />
                <Text style={styles.emptyOrdersText}>
                  {isHindi ? 'अभी कोई नया ऑर्डर नहीं है' : 'No recent orders yet. New orders will appear here in real-time.'}
                </Text>
              </View>
            ) : (
              metrics.recentOrders.slice(0, 4).map((order) => (
                <TouchableOpacity
                  key={order._id || order.orderId}
                  style={styles.orderItem}
                  onPress={() => navigation.navigate('SellerOrders')}
                  activeOpacity={0.75}>
                  <View style={styles.orderLeft}>
                    <Text style={styles.orderNumber}>
                      #{order.orderNumber || (order._id ? order._id.slice(-6).toUpperCase() : 'ORD')}
                    </Text>
                    <Text style={styles.orderCustomer}>
                      {order.shippingAddress?.fullName || order.customer?.name || 'Customer'} •{' '}
                      {order.items?.length || 1} item(s)
                    </Text>
                  </View>
                  <View style={styles.orderRight}>
                    <Text style={styles.orderAmount}>{formatPrice(order.totalAmount || 0)}</Text>
                    <OrderStatusBadge status={order.orderStatus || 'placed'} />
                  </View>
                </TouchableOpacity>
              ))
            )}
          </>
        )}

        {/* Dual Access Switching Button */}
        <CustomButton
          title={isHindi ? '🛍️ ग्राहक खरीदारी मोड खोलें' : '🛍️ Continue Shopping as Customer'}
          variant="primary"
          size="medium"
          onPress={async () => {
            await switchMode('customer');
            navigation.navigate('MainApp');
          }}
          style={styles.switchShoppingBtn}
        />

        {/* Sign Out Button */}
        <CustomButton
          title={isHindi ? 'विक्रेता स्टूडियो से बाहर निकलें' : 'Sign Out of Seller Studio'}
          variant="outline"
          size="medium"
          onPress={handleLogout}
          style={styles.signOutBtn}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  storeAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  storeSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  langBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  langBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#34D399',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusApproved: { backgroundColor: '#064E3B' },
  statusPending: { backgroundColor: '#78350F' },
  statusRejected: { backgroundColor: '#7F1D1D' },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
  statusTextApproved: { color: '#34D399' },
  statusTextPending: { color: '#FBBF24' },
  statusTextRejected: { color: '#F87171' },
  scrollContent: {
    padding: 16,
  },
  vacationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  vacationText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
    flex: 1,
  },
  noticeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  noticeTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  noticeDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
  primaryActionBtn: {
    marginTop: 18,
    backgroundColor: '#059669',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  halfCard: {
    flex: 1,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 14,
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  launchpadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  launchCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  launchIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  launchTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  launchDesc: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  orderLeft: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  orderCustomer: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  orderRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  orderAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptyOrdersCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  emptyOrdersText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
  signOutBtn: {
    marginTop: 12,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  switchShoppingBtn: {
    marginTop: 20,
    backgroundColor: '#059669',
  },
  customerModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#059669',
  },
  customerModeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dualAccessCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    flexDirection: 'column',
    gap: 10,
  },
  dualAccessLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dualAccessIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dualAccessTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#166534',
  },
  dualAccessSub: {
    fontSize: 11,
    color: '#15803D',
    marginTop: 1,
    lineHeight: 15,
  },
  dualAccessActionBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#166534',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  dualAccessActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default SellerDashboardScreen;
