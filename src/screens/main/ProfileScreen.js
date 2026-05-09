// src/screens/main/ProfileScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { useAuth } from '../../context/AuthContext';
import { updateUserProfile } from '../../services/firestoreService';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import { COLORS, SPACING, FONTS, RADIUS, SHADOW } from '../../utils/theme';

export default function ProfileScreen({ navigation }) {
  const { user, userProfile, role, logout, refreshProfile } = useAuth();
  const insets = useSafeAreaInsets();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(userProfile?.name || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [saving, setSaving] = useState(false);

  const [changingPw, setChangingPw] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  const handleSaveProfile = async () => {
    if (!name.trim()) { Alert.alert('Validation', 'Name cannot be empty.'); return; }
    setSaving(true);
    try {
      await updateUserProfile(user.uid, role, { name: name.trim(), phone: phone.trim() });
      await refreshProfile();
      setEditing(false);
      Alert.alert('✅ Saved', 'Profile updated successfully.');
    } catch {
      Alert.alert('Error', 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) {
      Alert.alert('Missing Fields', 'Please fill in all password fields.');
      return;
    }
    if (newPw !== confirmPw) {
      Alert.alert('Mismatch', 'New passwords do not match.');
      return;
    }
    if (newPw.length < 6) {
      Alert.alert('Too Short', 'Password must be at least 6 characters.');
      return;
    }
    setPwSaving(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, currentPw);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPw);
      setChangingPw(false);
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      Alert.alert('✅ Success', 'Password changed successfully.');
    } catch (err) {
      if (err.code === 'auth/wrong-password') {
        Alert.alert('Error', 'Current password is incorrect.');
      } else {
        Alert.alert('Error', 'Failed to change password.');
      }
    } finally {
      setPwSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  if (!user) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }, styles.center]}>
        <Ionicons name="person-outline" size={64} color={COLORS.border} />
        <Text style={styles.guestTitle}>Not Signed In</Text>
        <Button title="Sign In" onPress={() => navigation.navigate('Login')} style={{ marginTop: SPACING.lg }} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
    >
      {/* Avatar + name */}
      <View style={styles.avatarSection}>
        <Avatar name={userProfile?.name} uid={user.uid} size={80} />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{userProfile?.name || user.email}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <Badge
            label={role === 'admin' ? 'Admin' : role === 'doctor' ? 'Faculty' : 'Student'}
            bgColor={COLORS.accentLight}
            color={COLORS.accent}
          />
        </View>
      </View>

      {/* Profile card */}
      <View style={[styles.card, SHADOW.sm]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Profile Info</Text>
          {!editing ? (
            <TouchableOpacity onPress={() => setEditing(true)}>
              <Ionicons name="pencil-outline" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => { setEditing(false); setName(userProfile?.name || ''); setPhone(userProfile?.phone || ''); }}>
              <Ionicons name="close-outline" size={22} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {editing ? (
          <>
            <Input label="Full Name" value={name} onChangeText={setName} placeholder="Your name" autoCapitalize="words" />
            <Input label="Phone" value={phone} onChangeText={setPhone} placeholder="Phone number" keyboardType="phone-pad" />
            <Button title="Save Changes" onPress={handleSaveProfile} loading={saving} />
          </>
        ) : (
          <>
            {[
              { icon: 'person-outline', label: userProfile?.name || '—' },
              { icon: 'mail-outline', label: user.email },
              { icon: 'call-outline', label: userProfile?.phone || '—' },
              { icon: 'card-outline', label: userProfile?.Userid || '—' },
            ].map((r, i) => (
              <View key={i} style={styles.infoRow}>
                <Ionicons name={r.icon} size={18} color={COLORS.primary} />
                <Text style={styles.infoText}>{r.label}</Text>
              </View>
            ))}
          </>
        )}
      </View>

      {/* Change Password */}
      <View style={[styles.card, SHADOW.sm]}>
        <TouchableOpacity
          style={styles.cardHeader}
          onPress={() => setChangingPw((v) => !v)}
        >
          <Text style={styles.cardTitle}>Change Password</Text>
          <Ionicons
            name={changingPw ? 'chevron-up-outline' : 'chevron-down-outline'}
            size={20}
            color={COLORS.textMuted}
          />
        </TouchableOpacity>

        {changingPw && (
          <>
            <Input label="Current Password" value={currentPw} onChangeText={setCurrentPw} secureTextEntry placeholder="Current password" />
            <Input label="New Password" value={newPw} onChangeText={setNewPw} secureTextEntry placeholder="New password" />
            <Input label="Confirm New Password" value={confirmPw} onChangeText={setConfirmPw} secureTextEntry placeholder="Confirm new password" />
            <Button title="Update Password" onPress={handleChangePassword} loading={pwSaving} />
          </>
        )}
      </View>

      {/* Sign out */}
      <TouchableOpacity style={[styles.logoutBtn, SHADOW.sm]} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.xl, gap: SPACING.lg },
  center: { alignItems: 'center', justifyContent: 'center' },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    ...SHADOW.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  userInfo: { flex: 1, gap: SPACING.xs },
  userName: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: COLORS.textPrimary },
  userEmail: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  cardTitle: { fontSize: FONTS.sizes.base, fontWeight: '700', color: COLORS.textPrimary },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  infoText: { fontSize: FONTS.sizes.base, color: COLORS.textSecondary },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.errorLight,
  },
  logoutText: { fontSize: FONTS.sizes.base, fontWeight: '700', color: COLORS.error },
  guestTitle: { fontSize: FONTS.sizes.xl, fontWeight: '700', color: COLORS.textSecondary, marginTop: SPACING.lg },
});
