import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from './PincodeModal.styles';
import { Colors } from '../constants/colors';
import AppIcon from './AppIcon';
import CustomButton from './CustomButton';
import Badge from './Badge';
import { useLocation } from '../context/LocationContext';
import { validatePincode } from '../utils/validation';

const POPULAR_PINCODES = [
  { city: 'New Delhi', pincode: '110001' },
  { city: 'Mumbai', pincode: '400001' },
  { city: 'Bengaluru', pincode: '560001' },
  { city: 'Kolkata', pincode: '700001' },
  { city: 'Chennai', pincode: '600001' },
  { city: 'Hyderabad', pincode: '500001' },
  { city: 'Ahmedabad', pincode: '380001' },
  { city: 'Jaipur', pincode: '302001' },
];

export const PincodeModal = () => {
  const insets = useSafeAreaInsets();
  const {
    isPincodeModalVisible,
    closePincodeModal,
    checkAndSetPincode,
    selectedPincode,
    cityName,
    stateName,
    codAvailable,
    deliveryDays,
    isLoadingPincode,
  } = useLocation();

  const [inputPincode, setInputPincode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successInfo, setSuccessInfo] = useState(null);

  const handleCheck = async (codeToCheck) => {
    const pin = (codeToCheck || inputPincode).trim();
    const validation = validatePincode(pin);

    if (!validation.isValid) {
      setErrorMessage(validation.message);
      setSuccessInfo(null);
      return;
    }

    setErrorMessage('');
    const res = await checkAndSetPincode(pin);

    if (res.success) {
      setSuccessInfo(res.data);
      setTimeout(() => {
        closePincodeModal();
      }, 1200);
    } else {
      setSuccessInfo(null);
      setErrorMessage(res.message);
    }
  };

  const handleChipSelect = (pin) => {
    setInputPincode(pin);
    handleCheck(pin);
  };

  return (
    <Modal
      visible={isPincodeModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={closePincodeModal}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}>
        <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Pan India Delivery PIN Code</Text>
            <TouchableOpacity
              onPress={closePincodeModal}
              style={styles.closeBtn}
              activeOpacity={0.7}>
              <AppIcon name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Enter your 6-digit Indian PIN code to view accurate delivery dates, shipping charges, and COD availability.
          </Text>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="e.g. 560001"
              placeholderTextColor={Colors.textMuted}
              keyboardType="number-pad"
              maxLength={6}
              value={inputPincode}
              onChangeText={(text) => {
                setInputPincode(text);
                if (errorMessage) setErrorMessage('');
              }}
            />
            <CustomButton
              title="Apply"
              size="medium"
              onPress={() => handleCheck()}
              loading={isLoadingPincode}
              style={styles.checkButton}
            />
          </View>

          {errorMessage ? (
            <View style={styles.errorBanner}>
              <AppIcon name="alert-circle-outline" size={20} color={Colors.danger} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {successInfo ? (
            <View style={styles.resultCard}>
              <Text style={styles.resultTitle}>✓ Serviceable in your area!</Text>
              <Text style={styles.resultLocation}>
                {successInfo.city}, {successInfo.state} ({successInfo.pincode})
              </Text>
              <View style={styles.badgeRow}>
                <Badge text={`⚡ Delivery in ${successInfo.deliveryDays} Days`} variant="success" />
                {successInfo.codAvailable && <Badge text="💵 Cash on Delivery Available" variant="primary" />}
                <Badge text="🚚 Free Shipping > ₹499" variant="discount" />
              </View>
            </View>
          ) : null}

          <Text style={styles.popularTitle}>Quick Select Major Cities</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipsContainer}>
              {POPULAR_PINCODES.map((item) => {
                const isActive = item.pincode === selectedPincode;
                return (
                  <TouchableOpacity
                    key={item.pincode}
                    style={[styles.chip, isActive && styles.chipActive]}
                    onPress={() => handleChipSelect(item.pincode)}
                    activeOpacity={0.7}>
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                      {item.city} ({item.pincode})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default PincodeModal;

