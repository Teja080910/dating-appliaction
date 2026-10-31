import { Dimensions, Platform, PixelRatio, useWindowDimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Baseline reference dimensions based on standard mockup (iPhone 11/X: 375 x 812)
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

// Clamp factors to prevent extreme shrinking on ultra-compact phones and massive ballooning on tablets
const MIN_SCALE = 0.85;
const MAX_SCALE = 1.25;

const getClampedFactor = (current: number, base: number) => {
  const raw = current / base;
  return Math.min(Math.max(raw, MIN_SCALE), MAX_SCALE);
};
// Scales horizontally based on screen width (with tablet cap)
export const scale = (size: number) => {
  const factor = getClampedFactor(SCREEN_WIDTH, guidelineBaseWidth);
  return Math.round(size * factor);
};

// Scales vertically based on screen height (with tablet cap)
export const verticalScale = (size: number) => {
  const factor = getClampedFactor(SCREEN_HEIGHT, guidelineBaseHeight);
  return Math.round(size * factor);
};

// Scales size based on a scale factor (default 0.5) - keeps proportion standard but scales based on screen
export const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

// Normalizes font sizes based on pixel ratio consistently across iOS & Android pixel densities
export const adjustFontSize = (size: number) => {
  const factor = getClampedFactor(SCREEN_WIDTH, guidelineBaseWidth);
  const newSize = size * factor;
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.max(10, Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1);
  }
};

/**
 * Hook for dynamic responsive layout that reacts to screen size changes,
 * orientation shifts, foldables, and tablets.
 */
export const useResponsive = () => {
  const { width, height } = useWindowDimensions();

  const isSmallDevice = height < 700;
  const isCompactDevice = width < 380 || height < 760;
  const isTablet = width >= 600;

  const dynamicScale = (size: number) => {
    const factor = getClampedFactor(width, guidelineBaseWidth);
    return Math.round(size * factor);
  };

  const dynamicVerticalScale = (size: number) => {
    const factor = getClampedFactor(height, guidelineBaseHeight);
    return Math.round(size * factor);
  };

  const dynamicModerateScale = (size: number, factor = 0.5) =>
    size + (dynamicScale(size) - size) * factor;

  const dynamicAdjustFontSize = (size: number) => {
    const factor = getClampedFactor(width, guidelineBaseWidth);
    const newSize = size * factor;
    if (Platform.OS === 'ios') {
      return Math.round(PixelRatio.roundToNearestPixel(newSize));
    } else {
      return Math.max(10, Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1);
    }
  };

  /**
   * Helper to compute grid columns: 2 on phones, 3-4 on tablets.
   */
  const columns = isTablet ? (width >= 900 ? 4 : 3) : 2;

  /**
   * Computes responsive card width.
   */
  const getCardWidth = (cols = columns, padding = 36, gap = 12) => {
    const totalGaps = (cols - 1) * gap;
    return Math.floor((width - padding - totalGaps) / cols);
  };

  return {
    width,
    height,
    isSmallDevice,
    isCompactDevice,
    isTablet,
    columns,
    scale: dynamicScale,
    verticalScale: dynamicVerticalScale,
    moderateScale: dynamicModerateScale,
    adjustFontSize: dynamicAdjustFontSize,
    getCardWidth,
  };
};
