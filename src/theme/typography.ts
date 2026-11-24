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
    fontSize: adjustFontSize(31.5),
    fontWeight: '700' as const,
    lineHeight: adjustFontSize(38),
    letterSpacing: -0.5,
  },
  h2: {
    fontFamily,
    fontSize: adjustFontSize(25.5),
    fontWeight: '700' as const,
    lineHeight: adjustFontSize(31),
    letterSpacing: -0.3,
  },
  h3: {
    fontFamily,
    fontSize: adjustFontSize(22.5),
    fontWeight: '600' as const,
    lineHeight: adjustFontSize(28),
    letterSpacing: -0.2,
  },
  h4: {
    fontFamily,
    fontSize: adjustFontSize(18.5),
    fontWeight: '600' as const,
    lineHeight: adjustFontSize(24),
  },
  h5: {
    fontFamily,
    fontSize: adjustFontSize(16.5),
    fontWeight: '600' as const,
    lineHeight: adjustFontSize(22),
  },

  // Body
  bodyLarge: {
    fontFamily,
    fontSize: adjustFontSize(15.5),
    fontWeight: '400' as const,
    lineHeight: adjustFontSize(22),
  },
  body: {
    fontFamily,
    fontSize: adjustFontSize(14),
    fontWeight: '400' as const,
    lineHeight: adjustFontSize(20),
  },
  bodySmall: {
    fontFamily,
    fontSize: adjustFontSize(12),
    fontWeight: '400' as const,
    lineHeight: adjustFontSize(16.5),
  },

  // Labels
  label: {
    fontFamily,
    fontSize: adjustFontSize(13),
    fontWeight: '500' as const,
    lineHeight: adjustFontSize(18),
    letterSpacing: 0.2,
  },
  labelSmall: {
    fontFamily,
    fontSize: adjustFontSize(11),
    fontWeight: '500' as const,
    lineHeight: adjustFontSize(15),
    letterSpacing: 0.3,
  },

  // Buttons
  button: {
    fontFamily,
    fontSize: adjustFontSize(15),
    fontWeight: '600' as const,
    lineHeight: adjustFontSize(20),
    letterSpacing: 0.3,
  },
  buttonSmall: {
    fontFamily,
    fontSize: adjustFontSize(13),
    fontWeight: '600' as const,
    lineHeight: adjustFontSize(17),
    letterSpacing: 0.2,
  },

  // Caption
  caption: {
    fontFamily,
    fontSize: adjustFontSize(10.2),
    fontWeight: '400' as const,
    lineHeight: adjustFontSize(13),
    letterSpacing: 0.4,
  },

  // Numbers
  number: {
    fontFamily,
    fontSize: adjustFontSize(36),
    fontWeight: '700' as const,
    lineHeight: adjustFontSize(44),
    letterSpacing: -1,
  },
};
