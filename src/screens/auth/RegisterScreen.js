// src/screens/auth/RegisterScreen.js
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
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../services/firebase';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { COLORS, SPACING, FONTS, RADIUS } from '../../utils/theme';

const ACCOUNT_TYPES = [
  { value: 'student', label: 'Student', icon: 'school-outline' },
  { value: 'doctor', label: 'Faculty / Doctor', icon: 'briefcase-outline' },
];

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accountType, setAccountType] = useState('student');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!name.trim() || !cleanEmail || !password || !userId.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }

    if (
      accountType === 'student' &&
      !cleanEmail.endsWith('.edu') &&
      !cleanEmail.endsWith('.edu.eg')
    ) {
      Alert.alert('Invalid Email', 'Students must use a university email (.edu or .edu.eg).');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      const collection = accountType === 'doctor' ? 'doctors' : 'students';

      await setDoc(doc(db, collection, cred.user.uid), {
        name: name.trim(),
        Userid: userId.trim(),
        email: cleanEmail,
        phone: phone.trim(),
        role: accountType,
        status: 'active',
        createdAt: serverTimestamp(),
      });

      // Sign out immediately — user must log in (same behavior as web app)
      await signOut(auth);

      Alert.alert(
        '✅ Account Created',
        'Your account has been created successfully. Please sign in.',
        [{ text: 'Sign In', onPress: () => navigation.navigate('Login') }],
      );
    } catch (err) {
      let msg = 'Registration failed. Please try again.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'An account with this email already exists.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      }
      Alert.alert('Registration Failed', msg);
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join the university library</Text>
        </View>

        {/* Account type selector */}
        <Text style={styles.sectionLabel}>Account Type</Text>
        <View style={styles.typeRow}>
          {ACCOUNT_TYPES.map((t) => (
            <TouchableOpacity
              key={t.value}
              onPress={() => setAccountType(t.value)}
              style={[
                styles.typeBtn,
                accountType === t.value && styles.typeBtnActive,
              ]}
            >
              <Ionicons
                name={t.icon}
                size={20}
                color={accountType === t.value ? COLORS.textOnPrimary : COLORS.primary}
              />
              <Text
                style={[
                  styles.typeBtnText,
                  accountType === t.value && styles.typeBtnTextActive,
                ]}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Input
          label="Full Name *"
          value={name}
          onChangeText={setName}
          placeholder="Your full name"
          autoCapitalize="words"
          leftIcon={<Ionicons name="person-outline" size={18} color={COLORS.textMuted} />}
        />

        <Input
          label={accountType === 'doctor' ? 'Staff ID *' : 'Student ID *'}
          value={userId}
          onChangeText={setUserId}
          placeholder={accountType === 'doctor' ? 'Enter staff ID' : 'Enter student ID'}
          leftIcon={<Ionicons name="card-outline" size={18} color={COLORS.textMuted} />}
        />

        <Input
          label="Email Address *"
          value={email}
          onChangeText={setEmail}
          placeholder={
            accountType === 'student' ? 'your@university.edu.eg' : 'your@university.edu'
          }
          keyboardType="email-address"
          hint={accountType === 'student' ? 'Must be a .edu or .edu.eg address' : undefined}
          leftIcon={<Ionicons name="mail-outline" size={18} color={COLORS.textMuted} />}
        />

        <Input
          label="Phone Number"
          value={phone}
          onChangeText={setPhone}
          placeholder="01xxxxxxxxx"
          keyboardType="phone-pad"
          leftIcon={<Ionicons name="call-outline" size={18} color={COLORS.textMuted} />}
        />

        <Input
          label="Password *"
          value={password}
          onChangeText={setPassword}
          placeholder="Minimum 6 characters"
          secureTextEntry
          leftIcon={<Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} />}
        />

        <Input
          label="Confirm Password *"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Re-enter password"
          secureTextEntry
          error={
            confirmPassword.length > 0 && password !== confirmPassword
              ? 'Passwords do not match'
              : undefined
          }
          leftIcon={<Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} />}
        />

        <Button
          title="Create Account"
          onPress={handleRegister}
          loading={loading}
          style={styles.submitBtn}
          size="lg"
        />

        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          style={styles.loginRow}
        >
          <Text style={styles.loginPrompt}>Already have an account? </Text>
          <Text style={styles.loginLink}>Sign In</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.xl,
    paddingTop: 60,
    paddingBottom: SPACING.xxxl,
  },
  header: {
    marginBottom: SPACING.xl,
  },
  backBtn: {
    marginBottom: SPACING.lg,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.accentLight,
  },
  title: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONTS.sizes.base,
    color: COLORS.textSecondary,
  },
  sectionLabel: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    letterSpacing: 0.3,
  },
  typeRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surface,
  },
  typeBtnActive: {
    backgroundColor: COLORS.primary,
  },
  typeBtnText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.primary,
  },
  typeBtnTextActive: {
    color: '#fff',
  },
  submitBtn: {
    width: '100%',
    marginTop: SPACING.md,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.xl,
  },
  loginPrompt: {
    fontSize: FONTS.sizes.base,
    color: COLORS.textSecondary,
  },
  loginLink: {
    fontSize: FONTS.sizes.base,
    color: COLORS.primary,
    fontWeight: '700',
  },
});
