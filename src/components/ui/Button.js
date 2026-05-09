// src/components/ui/Button.js
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { COLORS, SPACING, RADIUS, FONTS } from '../../utils/theme';

export default function Button({
  title,
  onPress,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size = 'md',          // 'sm' | 'md' | 'lg'
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}) {
  const variantStyles = {
    primary: {
      container: { backgroundColor: COLORS.primary },
      text: { color: COLORS.textOnPrimary },
    },
    secondary: {
      container: { backgroundColor: COLORS.accent },
      text: { color: COLORS.textOnPrimary },
    },
    outline: {
      container: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: COLORS.primary,
      },
      text: { color: COLORS.primary },
    },
    ghost: {
      container: { backgroundColor: 'transparent' },
      text: { color: COLORS.primary },
    },
    danger: {
      container: { backgroundColor: COLORS.error },
      text: { color: COLORS.textOnPrimary },
    },
  };

  const sizeStyles = {
    sm: {
      container: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs + 2, borderRadius: RADIUS.md },
      text: { fontSize: FONTS.sizes.sm },
    },
    md: {
      container: { paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, borderRadius: RADIUS.lg },
      text: { fontSize: FONTS.sizes.base },
    },
    lg: {
      container: { paddingHorizontal: SPACING.xxl, paddingVertical: SPACING.lg - 2, borderRadius: RADIUS.xl },
      text: { fontSize: FONTS.sizes.md },
    },
  };

  const vs = variantStyles[variant] || variantStyles.primary;
  const ss = sizeStyles[size] || sizeStyles.md;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.78}
      style={[
        styles.base,
        ss.container,
        vs.container,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? COLORS.primary : '#fff'}
        />
      ) : (
        <View style={styles.inner}>
          {icon && <View style={styles.icon}>{icon}</View>}
          <Text style={[styles.text, ss.text, vs.text, textStyle]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  icon: {
    marginRight: 2,
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  disabled: {
    opacity: 0.5,
  },
});
