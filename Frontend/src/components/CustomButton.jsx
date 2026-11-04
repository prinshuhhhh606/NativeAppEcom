import React, { useRef, useCallback, useMemo } from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import styles from './CustomButton.styles';
import { Colors } from '../constants/colors';
import AppIcon from './AppIcon';

export const CustomButton = React.memo(({
  title,
  onPress,
  variant = 'primary', // primary, secondary, accent, outline, outlineSecondary, ghost, danger, success
  size = 'medium', // small, medium, large
  loading = false,
  disabled = false,
  iconLeft,
  iconRight,
  style,
  textStyle,
  activeOpacity = 0.65,
  debounceMs = 400,
}) => {
  const lastPressRef = useRef(0);

  const handlePress = useCallback(
    (e) => {
      const now = Date.now();
      if (now - lastPressRef.current < debounceMs) {
        return; // Suppress rapid accidental double-taps
      }
      lastPressRef.current = now;
      if (onPress && !disabled && !loading) {
        onPress(e);
      }
    },
    [onPress, disabled, loading, debounceMs]
  );

  const sizeStyle = styles[`size${size.charAt(0).toUpperCase() + size.slice(1)}`];
  const variantStyle = styles[`variant${variant.charAt(0).toUpperCase() + variant.slice(1)}`];
  const textSizeStyle = styles[`textSize${size.charAt(0).toUpperCase() + size.slice(1)}`];
  const textColorStyle = styles[`text${variant.charAt(0).toUpperCase() + variant.slice(1)}`];

  const buttonStyles = useMemo(
    () => [
      styles.buttonBase,
      sizeStyle,
      variantStyle,
      (disabled || loading) && styles.disabled,
      style,
    ],
    [sizeStyle, variantStyle, disabled, loading, style]
  );

  const combinedTextStyle = useMemo(
    () => [styles.textBase, textSizeStyle, textColorStyle, textStyle],
    [textSizeStyle, textColorStyle, textStyle]
  );

  const indicatorColor = useMemo(() => {
    if (variant === 'outline' || variant === 'ghost') return Colors.primary;
    if (variant === 'outlineSecondary') return Colors.textPrimary;
    return Colors.white;
  }, [variant]);

  const iconColor = useMemo(() => {
    if (variant === 'outline' || variant === 'ghost') return Colors.primary;
    if (variant === 'outlineSecondary') return Colors.textPrimary;
    if (variant === 'accent') return Colors.black;
    return Colors.white;
  }, [variant]);

  return (
    <TouchableOpacity
      activeOpacity={activeOpacity}
      onPress={handlePress}
      disabled={disabled || loading}
      style={buttonStyles}>
      {loading ? (
        <ActivityIndicator color={indicatorColor} size="small" />
      ) : (
        <>
          {iconLeft && (
            <AppIcon
              name={iconLeft}
              size={size === 'small' ? 16 : 18}
              color={iconColor}
              style={styles.iconLeft}
            />
          )}
          <Text style={combinedTextStyle}>{title}</Text>
          {iconRight && (
            <AppIcon
              name={iconRight}
              size={size === 'small' ? 16 : 18}
              color={iconColor}
              style={styles.iconRight}
            />
          )}
        </>
      )}
    </TouchableOpacity>
  );
});

export default CustomButton;
