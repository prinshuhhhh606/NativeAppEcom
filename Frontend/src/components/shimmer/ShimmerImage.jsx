import React from 'react';
import ShimmerBox from './ShimmerBox';

/**
 * ShimmerImage: Image placeholder with customizable border radius and aspect ratio.
 */
export const ShimmerImage = ({
  width = '100%',
  height = 160,
  borderRadius = 12,
  style,
}) => {
  return (
    <ShimmerBox
      width={width}
      height={height}
      borderRadius={borderRadius}
      style={style}
    />
  );
};

export default React.memo(ShimmerImage);
