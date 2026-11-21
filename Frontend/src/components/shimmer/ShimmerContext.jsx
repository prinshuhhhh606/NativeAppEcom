import React, { createContext, useContext, useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

const ShimmerContext = createContext(null);

/**
 * ShimmerProvider orchestrates a single 60 FPS native animation loop
 * across all child shimmer skeleton elements, eliminating duplicate timers
 * and ensuring smooth 60fps performance on low-end Android devices.
 */
export const ShimmerProvider = ({ children, duration = 1200 }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [animatedValue, duration]);

  return (
    <ShimmerContext.Provider value={animatedValue}>
      {children}
    </ShimmerContext.Provider>
  );
};

export const useShimmerAnimation = () => {
  return useContext(ShimmerContext);
};

export default ShimmerProvider;
