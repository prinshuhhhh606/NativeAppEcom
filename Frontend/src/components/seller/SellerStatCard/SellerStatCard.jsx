import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import styles from './SellerStatCard.styles';
import AppIcon from '../../AppIcon';
import colors from '../../../theme/colors';

export const SellerStatCard = ({
  label,
  value,
  subtext,
  iconName = 'stats-chart',
  iconColor = colors.primary,
  iconBg,
  onPress,
  style,
}) => {
  const bg = iconBg || `${iconColor}15`;

  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={0.75}>
      <View style={styles.headerRow}>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        <View style={[styles.iconBox, { backgroundColor: bg }]}>
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
    </Container>
  );
};

export default SellerStatCard;

