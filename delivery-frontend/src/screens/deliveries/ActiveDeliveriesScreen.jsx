import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomHeader from '../../components/common/CustomHeader';
import DeliveryCard from '../../components/cards/DeliveryCard';
import CustomButton from '../../components/common/CustomButton';
import Colors from '../../constants/colors';
import { useDelivery } from '../../context/DeliveryContext';
import { deliveryService } from '../../services/deliveryService';

export const ActiveDeliveriesScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const {
    activeDeliveries,
    loading,
    fetchActiveDeliveries,
    verifyPickupOtp,
    verifyDeliveryOtp,
    reportFailure,
  } = useDelivery();

  // Modal States
  const [pickupModalDelivery, setPickupModalDelivery] = useState(null);
  const [pickupOtpInput, setPickupOtpInput] = useState('');

  const [deliveryModalDelivery, setDeliveryModalDelivery] = useState(null);
  const [deliveryOtpInput, setDeliveryOtpInput] = useState('');

  const [issueModalDelivery, setIssueModalDelivery] = useState(null);
  const [issueReason, setIssueReason] = useState('customer_unavailable');
  const [issueNotes, setIssueNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);

  // Step Action Decider
  const handleDeliveryAction = async (delivery) => {
    const status = delivery.status;
    const delId = delivery._id || delivery.deliveryNumber;

    if (status === 'assigned' || status === 'accepted') {
      // Step 1: Mark Reached Pickup
      try {
        await deliveryService.reachedPickup(delId);
        Alert.alert('Reached Store', 'Please collect package from store and ask for 4-digit pickup OTP.');
        fetchActiveDeliveries();
      } catch (e) {
        Alert.alert('Error', e.message);
      }
    } else if (status === 'reached_pickup') {
      // Step 2: Open Pickup OTP Modal
      setPickupModalDelivery(delivery);
      setPickupOtpInput(delivery.pickupOtp || '7821');
    } else if (status === 'picked_up') {
      // Step 3: Start Out For Delivery
      try {
        await deliveryService.outForDelivery(delId);
        Alert.alert('In Transit', 'Package is marked Out for Delivery. Navigate to customer doorstep.');
        fetchActiveDeliveries();
      } catch (e) {
        Alert.alert('Error', e.message);
      }
    } else if (status === 'out_for_delivery') {
      // Step 4: Reached Customer Doorstep
      try {
        await deliveryService.reachedCustomer(delId);
        Alert.alert('Reached Customer', 'Ring customer doorbell and request 4-digit delivery verification OTP.');
        fetchActiveDeliveries();
      } catch (e) {
        Alert.alert('Error', e.message);
      }
    } else if (status === 'reached_customer') {
      // Step 5: Open Customer Delivery OTP Modal
      setDeliveryModalDelivery(delivery);
      setDeliveryOtpInput(delivery.deliveryOtp || '4521');
    }
  };

  const getActionLabel = (status) => {
    switch (status) {
      case 'assigned':
      case 'accepted':
        return '1. Mark Reached Store Pickup 🏪';
      case 'reached_pickup':
        return '2. Verify Store Pickup OTP 🔐';
      case 'picked_up':
        return '3. Start Out For Delivery 🛵';
      case 'out_for_delivery':
        return '4. Mark Reached Customer 📍';
      case 'reached_customer':
        return '5. Verify Customer Delivery OTP & Complete 🎉';
      default:
        return 'View Delivery Details';
    }
  };

  const submitPickupOtp = async () => {
    if (!pickupOtpInput || pickupOtpInput.length < 4) {
      Alert.alert('OTP Required', 'Enter 4-digit store pickup OTP');
      return;
    }
    setSubmitting(true);
    try {
      await verifyPickupOtp(pickupModalDelivery._id || pickupModalDelivery.deliveryNumber, pickupOtpInput);
      setPickupModalDelivery(null);
    } catch (e) {
      // handled
    } finally {
      setSubmitting(false);
    }
  };

  const submitDeliveryOtp = async () => {
    if (!deliveryOtpInput || deliveryOtpInput.length < 4) {
      Alert.alert('OTP Required', 'Enter 4-digit customer delivery OTP');
      return;
    }
    setSubmitting(true);
    try {
      await verifyDeliveryOtp(deliveryModalDelivery._id || deliveryModalDelivery.deliveryNumber, {
        otp: deliveryOtpInput,
      });
      setDeliveryModalDelivery(null);
    } catch (e) {
      // handled
    } finally {
      setSubmitting(false);
    }
  };

  const submitIssue = async () => {
    setSubmitting(true);
    try {
      await reportFailure(issueModalDelivery._id || issueModalDelivery.deliveryNumber, {
        reason: issueReason,
        notes: issueNotes,
      });
      setIssueModalDelivery(null);
    } catch (e) {
      // handled
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <CustomHeader
        title="Active Deliveries"
        subtitle={`${activeDeliveries.length} orders in transit`}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 80 },
        ]}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchActiveDeliveries} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}>
        {activeDeliveries.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🛵</Text>
            <Text style={styles.emptyTitle}>No In-Progress Deliveries</Text>
            <Text style={styles.emptySub}>
              Accept incoming requests from the Requests tab to start a delivery run.
            </Text>
          </View>
        ) : (
          activeDeliveries.map((item) => (
            <View key={item._id || item.deliveryNumber}>
              <DeliveryCard
                delivery={item}
                actionLabel={getActionLabel(item.status)}
                onAction={() => handleDeliveryAction(item)}
              />
              <TouchableOpacity
                style={styles.issueBtn}
                onPress={() => {
                  setIssueModalDelivery(item);
                  setIssueNotes('');
                }}>
                <Text style={styles.issueText}>⚠️ Report Delivery Issue / Customer Unavailable</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* 1. Store Pickup OTP Modal */}
      <Modal visible={!!pickupModalDelivery} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Enter Store Pickup OTP</Text>
            <Text style={styles.modalSub}>
              Ask store staff at{' '}
              <Text style={{ fontWeight: '800' }}>
                {pickupModalDelivery?.pickupAddress?.storeName || 'Merchant'}
              </Text>{' '}
              for the 4-digit handover OTP.
            </Text>

            <TextInput
              style={styles.otpInput}
              value={pickupOtpInput}
              onChangeText={setPickupOtpInput}
              keyboardType="number-pad"
              maxLength={4}
              placeholder="••••"
            />

            <View style={styles.modalActions}>
              <CustomButton
                title="Cancel"
                variant="outline"
                size="medium"
                onPress={() => setPickupModalDelivery(null)}
                style={{ flex: 1 }}
              />
              <CustomButton
                title="Verify Pickup"
                variant="primary"
                size="medium"
                loading={submitting}
                onPress={submitPickupOtp}
                style={{ flex: 1.5 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* 2. Customer Delivery OTP Modal */}
      <Modal visible={!!deliveryModalDelivery} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Enter Customer Delivery OTP</Text>
            <Text style={styles.modalSub}>
              Ask recipient{' '}
              <Text style={{ fontWeight: '800' }}>
                {deliveryModalDelivery?.deliveryAddress?.fullName || 'Customer'}
              </Text>{' '}
              for their 4-digit delivery security code.
            </Text>

            <TextInput
              style={styles.otpInput}
              value={deliveryOtpInput}
              onChangeText={setDeliveryOtpInput}
              keyboardType="number-pad"
              maxLength={4}
              placeholder="••••"
            />

            {deliveryModalDelivery?.paymentMethod === 'COD' && (
              <View style={styles.codAlert}>
                <Text style={styles.codAlertText}>
                  💵 Collect {deliveryModalDelivery?.codAmount || 1899} in Cash before verifying OTP!
                </Text>
              </View>
            )}

            <View style={styles.modalActions}>
              <CustomButton
                title="Cancel"
                variant="outline"
                size="medium"
                onPress={() => setDeliveryModalDelivery(null)}
                style={{ flex: 1 }}
              />
              <CustomButton
                title="Verify & Complete"
                variant="primary"
                size="medium"
                loading={submitting}
                onPress={submitDeliveryOtp}
                style={{ flex: 1.6 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* 3. Delivery Issue Report Modal */}
      <Modal visible={!!issueModalDelivery} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Report Delivery Issue</Text>
            <Text style={styles.modalSub}>
              Select the reason why the order could not be completed.
            </Text>

            <View style={styles.reasonList}>
              {[
                { id: 'customer_unavailable', label: 'Customer Not Available / Door Locked' },
                { id: 'customer_refused', label: 'Customer Refused Order' },
                { id: 'incorrect_address', label: 'Incorrect or Incomplete Address' },
                { id: 'phone_unreachable', label: 'Phone Switch Off / Not Reachable' },
                { id: 'package_damaged', label: 'Package Damaged in Transit' },
              ].map((r) => (
                <TouchableOpacity
                  key={r.id}
                  style={[
                    styles.reasonOption,
                    issueReason === r.id && styles.reasonOptionActive,
                  ]}
                  onPress={() => setIssueReason(r.id)}>
                  <Text
                    style={[
                      styles.reasonOptionText,
                      issueReason === r.id && styles.reasonOptionTextActive,
                    ]}>
                    {r.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.notesInput}
              value={issueNotes}
              onChangeText={setIssueNotes}
              placeholder="Additional notes for dispatch team..."
              placeholderTextColor="#94A3B8"
              multiline
            />

            <View style={styles.modalActions}>
              <CustomButton
                title="Cancel"
                variant="outline"
                size="medium"
                onPress={() => setIssueModalDelivery(null)}
                style={{ flex: 1 }}
              />
              <CustomButton
                title="Submit Issue"
                variant="danger"
                size="medium"
                loading={submitting}
                onPress={submitIssue}
                style={{ flex: 1.5 }}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  issueBtn: {
    alignSelf: 'center',
    marginBottom: 16,
    paddingVertical: 4,
  },
  issueText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  emptyContainer: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginTop: 40,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  emptySub: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    maxWidth: 280,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  modalSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
    lineHeight: 17,
  },
  otpInput: {
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 14,
    height: 56,
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 12,
    color: Colors.textPrimary,
    backgroundColor: '#F8FAFC',
    marginBottom: 16,
  },
  codAlert: {
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  codAlertText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B45309',
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  reasonList: {
    gap: 6,
    marginBottom: 12,
  },
  reasonOption: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#F8FAFC',
  },
  reasonOptionActive: {
    borderColor: Colors.danger,
    backgroundColor: '#FEE2E2',
  },
  reasonOptionText: {
    fontSize: 12,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  reasonOptionTextActive: {
    color: Colors.danger,
    fontWeight: '800',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    height: 60,
    padding: 10,
    fontSize: 12,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
});

export default ActiveDeliveriesScreen;

