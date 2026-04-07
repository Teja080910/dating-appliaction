import { Dimensions, Platform, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Set baseline screen dimensions usually based on a standard mobile mockup (e.g., iPhone 11/x)
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

// Scales horizontally based on screen width
export const scale = (size: number) => (SCREEN_WIDTH / guidelineBaseWidth) * size;

// Scales vertically based on screen height
export const verticalScale = (size: number) => (SCREEN_HEIGHT / guidelineBaseHeight) * size;

// Scales size based on a scale factor (default 0.5) - keeps proportion standard but scales based on screen
export const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

// Normalizes font sizes based on pixel ratio to act consistently across iOS & Android pixel densities
export const adjustFontSize = (size: number) => {
  const newSize = size * (SCREEN_WIDTH / guidelineBaseWidth);
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1;
  }
};
