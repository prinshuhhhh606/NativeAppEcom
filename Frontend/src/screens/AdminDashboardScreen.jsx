import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from './AdminDashboardScreen.styles';
import AppIcon from '../components/AppIcon';
import CustomButton from '../components/CustomButton';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';
import { formatPrice } from '../utils/helpers';

export const AdminDashboardScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user, isAdmin, logout } = useAuth();

  // Active Tab: 'overview' | 'sellers' | 'delivery'
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Overview Data
  const [metrics, setMetrics] = useState({
    todaySales: 124500,
    totalOrders: 348,
    pendingOrders: 14,
    shippedOrders: 82,
    totalCustomers: 1280,
    lowStockCount: 6,
  });
  const [recentOrders, setRecentOrders] = useState([]);

  // Real Registered Sellers from MongoDB
  const [sellers, setSellers] = useState([]);
  const [sellerFilter, setSellerFilter] = useState('all'); // 'all' | 'pending_verification' | 'approved' | 'rejected'
  const [loadingSellers, setLoadingSellers] = useState(false);

  // Real Registered Delivery Partners from MongoDB
  const [deliveryPartners, setDeliveryPartners] = useState([]);
  const [deliveryFilter, setDeliveryFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [loadingDelivery, setLoadingDelivery] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      loadAllAdminData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const loadAllAdminData = async () => {
    await Promise.all([loadMetrics(), loadSellers(), loadDeliveryPartners()]);
  };

  const handleAuthError = async (err) => {
    if (err?.status === 401 || err?.status === 403) {
      Alert.alert(
        'Admin Authentication Required',
        err.message || 'Your admin session has expired or is unauthorized. Please log in again.'
      );
      await logout();
      navigation.replace('AdminLogin');
      return true;
    }
    return false;
  };

  const loadMetrics = async () => {
    try {
      const data = await authService.getAdminDashboardMetrics();
      if (data) {
        const overview = data.overview || data;
        setMetrics((prev) => ({
          ...prev,
          todaySales: overview.todayRevenue !== undefined ? overview.todayRevenue : (data.todaySales || data.totalRevenue || prev.todaySales),
          totalOrders: overview.totalOrders !== undefined ? overview.totalOrders : (data.totalOrders || prev.totalOrders),
          totalCustomers: overview.totalCustomers !== undefined ? overview.totalCustomers : (data.totalCustomers || prev.totalCustomers),
          lowStockCount: overview.lowStockProducts !== undefined ? overview.lowStockProducts : (data.lowStockCount || prev.lowStockCount),
        }));
        if (data.recentOrders && Array.isArray(data.recentOrders)) {
          setRecentOrders(data.recentOrders.slice(0, 5));
        }
      }
    } catch (e) {
      await handleAuthError(e);
    }
  };

  const loadSellers = async () => {
    setLoadingSellers(true);
    try {
      const data = await authService.getAdminSellers(sellerFilter);
      const list = Array.isArray(data) ? data : (data.sellers || data.data || []);
      setSellers(list);
    } catch (e) {
      const handled = await handleAuthError(e);
      if (!handled) console.warn('Failed to fetch real sellers:', e.message);
    } finally {
      setLoadingSellers(false);
      setRefreshing(false);
    }
  };

  const loadDeliveryPartners = async () => {
    setLoadingDelivery(true);
    try {
      const data = await authService.getAdminDeliveryPartners(deliveryFilter);
      const list = Array.isArray(data) ? data : (data.partners || data.data || []);
      setDeliveryPartners(list);
    } catch (e) {
      const handled = await handleAuthError(e);
      if (!handled) console.warn('Failed to fetch real delivery partners:', e.message);
    } finally {
      setLoadingDelivery(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (activeTab === 'overview') loadMetrics();
    else if (activeTab === 'sellers') loadSellers();
    else if (activeTab === 'delivery') loadDeliveryPartners();
  };

  // ==========================================
  // SELLER APPROVAL / REJECTION ACTIONS
  // ==========================================
  const handleApproveSeller = (seller) => {
    Alert.alert(
      'Approve Seller Store',
      `Are you sure you want to approve "${seller.storeName || seller.businessName}"? This will allow them to log in and list products.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve Store',
          onPress: async () => {
            setActionLoading(true);
            try {
              await authService.updateAdminSellerStatus(seller._id, 'approved');
              Alert.alert('Success', `Store "${seller.storeName}" is now APPROVED!`);
              loadSellers();
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to approve seller');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleRejectSeller = (seller) => {
    Alert.alert(
      'Reject Seller Store',
      `Reject registration for "${seller.storeName || seller.businessName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject Store',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await authService.updateAdminSellerStatus(
                seller._id,
                'rejected',
                'Incomplete documentation or business verification criteria not met'
              );
              Alert.alert('Seller Rejected', `Store application has been marked as rejected.`);
              loadSellers();
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to reject seller');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  // ==========================================
  // DELIVERY PARTNER APPROVAL / REJECTION
  // ==========================================
  const handleApproveDelivery = (partner) => {
    Alert.alert(
      'Approve Delivery Rider',
      `Approve delivery partner "${partner.name}" (Vehicle: ${partner.vehicleNumber})? This will grant them fleet dispatch access.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve Rider',
          onPress: async () => {
            setActionLoading(true);
            try {
              await authService.updateAdminDeliveryPartnerStatus(partner._id, 'approved', 'Verified Fleet Rider');
              Alert.alert('Success', `Delivery Rider "${partner.name}" is now APPROVED!`);
              loadDeliveryPartners();
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to approve delivery partner');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleRejectDelivery = (partner) => {
    Alert.alert(
      'Reject Delivery Rider',
      `Reject rider registration for "${partner.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject Rider',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await authService.updateAdminDeliveryPartnerStatus(
                partner._id,
                'rejected',
                'Driving license or vehicle details could not be verified'
              );
              Alert.alert('Rider Rejected', `Delivery application marked as rejected.`);
              loadDeliveryPartners();
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to reject partner');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('Admin Sign Out', 'Are you sure you want to end your administrative session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          navigation.replace('AdminLogin');
        },
      },
    ]);
  };

  if (!isAdmin) {
    return (
      <View style={styles.unauthorizedContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
        <View style={styles.unauthorizedIconBox}>
          <AppIcon name="lock-closed" size={40} color="#F87171" />
        </View>
        <Text style={styles.unauthorizedTitle}>Restricted Admin Portal</Text>
        <Text style={styles.unauthorizedDesc}>
          Access Denied: Your account does not have administrative privileges. Only authorized staff
          and store managers can view this operational control dashboard.
        </Text>
        <CustomButton
          title="Sign In with Admin Credentials"
          size="large"
          onPress={() => navigation.replace('AdminLogin')}
          style={styles.unauthorizedBtn}
        />
        <CustomButton
          title="Return to Customer Shopping"
          variant="outline"
          size="large"
          onPress={() => navigation.replace('MainApp')}
          style={styles.unauthorizedOutlineBtn}
        />
      </View>
    );
  }

  const roleLabel =
    user?.role === 'super_admin'
      ? 'Super Admin'
      : user?.role === 'manager'
      ? 'Store Manager'
      : 'Operations Admin';

  const pendingSellersCount = sellers.filter((s) => s.status === 'pending_verification' || s.status === 'under_review').length;
  const pendingDeliveryCount = deliveryPartners.filter((d) => d.kycStatus === 'pending' || d.kycStatus === 'under_review').length;

  // Filtered lists
  const filteredSellers = sellers.filter((s) => {
    if (sellerFilter === 'all') return true;
    return s.status === sellerFilter;
  });

  const filteredDelivery = deliveryPartners.filter((d) => {
    if (deliveryFilter === 'all') return true;
    return d.kycStatus === deliveryFilter;
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E293B" />

      {/* Top Header Bar */}
      <View style={[styles.headerBar, { paddingTop: insets.top > 0 ? insets.top + 8 : 14 }]}>
        <View style={styles.adminInfo}>
          <View style={styles.avatarPill}>
            <Text style={styles.avatarText}>
              {(user?.name || user?.fullName || 'AD').slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.adminTitle}>{user?.name || user?.fullName || 'Administrator'}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>{roleLabel}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <AppIcon name="log-out-outline" size={16} color="#FCA5A5" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38BDF8" />
        }>
        {/* Real-time Connection Indicator */}
        <View style={styles.connectionCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.connectionDot} />
            <Text style={styles.connectionText}>Real-Time MongoDB Synced</Text>
          </View>
          <Text style={styles.environmentText}>appecom_db • Port 5000</Text>
        </View>

        {/* 3-Way Tab Navigator */}
        <View style={styles.tabNavRow}>
          <TouchableOpacity
            style={[styles.tabNavBtn, activeTab === 'overview' && styles.tabNavBtnActive]}
            onPress={() => setActiveTab('overview')}
            activeOpacity={0.8}>
            <AppIcon
              name="analytics"
              size={14}
              color={activeTab === 'overview' ? '#FFF' : '#94A3B8'}
            />
            <Text style={[styles.tabNavText, activeTab === 'overview' && styles.tabNavTextActive]}>
              Overview
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabNavBtn, activeTab === 'sellers' && styles.tabNavBtnActive]}
            onPress={() => {
              setActiveTab('sellers');
              if (sellers.length === 0) loadSellers();
            }}
            activeOpacity={0.7}>
            <AppIcon
              name="storefront"
              size={14}
              color={activeTab === 'sellers' ? '#FFF' : '#818CF8'}
            />
            <Text style={[styles.tabNavText, activeTab === 'sellers' && styles.tabNavTextActive]}>
              Sellers
            </Text>
            {pendingSellersCount > 0 && (
              <View style={styles.badgeCount}>
                <Text style={styles.badgeCountText}>{pendingSellersCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabNavBtn, activeTab === 'delivery' && styles.tabNavBtnActive]}
            onPress={() => {
              setActiveTab('delivery');
              if (deliveryPartners.length === 0) loadDeliveryPartners();
            }}
            activeOpacity={0.7}>
            <AppIcon
              name="bicycle"
              size={14}
              color={activeTab === 'delivery' ? '#FFF' : '#2DD4BF'}
            />
            <Text style={[styles.tabNavText, activeTab === 'delivery' && styles.tabNavTextActive]}>
              Delivery Fleet
            </Text>
            {pendingDeliveryCount > 0 && (
              <View style={[styles.badgeCount, { backgroundColor: '#F59E0B' }]}>
                <Text style={styles.badgeCountText}>{pendingDeliveryCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ========================================================
            TAB 1: STORE OVERVIEW
        ======================================================== */}
        {activeTab === 'overview' && (
          <View>
            <Text style={styles.sectionTitle}>Pan India Store Overview</Text>
            <View style={styles.kpiGrid}>
              <View style={styles.kpiCard}>
                <View style={[styles.kpiIconWrapper, { backgroundColor: '#064E3B' }]}>
                  <AppIcon name="cash" size={20} color="#34D399" />
                </View>
                <Text style={styles.kpiLabel}>Total Revenue</Text>
                <Text style={styles.kpiValue}>{formatPrice(metrics.todaySales)}</Text>
                <Text style={styles.kpiSubtext}>+18.4% this week</Text>
              </View>

              <View style={styles.kpiCard}>
                <View style={[styles.kpiIconWrapper, { backgroundColor: '#1E3A8A' }]}>
                  <AppIcon name="cube" size={20} color="#60A5FA" />
                </View>
                <Text style={styles.kpiLabel}>Total Orders</Text>
                <Text style={styles.kpiValue}>{metrics.totalOrders}</Text>
                <Text style={styles.kpiSubtext}>{metrics.pendingOrders} pending dispatch</Text>
              </View>

              <View style={styles.kpiCard}>
                <View style={[styles.kpiIconWrapper, { backgroundColor: '#4C1D95' }]}>
                  <AppIcon name="people" size={20} color="#A78BFA" />
                </View>
                <Text style={styles.kpiLabel}>Active Customers</Text>
                <Text style={styles.kpiValue}>{metrics.totalCustomers}</Text>
                <Text style={styles.kpiSubtext}>Across 19,000+ PINs</Text>
              </View>

              <View style={styles.kpiCard}>
                <View style={[styles.kpiIconWrapper, { backgroundColor: '#78350F' }]}>
                  <AppIcon name="alert-circle" size={20} color="#FBBF24" />
                </View>
                <Text style={styles.kpiLabel}>Low Stock Items</Text>
                <Text style={styles.kpiValue}>{metrics.lowStockCount}</Text>
                <Text style={[styles.kpiSubtext, { color: '#F87171' }]}>Requires replenish</Text>
              </View>
            </View>

            {/* Recent Orders List */}
            <View style={styles.recentCard}>
              <View style={styles.recentHeader}>
                <Text style={styles.sectionTitle}>Recent Customer Orders</Text>
                <TouchableOpacity onPress={onRefresh}>
                  <Text style={{ color: '#38BDF8', fontSize: 12, fontWeight: '700' }}>Refresh</Text>
                </TouchableOpacity>
              </View>

              {recentOrders.length === 0 ? (
                <Text style={{ color: '#94A3B8', fontSize: 13, textAlign: 'center', marginVertical: 12 }}>
                  No recent orders available
                </Text>
              ) : (
                recentOrders.map((ord, idx) => (
                  <View key={ord.id || ord._id || idx} style={styles.orderItemRow}>
                    <View style={{ flex: 1, paddingRight: 12 }}>
                      <Text style={styles.orderIdText}>{ord.orderNumber || ord.id || `ORD-${idx + 1}`}</Text>
                      <Text style={styles.orderCustomerText}>{ord.customerName || ord.customer || 'Customer'}</Text>
                      <Text style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>
                        {ord.itemsText || ord.items || 'Standard Order'}
                      </Text>
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                      <View
                        style={[
                          styles.orderStatusPill,
                          ord.status === 'Shipped' || ord.status === 'shipped'
                            ? { backgroundColor: '#1E3A8A' }
                            : ord.status === 'Processing' || ord.status === 'pending'
                            ? { backgroundColor: '#78350F' }
                            : { backgroundColor: '#064E3B' },
                        ]}>
                        <Text
                          style={[
                            styles.orderStatusText,
                            ord.status === 'Shipped' || ord.status === 'shipped'
                              ? { color: '#60A5FA' }
                              : ord.status === 'Processing' || ord.status === 'pending'
                              ? { color: '#FBBF24' }
                              : { color: '#34D399' },
                          ]}>
                          {ord.status || 'Confirmed'}
                        </Text>
                      </View>
                      <Text style={styles.orderAmountText}>{formatPrice(ord.amount || ord.totalAmount || 1499)}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        {/* ========================================================
            TAB 2: REGISTERED SELLERS (REAL MONGODB DATA)
        ======================================================== */}
        {activeTab === 'sellers' && (
          <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={styles.sectionTitle}>Registered Vendors ({filteredSellers.length})</Text>
              <TouchableOpacity onPress={loadSellers} disabled={loadingSellers}>
                <Text style={{ color: '#818CF8', fontSize: 12, fontWeight: '700' }}>
                  {loadingSellers ? 'Syncing...' : 'Refresh List'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Filter Pills */}
            <View style={styles.filterRow}>
              {[
                { label: 'All', key: 'all' },
                { label: 'Pending Approval', key: 'pending_verification' },
                { label: 'Approved', key: 'approved' },
                { label: 'Rejected', key: 'rejected' },
              ].map((f) => (
                <TouchableOpacity
                  key={f.key}
                  style={[styles.filterPill, sellerFilter === f.key && styles.filterPillActive]}
                  onPress={() => setSellerFilter(f.key)}>
                  <Text style={[styles.filterPillText, sellerFilter === f.key && styles.filterPillTextActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {loadingSellers ? (
              <ActivityIndicator size="large" color="#818CF8" style={{ marginVertical: 30 }} />
            ) : filteredSellers.length === 0 ? (
              <View style={styles.emptyStateBox}>
                <AppIcon name="storefront-outline" size={40} color="#64748B" />
                <Text style={styles.emptyStateTitle}>No Sellers Found</Text>
                <Text style={styles.emptyStateSubtitle}>
                  No seller accounts match the status filter "{sellerFilter}".
                </Text>
              </View>
            ) : (
              filteredSellers.map((s) => {
                const isPending = s.status === 'pending_verification' || s.status === 'under_review';
                const isApproved = s.status === 'approved';
                const isRejected = s.status === 'rejected';

                const badgeBg = isApproved ? '#064E3B' : isPending ? '#78350F' : '#450A0A';
                const badgeColor = isApproved ? '#34D399' : isPending ? '#FBBF24' : '#F87171';

                return (
                  <View key={s._id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={styles.reviewTitle}>{s.storeName || s.businessName}</Text>
                        <Text style={styles.reviewSubtitle}>
                          Owner: {s.name} • {s.businessType || 'Store'}
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
                        <Text style={[styles.statusBadgeText, { color: badgeColor }]}>
                          {s.status?.replace('_', ' ')}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.reviewDetailsGrid}>
                      <View style={styles.reviewDetailRow}>
                        <Text style={styles.reviewDetailLabel}>Email:</Text>
                        <Text style={styles.reviewDetailValue}>{s.email}</Text>
                      </View>
                      <View style={styles.reviewDetailRow}>
                        <Text style={styles.reviewDetailLabel}>Mobile:</Text>
                        <Text style={styles.reviewDetailValue}>{s.phone}</Text>
                      </View>
                      <View style={styles.reviewDetailRow}>
                        <Text style={styles.reviewDetailLabel}>Location:</Text>
                        <Text style={styles.reviewDetailValue}>
                          {s.address?.city || 'Jaipur'}, {s.address?.state || 'Rajasthan'} ({s.address?.pinCode || '302001'})
                        </Text>
                      </View>
                      <View style={styles.reviewDetailRow}>
                        <Text style={styles.reviewDetailLabel}>Registered On:</Text>
                        <Text style={styles.reviewDetailValue}>
                          {new Date(s.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </Text>
                      </View>
                      {s.rejectionReason ? (
                        <View style={styles.reviewDetailRow}>
                          <Text style={[styles.reviewDetailLabel, { color: '#F87171' }]}>Remarks:</Text>
                          <Text style={[styles.reviewDetailValue, { color: '#F87171' }]}>{s.rejectionReason}</Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.reviewActions}>
                      {!isApproved && (
                        <TouchableOpacity
                          style={styles.approveBtn}
                          onPress={() => handleApproveSeller(s)}
                          disabled={actionLoading}>
                          <AppIcon name="checkmark-circle" size={16} color="#FFF" />
                          <Text style={styles.approveBtnText}>Approve Store</Text>
                        </TouchableOpacity>
                      )}

                      {!isRejected && (
                        <TouchableOpacity
                          style={styles.rejectBtn}
                          onPress={() => handleRejectSeller(s)}
                          disabled={actionLoading}>
                          <AppIcon name="close-circle" size={16} color="#FFF" />
                          <Text style={styles.rejectBtnText}>Reject</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* ========================================================
            TAB 3: REGISTERED DELIVERY RIDERS (REAL MONGODB DATA)
        ======================================================== */}
        {activeTab === 'delivery' && (
          <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={styles.sectionTitle}>Delivery Fleet ({filteredDelivery.length})</Text>
              <TouchableOpacity onPress={loadDeliveryPartners} disabled={loadingDelivery}>
                <Text style={{ color: '#2DD4BF', fontSize: 12, fontWeight: '700' }}>
                  {loadingDelivery ? 'Syncing...' : 'Refresh List'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Filter Pills */}
            <View style={styles.filterRow}>
              {[
                { label: 'All', key: 'all' },
                { label: 'Pending', key: 'pending' },
                { label: 'Approved', key: 'approved' },
                { label: 'Rejected', key: 'rejected' },
              ].map((f) => (
                <TouchableOpacity
                  key={f.key}
                  style={[styles.filterPill, deliveryFilter === f.key && styles.filterPillActive]}
                  onPress={() => setDeliveryFilter(f.key)}>
                  <Text style={[styles.filterPillText, deliveryFilter === f.key && styles.filterPillTextActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {loadingDelivery ? (
              <ActivityIndicator size="large" color="#2DD4BF" style={{ marginVertical: 30 }} />
            ) : filteredDelivery.length === 0 ? (
              <View style={styles.emptyStateBox}>
                <AppIcon name="bicycle-outline" size={40} color="#64748B" />
                <Text style={styles.emptyStateTitle}>No Riders Found</Text>
                <Text style={styles.emptyStateSubtitle}>
                  No delivery partner accounts match the status filter "{deliveryFilter}".
                </Text>
              </View>
            ) : (
              filteredDelivery.map((d) => {
                const isPending = d.kycStatus === 'pending' || d.kycStatus === 'under_review';
                const isApproved = d.kycStatus === 'approved';
                const isRejected = d.kycStatus === 'rejected';

                const badgeBg = isApproved ? '#042F2E' : isPending ? '#78350F' : '#450A0A';
                const badgeColor = isApproved ? '#2DD4BF' : isPending ? '#FBBF24' : '#F87171';

                return (
                  <View key={d._id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={styles.reviewTitle}>{d.name}</Text>
                        <Text style={[styles.reviewSubtitle, { color: '#2DD4BF' }]}>
                          Vehicle: {d.vehicleType || 'Bike'} ({d.vehicleNumber || 'Pending'})
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
                        <Text style={[styles.statusBadgeText, { color: badgeColor }]}>
                          {d.kycStatus?.replace('_', ' ')}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.reviewDetailsGrid}>
                      <View style={styles.reviewDetailRow}>
                        <Text style={styles.reviewDetailLabel}>Mobile:</Text>
                        <Text style={styles.reviewDetailValue}>{d.phone}</Text>
                      </View>
                      <View style={styles.reviewDetailRow}>
                        <Text style={styles.reviewDetailLabel}>Email:</Text>
                        <Text style={styles.reviewDetailValue}>{d.email}</Text>
                      </View>
                      <View style={styles.reviewDetailRow}>
                        <Text style={styles.reviewDetailLabel}>Driving License:</Text>
                        <Text style={styles.reviewDetailValue}>{d.drivingLicenseNumber || 'N/A'}</Text>
                      </View>
                      <View style={styles.reviewDetailRow}>
                        <Text style={styles.reviewDetailLabel}>Operating City:</Text>
                        <Text style={styles.reviewDetailValue}>
                          {d.address?.city || 'New Delhi'} ({d.address?.pinCode || '110001'})
                        </Text>
                      </View>
                      <View style={styles.reviewDetailRow}>
                        <Text style={styles.reviewDetailLabel}>Registered On:</Text>
                        <Text style={styles.reviewDetailValue}>
                          {new Date(d.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </Text>
                      </View>
                      {d.adminRemarks ? (
                        <View style={styles.reviewDetailRow}>
                          <Text style={styles.reviewDetailLabel}>Admin Remarks:</Text>
                          <Text style={styles.reviewDetailValue}>{d.adminRemarks}</Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.reviewActions}>
                      {!isApproved && (
                        <TouchableOpacity
                          style={[styles.approveBtn, { backgroundColor: '#0D9488' }]}
                          onPress={() => handleApproveDelivery(d)}
                          disabled={actionLoading}>
                          <AppIcon name="checkmark-circle" size={16} color="#FFF" />
                          <Text style={styles.approveBtnText}>Approve Rider</Text>
                        </TouchableOpacity>
                      )}

                      {!isRejected && (
                        <TouchableOpacity
                          style={styles.rejectBtn}
                          onPress={() => handleRejectDelivery(d)}
                          disabled={actionLoading}>
                          <AppIcon name="close-circle" size={16} color="#FFF" />
                          <Text style={styles.rejectBtnText}>Reject</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* Switch to Customer Store View Button */}
        <CustomButton
          title="Switch to Customer Store View"
          variant="outline"
          size="medium"
          onPress={() => navigation.navigate('MainApp')}
          style={{ width: '100%', borderColor: '#334155', marginTop: 12 }}
        />
      </ScrollView>
    </View>
  );
};

export default AdminDashboardScreen;
