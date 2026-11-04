import React, { useEffect, useCallback } from 'react';
import { View, Text, BackHandler } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from './OrderSuccessScreen.styles';
import CustomButton from '../components/CustomButton';
import AppIcon from '../components/AppIcon';
import { formatPrice } from '../utils/helpers';

export const OrderSuccessScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { order } = route.params || {};
  const addr = order?.deliveryAddress || order?.shippingAddress;

  const handleContinueShopping = useCallback(() => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainApp' }],
    });
  }, [navigation]);

  const handleTrackOrder = useCallback(() => {
    const targetId = order?.orderId || order?.orderNumber || order?._id || 'BBIN-782194';
    navigation.navigate('TrackOrder', {
      orderId: targetId,
      order: order || { orderId: targetId, orderNumber: targetId },
    });
  }, [navigation, order]);

  // Intercept Android hardware back button so it safely navigates to shopping instead of payment
  useEffect(() => {
    const backAction = () => {
      handleContinueShopping();
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [handleContinueShopping]);

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 24),
          paddingBottom: Math.max(insets.bottom, 24),
        },
      ]}>
      <View style={styles.iconCircle}>
        <AppIcon name="checkmark" size={48} color="#2E7D32" />
      </View>

      <Text style={styles.title}>Order Confirmed!</Text>
      <Text style={styles.subtitle}>
        Thank you for shopping with Bharat Bazaar.{'\n'}
        Your package is being prepared for Pan India dispatch.
      </Text>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Order Number</Text>
          <Text style={styles.value}>{order?.orderId || order?.orderNumber || 'BBIN-782194'}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Payment Method</Text>
          <Text style={styles.value}>{order?.paymentMethod || 'UPI'}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Estimated Delivery</Text>
          <Text style={[styles.value, { color: '#2E7D32' }]}>
            {order?.expectedDelivery || 'Within 3-4 Days'}
          </Text>
        </View>

        <View style={styles.divider} />

        {/* Selected Delivery Address Review */}
        <View style={{ marginBottom: 4 }}>
          <Text style={[styles.label, { marginBottom: 6, fontWeight: '700' }]}>
            📍 Delivering To
          </Text>
          <Text style={[styles.value, { textAlign: 'left', fontWeight: '800', fontSize: 14 }]}>
            {addr?.fullName || 'Customer'} {addr?.addressType ? `(${addr.addressType})` : ''}
          </Text>
          <Text style={{ fontSize: 13, color: '#616161', lineHeight: 18, marginTop: 3 }}>
            {addr?.streetAddress || addr?.addressLine1}
          </Text>
          {addr?.landmark ? (
            <Text style={{ fontSize: 12, color: '#757575', marginTop: 1 }}>
              Landmark: {addr.landmark}
            </Text>
          ) : null}
          <Text style={{ fontSize: 13, color: '#616161', marginTop: 2 }}>
            {addr?.city}, {addr?.state} - {addr?.pincode || addr?.pinCode}
          </Text>
          <Text style={{ fontSize: 12, color: '#424242', fontWeight: '600', marginTop: 3 }}>
            Contact: +91 {addr?.mobileNumber || addr?.phone}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={[styles.label, { fontWeight: '700' }]}>Total Amount</Text>
          <Text style={[styles.value, { fontSize: 16, color: '#E64A19' }]}>
            {formatPrice(order?.summary?.totalAmount || order?.totalAmount || order?.pricing?.grandTotal)}
          </Text>
        </View>
      </View>

      <View style={styles.btnRow}>
        <CustomButton
          title="Track Order Live"
          size="large"
          onPress={handleTrackOrder}
          style={styles.trackBtn}
        />
        <CustomButton
          title="Continue Shopping"
          variant="outline"
          size="large"
          onPress={handleContinueShopping}
          style={styles.homeBtn}
        />
      </View>
    </View>
  );
};

export default OrderSuccessScreen;
