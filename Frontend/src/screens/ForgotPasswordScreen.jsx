import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from './ForgotPasswordScreen.styles';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import Header from '../components/Header';
import AppIcon from '../components/AppIcon';
import { validateEmail, validateOTP, validatePassword } from '../utils/validation';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/colors';

export const ForgotPasswordScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { forgotPassword, resetPassword } = useAuth();

  // Step 1: 'request' | Step 2: 'reset'
  const [step, setStep] = useState('request');

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  /**
   * Step 1: Send Reset OTP to Email
   */
  const handleRequestReset = async () => {
    setServerError('');
    setSuccessMessage('');

    const emailVal = validateEmail(email);
    if (!emailVal.isValid) {
      setErrors({ email: emailVal.message });
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const res = await forgotPassword(email.trim());
      setSuccessMessage(
        res.message || 'If this email is registered, a 6-digit password reset code has been sent.'
      );
      setStep('reset');
    } catch (err) {
      setServerError(err.message || 'Failed to request password reset. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Step 2: Verify OTP and Set New Password
   */
  const handleResetPassword = async () => {
    setServerError('');
    const newErrors = {};

    const otpVal = validateOTP(otp, 6);
    if (!otpVal.isValid) newErrors.otp = otpVal.message;

    const passVal = validatePassword(newPassword, 6);
    if (!passVal.isValid) newErrors.newPassword = passVal.message;

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirm password is required';
    } else if (confirmPassword !== newPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      await resetPassword(email.trim(), otp.trim(), newPassword);
      Alert.alert(
        'Password Reset Successful',
        'Your password has been updated successfully. Please log in with your new password.',
        [{ text: 'Sign In Now', onPress: () => navigation.replace('Login') }]
      );
    } catch (err) {
      setServerError(err.message || 'Invalid or expired reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Reset Password"
        showBack
        navigation={navigation}
        onBack={() => {
          if (step === 'reset') {
            setStep('request');
            setServerError('');
          } else {
            navigation.goBack();
          }
        }}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.iconBox}>
          <AppIcon name="lock-closed" size={32} color={Colors.primary} />
        </View>

        <Text style={styles.title}>
          {step === 'request' ? 'Forgot Your Password?' : 'Create New Password'}
        </Text>
        <Text style={styles.subtitle}>
          {step === 'request'
            ? 'Enter your registered customer email address. We will send a secure 6-digit verification code to reset your password.'
            : `Enter the 6-digit code sent to ${email} along with your new password.`}
        </Text>

        {serverError ? (
          <View style={styles.errorBanner}>
            <AppIcon name="alert-circle" size={18} color={Colors.danger} />
            <Text style={styles.errorText}>{serverError}</Text>
          </View>
        ) : null}

        {successMessage ? (
          <View style={styles.successBanner}>
            <AppIcon name="checkmark-circle" size={18} color="#2E7D32" />
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        ) : null}

        {step === 'request' ? (
          <View style={styles.form}>
            <CustomInput
              label="Registered Email Address"
              required
              placeholder="e.g. rahul@example.com"
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

            <CustomButton
              title="Send Verification Code"
              size="large"
              loading={loading}
              onPress={handleRequestReset}
              style={styles.submitBtn}
            />
          </View>
        ) : (
          <View style={styles.form}>
            <CustomInput
              label="6-Digit Reset Code (OTP)"
              required
              placeholder="Enter 6-digit OTP code"
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={(text) => {
                setOtp(text);
                if (errors.otp) setErrors((prev) => ({ ...prev, otp: '' }));
                if (serverError) setServerError('');
              }}
              error={errors.otp}
              leftIcon="key-outline"
            />

            <CustomInput
              label="New Password"
              required
              placeholder="Min. 6 characters"
              isPassword
              value={newPassword}
              onChangeText={(text) => {
                setNewPassword(text);
                if (errors.newPassword) setErrors((prev) => ({ ...prev, newPassword: '' }));
                if (serverError) setServerError('');
              }}
              error={errors.newPassword}
              leftIcon="lock-closed-outline"
            />

            <CustomInput
              label="Confirm New Password"
              required
              placeholder="Re-enter new password"
              isPassword
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                if (serverError) setServerError('');
              }}
              error={errors.confirmPassword}
              leftIcon="lock-closed-outline"
            />

            <CustomButton
              title="Update Password & Sign In"
              size="large"
              loading={loading}
              onPress={handleResetPassword}
              style={styles.submitBtn}
            />
          </View>
        )}

        <TouchableOpacity
          style={styles.backToLoginBtn}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.7}>
          <AppIcon name="arrow-back" size={16} color={Colors.primary} />
          <Text style={styles.backToLoginText}>Back to Sign In</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default ForgotPasswordScreen;

