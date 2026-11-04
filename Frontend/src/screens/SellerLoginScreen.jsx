import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from './SellerLoginScreen.styles';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import AppIcon from '../components/AppIcon';
import { validateEmail, validatePassword } from '../utils/validation';
import { useAuth } from '../context/AuthContext';

export const SellerLoginScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { sellerLogin } = useAuth();

  const [email, setEmail] = useState('seller@appecom.in');
  const [password, setPassword] = useState('Seller@12345');
  const [rememberMe, setRememberMe] = useState(true);

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleQuickFill = () => {
    setEmail('seller@appecom.in');
    setPassword('Seller@12345');
    setServerError('');
    setErrors({});
  };

  const handleSubmit = async () => {
    setServerError('');
    const newErrors = {};

    const emailVal = validateEmail(email);
    if (!emailVal.isValid) newErrors.email = emailVal.message;

    const passVal = validatePassword(password, 6);
    if (!passVal.isValid) newErrors.password = passVal.message;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      await sellerLogin(email.trim(), password, rememberMe);
      navigation.replace('SellerDashboard');
    } catch (err) {
      const message = err.message || 'Invalid vendor email or password.';
      setServerError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0E26" />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top > 0 ? insets.top + 20 : 28,
            paddingBottom: insets.bottom + 24,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* Vendor Header */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <AppIcon name="storefront" size={34} color="#FFFFFF" />
          </View>
          <Text style={styles.title}>Seller & Vendor Studio</Text>
          <Text style={styles.subtitle}>
            Manage Pan India Orders, Inventory Catalog & Payout Analytics
          </Text>
        </View>

        {/* Error / Status Alert */}
        {serverError ? (
          <View
            style={[
              styles.errorBanner,
              serverError.toLowerCase().includes('approval') || serverError.toLowerCase().includes('waiting')
                ? { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: '#F59E0B' }
                : null,
            ]}
          >
            <AppIcon
              name={
                serverError.toLowerCase().includes('approval') || serverError.toLowerCase().includes('waiting')
                  ? 'time-outline'
                  : 'alert-circle'
              }
              size={18}
              color={
                serverError.toLowerCase().includes('approval') || serverError.toLowerCase().includes('waiting')
                  ? '#F59E0B'
                  : '#EF4444'
              }
            />
            <Text
              style={[
                styles.errorText,
                serverError.toLowerCase().includes('approval') || serverError.toLowerCase().includes('waiting')
                  ? { color: '#FCD34D' }
                  : null,
              ]}
            >
              {serverError}
            </Text>
          </View>
        ) : null}

        {/* Credentials Form */}
        <View style={styles.card}>
          <CustomInput
            label="Vendor Email Address"
            required
            placeholder="seller@appecom.in"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={(txt) => {
              setEmail(txt);
              if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
              if (serverError) setServerError('');
            }}
            error={errors.email}
            leftIcon="mail-outline"
          />

          <CustomInput
            label="Password"
            required
            placeholder="••••••••"
            isPassword
            value={password}
            onChangeText={(txt) => {
              setPassword(txt);
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
                {rememberMe && <AppIcon name="checkmark" size={13} color="#FFF" />}
              </View>
              <Text style={styles.rememberText}>Remember store session</Text>
            </TouchableOpacity>

            <View style={styles.securityPill}>
              <AppIcon name="shield-checkmark" size={12} color="#818CF8" />
              <Text style={styles.securityText}>Verified</Text>
            </View>
          </View>

          <CustomButton
            title={loading ? 'Authenticating Store...' : 'Enter Seller Studio'}
            onPress={handleSubmit}
            loading={loading}
            size="large"
            style={styles.submitBtn}
          />
        </View>

        {/* Register Link Card */}
        <TouchableOpacity
          style={styles.registerLinkCard}
          onPress={() => navigation.navigate('SellerRegister')}
          activeOpacity={0.85}>
          <View>
            <Text style={styles.registerLinkTitle}>Want to Sell Across India?</Text>
            <Text style={styles.registerLinkSub}>Register your store in under 2 minutes →</Text>
          </View>
          <AppIcon name="arrow-forward" size={18} color="#818CF8" />
        </TouchableOpacity>

        {/* 1-Click Demo Seller Account */}
        <View style={styles.quickFillCard}>
          <Text style={styles.quickFillTitle}>1-Click Authorized Demo Seller</Text>
          <TouchableOpacity
            style={styles.quickFillBtn}
            onPress={handleQuickFill}
            activeOpacity={0.8}>
            <View>
              <Text style={styles.quickFillText}>seller@appecom.in</Text>
              <Text style={styles.quickFillSub}>Store: Jaipur Heritage Handlooms (Active)</Text>
            </View>
            <AppIcon name="flash" size={18} color="#818CF8" />
          </TouchableOpacity>
        </View>

        {/* Portal Switcher */}
        <View style={styles.portalSwitcherRow}>
          <TouchableOpacity onPress={() => navigation.navigate('MainApp')}>
            <Text style={styles.portalLink}>🛒 Customer Store</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('DeliveryLogin')}>
            <Text style={styles.portalLink}>🛵 Delivery Fleet</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('AdminLogin')}>
            <Text style={styles.portalLink}>🛡️ Admin Control</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default SellerLoginScreen;

