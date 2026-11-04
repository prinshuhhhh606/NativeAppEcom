import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from './DeliveryLoginScreen.styles';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import AppIcon from '../components/AppIcon';
import { validateEmail, validatePassword } from '../utils/validation';
import { useAuth } from '../context/AuthContext';

export const DeliveryLoginScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { deliveryLogin } = useAuth();

  const [email, setEmail] = useState('delivery@appecom.in');
  const [password, setPassword] = useState('Delivery@12345');
  const [rememberMe, setRememberMe] = useState(true);

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleQuickFill = () => {
    setEmail('delivery@appecom.in');
    setPassword('Delivery@12345');
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
      await deliveryLogin(email.trim(), password, rememberMe);
      navigation.replace('DeliveryDashboard');
    } catch (err) {
      const message = err.message || 'Invalid delivery partner email or password.';
      setServerError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A192F" />

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
        {/* Delivery Partner Portal Header */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <AppIcon name="bicycle" size={36} color="#FFFFFF" />
          </View>
          <Text style={styles.title}>AppsicaEcom Fleet Hub</Text>
          <Text style={styles.subtitle}>
            Delivery Partner Portal • Last-Mile Dispatch & Instant Earnings
          </Text>
        </View>

        {/* Error Alert */}
        {serverError ? (
          <View style={styles.errorBanner}>
            <AppIcon name="alert-circle" size={18} color="#EF4444" />
            <Text style={styles.errorText}>{serverError}</Text>
          </View>
        ) : null}

        {/* Login Form */}
        <View style={styles.form}>
          <CustomInput
            label="Delivery Partner Email"
            value={email}
            onChangeText={(txt) => {
              setEmail(txt);
              if (errors.email) setErrors({ ...errors, email: null });
            }}
            placeholder="rider@appecom.in"
            keyboardType="email-address"
            autoCapitalize="none"
            icon="mail"
            error={errors.email}
          />

          <CustomInput
            label="Password"
            value={password}
            onChangeText={(txt) => {
              setPassword(txt);
              if (errors.password) setErrors({ ...errors, password: null });
            }}
            placeholder="Enter your password"
            secureTextEntry
            icon="lock-closed"
            error={errors.password}
          />

          <CustomButton
            title={loading ? 'Verifying Rider Account...' : 'Enter Fleet Dashboard'}
            onPress={handleSubmit}
            loading={loading}
            size="large"
            iconRight="arrow-forward"
            style={{ marginTop: 8, backgroundColor: '#0D9488' }}
          />
        </View>

        {/* Register Partner Card */}
        <TouchableOpacity
          style={{
            marginTop: 16,
            backgroundColor: 'rgba(13, 148, 136, 0.12)',
            borderRadius: 12,
            padding: 14,
            borderWidth: 1,
            borderColor: '#0D9488',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
          onPress={() => navigation.navigate('DeliveryRegister')}
          activeOpacity={0.85}>
          <View>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#F0FDFA' }}>
              Want to Earn as a Delivery Rider?
            </Text>
            <Text style={{ fontSize: 11, color: '#2DD4BF', marginTop: 2 }}>
              Onboard your bike & start delivering today →
            </Text>
          </View>
          <AppIcon name="arrow-forward" size={18} color="#2DD4BF" />
        </TouchableOpacity>

        {/* Quick Fill Authorized Demo Partner */}
        <View style={styles.quickFillCard}>
          <Text style={styles.quickFillTitle}>1-Click Authorized Demo Account</Text>
          <TouchableOpacity
            style={styles.quickFillBtn}
            onPress={handleQuickFill}
            activeOpacity={0.8}>
            <View>
              <Text style={styles.quickFillText}>delivery@appecom.in</Text>
              <Text style={styles.quickFillSub}>Rider: Rajesh Kumar (DL-04-CK-8821)</Text>
            </View>
            <AppIcon name="flash" size={18} color="#2DD4BF" />
          </TouchableOpacity>
        </View>

        {/* Portal Switcher */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 16,
            marginTop: 20,
            marginBottom: 8,
          }}>
          <TouchableOpacity onPress={() => navigation.navigate('MainApp')}>
            <Text style={{ fontSize: 12, color: '#94A3B8', fontWeight: '600' }}>🛒 Customer Store</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('SellerLogin')}>
            <Text style={{ fontSize: 12, color: '#818CF8', fontWeight: '600' }}>🏪 Seller Studio</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('AdminLogin')}>
            <Text style={{ fontSize: 12, color: '#F87171', fontWeight: '600' }}>🛡️ Admin Portal</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default DeliveryLoginScreen;

