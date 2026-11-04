import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from './CheckoutScreen.styles';
import Header from '../components/Header';
import CustomButton from '../components/CustomButton';
import { Colors } from '../constants/colors';
import { formatPrice, formatEstimatedDelivery } from '../utils/helpers';
import { useCart } from '../context/CartContext';
import { useLocation } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';
import { addressService } from '../services/addressService';

export const CheckoutScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { cartItems, cartSummary, appliedCoupon } = useCart();
  const { isAuthenticated } = useAuth();
  const { deliveryDays } = useLocation();
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [shippingMode, setShippingMode] = useState('standard'); // standard, express
  const [loadingAddress, setLoadingAddress] = useState(true);

  const loadAddress = async () => {
    try {
      const list = await addressService.getAddresses();
      const remembered = await addressService.getSelectedCheckoutAddress();
      const matched =
        remembered &&
        list.find((a) => a.id === remembered.id || a._id === remembered._id);

      const defaultAddr = matched || list.find((a) => a.isDefault) || list[0] || null;
      setSelectedAddress(defaultAddr);
      if (defaultAddr) {
        await addressService.setSelectedCheckoutAddress(defaultAddr);
      }
    } catch (e) {
      console.warn('Error loading checkout address:', e);
    } finally {
      setLoadingAddress(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      Alert.alert(
        'Sign In Required for Checkout',
        'Please login or create an account to complete your order. Your cart items are saved!',
        [
          { text: 'Go Back', style: 'cancel', onPress: () => navigation.goBack() },
          {
            text: 'Sign In / Register',
            onPress: () => navigation.navigate('Login', { redirectTo: 'Checkout' }),
          },
        ]
      );
      return;
    }
    loadAddress();
    const unsubscribe = navigation.addListener('focus', () => {
      loadAddress();
    });
    return unsubscribe;
  }, [navigation, isAuthenticated]);

  const handleSelectAddress = async (addr) => {
    setSelectedAddress(addr);
    await addressService.setSelectedCheckoutAddress(addr);
  };

  const expressExtraCharge = shippingMode === 'express' ? 50 : 0;
  const finalPayable = cartSummary.totalAmount + expressExtraCharge;

  const handleProceedToPayment = () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Sign In Required for Checkout',
        'Please login or create an account to complete your order. Your cart items are saved!',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign In / Register',
            onPress: () => navigation.navigate('Login', { redirectTo: 'Checkout' }),
          },
        ]
      );
      return;
    }

    if (!selectedAddress) {
      Alert.alert(
        'Delivery Address Required',
        'Please select or add a delivery address before proceeding to payment options.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: '+ Add Address', onPress: () => navigation.navigate('AddAddress') },
        ]
      );
      return;
    }

    navigation.navigate('Payment', {
      selectedAddress,
      shippingMode,
      finalAmount: finalPayable,
      expectedDelivery: formatEstimatedDelivery(
        shippingMode === 'express' ? Math.max(1, deliveryDays - 1) : deliveryDays
      ),
    });
  };

  return (
    <View style={styles.container}>
      <Header title="Order Checkout" showBack navigation={navigation} showCart={false} />

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
            marginBottom: 12,
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
                backgroundColor: Colors.primary,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '800' }}>1</Text>
            </View>
            <Text style={{ fontSize: 12, fontWeight: '800', color: Colors.primary }}>
              Delivery Address
            </Text>
          </View>

          <View style={{ height: 1, width: 30, backgroundColor: Colors.borderLight }} />

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: '#E0E0E0',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <Text style={{ color: '#616161', fontSize: 11, fontWeight: '800' }}>2</Text>
            </View>
            <Text style={{ fontSize: 12, fontWeight: '600', color: Colors.textSecondary }}>
              Payment & Summary
            </Text>
          </View>
        </View>

        {/* 1. Delivery Address Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>📍 Select Delivery Destination</Text>
            {selectedAddress && (
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('Address', {
                    onSelectAddress: handleSelectAddress,
                    selectedId: selectedAddress?.id || selectedAddress?._id,
                  })
                }>
                <Text style={styles.changeText}>Change / Add</Text>
              </TouchableOpacity>
            )}
          </View>

          {selectedAddress ? (
            <View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 4,
                }}>
                <Text style={styles.addressName}>{selectedAddress.fullName}</Text>
                <View
                  style={{
                    backgroundColor: '#EFEBE9',
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 6,
                  }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.textSecondary }}>
                    {selectedAddress.addressType || 'Home'}
                  </Text>
                </View>
              </View>

              <Text style={styles.addressDetails}>
                {selectedAddress.streetAddress || selectedAddress.addressLine1}
              </Text>
              {selectedAddress.landmark ? (
                <Text style={styles.addressDetails}>Landmark: {selectedAddress.landmark}</Text>
              ) : null}
              <Text style={styles.addressDetails}>
                {selectedAddress.city}, {selectedAddress.state} -{' '}
                {selectedAddress.pincode || selectedAddress.pinCode}
              </Text>
              <Text style={styles.addressPhone}>
                Mobile: +91 {selectedAddress.mobileNumber || selectedAddress.phone}
              </Text>

              <TouchableOpacity
                style={{ marginTop: 12, alignSelf: 'flex-start' }}
                onPress={() =>
                  navigation.navigate('Address', {
                    onSelectAddress: handleSelectAddress,
                    selectedId: selectedAddress?.id || selectedAddress?._id,
                  })
                }>
                <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.primary }}>
                  + Choose from saved addresses or add new
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ paddingVertical: 8 }}>
              <Text style={{ fontSize: 13, color: '#D32F2F', fontWeight: '700', marginBottom: 4 }}>
                ⚠️ No Delivery Address Selected
              </Text>
              <Text style={{ fontSize: 12, color: Colors.textSecondary, marginBottom: 12 }}>
                Please select or add a delivery address to enable payment options and proceed with your order.
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('AddAddress')}
                style={{
                  backgroundColor: '#FFF0EB',
                  borderWidth: 1.5,
                  borderColor: Colors.primary,
                  borderStyle: 'dashed',
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 10,
                  alignItems: 'center',
                }}>
                <Text style={{ color: Colors.primary, fontWeight: '800', fontSize: 13 }}>
                  + Add New Delivery Address
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Pan India Shipping Speed Options */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🚚 Pan India Delivery Speed</Text>

          {/* Standard Delivery */}
          <TouchableOpacity
            style={[
              styles.deliveryOptionRow,
              shippingMode === 'standard' && styles.deliveryOptionRowSelected,
            ]}
            onPress={() => setShippingMode('standard')}
            activeOpacity={0.8}>
            <View
              style={[
                styles.radioCircle,
                shippingMode === 'standard' && styles.radioCircleSelected,
              ]}>
              {shippingMode === 'standard' && <View style={styles.radioDot} />}
            </View>
            <View style={styles.optionTextCol}>
              <Text style={styles.optionTitle}>Standard Surface Delivery</Text>
              <Text style={styles.optionSubtitle}>
                Estimated by {formatEstimatedDelivery(deliveryDays)}
              </Text>
            </View>
            <Text style={styles.optionPrice}>
              {cartSummary.deliveryFee === 0 ? 'FREE' : formatPrice(cartSummary.deliveryFee)}
            </Text>
          </TouchableOpacity>

          {/* Express Air Delivery */}
          <TouchableOpacity
            style={[
              styles.deliveryOptionRow,
              shippingMode === 'express' && styles.deliveryOptionRowSelected,
            ]}
            onPress={() => setShippingMode('express')}
            activeOpacity={0.8}>
            <View
              style={[
                styles.radioCircle,
                shippingMode === 'express' && styles.radioCircleSelected,
              ]}>
              {shippingMode === 'express' && <View style={styles.radioDot} />}
            </View>
            <View style={styles.optionTextCol}>
              <Text style={styles.optionTitle}>⚡ Express Air Delivery</Text>
              <Text style={styles.optionSubtitle}>
                Estimated by {formatEstimatedDelivery(Math.max(1, deliveryDays - 1))}
              </Text>
            </View>
            <Text style={styles.optionPrice}>
              {formatPrice(cartSummary.deliveryFee + 50)}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Order Items Preview */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Cart Items ({cartItems.length})</Text>
          {cartItems.map((item, idx) => (
            <View key={idx} style={styles.itemRow}>
              <Image source={{ uri: item.image }} style={styles.itemThumb} />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.itemQty}>Quantity: {item.quantity}</Text>
              </View>
              <Text style={styles.itemPrice}>{formatPrice(item.price * item.quantity)}</Text>
            </View>
          ))}
        </View>

        {/* Price Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Price Breakdown</Text>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Cart Items MRP</Text>
            <Text style={styles.billValue}>{formatPrice(cartSummary.totalOriginalPrice)}</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Product Discount</Text>
            <Text style={[styles.billValue, { color: Colors.success }]}>
              -{formatPrice(cartSummary.totalOriginalPrice - cartSummary.subtotal)}
            </Text>
          </View>

          {cartSummary.couponDiscount > 0 && (
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Coupon Savings ({appliedCoupon?.code})</Text>
              <Text style={[styles.billValue, { color: Colors.success }]}>
                -{formatPrice(cartSummary.couponDiscount)}
              </Text>
            </View>
          )}

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Shipping & Delivery Charges</Text>
            <Text
              style={[
                styles.billValue,
                cartSummary.deliveryFee + expressExtraCharge === 0 && { color: Colors.success },
              ]}>
              {cartSummary.deliveryFee + expressExtraCharge === 0
                ? 'FREE'
                : formatPrice(cartSummary.deliveryFee + expressExtraCharge)}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.billRow}>
            <Text style={styles.totalLabel}>Grand Total Amount</Text>
            <Text style={styles.totalValue}>{formatPrice(finalPayable)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View
        style={[
          styles.bottomBar,
          { paddingBottom: Math.max(insets.bottom, 12) },
        ]}>
        <View>
          <Text style={styles.bottomTotalLabel}>Total To Pay</Text>
          <Text style={styles.bottomTotalValue}>{formatPrice(finalPayable)}</Text>
        </View>
        <CustomButton
          title={selectedAddress ? 'Continue to Payment →' : 'Select Delivery Address'}
          size="large"
          disabled={!selectedAddress}
          onPress={handleProceedToPayment}
          style={[
            styles.paymentBtn,
            !selectedAddress && { opacity: 0.65, backgroundColor: '#757575' },
          ]}
        />
      </View>
    </View>
  );
};

export default CheckoutScreen;
