/**
 * Bharat Bazaar - Layout Dimensions & Responsive Screen Helpers
 */
import { Dimensions, PixelRatio } from 'react-native';

const { width, height } = Dimensions.get('window');

export const dimensions = {
  width,
  height,
  isSmallDevice: width < 360,
  isMediumDevice: width >= 360 && width < 420,
  isLargeDevice: width >= 420 && width < 768,
  isTablet: width >= 768,

  // Responsive scale factors
  scaleFont: (size) => Math.round(size * (width / 375)),
  pixelRatio: PixelRatio.get(),

  // Standard component heights
  headerHeight: 56,
  bottomBarHeight: 64,
  inputHeight: 48,
  buttonHeight: 48,
  buttonHeightSmall: 36,
  cardImageHeight: 160,
};

export default dimensions;

