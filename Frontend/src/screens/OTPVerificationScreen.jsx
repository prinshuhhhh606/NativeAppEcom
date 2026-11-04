import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import styles from './OTPVerificationScreen.styles';
import Header from '../components/Header';
import CustomButton from '../components/CustomButton';
import AppIcon from '../components/AppIcon';
import { validateOTP } from '../utils/validation';
import { maskMobileNumber } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/colors';

export const OTPVerificationScreen = ({ route, navigation }) => {
  const {
    mobileNumber = '9876543210',
    demoOtp = '123456',
    redirectTo,
    redirectParams,
  } = route.params || {};
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const { verifyOtp, requestOtp } = useAuth();

  const handleVerify = async () => {
    const val = validateOTP(otp, 6);
    if (!val.isValid) {
      setError(val.message);
      return;
    }

    setError('');
    setLoading(true);

    try {
      await verifyOtp(mobileNumber, otp);
      Alert.alert('Verified', 'Mobile number verified successfully!', [
        {
          text: 'Continue',
          onPress: () => {
            if (redirectTo) {
              navigation.replace(redirectTo, redirectParams || {});
            } else {
              navigation.replace('MainApp');
            }
          },
        },
      ]);
    } catch (err) {
      setError(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await requestOtp(mobileNumber);
      Alert.alert('OTP Sent', `A fresh OTP has been sent to +91 ${mobileNumber}`);
    } catch (err) {
      Alert.alert('Error', 'Failed to resend OTP');
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Verification" showBack navigation={navigation} />

      <View style={styles.content}>
        <View style={styles.iconBox}>
          <AppIcon name="shield-checkmark" size={40} color={Colors.primary} />
        </View>

        <Text style={styles.title}>Enter OTP Code</Text>
        <Text style={styles.subtitle}>
          We have sent a 6-digit verification code to{'\n'}
          <Text style={styles.phoneText}>{maskMobileNumber(mobileNumber)}</Text>
        </Text>

        <View style={styles.demoHintBox}>
          <Text style={styles.demoHintText}>🔑 Demo OTP: {demoOtp}</Text>
        </View>

        <TextInput
          style={[styles.otpInput, isFocused && styles.otpInputFocused]}
          keyboardType="number-pad"
          maxLength={6}
          placeholder="••••••"
          value={otp}
          onChangeText={(t) => {
            setOtp(t);
            if (error) setError('');
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <CustomButton
          title="Verify & Continue"
          size="large"
          loading={loading}
          onPress={handleVerify}
          style={styles.verifyBtn}
        />

        <View style={styles.resendRow}>
          <Text style={styles.resendText}>Didn't receive the OTP?</Text>
          <TouchableOpacity onPress={handleResend} activeOpacity={0.7}>
            <Text style={styles.resendAction}>Resend OTP</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default OTPVerificationScreen;

