import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CustomButton from '../common/CustomButton';
import Colors from '../../constants/colors';
import { formatPrice, calculateSecondsRemaining } from '../../utils/helpers';

export const RequestCard = ({ request, onAccept, onDecline }) => {
  const [secondsLeft, setSecondsLeft] = useState(
    calculateSecondsRemaining(request.responseDeadline) || 840
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const isUrgent = secondsLeft < 180;

  return (
    <View style={styles.card}>
      {/* Header with Order # and Expiry Timer */}
      <View style={styles.header}>
        <View>
          <Text style={styles.orderNumber}>Order #{request.orderNumber}</Text>
          <Text style={styles.storeName}>{request.sellerStoreName || 'Vendor Store'}</Text>
        </View>

        <View style={[styles.timerBadge, isUrgent && styles.timerBadgeUrgent]}>
          <Text style={styles.timerIcon}>⏱️</Text>
          <Text style={[styles.timerText, isUrgent && styles.timerTextUrgent]}>
            {formatTimer(secondsLeft)}
          </Text>
        </View>
      </View>

      {/* Fee & Distance Bar */}
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Delivery Fee</Text>
          <Text style={styles.metricValuePrimary}>{formatPrice(request.deliveryFee || 65)}</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Trip Distance</Text>
          <Text style={styles.metricValue}>{request.distanceKm || 4.2} km</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Est. Time</Text>
          <Text style={styles.metricValue}>{request.estimatedMinutes || 25} min</Text>
        </View>
      </View>

      {/* Pickup Point */}
      <View style={styles.routeSection}>
        <View style={styles.routeItem}>
          <View style={[styles.dotCircle, { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' }]}>
            <Text style={{ fontSize: 10 }}>🏪</Text>
          </View>
          <View style={styles.routeTextCol}>
            <Text style={styles.routeLabel}>PICKUP FROM</Text>
            <Text style={styles.routeAddress} numberOfLines={2}>
              {request.pickupAddress?.storeName || 'Artisan Hub'}, {request.pickupAddress?.addressLine}, {request.pickupAddress?.city}
            </Text>
          </View>
        </View>

        <View style={styles.routeConnector} />

        {/* Drop Destination */}
        <View style={styles.routeItem}>
          <View style={[styles.dotCircle, { borderColor: '#0D9488', backgroundColor: '#CCFBF1' }]}>
            <Text style={{ fontSize: 10 }}>📍</Text>
          </View>
          <View style={styles.routeTextCol}>
            <Text style={styles.routeLabel}>DELIVER TO</Text>
            <Text style={styles.routeAddress} numberOfLines={2}>
              {request.deliveryAddress?.fullName} • {request.deliveryAddress?.addressLine}, {request.deliveryAddress?.city} - {request.deliveryAddress?.pinCode}
            </Text>
          </View>
        </View>
      </View>

      {/* Special Instructions */}
      {request.specialInstructions ? (
        <View style={styles.instructionsBox}>
          <Text style={styles.instructionsText}>
            ℹ️ {request.specialInstructions}
          </Text>
        </View>
      ) : null}

      {/* Action Buttons: Large Accept & Decline */}
      <View style={styles.actionRow}>
        <CustomButton
          title="Decline"
          variant="outline"
          size="medium"
          onPress={onDecline}
          style={styles.declineBtn}
          textStyle={{ color: Colors.danger }}
        />
        <CustomButton
          title="Accept Delivery"
          variant="primary"
          size="medium"
          onPress={onAccept}
          style={styles.acceptBtn}
        />
      </View>
    </View>
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
    elevation: 3,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  storeName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 2,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  timerBadgeUrgent: {
    backgroundColor: '#FEE2E2',
  },
  timerIcon: {
    fontSize: 11,
  },
  timerText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D97706',
    fontFamily: 'monospace',
  },
  timerTextUrgent: {
    color: '#DC2626',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  metricValuePrimary: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.primary,
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  routeSection: {
    marginBottom: 12,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  dotCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  routeTextCol: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  routeAddress: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
    lineHeight: 16,
    marginTop: 1,
  },
  routeConnector: {
    width: 1.5,
    height: 12,
    backgroundColor: '#CBD5E1',
    marginLeft: 11,
    marginVertical: 2,
  },
  instructionsBox: {
    backgroundColor: '#FFFBEB',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    marginBottom: 14,
  },
  instructionsText: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  declineBtn: {
    flex: 1,
    borderColor: '#FECACA',
  },
  acceptBtn: {
    flex: 1.6,
  },
});

export default RequestCard;

