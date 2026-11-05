import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  Linking,
  StatusBar,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from './DeliveryDashboardScreen.styles';
import AppIcon from '../components/AppIcon';
import Loading from '../components/Loading';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';
import locationService from '../services/locationService';
import { formatPrice } from '../utils/helpers';

export const DeliveryDashboardScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user, logout, refreshProfile } = useAuth();

  const kycStatus = user?.kycStatus || 'pending';
  const isApproved = kycStatus === 'approved';
  const isPending = kycStatus === 'pending' || kycStatus === 'under_review';
  const isRejected = kycStatus === 'rejected';

  const isDeliveryUser = user?.role === 'delivery' || user?.role === 'rider' || user?.isDelivery === true;

  const [isOnline, setIsOnline] = useState(isApproved && user?.availability === 'online');
  const [tasks, setTasks] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Real-Time GPS Tracking State
  const [isGpsTransmitting, setIsGpsTransmitting] = useState(false);
  const [lastGpsPingTime, setLastGpsPingTime] = useState(null);
  const [pingSecondsAgo, setPingSecondsAgo] = useState(null);

  // OTP Verification Modal
  const [activeTaskForOtp, setActiveTaskForOtp] = useState(null);
  const [otpMode, setOtpMode] = useState('delivery'); // 'pickup' | 'delivery'
  const [otpInput, setOtpInput] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // Payout Modal
  const [payoutModalVisible, setPayoutModalVisible] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('1000');
  const [requestingPayout, setRequestingPayout] = useState(false);

  // Find active in-progress task for GPS streaming
  const activeTask = tasks.find((t) =>
    ['assigned', 'accepted', 'reached_pickup', 'picked_up', 'out_for_delivery', 'reached_customer'].includes(t.status)
  );

  // 1. Automatically start/stop real-time location streaming based on duty & active task
  useEffect(() => {
    if (isApproved && isOnline && activeTask) {
      const trackingOrderId =
        activeTask.orderNumber ||
        activeTask.order?.orderNumber ||
        activeTask.order ||
        activeTask.orderId ||
        activeTask._id;
      const deliveryId = activeTask._id;
      locationService.startLocationTracking({ orderId: trackingOrderId, deliveryId });
      setIsGpsTransmitting(true);
    } else {
      locationService.stopLocationTracking();
      setIsGpsTransmitting(false);
    }
  }, [isApproved, isOnline, activeTask]);

  // 2. Subscribe to location updates for live ping time indicator
  useEffect(() => {
    const unsub = locationService.subscribe(() => {
      setLastGpsPingTime(Date.now());
      setPingSecondsAgo(0);
    });

    const pingTimer = setInterval(() => {
      if (lastGpsPingTime) {
        setPingSecondsAgo(Math.floor((Date.now() - lastGpsPingTime) / 1000));
      }
    }, 1000);

    return () => {
      if (unsub) unsub();
      clearInterval(pingTimer);
    };
  }, [lastGpsPingTime]);

  // Stop tracking on screen unmount
  useEffect(() => {
    return () => {
      locationService.stopLocationTracking();
    };
  }, []);

  const loadAllFleetData = useCallback(async () => {
    if (!isDeliveryUser || !user) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      await refreshProfile().catch(() => {});
      if (isApproved) {
        const [tasksData, requestsData] = await Promise.all([
          authService.getDeliveryTasks().catch(() => []),
          authService.getDeliveryRequests().catch(() => []),
        ]);
        setTasks(tasksData || []);
        setRequests(requestsData || []);
      }
    } catch (e) {
      console.warn('Error loading fleet data', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isApproved, isDeliveryUser, refreshProfile, user]);

  useEffect(() => {
    if (!isDeliveryUser || !user) {
      setLoading(false);
      return;
    }
    loadAllFleetData();
  }, [loadAllFleetData, isDeliveryUser, user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAllFleetData();
  };

  const handleToggleOnline = async () => {
    if (!isApproved) {
      Alert.alert(
        'Account Verification Required',
        `Your delivery rider account is currently "${kycStatus}". You can go on duty once verified and approved by Bharat Bazaar Admin.`
      );
      return;
    }
    const newTarget = isOnline ? 'offline' : 'online';
    try {
      await authService.toggleDeliveryAvailability(newTarget);
      const onlineBool = newTarget === 'online';
      setIsOnline(onlineBool);
      if (!onlineBool) {
        locationService.stopLocationTracking();
        setIsGpsTransmitting(false);
      }
      Alert.alert('Status Updated', `You are now ${newTarget.toUpperCase()}`);
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not update availability');
    }
  };

  const handleAcceptRequest = async (assignmentId) => {
    try {
      setLoading(true);
      await authService.acceptDeliveryRequest(assignmentId);
      Alert.alert('🎉 Delivery Accepted!', 'Head to the vendor store for package pickup.');
      await loadAllFleetData();
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not accept request');
    } finally {
      setLoading(false);
    }
  };

  const handleDeclineRequest = async (assignmentId) => {
    try {
      await authService.declineDeliveryRequest(assignmentId, 'Rider declined');
      setRequests((prev) => prev.filter((r) => (r.assignmentId || r._id) !== assignmentId));
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const handleUpdateStatus = async (task, newStatus) => {
    try {
      setLoading(true);
      await authService.updateDeliveryTaskStatus(task._id, newStatus);
      Alert.alert('Status Updated', `Task status updated to ${newStatus.replace('_', ' ')}`);
      await loadAllFleetData();
    } catch (e) {
      Alert.alert('Update Failed', e.message || 'Could not update task status');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenOtpModal = (task, mode = 'delivery') => {
    setActiveTaskForOtp(task);
    setOtpMode(mode);
    setOtpInput(mode === 'pickup' ? task.pickupOtp || '7821' : task.deliveryOtp || '4521');
  };

  const handleVerifyOtp = async () => {
    if (!otpInput || otpInput.trim().length < 4) {
      Alert.alert('Invalid OTP', 'Please enter a valid 4-digit code.');
      return;
    }

    setVerifyingOtp(true);
    try {
      if (otpMode === 'pickup') {
        await authService.verifyPickupOtp(activeTaskForOtp._id, otpInput.trim());
        Alert.alert('✓ Pickup Confirmed!', 'Store OTP verified. Proceed to customer doorstep.');
      } else {
        await authService.verifyDeliveryOtp(activeTaskForOtp._id, otpInput.trim());
        Alert.alert(
          '🎉 Order Delivered!',
          'Delivery OTP verified successfully! Payout credited to your fleet account.'
        );
      }
      setActiveTaskForOtp(null);
      await loadAllFleetData();
    } catch (e) {
      Alert.alert('Verification Failed', e.message || 'Incorrect OTP code.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Turn-by-Turn GPS Navigation Handlers
  const handleNavigateToStore = (task) => {
    const lat = task.pickupAddress?.latitude || 26.9124;
    const lng = task.pickupAddress?.longitude || 75.7873;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Maps Navigation', `Open Google Maps to: ${lat}, ${lng}`);
    });
  };

  const handleNavigateToCustomer = (task) => {
    const lat = task.deliveryAddress?.latitude || 26.9015;
    const lng = task.deliveryAddress?.longitude || 75.7421;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Maps Navigation', `Open Google Maps to: ${lat}, ${lng}`);
    });
  };

  const handleCallStore = (phone) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    } else {
      Alert.alert('Store Contact', 'Store phone number not available.');
    }
  };

  const handleCallCustomer = (phone) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    } else {
      Alert.alert('Notice', 'Customer contact phone not provided.');
    }
  };

  const handleRequestPayout = async () => {
    const amt = Number(payoutAmount);
    if (!amt || amt < 100) {
      Alert.alert('Minimum Amount', 'Minimum withdrawal is ₹100.');
      return;
    }

    setRequestingPayout(true);
    try {
      await authService.requestDeliveryPayout(amt);
      Alert.alert('Payout Requested', `₹${amt} transfer initiated to your registered bank account.`);
      setPayoutModalVisible(false);
      loadAllFleetData();
    } catch (e) {
      Alert.alert('Payout Error', e.message || 'Could not request payout');
    } finally {
      setRequestingPayout(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout Fleet Hub', 'Are you sure you want to end your delivery shift?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          locationService.stopLocationTracking();
          setIsGpsTransmitting(false);
          await logout();
          navigation.replace('MainApp');
        },
      },
    ]);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'assigned':
        return { bg: '#FEF3C7', text: '#D97706', label: 'Assigned' };
      case 'reached_pickup':
        return { bg: '#FCE7F3', text: '#BE185D', label: 'At Store' };
      case 'picked_up':
        return { bg: '#E0E7FF', text: '#4338CA', label: 'Picked Up' };
      case 'out_for_delivery':
        return { bg: '#FFEDD5', text: '#C2410C', label: 'Out for Delivery' };
      case 'reached_customer':
        return { bg: '#CCFBF1', text: '#0F766E', label: 'At Doorstep' };
      case 'delivered':
        return { bg: '#D1FAE5', text: '#059669', label: 'Delivered' };
      default:
        return { bg: '#F1F5F9', text: '#64748B', label: status };
    }
  };

  const riderName = user?.name || 'Rajesh Kumar';
  const vehicle = user?.vehicleNumber || 'DL-04-CK-8821';
  const city = user?.city || 'Delhi NCR';
  const earnings = user?.earnings || { available: 1450, pending: 680, totalEarned: 18200 };

  if (!user && !isDeliveryUser) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <Loading message="Loading rider session..." fullScreen />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Rider Header Bar */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top > 0 ? insets.top + 8 : 14 },
        ]}>
        <View style={styles.riderInfo}>
          <View style={styles.riderAvatar}>
            <AppIcon name="bicycle" size={22} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.riderName}>{riderName}</Text>
            <Text style={styles.riderSub}>
              {vehicle} • {city}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={styles.dutyBadge}>
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: isOnline ? '#10B981' : '#94A3B8',
              }}
            />
            <Text style={[styles.dutyText, !isOnline && { color: '#94A3B8' }]}>
              {isOnline ? 'On Duty' : 'Offline'}
            </Text>
            <Switch
              value={isOnline}
              onValueChange={handleToggleOnline}
              trackColor={{ false: '#334155', true: '#0D9488' }}
              thumbColor={isOnline ? '#2DD4BF' : '#94A3B8'}
            />
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <AppIcon name="log-out-outline" size={22} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </View>

      {loading && !refreshing ? (
        <Loading message="Loading fleet tasks & earnings..." fullScreen />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38BDF8" />}
          showsVerticalScrollIndicator={false}>
          {/* ========================================================
              CASE 1: PENDING VERIFICATION SCREEN
          ======================================================== */}
          {isPending && (
            <View style={styles.pendingCard}>
              <View style={styles.pendingIconCircle}>
                <AppIcon name="hourglass-outline" size={32} color="#2DD4BF" />
              </View>
              <Text style={styles.pendingTitle}>Rider Application Under Review</Text>
              <Text style={styles.pendingDesc}>
                Welcome to the AppsicaEcom Fleet, {user?.name || 'Rider'}! Your driving license and vehicle details
                have been securely registered in the central database. Your account is currently awaiting verification
                and approval from Bharat Bazaar Admin. Once approved, you can go on duty and accept deliveries.
              </Text>

              <View style={styles.riderDetailsList}>
                <View style={styles.riderDetailRow}>
                  <Text style={styles.riderDetailKey}>Rider Name:</Text>
                  <Text style={styles.riderDetailVal}>{user?.name}</Text>
                </View>
                <View style={styles.riderDetailRow}>
                  <Text style={styles.riderDetailKey}>Registered Phone:</Text>
                  <Text style={styles.riderDetailVal}>{user?.phone}</Text>
                </View>
                <View style={styles.riderDetailRow}>
                  <Text style={styles.riderDetailKey}>Registered Email:</Text>
                  <Text style={styles.riderDetailVal}>{user?.email}</Text>
                </View>
                <View style={styles.riderDetailRow}>
                  <Text style={styles.riderDetailKey}>Vehicle Number:</Text>
                  <Text style={styles.riderDetailVal}>{user?.vehicleNumber || 'Pending'}</Text>
                </View>
                <View style={styles.riderDetailRow}>
                  <Text style={styles.riderDetailKey}>Driving License:</Text>
                  <Text style={styles.riderDetailVal}>{user?.drivingLicenseNumber || 'Pending'}</Text>
                </View>
                <View style={styles.riderDetailRow}>
                  <Text style={styles.riderDetailKey}>Verification Status:</Text>
                  <Text style={[styles.riderDetailVal, { color: '#FBBF24' }]}>Pending Admin Review</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.checkStatusBtn}
                onPress={loadAllFleetData}
                activeOpacity={0.8}>
                <AppIcon name="refresh" size={16} color="#FFF" />
                <Text style={styles.checkStatusBtnText}>Check Approval Status</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ========================================================
              CASE 2: REJECTED SCREEN
          ======================================================== */}
          {isRejected && (
            <View style={[styles.pendingCard, { backgroundColor: '#450A0A', borderColor: '#991B1B' }]}>
              <View style={[styles.pendingIconCircle, { backgroundColor: '#7F1D1D', borderColor: '#EF4444' }]}>
                <AppIcon name="close-circle" size={32} color="#EF4444" />
              </View>
              <Text style={styles.pendingTitle}>Rider Application Not Approved</Text>
              <Text style={[styles.pendingDesc, { color: '#FCA5A5' }]}>
                {user?.adminRemarks ||
                  'Your delivery fleet application could not be verified by the admin team. Please contact Fleet Support.'}
              </Text>
            </View>
          )}

          {/* ========================================================
              CASE 3: APPROVED RIDER - FULL FLEET OPERATIONS
          ======================================================== */}
          {isApproved && (
            <>
              {/* Earnings Card */}
          <View style={styles.earningsCard}>
            <View style={styles.earningsHeader}>
              <Text style={styles.earningsTitle}>Fleet Wallet & Earnings</Text>
              <TouchableOpacity
                style={styles.earningsPill}
                onPress={() => setPayoutModalVisible(true)}>
                <Text style={styles.earningsPillText}>Instant Payout ⚡</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.earningsGrid}>
              <View style={styles.earningItem}>
                <AppIcon name="wallet-outline" size={16} color="#38BDF8" />
                <Text style={styles.earningAmount}>{formatPrice(earnings.available || 1450)}</Text>
                <Text style={styles.earningLabel}>Available</Text>
              </View>
              <View style={styles.earningItem}>
                <AppIcon name="time-outline" size={16} color="#F59E0B" />
                <Text style={styles.earningAmount}>{formatPrice(earnings.pending || 680)}</Text>
                <Text style={styles.earningLabel}>In Transit COD</Text>
              </View>
              <View style={styles.earningItem}>
                <AppIcon name="trophy-outline" size={16} color="#10B981" />
                <Text style={styles.earningAmount}>
                  {formatPrice(earnings.totalEarned || 18200)}
                </Text>
                <Text style={styles.earningLabel}>Total Payouts</Text>
              </View>
            </View>
          </View>

          {/* Incoming Delivery Requests (Seller -> Rider) */}
          {requests.length > 0 && (
            <View style={{ marginBottom: 20 }}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: '#F59E0B' }]}>
                  🔔 Incoming Dispatch Requests ({requests.length})
                </Text>
              </View>

              {requests.map((req) => (
                <View
                  key={req.assignmentId || req._id}
                  style={[styles.taskCard, { borderColor: '#F59E0B', backgroundColor: '#1C2438' }]}>
                  <View style={styles.taskCardHeader}>
                    <Text style={[styles.taskOrderNum, { color: '#F59E0B' }]}>
                      Order #{req.orderNumber}
                    </Text>
                    <Text style={{ color: '#2DD4BF', fontWeight: '800', fontSize: 13 }}>
                      Fee: {formatPrice(req.deliveryFee || 65)}
                    </Text>
                  </View>

                  <Text style={{ color: '#F8FAFC', fontWeight: '800', fontSize: 13, marginBottom: 4 }}>
                    Pickup: {req.sellerStoreName || 'Vendor Store'}
                  </Text>
                  <Text style={{ color: '#94A3B8', fontSize: 11, marginBottom: 8 }}>
                    {req.pickupAddress?.addressLine || 'Market Road'}, {req.pickupAddress?.city}
                  </Text>

                  <Text style={{ color: '#F8FAFC', fontWeight: '800', fontSize: 13, marginBottom: 4 }}>
                    Drop: {req.customerName || 'Customer'}
                  </Text>
                  <Text style={{ color: '#94A3B8', fontSize: 11, marginBottom: 12 }}>
                    {req.deliveryAddress?.addressLine || 'Customer Street'}, {req.deliveryAddress?.city}
                  </Text>

                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity
                      style={[styles.taskActionBtn, { flex: 1, backgroundColor: '#334155' }]}
                      onPress={() => handleDeclineRequest(req.assignmentId || req._id)}>
                      <Text style={[styles.taskActionBtnText, { color: '#FCA5A5' }]}>Decline</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.taskActionBtn, { flex: 1.5, backgroundColor: '#10B981' }]}
                      onPress={() => handleAcceptRequest(req.assignmentId || req._id)}>
                      <Text style={styles.taskActionBtnText}>Accept Order</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Live GPS Broadcasting Indicator */}
          {isGpsTransmitting && (
            <View style={styles.gpsBanner}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={styles.gpsPulseDot} />
                <Text style={styles.gpsBannerText}>● Transmitting Live GPS</Text>
              </View>
              <Text style={styles.gpsPingText}>
                {pingSecondsAgo !== null ? `(Last ping: ${pingSecondsAgo}s ago)` : 'Active'}
              </Text>
            </View>
          )}

          {/* Active Tasks Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Assigned Delivery Tasks</Text>
            <View style={styles.taskBadge}>
              <Text style={styles.taskBadgeText}>{tasks.length} Active</Text>
            </View>
          </View>

          {tasks.length === 0 ? (
            <View
              style={{
                alignItems: 'center',
                paddingVertical: 40,
                backgroundColor: '#1E293B',
                borderRadius: 16,
              }}>
              <AppIcon name="checkmark-done-circle" size={48} color="#10B981" />
              <Text style={{ color: '#F8FAFC', fontSize: 16, fontWeight: '800', marginTop: 10 }}>
                All deliveries completed!
              </Text>
              <Text style={{ color: '#94A3B8', fontSize: 12, marginTop: 4 }}>
                New orders will appear here automatically.
              </Text>
            </View>
          ) : (
            tasks.map((task) => {
              const statusInfo = getStatusColor(task.status);
              const isPickupPhase = ['assigned', 'accepted', 'reached_pickup'].includes(task.status);
              const isDropPhase = ['picked_up', 'out_for_delivery', 'reached_customer'].includes(task.status);

              return (
                <View key={task._id} style={styles.taskCard}>
                  <View style={styles.taskCardHeader}>
                    <Text style={styles.taskOrderNum}>Task #{task.taskNumber || task._id?.slice(-6)}</Text>
                    <View style={[styles.taskStatusBadge, { backgroundColor: statusInfo.bg }]}>
                      <Text style={[styles.taskStatusText, { color: statusInfo.text }]}>
                        {statusInfo.label}
                      </Text>
                    </View>
                  </View>

                  {/* Vendor Store Info */}
                  <View style={styles.taskStoreRow}>
                    <View style={styles.taskStoreInfo}>
                      <Text style={styles.taskStoreTitle}>
                        🏪 {task.pickupAddress?.storeName || task.sellerStoreName || 'Vendor Warehouse'}
                      </Text>
                      <Text style={styles.taskStoreAddress} numberOfLines={2}>
                        {task.pickupAddress?.addressLine || task.pickupAddress?.addressLine1 || 'Market Road'}, {task.pickupAddress?.city || 'Jaipur'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.callBtn}
                      activeOpacity={0.8}
                      onPress={() => handleCallStore(task.pickupAddress?.contactPhone || task.sellerPhone)}>
                      <AppIcon name="call" size={13} color="#FFFFFF" />
                      <Text style={styles.callBtnText}>Call Store</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Turn-by-Turn Navigation to Store (during pickup phase) */}
                  {isPickupPhase && (
                    <View style={styles.taskNavigationRow}>
                      <TouchableOpacity
                        style={styles.navBtn}
                        activeOpacity={0.85}
                        onPress={() => handleNavigateToStore(task)}>
                        <AppIcon name="navigate-circle" size={16} color="#FFFFFF" />
                        <Text style={styles.navBtnText}>🧭 Navigate to Store (Google Maps)</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Customer Drop Location Info */}
<View style={styles.taskCustomerRow}>
  <Text style={styles.taskCustomerName}>
    👤 {
      typeof task.customerName === 'string'
        ? task.customerName
        : typeof task.deliveryAddress?.fullName === 'string'
          ? task.deliveryAddress.fullName
          : 'Customer'
    }
  </Text>

  <TouchableOpacity
    style={styles.callBtn}
    activeOpacity={0.8}
    onPress={() =>
      handleCallCustomer(
        task.customerPhone ||
        task.deliveryAddress?.mobileNumber
      )
    }>
    <AppIcon name="call" size={13} color="#FFFFFF" />
    <Text style={styles.callBtnText}>Call Customer</Text>
  </TouchableOpacity>
</View>

                <View style={styles.taskAddressRow}>
  <AppIcon name="location-outline" size={16} color="#94A3B8" />
  <Text style={styles.taskAddressText}>
    {[
      task.deliveryAddress?.addressLine1,
      task.deliveryAddress?.addressLine,
      task.deliveryAddress?.city,
      task.deliveryAddress?.state,
      task.deliveryAddress?.pinCode,
    ]
      .filter(Boolean)
      .join(', ') || 'Address not available'}
  </Text>
</View>
                  {/* Turn-by-Turn Navigation to Customer (during delivery phase) */}
                  {isDropPhase && (
                    <View style={styles.taskNavigationRow}>
                      <TouchableOpacity
                        style={[styles.navBtn, styles.navBtnCustomer]}
                        activeOpacity={0.85}
                        onPress={() => handleNavigateToCustomer(task)}>
                        <AppIcon name="navigate-circle" size={16} color="#FFFFFF" />
                        <Text style={styles.navBtnText}>🧭 Navigate to Customer Doorstep</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  <View style={styles.taskCodRow}>
                    <Text style={styles.taskCodLabel}>
                      {task.paymentMethod === 'cod' || task.paymentMethod === 'COD'
                        ? 'Cash to Collect (COD)'
                        : 'Prepaid (Online)'}:
                    </Text>
                    <Text style={styles.taskCodAmount}>
                      {task.paymentMethod === 'cod' || task.paymentMethod === 'COD'
                        ? formatPrice(task.codAmount || task.amountToCollect || 1899)
                        : '₹0 (Paid)'}
                    </Text>
                  </View>

                  {/* Step Workflow Actions */}
                  {isPickupPhase && (
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity
                        style={[styles.taskActionBtn, { flex: 1, backgroundColor: '#0284C7' }]}
                        activeOpacity={0.85}
                        onPress={() => handleOpenOtpModal(task, 'pickup')}>
                        <Text style={styles.taskActionBtnText}>1. Pickup OTP ({task.pickupOtp || '7821'})</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.taskActionBtn, { flex: 1, backgroundColor: '#0D9488' }]}
                        activeOpacity={0.85}
                        onPress={() => handleUpdateStatus(task, 'picked_up')}>
                        <Text style={styles.taskActionBtnText}>Confirm Pickup</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {task.status === 'picked_up' && (
                    <TouchableOpacity
                      style={[styles.taskActionBtn, { backgroundColor: '#EA580C' }]}
                      activeOpacity={0.85}
                      onPress={() => handleUpdateStatus(task, 'out_for_delivery')}>
                      <Text style={styles.taskActionBtnText}>2. Start Delivery (Out For Delivery)</Text>
                    </TouchableOpacity>
                  )}

                  {(task.status === 'out_for_delivery' || task.status === 'reached_customer') && (
                    <TouchableOpacity
                      style={[styles.taskActionBtn, { backgroundColor: '#10B981' }]}
                      activeOpacity={0.85}
                      onPress={() => handleOpenOtpModal(task, 'delivery')}>
                      <Text style={styles.taskActionBtnText}>3. Verify OTP & Complete Delivery</Text>
                    </TouchableOpacity>
                  )}

                  {task.status === 'delivered' && (
                    <View
                      style={{
                        paddingVertical: 10,
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderRadius: 8,
                        alignItems: 'center',
                      }}>
                      <Text style={{ color: '#10B981', fontWeight: '800', fontSize: 13 }}>
                        ✓ Order Delivered Successfully
                      </Text>
                    </View>
                  )}
                </View>
              );
            })
          )}
          </>
          )}
        </ScrollView>
      )}

      {/* OTP Verification Modal */}
      <Modal visible={!!activeTaskForOtp} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              {otpMode === 'pickup' ? 'Enter Vendor Pickup OTP' : 'Enter Customer Delivery OTP'}
            </Text>
            <Text style={styles.modalSubtitle}>
              {otpMode === 'pickup'
                ? 'Ask store vendor for 4-digit package handover security code. (Demo test code: '
                : 'Ask customer for 4-digit delivery security code. (Demo test code: '}
              <Text style={{ color: '#38BDF8', fontWeight: '800' }}>
                {otpMode === 'pickup'
                  ? (activeTaskForOtp?.pickupOtp || '7821')
                  : (activeTaskForOtp?.deliveryOtp || activeTaskForOtp?.otp || '4521')}
              </Text>
              )
            </Text>

            <TextInput
              style={styles.otpInput}
              value={otpInput}
              onChangeText={setOtpInput}
              keyboardType="number-pad"
              maxLength={4}
              placeholder="••••"
              placeholderTextColor="#475569"
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setActiveTaskForOtp(null)}
                disabled={verifyingOtp}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleVerifyOtp}
                disabled={verifyingOtp}>
                <Text style={styles.modalSubmitText}>
                  {verifyingOtp ? 'Verifying...' : 'Verify OTP'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Payout Modal */}
      <Modal visible={payoutModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Request Bank Withdrawal</Text>
            <Text style={styles.modalSubtitle}>
              Available balance: {formatPrice(earnings.available || 1450)}
            </Text>

            <TextInput
              style={[styles.otpInput, { fontSize: 20, letterSpacing: 1 }]}
              value={payoutAmount}
              onChangeText={setPayoutAmount}
              keyboardType="number-pad"
              placeholder="Amount in ₹"
              placeholderTextColor="#475569"
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setPayoutModalVisible(false)}
                disabled={requestingPayout}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, { backgroundColor: '#0D9488' }]}
                onPress={handleRequestPayout}
                disabled={requestingPayout}>
                <Text style={styles.modalSubmitText}>
                  {requestingPayout ? 'Processing...' : 'Withdraw Now'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default DeliveryDashboardScreen;
