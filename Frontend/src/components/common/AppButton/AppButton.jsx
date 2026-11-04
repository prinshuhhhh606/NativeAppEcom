import React, { useRef, useCallback, useMemo } from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import styles from './AppButton.styles';
import colors from '../../../theme/colors';

export const AppButton = React.memo(({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  iconLeft,
  iconRight,
  style,
  textStyle,
  activeOpacity = 0.65,
  debounceMs = 400,
  ...props
}) => {
  const lastPressRef = useRef(0);

  const handlePress = useCallback(
    (e) => {
      const now = Date.now();
      if (now - lastPressRef.current < debounceMs) {
        return; // Suppress accidental rapid double-taps
      }
      lastPressRef.current = now;
      if (onPress && !disabled && !loading) {
        onPress(e);
      }
    },
    [onPress, disabled, loading, debounceMs]
  );

  const sizeStyleKey = `size${size.charAt(0).toUpperCase() + size.slice(1)}`;
  const variantStyleKey = `variant${variant.charAt(0).toUpperCase() + variant.slice(1)}`;
  const textVariantKey = `text${variant.charAt(0).toUpperCase() + variant.slice(1)}`;
  const textSizeKey = `text${size.charAt(0).toUpperCase() + size.slice(1)}`;

  const buttonStyles = useMemo(
    () => [
      styles.base,
      styles[sizeStyleKey],
      styles[variantStyleKey],
      disabled && styles.disabled,
      style,
    ],
    [sizeStyleKey, variantStyleKey, disabled, style]
  );

  const textStyles = useMemo(
    () => [
      styles.textBase,
      styles[textSizeKey],
      styles[textVariantKey],
      textStyle,
    ],
    [textSizeKey, textVariantKey, textStyle]
  );

  const spinnerColor =
    variant === 'outline' || variant === 'ghost' ? colors.primary : colors.white;

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={activeOpacity}
      {...props}>
      {loading ? (
        <ActivityIndicator size="small" color={spinnerColor} />
      ) : (
        <>
          {iconLeft}
          {title ? <Text style={textStyles}>{title}</Text> : null}
          {iconRight}
        </>
      )}
    </TouchableOpacity>
  );
});

export default AppButton;
