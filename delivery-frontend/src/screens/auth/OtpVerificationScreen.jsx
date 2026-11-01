import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import CustomInput from '../../components/common/CustomInput';
import CustomButton from '../../components/common/CustomButton';
import CustomHeader from '../../components/common/CustomHeader';
import Colors from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { deliveryService } from '../../services/deliveryService';

export const OtpVerificationScreen = ({ navigation }) => {
  const { login } = useAuth();
  const [phone, setPhone] = useState('9876543212');
  const [otp, setOtp] = useState('4521');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!phone || phone.length < 10) {
      Alert.alert('Phone Required', 'Please enter a valid 10-digit mobile number');
      return;
    }
    setLoading(true);
    try {
      const res = await deliveryService.sendOtp(phone);
      setOtpSent(true);
      Alert.alert('OTP Sent', `4-digit verification code sent to +91 ${phone}. Demo code: ${res.debugOtp || '4521'}`);
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 4) {
      Alert.alert('OTP Required', 'Please enter the 4-digit code');
      return;
    }
    setLoading(true);
    try {
      await deliveryService.verifyOtp(phone, otp);
      await login(phone, 'Delivery@12345');
    } catch (e) {
      Alert.alert('Verification Failed', e.message || 'Incorrect OTP code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <CustomHeader title="Mobile OTP Login" showBack navigation={navigation} />

      <View style={styles.content}>
        <Text style={styles.title}>Fast Sign In with Mobile</Text>
        <Text style={styles.subtitle}>
          Enter your registered 10-digit mobile number to receive a secure login verification code.
        </Text>

        <CustomInput
          label="Registered Mobile Number"
          required
          keyboardType="phone-pad"
          maxLength={10}
          value={phone}
          onChangeText={setPhone}
          placeholder="9876543212"
          leftIcon="📞"
        />

        {otpSent && (
          <CustomInput
            label="4-Digit OTP Code"
            required
            keyboardType="number-pad"
            maxLength={4}
            value={otp}
            onChangeText={setOtp}
            placeholder="••••"
            leftIcon="🔒"
          />
        )}

        <CustomButton
          title={otpSent ? 'Verify OTP & Enter App' : 'Send Verification Code'}
          size="large"
          loading={loading}
          onPress={otpSent ? handleVerifyOtp : handleSendOtp}
          style={{ marginTop: 10 }}
        />

        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.backText}>← Back to Password Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
    marginTop: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 20,
    lineHeight: 17,
  },
  backBtn: {
    marginTop: 24,
    alignItems: 'center',
  },
  backText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '700',
  },
});

export default OtpVerificationScreen;

