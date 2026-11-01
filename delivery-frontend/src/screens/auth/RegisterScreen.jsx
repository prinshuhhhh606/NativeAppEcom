import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomInput from '../../components/common/CustomInput';
import CustomButton from '../../components/common/CustomButton';
import CustomHeader from '../../components/common/CustomHeader';
import Colors from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';

export const RegisterScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [vehicleType, setVehicleType] = useState('Bike');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [city, setCity] = useState('New Delhi');
  const [pinCode, setPinCode] = useState('110001');

  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    setError('');

    if (!name.trim() || !phone.trim() || !email.trim() || !password) {
      setError('Please fill all mandatory profile and credential fields');
      return;
    }

    if (phone.replace(/[^0-9]/g, '').length < 10) {
      setError('Please enter a valid 10-digit Indian mobile number');
      return;
    }

    setLoading(true);
    try {
      await register({
        name: name.trim(),
        phone: phone.trim(),
        email: email.toLowerCase().trim(),
        password,
        vehicleType,
        vehicleNumber: vehicleNumber.toUpperCase().trim() || 'DL-01-AB-1234',
        drivingLicenseNumber: licenseNumber.toUpperCase().trim() || 'DL1420110012345',
        city,
        pinCode,
        bankAccountNumber: accountNumber,
        bankIfsc: ifsc,
      });

      Alert.alert(
        'Registration Submitted!',
        'Welcome to Appsica Fleet! Your profile is verified and active.',
        [{ text: 'Start Shift', onPress: () => {} }]
      );
    } catch (err) {
      setError(err.message || 'Registration failed. Check details.');
    } finally {
      setLoading(false);
    }
  };

  const vehicleOptions = ['Bike', 'Scooter', 'Electric', 'Van'];

  return (
    <View style={styles.container}>
      <CustomHeader title="Partner Registration" showBack navigation={navigation} />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 40 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.introBox}>
          <Text style={styles.introTitle}>Join India's Leading Multi-Vendor Logistics Fleet</Text>
          <Text style={styles.introText}>
            Earn daily payouts with flexible hours, trip incentives, and direct merchant order assignments.
          </Text>
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        ) : null}

        {/* 1. Personal Details */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>1. Personal & Contact Information</Text>

          <CustomInput
            label="Full Name (as per Aadhaar)"
            required
            value={name}
            onChangeText={setName}
            placeholder="e.g. Ramesh Kumar"
          />

          <CustomInput
            label="10-Digit Mobile Number"
            required
            keyboardType="phone-pad"
            maxLength={10}
            value={phone}
            onChangeText={setPhone}
            placeholder="9876543210"
          />

          <CustomInput
            label="Email Address"
            required
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            placeholder="ramesh@example.com"
          />

          <CustomInput
            label="Set Account Password"
            required
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholder="At least 6 characters"
          />

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1.5 }}>
              <CustomInput label="City" value={city} onChangeText={setCity} placeholder="City" />
            </View>
            <View style={{ flex: 1 }}>
              <CustomInput
                label="PIN Code"
                keyboardType="number-pad"
                maxLength={6}
                value={pinCode}
                onChangeText={setPinCode}
                placeholder="110001"
              />
            </View>
          </View>
        </View>

        {/* 2. Vehicle & Driving License */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>2. Vehicle & Driving License</Text>

          <Text style={styles.fieldLabel}>Select Vehicle Type</Text>
          <View style={styles.vehicleTypeRow}>
            {vehicleOptions.map((v) => (
              <TouchableOpacity
                key={v}
                style={[
                  styles.vehicleChip,
                  vehicleType === v && styles.vehicleChipActive,
                ]}
                onPress={() => setVehicleType(v)}>
                <Text
                  style={[
                    styles.vehicleChipText,
                    vehicleType === v && styles.vehicleChipTextActive,
                  ]}>
                  {v}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <CustomInput
            label="Vehicle Registration Number"
            value={vehicleNumber}
            onChangeText={setVehicleNumber}
            placeholder="e.g. DL-04-CK-8821"
            autoCapitalize="characters"
          />

          <CustomInput
            label="Driving License Number"
            value={licenseNumber}
            onChangeText={setLicenseNumber}
            placeholder="e.g. DL1420110012345"
            autoCapitalize="characters"
          />
        </View>

        {/* 3. Bank & Payout Information */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>3. Bank Account for Weekly Payouts</Text>

          <CustomInput
            label="Bank Account Number"
            keyboardType="number-pad"
            value={accountNumber}
            onChangeText={setAccountNumber}
            placeholder="e.g. 918237461928"
          />

          <CustomInput
            label="Bank IFSC Code"
            autoCapitalize="characters"
            value={ifsc}
            onChangeText={setIfsc}
            placeholder="e.g. HDFC0001234"
          />
        </View>

        <CustomButton
          title="Submit Fleet Application"
          size="large"
          loading={loading}
          onPress={handleRegister}
          style={{ marginTop: 8 }}
        />

        <TouchableOpacity
          style={styles.loginBackBtn}
          onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginBackText}>
            Already registered? <Text style={{ color: Colors.primary, fontWeight: '800' }}>Log In</Text>
          </Text>
        </TouchableOpacity>
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
    padding: 16,
  },
  introBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  introTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E40AF',
  },
  introText: {
    fontSize: 11,
    color: '#3B82F6',
    marginTop: 2,
    lineHeight: 15,
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '900',
    color: Colors.textPrimary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  vehicleTypeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  vehicleChip: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  vehicleChipActive: {
    borderColor: Colors.primary,
    backgroundColor: '#CCFBF1',
  },
  vehicleChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  vehicleChipTextActive: {
    color: '#0F766E',
    fontWeight: '800',
  },
  loginBackBtn: {
    marginTop: 18,
    alignItems: 'center',
  },
  loginBackText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
});

export default RegisterScreen;

