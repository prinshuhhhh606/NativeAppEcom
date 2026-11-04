import React from 'react';
import { View, Text } from 'react-native';
import AppIcon from '../AppIcon';
import styles from './DashboardStatCard.styles';

export const DashboardStatCard = ({
  label,
  value,
  subtext,
  iconName = 'analytics',
  iconColor = '#6366F1',
  bgColor = '#FFFFFF',
  style,
}) => {
  return (
    <View style={[styles.card, { backgroundColor: bgColor }, style]}>
      <View style={styles.topRow}>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        <View style={[styles.iconCircle, { backgroundColor: `${iconColor}15` }]}>
          <AppIcon name={iconName} size={18} color={iconColor} />
        </View>
      </View>

      <Text style={styles.value} numberOfLines={1}>
        {value}
      </Text>

      {subtext ? (
        <Text style={styles.subtext} numberOfLines={1}>
          {subtext}
        </Text>
      ) : null}
    </View>
  );
};

export default DashboardStatCard;

