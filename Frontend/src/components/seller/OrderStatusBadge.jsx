import React from 'react';
import { View, Text } from 'react-native';
import styles from './OrderStatusBadge.styles';

const STATUS_CONFIG = {
  placed: { label: 'Placed', bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' },
  processing: { label: 'Processing', bg: '#F5F3FF', color: '#7C3AED', border: '#DDD6FE' },
  packed: { label: 'Packed', bg: '#ECFDF5', color: '#059669', border: '#A7F3D0' },
  ready_for_pickup: { label: 'Ready for Pickup', bg: '#FDF4FF', color: '#C026D3', border: '#F5D0FE' },
  shipped: { label: 'Shipped', bg: '#E0F2FE', color: '#0284C7', border: '#BAE6FD' },
  delivered: { label: 'Delivered', bg: '#ECFDF5', color: '#16A34A', border: '#86EFAC' },
  cancelled: { label: 'Cancelled', bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' },
  return_requested: { label: 'Return Req.', bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' },
  returned: { label: 'Returned', bg: '#F1F5F9', color: '#475569', border: '#CBD5E1' },
  refunded: { label: 'Refunded', bg: '#FAF5FF', color: '#9333EA', border: '#E9D5FF' },
  approved: { label: 'Live on Store', bg: '#ECFDF5', color: '#059669', border: '#A7F3D0' },
  pending_approval: { label: 'In Review', bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' },
  draft: { label: 'Draft', bg: '#F1F5F9', color: '#64748B', border: '#E2E8F0' },
  rejected: { label: 'Rejected', bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' },
};

export const OrderStatusBadge = ({ status = 'placed', style }) => {
  const normKey = (status || '').toLowerCase().replace(/\s+/g, '_');
  const config = STATUS_CONFIG[normKey] || {
    label: (status || 'Unknown').toUpperCase(),
    bg: '#F1F5F9',
    color: '#475569',
    border: '#E2E8F0',
  };

  return (
    <View style={[styles.badge, { backgroundColor: config.bg, borderColor: config.border }, style]}>
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text style={[styles.text, { color: config.color }]}>{config.label}</Text>
    </View>
  );
};

export default OrderStatusBadge;

