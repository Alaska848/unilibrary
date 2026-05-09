// src/utils/theme.js
export const COLORS = {
  primary: '#6B3A2A',       // Deep brown — brand color
  primaryLight: '#92400E',
  primaryDark: '#4B2012',
  accent: '#D97706',        // Warm amber
  accentLight: '#FEF3C7',
  background: '#FDF8F3',    // Warm off-white
  surface: '#FFFFFF',
  surfaceAlt: '#FFF8EE',
  border: '#E5D5C5',
  borderLight: '#F0E6D6',

  textPrimary: '#1C1006',
  textSecondary: '#6B5E52',
  textMuted: '#9C8B80',
  textOnPrimary: '#FFFFFF',

  success: '#059669',
  successLight: '#D1FAE5',
  warning: '#B45309',
  warningLight: '#FEF3C7',
  error: '#DC2626',
  errorLight: '#FEE2E2',
  info: '#2563EB',
  infoLight: '#DBEAFE',

  // Loan status colors
  statusActive: { bg: '#DBEAFE', text: '#2563EB' },
  statusReturned: { bg: '#D1FAE5', text: '#059669' },
  statusOverdue: { bg: '#FEE2E2', text: '#DC2626' },
  statusPending: { bg: '#FEF3C7', text: '#B45309' },
  statusRejected: { bg: '#F3F4F6', text: '#6B7280' },
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  sizes: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 19,
    xl: 22,
    xxl: 26,
    xxxl: 32,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 999,
};

export const SHADOW = {
  sm: {
    shadowColor: '#6B3A2A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#6B3A2A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#6B3A2A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
};
