import { scale, verticalScale } from '../utils/responsive';

export const Spacing = {
  // Base units
  xs: scale(4),
  sm: scale(8),
  md: scale(12),
  lg: scale(16),
  xl: scale(20),
  xxl: scale(24),
  xxxl: scale(32),

  // Layout
  screenPadding: scale(20),
  screenPaddingHorizontal: scale(20),
  screenPaddingVertical: verticalScale(16),
  cardPadding: scale(16),
  sectionPadding: verticalScale(24),

  // Border radius
  radiusXs: scale(6),
  radiusSm: scale(10),
  radiusMd: scale(14),
  radiusLg: scale(20),
  radiusXl: scale(24),
  radiusXxl: scale(28),
  radiusFull: 9999,

  // Heights
  buttonHeight: scale(52),
  buttonHeightSmall: scale(42),
  inputHeight: scale(52),
  tabBarHeight: PlatformSelect(85, 70),
  headerHeight: PlatformSelect(56, 52),

  // Icon sizes
  iconXs: scale(16),
  iconSm: scale(20),
  iconMd: scale(24),
  iconLg: scale(28),
  iconXl: scale(32),

  // Gaps
  gapXs: scale(4),
  gapSm: scale(8),
  gapMd: scale(12),
  gapLg: scale(16),
  gapXl: scale(20),
  gapXxl: scale(24),
  gapSection: verticalScale(28),
};

function PlatformSelect(ios: number, android: number): number {
  const { Platform } = require('react-native');
  return Platform.OS === 'ios' ? ios : android;
}
