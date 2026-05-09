// src/components/ui/LoadingSpinner.js
import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONTS } from '../../utils/theme';

export default function LoadingSpinner({ message = 'Loading...', fullScreen = false }) {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
    gap: SPACING.md,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  message: {
    fontSize: FONTS.sizes.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
