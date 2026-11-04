import React from 'react';
import { View, Text } from 'react-native';
import styles from './AppBadge.styles';

export const AppBadge = ({
  label,
  variant = 'neutral', // success, warning, error, info, primary, neutral
  icon,
  style,
  textStyle,
}) => {
  const variantKey = `variant${variant.charAt(0).toUpperCase() + variant.slice(1)}`;
  const textVariantKey = `text${variant.charAt(0).toUpperCase() + variant.slice(1)}`;

  return (
    <View style={[styles.badge, styles[variantKey] || styles.variantNeutral, style]}>
      {icon ? <View style={{ marginRight: 4 }}>{icon}</View> : null}
      <Text style={[styles.text, styles[textVariantKey] || styles.textNeutral, textStyle]}>
        {label}
      </Text>
    </View>
  );
};

export default AppBadge;

