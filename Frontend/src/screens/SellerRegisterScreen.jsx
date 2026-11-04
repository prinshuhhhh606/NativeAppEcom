import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from './SellerRegisterScreen.styles';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import Header from '../components/Header';
import AppIcon from '../components/AppIcon';
import {
  validateIndianMobile,
  validateEmail,
  validateName,
  validatePassword,
  validatePincode,
} from '../utils/validation';
import { useAuth } from '../context/AuthContext';

export const SellerRegisterScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { sellerRegister } = useAuth();

  const [storeName, setStoreName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [city, setCity] = useState('Jaipur');
  const [pinCode, setPinCode] = useState('302001');

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setServerError('');
    const newErrors = {};

    if (!storeName.trim()) newErrors.storeName = 'Store or Business Name is required';
    const nameVal = validateName(ownerName);
    if (!nameVal.isValid) newErrors.ownerName = nameVal.message;

    const emailVal = validateEmail(email);
    if (!emailVal.isValid) newErrors.email = emailVal.message;

    const mobVal = validateIndianMobile(phone);
    if (!mobVal.isValid) newErrors.phone = mobVal.message;

    const passVal = validatePassword(password, 6);
    if (!passVal.isValid) newErrors.password = passVal.message;

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    const pinVal = validatePincode(pinCode);
    if (!pinVal.isValid) newErrors.pinCode = pinVal.message;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      await sellerRegister({
        storeName: storeName.trim(),
        businessName: storeName.trim(),
        name: ownerName.trim(),
        email: email.trim().toLowerCase(),
        phone: mobVal.cleaned,
        password,
        city: city.trim() || 'Jaipur',
        pinCode: pinCode.trim() || '302001',
      });

      Alert.alert(
        'Registration Submitted',
        'Your seller registration has been submitted successfully. Please wait for Admin approval.',
        [{ text: 'Proceed to Login', onPress: () => navigation.replace('SellerLogin') }]
      );
    } catch (err) {
      setServerError(err.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0E26" />
      <Header title="Register Seller Store" showBack navigation={navigation} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <AppIcon name="storefront" size={30} color="#FFF" />
            </View>
            <Text style={styles.title}>Join as a Verified Seller</Text>
            <Text style={styles.subtitle}>
              List products, receive customer orders & enjoy 0% setup fees
            </Text>
          </View>

          {serverError ? (
            <View style={styles.errorBanner}>
              <AppIcon name="alert-circle" size={18} color="#EF4444" />
              <Text style={styles.errorText}>{serverError}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <CustomInput
              label="Store or Business Name"
              required
              placeholder="e.g. Royal Jaipur Handicrafts"
              value={storeName}
              onChangeText={(t) => {
                setStoreName(t);
                if (errors.storeName) setErrors((prev) => ({ ...prev, storeName: null }));
              }}
              error={errors.storeName}
              leftIcon="business-outline"
            />

            <CustomInput
              label="Owner Full Name"
              required
              placeholder="e.g. Ramesh Patel"
              value={ownerName}
              onChangeText={(t) => {
                setOwnerName(t);
                if (errors.ownerName) setErrors((prev) => ({ ...prev, ownerName: null }));
              }}
              error={errors.ownerName}
              leftIcon="person-outline"
            />

            <CustomInput
              label="Business Email"
              required
              placeholder="store@example.in"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
              }}
              error={errors.email}
              leftIcon="mail-outline"
            />

            <CustomInput
              label="Mobile Number"
              required
              placeholder="98765 43210"
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={(t) => {
                setPhone(t);
                if (errors.phone) setErrors((prev) => ({ ...prev, phone: null }));
              }}
              error={errors.phone}
              leftIcon="call-outline"
            />

            <View style={styles.rowInputs}>
              <View style={{ flex: 1 }}>
                <CustomInput
                  label="City"
                  placeholder="Jaipur"
                  value={city}
                  onChangeText={setCity}
                  leftIcon="location-outline"
                />
              </View>
              <View style={{ flex: 1 }}>
                <CustomInput
                  label="PIN Code"
                  placeholder="302001"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={pinCode}
                  onChangeText={(t) => {
                    setPinCode(t);
                    if (errors.pinCode) setErrors((prev) => ({ ...prev, pinCode: null }));
                  }}
                  error={errors.pinCode}
                />
              </View>
            </View>

            <CustomInput
              label="Account Password"
              required
              placeholder="Min. 6 characters"
              isPassword
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
              }}
              error={errors.password}
              leftIcon="lock-closed-outline"
            />

            <CustomInput
              label="Confirm Password"
              required
              placeholder="Re-enter password"
              isPassword
              value={confirmPassword}
              onChangeText={(t) => {
                setConfirmPassword(t);
                if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: null }));
              }}
              error={errors.confirmPassword}
              leftIcon="lock-closed-outline"
            />

            <CustomButton
              title={loading ? 'Registering Store...' : 'Create Seller Account'}
              onPress={handleRegister}
              loading={loading}
              size="large"
              style={styles.submitBtn}
            />

            <Text style={styles.termsText}>
              By registering, you agree to the{' '}
              <Text style={styles.termsHighlight}>Seller Terms & Merchant Policy</Text>.
            </Text>
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already have a seller account?</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('SellerLogin')}
              activeOpacity={0.7}>
              <Text style={styles.loginLink}>Login to Studio</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default SellerRegisterScreen;

