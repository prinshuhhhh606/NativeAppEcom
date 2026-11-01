import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '../../constants/colors';

const STATUS_CONFIG = {
  requested: { bg: '#FEF3C7', text: '#D97706', label: 'Requested' },
  assigned: { bg: '#E0F2FE', text: '#0284C7', label: 'Assigned' },
  accepted: { bg: '#E0E7FF', text: '#4338CA', label: 'Accepted' },
  reached_pickup: { bg: '#FCE7F3', text: '#BE185D', label: 'Reached Pickup' },
  picked_up: { bg: '#EDE9FE', text: '#6D28D9', label: 'Picked Up' },
  out_for_delivery: { bg: '#FFEDD5', text: '#C2410C', label: 'Out for Delivery' },
  reached_customer: { bg: '#CCFBF1', text: '#0F766E', label: 'At Doorstep' },
  delivered: { bg: '#D1FAE5', text: '#059669', label: 'Delivered' },
  delivery_failed: { bg: '#FEE2E2', text: '#DC2626', label: 'Failed' },
  declined: { bg: '#F1F5F9', text: '#64748B', label: 'Declined' },
  cancelled: { bg: '#FEE2E2', text: '#991B1B', label: 'Cancelled' },
  online: { bg: '#D1FAE5', text: '#059669', label: 'Online' },
  offline: { bg: '#F1F5F9', text: '#64748B', label: 'Offline' },
  approved: { bg: '#D1FAE5', text: '#059669', label: 'Approved' },
  pending: { bg: '#FEF3C7', text: '#D97706', label: 'Pending Review' },
};

export const StatusBadge = ({ status, size = 'medium' }) => {
  const config = STATUS_CONFIG[status] || {
    bg: '#F1F5F9',
    text: '#64748B',
    label: (status || 'Unknown').replace(/_/g, ' '),
  };

  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.bg,
          paddingHorizontal: isSmall ? 6 : 10,
          paddingVertical: isSmall ? 2 : 4,
        },
      ]}>
      <Text
        style={[
          styles.text,
          {
            color: config.text,
            fontSize: isSmall ? 10 : 11,
          },
        ]}>
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});

export default StatusBadge;

