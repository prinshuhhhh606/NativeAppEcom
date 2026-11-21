import React from 'react';
import { View } from 'react-native';
import ShimmerBox from './ShimmerBox';

/**
 * ShimmerText: Renders realistic paragraph or heading line skeletons with varied line widths.
 */
export const ShimmerText = ({
  lines = 1,
  height = 14,
  borderRadius = 4,
  style,
  lastLineWidth = '60%',
}) => {
  if (lines <= 1) {
    return (
      <ShimmerBox
        width="100%"
        height={height}
        borderRadius={borderRadius}
        style={style}
      />
    );
  }

  const items = Array.from({ length: lines });

  return (
    <View style={style}>
      {items.map((_, idx) => {
        const isLast = idx === lines - 1;
        const width = isLast ? lastLineWidth : idx % 2 === 0 ? '95%' : '88%';
        return (
          <ShimmerBox
            key={idx}
            width={width}
            height={height}
            borderRadius={borderRadius}
            style={{ marginBottom: isLast ? 0 : 8 }}
          />
        );
      })}
    </View>
  );
};

export default React.memo(ShimmerText);
