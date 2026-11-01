import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomInput from '../../components/common/CustomInput';
import CustomButton from '../../components/common/CustomButton';
import Colors from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';

export const LoginScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState('delivery@appecom.in');
  const [password, setPassword] = useState('Delivery@12345');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleQuickFill = (demoEmail, demoPass) => {
    setIdentifier(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  const handleSubmit = async () => {
    setError('');
    if (!identifier.trim() || !password) {
      setError('Please enter your mobile or email, and password');
      return;
    }

    setLoading(true);
    try {
      await login(identifier.trim(), password, rememberMe);
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top > 0 ? insets.top + 24 : 36,
            paddingBottom: insets.bottom + 24,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* Fleet Branding */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoEmoji}>🛵</Text>
          </View>
          <Text style={styles.title}>Appsica Fleet</Text>
          <Text style={styles.subtitle}>
            Pan-India Delivery Partner App • Last-Mile Dispatch & Instant Earnings
          </Text>
        </View>

        {/* Error Alert */}
        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Login Form */}
        <View style={styles.formCard}>
          <CustomInput
            label="Email or 10-Digit Mobile Number"
            required
            value={identifier}
            onChangeText={(txt) => {
              setIdentifier(txt);
              if (error) setError('');
            }}
            placeholder="e.g. delivery@appecom.in or 9876543212"
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon="✉️"
          />

          <CustomInput
            label="Account Password"
            required
            value={password}
            onChangeText={(txt) => {
              setPassword(txt);
              if (error) setError('');
            }}
            placeholder="Enter password"
            secureTextEntry
            leftIcon="🔒"
          />

          <View style={styles.rememberRow}>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setRememberMe(!rememberMe)}
              activeOpacity={0.8}>
              <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                {rememberMe && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.rememberText}>Keep me logged in</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('OtpVerification')}>
              <Text style={styles.forgotText}>Login with OTP</Text>
            </TouchableOpacity>
          </View>

          <CustomButton
            title="Log In to Fleet Hub"
            size="large"
            loading={loading}
            onPress={handleSubmit}
            style={{ marginTop: 8 }}
          />
        </View>

        {/* 1-Click Authorized Demo Account */}
        <View style={styles.demoCard}>
          <Text style={styles.demoTitle}>Authorized Demo Rider</Text>
          <TouchableOpacity
            style={styles.demoBtn}
            onPress={() => handleQuickFill('delivery@appecom.in', 'Delivery@12345')}
            activeOpacity={0.8}>
            <View>
              <Text style={styles.demoEmail}>delivery@appecom.in</Text>
              <Text style={styles.demoSub}>Rajesh Kumar • Honda Activa (DL-04-CK-8821)</Text>
            </View>
            <Text style={styles.quickFillBadge}>AUTO FILL ⚡</Text>
          </TouchableOpacity>
        </View>

        {/* Registration Link */}
        <View style={styles.registerRow}>
          <Text style={styles.registerPrompt}>New Delivery Partner?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLink}>Register & Apply for Fleet</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 20,
    justifyContent: 'center',
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  logoEmoji: {
    fontSize: 34,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 17,
    maxWidth: 290,
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  errorIcon: {
    fontSize: 14,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  formCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  rememberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 2,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  checkboxActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkmark: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '900',
  },
  rememberText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  forgotText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
  },
  demoCard: {
    backgroundColor: '#F0FDFA',
    borderRadius: 16,
    padding: 14,
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  demoTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F766E',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  demoBtn: {
    backgroundColor: Colors.white,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#99F6E4',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  demoEmail: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  demoSub: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 1,
  },
  quickFillBadge: {
    fontSize: 10,
    fontWeight: '900',
    color: '#0D9488',
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    gap: 6,
  },
  registerPrompt: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  registerLink: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
  },
});

export default LoginScreen;

