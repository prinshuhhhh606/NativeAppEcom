import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import ShimmerBox from './ShimmerBox';

const { width } = Dimensions.get('window');

/**
 * ShimmerBanner: Hero promotional banner carousel skeleton for Home Screen.
 */
export const ShimmerBanner = ({ style }) => {
  return (
    <View style={[styles.container, style]}>
      <ShimmerBox
        width={width - 32}
        height={195}
        borderRadius={22}
        style={styles.banner}
      >
        {/* Mock internal banner content */}
        <View style={styles.overlay}>
          <ShimmerBox width={90} height={20} borderRadius={10} />
          <View>
            <ShimmerBox width={160} height={24} borderRadius={6} style={{ marginBottom: 8 }} />
            <ShimmerBox width={110} height={14} borderRadius={4} />
          </View>
        </View>
      </ShimmerBox>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    alignItems: 'center',
  },
  banner: {
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  overlay: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
});

export default React.memo(ShimmerBanner);
