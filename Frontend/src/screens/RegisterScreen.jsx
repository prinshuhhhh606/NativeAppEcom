import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import styles from './RegisterScreen.styles';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import Header from '../components/Header';
import AppIcon from '../components/AppIcon';
import {
  validateIndianMobile,
  validateEmail,
  validateName,
  validatePincode,
} from '../utils/validation';
import { useAuth } from '../context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const RegisterScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const redirectTo = route?.params?.redirectTo;
  const redirectParams = route?.params?.redirectParams || {};
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pincode, setPincode] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  // Field input references for smooth keyboard navigation
  const nameInputRef = useRef(null);
  const mobileInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const confirmPasswordInputRef = useRef(null);
  const pincodeInputRef = useRef(null);

  const handleRegister = async () => {
    Keyboard.dismiss();
    const newErrors = {};

    const nameVal = validateName(fullName);
    if (!nameVal.isValid) newErrors.fullName = nameVal.message;

    const mobVal = validateIndianMobile(mobileNumber);
    if (!mobVal.isValid) newErrors.mobileNumber = mobVal.message;

    if (!email || !email.trim()) {
      newErrors.email = 'Email address is required for order confirmations';
    } else {
      const emailVal = validateEmail(email);
      if (!emailVal.isValid) newErrors.email = emailVal.message;
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirm password is required';
    } else if (confirmPassword !== password) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (pincode && pincode.trim().length > 0) {
      const pinVal = validatePincode(pincode);
      if (!pinVal.isValid) newErrors.pincode = pinVal.message;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      await register({
        fullName: fullName.trim(),
        name: fullName.trim(),
        mobileNumber: mobVal.cleaned,
        phone: mobVal.cleaned,
        email: email ? email.trim().toLowerCase() : '',
        password,
        defaultPincode: pincode || '110001',
      });
      Alert.alert(
        'Account Created',
        'Welcome to Bharat Bazaar! Your Pan India shopping account is ready.',
        [
          {
            text: redirectTo ? 'Continue to Checkout' : 'Start Shopping',
            onPress: () => {
              if (redirectTo) {
                navigation.replace(redirectTo, redirectParams);
              } else {
                navigation.replace('MainApp');
              }
            },
          },
        ]
      );
    } catch (err) {
      let errorMsg = 'Failed to create account. Please try again.';
      if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
        if (Array.isArray(err.response.data.errors) && err.response.data.errors.length > 0) {
          const detail = err.response.data.errors
            .map((e) => (typeof e === 'string' ? e : e.message || ''))
            .filter(Boolean)
            .join('\n');
          if (detail && detail !== errorMsg) {
            errorMsg = `${errorMsg}:\n${detail}`;
          }
        }
      } else if (err.message) {
        errorMsg = err.message;
      }
      Alert.alert('Registration Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Create Account" showBack navigation={navigation} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            contentContainerStyle={[styles.content, { flexGrow: 1, paddingBottom: insets.bottom + 32 }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="on-drag">
            {/* Account Type Selector */}
            <View style={styles.portalSelectorContainer}>
              <Text style={styles.portalSelectorLabel}>Account Type</Text>
              <View style={styles.portalPillsRow}>
                <TouchableOpacity
                  style={[styles.portalPill, styles.portalPillActive]}
                  activeOpacity={0.8}>
                  <AppIcon name="cart" size={14} color="#FFF" />
                  <Text style={[styles.portalPillText, styles.portalPillTextActive]}>Customer</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.portalPill}
                  onPress={() => navigation.navigate('SellerRegister')}
                  activeOpacity={0.8}>
                  <AppIcon name="storefront-outline" size={14} color="#6366F1" />
                  <Text style={styles.portalPillText}>Seller</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.portalPill}
                  onPress={() => navigation.navigate('DeliveryRegister')}
                  activeOpacity={0.8}>
                  <AppIcon name="bicycle-outline" size={14} color="#0D9488" />
                  <Text style={styles.portalPillText}>Delivery</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.header}>
              <Text style={styles.title}>Join Pan India Shopping</Text>
              <Text style={styles.subtitle}>
                Create your account to track orders, save delivery addresses, and unlock exclusive discounts.
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

            <View style={styles.form}>
              <CustomInput
                ref={nameInputRef}
                label="Full Name"
                required
                placeholder="e.g. Rahul Sharma"
                value={fullName}
                returnKeyType="next"
                onSubmitEditing={() => mobileInputRef.current?.focus()}
                onChangeText={(t) => {
                  setFullName(t);
                  if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: null }));
                }}
                error={errors.fullName}
                leftIcon="person-outline"
              />

              <CustomInput
                ref={mobileInputRef}
                label="Mobile Number"
                required
                placeholder="98765 43210"
                keyboardType="phone-pad"
                maxLength={10}
                value={mobileNumber}
                returnKeyType="next"
                onSubmitEditing={() => emailInputRef.current?.focus()}
                onChangeText={(t) => {
                  setMobileNumber(t);
                  if (errors.mobileNumber) setErrors((prev) => ({ ...prev, mobileNumber: null }));
                }}
                error={errors.mobileNumber}
                leftIcon="call-outline"
                helperText="Used for OTP login & delivery updates"
              />

              <CustomInput
                ref={emailInputRef}
                label="Email Address (Optional)"
                placeholder="rahul.sharma@example.in"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                returnKeyType="next"
                onSubmitEditing={() => passwordInputRef.current?.focus()}
                onChangeText={(t) => {
                  setEmail(t);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
                }}
                error={errors.email}
                leftIcon="mail-outline"
              />

              <CustomInput
                ref={passwordInputRef}
                label="Password"
                required
                placeholder="Minimum 6 characters"
                secureTextEntry
                value={password}
                returnKeyType="next"
                onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
                onChangeText={(t) => {
                  setPassword(t);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
                }}
                error={errors.password}
                leftIcon="shield-checkmark-outline"
              />

              <CustomInput
                ref={confirmPasswordInputRef}
                label="Confirm Password"
                required
                placeholder="Re-enter your password"
                secureTextEntry
                value={confirmPassword}
                returnKeyType="next"
                onSubmitEditing={() => pincodeInputRef.current?.focus()}
                onChangeText={(t) => {
                  setConfirmPassword(t);
                  if (errors.confirmPassword)
                    setErrors((prev) => ({ ...prev, confirmPassword: null }));
                }}
                error={errors.confirmPassword}
                leftIcon="shield-checkmark-outline"
              />

              <CustomInput
                ref={pincodeInputRef}
                label="Default 6-Digit PIN Code (Optional)"
                placeholder="e.g. 110001"
                keyboardType="number-pad"
                maxLength={6}
                value={pincode}
                returnKeyType="done"
                onSubmitEditing={handleRegister}
                onChangeText={(t) => {
                  setPincode(t);
                  if (errors.pincode) setErrors((prev) => ({ ...prev, pincode: null }));
                }}
                error={errors.pincode}
                leftIcon="location-outline"
              />

              <CustomButton
                title="Create Account"
                size="large"
                loading={loading}
                onPress={handleRegister}
                style={styles.submitBtn}
              />

              <Text style={styles.termsText}>
                By signing up, you agree to our{' '}
                <Text style={styles.termsHighlight}>Terms of Service</Text> and{' '}
                <Text style={styles.termsHighlight}>Privacy Policy</Text>.
              </Text>
            </View>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already have an account?</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Login', { redirectTo, redirectParams })}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={styles.loginLink}>Login Here</Text>
              </TouchableOpacity>
            </View>

            {/* Business & Partner Registration Options */}
            <View style={styles.partnerSection}>
              {/* Seller Registration Card */}
              <TouchableOpacity
                style={[styles.partnerCard, { backgroundColor: '#F5F3FF', borderColor: '#DDD6FE' }]}
                onPress={() => navigation.navigate('SellerRegister')}
                activeOpacity={0.85}>
                <View style={styles.partnerCardLeft}>
                  <AppIcon name="storefront" size={22} color="#6366F1" />
                  <View>
                    <Text style={[styles.partnerTitle, { color: '#4338CA' }]}>
                      Want to Sell on Bharat Bazaar?
                    </Text>
                    <Text style={styles.partnerSubtitle}>Register your shop & reach crores of buyers</Text>
                  </View>
                </View>
                <AppIcon name="arrow-forward" size={16} color="#6366F1" />
              </TouchableOpacity>

              {/* Delivery Partner Registration Card */}
              <TouchableOpacity
                style={[styles.partnerCard, { backgroundColor: '#F0FDFA', borderColor: '#99F6E4' }]}
                onPress={() => navigation.navigate('DeliveryRegister')}
                activeOpacity={0.85}>
                <View style={styles.partnerCardLeft}>
                  <AppIcon name="bicycle" size={22} color="#0D9488" />
                  <View>
                    <Text style={[styles.partnerTitle, { color: '#0F766E' }]}>
                      Join as a Delivery Partner
                    </Text>
                    <Text style={styles.partnerSubtitle}>Daily earnings, flexible shifts & rider bonus</Text>
                  </View>
                </View>
                <AppIcon name="arrow-forward" size={16} color="#0D9488" />
              </TouchableOpacity>

              {/* Admin Portal Link */}
              <TouchableOpacity
                style={[styles.partnerCard, { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }]}
                onPress={() => navigation.navigate('AdminLogin')}
                activeOpacity={0.85}>
                <View style={styles.partnerCardLeft}>
                  <AppIcon name="shield-checkmark" size={22} color="#475569" />
                  <View>
                    <Text style={[styles.partnerTitle, { color: '#1E293B' }]}>
                      Administrator & Staff Portal
                    </Text>
                    <Text style={styles.partnerSubtitle}>Operations dashboard & catalog management</Text>
                  </View>
                </View>
                <AppIcon name="arrow-forward" size={16} color="#475569" />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
};

export default RegisterScreen;
