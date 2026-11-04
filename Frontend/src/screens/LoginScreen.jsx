import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from './LoginScreen.styles';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import Header from '../components/Header';
import AppIcon from '../components/AppIcon';
import { validateIndianMobile, validateEmail, validatePassword } from '../utils/validation';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/colors';

export const LoginScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { customerLogin, requestOtp } = useAuth();
  const redirectTo = route?.params?.redirectTo;
  const redirectParams = route?.params?.redirectParams || {};

  // Mode: 'password' | 'otp'
  const [authMode, setAuthMode] = useState('password');

  // Form States
  const [identifier, setIdentifier] = useState(''); // Email or Mobile
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Status & Error
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  /**
   * Handle Password-Based Login
   */
  const handlePasswordLogin = async () => {
    setServerError('');
    const newErrors = {};

    if (!identifier.trim()) {
      newErrors.identifier = 'Please enter your registered Email or Mobile number';
    } else if (identifier.includes('@')) {
      const emailVal = validateEmail(identifier);
      if (!emailVal.isValid) newErrors.identifier = emailVal.message;
    } else if (/^\d+$/.test(identifier.replace(/[^0-9]/g, ''))) {
      const mobVal = validateIndianMobile(identifier);
      if (!mobVal.isValid) newErrors.identifier = mobVal.message;
    }

    const passVal = validatePassword(password, 6);
    if (!passVal.isValid) {
      newErrors.password = passVal.message;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      await customerLogin(identifier.trim(), password, rememberMe);
      if (redirectTo) {
        navigation.replace(redirectTo, redirectParams);
      } else {
        navigation.replace('MainApp');
      }
    } catch (err) {
      setServerError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle OTP-Based Request
   */
  const handleSendOtp = async () => {
    setServerError('');
    const val = validateIndianMobile(identifier);
    if (!val.isValid) {
      setErrors({ identifier: val.message });
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const res = await requestOtp(val.cleaned);
      navigation.navigate('OTPVerification', {
        mobileNumber: val.cleaned,
        demoOtp: res.debugOtp || res.otpDemo || '123456',
        redirectTo,
        redirectParams,
      });
    } catch (err) {
      setServerError(err.message || 'Failed to send OTP. Please check your network.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Login" showBack={navigation.canGoBack()} navigation={navigation} />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* Fast Role / Portal Switcher */}
        <View style={styles.portalSelectorContainer}>
          <Text style={styles.portalSelectorLabel}>Choose Portal</Text>
          <View style={styles.portalPillsRow}>
            <TouchableOpacity
              style={[styles.portalPill, styles.portalPillActive]}
              activeOpacity={0.8}>
              <AppIcon name="cart" size={14} color="#FFF" />
              <Text style={[styles.portalPillText, styles.portalPillTextActive]}>Customer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.portalPill}
              onPress={() => navigation.navigate('SellerLogin')}
              activeOpacity={0.8}>
              <AppIcon name="storefront-outline" size={14} color="#6366F1" />
              <Text style={styles.portalPillText}>Seller</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.portalPill}
              onPress={() => navigation.navigate('DeliveryLogin')}
              activeOpacity={0.8}>
              <AppIcon name="bicycle-outline" size={14} color="#0D9488" />
              <Text style={styles.portalPillText}>Delivery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.portalPill}
              onPress={() => navigation.navigate('AdminLogin')}
              activeOpacity={0.8}>
              <AppIcon name="shield-outline" size={14} color="#DC2626" />
              <Text style={styles.portalPillText}>Admin</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.header}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Pan India E-Commerce</Text>
          </View>
          <Text style={styles.title}>Welcome Back!</Text>
          <Text style={styles.subtitle}>
            Sign in to access your orders, wishlist, and exclusive discounts.
          </Text>
        </View>

        {/* Checkout Intent Banner */}
        {redirectTo === 'Checkout' && (
          <View
            style={{
              backgroundColor: '#EFF6FF',
              borderColor: '#93C5FD',
              borderWidth: 1,
              borderRadius: 12,
              padding: 12,
              marginBottom: 16,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
            <AppIcon name="lock-closed" size={20} color="#2563EB" style={{ marginRight: 10 }} />
            <Text style={{ flex: 1, fontSize: 13, color: '#1E40AF', fontWeight: '600', lineHeight: 18 }}>
              Please login or create an account to complete your order. Your cart items are saved!
            </Text>
          </View>
        )}

        {/* Auth Mode Switcher */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabButton, authMode === 'password' && styles.tabButtonActive]}
            onPress={() => {
              setAuthMode('password');
              setServerError('');
              setErrors({});
            }}
            activeOpacity={0.8}>
            <Text style={[styles.tabText, authMode === 'password' && styles.tabTextActive]}>
              Password Login
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, authMode === 'otp' && styles.tabButtonActive]}
            onPress={() => {
              setAuthMode('otp');
              setServerError('');
              setErrors({});
            }}
            activeOpacity={0.8}>
            <Text style={[styles.tabText, authMode === 'otp' && styles.tabTextActive]}>
              Mobile OTP
            </Text>
          </TouchableOpacity>
        </View>

        {/* Global Error Banner */}
        {serverError ? (
          <View style={styles.errorBanner}>
            <AppIcon name="alert-circle" size={20} color={Colors.danger} />
            <Text style={styles.errorText}>{serverError}</Text>
          </View>
        ) : null}

        {/* Password Login Mode */}
        {authMode === 'password' ? (
          <View style={styles.form}>
            <CustomInput
              label="Email or Mobile Number"
              required
              placeholder="e.g. rahul@example.com or 9876543210"
              keyboardType="email-address"
              autoCapitalize="none"
              value={identifier}
              onChangeText={(text) => {
                setIdentifier(text);
                if (errors.identifier) setErrors((prev) => ({ ...prev, identifier: '' }));
                if (serverError) setServerError('');
              }}
              error={errors.identifier}
              leftIcon="person-outline"
            />

            <CustomInput
              label="Password"
              required
              placeholder="Enter your password"
              isPassword
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                if (serverError) setServerError('');
              }}
              error={errors.password}
              leftIcon="lock-closed-outline"
            />

            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={styles.rememberRow}
                onPress={() => setRememberMe(!rememberMe)}
                activeOpacity={0.8}>
                <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                  {rememberMe && <AppIcon name="checkmark" size={14} color={Colors.white} />}
                </View>
                <Text style={styles.rememberText}>Remember me</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('ForgotPassword')}
                activeOpacity={0.7}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            <CustomButton
              title="Sign In as Customer"
              size="large"
              loading={loading}
              onPress={handlePasswordLogin}
              style={styles.submitBtn}
            />
          </View>
        ) : (
          /* Mobile OTP Mode */
          <View style={styles.form}>
            <CustomInput
              label="10-Digit Mobile Number"
              required
              placeholder="98765 43210"
              keyboardType="phone-pad"
              maxLength={10}
              value={identifier}
              onChangeText={(text) => {
                setIdentifier(text);
                if (errors.identifier) setErrors((prev) => ({ ...prev, identifier: '' }));
                if (serverError) setServerError('');
              }}
              error={errors.identifier}
              helperText="We will send a 6-digit OTP code to your number"
              leftIcon="call-outline"
            />

            <CustomButton
              title="Send Verification OTP"
              size="large"
              loading={loading}
              onPress={handleSendOtp}
              style={styles.submitBtn}
            />
          </View>
        )}

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>New to Bharat Bazaar?</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Register', { redirectTo, redirectParams })}
            activeOpacity={0.7}>
            <Text style={styles.registerLink}>Create Account</Text>
          </TouchableOpacity>
        </View>

        {/* Dedicated Partner & Staff Portals */}
        <View style={styles.partnerSection}>
          <Text style={styles.partnerSectionTitle}>Business & Partner Portals</Text>

          {/* Seller / Vendor Studio */}
          <View style={[styles.partnerCard, { borderColor: '#3730A3' }]}>
            <View style={styles.partnerHeaderRow}>
              <View style={[styles.partnerIconBadge, { backgroundColor: '#312E81' }]}>
                <AppIcon name="storefront" size={20} color="#818CF8" />
              </View>
              <View style={styles.partnerInfo}>
                <Text style={styles.partnerTitle}>Seller & Vendor Studio</Text>
                <Text style={styles.partnerSubtitle}>List products, manage inventory & track payouts</Text>
              </View>
            </View>
            <View style={styles.partnerBtnGroup}>
              <TouchableOpacity
                style={[styles.partnerPrimaryBtn, { backgroundColor: '#4F46E5' }]}
                onPress={() => navigation.navigate('SellerLogin')}
                activeOpacity={0.8}>
                <Text style={styles.partnerPrimaryBtnText}>Vendor Login →</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.partnerSecondaryBtn}
                onPress={() => navigation.navigate('SellerRegister')}
                activeOpacity={0.8}>
                <Text style={styles.partnerSecondaryBtnText}>Register Store</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Delivery Fleet Partner */}
          <View style={[styles.partnerCard, { borderColor: '#115E59' }]}>
            <View style={styles.partnerHeaderRow}>
              <View style={[styles.partnerIconBadge, { backgroundColor: '#134E4A' }]}>
                <AppIcon name="bicycle" size={20} color="#2DD4BF" />
              </View>
              <View style={styles.partnerInfo}>
                <Text style={styles.partnerTitle}>Delivery Fleet Partner</Text>
                <Text style={styles.partnerSubtitle}>Accept deliveries, navigate routes & daily earnings</Text>
              </View>
            </View>
            <View style={styles.partnerBtnGroup}>
              <TouchableOpacity
                style={[styles.partnerPrimaryBtn, { backgroundColor: '#0D9488' }]}
                onPress={() => navigation.navigate('DeliveryLogin')}
                activeOpacity={0.8}>
                <Text style={styles.partnerPrimaryBtnText}>Rider Login →</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.partnerSecondaryBtn}
                onPress={() => navigation.navigate('DeliveryRegister')}
                activeOpacity={0.8}>
                <Text style={styles.partnerSecondaryBtnText}>Join as Rider</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Admin Operations Control */}
          <TouchableOpacity
            style={styles.adminCard}
            onPress={() => navigation.navigate('AdminLogin')}
            activeOpacity={0.8}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <AppIcon name="shield-checkmark" size={18} color="#38BDF8" />
              <Text style={styles.adminCardText}>Admin & Operations Portal</Text>
            </View>
            <AppIcon name="arrow-forward" size={16} color="#38BDF8" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.skipBtn}
          onPress={() => navigation.replace('MainApp')}
          activeOpacity={0.7}>
          <Text style={styles.skipText}>Continue as Guest Shopping →</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default LoginScreen;
