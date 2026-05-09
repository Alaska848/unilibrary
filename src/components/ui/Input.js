// src/components/ui/Input.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONTS } from '../../utils/theme';

export default function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize = 'none',
  error,
  hint,
  leftIcon,
  multiline,
  numberOfLines,
  editable = true,
  style,
  inputStyle,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.wrapper, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.container,
          focused && styles.containerFocused,
          error && styles.containerError,
          !editable && styles.containerDisabled,
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          style={[
            styles.input,
            leftIcon && styles.inputWithLeftIcon,
            secureTextEntry && styles.inputWithRightIcon,
            multiline && styles.inputMultiline,
            inputStyle,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          editable={editable}
          multiline={multiline}
          numberOfLines={numberOfLines}
        />
        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setShowPassword((v) => !v)}
            style={styles.eyeBtn}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={COLORS.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    letterSpacing: 0.3,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  containerFocused: {
    borderColor: COLORS.primary,
  },
  containerError: {
    borderColor: COLORS.error,
  },
  containerDisabled: {
    backgroundColor: COLORS.surfaceAlt,
    opacity: 0.7,
  },
  leftIcon: {
    paddingLeft: SPACING.md,
  },
  input: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    fontSize: FONTS.sizes.base,
    color: COLORS.textPrimary,
  },
  inputWithLeftIcon: {
    paddingLeft: SPACING.sm,
  },
  inputWithRightIcon: {
    paddingRight: SPACING.xs,
  },
  inputMultiline: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: SPACING.md,
  },
  eyeBtn: {
    padding: SPACING.md,
  },
  error: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.error,
    marginTop: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  hint: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
    marginLeft: SPACING.xs,
  },
});
