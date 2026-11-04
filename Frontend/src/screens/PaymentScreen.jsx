import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from './PaymentScreen.styles';
import Header from '../components/Header';
import CustomButton from '../components/CustomButton';
import AppIcon from '../components/AppIcon';
import { Colors } from '../constants/colors';
import { formatPrice } from '../utils/helpers';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../services/orderService';

export const PaymentScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { selectedAddress, shippingMode, finalAmount, expectedDelivery } = route.params || {};
  const { cartItems, cartSummary, clearCart } = useCart();
  const { isAuthenticated } = useAuth();

  const [paymentMethod, setPaymentMethod] = useState('UPI'); // UPI, CARD, NETBANKING, COD
  const [selectedUpiApp, setSelectedUpiApp] = useState('Google Pay');
  const [customVpa, setCustomVpa] = useState('');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [loading, setLoading] = useState(false);
  const isSubmittingRef = useRef(false);

  // Safety validation: require authenticated customer
  useEffect(() => {
    if (!isAuthenticated) {
      Alert.alert(
        'Sign In Required for Payment',
        'Please login or create an account to complete your payment and order. Your cart items are saved!',
        [
          { text: 'Go to Cart', style: 'cancel', onPress: () => navigation.navigate('CartTab') },
          { text: 'Sign In', onPress: () => navigation.navigate('Login', { redirectTo: 'Checkout' }) },
        ]
      );
    }
  }, [isAuthenticated]);

  // Safety validation: never proceed without a valid selected address
  useEffect(() => {
    if (!selectedAddress) {
      Alert.alert(
        'Address Missing',
        'Delivery address is required to proceed with payment. Returning to address selection.',
        [{ text: 'OK', onPress: () => navigation.navigate('Checkout') }]
      );
    }
  }, [selectedAddress, navigation]);

  if (!selectedAddress) {
    return (
      <View style={styles.container}>
        <Header title="Choose Payment Method" showBack navigation={navigation} showCart={false} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Text style={{ fontSize: 16, color: Colors.textMuted, textAlign: 'center' }}>
            Redirecting to delivery address selection...
          </Text>
        </View>
      </View>
    );
  }

  const getPaymentMethodLabel = () => {
    switch (paymentMethod) {
      case 'UPI':
        return customVpa.trim() ? `UPI (${customVpa.trim()})` : `UPI (${selectedUpiApp})`;
      case 'CARD':
        return 'Debit / Credit Card';
      case 'NETBANKING':
        return `Net Banking (${selectedBank})`;
      case 'COD':
        return 'Cash on Delivery';
      default:
        return 'Cash on Delivery';
    }
  };

  const handlePlaceOrder = async () => {
    if (isSubmittingRef.current || loading) return;

    if (!isAuthenticated) {
      Alert.alert(
        'Sign In Required',
        'Please login or create an account to complete your payment.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => navigation.navigate('Login', { redirectTo: 'Checkout' }) },
        ]
      );
      return;
    }

    if (!selectedAddress) {
      Alert.alert('Delivery Address Required', 'Please select a delivery address first.');
      navigation.navigate('Checkout');
      return;
    }

    isSubmittingRef.current = true;
    setLoading(true);
    try {
      const paymentLabel = getPaymentMethodLabel();

      const orderPayload = {
        items: cartItems,
        deliveryAddress: selectedAddress,
        shippingAddress: selectedAddress,
        shippingAddressId: selectedAddress.id || selectedAddress._id,
        paymentMethod: paymentMethod === 'COD' ? 'COD' : 'ONLINE',
        paymentMethodDetail: paymentLabel,
        summary: {
          subtotal: cartSummary.subtotal,
          discount: cartSummary.couponDiscount,
          deliveryFee: cartSummary.deliveryFee,
          totalAmount: finalAmount,
        },
        shippingMode,
        expectedDelivery,
      };

      const placedOrder = await orderService.createOrder(orderPayload);
      clearCart();

      navigation.replace('OrderSuccess', {
        order: {
          ...placedOrder,
          deliveryAddress: selectedAddress,
          paymentMethod: paymentLabel,
          summary: {
            ...placedOrder.summary,
            totalAmount: finalAmount,
          },
          expectedDelivery,
        },
      });
    } catch (e) {
      Alert.alert('Payment Failed', e.message || 'Could not process order. Please try again.');
    } finally {
      isSubmittingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Choose Payment Method" showBack navigation={navigation} showCart={false} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 110 },
        ]}
        showsVerticalScrollIndicator={false}>
        {/* Step Indicator Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
            backgroundColor: '#FFF',
            paddingVertical: 10,
            paddingHorizontal: 16,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: Colors.borderLight,
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: '#2E7D32',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <AppIcon name="checkmark" size={14} color="#FFF" />
            </View>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#2E7D32' }}>
              Address Confirmed
            </Text>
          </View>

          <View style={{ height: 1, width: 30, backgroundColor: Colors.borderLight }} />

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: Colors.primary,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '800' }}>2</Text>
            </View>
            <Text style={{ fontSize: 12, fontWeight: '800', color: Colors.primary }}>
              Payment & Summary
            </Text>
          </View>
        </View>

        {/* Total Payable Banner */}
        <View style={styles.amountBanner}>
          <View>
            <Text style={styles.amountLabel}>Total Amount to Pay</Text>
            <Text style={{ fontSize: 11, color: Colors.textMuted, marginTop: 2 }}>
              Inclusive of GST & Pan India Shipping
            </Text>
          </View>
          <Text style={styles.amountValue}>{formatPrice(finalAmount)}</Text>
        </View>

        <Text style={styles.sectionTitle}>Select Payment Option</Text>

        {/* 1. Cash on Delivery (COD) */}
        <View style={[styles.optionCard, paymentMethod === 'COD' && styles.optionCardSelected]}>
          <TouchableOpacity
            style={styles.optionHeader}
            onPress={() => setPaymentMethod('COD')}
            activeOpacity={0.8}>
            <View style={[styles.radioCircle, paymentMethod === 'COD' && styles.radioCircleSelected]}>
              {paymentMethod === 'COD' && <View style={styles.radioDot} />}
            </View>
            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>Cash on Delivery (COD)</Text>
              <Text style={styles.optionSubtitle}>Pay in cash or UPI at your doorstep</Text>
            </View>
            <AppIcon name="cash-outline" size={24} color="#E65100" />
          </TouchableOpacity>
        </View>

        {/* 2. UPI */}
        <View style={[styles.optionCard, paymentMethod === 'UPI' && styles.optionCardSelected]}>
          <TouchableOpacity
            style={styles.optionHeader}
            onPress={() => setPaymentMethod('UPI')}
            activeOpacity={0.8}>
            <View style={[styles.radioCircle, paymentMethod === 'UPI' && styles.radioCircleSelected]}>
              {paymentMethod === 'UPI' && <View style={styles.radioDot} />}
            </View>
            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>UPI (Instant & Zero Convenience Fee)</Text>
              <Text style={styles.optionSubtitle}>Google Pay, PhonePe, Paytm, BHIM UPI</Text>
            </View>
            <AppIcon name="phone-portrait-outline" size={24} color={Colors.primary} />
          </TouchableOpacity>

          {paymentMethod === 'UPI' && (
            <View style={styles.subOptionsContainer}>
              <View style={styles.upiChipsRow}>
                {['Google Pay', 'PhonePe', 'Paytm', 'BHIM'].map((app) => (
                  <TouchableOpacity
                    key={app}
                    style={[styles.upiChip, selectedUpiApp === app && styles.upiChipSelected]}
                    onPress={() => setSelectedUpiApp(app)}>
                    <Text
                      style={[
                        styles.upiChipText,
                        selectedUpiApp === app && styles.upiChipTextSelected,
                      ]}>
                      {app}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={styles.upiInput}
                placeholder="Or enter UPI ID (e.g. mobile@upi)"
                placeholderTextColor={Colors.textMuted}
                value={customVpa}
                onChangeText={setCustomVpa}
              />
            </View>
          )}
        </View>

        {/* 3. Credit & Debit Cards */}
        <View style={[styles.optionCard, paymentMethod === 'CARD' && styles.optionCardSelected]}>
          <TouchableOpacity
            style={styles.optionHeader}
            onPress={() => setPaymentMethod('CARD')}
            activeOpacity={0.8}>
            <View style={[styles.radioCircle, paymentMethod === 'CARD' && styles.radioCircleSelected]}>
              {paymentMethod === 'CARD' && <View style={styles.radioDot} />}
            </View>
            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>Credit / Debit Card</Text>
              <Text style={styles.optionSubtitle}>Visa, MasterCard, RuPay, Maestro</Text>
            </View>
            <AppIcon name="card-outline" size={24} color="#1565C0" />
          </TouchableOpacity>

          {paymentMethod === 'CARD' && (
            <View style={styles.subOptionsContainer}>
              <View style={styles.cardInputs}>
                <TextInput
                  style={styles.cardInput}
                  placeholder="Card Number (16 Digits)"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={19}
                />
                <View style={styles.cardRow}>
                  <TextInput
                    style={[styles.cardInput, { flex: 1 }]}
                    placeholder="MM/YY"
                    placeholderTextColor={Colors.textMuted}
                    maxLength={5}
                  />
                  <TextInput
                    style={[styles.cardInput, { flex: 1 }]}
                    placeholder="CVV"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="number-pad"
                    maxLength={4}
                    secureTextEntry
                  />
                </View>
              </View>
            </View>
          )}
        </View>

        {/* 4. Net Banking */}
        <View
          style={[styles.optionCard, paymentMethod === 'NETBANKING' && styles.optionCardSelected]}>
          <TouchableOpacity
            style={styles.optionHeader}
            onPress={() => setPaymentMethod('NETBANKING')}
            activeOpacity={0.8}>
            <View
              style={[
                styles.radioCircle,
                paymentMethod === 'NETBANKING' && styles.radioCircleSelected,
              ]}>
              {paymentMethod === 'NETBANKING' && <View style={styles.radioDot} />}
            </View>
            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>Net Banking</Text>
              <Text style={styles.optionSubtitle}>All Major Indian Banks Supported</Text>
            </View>
            <AppIcon name="business-outline" size={24} color="#2E7D32" />
          </TouchableOpacity>

          {paymentMethod === 'NETBANKING' && (
            <View style={styles.subOptionsContainer}>
              <View style={styles.bankChipsGrid}>
                {['HDFC Bank', 'State Bank of India', 'ICICI Bank', 'Axis Bank', 'Kotak'].map(
                  (bank) => (
                    <TouchableOpacity
                      key={bank}
                      style={[styles.bankChip, selectedBank === bank && styles.bankChipSelected]}
                      onPress={() => setSelectedBank(bank)}>
                      <Text style={styles.bankChipText}>{bank}</Text>
                    </TouchableOpacity>
                  )
                )}
              </View>
            </View>
          )}
        </View>

        {/* FINAL ORDER SUMMARY (Requirement: Show after payment selection) */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>📋 Final Order Summary</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Checkout')}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.primary }}>
                Review Items
              </Text>
            </TouchableOpacity>
          </View>

          {/* Delivery Address Review */}
          {selectedAddress && (
            <View style={{ marginBottom: 10 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase' }}>
                Delivering To:
              </Text>
              <Text style={styles.summaryAddressName}>
                {selectedAddress.fullName} ({selectedAddress.addressType || 'Home'})
              </Text>
              <Text style={styles.summaryAddressDetails}>
                {selectedAddress.streetAddress || selectedAddress.addressLine1}
              </Text>
              {selectedAddress.landmark ? (
                <Text style={styles.summaryAddressDetails}>
                  Landmark: {selectedAddress.landmark}
                </Text>
              ) : null}
              <Text style={styles.summaryAddressDetails}>
                {selectedAddress.city}, {selectedAddress.state} -{' '}
                {selectedAddress.pincode || selectedAddress.pinCode}
              </Text>
              <Text style={[styles.summaryAddressDetails, { fontWeight: '600', color: Colors.textPrimary, marginTop: 2 }]}>
                Contact: +91 {selectedAddress.mobileNumber || selectedAddress.phone}
              </Text>
            </View>
          )}

          <View style={styles.summaryDivider} />

          {/* Payment Method Selected */}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Payment Method</Text>
            <Text style={[styles.summaryValue, { color: Colors.primary }]}>
              {getPaymentMethodLabel()}
            </Text>
          </View>

          {/* Delivery Timing */}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Estimated Arrival</Text>
            <Text style={[styles.summaryValue, { color: '#2E7D32' }]}>
              {expectedDelivery || 'Within 3-4 Days'}
            </Text>
          </View>

          {/* Items count */}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Order Total ({cartItems.length} items)</Text>
            <Text style={[styles.summaryValue, { fontSize: 14, color: Colors.primaryDark }]}>
              {formatPrice(finalAmount)}
            </Text>
          </View>
        </View>

        <View style={styles.securityBadge}>
          <AppIcon name="shield-checkmark" size={16} color={Colors.textMuted} />
          <Text style={styles.securityText}>
            100% Secure 256-Bit SSL Encrypted Indian Payment Gateway
          </Text>
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View
        style={[
          styles.bottomBar,
          { paddingBottom: Math.max(insets.bottom, 12) },
        ]}>
        <CustomButton
          title={
            paymentMethod === 'COD'
              ? `Confirm COD Order (${formatPrice(finalAmount)})`
              : `Pay ${formatPrice(finalAmount)} & Place Order`
          }
          size="large"
          loading={loading}
          onPress={handlePlaceOrder}
          style={styles.payButton}
        />
      </View>
    </View>
  );
};

export default PaymentScreen;
