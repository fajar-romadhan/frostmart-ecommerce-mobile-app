// ─── Arctic Premium Design System ───────────────────────────────────────────
// Della Frozen Mart — Professional e-commerce theme
// Palette inspired by arctic ice, frozen tones, with warm accent for CTA

export const COLORS = {
  // Primary — Arctic Blue (Ice Steel Blue Gen Z)
  primary: '#4A90D9',
  primaryDark: '#2C5E8A',
  primaryLight: '#E3F2FD',

  // Accent — Sunset Coral (Warm contrast Gen Z)
  accent: '#FF7A59',
  accentDark: '#E65C3E',
  accentLight: '#FFF3F0',

  // Gradient (Frozen Pastel Mint Glow)
  gradientStart: '#4A90D9',
  gradientEnd: '#7ED6DF',
  gradientAccentStart: '#FF7A59',
  gradientAccentEnd: '#FFA38C',

  // Neutral
  secondary: '#0F1B2D',
  background: '#F4F7FC',
  surface: '#FFFFFF',
  white: '#FFFFFF',

  // Status (Pastel soft status colors)
  success: '#10B981',
  successLight: '#ECFDF5',
  danger: '#EF4444',
  dangerLight: '#FEF2F2',
  warning: '#F59E0B',
  warningLight: '#FFFBEB',

  // Text
  textPrimary: '#0F1B2D',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textDark: '#0F1B2D',

  // Borders & Misc
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  divider: '#F1F5F9',
  shimmer: '#E3F2FD',
  overlay: 'rgba(15, 27, 45, 0.5)',
};

export const SHADOWS = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  soft: {
    shadowColor: '#0F1B2D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  light: {
    shadowColor: '#4A90D9',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  medium: {
    shadowColor: '#0F1B2D',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  heavy: {
    shadowColor: '#0F1B2D',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.12,
    shadowRadius: 30,
    elevation: 8,
  },
  colored: {
    shadowColor: '#4A90D9',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.20,
    shadowRadius: 12,
    elevation: 4,
  },
  accent: {
    shadowColor: '#FF7A59',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.20,
    shadowRadius: 12,
    elevation: 4,
  },
};

export const SIZES = {
  // Border Radius (Chunky Gen Z Bento style)
  radiusSm: 12,
  radiusMd: 18,
  radiusLg: 24,
  radiusXl: 32,
  radiusFull: 999,

  // Padding
  paddingSm: 12,
  paddingMd: 16,
  paddingLg: 24,

  // Spacing
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const TYPOGRAPHY = {
  h1: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  h2: {
    fontSize: 22,
    fontWeight: '800',
  },
  h3: {
    fontSize: 18,
    fontWeight: '700',
  },
  h4: {
    fontSize: 16,
    fontWeight: '700',
  },
  body: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 22,
  },
  bodyBold: {
    fontSize: 14,
    fontWeight: '700',
  },
  caption: {
    fontSize: 12,
    fontWeight: '500',
  },
  small: {
    fontSize: 11,
    fontWeight: '500',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  button: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
  },
  priceLarge: {
    fontSize: 22,
    fontWeight: '800',
  },
};
