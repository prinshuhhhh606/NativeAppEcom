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
import { styles } from './DeliveryRegisterScreen.styles';
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

export const DeliveryRegisterScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { deliveryRegister } = useAuth();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [vehicleType, setVehicleType] = useState('Bike');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [drivingLicenseNumber, setDrivingLicenseNumber] = useState('');
  const [city, setCity] = useState('New Delhi');
  const [pinCode, setPinCode] = useState('110001');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const vehicleOptions = ['Bike', 'Scooter', 'EV Bike', 'Van'];

  const handleRegister = async () => {
    setServerError('');
    const newErrors = {};

    const nameVal = validateName(name);
    if (!nameVal.isValid) newErrors.name = nameVal.message;

    const mobVal = validateIndianMobile(phone);
    if (!mobVal.isValid) newErrors.phone = mobVal.message;

    const emailVal = validateEmail(email);
    if (!emailVal.isValid) newErrors.email = emailVal.message;

    if (!vehicleNumber.trim()) newErrors.vehicleNumber = 'Vehicle registration number is required';
    if (!drivingLicenseNumber.trim()) newErrors.drivingLicenseNumber = 'Driving license number is required';

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
      await deliveryRegister({
        name: name.trim(),
        phone: mobVal.cleaned,
        email: email.trim().toLowerCase(),
        vehicleType,
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        drivingLicenseNumber: drivingLicenseNumber.trim().toUpperCase(),
        city: city.trim() || 'New Delhi',
        pinCode: pinCode.trim() || '110001',
        password,
      });

      Alert.alert(
        'Rider Onboarded!',
        'Welcome to the AppsicaEcom Delivery Fleet! Your profile is approved and ready for dispatch assignments.',
        [{ text: 'Enter Fleet Hub', onPress: () => navigation.replace('DeliveryDashboard') }]
      );
    } catch (err) {
      setServerError(err.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A192F" />
      <Header title="Delivery Partner Signup" showBack navigation={navigation} />

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
              <AppIcon name="bicycle" size={30} color="#FFF" />
            </View>
            <Text style={styles.title}>Join as Delivery Partner</Text>
            <Text style={styles.subtitle}>
              Flexible shifts, daily payouts & Pan India delivery bonuses
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
              label="Rider Full Name"
              required
              placeholder="e.g. Rajesh Kumar"
              value={name}
              onChangeText={(t) => {
                setName(t);
                if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
              }}
              error={errors.name}
              leftIcon="person-outline"
            />

            <CustomInput
              label="Mobile Number (Active SIM)"
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

            <CustomInput
              label="Email Address"
              required
              placeholder="rider@example.in"
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

            {/* Vehicle Selection */}
            <View>
              <Text style={styles.vehicleSelectorTitle}>Vehicle Type</Text>
              <View style={styles.vehicleRow}>
                {vehicleOptions.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.vehicleChip,
                      vehicleType === type && styles.vehicleChipActive,
                    ]}
                    onPress={() => setVehicleType(type)}
                    activeOpacity={0.8}>
                    <Text
                      style={[
                        styles.vehicleChipText,
                        vehicleType === type && styles.vehicleChipTextActive,
                      ]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.rowInputs}>
              <View style={{ flex: 1 }}>
                <CustomInput
                  label="Vehicle Number"
                  required
                  placeholder="DL-04-AB-1234"
                  autoCapitalize="characters"
                  value={vehicleNumber}
                  onChangeText={(t) => {
                    setVehicleNumber(t);
                    if (errors.vehicleNumber) setErrors((prev) => ({ ...prev, vehicleNumber: null }));
                  }}
                  error={errors.vehicleNumber}
                />
              </View>
              <View style={{ flex: 1 }}>
                <CustomInput
                  label="Driving License No."
                  required
                  placeholder="DL14201100123"
                  autoCapitalize="characters"
                  value={drivingLicenseNumber}
                  onChangeText={(t) => {
                    setDrivingLicenseNumber(t);
                    if (errors.drivingLicenseNumber)
                      setErrors((prev) => ({ ...prev, drivingLicenseNumber: null }));
                  }}
                  error={errors.drivingLicenseNumber}
                />
              </View>
            </View>

            <View style={styles.rowInputs}>
              <View style={{ flex: 1 }}>
                <CustomInput
                  label="City"
                  placeholder="New Delhi"
                  value={city}
                  onChangeText={setCity}
                  leftIcon="location-outline"
                />
              </View>
              <View style={{ flex: 1 }}>
                <CustomInput
                  label="PIN Code"
                  placeholder="110001"
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
              title={loading ? 'Creating Rider Account...' : 'Register as Delivery Partner'}
              onPress={handleRegister}
              loading={loading}
              size="large"
              style={styles.submitBtn}
            />

            <Text style={styles.termsText}>
              By registering, you agree to the{' '}
              <Text style={styles.termsHighlight}>Delivery Partner Agreement & Safety Code</Text>.
            </Text>
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already registered as delivery rider?</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('DeliveryLogin')}
              activeOpacity={0.7}>
              <Text style={styles.loginLink}>Login to Fleet Hub</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default DeliveryRegisterScreen;

