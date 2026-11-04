import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from './CartScreen.styles';
import Header from '../components/Header';
import CustomButton from '../components/CustomButton';
import AppIcon from '../components/AppIcon';
import PincodeModal from '../components/PincodeModal';
import { Colors } from '../constants/colors';
import { formatPrice } from '../utils/helpers';
import { useCart } from '../context/CartContext';
import { useLocation } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';

export const CartScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const {
    cartItems,
    cartSummary,
    updateQuantity,
    removeFromCart,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const { selectedPincode, cityName, openPincodeModal, isServiceable } = useLocation();
  const [couponInput, setCouponInput] = useState('');

  const handleApplyCoupon = () => {
    if (!couponInput.trim()) {
      Alert.alert('Coupon Required', 'Please enter a coupon code.');
      return;
    }
    const res = applyCoupon(couponInput);
    if (res.success) {
      setCouponInput('');
      Alert.alert('Success', res.message);
    } else {
      Alert.alert('Coupon Error', res.message);
    }
  };

  const handleProceedToCheckout = () => {
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

    if (!isServiceable) {
      Alert.alert(
        'PIN Code Not Serviceable',
        `Current delivery PIN Code (${selectedPincode}) is not serviceable. Please change the PIN code before checkout.`
      );
      return;
    }
    navigation.navigate('Checkout');
  };

  if (cartItems.length === 0) {
    return (
      <View style={styles.container}>
        <Header title="Shopping Cart" navigation={navigation} showCart={false} />
        <View style={styles.emptyContainer}>
          <AppIcon name="cart-outline" size={72} color="#E0E0E0" />
          <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
          <Text style={styles.emptySubtitle}>
            Browse our authentic Indian handlooms, mobile tech, and gourmet spices to fill your cart.
          </Text>
          <CustomButton
            title="Start Shopping"
            size="large"
            onPress={() => navigation.navigate('HomeTab')}
            style={{ width: 200 }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Shopping Cart" showBack navigation={navigation} showCart={false} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 110 },
        ]}
        showsVerticalScrollIndicator={false}>
        {/* Deliver to PIN Code banner */}
        <TouchableOpacity
          style={styles.pincodeBanner}
          onPress={openPincodeModal}
          activeOpacity={0.8}>
          <View style={styles.pincodeLeft}>
            <AppIcon name="location" size={18} color={Colors.primary} />
            <Text style={styles.pincodeText} numberOfLines={1}>
              Deliver to:{' '}
              <Text style={styles.pincodeBold}>
                {cityName} - {selectedPincode}
              </Text>
            </Text>
          </View>
          <Text style={styles.changePin}>Change PIN</Text>
        </TouchableOpacity>

        {/* Free Shipping Tracker */}
        <View style={styles.freeShippingBar}>
          {cartSummary.freeDeliveryEligible ? (
            <Text style={styles.freeShippingText}>
              🎉 Congratulations! You have unlocked FREE Pan India Delivery.
            </Text>
          ) : (
            <Text style={styles.freeShippingText}>
              🚚 Add {formatPrice(cartSummary.amountNeededForFreeDelivery)} more to get FREE Delivery!
            </Text>
          )}
        </View>

        {/* Guest Shopping Notice Banner */}
        {!isAuthenticated && (
          <View style={styles.guestCartBanner}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
              <AppIcon name="lock-closed" size={16} color="#2563EB" style={{ marginRight: 6 }} />
              <Text style={styles.guestCartBannerText}>
                Shopping as Guest • Your items are saved safely. Sign in at checkout to finalize your order.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.guestCartBannerBtn}
              onPress={() => navigation.navigate('Login', { redirectTo: 'Checkout' })}
              activeOpacity={0.8}>
              <Text style={styles.guestCartBannerBtnText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Cart Items List */}
        <View style={styles.itemsList}>
          {cartItems.map((item, index) => (
            <View key={`${item.id}_${index}`} style={styles.itemRow}>
              <Image source={{ uri: item.image }} style={styles.itemImage} />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={2}>
                  {item.name}
                </Text>
                {item.selectedVariant && (
                  <Text style={styles.itemVariant}>
                    {item.selectedVariant.color && `Color: ${item.selectedVariant.color} `}
                    {item.selectedVariant.size && `• Size: ${item.selectedVariant.size}`}
                  </Text>
                )}

                <View style={styles.itemPriceRow}>
                  <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
                  {item.originalPrice > item.price && (
                    <Text style={styles.itemOriginalPrice}>
                      {formatPrice(item.originalPrice)}
                    </Text>
                  )}
                </View>

                <View style={styles.actionRow}>
                  <View style={styles.quantityControl}>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() =>
                        updateQuantity(item.id, item.selectedVariant, item.quantity - 1)
                      }>
                      <AppIcon name="remove" size={14} color={Colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() =>
                        updateQuantity(item.id, item.selectedVariant, item.quantity + 1)
                      }>
                      <AppIcon name="add" size={14} color={Colors.textPrimary} />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => removeFromCart(item.id, item.selectedVariant)}>
                    <AppIcon name="trash-outline" size={16} color={Colors.danger} />
                    <Text style={styles.removeText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Coupon Code Section */}
        <View style={styles.couponCard}>
          <Text style={styles.couponTitle}>Apply Discount Coupon</Text>
          {appliedCoupon ? (
            <View style={styles.couponAppliedBox}>
              <View>
                <Text style={styles.couponAppliedCode}>✓ {appliedCoupon.code}</Text>
                <Text style={styles.couponAppliedDesc}>{appliedCoupon.description}</Text>
              </View>
              <TouchableOpacity onPress={removeCoupon}>
                <Text style={styles.removeCouponText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.couponInputRow}>
              <TextInput
                style={styles.couponInput}
                placeholder="TRY WELCOME100 OR BHARAT20"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="characters"
                value={couponInput}
                onChangeText={setCouponInput}
              />
              <CustomButton
                title="Apply"
                size="medium"
                onPress={handleApplyCoupon}
                style={{ width: 80, height: 44 }}
              />
            </View>
          )}
        </View>

        {/* Bill Summary */}
        <View style={styles.billCard}>
          <Text style={styles.billTitle}>Price Details ({cartSummary.itemCount} Items)</Text>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Total MRP</Text>
            <Text style={styles.billValue}>{formatPrice(cartSummary.totalOriginalPrice)}</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Discount on MRP</Text>
            <Text style={[styles.billValue, { color: Colors.success }]}>
              -{formatPrice(cartSummary.totalOriginalPrice - cartSummary.subtotal)}
            </Text>
          </View>

          {cartSummary.couponDiscount > 0 && (
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Coupon Discount ({appliedCoupon?.code})</Text>
              <Text style={[styles.billValue, { color: Colors.success }]}>
                -{formatPrice(cartSummary.couponDiscount)}
              </Text>
            </View>
          )}

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Pan India Delivery Fee</Text>
            <Text style={[styles.billValue, cartSummary.deliveryFee === 0 && { color: Colors.success }]}>
              {cartSummary.deliveryFee === 0 ? 'FREE' : formatPrice(cartSummary.deliveryFee)}
            </Text>
          </View>

          <View style={styles.totalDivider} />

          <View style={styles.billRow}>
            <Text style={styles.totalLabel}>Total Payable Amount</Text>
            <Text style={styles.totalValue}>{formatPrice(cartSummary.totalAmount)}</Text>
          </View>

          {cartSummary.totalSavings > 0 && (
            <View style={styles.savingsBanner}>
              <Text style={styles.savingsText}>
                You will save {formatPrice(cartSummary.totalSavings)} on this order
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View
        style={[
          styles.bottomSticky,
          { paddingBottom: Math.max(insets.bottom, 12) },
        ]}>
        <View style={styles.totalCol}>
          <Text style={styles.bottomTotalLabel}>Total Amount</Text>
          <Text style={styles.bottomTotalValue}>{formatPrice(cartSummary.totalAmount)}</Text>
        </View>
        <CustomButton
          title="Proceed to Buy"
          size="large"
          onPress={handleProceedToCheckout}
          style={styles.checkoutBtn}
        />
      </View>

      <PincodeModal />
    </View>
  );
};

export default CartScreen;

