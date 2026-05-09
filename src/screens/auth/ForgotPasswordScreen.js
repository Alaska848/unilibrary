// src/screens/auth/ForgotPasswordScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../../services/firebase';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { COLORS, SPACING, FONTS, RADIUS } from '../../utils/theme';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    if (!email.trim()) {
      Alert.alert('Email Required', 'Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
      setSent(true);
    } catch (err) {
      Alert.alert('Error', 'Failed to send reset email. Please check the email address.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>

        <View style={styles.iconWrap}>
          <Ionicons name="key" size={44} color={COLORS.primary} />
        </View>

        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          Enter your email and we'll send you a link to reset your password.
        </Text>

        {sent ? (
          <View style={styles.successBox}>
            <Ionicons name="checkmark-circle" size={32} color={COLORS.success} />
            <Text style={styles.successTitle}>Email Sent!</Text>
            <Text style={styles.successText}>
              Check your inbox for password reset instructions.
            </Text>
            <Button
              title="Back to Login"
              onPress={() => navigation.navigate('Login')}
              style={{ marginTop: SPACING.lg }}
            />
          </View>
        ) : (
          <>
            <Input
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              placeholder="your@university.edu"
              keyboardType="email-address"
              leftIcon={<Ionicons name="mail-outline" size={18} color={COLORS.textMuted} />}
            />
            <Button
              title="Send Reset Email"
              onPress={handleReset}
              loading={loading}
              style={{ width: '100%', marginTop: SPACING.md }}
              size="lg"
            />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.xl, paddingTop: 60 },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.accentLight,
    marginBottom: SPACING.xxl,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONTS.sizes.base,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  successBox: {
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.successLight,
    borderRadius: RADIUS.lg,
    gap: SPACING.sm,
  },
  successTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.success,
  },
  successText: {
    fontSize: FONTS.sizes.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
