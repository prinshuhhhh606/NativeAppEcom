import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from './AdminLoginScreen.styles';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import AppIcon from '../components/AppIcon';
import { validateEmail, validatePassword } from '../utils/validation';
import { useAuth } from '../context/AuthContext';

export const AdminLoginScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { adminLogin } = useAuth();

  const [email, setEmail] = useState('admin@appecom.in');
  const [password, setPassword] = useState('Admin@12345');
  const [rememberMe, setRememberMe] = useState(true);

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  /**
   * Quick fill for authorized demo accounts
   */
  const handleQuickFill = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setServerError('');
    setErrors({});
  };

  /**
   * Submit Admin Login
   */
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
      const res = await adminLogin(email.trim(), password, rememberMe);
      // Navigate to Admin Dashboard
      navigation.replace('AdminDashboard');
    } catch (err) {
      const message =
        err.status === 403
          ? 'Access Denied: Customer accounts cannot access the Admin Dashboard.'
          : err.message || 'Invalid administrator email or password.';
      setServerError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top > 0 ? insets.top + 16 : 24,
            paddingBottom: insets.bottom + 24,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* Admin Portal Header */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Text style={styles.badgeText}>BB</Text>
          </View>
          <Text style={styles.title}>Bharat Bazaar Admin</Text>
          <Text style={styles.subtitle}>
            Pan India E-Commerce Operations & Control Dashboard
          </Text>
        </View>

        {/* Server Error Alert */}
        {serverError ? (
          <View style={styles.errorBanner}>
            <AppIcon name="shield" size={18} color="#F87171" />
            <Text style={styles.errorText}>{serverError}</Text>
          </View>
        ) : null}

        {/* Credentials Form Card */}
        <View style={styles.card}>
          <CustomInput
            label="Admin Email Address"
            required
            placeholder="admin@appecom.in"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
              if (serverError) setServerError('');
            }}
            error={errors.email}
            leftIcon="mail-outline"
          />

          <CustomInput
            label="Security Password"
            required
            placeholder="••••••••"
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
                {rememberMe && <AppIcon name="checkmark" size={14} color="#FFF" />}
              </View>
              <Text style={styles.rememberText}>Keep session active</Text>
            </TouchableOpacity>

            <View style={styles.securityPill}>
              <AppIcon name="lock-closed" size={12} color="#34D399" />
              <Text style={styles.securityText}>256-Bit SSL</Text>
            </View>
          </View>

          <CustomButton
            title="Authenticate & Enter Dashboard"
            size="large"
            loading={loading}
            onPress={handleSubmit}
            style={styles.submitBtn}
          />
        </View>

        {/* One-Click Authorized Test Credentials */}
        <View style={styles.demoCard}>
          <Text style={styles.demoTitle}>One-Click Staff Credentials</Text>
          <View style={styles.demoRow}>
            <TouchableOpacity
              style={styles.demoButton}
              onPress={() => handleQuickFill('admin@appecom.in', 'Admin@12345')}
              activeOpacity={0.8}>
              <Text style={styles.demoButtonText}>Super Admin</Text>
              <Text style={styles.demoButtonRole}>All Permissions</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.demoButton}
              onPress={() => handleQuickFill('manager@appecom.in', 'Manager@12345')}
              activeOpacity={0.8}>
              <Text style={styles.demoButtonText}>Store Manager</Text>
              <Text style={styles.demoButtonRole}>Orders & Catalog</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Portal Switcher */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 16,
            marginTop: 18,
            marginBottom: 6,
          }}>
          <TouchableOpacity onPress={() => navigation.navigate('MainApp')}>
            <Text style={{ fontSize: 12, color: '#94A3B8', fontWeight: '600' }}>🛒 Customer Store</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('SellerLogin')}>
            <Text style={{ fontSize: 12, color: '#818CF8', fontWeight: '600' }}>🏪 Seller Studio</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('DeliveryLogin')}>
            <Text style={{ fontSize: 12, color: '#2DD4BF', fontWeight: '600' }}>🛵 Delivery Fleet</Text>
          </TouchableOpacity>
        </View>

        {/* Return to Customer Store */}
        <TouchableOpacity
          style={styles.returnBtn}
          onPress={() => navigation.replace('MainApp')}
          activeOpacity={0.7}>
          <AppIcon name="arrow-back" size={16} color="#94A3B8" />
          <Text style={styles.returnText}>Return to Customer Store</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default AdminLoginScreen;

