import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from './AddAddressScreen.styles';
import Header from '../components/Header';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import AppIcon from '../components/AppIcon';
import { validateAddress } from '../utils/validation';
import { findPincodeInfo } from '../models/pincodeModel';
import { addressService } from '../services/addressService';
import { useAuth } from '../context/AuthContext';

export const AddAddressScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const { addressToEdit } = route.params || {};
  const isEditing = Boolean(addressToEdit);

  const [fullName, setFullName] = useState(addressToEdit?.fullName || '');
  const [mobileNumber, setMobileNumber] = useState(
    addressToEdit?.mobileNumber || addressToEdit?.phone || ''
  );
  const [pincode, setPincode] = useState(
    addressToEdit?.pincode || addressToEdit?.pinCode || ''
  );
  const [streetAddress, setStreetAddress] = useState(
    addressToEdit?.streetAddress || addressToEdit?.addressLine1 || ''
  );
  const [landmark, setLandmark] = useState(addressToEdit?.landmark || '');
  const [city, setCity] = useState(addressToEdit?.city || '');
  const [state, setState] = useState(addressToEdit?.state || '');
  const [addressType, setAddressType] = useState(addressToEdit?.addressType || 'Home');
  const [isDefault, setIsDefault] = useState(Boolean(addressToEdit?.isDefault));
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handlePincodeChange = (pin) => {
    setPincode(pin);
    if (pin.length === 6) {
      const info = findPincodeInfo(pin);
      if (info && info.isServiceable) {
        if (!city) setCity(info.city);
        if (!state) setState(info.state);
      }
    }
  };

  const handleSave = async () => {
    if (!isAuthenticated) {
      Alert.alert('Sign In Required', 'Please sign in to save a delivery address.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign In',
          onPress: () => navigation.navigate('Login', { redirectTo: 'AddAddress' }),
        },
      ]);
      return;
    }

    const payload = {
      fullName: fullName.trim(),
      mobileNumber: mobileNumber.trim(),
      pincode: pincode.trim(),
      streetAddress: streetAddress.trim(),
      landmark: landmark.trim(),
      city: city.trim(),
      state: state.trim(),
      addressType,
      isDefault,
    };

    const val = validateAddress(payload);
    if (!val.isValid) {
      setErrors(val.errors);
      Alert.alert('Validation Error', 'Please complete all required address fields correctly.');
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      if (isEditing) {
        await addressService.updateAddress(addressToEdit.id || addressToEdit._id, payload);
        Alert.alert('Address Updated', 'Delivery address details saved successfully.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        await addressService.addAddress(payload);
        Alert.alert('Address Saved', 'New delivery address added successfully.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to save delivery address');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title={isEditing ? 'Edit Delivery Address' : 'Add Delivery Address'}
        showBack
        navigation={navigation}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>
          {isEditing ? 'Update Address Details' : 'Pan India Shipping Details'}
        </Text>
        <Text style={styles.subtitle}>
          Ensure your contact details & 6-digit Indian PIN code are accurate for reliable delivery.
        </Text>

        <CustomInput
          label="Full Name"
          required
          placeholder="e.g. Rahul Sharma"
          value={fullName}
          onChangeText={setFullName}
          error={errors.fullName}
        />

        <CustomInput
          label="10-Digit Mobile Number"
          required
          placeholder="98765 43210"
          keyboardType="phone-pad"
          maxLength={10}
          value={mobileNumber}
          onChangeText={setMobileNumber}
          error={errors.mobileNumber}
        />

        <View style={styles.rowInputs}>
          <CustomInput
            label="PIN Code"
            required
            placeholder="e.g. 560001"
            keyboardType="number-pad"
            maxLength={6}
            value={pincode}
            onChangeText={handlePincodeChange}
            error={errors.pincode}
            style={styles.halfInput}
          />
          <CustomInput
            label="City / District"
            required
            placeholder="City"
            value={city}
            onChangeText={setCity}
            error={errors.city}
            style={styles.halfInput}
          />
        </View>

        <CustomInput
          label="State"
          required
          placeholder="e.g. Karnataka / Delhi / Maharashtra"
          value={state}
          onChangeText={setState}
          error={errors.state}
        />

        <CustomInput
          label="House No., Building, Street, Area"
          required
          placeholder="Flat 402, Lotus Towers, 5th Main Road"
          multiline
          numberOfLines={2}
          value={streetAddress}
          onChangeText={setStreetAddress}
          error={errors.streetAddress}
        />

        <CustomInput
          label="Landmark (Optional)"
          placeholder="Near Fortis Hospital"
          value={landmark}
          onChangeText={setLandmark}
        />

        <Text style={styles.typeLabel}>Address Type</Text>
        <View style={styles.typeRow}>
          {['Home', 'Work', 'Other'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.typeButton,
                addressType === type && styles.typeButtonSelected,
              ]}
              onPress={() => setAddressType(type)}>
              <Text
                style={[
                  styles.typeButtonText,
                  addressType === type && styles.typeButtonTextSelected,
                ]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setIsDefault(!isDefault)}
          activeOpacity={0.8}>
          <View style={[styles.checkbox, isDefault && styles.checkboxChecked]}>
            {isDefault && <AppIcon name="checkmark" size={14} color="#FFF" />}
          </View>
          <Text style={styles.checkboxLabel}>Make this my default delivery address</Text>
        </TouchableOpacity>

        <CustomButton
          title={isEditing ? 'Update Address' : 'Save Address'}
          size="large"
          loading={loading}
          onPress={handleSave}
          style={styles.submitBtn}
        />
      </ScrollView>
    </View>
  );
};

export default AddAddressScreen;
