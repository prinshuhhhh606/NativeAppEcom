import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import Colors from '../../constants/colors';

export const CustomButton = ({
  title,
  onPress,
  variant = 'primary', // 'primary', 'secondary', 'danger', 'outline', 'ghost'
  size = 'medium', // 'small', 'medium', 'large'
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}) => {
  const isOutline = variant === 'outline';
  const isDanger = variant === 'danger';
  const isGhost = variant === 'ghost';
  const isSecondary = variant === 'secondary';

  let bgColor = Colors.primary;
  let textColor = Colors.white;

  if (isSecondary) {
    bgColor = Colors.secondary;
  } else if (isDanger) {
    bgColor = Colors.danger;
  } else if (isOutline || isGhost) {
    bgColor = 'transparent';
    textColor = isDanger ? Colors.danger : Colors.primary;
  }

  let height = 48;
  let fontSize = 14;

  if (size === 'small') {
    height = 36;
    fontSize = 12;
  } else if (size === 'large') {
    height = 54;
    fontSize = 15;
  }

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          backgroundColor: disabled ? '#CBD5E1' : bgColor,
          height,
          borderWidth: isOutline ? 1.5 : 0,
          borderColor: isDanger ? Colors.danger : Colors.primary,
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={isOutline ? Colors.primary : Colors.white} size="small" />
      ) : (
        <>
          {icon ? <Text style={styles.icon}>{icon}</Text> : null}
          <Text
            style={[
              styles.text,
              {
                color: disabled ? '#94A3B8' : textColor,
                fontSize,
              },
              textStyle,
            ]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  text: {
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  icon: {
    fontSize: 16,
  },
});

export default CustomButton;

