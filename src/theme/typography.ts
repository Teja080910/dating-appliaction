import { Platform } from 'react-native';
import { adjustFontSize } from '../utils/responsive';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'System',
  default: 'System',
});

export const Typography = {
  // Headings
  h1: {
    fontFamily,
    fontSize: adjustFontSize(34),
    fontWeight: '700' as const,
    lineHeight: adjustFontSize(41),
    letterSpacing: -0.5,
  },
  h2: {
    fontFamily,
    fontSize: adjustFontSize(28),
    fontWeight: '700' as const,
    lineHeight: adjustFontSize(34),
    letterSpacing: -0.3,
  },
  h3: {
    fontFamily,
    fontSize: adjustFontSize(24),
    fontWeight: '600' as const,
    lineHeight: adjustFontSize(30),
    letterSpacing: -0.2,
  },
  h4: {
    fontFamily,
    fontSize: adjustFontSize(20),
    fontWeight: '600' as const,
    lineHeight: adjustFontSize(26),
  },
  h5: {
    fontFamily,
    fontSize: adjustFontSize(18),
    fontWeight: '600' as const,
    lineHeight: adjustFontSize(24),
  },

  // Body
  bodyLarge: {
    fontFamily,
    fontSize: adjustFontSize(17),
    fontWeight: '400' as const,
    lineHeight: adjustFontSize(24),
  },
  body: {
    fontFamily,
    fontSize: adjustFontSize(15),
    fontWeight: '400' as const,
    lineHeight: adjustFontSize(22),
  },
  bodySmall: {
    fontFamily,
    fontSize: adjustFontSize(13),
    fontWeight: '400' as const,
    lineHeight: adjustFontSize(18),
  },

  // Labels
  label: {
    fontFamily,
    fontSize: adjustFontSize(14),
    fontWeight: '500' as const,
    lineHeight: adjustFontSize(20),
    letterSpacing: 0.2,
  },
  labelSmall: {
    fontFamily,
    fontSize: adjustFontSize(12),
    fontWeight: '500' as const,
    lineHeight: adjustFontSize(16),
    letterSpacing: 0.3,
  },

  // Buttons
  button: {
    fontFamily,
    fontSize: adjustFontSize(16),
    fontWeight: '600' as const,
    lineHeight: adjustFontSize(22),
    letterSpacing: 0.3,
  },
  buttonSmall: {
    fontFamily,
    fontSize: adjustFontSize(14),
    fontWeight: '600' as const,
    lineHeight: adjustFontSize(18),
    letterSpacing: 0.2,
  },

  // Caption
  caption: {
    fontFamily,
    fontSize: adjustFontSize(11),
    fontWeight: '400' as const,
    lineHeight: adjustFontSize(14),
    letterSpacing: 0.4,
  },

  // Numbers
  number: {
    fontFamily,
    fontSize: adjustFontSize(40),
    fontWeight: '700' as const,
    lineHeight: adjustFontSize(48),
    letterSpacing: -1,
  },
};
