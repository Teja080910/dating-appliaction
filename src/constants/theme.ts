// Central design system for the app. Previously every screen picked its own
// ad-hoc accent color (#E94057, #D94B58, #FF1493, #ee486b, #e14c61, #d13964,
// #D9534F all appeared in different files) and its own shadow/radius values.
// This file is the single source of truth going forward — new screens
// should import from here rather than inventing new colors.

export const colors = {
  // Primary brand gradient — warm rose to deep berry, the "romantic" core of
  // the palette. Used for CTAs, active states, and the signature card
  // gradient overlay.
  gradientStart: '#FF6F91',
  gradientEnd: '#C9184A',

  primary: '#E63950', // flat fallback where a gradient isn't practical
  primaryDark: '#B5233A',
  primaryLight: '#FFE3EA',

  // Premium accent — a soft gold used sparingly for verified badges,
  // "premium" indicators, and star/favorite accents.
  gold: '#D4AF37',
  goldLight: '#FBF3DC',

  success: '#3DBE72',
  successLight: '#E4F8ED',
  warning: '#F5A524',
  warningLight: '#FEF3DD',
  danger: '#E63950',
  dangerLight: '#FDE7EA',

  // Neutrals — warm-tinted rather than pure gray/black, softer and more
  // premium-feeling than the flat #000/#ccc used previously.
  ink: '#241922', // primary text
  inkMuted: '#7A6A72', // secondary text
  inkFaint: '#B7A9AF', // placeholder/disabled text
  surface: '#FFFFFF',
  surfaceAlt: '#FFF8F9', // warm off-white background
  border: '#F1E4E7',
  overlay: 'rgba(36, 25, 34, 0.55)',

  online: '#3DBE72',
};

export const gradients = {
  primary: [colors.gradientStart, colors.gradientEnd] as const,
  card: ['transparent', 'rgba(36,17,26,0.85)'] as const, // bottom-of-card text scrim
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
};

export const shadow = {
  card: {
    shadowColor: '#5B1030',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 6,
  },
  soft: {
    shadowColor: '#5B1030',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
};

export const typography = {
  display: { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.5 },
  title: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.3 },
  heading: { fontSize: 17, fontWeight: '700' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  bodyMedium: { fontSize: 15, fontWeight: '600' as const },
  caption: { fontSize: 13, fontWeight: '500' as const },
  micro: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.4 },
};
