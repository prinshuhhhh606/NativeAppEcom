import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Easing } from 'react-native';
import { useShimmerAnimation } from './ShimmerContext';

/**
 * ShimmerBox: Foundation skeleton block with smooth moving highlight wave.
 * Runs 100% on native thread via useNativeDriver: true.
 */
export const ShimmerBox = ({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
  children,
}) => {
  const sharedAnim = useShimmerAnimation();
  const localAnim = useRef(new Animated.Value(0)).current;

  // If not inside a ShimmerProvider, run a dedicated local loop
  useEffect(() => {
    if (sharedAnim) return;

    const loop = Animated.loop(
      Animated.timing(localAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [sharedAnim, localAnim]);

  const anim = sharedAnim || localAnim;

  // Sweeping highlight wave animation
  const opacity = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.45, 0.95, 0.45],
  });

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-180, 260],
  });

  return (
    <Animated.View
      style={[
        styles.box,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    >
      {/* High-speed sweeping highlight bar for premium shimmer gleam */}
      <Animated.View
        style={[
          styles.shimmerWave,
          {
            transform: [{ translateX }],
          },
        ]}
      />
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  box: {
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
    position: 'relative',
  },
  shimmerWave: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    transform: [{ skewX: '-20deg' }],
  },
});

export default React.memo(ShimmerBox);
