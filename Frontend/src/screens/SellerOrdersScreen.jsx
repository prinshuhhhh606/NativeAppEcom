import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
  Modal,
  ScrollView,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import AppIcon from '../components/AppIcon';
import SellerHeader from '../components/seller/SellerHeader';
import OrderStatusBadge from '../components/seller/OrderStatusBadge';
import EmptyState from '../components/seller/EmptyState';
import LoadingSkeleton from '../components/seller/LoadingSkeleton';
import sellerService from '../services/sellerService';
import { formatPrice } from '../utils/helpers';
import styles from './SellerOrdersScreen.styles';

export const SellerOrdersScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Bulk Operations State
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // Customer Chat Modal State
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [selectedOrderForChat, setSelectedOrderForChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [quickReplies, setQuickReplies] = useState([]);
  const [messageInput, setMessageInput] = useState('');

  // Rejection Reason Modal State
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [orderToReject, setOrderToReject] = useState(null);
  const [selectedReason, setSelectedReason] = useState('Item out of stock');
  const [customReason, setCustomReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  // Delivery Partner Assignment Modal State
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [orderToAssign, setOrderToAssign] = useState(null);
  const [eligiblePartners, setEligiblePartners] = useState([]);
  const [loadingPartners, setLoadingPartners] = useState(false);
  const [assigningRiderId, setAssigningRiderId] = useState(null);

  const presetReasons = [
    'Item out of stock in warehouse',
    'Pricing or inventory discrepancy',
    'Customer requested cancellation',
    'Delivery pincode unserviceable by local fleet',
    'Store closing temporarily for maintenance',
    'Other reason',
  ];

  const fetchOrders = useCallback(async () => {
    try {
      const res = await sellerService.getOrders();
      const list = Array.isArray(res) ? res : res.orders || res.data || [];
      setOrders(list);
    } catch (err) {
      Alert.alert('Orders Error', err.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    setSelectedOrders([]);
    fetchOrders();
  };

  // Status Filter Tabs
  const getNormStatus = (o) => (o.status || o.orderStatus || 'pending').toLowerCase();

  const statusTabs = [
    { id: 'all', label: `All (${orders.length})` },
    {
      id: 'new',
      label: `New (${orders.filter((o) => ['pending', 'new', 'placed'].includes(getNormStatus(o))).length})`,
    },
    {
      id: 'accepted',
      label: `Accepted (${orders.filter((o) => ['accepted', 'confirmed'].includes(getNormStatus(o))).length})`,
    },
    {
      id: 'processing',
      label: `Processing (${orders.filter((o) => ['processing', 'preparing', 'processing_completed', 'packing', 'packed'].includes(getNormStatus(o))).length})`,
    },
    {
      id: 'ready_for_pickup',
      label: `Ready (${orders.filter((o) => ['ready_for_pickup', 'ready_to_ship', 'pickup_scheduled'].includes(getNormStatus(o))).length})`,
    },
    {
      id: 'shipped',
      label: `Shipped (${orders.filter((o) => ['shipped', 'picked_up', 'in_transit', 'out_for_delivery'].includes(getNormStatus(o))).length})`,
    },
    {
      id: 'delivered',
      label: `Delivered (${orders.filter((o) => getNormStatus(o) === 'delivered').length})`,
    },
    {
      id: 'cancelled',
      label: `Cancelled (${orders.filter((o) => getNormStatus(o) === 'cancelled').length})`,
    },
    {
      id: 'rejected',
      label: `Rejected (${orders.filter((o) => getNormStatus(o) === 'rejected').length})`,
    },
  ];

  const filteredOrders = orders.filter((o) => {
    const s = getNormStatus(o);
    const matchesSearch =
      (o.orderNumber || (o._id ? o._id.slice(-6) : '')).toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.subOrderNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.customerName || o.shippingAddress?.fullName || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'all') return true;
    if (activeTab === 'new') return ['pending', 'new', 'placed'].includes(s);
    if (activeTab === 'accepted') return ['accepted', 'confirmed'].includes(s);
    if (activeTab === 'processing') return ['processing', 'preparing', 'processing_completed', 'packing', 'packed'].includes(s);
    if (activeTab === 'ready_for_pickup') return ['ready_for_pickup', 'ready_to_ship', 'pickup_scheduled'].includes(s);
    if (activeTab === 'shipped') return ['shipped', 'picked_up', 'in_transit', 'out_for_delivery'].includes(s);
    if (activeTab === 'delivered') return s === 'delivered';
    if (activeTab === 'cancelled') return s === 'cancelled';
    if (activeTab === 'rejected') return s === 'rejected';

    return s === activeTab;
  });

  // Toggle Order Selection for Bulk Actions
  const toggleSelectOrder = (id) => {
    if (selectedOrders.includes(id)) {
      setSelectedOrders(selectedOrders.filter((oId) => oId !== id));
    } else {
      setSelectedOrders([...selectedOrders, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map((o) => o._id));
    }
  };

  // Status Action: Accept Order
  const handleAcceptOrder = async (order) => {
    try {
      await sellerService.acceptOrder(order._id);
      Alert.alert('Order Accepted', `Order #${order.orderNumber || order.subOrderNumber} has been accepted and moved to Accepted Orders.`);
      fetchOrders();
    } catch (e) {
      Alert.alert('Accept Error', e.message || 'Failed to accept order');
    }
  };

  // Status Action: Open Rejection Modal
  const handleOpenRejectModal = (order) => {
    setOrderToReject(order);
    setSelectedReason('Item out of stock in warehouse');
    setCustomReason('');
    setRejectModalVisible(true);
  };

  // Status Action: Confirm Rejection with Reason
  const handleConfirmReject = async () => {
    if (!orderToReject) return;
    const finalReason = selectedReason === 'Other reason'
      ? customReason.trim()
      : (customReason.trim() ? `${selectedReason} - ${customReason.trim()}` : selectedReason);

    if (!finalReason) {
      Alert.alert('Reason Required', 'Please choose or provide a reason for rejecting this order.');
      return;
    }

    setRejecting(true);
    try {
      await sellerService.rejectOrder(orderToReject._id, finalReason);
      Alert.alert(
        'Order Rejected',
        `Order #${orderToReject.orderNumber || orderToReject.subOrderNumber} has been rejected. Customer has been notified.${orderToReject.paymentStatus === 'Completed' || orderToReject.paymentStatus === 'paid' ? ' Refund initiated for prepaid payment.' : ''}`
      );
      setRejectModalVisible(false);
      setOrderToReject(null);
      fetchOrders();
    } catch (e) {
      Alert.alert('Reject Error', e.message || 'Failed to reject order');
    } finally {
      setRejecting(false);
    }
  };

  // Status Action: Lifecycle Progression
  const handleUpdateStatus = async (orderId, newStatus, message) => {
    try {
      await sellerService.updateOrderStatus(orderId, newStatus);
      Alert.alert('Status Updated', message || `Order marked as ${newStatus.replace(/_/g, ' ')}.`);
      fetchOrders();
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to update order status');
    }
  };

  // Delivery Partner Modal: Open & Fetch Riders
  const handleOpenAssignModal = async (order) => {
    setOrderToAssign(order);
    setAssignModalVisible(true);
    setLoadingPartners(true);
    try {
      const pin = order.shippingAddress?.pinCode || order.shippingAddress?.pincode;
      const city = order.shippingAddress?.city;
      const partners = await sellerService.getEligibleDeliveryPartners({ pinCode: pin, city });
      setEligiblePartners(Array.isArray(partners) ? partners : []);
    } catch (e) {
      Alert.alert('Rider Fleet Error', e.message || 'Could not fetch available delivery partners');
    } finally {
      setLoadingPartners(false);
    }
  };

  // Delivery Partner Modal: Confirm Assignment
  const handleConfirmAssignPartner = async (partner) => {
    if (!orderToAssign) return;
    setAssigningRiderId(partner._id);
    try {
      await sellerService.assignDeliveryPartner({
        orderId: orderToAssign._id,
        deliveryPartnerId: partner._id,
      });
      Alert.alert(
        'Delivery Assigned! 🛵',
        `Order assigned to ${partner.name} (${partner.vehicleType || 'Bike'}). Rider has been notified in real time.`
      );
      setAssignModalVisible(false);
      setOrderToAssign(null);
      fetchOrders();
    } catch (e) {
      Alert.alert('Assignment Error', e.message || 'Could not assign delivery partner');
    } finally {
      setAssigningRiderId(null);
    }
  };

  // Bulk Status Update (Bulk Accept, Bulk Pack, Bulk Ready for Pickup)
  const handleBulkAction = async (action) => {
    if (selectedOrders.length === 0) return;

    setBulkProcessing(true);
    try {
      const res = await sellerService.bulkUpdateOrders(selectedOrders, action);
      Alert.alert(
        'Bulk Operation Completed',
        `Successfully updated ${res.updatedCount || selectedOrders.length} orders.`
      );
      setSelectedOrders([]);
      fetchOrders();
    } catch (e) {
      Alert.alert('Bulk Action Error', e.message || 'Failed to update selected orders');
    } finally {
      setBulkProcessing(false);
    }
  };

  // Open Communication Center Modal
  const handleOpenChat = async (order) => {
    setSelectedOrderForChat(order);
    setChatModalVisible(true);
    try {
      const [msgs, qReplies] = await Promise.all([
        sellerService.getOrderMessages(order._id),
        sellerService.getQuickReplies(),
      ]);
      setChatMessages(Array.isArray(msgs) ? msgs : msgs.messages || msgs.data || []);
      setQuickReplies(Array.isArray(qReplies) ? qReplies : qReplies.data || []);
    } catch (e) {
      setQuickReplies([
        { key: 'confirm', text: 'Hello! Your order has been confirmed and is being packed with care.' },
        { key: 'packed', text: 'Your parcel is packed and ready for delivery partner pickup.' },
        { key: 'address', text: 'Please confirm any specific landmark or delivery instructions.' },
      ]);
    }
  };

  const handleSendMessage = async (textToSend, quickKey = null) => {
    const message = textToSend || messageInput;
    if (!message || !message.trim()) return;

    try {
      const res = await sellerService.sendOrderMessage(
        selectedOrderForChat._id,
        message.trim(),
        quickKey
      );
      const newMsg = res.data || res.messageDoc || {
        _id: String(Date.now()),
        senderRole: 'seller',
        text: message.trim(),
        createdAt: new Date().toISOString(),
      };
      setChatMessages([...chatMessages, newMsg]);
      setMessageInput('');
    } catch (e) {
      Alert.alert('Message Error', e.message || 'Failed to deliver message');
    }
  };

  const handleViewInvoice = (order) => {
    const custPhone = order.customerPhone || order.shippingAddress?.phone || order.shippingAddress?.mobileNumber || '9876543210';
    const totalVal = order.subtotal || order.totalAmount || order.netEarnings || 0;

    Alert.alert(
      `GST Tax Invoice #${order.subOrderNumber || order.orderNumber || (order._id ? order._id.slice(-6).toUpperCase() : 'ORD')}`,
      `Customer: ${order.customerName || order.shippingAddress?.fullName || 'Customer'}\nPhone: ${custPhone}\nDelivery City: ${order.shippingAddress?.city || 'Jaipur'}, ${order.shippingAddress?.state || 'Rajasthan'}\nTotal Value: ${formatPrice(totalVal)}\nStatus: ${(order.status || order.orderStatus || 'pending').toUpperCase()}`,
      [{ text: 'Close', style: 'cancel' }]
    );
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <View style={styles.container}>
      <SellerHeader
        title="Orders & Shipping"
        subtitle={`${orders.length} store orders received`}
        navigation={navigation}
      />

      {/* Search Input Bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchInputContainer}>
          <AppIcon name="search-outline" size={16} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Order # or Customer..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {filteredOrders.length > 0 && (
          <TouchableOpacity style={styles.selectAllBtn} onPress={handleSelectAll}>
            <Text style={styles.selectAllText}>
              {selectedOrders.length === filteredOrders.length ? 'Deselect All' : 'Select All'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Status Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
        {statusTabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.activeTab]}
            onPress={() => {
              setActiveTab(tab.id);
              setSelectedOrders([]);
            }}
            activeOpacity={0.7}>
            <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Main Order List */}
      {loading ? (
        <View style={{ padding: 16 }}>
          <LoadingSkeleton count={4} height={150} />
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item._id || item.orderId || String(Math.random())}
          contentContainerStyle={[
            styles.listContent,
            selectedOrders.length > 0 && { paddingBottom: 110 },
          ]}
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          windowSize={5}
          removeClippedSubviews={Platform.OS === 'android'}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />
          }
          renderItem={({ item }) => {
            const isSelected = selectedOrders.includes(item._id);
            const status = getNormStatus(item);
            const customerName = item.customerName || item.shippingAddress?.fullName || 'Customer';
            const customerPhone = item.customerPhone || item.shippingAddress?.phone || item.shippingAddress?.mobileNumber || '9876543210';
            const totalValue = item.subtotal || item.totalAmount || item.netEarnings || 0;
            const items = item.items || [];
            const payMethod = item.paymentMethod || 'ONLINE';
            const payStatus = item.paymentStatus || 'Pending';
            const createdDate = formatDateTime(item.createdAt);
            const assignedRiderName = item.deliveryPartnerName || item.shipping?.deliveryPartnerName;
            const assignedRiderPhone = item.deliveryPartnerPhone || item.shipping?.deliveryPartnerPhone;
            const assignedRiderVehicle = item.deliveryPartnerVehicleType || item.deliveryPartnerVehicleNumber || item.shipping?.vehicleType || 'Bike';

            return (
              <View style={[styles.orderCard, isSelected && styles.selectedOrderCard]}>
                {/* Header row: Checkbox, Order ID, Status Badge */}
                <View style={styles.cardHeader}>
                  <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() => toggleSelectOrder(item._id)}
                    activeOpacity={0.7}>
                    <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                      {isSelected ? <AppIcon name="checkmark" size={12} color="#FFFFFF" /> : null}
                    </View>
                    <View>
                      <Text style={styles.orderNumberText}>
                        #{item.subOrderNumber || item.orderNumber || (item._id ? item._id.slice(-6).toUpperCase() : 'ORD')}
                      </Text>
                      {!!createdDate && (
                        <Text style={styles.orderDateTime}>📅 {createdDate}</Text>
                      )}
                    </View>
                  </TouchableOpacity>

                  <OrderStatusBadge status={status} />
                </View>

                {/* Details & Customer Information */}
                <TouchableOpacity
                  style={styles.cardDetails}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('SellerOrderDetails', { order: item })}>
                  <Text style={styles.customerNameText}>{customerName}</Text>
                  <Text style={styles.customerSubText}>
                    📞 {customerPhone}
                  </Text>

                  {/* Customer Full Delivery Address */}
                  {item.shippingAddress ? (
                    <View style={styles.addressBox}>
                      <Text style={styles.addressHeading}>Delivery Address:</Text>
                      <Text style={styles.addressFullText} numberOfLines={2}>
                        {item.shippingAddress.addressLine1 || item.shippingAddress.addressLine || ''}
                        {item.shippingAddress.addressLine2 ? `, ${item.shippingAddress.addressLine2}` : ''}
                        {item.shippingAddress.city ? `, ${item.shippingAddress.city}` : ''}
                        {item.shippingAddress.state ? `, ${item.shippingAddress.state}` : ''}
                        {item.shippingAddress.pinCode || item.shippingAddress.pincode ? ` - ${item.shippingAddress.pinCode || item.shippingAddress.pincode}` : ''}
                      </Text>
                    </View>
                  ) : null}

                  {/* Product items snippet */}
                  <View style={styles.itemsPreviewList}>
                    {items.slice(0, 2).map((it, idx) => (
                      <View key={idx} style={styles.productItemRow}>
                        <View style={styles.productThumb}>
                          {it.image || it.product?.images?.[0] ? (
                            <Image
                              source={{ uri: it.image || it.product?.images?.[0] }}
                              style={styles.productImage}
                            />
                          ) : (
                            <AppIcon name="cube-outline" size={20} color="#64748B" />
                          )}
                        </View>
                        <View style={styles.productItemDetails}>
                          <Text style={styles.productTitle} numberOfLines={1}>
                            {it.name || it.product?.name || 'Product'}
                          </Text>
                          <Text style={styles.productQtyPrice}>
                            Qty: {it.quantity || 1} • {formatPrice(it.price || 0)}
                          </Text>
                        </View>
                      </View>
                    ))}
                    {items.length > 2 && (
                      <Text style={{ fontSize: 10, color: '#64748B', fontStyle: 'italic' }}>
                        +{items.length - 2} more item(s)...
                      </Text>
                    )}
                  </View>

                  {/* Financial & Payment Tags */}
                  <View style={styles.metaTagsRow}>
                    <View style={styles.metaBadge}>
                      <Text style={styles.metaBadgeText}>
                        💰 Total: {formatPrice(totalValue)}
                      </Text>
                    </View>
                    <View style={[styles.metaBadge, { backgroundColor: payMethod === 'COD' ? '#FEF3C7' : '#EFF6FF' }]}>
                      <Text style={[styles.metaBadgeText, { color: payMethod === 'COD' ? '#D97706' : '#2563EB' }]}>
                        💳 {payMethod}
                      </Text>
                    </View>
                    <View style={[styles.metaBadge, { backgroundColor: payStatus === 'Completed' || payStatus === 'paid' ? '#ECFDF5' : '#FFFBEB' }]}>
                      <Text style={[styles.metaBadgeText, { color: payStatus === 'Completed' || payStatus === 'paid' ? '#059669' : '#B45309' }]}>
                        {payStatus === 'Completed' || payStatus === 'paid' ? '✓ Paid' : `Status: ${payStatus}`}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Assigned Delivery Partner Card (if assigned) */}
                {assignedRiderName ? (
                  <View style={styles.assignedRiderCard}>
                    <View style={styles.riderInfoLeft}>
                      <View style={styles.riderAvatarCircle}>
                        <Text style={styles.riderAvatarText}>{assignedRiderName.charAt(0)}</Text>
                      </View>
                      <View>
                        <Text style={styles.riderNameText}>🛵 {assignedRiderName}</Text>
                        <Text style={styles.riderSubText}>
                          📞 {assignedRiderPhone || 'Fleet Rider'} • {assignedRiderVehicle}
                        </Text>
                      </View>
                    </View>
                    {['ready_for_pickup', 'pickup_scheduled'].includes(status) && (
                      <TouchableOpacity
                        style={styles.reassignBtn}
                        onPress={() => handleOpenAssignModal(item)}>
                        <Text style={styles.reassignBtnText}>Reassign</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : null}

                {/* Card Action Buttons Row */}
                <View style={styles.cardActionsRow}>
                  {/* Phase 1: New / Placed -> Accept Order & Reject Order */}
                  {['pending', 'new', 'placed'].includes(status) && (
                    <>
                      <TouchableOpacity
                        style={[styles.btnAction, { backgroundColor: '#2563EB' }]}
                        onPress={() => handleAcceptOrder(item)}>
                        <AppIcon name="checkmark-circle-outline" size={14} color="#FFFFFF" />
                        <Text style={[styles.btnActionText, { color: '#FFFFFF' }]}>Accept Order</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.btnAction, { backgroundColor: '#FEF2F2' }]}
                        onPress={() => handleOpenRejectModal(item)}>
                        <AppIcon name="close-circle-outline" size={14} color="#DC2626" />
                        <Text style={[styles.btnActionText, { color: '#DC2626' }]}>Reject Order</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {/* Phase 2: Accepted / Confirmed -> Start Processing */}
                  {['accepted', 'confirmed'].includes(status) && (
                    <TouchableOpacity
                      style={[styles.btnAction, { backgroundColor: '#ECFDF5' }]}
                      onPress={() => handleUpdateStatus(item._id, 'processing', 'Order marked as Processing')}>
                      <AppIcon name="hammer-outline" size={14} color="#059669" />
                      <Text style={[styles.btnActionText, { color: '#059669' }]}>Start Processing</Text>
                    </TouchableOpacity>
                  )}

                  {/* Phase 3: Processing -> Mark as Packed */}
                  {['preparing', 'processing', 'packing'].includes(status) && (
                    <TouchableOpacity
                      style={[styles.btnAction, { backgroundColor: '#FDF4FF' }]}
                      onPress={() => handleUpdateStatus(item._id, 'packed', 'Order marked as Packed')}>
                      <AppIcon name="cube-outline" size={14} color="#C026D3" />
                      <Text style={[styles.btnActionText, { color: '#C026D3' }]}>Mark as Packed</Text>
                    </TouchableOpacity>
                  )}

                  {/* Phase 4: Packed -> Ship Order */}
                  {['packed', 'ready_for_pickup', 'ready_to_ship'].includes(status) && (
                    <TouchableOpacity
                      style={[styles.btnAction, { backgroundColor: '#059669' }]}
                      onPress={() => handleUpdateStatus(item._id, 'shipped', 'Order marked as Shipped')}>
                      <AppIcon name="airplane-outline" size={14} color="#FFFFFF" />
                      <Text style={[styles.btnActionText, { color: '#FFFFFF' }]}>Ship Order</Text>
                    </TouchableOpacity>
                  )}

                  {/* Phase 5: Shipped -> Move to In Transit */}
                  {['shipped'].includes(status) && (
                    <TouchableOpacity
                      style={[styles.btnAction, { backgroundColor: '#2563EB' }]}
                      onPress={() => handleUpdateStatus(item._id, 'in_transit', 'Order marked as In Transit')}>
                      <AppIcon name="navigate-outline" size={14} color="#FFFFFF" />
                      <Text style={[styles.btnActionText, { color: '#FFFFFF' }]}>Move to In Transit</Text>
                    </TouchableOpacity>
                  )}

                  {/* Phase 6: In Transit -> Out for Delivery / Assign Delivery Partner */}
                  {['in_transit', 'ready_for_pickup', 'ready_to_ship'].includes(status) && (
                    <TouchableOpacity
                      style={[styles.btnAction, { backgroundColor: '#0D9488' }]}
                      onPress={() => handleOpenAssignModal(item)}>
                      <AppIcon name="bicycle-outline" size={14} color="#FFFFFF" />
                      <Text style={[styles.btnActionText, { color: '#FFFFFF' }]}>Assign Delivery Partner</Text>
                    </TouchableOpacity>
                  )}

                  {/* Phase 7: Out for Delivery -> Mark Delivered */}
                  {['out_for_delivery'].includes(status) && (
                    <TouchableOpacity
                      style={[styles.btnAction, { backgroundColor: '#059669' }]}
                      onPress={() => handleUpdateStatus(item._id, 'delivered', 'Order successfully Delivered!')}>
                      <AppIcon name="checkmark-done-outline" size={14} color="#FFFFFF" />
                      <Text style={[styles.btnActionText, { color: '#FFFFFF' }]}>Mark Delivered</Text>
                    </TouchableOpacity>
                  )}

                  {/* Common auxiliary action buttons */}
                  <TouchableOpacity
                    style={[styles.btnAction, { backgroundColor: '#F1F5F9' }]}
                    onPress={() => handleOpenChat(item)}>
                    <AppIcon name="chatbubble-ellipses-outline" size={13} color="#475569" />
                    <Text style={[styles.btnActionText, { color: '#475569' }]}>Message</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.btnAction, { backgroundColor: '#F1F5F9' }]}
                    onPress={() => handleViewInvoice(item)}>
                    <AppIcon name="receipt-outline" size={13} color="#475569" />
                    <Text style={[styles.btnActionText, { color: '#475569' }]}>Invoice</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              icon="cart-outline"
              title="No Orders Found"
              description={
                searchQuery
                  ? `No orders match "${searchQuery}".`
                  : 'You do not have any orders in this tab.'
              }
            />
          }
        />
      )}

      {/* Floating Bulk Action Bar */}
      {selectedOrders.length > 0 && (
        <View style={styles.bulkActionBar}>
          <View>
            <Text style={styles.bulkCountText}>{selectedOrders.length} Selected</Text>
            <Text style={styles.bulkSubText}>Bulk Fulfillment</Text>
          </View>

          <View style={styles.bulkBtnRow}>
            <TouchableOpacity
              style={[styles.bulkBtn, { backgroundColor: '#2563EB' }]}
              onPress={() => handleBulkAction('accept')}
              disabled={bulkProcessing}>
              <Text style={styles.bulkBtnText}>Accept</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.bulkBtn, { backgroundColor: '#059669' }]}
              onPress={() => handleBulkAction('pack')}
              disabled={bulkProcessing}>
              <Text style={styles.bulkBtnText}>Pack</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.bulkBtn, { backgroundColor: '#7C3AED' }]}
              onPress={() => handleBulkAction('ready_for_pickup')}
              disabled={bulkProcessing}>
              <Text style={styles.bulkBtnText}>Pickup</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Rejection Reason Modal */}
      <Modal visible={rejectModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentContainer}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Reject Order</Text>
              <TouchableOpacity
                onPress={() => setRejectModalVisible(false)}
                style={styles.closeBtn}>
                <AppIcon name="close" size={18} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Please select or enter a mandatory reason for rejecting Order #{orderToReject?.orderNumber || orderToReject?.subOrderNumber}. The customer will be notified immediately.
            </Text>

            <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}>
              {presetReasons.map((reason, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.reasonChip,
                    selectedReason === reason && styles.reasonChipSelected,
                  ]}
                  onPress={() => setSelectedReason(reason)}>
                  <Text
                    style={[
                      styles.reasonChipText,
                      selectedReason === reason && styles.reasonChipTextSelected,
                    ]}>
                    {selectedReason === reason ? '✓ ' : ''}{reason}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TextInput
              style={styles.rejectionTextInput}
              placeholder="Additional comments or custom reason (optional)..."
              placeholderTextColor="#94A3B8"
              value={customReason}
              onChangeText={setCustomReason}
              multiline
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setRejectModalVisible(false)}
                disabled={rejecting}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleConfirmReject}
                disabled={rejecting}>
                {rejecting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalConfirmBtnText}>Confirm Rejection</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delivery Partner Assignment Modal */}
      <Modal visible={assignModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentContainer}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalTitle}>Assign Delivery Partner</Text>
                <Text style={styles.modalSubtitle}>
                  Order #{orderToAssign?.orderNumber || orderToAssign?.subOrderNumber} • {orderToAssign?.shippingAddress?.city || 'Local Delivery'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setAssignModalVisible(false)}
                style={styles.closeBtn}>
                <AppIcon name="close" size={18} color="#0F172A" />
              </TouchableOpacity>
            </View>

            {loadingPartners ? (
              <View style={{ padding: 24, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#059669" />
                <Text style={{ marginTop: 10, color: '#64748B', fontSize: 12 }}>
                  Finding online approved delivery partners near pickup hub...
                </Text>
              </View>
            ) : eligiblePartners.length === 0 ? (
              <View style={styles.emptyRidersContainer}>
                <AppIcon name="bicycle-outline" size={40} color="#CBD5E1" />
                <Text style={styles.emptyRidersText}>
                  No online delivery partners currently available in this delivery zone.
                </Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
                {eligiblePartners.map((partner) => {
                  const isAssigningThis = assigningRiderId === partner._id;
                  return (
                    <View key={partner._id} style={styles.riderItemCard}>
                      <View style={styles.riderItemLeft}>
                        <View style={styles.riderAvatarCircle}>
                          <Text style={styles.riderAvatarText}>
                            {partner.name ? partner.name.charAt(0) : 'R'}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.riderItemName}>{partner.name}</Text>
                          <Text style={styles.riderItemMeta}>
                            📞 {partner.phone} • {partner.vehicleType || 'Bike'} ({partner.vehicleNumber || 'DL-Reg'})
                          </Text>
                          <View style={styles.riderItemBadgeRow}>
                            <View style={styles.ratingBadge}>
                              <AppIcon name="star" size={10} color="#D97706" />
                              <Text style={styles.ratingBadgeText}>{partner.rating || 4.8}</Text>
                            </View>
                            <View style={styles.distanceBadge}>
                              <Text style={styles.distanceBadgeText}>
                                📍 ~{partner.approxDistanceKm || 2.1} km away
                              </Text>
                            </View>
                            <View style={[styles.distanceBadge, { backgroundColor: '#F0FDF4' }]}>
                              <Text style={[styles.distanceBadgeText, { color: '#059669' }]}>
                                {partner.activeTasks || 0} active task(s)
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>

                      <TouchableOpacity
                        style={styles.assignBtn}
                        onPress={() => handleConfirmAssignPartner(partner)}
                        disabled={isAssigningThis}>
                        {isAssigningThis ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={styles.assignBtnText}>Assign Rider</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Customer Communication Modal */}
      <Modal visible={chatModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.chatModalContainer}>
            <View style={styles.chatHeader}>
              <View>
                <Text style={styles.chatHeaderTitle}>Buyer Communication</Text>
                <Text style={styles.chatHeaderSubtitle}>
                  Order #{selectedOrderForChat?.orderNumber || (selectedOrderForChat?._id ? selectedOrderForChat._id.slice(-6).toUpperCase() : '')} • {selectedOrderForChat?.shippingAddress?.fullName}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setChatModalVisible(false)} style={styles.closeBtn}>
                <AppIcon name="close" size={18} color="#0F172A" />
              </TouchableOpacity>
            </View>

            {/* Quick Replies Chips */}
            <View style={styles.quickReplyContainer}>
              <Text style={styles.quickReplyHeading}>1-Click Quick Replies:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {quickReplies.map((qr, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.quickChip}
                    onPress={() => handleSendMessage(qr.text, qr.key)}>
                    <Text style={styles.quickChipText}>{qr.text}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Message Thread */}
            <ScrollView style={styles.messageThread} showsVerticalScrollIndicator={false}>
              {chatMessages.length === 0 ? (
                <Text style={styles.noMessagesText}>
                  No previous messages. Tap a quick-reply chip above or type below.
                </Text>
              ) : (
                chatMessages.map((msg, idx) => {
                  const isSeller = msg.senderRole === 'seller';
                  return (
                    <View
                      key={idx}
                      style={[
                        styles.messageBubble,
                        isSeller ? styles.sellerBubble : styles.customerBubble,
                      ]}>
                      <Text
                        style={[
                          styles.messageText,
                          isSeller && styles.sellerMessageText,
                        ]}>
                        {msg.text}
                      </Text>
                      {msg.createdAt && (
                        <Text
                          style={[
                            styles.messageTime,
                            isSeller && styles.sellerMessageTime,
                          ]}>
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      )}
                    </View>
                  );
                })
              )}
            </ScrollView>

            {/* Message Input Bar */}
            <View style={styles.inputBar}>
              <TextInput
                style={styles.chatInput}
                placeholder="Type customer reply..."
                placeholderTextColor="#94A3B8"
                value={messageInput}
                onChangeText={setMessageInput}
              />
              <TouchableOpacity
                style={styles.sendBtn}
                onPress={() => handleSendMessage()}
                activeOpacity={0.8}>
                <AppIcon name="send" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default SellerOrdersScreen;
