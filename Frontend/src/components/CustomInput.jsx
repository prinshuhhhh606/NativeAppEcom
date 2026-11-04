import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { View, Text, TextInput, TouchableOpacity, Pressable } from 'react-native';
import styles from './CustomInput.styles';
import { Colors } from '../constants/colors';
import AppIcon from './AppIcon';

export const CustomInput = forwardRef(({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  helperText,
  required = false,
  secureTextEntry = false,
  leftIcon,
  rightIcon,
  onRightIconPress,
  editable = true,
  keyboardType = 'default',
  maxLength,
  multiline = false,
  numberOfLines = 1,
  style,
  inputStyle,
  autoCapitalize = 'none',
  onFocus,
  onBlur,
  returnKeyType,
  onSubmitEditing,
  blurOnSubmit,
  autoCorrect = false,
  ...rest
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef(null);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    blur: () => inputRef.current?.blur(),
    isFocused: () => inputRef.current?.isFocused(),
    clear: () => inputRef.current?.clear(),
  }));

  const isPasswordInput = secureTextEntry;

  const handleContainerPress = () => {
    if (editable && inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleFocus = (e) => {
    setIsFocused(true);
    if (onFocus) {
      onFocus(e);
    }
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    if (onBlur) {
      onBlur(e);
    }
  };

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={styles.label}>
          {label} {required && <Text style={styles.required}>*</Text>}
        </Text>
      )}

      <Pressable
        onPress={handleContainerPress}
        style={[
          styles.inputWrapper,
          isFocused && styles.inputWrapperFocused,
          error && styles.inputWrapperError,
          !editable && styles.inputWrapperDisabled,
        ]}>
        {leftIcon && (
          <View pointerEvents="none" style={styles.leftIconContainer}>
            <AppIcon
              name={leftIcon}
              size={20}
              color={error ? Colors.danger : isFocused ? Colors.primary : Colors.textMuted}
            />
          </View>
        )}

        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          editable={editable}
          keyboardType={keyboardType}
          maxLength={maxLength}
          multiline={multiline}
          numberOfLines={numberOfLines}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          secureTextEntry={isPasswordInput && !showPassword}
          onFocus={handleFocus}
          onBlur={handleBlur}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          blurOnSubmit={blurOnSubmit}
          style={[
            styles.input,
            multiline && { minHeight: 80, textAlignVertical: 'top' },
            inputStyle,
          ]}
          {...rest}
        />

        {isPasswordInput ? (
          <TouchableOpacity
            style={styles.rightIcon}
            onPress={() => setShowPassword(!showPassword)}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <AppIcon
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={Colors.textMuted}
            />
          </TouchableOpacity>
        ) : rightIcon ? (
          <TouchableOpacity
            style={styles.rightIcon}
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <AppIcon name={rightIcon} size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </Pressable>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
});

CustomInput.displayName = 'CustomInput';

export default CustomInput;
