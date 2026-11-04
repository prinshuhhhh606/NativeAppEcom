import React from 'react';
import { View, Text } from 'react-native';
import styles from './AppIcon.styles';
import { Colors } from '../constants/colors';

// Try loading Ionicons safely
let Ionicons = null;
try {
  Ionicons = require('react-native-vector-icons/Ionicons').default;
} catch (e) {
  Ionicons = null;
}

// Fallback Unicode glyph mapping for 100% crash-free rendering
const GLYPH_MAP = {
  'home': '🏠',
  'home-outline': '🏠',
  'grid': '▦',
  'grid-outline': '▦',
  'heart': '♥',
  'heart-outline': '♡',
  'cart': '🛒',
  'cart-outline': '🛒',
  'person': '👤',
  'person-outline': '👤',
  'search': '🔍',
  'search-outline': '🔍',
  'location': '📍',
  'location-outline': '📍',
  'chevron-forward': '›',
  'chevron-back': '‹',
  'chevron-down': '˅',
  'chevron-up': '˄',
  'close': '✕',
  'close-circle': '⊗',
  'checkmark': '✓',
  'checkmark-circle': '✔',
  'star': '★',
  'star-half': '★',
  'star-outline': '☆',
  'notifications': '🔔',
  'notifications-outline': '🔔',
  'call': '📞',
  'call-outline': '📞',
  'mail': '✉',
  'mail-outline': '✉',
  'filter': '⚡',
  'filter-outline': '⚡',
  'trash': '🗑',
  'trash-outline': '🗑',
  'add': '+',
  'remove': '-',
  'arrow-forward': '→',
  'arrow-back': '←',
  'share-social': '↗',
  'share-social-outline': '↗',
  'shield-checkmark': '🛡',
  'shield-checkmark-outline': '🛡',
  'time-outline': '⏱',
  'cube-outline': '📦',
  'card-outline': '💳',
  'cash-outline': '💵',
  'sparkles-outline': '✨',
  'shirt-outline': '👔',
  'hardware-chip-outline': '📱',
  'flower-outline': '🌸',
  'nutrition-outline': '🌾',
  'help-circle-outline': '❓',
  'document-text-outline': '📄',
  'log-out-outline': '🚪',
  'wallet-outline': '👛',
  'pin-outline': '📌',
  'alert-circle-outline': '⚠',
};

export const AppIcon = React.memo(({ name, size = 22, color = Colors.textPrimary, style }) => {
  if (Ionicons) {
    try {
      return <Ionicons name={name} size={size} color={color} style={style} />;
    } catch (err) {
      // Fallback to unicode if font glyph fails
    }
  }

  const glyph = GLYPH_MAP[name] || '•';

  return (
    <View style={[styles.fallbackContainer, { width: size, height: size }, style]}>
      <Text
        style={[
          styles.fallbackText,
          {
            fontSize: size * 0.75,
            color,
            lineHeight: size,
          },
        ]}>
        {glyph}
      </Text>
    </View>
  );
});

export default AppIcon;

