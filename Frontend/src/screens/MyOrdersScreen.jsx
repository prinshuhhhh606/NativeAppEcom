import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Modal,
  ScrollView,
  Alert,
  Linking,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from './MyOrdersScreen.styles';
import Header from '../components/Header';
import AppIcon from '../components/AppIcon';
import CustomButton from '../components/CustomButton';
import Loading from '../components/Loading';
import { formatPrice, formatDate } from '../utils/helpers';
import { orderService } from '../services/orderService';
import socketService from '../services/socketService';
import { useAuth } from '../context/AuthContext';

export const MyOrdersScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { isAuthenticated, user } = useAuth();

  const [activeTab, setActiveTab] = useState('active'); // 'pending' | 'active' | 'completed' | 'cancelled'
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState(null);
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);

  // Load orders from backend with Stale-While-Revalidate caching
  const loadOrders = useCallback(async (isPullRefresh = false) => {
    if (!isAuthenticated) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (isPullRefresh) {
      setRefreshing(true);
    } else if (orders.length === 0) {
      setLoading(true);
    }

    try {
      const data = await orderService.getOrders();
      setOrders(data || []);
    } catch (e) {
      console.warn('[MyOrdersScreen] Error loading orders:', e?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated, orders.length]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      loadOrders();
    });
    return unsub;
  }, [navigation, loadOrders]);

  // Real-time status update subscription
  useEffect(() => {
    if (!isAuthenticated) return;

    let socketUnsub = null;
    const connectSocketListener = async () => {
      try {
        await socketService.connect();
        const socket = socketService.getSocket();
        if (socket) {
          const handleStatusChange = () => {
            loadOrders();
          };
          socket.on('order:status_updated', handleStatusChange);
          socket.on('delivery:status_update', handleStatusChange);
          socket.on('delivery:partner_assigned', handleStatusChange);

          socketUnsub = () => {
            socket.off('order:status_updated', handleStatusChange);
            socket.off('delivery:status_update', handleStatusChange);
            socket.off('delivery:partner_assigned', handleStatusChange);
          };
        }
      } catch (e) {
        console.warn('[MyOrdersScreen] Socket listen error:', e);
      }
    };

    connectSocketListener();

    return () => {
      if (socketUnsub) socketUnsub();
    };
  }, [isAuthenticated, loadOrders]);

  // Categorize orders into the 4 tabs
  const categorizedOrders = useMemo(() => {
    const pending = [];
    const active = [];
    const completed = [];
    const cancelled = [];

    orders.forEach((o) => {
      const s = o.orderStatus || o.status;
      if (orderService.isOrderCancelled(s)) {
        cancelled.push(o);
      } else if (orderService.isOrderCompleted(s)) {
        completed.push(o);
      } else if (orderService.isOrderActive(s)) {
        active.push(o);
      } else {
        pending.push(o);
      }
    });

    return { pending, active, completed, cancelled };
  }, [orders]);

  // Filter current tab orders by search query
  const displayedOrders = useMemo(() => {
    const currentList = categorizedOrders[activeTab] || [];
    if (!searchQuery.trim()) return currentList;

    const q = searchQuery.toLowerCase().trim();
    return currentList.filter((o) => {
      const idMatch = (o.orderId || o.orderNumber || '').toLowerCase().includes(q);
      const productMatch = (o.items || []).some((it) =>
        (it.name || '').toLowerCase().includes(q)
      );
      return idMatch || productMatch;
    });
  }, [categorizedOrders, activeTab, searchQuery]);

  // Handle Cancel Order
  const handleCancelOrder = (order) => {
    Alert.alert(
      'Cancel Order',
      `Are you sure you want to cancel order #${order.orderId}?`,
      [
        { text: 'Keep Order', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await orderService.cancelOrder(order.orderId, 'Cancelled by customer');
              Alert.alert('Order Cancelled', 'Your order cancellation has been submitted.');
              loadOrders();
            } catch (err) {
              Alert.alert('Error', err?.message || 'Failed to cancel order.');
            }
          },
        },
      ]
    );
  };

  // Handle Download Receipt
  const handleOpenReceiptModal = (order) => {
    setSelectedReceiptOrder(order);
    setReceiptModalVisible(true);
  };

  // Open printable tax invoice in browser
  const handleOpenPrintableInvoice = (order) => {
    const url = orderService.getInvoiceHtmlUrl(order.orderId);
    Linking.openURL(url).catch(() => {
      Alert.alert('Notice', 'Unable to open invoice URL. Please check network connection.');
    });
  };

  // Share receipt summary
  const handleShareReceipt = async (order) => {
    try {
      const total = formatPrice(order.summary?.totalAmount);
      const invoiceUrl = orderService.getInvoiceHtmlUrl(order.orderId);
      await Share.share({
        message: `Order Receipt - #${order.orderId}\nTotal: ${total}\nStatus: Delivered\nDownload Invoice: ${invoiceUrl}`,
        title: `Order Receipt #${order.orderId}`,
      });
    } catch (e) {}
  };

  // Handle Reorder
  const handleReorder = (order) => {
    Alert.alert(
      'Reorder Items',
      `Add all items from Order #${order.orderId} back to your shopping cart?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add to Cart',
          onPress: () => {
            try {
              navigation.navigate('MainApp', { screen: 'CartTab' });
            } catch (e) {
              navigation.navigate('MainApp');
            }
          },
        },
      ]
    );
  };

  // Dial Phone
  const handleCall = (phoneNumber) => {
    if (!phoneNumber) return;
    Linking.openURL(`tel:${phoneNumber}`).catch(() => {
      Alert.alert('Error', 'Unable to dial phone number on this device.');
    });
  };

  // Render Status Badge
  const renderStatusBadge = (status) => {
    const s = String(status || 'Confirmed');
    if (orderService.isOrderCompleted(s)) {
      return (
        <View style={[styles.statusChip, styles.chipCompleted]}>
          <AppIcon name="checkmark-circle" size={13} color="#047857" style={{ marginRight: 4 }} />
          <Text style={styles.chipCompletedText}>Delivered</Text>
        </View>
      );
    }
    if (orderService.isOrderCancelled(s)) {
      return (
        <View style={[styles.statusChip, styles.chipCancelled]}>
          <AppIcon name="close-circle" size={13} color="#B91C1C" style={{ marginRight: 4 }} />
          <Text style={styles.chipCancelledText}>Cancelled</Text>
        </View>
      );
    }
    if (orderService.isOrderActive(s)) {
      const displayLabel = s.replace(/_/g, ' ');
      return (
        <View style={[styles.statusChip, styles.chipActive]}>
          <View style={styles.livePulseDot} />
          <Text style={styles.chipActiveText}>{displayLabel}</Text>
        </View>
      );
    }
    return (
      <View style={[styles.statusChip, styles.chipPending]}>
        <AppIcon name="time-outline" size={13} color="#B45309" style={{ marginRight: 4 }} />
        <Text style={styles.chipPendingText}>{s.replace(/_/g, ' ')}</Text>
      </View>
    );
  };

  // Unauthenticated Guest View
  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <Header title="My Orders" showBack navigation={navigation} />
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <AppIcon name="shield-outline" size={44} color="#64748B" />
          </View>
          <Text style={styles.emptyTitle}>Sign In to View Orders</Text>
          <Text style={styles.emptySubtitle}>
            Log in to your account to view order history, download tax receipts, and track live deliveries in real time.
          </Text>
          <TouchableOpacity
            style={styles.emptyActionBtn}
            onPress={() => navigation.navigate('Login', { redirectTo: 'MyOrders' })}>
            <Text style={styles.emptyActionText}>Sign In / Register</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="My Orders" showBack navigation={navigation} />

      {/* Header Banner with Real-Time Indicator & Search */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          <View>
            <Text style={styles.headerTitle}>Order Management</Text>
            <Text style={styles.headerSubtitle}>
              Live tracking, status synchronization & receipts
            </Text>
          </View>
          <View style={styles.liveIndicatorBadge}>
            <View style={styles.livePulseDot} />
            <Text style={styles.liveIndicatorText}>Live Sync</Text>
          </View>
        </View>

        {/* Quick Search Input */}
        <View style={styles.searchContainer}>
          <AppIcon name="search-outline" size={18} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by Order ID or Product name..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.searchClearBtn}>
              <AppIcon name="close-circle" size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 4 Tabs Bar */}
      <View style={styles.tabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScroll}>
          {/* 1. Pending Orders */}
          <TouchableOpacity
            style={[styles.tabPill, activeTab === 'pending' && styles.tabPillActive]}
            onPress={() => setActiveTab('pending')}
            activeOpacity={0.8}>
            <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>
              Pending Orders
            </Text>
            <View style={[styles.tabBadge, activeTab === 'pending' && styles.tabBadgeActive]}>
              <Text
                style={[
                  styles.tabBadgeText,
                  activeTab === 'pending' && styles.tabBadgeTextActive,
                ]}>
                {categorizedOrders.pending.length}
              </Text>
            </View>
          </TouchableOpacity>

          {/* 2. Active Orders (Most Important) */}
          <TouchableOpacity
            style={[styles.tabPill, activeTab === 'active' && styles.tabPillActive]}
            onPress={() => setActiveTab('active')}
            activeOpacity={0.8}>
            <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>
              Active Orders
            </Text>
            <View style={[styles.tabBadge, activeTab === 'active' && styles.tabBadgeActive]}>
              <Text
                style={[
                  styles.tabBadgeText,
                  activeTab === 'active' && styles.tabBadgeTextActive,
                ]}>
                {categorizedOrders.active.length}
              </Text>
            </View>
          </TouchableOpacity>

          {/* 3. Completed Orders */}
          <TouchableOpacity
            style={[styles.tabPill, activeTab === 'completed' && styles.tabPillActive]}
            onPress={() => setActiveTab('completed')}
            activeOpacity={0.8}>
            <Text style={[styles.tabText, activeTab === 'completed' && styles.tabTextActive]}>
              Completed Orders
            </Text>
            <View style={[styles.tabBadge, activeTab === 'completed' && styles.tabBadgeActive]}>
              <Text
                style={[
                  styles.tabBadgeText,
                  activeTab === 'completed' && styles.tabBadgeTextActive,
                ]}>
                {categorizedOrders.completed.length}
              </Text>
            </View>
          </TouchableOpacity>

          {/* 4. Cancelled Orders */}
          <TouchableOpacity
            style={[styles.tabPill, activeTab === 'cancelled' && styles.tabPillActive]}
            onPress={() => setActiveTab('cancelled')}
            activeOpacity={0.8}>
            <Text style={[styles.tabText, activeTab === 'cancelled' && styles.tabTextActive]}>
              Cancelled Orders
            </Text>
            <View style={[styles.tabBadge, activeTab === 'cancelled' && styles.tabBadgeActive]}>
              <Text
                style={[
                  styles.tabBadgeText,
                  activeTab === 'cancelled' && styles.tabBadgeTextActive,
                ]}>
                {categorizedOrders.cancelled.length}
              </Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Orders List */}
      {loading ? (
        <Loading fullScreen message="Loading order history..." />
      ) : (
        <FlatList
          data={displayedOrders}
          keyExtractor={(item) => String(item.orderId || item._id)}
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          windowSize={5}
          removeClippedSubviews={true}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 28 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadOrders(true)}
              colors={['#2563EB']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <AppIcon
                  name={
                    activeTab === 'active'
                      ? 'bicycle-outline'
                      : activeTab === 'completed'
                      ? 'checkmark-done-circle-outline'
                      : activeTab === 'cancelled'
                      ? 'close-circle-outline'
                      : 'hourglass-outline'
                  }
                  size={42}
                  color="#94A3B8"
                />
              </View>
              <Text style={styles.emptyTitle}>
                {activeTab === 'active'
                  ? 'No Active Orders'
                  : activeTab === 'completed'
                  ? 'No Completed Orders Yet'
                  : activeTab === 'cancelled'
                  ? 'No Cancelled Orders'
                  : 'No Pending Orders'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'active'
                  ? 'When you place an order, live tracking, courier route, and partner updates will appear here.'
                  : activeTab === 'completed'
                  ? 'Your delivered orders and downloadable tax receipts will be archived here.'
                  : activeTab === 'cancelled'
                  ? 'You currently have zero cancelled or refunded orders.'
                  : 'Orders being confirmed or prepared by sellers will appear here.'}
              </Text>
              <TouchableOpacity
                style={styles.emptyActionBtn}
                onPress={() => navigation.navigate('MainApp')}>
                <Text style={styles.emptyActionText}>Start Shopping</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => {
            const isPending = activeTab === 'pending';
            const isActive = activeTab === 'active';
            const isCompleted = activeTab === 'completed';
            const isCancelled = activeTab === 'cancelled';

            const partner = item.deliveryPartner;
            const isCancellable = ['placed', 'confirmed', 'new', 'pending'].includes(
              (item.orderStatus || item.status || '').toLowerCase()
            );

            return (
              <View
                style={[
                  styles.orderCard,
                  isPending && styles.cardPendingAccent,
                  isActive && styles.cardActiveAccent,
                  isCompleted && styles.cardCompletedAccent,
                  isCancelled && styles.cardCancelledAccent,
                ]}>
                {/* Header: Order ID + Status */}
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.orderIdLabel}>Order #{item.orderId}</Text>
                    <Text style={styles.orderDateLabel}>
                      Placed on {formatDate(item.createdAt)}
                    </Text>
                    {isCompleted && item.deliveredAt && (
                      <Text style={[styles.orderDateLabel, { color: '#059669', fontWeight: '700' }]}>
                        Delivered on {formatDate(item.deliveredAt)}
                      </Text>
                    )}
                  </View>
                  {renderStatusBadge(item.orderStatus || item.status)}
                </View>

                {/* ACTIVE ORDER: Delivery Boy Spotlight Banner */}
                {isActive && partner && (
                  <View style={styles.partnerCard}>
                    <View style={styles.partnerAvatar}>
                      <Text style={styles.partnerAvatarText}>
                        {(partner.name || 'D').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.partnerInfo}>
                      <Text style={styles.partnerName}>{partner.name}</Text>
                      <Text style={styles.partnerSub}>
                        {partner.vehicleType || 'Bike'} • {partner.vehicleNumber || 'Verified Partner'}
                        {partner.rating ? ` • ⭐ ${partner.rating}` : ''}
                      </Text>
                    </View>
                    {partner.phone ? (
                      <TouchableOpacity
                        style={styles.callPartnerBtn}
                        onPress={() => handleCall(partner.phone)}>
                        <AppIcon name="call" size={14} color="#FFFFFF" />
                        <Text style={styles.callPartnerText}>Call</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                )}

                {/* ACTIVE ORDER: Handover OTP Callout */}
                {isActive && item.deliveryOtp ? (
                  <View style={styles.otpCallout}>
                    <Text style={styles.otpLabel}>Doorstep Delivery OTP:</Text>
                    <Text style={styles.otpValue}>{item.deliveryOtp}</Text>
                  </View>
                ) : null}

                {/* CANCELLED ORDER: Cancellation Reason & Refund Banner */}
                {isCancelled && (
                  <View style={styles.cancellationBanner}>
                    <Text style={styles.cancellationTitle}>Cancellation Details</Text>
                    <Text style={styles.cancellationText}>
                      Reason: {item.cancellationReason || 'Requested by customer'}
                    </Text>
                    {item.refund && (
                      <Text style={styles.refundStatusText}>
                        Refund: {item.refund.status} (
                        {formatPrice(item.refund.amount || item.summary?.totalAmount)}) via{' '}
                        {item.refund.method || 'Original Payment Source'}
                      </Text>
                    )}
                  </View>
                )}

                {/* Products List Preview */}
                <View style={styles.productsSection}>
                  {(item.items || []).slice(0, 3).map((prod, idx) => (
                    <View key={idx} style={styles.productRow}>
                      <Image
                        source={{
                          uri:
                            prod.image ||
                            'https://images.unsplash.com/photo-1544816155-12df9643f363?w=300&q=80',
                        }}
                        style={styles.productThumb}
                      />
                      <View style={styles.productDetails}>
                        <Text style={styles.productNameText} numberOfLines={1}>
                          {prod.name}
                        </Text>
                        <Text style={styles.productMetaText}>
                          Qty: {prod.quantity} • {formatPrice(prod.price)} each
                        </Text>
                      </View>
                    </View>
                  ))}
                  {(item.items || []).length > 3 && (
                    <Text style={[styles.productMetaText, { marginTop: 4, color: '#2563EB' }]}>
                      +{(item.items || []).length - 3} more item(s)
                    </Text>
                  )}
                </View>

                {/* Card Footer: Total Amount + Payment Mode */}
                <View style={styles.cardFooter}>
                  <View style={styles.footerInfoRow}>
                    <View>
                      <Text style={styles.priceLabel}>Grand Total</Text>
                      <Text style={styles.totalAmount}>
                        {formatPrice(item.summary?.totalAmount)}
                      </Text>
                    </View>
                    <Text style={styles.paymentMethodBadge}>
                      {item.paymentMethod || 'UPI'} •{' '}
                      {item.paymentStatus === 'Paid' ? 'Paid' : 'Pay on Delivery'}
                    </Text>
                  </View>

                  {/* ACTION BUTTONS PER TAB */}
                  <View style={styles.actionButtonsRow}>
                    {/* ACTIVE TAB: Prominent TRACK ORDER button */}
                    {isActive && (
                      <TouchableOpacity
                        style={styles.trackOrderPrimaryBtn}
                        activeOpacity={0.85}
                        onPress={() =>
                          navigation.navigate('TrackOrder', {
                            orderId: item.orderId || item.orderNumber || item._id,
                            order: item,
                          })
                        }>
                        <AppIcon name="navigate-circle" size={18} color="#FFFFFF" />
                        <Text style={styles.trackOrderBtnText}>Track Order Live</Text>
                      </TouchableOpacity>
                    )}

                    {/* COMPLETED TAB: Download Receipt + Reorder */}
                    {isCompleted && (
                      <>
                        <TouchableOpacity
                          style={styles.receiptBtn}
                          activeOpacity={0.8}
                          onPress={() => handleOpenReceiptModal(item)}>
                          <AppIcon name="document-text-outline" size={16} color="#FFFFFF" />
                          <Text style={styles.receiptBtnText}>Download Receipt</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.reorderBtn}
                          activeOpacity={0.8}
                          onPress={() => handleReorder(item)}>
                          <AppIcon name="repeat-outline" size={16} color="#1D4ED8" />
                          <Text style={styles.reorderBtnText}>Reorder</Text>
                        </TouchableOpacity>
                      </>
                    )}

                    {/* CANCELLED TAB: Reorder + Support */}
                    {isCancelled && (
                      <>
                        <TouchableOpacity
                          style={styles.reorderBtn}
                          activeOpacity={0.8}
                          onPress={() => handleReorder(item)}>
                          <AppIcon name="repeat-outline" size={16} color="#1D4ED8" />
                          <Text style={styles.reorderBtnText}>Reorder</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.secondaryActionBtn}
                          activeOpacity={0.8}
                          onPress={() => handleCall('18001234567')}>
                          <AppIcon name="help-buoy-outline" size={14} color="#334155" />
                          <Text style={styles.secondaryActionText}>Help</Text>
                        </TouchableOpacity>
                      </>
                    )}

                    {/* PENDING TAB: Cancel Order (if eligible) + Track Status */}
                    {isPending && (
                      <>
                        {isCancellable && (
                          <TouchableOpacity
                            style={styles.cancelOrderBtn}
                            onPress={() => handleCancelOrder(item)}>
                            <Text style={styles.cancelOrderText}>Cancel Order</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          style={[styles.secondaryActionBtn, { flex: 1 }]}
                          onPress={() =>
                            navigation.navigate('TrackOrder', {
                              orderId: item.orderId || item.orderNumber || item._id,
                              order: item,
                            })
                          }>
                          <AppIcon name="eye-outline" size={14} color="#334155" />
                          <Text style={styles.secondaryActionText}>Track Status</Text>
                        </TouchableOpacity>
                      </>
                    )}

                    {/* View Details Button (Always available) */}
                    <TouchableOpacity
                      style={styles.secondaryActionBtn}
                      activeOpacity={0.8}
                      onPress={() =>
                        navigation.navigate('OrderDetails', { orderId: item.orderId })
                      }>
                      <Text style={styles.secondaryActionText}>Details</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Official Tax Receipt Modal */}
      <Modal
        visible={receiptModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setReceiptModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              { paddingBottom: insets.bottom > 0 ? insets.bottom + 16 : 24 },
            ]}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalHeaderTitle}>Order Tax Receipt</Text>
                <Text style={{ fontSize: 12, color: '#64748B' }}>
                  Official GST-compliant purchase receipt
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setReceiptModalVisible(false)}
                style={styles.modalCloseBtn}>
                <AppIcon name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>

            {selectedReceiptOrder && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Official Receipt Card */}
                <View style={styles.receiptInvoiceBox}>
                  <Text style={styles.receiptBrandTitle}>BHARAT BAZAAR</Text>
                  <Text style={styles.receiptSubTitle}>
                    Pan-India Artisans & Multi-Vendor Marketplace
                  </Text>

                  <View style={styles.receiptNumberRow}>
                    <Text style={styles.receiptKeyText}>Receipt / Invoice No:</Text>
                    <Text style={styles.receiptValText}>
                      INV-{selectedReceiptOrder.orderId}
                    </Text>
                  </View>
                  <View style={styles.receiptTotalsRow}>
                    <Text style={styles.receiptKeyText}>Order Date:</Text>
                    <Text style={styles.receiptValText}>
                      {formatDate(selectedReceiptOrder.createdAt)}
                    </Text>
                  </View>
                  {selectedReceiptOrder.deliveredAt && (
                    <View style={styles.receiptTotalsRow}>
                      <Text style={styles.receiptKeyText}>Delivered On:</Text>
                      <Text style={[styles.receiptValText, { color: '#059669' }]}>
                        {formatDate(selectedReceiptOrder.deliveredAt)}
                      </Text>
                    </View>
                  )}
                  <View style={styles.receiptTotalsRow}>
                    <Text style={styles.receiptKeyText}>Payment Mode:</Text>
                    <Text style={styles.receiptValText}>
                      {selectedReceiptOrder.paymentMethod || 'UPI'} (Verified)
                    </Text>
                  </View>

                  {/* Customer Delivery Details */}
                  {selectedReceiptOrder.deliveryAddress && (
                    <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#E2E8F0' }}>
                      <Text style={[styles.receiptKeyText, { fontWeight: '700', marginBottom: 2 }]}>
                        Delivered To:
                      </Text>
                      <Text style={styles.receiptValText}>
                        {selectedReceiptOrder.deliveryAddress.fullName || user?.fullName || 'Customer'}
                      </Text>
                      <Text style={styles.receiptKeyText}>
                        {selectedReceiptOrder.deliveryAddress.addressLine1 || ''},{' '}
                        {selectedReceiptOrder.deliveryAddress.city} -{' '}
                        {selectedReceiptOrder.deliveryAddress.pinCode}
                      </Text>
                    </View>
                  )}

                  {/* Itemized Table */}
                  <View style={styles.receiptTable}>
                    <Text style={[styles.receiptKeyText, { fontWeight: '800', marginBottom: 6 }]}>
                      Purchased Items
                    </Text>
                    {(selectedReceiptOrder.items || []).map((it, idx) => (
                      <View key={idx} style={styles.receiptItemRow}>
                        <Text style={styles.receiptItemName} numberOfLines={1}>
                          {it.name} (x{it.quantity})
                        </Text>
                        <Text style={styles.receiptItemPrice}>
                          {formatPrice(it.price * it.quantity)}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Summary Breakdown */}
                  <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 8 }}>
                    <View style={styles.receiptTotalsRow}>
                      <Text style={styles.receiptKeyText}>Items Subtotal:</Text>
                      <Text style={styles.receiptValText}>
                        {formatPrice(selectedReceiptOrder.summary?.subtotal)}
                      </Text>
                    </View>
                    {selectedReceiptOrder.summary?.discount > 0 && (
                      <View style={styles.receiptTotalsRow}>
                        <Text style={styles.receiptKeyText}>Coupon Discount:</Text>
                        <Text style={[styles.receiptValText, { color: '#16A34A' }]}>
                          -{formatPrice(selectedReceiptOrder.summary?.discount)}
                        </Text>
                      </View>
                    )}
                    <View style={styles.receiptTotalsRow}>
                      <Text style={styles.receiptKeyText}>Delivery Charges:</Text>
                      <Text style={styles.receiptValText}>
                        {selectedReceiptOrder.summary?.deliveryFee === 0
                          ? 'FREE'
                          : formatPrice(selectedReceiptOrder.summary?.deliveryFee)}
                      </Text>
                    </View>
                    <View style={styles.receiptTotalsRow}>
                      <Text style={styles.receiptKeyText}>Applicable GST (18%):</Text>
                      <Text style={styles.receiptValText}>
                        {formatPrice(selectedReceiptOrder.summary?.tax || 0)}
                      </Text>
                    </View>
                    <View style={styles.receiptGrandTotalRow}>
                      <Text style={styles.receiptGrandTotalText}>Grand Total Paid:</Text>
                      <Text style={[styles.receiptGrandTotalText, { color: '#2563EB' }]}>
                        {formatPrice(selectedReceiptOrder.summary?.totalAmount)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Modal Action Buttons */}
                <View style={styles.receiptModalActions}>
                  <TouchableOpacity
                    style={styles.modalPrintBtn}
                    onPress={() => handleOpenPrintableInvoice(selectedReceiptOrder)}>
                    <AppIcon name="print-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.modalPrintText}>View & Print Official PDF</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.modalShareBtn}
                    onPress={() => handleShareReceipt(selectedReceiptOrder)}>
                    <AppIcon name="share-social-outline" size={18} color="#334155" />
                    <Text style={styles.modalShareText}>Share</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default MyOrdersScreen;
