import React from 'react';
import { View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from './AppHeader.styles';
import AppIcon from '../../AppIcon';
import colors from '../../../theme/colors';

export const AppHeader = ({
  title,
  subtitle,
  showBack = false,
  onBackPress,
  rightAction,
  alignLeft = false,
  darkVariant = false,
  style,
}) => {
  const insets = useSafeAreaInsets();

  const containerBg = darkVariant ? colors.slate900 : colors.white;
  const textColor = darkVariant ? colors.white : colors.slate900;
  const subtitleColor = darkVariant ? colors.slate400 : colors.slate500;
  const backIconColor = darkVariant ? colors.white : colors.slate800;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: containerBg,
          paddingTop: insets.top > 0 ? insets.top : 4,
          borderBottomColor: darkVariant ? colors.slate800 : colors.slate200,
        },
        style,
      ]}>
      <StatusBar
        barStyle={darkVariant ? 'light-content' : 'dark-content'}
        backgroundColor={containerBg}
      />
      <View style={styles.inner}>
        {showBack ? (
          <TouchableOpacity
            style={styles.leftAction}
            onPress={onBackPress}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <AppIcon name="arrow-back" size={22} color={backIconColor} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: alignLeft ? 0 : 40 }} />
        )}

        <View
          style={[
            styles.titleWrapper,
            alignLeft && styles.titleWrapperLeftAlign,
          ]}>
          {title ? (
            <Text
              style={[styles.title, { color: textColor }]}
              numberOfLines={1}>
              {title}
            </Text>
          ) : null}
          {subtitle ? (
            <Text
              style={[styles.subtitle, { color: subtitleColor }]}
              numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        <View style={styles.rightAction}>{rightAction}</View>
      </View>
    </View>
  );
};

export default AppHeader;

