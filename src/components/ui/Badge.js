// src/components/ui/Badge.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, RADIUS, FONTS } from '../../utils/theme';

const STATUS_MAP = {
  Active: COLORS.statusActive,
  Returned: COLORS.statusReturned,
  Overdue: COLORS.statusOverdue,
  Pending: COLORS.statusPending,
  Rejected: COLORS.statusRejected,
  Suspended: { bg: COLORS.warningLight, text: COLORS.warning },
};

export default function Badge({ label, status, color, bgColor }) {
  const sc = status ? STATUS_MAP[status] : null;
  const bg = bgColor || sc?.bg || COLORS.borderLight;
  const fg = color || sc?.text || COLORS.textSecondary;

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: fg }]}>{label || status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
