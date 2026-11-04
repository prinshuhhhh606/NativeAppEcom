import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppIcon from '../AppIcon';
import styles from './SellerHeader.styles';

export const SellerHeader = ({
  title,
  subtitle,
  showBack = true,
  navigation,
  rightAction,
  rightIcon,
  rightLabel,
  onRightPress,
  isHindi = false,
  onToggleLanguage,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top + 8 : 14 }]}>
      <View style={styles.left}>
        {showBack && navigation ? (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}>
            <AppIcon name="chevron-back" size={20} color="#0F172A" />
          </TouchableOpacity>
        ) : null}

        <View>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.right}>
        {/* Quick jump to Customer Store */}
        {navigation ? (
          <TouchableOpacity
            style={styles.customerStoreBtn}
            onPress={() => navigation.navigate('MainApp')}
            activeOpacity={0.7}>
            <AppIcon name="bag-handle-outline" size={18} color="#059669" />
          </TouchableOpacity>
        ) : null}

        {onToggleLanguage ? (
          <TouchableOpacity
            style={styles.langBtn}
            onPress={onToggleLanguage}
            activeOpacity={0.7}>
            <Text style={styles.langText}>{isHindi ? 'English' : 'हिन्दी'}</Text>
          </TouchableOpacity>
        ) : null}

        {rightAction ? (
          rightAction
        ) : rightIcon && onRightPress ? (
          <TouchableOpacity style={styles.iconBtn} onPress={onRightPress} activeOpacity={0.7}>
            <AppIcon name={rightIcon} size={20} color="#0F172A" />
          </TouchableOpacity>
        ) : rightLabel && onRightPress ? (
          <TouchableOpacity style={styles.labelBtn} onPress={onRightPress} activeOpacity={0.7}>
            <Text style={styles.labelBtnText}>{rightLabel}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

export default SellerHeader;

