import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import styles from './Loading.styles';
import { Colors } from '../constants/colors';

export const Loading = ({
  message = 'Loading...',
  fullScreen = false,
  color = Colors.primary,
  size = 'large',
  style,
}) => {
  return (
    <View style={[fullScreen ? styles.fullScreen : styles.container, style]}>
      <ActivityIndicator size={size} color={color} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
};

export default Loading;

