// src/components/ui/EmptyState.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS } from '../../utils/theme';

export default function EmptyState({ icon = 'book-outline', title, subtitle }) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={48} color={COLORS.primary} style={{ opacity: 0.35 }} />
      </View>
      <Text style={styles.title}>{title || 'Nothing here yet'}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxxl,
    paddingHorizontal: SPACING.xl,
  },
  iconWrap: {
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
