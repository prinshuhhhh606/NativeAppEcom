
import React, { useState, useCallback } from 'react';

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
  ActivityIndicator,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CustomHeader from '../../components/common/CustomHeader';
import DeliveryCard from '../../components/cards/DeliveryCard';
import CustomButton from '../../components/common/CustomButton';

import Colors from '../../constants/colors';

import { useDelivery } from '../../context/DeliveryContext';
import { deliveryService } from '../../services/deliveryService';

const getDeliveryId = (delivery) => {
  return delivery?._id || delivery?.deliveryNumber || null;
};

const getErrorMessage = (error, fallback) => {
  return (
    error?.message ||
    error?.response?.data?.message ||
    fallback
  );
};

export const ActiveDeliveriesScreen = () => {
  const insets = useSafeAreaInsets();

  const {
    activeDeliveries,
    loading,
    fetchActiveDeliveries,
    verifyPickupOtp,
    verifyDeliveryOtp,
    reportFailure,
  } = useDelivery();

  const [pickupModalDelivery, setPickupModalDelivery] = useState(null);
  const [pickupOtpInput, setPickupOtpInput] = useState('');

  const [deliveryModalDelivery, setDeliveryModalDelivery] = useState(null);
  const [deliveryOtpInput, setDeliveryOtpInput] = useState('');

  const [issueModalDelivery, setIssueModalDelivery] = useState(null);
  const [issueReason, setIssueReason] = useState('customer_unavailable');
  const [issueNotes, setIssueNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [processingDeliveryId, setProcessingDeliveryId] = useState(null);

  const refreshDeliveries = useCallback(async () => {
    await fetchActiveDeliveries();
  }, [fetchActiveDeliveries]);

  // Execute the next delivery lifecycle action.
  const handleDeliveryAction = async (delivery) => {
    const status = delivery?.status;
    const deliveryId = getDeliveryId(delivery);

    if (!deliveryId) {
      Alert.alert('Error', 'Delivery ID is missing.');
      return;
    }

    if (processingDeliveryId) return;

    try {
      setProcessingDeliveryId(String(deliveryId));

      if (status === 'assigned' || status === 'accepted') {
        await deliveryService.reachedPickup(deliveryId);

        await refreshDeliveries();

        Alert.alert(
          'Reached Store',
          'Please collect the package and ask store staff for the 4-digit pickup OTP.'
        );

      } else if (status === 'reached_pickup') {
        setPickupOtpInput('');
        setPickupModalDelivery(delivery);

      } else if (status === 'picked_up') {
        await deliveryService.outForDelivery(deliveryId);

        await refreshDeliveries();

        Alert.alert(
          'In Transit',
          'Package marked Out for Delivery. Proceed to the customer address.'
        );

      } else if (status === 'out_for_delivery') {
        await deliveryService.reachedCustomer(deliveryId);

        await refreshDeliveries();

        Alert.alert(
          'Reached Customer',
          'Ask the customer for their 4-digit delivery verification OTP.'
        );

      } else if (status === 'reached_customer') {
        setDeliveryOtpInput('');
        setDeliveryModalDelivery(delivery);

      } else {
        Alert.alert(
          'Delivery Status',
          `Current delivery status: ${status || 'Unknown'}`
        );
      }

    } catch (error) {
      Alert.alert(
        'Action Failed',
        getErrorMessage(error, 'Could not update delivery status.')
      );
    } finally {
      setProcessingDeliveryId(null);
    }
  };

  const getActionLabel = (status) => {
    switch (status) {
      case 'assigned':
      case 'accepted':
        return '1. Mark Reached Store Pickup';

      case 'reached_pickup':
        return '2. Verify Store Pickup OTP';

      case 'picked_up':
        return '3. Start Out For Delivery';

      case 'out_for_delivery':
        return '4. Mark Reached Customer';

      case 'reached_customer':
        return '5. Verify Delivery OTP & Complete';

      default:
        return 'View Delivery Details';
    }
  };

  // Verify pickup OTP.
  const submitPickupOtp = async () => {
    const otp = pickupOtpInput.trim();
    const deliveryId = getDeliveryId(pickupModalDelivery);

    if (!/^\d{4}$/.test(otp)) {
      Alert.alert(
        'Invalid OTP',
        'Enter the correct 4-digit store pickup OTP.'
      );
      return;
    }

    if (!deliveryId || submitting) return;

    setSubmitting(true);

    try {
      await verifyPickupOtp(deliveryId, otp);

      setPickupModalDelivery(null);
      setPickupOtpInput('');

    } catch (error) {
      // Error alert is handled by DeliveryContext.
    } finally {
      setSubmitting(false);
    }
  };

  // Verify customer delivery OTP.
  const submitDeliveryOtp = async () => {
    const otp = deliveryOtpInput.trim();
    const deliveryId = getDeliveryId(deliveryModalDelivery);

    if (!/^\d{4}$/.test(otp)) {
      Alert.alert(
        'Invalid OTP',
        'Enter the correct 4-digit customer delivery OTP.'
      );
      return;
    }

    if (!deliveryId || submitting) return;

    setSubmitting(true);

    try {
      await verifyDeliveryOtp(deliveryId, { otp });

      setDeliveryModalDelivery(null);
      setDeliveryOtpInput('');

    } catch (error) {
      // Error alert is handled by DeliveryContext.
    } finally {
      setSubmitting(false);
    }
  };

  // Submit delivery failure report.
  const submitIssue = async () => {
    const deliveryId = getDeliveryId(issueModalDelivery);

    if (!deliveryId || submitting) return;

    setSubmitting(true);

    try {
      await reportFailure(deliveryId, {
        reason: issueReason,
        notes: issueNotes.trim(),
      });

      setIssueModalDelivery(null);
      setIssueNotes('');
      setIssueReason('customer_unavailable');

    } catch (error) {
      // Error alert is handled by DeliveryContext.
    } finally {
      setSubmitting(false);
    }
  };

  const closePickupModal = () => {
    if (submitting) return;

    setPickupModalDelivery(null);
    setPickupOtpInput('');
  };

  const closeDeliveryModal = () => {
    if (submitting) return;

    setDeliveryModalDelivery(null);
    setDeliveryOtpInput('');
  };

  const closeIssueModal = () => {
    if (submitting) return;

    setIssueModalDelivery(null);
    setIssueNotes('');
    setIssueReason('customer_unavailable');
  };

  const openIssueModal = (delivery) => {
    setIssueReason('customer_unavailable');
    setIssueNotes('');
    setIssueModalDelivery(delivery);
  };

  return (
    <View style={styles.container}>
      <CustomHeader
        title="Active Deliveries"
        subtitle={`${activeDeliveries.length} active orders`}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 80 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refreshDeliveries}
            tintColor={Colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {activeDeliveries.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🛵</Text>

            <Text style={styles.emptyTitle}>
              No Active Deliveries
            </Text>

            <Text style={styles.emptySub}>
              Accept incoming requests from the Requests tab to start a delivery.
            </Text>

            <CustomButton
              title="Refresh"
              variant="primary"
              size="medium"
              onPress={refreshDeliveries}
              style={styles.refreshButton}
            />
          </View>
        ) : (
          activeDeliveries.map((item) => {
            const deliveryId = getDeliveryId(item);
            const isProcessing =
              processingDeliveryId === String(deliveryId);

            return (
              <View key={String(deliveryId)}>
                <DeliveryCard
                  delivery={item}
                  actionLabel={
                    isProcessing
                      ? 'Please wait...'
                      : getActionLabel(item.status)
                  }
                  onAction={() => handleDeliveryAction(item)}
                />

                {isProcessing ? (
                  <ActivityIndicator
                    size="small"
                    color={Colors.primary}
                    style={styles.processingIndicator}
                  />
                ) : null}

                <TouchableOpacity
                  style={styles.issueBtn}
                  disabled={isProcessing || submitting}
                  onPress={() => openIssueModal(item)}
                >
                  <Text style={styles.issueText}>
                    ⚠️ Report Delivery Issue / Customer Unavailable
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Store Pickup OTP Modal */}
      <Modal
        visible={!!pickupModalDelivery}
        transparent
        animationType="fade"
        onRequestClose={closePickupModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              Enter Store Pickup OTP
            </Text>

            <Text style={styles.modalSub}>
              Ask store staff at{' '}
              <Text style={styles.boldText}>
                {pickupModalDelivery?.pickupAddress?.storeName ||
                  'Merchant'}
              </Text>{' '}
              for the 4-digit package handover OTP.
            </Text>

            <TextInput
              style={styles.otpInput}
              value={pickupOtpInput}
              onChangeText={(value) =>
                setPickupOtpInput(value.replace(/\D/g, '').slice(0, 4))
              }
              keyboardType="number-pad"
              maxLength={4}
              placeholder="••••"
              placeholderTextColor="#94A3B8"
              editable={!submitting}
              autoFocus
            />

            <View style={styles.modalActions}>
              <CustomButton
                title="Cancel"
                variant="outline"
                size="medium"
                onPress={closePickupModal}
                disabled={submitting}
                style={{ flex: 1 }}
              />

              <CustomButton
                title="Verify Pickup"
                variant="primary"
                size="medium"
                loading={submitting}
                disabled={submitting}
                onPress={submitPickupOtp}
                style={{ flex: 1.5 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Customer Delivery OTP Modal */}
      <Modal
        visible={!!deliveryModalDelivery}
        transparent
        animationType="fade"
        onRequestClose={closeDeliveryModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              Enter Customer Delivery OTP
            </Text>

            <Text style={styles.modalSub}>
              Ask recipient{' '}
              <Text style={styles.boldText}>
                {deliveryModalDelivery?.deliveryAddress?.fullName ||
                  'Customer'}
              </Text>{' '}
              for their 4-digit delivery security OTP.
            </Text>

            <TextInput
              style={styles.otpInput}
              value={deliveryOtpInput}
              onChangeText={(value) =>
                setDeliveryOtpInput(value.replace(/\D/g, '').slice(0, 4))
              }
              keyboardType="number-pad"
              maxLength={4}
              placeholder="••••"
              placeholderTextColor="#94A3B8"
              editable={!submitting}
              autoFocus
            />

            {String(
              deliveryModalDelivery?.paymentMethod || ''
            ).toUpperCase() === 'COD' ? (
              <View style={styles.codAlert}>
                <Text style={styles.codAlertText}>
                  💵 Collect{' '}
                  {deliveryModalDelivery?.codAmount != null
                    ? `₹${deliveryModalDelivery.codAmount}`
                    : 'the COD amount shown in the order'}
                  {' '}in cash before completing delivery.
                </Text>
              </View>
            ) : null}

            <View style={styles.modalActions}>
              <CustomButton
                title="Cancel"
                variant="outline"
                size="medium"
                onPress={closeDeliveryModal}
                disabled={submitting}
                style={{ flex: 1 }}
              />

              <CustomButton
                title="Verify & Complete"
                variant="primary"
                size="medium"
                loading={submitting}
                disabled={submitting}
                onPress={submitDeliveryOtp}
                style={{ flex: 1.6 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Delivery Issue Report Modal */}
      <Modal
        visible={!!issueModalDelivery}
        transparent
        animationType="fade"
        onRequestClose={closeIssueModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              Report Delivery Issue
            </Text>

            <Text style={styles.modalSub}>
              Select the reason why this order could not be completed.
            </Text>

            <View style={styles.reasonList}>
              {[
                {
                  id: 'customer_unavailable',
                  label: 'Customer Not Available / Door Locked',
                },
                {
                  id: 'customer_refused',
                  label: 'Customer Refused Order',
                },
                {
                  id: 'incorrect_address',
                  label: 'Incorrect or Incomplete Address',
                },
                {
                  id: 'phone_unreachable',
                  label: 'Phone Switch Off / Not Reachable',
                },
                {
                  id: 'package_damaged',
                  label: 'Package Damaged in Transit',
                },
              ].map((reason) => (
                <TouchableOpacity
                  key={reason.id}
                  disabled={submitting}
                  style={[
                    styles.reasonOption,
                    issueReason === reason.id &&
                      styles.reasonOptionActive,
                  ]}
                  onPress={() => setIssueReason(reason.id)}
                >
                  <Text
                    style={[
                      styles.reasonOptionText,
                      issueReason === reason.id &&
                        styles.reasonOptionTextActive,
                    ]}
                  >
                    {reason.label}
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
              maxLength={500}
              editable={!submitting}
            />

            <View style={styles.modalActions}>
              <CustomButton
                title="Cancel"
                variant="outline"
                size="medium"
                onPress={closeIssueModal}
                disabled={submitting}
                style={{ flex: 1 }}
              />

              <CustomButton
                title="Submit Issue"
                variant="danger"
                size="medium"
                loading={submitting}
                disabled={submitting}
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
    paddingVertical: 6,
  },

  issueText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },

  processingIndicator: {
    marginVertical: 8,
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

  refreshButton: {
    marginTop: 18,
    minWidth: 130,
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
    lineHeight: 18,
  },

  boldText: {
    fontWeight: '800',
    color: Colors.textPrimary,
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
    height: 70,
    padding: 10,
    fontSize: 12,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
});

export default ActiveDeliveriesScreen;

