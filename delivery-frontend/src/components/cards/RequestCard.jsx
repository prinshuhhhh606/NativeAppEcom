
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

import CustomButton from '../common/CustomButton';
import Colors from '../../constants/colors';
import { formatPrice } from '../../utils/helpers';

// Safely convert different address formats into readable text.
const getAddressText = (address, type = 'pickup') => {
  if (!address) return 'Address not available';

  if (typeof address === 'string') {
    return address;
  }

  if (typeof address !== 'object') {
    return 'Address not available';
  }

  if (type === 'pickup') {
    return [
      address.storeName,
      address.addressLine || address.address,
      address.landmark,
      address.city,
      address.state,
      address.pinCode || address.pincode,
    ]
      .filter(Boolean)
      .join(', ') || 'Pickup address not available';
  }

  return [
    address.fullName,
    address.addressLine || address.address,
    address.landmark,
    address.city,
    address.state,
    address.pinCode || address.pincode,
  ]
    .filter(Boolean)
    .join(', ') || 'Delivery address not available';
};

const getDeadlineTimestamp = (deadline) => {
  if (!deadline) return null;

  const timestamp = new Date(deadline).getTime();

  return Number.isFinite(timestamp) ? timestamp : null;
};

const formatTimer = (totalSeconds) => {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;

  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export const RequestCard = ({
  request,
  onAccept,
  onDecline,
}) => {
  const deadlineTimestamp = useMemo(
    () => getDeadlineTimestamp(request?.responseDeadline),
    [request?.responseDeadline]
  );

  const [secondsLeft, setSecondsLeft] = useState(() => {
    if (!deadlineTimestamp) return null;

    return Math.max(
      0,
      Math.ceil((deadlineTimestamp - Date.now()) / 1000)
    );
  });

  // Countdown always follows the actual backend deadline.
  useEffect(() => {
    if (!deadlineTimestamp) {
      setSecondsLeft(null);
      return undefined;
    }

    const updateTimer = () => {
      const remaining = Math.max(
        0,
        Math.ceil((deadlineTimestamp - Date.now()) / 1000)
      );

      setSecondsLeft(remaining);
    };

    updateTimer();

    const timer = setInterval(updateTimer, 1000);

    return () => clearInterval(timer);
  }, [deadlineTimestamp]);

  const isExpired =
    secondsLeft === null || secondsLeft <= 0;

  const isUrgent =
    secondsLeft !== null &&
    secondsLeft > 0 &&
    secondsLeft < 180;

  const orderNumber =
    request?.orderNumber || request?.assignmentId || 'N/A';

  const storeName =
    request?.sellerStoreName ||
    request?.storeName ||
    request?.seller?.storeName ||
    'Vendor Store';

  const deliveryFee =
    request?.deliveryFee ??
    request?.deliveryCharges ??
    request?.fee;

  const distance =
    request?.distanceKm ??
    request?.distance;

  const estimatedMinutes =
    request?.estimatedMinutes ??
    request?.estimatedTime;

  const pickupAddress = getAddressText(
    request?.pickupAddress,
    'pickup'
  );

  const deliveryAddress = getAddressText(
    request?.deliveryAddress,
    'delivery'
  );

  const handleAccept = () => {
    if (isExpired || typeof onAccept !== 'function') {
      return;
    }

    onAccept();
  };

  const handleDecline = () => {
    if (isExpired || typeof onDecline !== 'function') {
      return;
    }

    onDecline();
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.orderNumber}>
            Order #{orderNumber}
          </Text>

          <Text style={styles.storeName}>
            {storeName}
          </Text>
        </View>

        <View
          style={[
            styles.timerBadge,
            isUrgent && styles.timerBadgeUrgent,
            isExpired && styles.timerBadgeExpired,
          ]}
        >
          <Text style={styles.timerIcon}>
            ⏱️
          </Text>

          <Text
            style={[
              styles.timerText,
              isUrgent && styles.timerTextUrgent,
              isExpired && styles.timerTextExpired,
            ]}
          >
            {secondsLeft === null
              ? 'N/A'
              : isExpired
                ? 'Expired'
                : formatTimer(secondsLeft)}
          </Text>
        </View>
      </View>

      {/* Fee and trip information */}
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>
            Delivery Fee
          </Text>

          <Text style={styles.metricValuePrimary}>
            {deliveryFee !== undefined && deliveryFee !== null
              ? formatPrice(Number(deliveryFee) || 0)
              : '—'}
          </Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>
            Trip Distance
          </Text>

          <Text style={styles.metricValue}>
            {distance !== undefined && distance !== null
              ? `${distance} km`
              : '—'}
          </Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>
            Est. Time
          </Text>

          <Text style={styles.metricValue}>
            {estimatedMinutes !== undefined &&
            estimatedMinutes !== null
              ? `${estimatedMinutes} min`
              : '—'}
          </Text>
        </View>
      </View>

      {/* Route information */}
      <View style={styles.routeSection}>
        {/* Pickup */}
        <View style={styles.routeItem}>
          <View style={styles.pickupDot}>
            <Text style={styles.dotIcon}>
              🏪
            </Text>
          </View>

          <View style={styles.routeTextCol}>
            <Text style={styles.routeLabel}>
              PICKUP FROM
            </Text>

            <Text
              style={styles.routeAddress}
              numberOfLines={3}
            >
              {pickupAddress}
            </Text>
          </View>
        </View>

        <View style={styles.routeConnector} />

        {/* Delivery destination */}
        <View style={styles.routeItem}>
          <View style={styles.deliveryDot}>
            <Text style={styles.dotIcon}>
              📍
            </Text>
          </View>

          <View style={styles.routeTextCol}>
            <Text style={styles.routeLabel}>
              DELIVER TO
            </Text>

            <Text
              style={styles.routeAddress}
              numberOfLines={3}
            >
              {deliveryAddress}
            </Text>
          </View>
        </View>
      </View>

      {/* Special instructions */}
      {request?.specialInstructions ? (
        <View style={styles.instructionsBox}>
          <Text style={styles.instructionsText}>
            ℹ️ {request.specialInstructions}
          </Text>
        </View>
      ) : null}

      {/* Expiry warning */}
      {isExpired ? (
        <View style={styles.expiredBox}>
          <Text style={styles.expiredText}>
            This delivery request has expired or has no valid deadline.
          </Text>
        </View>
      ) : null}

      {/* Action buttons */}
      <View style={styles.actionRow}>
        <CustomButton
          title="Decline"
          variant="outline"
          size="medium"
          onPress={handleDecline}
          disabled={isExpired}
          style={[
            styles.declineBtn,
            isExpired && styles.disabledButton,
          ]}
          textStyle={{ color: Colors.danger }}
        />

        <CustomButton
          title={isExpired ? 'Request Expired' : 'Accept Delivery'}
          variant="primary"
          size="medium"
          onPress={handleAccept}
          disabled={isExpired}
          style={[
            styles.acceptBtn,
            isExpired && styles.disabledButton,
          ]}
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
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },

  headerInfo: {
    flex: 1,
    marginRight: 8,
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
    marginTop: 3,
  },

  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },

  timerBadgeUrgent: {
    backgroundColor: '#FEE2E2',
  },

  timerBadgeExpired: {
    backgroundColor: '#E5E7EB',
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

  timerTextExpired: {
    color: '#6B7280',
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
    textAlign: 'center',
  },

  metricValue: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 3,
  },

  metricValuePrimary: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.primary,
    marginTop: 3,
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

  pickupDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },

  deliveryDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#0D9488',
    backgroundColor: '#CCFBF1',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },

  dotIcon: {
    fontSize: 10,
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
    lineHeight: 17,
    marginTop: 2,
  },

  routeConnector: {
    width: 1.5,
    height: 14,
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

  expiredBox: {
    backgroundColor: '#FEF2F2',
    padding: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 12,
  },

  expiredText: {
    fontSize: 11,
    color: '#B91C1C',
    fontWeight: '700',
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

  disabledButton: {
    opacity: 0.45,
  },
});

export default RequestCard;
