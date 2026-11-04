import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Image, Alert, Linking, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from './OrderDetailsScreen.styles';
import Header from '../components/Header';
import CustomButton from '../components/CustomButton';
import AppIcon from '../components/AppIcon';
import Loading from '../components/Loading';
import { formatPrice, formatDate } from '../utils/helpers';
import { orderService } from '../services/orderService';
import socketService from '../services/socketService';
import { useAuth } from '../context/AuthContext';

export const OrderDetailsScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const { orderId } = route.params || {};
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadOrder = useCallback(async () => {
    setLoading(true);
    try {
      const data = await orderService.getOrderById(orderId);
      setOrder(data);
    } catch (e) {
      Alert.alert('Error', 'Order not found');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [orderId, navigation]);

  useEffect(() => {
    if (isAuthenticated) {
      loadOrder();
    } else {
      setLoading(false);
    }
  }, [loadOrder, isAuthenticated]);

  // Real-time synchronization for order updates
  useEffect(() => {
    if (!orderId) return;

    let socketUnsub = null;
    const connectSocketListener = async () => {
      try {
        await socketService.connect();
        const socket = socketService.getSocket();
        if (socket) {
          const handleUpdate = (data) => {
            if (
              data?.orderId === orderId ||
              data?.orderNumber === orderId ||
              data?._id === orderId
            ) {
              loadOrder();
            }
          };
          socket.on('order:status_updated', handleUpdate);
          socket.on('delivery:status_update', handleUpdate);

          socketUnsub = () => {
            socket.off('order:status_updated', handleUpdate);
            socket.off('delivery:status_update', handleUpdate);
          };
        }
      } catch (e) {}
    };

    connectSocketListener();

    return () => {
      if (socketUnsub) socketUnsub();
    };
  }, [orderId, loadOrder]);

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <Header title="Order Summary" showBack navigation={navigation} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <AppIcon name="shield-outline" size={64} color="#BDBDBD" />
          <Text style={{ fontSize: 18, fontWeight: '800', marginTop: 16, marginBottom: 8, color: '#212121' }}>
            Sign In to View Order
          </Text>
          <Text style={{ fontSize: 14, color: '#757575', textAlign: 'center', marginBottom: 20, lineHeight: 20 }}>
            Log in to view itemized receipts, download tax invoices, or track live shipments.
          </Text>
          <CustomButton
            title="Sign In / Register"
            size="large"
            onPress={() => navigation.navigate('Login', { redirectTo: 'OrderDetails', redirectParams: { orderId } })}
            style={{ width: 200 }}
          />
        </View>
      </View>
    );
  }

  const handleCancel = () => {
    Alert.alert('Cancel Order', 'Are you sure you want to cancel this order?', [
      { text: 'Keep Order', style: 'cancel' },
      {
        text: 'Yes, Cancel Order',
        style: 'destructive',
        onPress: async () => {
          await orderService.cancelOrder(order.orderId);
          loadOrder();
        },
      },
    ]);
  };

  const handleDownloadInvoice = async () => {
    try {
      const url = orderService.getInvoiceHtmlUrl(order?.orderId);
      Linking.openURL(url).catch(() => {
        Alert.alert('Tax Invoice', 'Unable to open invoice URL. Please check network connection.');
      });
    } catch (e) {
      Alert.alert('Notice', 'Unable to generate invoice at this moment.');
    }
  };

  const handleReorder = () => {
    Alert.alert(
      'Reorder Items',
      `Add all items from Order #${order?.orderId} back to your shopping cart?`,
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

  const handleCallSupport = () => {
    Linking.openURL('tel:18001234567').catch(() => {
      Alert.alert('Support Helpline', 'Toll-free customer care: 1800-123-4567');
    });
  };

  if (loading || !order) {
    return (
      <View style={styles.container}>
        <Header title="Order Details" showBack navigation={navigation} />
        <Loading fullScreen message="Loading order details..." />
      </View>
    );
  }

  const statusLower = (order.status || order.orderStatus || '').toLowerCase();
  const isCancellable = ['confirmed', 'placed', 'new', 'pending'].includes(statusLower);
  const isDelivered = statusLower === 'delivered';
  const isCancelled = ['cancelled', 'rejected'].includes(statusLower);

  const address = order.deliveryAddress || order.shippingAddress || {};
  const streetText = address.addressLine1
    ? `${address.addressLine1} ${address.addressLine2 || ''}`.trim()
    : address.streetAddress || 'Address not specified';
  const cityStatePin = `${address.city || ''}, ${address.state || ''} - ${address.pinCode || address.pincode || ''}`;
  const phoneText = address.mobileNumber || address.phone || '';

  return (
    <View style={styles.container}>
      <Header title="Order Summary" showBack navigation={navigation} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}>
        {/* Order Header */}
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.orderIdText}>Order #{order.orderId}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{order.status || order.orderStatus}</Text>
            </View>
          </View>
          <Text style={styles.dateText}>Order Placed: {formatDate(order.createdAt)}</Text>
          {isDelivered && order.deliveredAt && (
            <Text style={[styles.dateText, { color: '#059669', fontWeight: '700', marginTop: 2 }]}>
              Delivered on: {formatDate(order.deliveredAt)}
            </Text>
          )}
          {order.expectedDelivery ? (
            <Text style={[styles.dateText, styles.expectedDeliveryText]}>
              Estimated Delivery: {order.expectedDelivery}
            </Text>
          ) : null}
        </View>

        {/* Delivery OTP Security Card */}
        {!isDelivered && !isCancelled && order.deliveryOtp && (
          <View style={styles.otpCard}>
            <View style={styles.otpHeader}>
              <Text style={styles.otpIcon}>🔐</Text>
              <Text style={styles.otpTitle}>Delivery Handover PIN / OTP</Text>
            </View>
            <Text style={styles.otpNotice}>
              Share this 4-digit verification code with your delivery partner only upon physically receiving your parcel.
            </Text>
            <View style={styles.otpBox}>
              <Text style={styles.otpValue}>{order.deliveryOtp}</Text>
            </View>
          </View>
        )}

        {/* Delivered Confirmation Banner */}
        {isDelivered && (
          <View style={styles.deliveredCard}>
            <Text style={styles.deliveredText}>
              ✅ Order successfully delivered and verified with OTP.
            </Text>
          </View>
        )}

        {/* Refund Status Card */}
        {(isCancelled || order.refundStatus) && (
          <View style={styles.refundCard}>
            <Text style={styles.refundTitle}>🔄 Refund Information</Text>
            <View style={styles.refundRow}>
              <Text style={styles.refundLabel}>Refund Status:</Text>
              <Text style={styles.refundVal}>
                {order.refund?.status ||
                  order.refundStatus ||
                  ((order.paymentMethod || '').toUpperCase().includes('COD')
                    ? 'Not Applicable (COD)'
                    : 'Processed')}
              </Text>
            </View>
            {(order.refund?.amount > 0 || order.refundAmount > 0) && (
              <View style={styles.refundRow}>
                <Text style={styles.refundLabel}>Refund Amount:</Text>
                <Text style={styles.refundVal}>
                  {formatPrice(order.refund?.amount || order.refundAmount || order.summary?.totalAmount)}
                </Text>
              </View>
            )}
            {order.cancellationReason ? (
              <View style={styles.refundRow}>
                <Text style={styles.refundLabel}>Reason:</Text>
                <Text style={styles.refundVal}>{order.cancellationReason}</Text>
              </View>
            ) : null}
          </View>
        )}

        {/* Ordered Items */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Ordered Products ({(order.items || []).length})</Text>
          {(order.items || []).map((prod, idx) => (
            <View key={idx} style={styles.itemRow}>
              <Image
                source={{
                  uri:
                    prod.image ||
                    'https://images.unsplash.com/photo-1544816155-12df9643f363?w=300&q=80',
                }}
                style={styles.itemImage}
              />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={2}>
                  {prod.name}
                </Text>
                {prod.selectedVariant?.size && (
                  <Text style={styles.itemMeta}>Size: {prod.selectedVariant.size}</Text>
                )}
                <Text style={styles.itemMeta}>Qty: {prod.quantity}</Text>
                <Text style={styles.itemPrice}>{formatPrice(prod.price * prod.quantity)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Delivery Address */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>📍 Delivery Destination</Text>
          <Text style={styles.addressName}>
            {address.fullName || 'Valued Customer'} ({address.addressType || 'Home'})
          </Text>
          <Text style={styles.addressText}>{streetText}</Text>
          <Text style={styles.addressText}>{cityStatePin}</Text>
          {phoneText ? (
            <Text style={styles.addressText}>Mobile: +91 {phoneText}</Text>
          ) : null}
        </View>

        {/* Price Breakdown */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Price & Payment Details</Text>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Payment Mode</Text>
            <Text style={styles.billValue}>{order.paymentMethod || 'UPI'}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Payment Status</Text>
            <Text style={[styles.billValue, styles.paidStatusText]}>
              {order.paymentStatus || 'Pending'}
            </Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Items Subtotal</Text>
            <Text style={styles.billValue}>{formatPrice(order.summary?.subtotal)}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Coupon Discount</Text>
            <Text style={[styles.billValue, styles.discountText]}>
              -{formatPrice(order.summary?.discount || 0)}
            </Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Fee</Text>
            <Text style={styles.billValue}>
              {order.summary?.deliveryFee === 0 ? 'FREE' : formatPrice(order.summary?.deliveryFee)}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.billRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>{formatPrice(order.summary?.totalAmount)}</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.btnRow}>
          {!isDelivered && !isCancelled && (
            <CustomButton
              title="Track Order Status"
              onPress={() =>
                navigation.navigate('TrackOrder', {
                  orderId: order.orderId || order.orderNumber || order._id,
                  order,
                })
              }
            />
          )}

          <CustomButton
            title="Download GST Invoice"
            variant="outline"
            iconLeft="document-text-outline"
            onPress={handleDownloadInvoice}
          />

          {isDelivered && (
            <CustomButton
              title="Reorder Items"
              variant="outline"
              iconLeft="repeat-outline"
              onPress={handleReorder}
            />
          )}

          {isCancellable && (
            <CustomButton
              title="Cancel Order"
              variant="danger"
              onPress={handleCancel}
            />
          )}

          <CustomButton
            title="Contact 24x7 Support"
            variant="ghost"
            iconLeft="call-outline"
            onPress={handleCallSupport}
          />
        </View>
      </ScrollView>
    </View>
  );
};

export default OrderDetailsScreen;
