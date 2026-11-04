import React from 'react';
import { View, Text } from 'react-native';
import styles from './Badge.styles';

export const Badge = ({
  text,
  variant = 'primary', // primary, success, warning, discount, dark
  style,
  textStyle,
}) => {
  const bgStyle = styles[variant] || styles.primary;
  const fontStyle = styles[`${variant}Text`] || styles.primaryText;

  return (
    <View style={[styles.badge, bgStyle, style]}>
      <Text style={[styles.text, fontStyle, textStyle]}>{text}</Text>
    </View>
  );
};

export default Badge;

