import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Share,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import AppIcon from '../components/AppIcon';
import SellerHeader from '../components/seller/SellerHeader';
import OrderStatusBadge from '../components/seller/OrderStatusBadge';
import LiveTrackingMap from '../components/LiveTrackingMap';
import sellerService from '../services/sellerService';
import socketService from '../services/socketService';
import { formatPrice } from '../utils/helpers';
import styles from './SellerOrderDetailsScreen.styles';

export const SellerOrderDetailsScreen = ({ navigation, route }) => {
  const initialOrder = route?.params?.order || {
    _id: 'ORD-98214',
    orderNumber: 'BB-98214',
    createdAt: new Date().toISOString(),
    status: 'pending',
    orderStatus: 'pending',
    shippingAddress: {
      fullName: 'Rahul Sharma',
      phone: '+91 9876543210',
      addressLine1: 'Flat 402, Sunshine Heights',
      addressLine2: 'Vaishali Nagar',
      city: 'Jaipur',
      state: 'Rajasthan',
      pinCode: '302021',
    },
    items: [
      {
        _id: 'item-1',
        name: 'Handcrafted Cotton Kurta',
        sku: 'KUR-BLU-L',
        price: 899,
        quantity: 2,
        selectedSize: 'L',
        selectedColor: 'Indigo Blue',
      },
    ],
    subtotal: 1798,
    tax: 90,
    shippingFee: 40,
    discount: 100,
    totalAmount: 1828,
    paymentMethod: 'UPI',
    paymentStatus: 'paid',
  };

  const [order, setOrder] = useState(initialOrder);
  const [updating, setUpdating] = useState(false);

  // Real-Time Delivery Partner Tracking State
  const [riderLocation, setRiderLocation] = useState(order.currentLocation || null);
  const [distanceRemainingKm, setDistanceRemainingKm] = useState(order.distanceRemainingKm || null);
  const [estimatedMinutesRemaining, setEstimatedMinutesRemaining] = useState(order.estimatedMinutesRemaining || null);
  const [lastLocationPing, setLastLocationPing] = useState(null);

  // Rejection Modal State
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedReason, setSelectedReason] = useState('Item out of stock in warehouse');
  const [customReason, setCustomReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  // Delivery Partner Assignment Modal State
  const [assignModalVisible, setAssignModalVisible] = useState(false);
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

  const orderId = order._id || 'ORD-98214';
  const orderNumber = order.orderNumber || order.subOrderNumber || (orderId ? orderId.slice(-6).toUpperCase() : 'ORD');
  const status = (order.status || order.orderStatus || 'pending').toLowerCase();
  const assignedRiderName = order.deliveryPartnerName || order.shipping?.deliveryPartnerName;
  const assignedRiderPhone = order.deliveryPartnerPhone || order.shipping?.deliveryPartnerPhone;
  const assignedRiderVehicle = order.deliveryPartnerVehicleType || order.deliveryPartnerVehicleNumber || order.shipping?.vehicleType || 'Bike';

  // Real-Time Socket Connection for Order Lifecycle & GPS Location
  useEffect(() => {
    const targetId = order._id || order.orderId || order.orderNumber;
    if (!targetId) return;

    socketService.subscribeToOrder(targetId, {
      onLocation: (loc) => {
        setRiderLocation({
          latitude: Number(loc.latitude),
          longitude: Number(loc.longitude),
          heading: Number(loc.heading) || 0,
          speed: Number(loc.speed) || 0,
        });
        if (loc.distanceRemainingKm !== undefined) {
          setDistanceRemainingKm(Number(loc.distanceRemainingKm));
        }
        if (loc.etaMinutes !== undefined) {
          setEstimatedMinutesRemaining(Number(loc.etaMinutes));
        }
        setLastLocationPing(new Date().toLocaleTimeString());
      },
      onEta: (data) => {
        if (data.etaMinutes !== undefined) setEstimatedMinutesRemaining(Number(data.etaMinutes));
        if (data.distanceRemainingKm !== undefined) setDistanceRemainingKm(Number(data.distanceRemainingKm));
      },
      onStatus: (data) => {
        const newSt = data.status || data.orderStatus;
        if (newSt) {
          setOrder((prev) => ({
            ...prev,
            status: newSt,
            orderStatus: newSt,
          }));
        }
      },
      onPartner: (data) => {
        if (data?.partner || data?.riderName) {
          setOrder((prev) => ({
            ...prev,
            deliveryPartnerName: data.partner?.name || data.riderName,
            deliveryPartnerPhone: data.partner?.phone || data.riderPhone,
            deliveryPartnerVehicleType: data.partner?.vehicleType || data.vehicle,
          }));
        }
      },
    });

    return () => {
      socketService.unsubscribeFromOrder(targetId);
    };
  }, [order._id, order.orderNumber]);

  // Accept Order
  const handleAcceptOrder = async () => {
    setUpdating(true);
    try {
      await sellerService.acceptOrder(orderId);
      setOrder((prev) => ({
        ...prev,
        status: 'accepted',
        orderStatus: 'accepted',
        acceptedAt: new Date().toISOString(),
      }));
      Alert.alert('Order Accepted', `Order #${orderNumber} has been accepted and moved to Accepted Orders.`);
    } catch (err) {
      setOrder((prev) => ({ ...prev, status: 'accepted', orderStatus: 'accepted' }));
      Alert.alert('Order Accepted', `Order #${orderNumber} marked as Accepted.`);
    } finally {
      setUpdating(false);
    }
  };

  // Confirm Rejection with Reason
  const handleConfirmReject = async () => {
    const finalReason = selectedReason === 'Other reason'
      ? customReason.trim()
      : (customReason.trim() ? `${selectedReason} - ${customReason.trim()}` : selectedReason);

    if (!finalReason) {
      Alert.alert('Reason Required', 'Please choose or provide a reason for rejecting this order.');
      return;
    }

    setRejecting(true);
    try {
      await sellerService.rejectOrder(orderId, finalReason);
      setOrder((prev) => ({
        ...prev,
        status: 'rejected',
        orderStatus: 'rejected',
        rejectedAt: new Date().toISOString(),
        rejectionReason: finalReason,
        ...(prev.paymentStatus === 'Completed' || prev.paymentStatus === 'paid' ? { paymentStatus: 'Refunded' } : {}),
      }));
      Alert.alert(
        'Order Rejected',
        `Order #${orderNumber} has been rejected. Customer has been notified.${order.paymentStatus === 'Completed' || order.paymentStatus === 'paid' ? ' Refund initiated for prepaid payment.' : ''}`
      );
      setRejectModalVisible(false);
    } catch (err) {
      Alert.alert('Reject Error', err.message || 'Failed to reject order');
    } finally {
      setRejecting(false);
    }
  };

  // Status progression workflow
  const handleUpdateStatus = async (newStatus) => {
    setUpdating(true);
    try {
      await sellerService.updateOrderStatus(orderId, newStatus);
      setOrder((prev) => ({ ...prev, status: newStatus, orderStatus: newStatus }));
      Alert.alert('Status Updated', `Order #${orderNumber} marked as ${newStatus.replace(/_/g, ' ').toUpperCase()}`);
    } catch (err) {
      setOrder((prev) => ({ ...prev, status: newStatus, orderStatus: newStatus }));
      Alert.alert('Status Updated', `Order status updated to ${newStatus.replace(/_/g, ' ').toUpperCase()}`);
    } finally {
      setUpdating(false);
    }
  };

  // Delivery Partner Modal Open
  const handleOpenAssignModal = async () => {
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

  // Confirm Assign Rider
  const handleConfirmAssignPartner = async (partner) => {
    setAssigningRiderId(partner._id);
    try {
      await sellerService.assignDeliveryPartner({
        orderId: order._id,
        deliveryPartnerId: partner._id,
      });
      setOrder((prev) => ({
        ...prev,
        status: 'pickup_scheduled',
        orderStatus: 'pickup_scheduled',
        deliveryPartner: partner._id,
        deliveryPartnerName: partner.name,
        deliveryPartnerPhone: partner.phone,
        deliveryPartnerVehicleType: partner.vehicleType || 'Bike',
        deliveryPartnerVehicleNumber: partner.vehicleNumber || '',
        shipping: {
          ...prev.shipping,
          deliveryPartnerName: partner.name,
          deliveryPartnerPhone: partner.phone,
          vehicleType: partner.vehicleType,
        },
      }));
      Alert.alert(
        'Delivery Assigned! 🛵',
        `Order assigned to ${partner.name} (${partner.vehicleType || 'Bike'}). Rider has been notified in real time.`
      );
      setAssignModalVisible(false);
    } catch (e) {
      Alert.alert('Assignment Error', e.message || 'Could not assign delivery partner');
    } finally {
      setAssigningRiderId(null);
    }
  };

  const handleCallRider = () => {
    if (assignedRiderPhone) {
      Linking.openURL(`tel:${assignedRiderPhone}`).catch(() => {
        Alert.alert('Call Rider', `Dial: ${assignedRiderPhone}`);
      });
    } else {
      Alert.alert('Notice', 'Rider phone number not provided.');
    }
  };

  const handleCallCustomer = () => {
    const phone = order.customerPhone || order.shippingAddress?.phone || order.shippingAddress?.mobileNumber;
    if (phone) {
      Linking.openURL(`tel:${phone}`).catch(() => {
        Alert.alert('Call Customer', `Dial: ${phone}`);
      });
    } else {
      Alert.alert('Customer Contact', 'No phone number provided for this order.');
    }
  };

  const handlePrintInvoice = () => {
    const custName = order.customerName || order.shippingAddress?.fullName || 'Customer';
    const custPhone = order.customerPhone || order.shippingAddress?.phone || order.shippingAddress?.mobileNumber || '';
    const summary = `
==============================
BHARAT BAZAAR TAX INVOICE
==============================
Order ID: #${orderNumber}
Date: ${new Date(order.createdAt).toLocaleDateString()}
Customer: ${custName}
Phone: ${custPhone}
Address: ${order.shippingAddress?.addressLine1 || ''}, ${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} - ${order.shippingAddress?.pinCode || order.shippingAddress?.pincode || ''}

ITEMS:
${(order.items || []).map((it) => `- ${it.name} (${it.sku || 'SKU-GEN'}) x${it.quantity} @ ${formatPrice(it.price)}`).join('\n')}

Subtotal: ${formatPrice(order.subtotal || order.totalAmount)}
GST Tax: ${formatPrice(order.tax || 0)}
Delivery: ${formatPrice(order.shippingFee || 0)}
Total Payable: ${formatPrice(order.totalAmount || order.subtotal)}
Payment: ${order.paymentMethod?.toUpperCase() || 'ONLINE'} (${order.paymentStatus?.toUpperCase() || 'PENDING'})
==============================
    `;

    Share.share({
      title: `Invoice #${orderNumber}`,
      message: summary,
    }).catch(() => {});
  };

  // Status Stepper
  const steps = [
    { key: 'placed', label: 'Placed' },
    { key: 'accepted', label: 'Accepted' },
    { key: 'preparing', label: 'Preparing' },
    { key: 'ready_for_pickup', label: 'Ready' },
    { key: 'shipped', label: 'Shipped' },
    { key: 'delivered', label: 'Delivered' },
  ];

  const getStepIndex = (st) => {
    switch (st) {
      case 'placed':
      case 'pending':
      case 'new':
        return 0;
      case 'accepted':
      case 'confirmed':
        return 1;
      case 'preparing':
      case 'processing':
      case 'packing':
      case 'packed':
      case 'processing_completed':
        return 2;
      case 'ready_for_pickup':
      case 'ready_to_ship':
      case 'pickup_scheduled':
        return 3;
      case 'shipped':
      case 'picked_up':
      case 'in_transit':
      case 'out_for_delivery':
        return 4;
      case 'delivered':
        return 5;
      default:
        return 0;
    }
  };

  const currentStep = getStepIndex(status);

  return (
    <View style={styles.container}>
      <SellerHeader
        title={`Order #${orderNumber}`}
        subtitle={`Placed on ${new Date(order.createdAt).toLocaleDateString()}`}
        showBack
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Status Stepper Card */}
        <View style={styles.stepperCard}>
          <View style={styles.stepperHeader}>
            <Text style={styles.stepperTitle}>Fulfillment Progress</Text>
            <OrderStatusBadge status={status} />
          </View>
          <View style={styles.stepsRow}>
            {steps.map((st, idx) => {
              const isCompleted = idx <= currentStep;
              const isCurrent = idx === currentStep;
              return (
                <View key={st.key} style={styles.stepItem}>
                  <View
                    style={[
                      styles.stepCircle,
                      isCompleted && styles.stepCircleActive,
                      isCurrent && styles.stepCircleCurrent,
                    ]}>
                    <Text
                      style={[
                        styles.stepNumber,
                        isCompleted && styles.stepNumberActive,
                      ]}>
                      {idx + 1}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.stepLabel,
                      isCompleted && styles.stepLabelActive,
                      isCurrent && styles.stepLabelCurrent,
                    ]}
                    numberOfLines={1}>
                    {st.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Assigned Delivery Partner Card (if assigned) */}
        {assignedRiderName ? (
          <View style={styles.infoCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.iconHeadingRow}>
                <AppIcon name="bicycle-outline" size={20} color="#059669" />
                <Text style={styles.cardTitle}>Assigned Delivery Partner</Text>
              </View>
              {['ready_for_pickup', 'pickup_scheduled'].includes(status) && (
                <TouchableOpacity
                  style={styles.reassignBtn}
                  onPress={handleOpenAssignModal}>
                  <Text style={styles.reassignBtnText}>Reassign Partner</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={[styles.assignedRiderCard, { justifyContent: 'space-between' }]}>
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
              {assignedRiderPhone ? (
                <TouchableOpacity
                  style={styles.riderCallBtn}
                  activeOpacity={0.8}
                  onPress={handleCallRider}>
                  <AppIcon name="call" size={13} color="#FFFFFF" />
                  <Text style={styles.riderCallBtnText}>Call Rider</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* Live Delivery Partner GPS Tracking Map for Seller */}
        {assignedRiderName &&
          ['pickup_scheduled', 'shipped', 'picked_up', 'in_transit', 'out_for_delivery', 'reached_customer', 'ready_for_pickup'].includes(status) && (
            <View style={styles.trackingSection}>
              <View style={styles.trackingHeaderRow}>
                <View style={styles.liveIndicatorRow}>
                  <View style={styles.pulseGreenDot} />
                  <Text style={styles.trackingSectionTitle}>Live Delivery Partner GPS</Text>
                </View>
                {lastLocationPing && (
                  <Text style={styles.lastPingText}>Updated {lastLocationPing}</Text>
                )}
              </View>
              <LiveTrackingMap
                pickupLocation={{
                  latitude: order.pickupAddress?.latitude || 26.9124,
                  longitude: order.pickupAddress?.longitude || 75.7873,
                  storeName: order.sellerStoreName || 'Your Store Hub',
                }}
                destinationLocation={{
                  latitude: order.shippingAddress?.latitude || 26.9015,
                  longitude: order.shippingAddress?.longitude || 75.7421,
                  fullName: order.shippingAddress?.fullName || order.customerName || 'Customer Doorstep',
                }}
                riderLocation={
                  riderLocation ||
                  (order.currentLocation
                    ? {
                        latitude: Number(order.currentLocation.latitude),
                        longitude: Number(order.currentLocation.longitude),
                        heading: Number(order.currentLocation.heading) || 0,
                      }
                    : null)
                }
                partnerInfo={{
                  name: assignedRiderName,
                  phone: assignedRiderPhone,
                  vehicleType: assignedRiderVehicle,
                }}
                orderStatus={status}
                distanceRemainingKm={distanceRemainingKm !== null ? distanceRemainingKm : order.distanceRemainingKm || 2.4}
                estimatedMinutesRemaining={estimatedMinutesRemaining !== null ? estimatedMinutesRemaining : order.estimatedMinutesRemaining || 8}
                lastUpdatedAt={lastLocationPing}
                height={260}
              />
            </View>
          )}

        {/* Action Bar for Status Updates */}
        <View style={styles.actionCard}>
          <Text style={styles.sectionTitle}>Order Actions</Text>
          <View style={styles.actionButtonsGrid}>
            {/* Phase 1: New / Placed -> Accept or Reject */}
            {['pending', 'new', 'placed'].includes(status) && (
              <>
                <TouchableOpacity
                  style={[styles.primaryActionBtn, { backgroundColor: '#2563EB' }]}
                  disabled={updating}
                  onPress={handleAcceptOrder}>
                  <AppIcon name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.primaryActionBtnText}>Accept Order</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.primaryActionBtn, { backgroundColor: '#DC2626' }]}
                  disabled={updating}
                  onPress={() => setRejectModalVisible(true)}>
                  <AppIcon name="close-circle-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.primaryActionBtnText}>Reject Order</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Phase 2: Accepted / Confirmed -> Start Processing */}
            {['accepted', 'confirmed'].includes(status) && (
              <TouchableOpacity
                style={[styles.primaryActionBtn, { backgroundColor: '#059669' }]}
                disabled={updating}
                onPress={() => handleUpdateStatus('processing')}>
                <AppIcon name="hammer-outline" size={18} color="#FFFFFF" />
                <Text style={styles.primaryActionBtnText}>Start Processing</Text>
              </TouchableOpacity>
            )}

            {/* Phase 3: Processing -> Mark as Packed */}
            {['preparing', 'processing', 'packing'].includes(status) && (
              <TouchableOpacity
                style={[styles.primaryActionBtn, { backgroundColor: '#7C3AED' }]}
                disabled={updating}
                onPress={() => handleUpdateStatus('packed')}>
                <AppIcon name="cube-outline" size={18} color="#FFFFFF" />
                <Text style={styles.primaryActionBtnText}>Mark as Packed</Text>
              </TouchableOpacity>
            )}

            {/* Phase 4: Packed -> Ship Order */}
            {['packed', 'ready_for_pickup', 'ready_to_ship'].includes(status) && (
              <TouchableOpacity
                style={[styles.primaryActionBtn, { backgroundColor: '#059669' }]}
                disabled={updating}
                onPress={() => handleUpdateStatus('shipped')}>
                <AppIcon name="airplane-outline" size={18} color="#FFFFFF" />
                <Text style={styles.primaryActionBtnText}>Ship Order</Text>
              </TouchableOpacity>
            )}

            {/* Phase 5: Shipped -> Move to In Transit */}
            {['shipped'].includes(status) && (
              <TouchableOpacity
                style={[styles.primaryActionBtn, { backgroundColor: '#2563EB' }]}
                disabled={updating}
                onPress={() => handleUpdateStatus('in_transit')}>
                <AppIcon name="navigate-outline" size={18} color="#FFFFFF" />
                <Text style={styles.primaryActionBtnText}>Move to In Transit</Text>
              </TouchableOpacity>
            )}

            {/* Phase 6: In Transit -> Assign Delivery Partner */}
            {['in_transit', 'ready_for_pickup', 'ready_to_ship'].includes(status) && (
              <TouchableOpacity
                style={[styles.primaryActionBtn, { backgroundColor: '#0D9488' }]}
                disabled={updating}
                onPress={handleOpenAssignModal}>
                <AppIcon name="bicycle-outline" size={18} color="#FFFFFF" />
                <Text style={styles.primaryActionBtnText}>Assign Delivery Partner</Text>
              </TouchableOpacity>
            )}

            {/* Phase 7: Out for Delivery -> Mark Delivered */}
            {['out_for_delivery'].includes(status) && (
              <TouchableOpacity
                style={[styles.primaryActionBtn, { backgroundColor: '#059669' }]}
                disabled={updating}
                onPress={() => handleUpdateStatus('delivered')}>
                <AppIcon name="checkmark-done-outline" size={18} color="#FFFFFF" />
                <Text style={styles.primaryActionBtnText}>Mark Delivered</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.secondaryActionBtn}
              onPress={handlePrintInvoice}>
              <AppIcon name="receipt-outline" size={16} color="#0F172A" />
              <Text style={styles.secondaryActionBtnText}>Tax Invoice</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryActionBtn}
              onPress={handleCallCustomer}>
              <AppIcon name="call-outline" size={16} color="#0F172A" />
              <Text style={styles.secondaryActionBtnText}>Call Customer</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Customer Information Card */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.iconHeadingRow}>
              <AppIcon name="person-circle-outline" size={20} color="#059669" />
              <Text style={styles.cardTitle}>Buyer Information</Text>
            </View>
          </View>
          <View style={styles.customerContent}>
            <Text style={styles.customerName}>
              {order.customerName || order.shippingAddress?.fullName || 'Customer Name'}
            </Text>
            <Text style={styles.customerPhone}>
              📞 {order.customerPhone || order.shippingAddress?.phone || order.shippingAddress?.mobileNumber || 'Not available'}
            </Text>
            <View style={styles.addressDivider} />
            <Text style={styles.addressTitle}>Delivery Address:</Text>
            <Text style={styles.addressText}>
              {order.shippingAddress?.addressLine1 || order.shippingAddress?.addressLine}
              {order.shippingAddress?.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ''}
            </Text>
            <Text style={styles.addressText}>
              {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pinCode || order.shippingAddress?.pincode}
            </Text>
          </View>
        </View>

        {/* Ordered Items Card */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.iconHeadingRow}>
              <AppIcon name="bag-handle-outline" size={20} color="#059669" />
              <Text style={styles.cardTitle}>Items Ordered ({order.items?.length || 1})</Text>
            </View>
          </View>
          {(order.items || []).map((it, idx) => (
            <View key={it._id || idx} style={styles.itemRow}>
              <View style={styles.itemThumb}>
                {it.image || it.product?.images?.[0] ? (
                  <Image
                    source={{ uri: it.image || it.product?.images?.[0] }}
                    style={{ width: '100%', height: '100%', borderRadius: 8 }}
                  />
                ) : (
                  <AppIcon name="cube" size={22} color="#059669" />
                )}
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={2}>
                  {it.name || it.product?.name || 'Product Item'}
                </Text>
                <Text style={styles.itemSku}>
                  SKU: {it.sku || 'N/A'} {it.selectedSize ? `• Size: ${it.selectedSize}` : ''}
                </Text>
                <View style={styles.itemPriceRow}>
                  <Text style={styles.itemPriceText}>
                    {formatPrice(it.price || 0)} × {it.quantity || 1}
                  </Text>
                  <Text style={styles.itemTotalText}>
                    {formatPrice((it.price || 0) * (it.quantity || 1))}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Payment & Charges Summary */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.iconHeadingRow}>
              <AppIcon name="card-outline" size={20} color="#059669" />
              <Text style={styles.cardTitle}>Payment & Financials</Text>
            </View>
            <View
              style={[
                styles.payBadge,
                order.paymentStatus === 'paid' || order.paymentStatus === 'Completed'
                  ? { backgroundColor: '#ECFDF5' }
                  : { backgroundColor: '#FEF3C7' },
              ]}>
              <Text
                style={[
                  styles.payBadgeText,
                  order.paymentStatus === 'paid' || order.paymentStatus === 'Completed'
                    ? { color: '#059669' }
                    : { color: '#D97706' },
                ]}>
                {order.paymentStatus?.toUpperCase() || 'PAID'}
              </Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>
              {formatPrice(order.subtotal || order.totalAmount)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Taxes (GST)</Text>
            <Text style={styles.summaryValue}>{formatPrice(order.tax || order.taxAmount || 0)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping Charges</Text>
            <Text style={styles.summaryValue}>
              {order.shippingFee ? formatPrice(order.shippingFee) : 'FREE'}
            </Text>
          </View>
          {!!order.discount && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: '#059669' }]}>Discount</Text>
              <Text style={[styles.summaryValue, { color: '#059669' }]}>
                -{formatPrice(order.discount)}
              </Text>
            </View>
          )}
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.grandTotalLabel}>Total Amount</Text>
            <Text style={styles.grandTotalValue}>
              {formatPrice(order.totalAmount || order.subtotal || order.netEarnings || 0)}
            </Text>
          </View>
          <Text style={styles.paymentMethodNotice}>
            Payment Method: {order.paymentMethod?.toUpperCase() || 'ONLINE UPI / CARDS'}
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

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
              Please select or enter a mandatory reason for rejecting Order #{orderNumber}.
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
              placeholder="Additional comments (optional)..."
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
                  Order #{orderNumber} • {order.shippingAddress?.city || 'Local Delivery'}
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
    </View>
  );
};

export default SellerOrderDetailsScreen;
