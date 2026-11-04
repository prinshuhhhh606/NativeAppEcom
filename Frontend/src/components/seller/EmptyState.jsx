import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import AppIcon from '../AppIcon';
import styles from './EmptyState.styles';

export const EmptyState = ({
  icon = 'cube-outline',
  iconColor = '#94A3B8',
  title = 'No Data Found',
  description = 'There are currently no items to display.',
  actionLabel,
  onAction,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={[styles.iconCircle, { backgroundColor: `${iconColor}15` }]}>
        <AppIcon name={icon} size={36} color={iconColor} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.desc}>{description}</Text>
      {actionLabel && onAction ? (
        <TouchableOpacity style={styles.button} onPress={onAction} activeOpacity={0.8}>
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

export default EmptyState;
