import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import styles from './SkeletonLoader.styles';

export const SkeletonLoader = ({
  width = '100%',
  height = 18,
  borderRadius,
  style,
  count = 1,
}) => {
  const opacityAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.85,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.35,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacityAnim]);

  const items = Array.from({ length: count });

  return (
    <>
      {items.map((_, i) => (
        <Animated.View
          key={i}
          style={[
            styles.skeleton,
            {
              width,
              height,
              borderRadius: borderRadius !== undefined ? borderRadius : 6,
              opacity: opacityAnim,
              marginBottom: count > 1 && i < count - 1 ? 10 : 0,
            },
            style,
          ]}
        />
      ))}
    </>
  );
};

export default SkeletonLoader;

