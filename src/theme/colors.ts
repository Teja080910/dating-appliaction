export const Colors = {
  // Primary palette
  primary: '#7C3AED',
  primaryLight: '#A78BFA',
  primaryDark: '#5B21B6',
  secondary: '#EC4899',
  secondaryLight: '#F472B6',
  secondaryDark: '#DB2777',

  // Gradients
  gradientPrimary: ['#7C3AED', '#EC4899'] as const,
  gradientSecondary: ['#EC4899', '#F59E0B'] as const,
  gradientDark: ['#1E1B2E', '#2D1B3D'] as const,
  gradientCard: ['rgba(124, 58, 237, 0.12)', 'rgba(236, 72, 153, 0.08)'] as const,

  // Backgrounds
  background: '#0F0D1A',
  surface: '#1A1730',
  surfaceLight: '#242140',
  surfaceLighter: '#2D2950',
  cardBackground: '#1A1730',
  inputBackground: 'rgba(255, 255, 255, 0.06)',
  overlay: 'rgba(0, 0, 0, 0.7)',
  tabBarBackground: 'rgba(15, 13, 26, 0.95)',

  // Glass
  glass: 'rgba(255, 255, 255, 0.08)',
  glassLight: 'rgba(255, 255, 255, 0.12)',
  glassBorder: 'rgba(255, 255, 255, 0.15)',
  glassBorderLight: 'rgba(255, 255, 255, 0.25)',

  // Text
  text: '#FFFFFF',
  textPrimary: '#F5F3FF',
  textSecondary: '#A5A3B5',
  textMuted: '#6B6980',
  textInverse: '#0F0D1A',

  // UI
  white: '#FFFFFF',
  black: '#000000',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  danger: '#EF4444',
  info: '#3B82F6',
  online: '#10B981',
  badge: '#EC4899',

  // Neutrals
  border: 'rgba(255, 255, 255, 0.1)',
  borderLight: 'rgba(255, 255, 255, 0.2)',
  divider: 'rgba(255, 255, 255, 0.06)',
  placeholder: '#6B6980',
  disabled: '#2D2950',
  disabledText: '#4D4B65',
  grey: '#6B6980',
  lightGrey: '#2D2950',

  // Shadows
  shadow: 'rgba(124, 58, 237, 0.3)',
  shadowPink: 'rgba(236, 72, 153, 0.3)',
  shadowDark: 'rgba(0, 0, 0, 0.4)',
  glow: 'rgba(124, 58, 237, 0.15)',
  glowPink: 'rgba(236, 72, 153, 0.15)',
};

export const DarkColors = {
  ...Colors,
};

export type ThemeColors = typeof Colors;

export const LightColors = {
  ...Colors,
  background: '#F8F9FA',
  surface: '#FFFFFF',
  surfaceLight: '#F3F4F6',
  surfaceLighter: '#E5E7EB',

  cardBackground: '#FFFFFF',
  inputBackground: '#F3F4F6',
  overlay: 'rgba(0, 0, 0, 0.4)',
  tabBarBackground: 'rgba(255, 255, 255, 0.95)',

  text: '#111827',
  textPrimary: '#111827',
  textSecondary: '#4B5563',
  textMuted: '#6B7280',
  textInverse: '#FFFFFF',

  border: '#E5E7EB',
  borderLight: '#D1D5DB',
  divider: '#E5E7EB',
  placeholder: '#9CA3AF',
  disabled: '#E5E7EB',
  disabledText: '#9CA3AF',
  grey: '#9CA3AF',
  lightGrey: '#F3F4F6',

  glass: '#FFFFFF',
  glassLight: '#F9FAFB',
  glassBorder: '#E5E7EB',
  glassBorderLight: '#D1D5DB',
};

export const getThemeColors = (
  mode: 'light' | 'dark' | 'system' = 'dark',
  systemScheme?: string | null
) => {
  if (mode === 'light') return LightColors;
  if (mode === 'system') return systemScheme === 'light' ? LightColors : DarkColors;
  return DarkColors;
};
