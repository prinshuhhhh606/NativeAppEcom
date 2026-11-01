import React from 'react';
import { Text } from 'react-native';

// Professional unicode/emoji fallback icon component for zero missing-glyph crashes
const ICONS = {
  home: '🏠',
  'home-outline': '🏠',
  requests: '📥',
  'requests-outline': '📥',
  deliveries: '📦',
  'deliveries-outline': '📦',
  earnings: '💰',
  'earnings-outline': '💰',
  profile: '👤',
  'profile-outline': '👤',
  bicycle: '🛵',
  'bicycle-outline': '🛵',
  shield: '🛡️',
  'shield-checkmark': '🛡️',
  location: '📍',
  'location-outline': '📍',
  call: '📞',
  'call-outline': '📞',
  time: '⏱️',
  'time-outline': '⏱️',
  checkmark: '✓',
  'checkmark-circle': '✅',
  star: '★',
  alert: '⚠️',
  'alert-circle': '⚠️',
  wallet: '👛',
  'wallet-outline': '👛',
  lock: '🔒',
  'lock-closed': '🔒',
  mail: '✉️',
  logout: '🚪',
  'log-out-outline': '🚪',
  navigate: '🧭',
  close: '✕',
  refresh: '🔄',
  arrowForward: '→',
  arrowBack: '←',
};

export const AppIcon = ({ name, size = 18, color, style }) => {
  const icon = ICONS[name] || '•';
  return (
    <Text
      style={[
        {
          fontSize: size,
          textAlign: 'center',
          color: color || '#0F172A',
        },
        style,
      ]}>
      {icon}
    </Text>
  );
};

export default AppIcon;

