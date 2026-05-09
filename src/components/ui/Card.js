// src/components/ui/Card.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOW } from '../../utils/theme';

export default function Card({ children, style, elevation = 'sm' }) {
  return (
    <View style={[styles.card, SHADOW[elevation], style]}>{children}</View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
});
