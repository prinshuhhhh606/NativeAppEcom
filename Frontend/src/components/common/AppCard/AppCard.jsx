import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import styles from './AppCard.styles';

export const AppCard = ({
  children,
  onPress,
  variant = 'default', // default, flat, elevated, highlight
  style,
  activeOpacity = 0.75,
  ...props
}) => {
  const cardStyle = [
    styles.card,
    variant === 'flat' && styles.cardFlat,
    variant === 'elevated' && styles.cardElevated,
    variant === 'highlight' && styles.cardHighlight,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        activeOpacity={activeOpacity}
        {...props}>
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyle} {...props}>
      {children}
    </View>
  );
};

export default AppCard;

