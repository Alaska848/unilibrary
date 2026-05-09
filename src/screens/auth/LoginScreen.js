// src/screens/auth/LoginScreen.js
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
  Image,
} from 'react-native';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../services/firebase';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { COLORS, SPACING, FONTS, RADIUS } from '../../utils/theme';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      const uid = cred.user.uid;

      // Check admin
      const adminSnap = await getDoc(doc(db, 'admins', uid));
      if (adminSnap.exists()) {
        // AuthContext will handle the navigation update automatically
        return;
      }

      // Check student
      const studentSnap = await getDoc(doc(db, 'students', uid));
      if (studentSnap.exists()) {
        const data = studentSnap.data();
        const status = String(data.status || 'active').toLowerCase().trim();

        if (data.suspended === true || status === 'suspended') {
          await signOut(auth);
          Alert.alert(
            '🚫 Account Suspended',
            data.suspendedReason || 'Your account has been suspended. Please contact the admin.',
          );
          return;
        }

        if (status !== 'active') {
          await signOut(auth);
          Alert.alert(
            'Account Not Active',
            'Your account is pending approval. Please contact the library administration.',
          );
          return;
        }
        return; // AuthContext handles the rest
      }

      // Check doctor
      const doctorSnap = await getDoc(doc(db, 'doctors', uid));
      if (doctorSnap.exists()) {
        return; // AuthContext handles the rest
      }

      // No profile found
      await signOut(auth);
      Alert.alert('Error', 'No user profile found. Please register first.');
    } catch (err) {
      let msg = 'Login failed. Please try again.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        msg = 'Invalid email or password.';
      } else if (err.code === 'auth/user-not-found') {
        msg = 'No account found with this email.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Too many failed attempts. Try again later.';
      }
      Alert.alert('Login Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient
        colors={[COLORS.primaryDark, COLORS.primary, '#8B4E2F']}
        style={styles.headerGradient}
      >
        <View style={styles.logoArea}>
          <View style={styles.logoCircle}>
            <Ionicons name="library" size={38} color={COLORS.primary} />
          </View>
          <Text style={styles.appName}>University Library</Text>
          <Text style={styles.tagline}>Your gateway to knowledge</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.formArea}
        contentContainerStyle={styles.formContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.formTitle}>Welcome Back</Text>
        <Text style={styles.formSubtitle}>Sign in to your library account</Text>

        <Input
          label="Email Address"
          value={email}
          onChangeText={setEmail}
          placeholder="your@university.edu"
          keyboardType="email-address"
          leftIcon={<Ionicons name="mail-outline" size={18} color={COLORS.textMuted} />}
        />

        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Enter your password"
          secureTextEntry
          leftIcon={<Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} />}
        />

        <TouchableOpacity
          onPress={() => navigation.navigate('ForgotPassword')}
          style={styles.forgotLink}
        >
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>

        <Button
          title="Sign In"
          onPress={handleLogin}
          loading={loading}
          style={styles.loginBtn}
          size="lg"
        />

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('Register')}
          style={styles.registerRow}
        >
          <Text style={styles.registerPrompt}>Don't have an account? </Text>
          <Text style={styles.registerLink}>Create Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
  },
  logoArea: {
    alignItems: 'center',
    gap: SPACING.sm,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  appName: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: FONTS.sizes.sm,
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 0.3,
  },
  formArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  formContent: {
    padding: SPACING.xl,
    paddingTop: SPACING.xxl,
  },
  formTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  formSubtitle: {
    fontSize: FONTS.sizes.base,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },
  forgotLink: {
    alignSelf: 'flex-end',
    marginBottom: SPACING.xl,
    marginTop: -SPACING.xs,
  },
  forgotText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  loginBtn: {
    width: '100%',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.xl,
    gap: SPACING.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerPrompt: {
    fontSize: FONTS.sizes.base,
    color: COLORS.textSecondary,
  },
  registerLink: {
    fontSize: FONTS.sizes.base,
    color: COLORS.primary,
    fontWeight: '700',
  },
});
