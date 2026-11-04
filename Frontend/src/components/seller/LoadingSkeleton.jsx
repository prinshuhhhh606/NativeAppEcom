import React from 'react';
import { View } from 'react-native';
import styles from './LoadingSkeleton.styles';

export const LoadingSkeleton = ({ count = 3, height = 90, style }) => {
  return (
    <View style={[styles.container, style]}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={[styles.skeletonCard, { height }]}>
          <View style={styles.thumbnail} />
          <View style={styles.lines}>
            <View style={[styles.line, { width: '80%', height: 14 }]} />
            <View style={[styles.line, { width: '50%', height: 10, marginTop: 8 }]} />
            <View style={[styles.line, { width: '35%', height: 12, marginTop: 10 }]} />
          </View>
        </View>
      ))}
    </View>
  );
};

export default LoadingSkeleton;

