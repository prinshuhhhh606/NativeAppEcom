import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import StatusBadge from '../common/StatusBadge';
import CustomButton from '../common/CustomButton';
import Colors from '../../constants/colors';
import { formatPrice } from '../../utils/helpers';

export const DeliveryCard = ({ delivery, onPress, onAction, actionLabel, actionVariant = 'primary' }) => {
  const handleCall = () => {
    const phone = delivery.deliveryAddress?.mobileNumber || delivery.customerPhone;
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const handleNavigate = () => {
    const addr = delivery.deliveryAddress;
    const query = `${addr?.addressLine || ''}, ${addr?.city || ''} ${addr?.pinCode || ''}`;
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.orderNumber}>
            #{delivery.orderNumber || delivery.taskNumber || delivery.deliveryNumber}
          </Text>
          <Text style={styles.customerName}>
            {delivery.deliveryAddress?.fullName || delivery.customerName || 'Customer'}
          </Text>
        </View>

        <StatusBadge status={delivery.status} />
      </View>

      {/* Address */}
      <View style={styles.addressRow}>
        <Text style={styles.pinIcon}>📍</Text>
        <Text style={styles.addressText} numberOfLines={2}>
          {delivery.deliveryAddress?.addressLine || delivery.deliveryAddress || 'Delivery Address'},{' '}
          {delivery.deliveryAddress?.city} - {delivery.deliveryAddress?.pinCode}
        </Text>
      </View>

      {/* Payment & COD Badge */}
      <View style={styles.paymentRow}>
        <View style={styles.paymentLeft}>
          <Text style={styles.paymentLabel}>
            {delivery.paymentMethod === 'COD' ? 'Cash on Delivery (COD)' : 'Prepaid (Paid Online)'}
          </Text>
          <Text style={[styles.paymentAmount, delivery.paymentMethod === 'COD' && { color: '#D97706' }]}>
            {delivery.paymentMethod === 'COD'
              ? formatPrice(delivery.codAmount || delivery.amountToCollect || 1899)
              : '₹0 (Collect ₹0)'}
          </Text>
        </View>

        <View style={styles.buttonsRow}>
          <TouchableOpacity style={styles.callBtn} onPress={handleCall} activeOpacity={0.8}>
            <Text style={styles.callIcon}>📞</Text>
            <Text style={styles.callText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.mapBtn} onPress={handleNavigate} activeOpacity={0.8}>
            <Text style={styles.mapIcon}>🧭</Text>
            <Text style={styles.mapText}>Maps</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Next Step Action Button */}
      {actionLabel && (
        <CustomButton
          title={actionLabel}
          variant={actionVariant}
          size="medium"
          onPress={onAction}
          style={styles.actionBtn}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  customerName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginTop: 1,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
  },
  pinIcon: {
    fontSize: 14,
    marginTop: 1,
  },
  addressText: {
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 17,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  paymentLeft: {
    flex: 1,
  },
  paymentLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  paymentAmount: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.textPrimary,
    marginTop: 1,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  callIcon: {
    fontSize: 11,
  },
  callText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F766E',
  },
  mapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  mapIcon: {
    fontSize: 11,
  },
  mapText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  actionBtn: {
    marginTop: 2,
  },
});

export default DeliveryCard;

