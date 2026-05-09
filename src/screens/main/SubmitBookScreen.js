// src/screens/main/SubmitBookScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { submitBookRequest } from '../../services/firestoreService';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { COLORS, SPACING, FONTS, RADIUS } from '../../utils/theme';

export default function SubmitBookScreen({ navigation }) {
  const { user, userProfile, role } = useAuth();
  const insets = useSafeAreaInsets();

  const [form, setForm] = useState({
    title: '',
    author: '',
    isbn: '',
    category: '',
    copies: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  const setField = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.author.trim()) {
      Alert.alert('Required Fields', 'Please fill in the title and author.');
      return;
    }
    setLoading(true);
    try {
      await submitBookRequest({
        ...form,
        copies: Number(form.copies) || 1,
        submittedBy: user.uid,
        submittedByName: userProfile?.name || user.email,
        email: user.email,
      });
      setForm({ title: '', author: '', isbn: '', category: '', copies: '', notes: '' });
      Alert.alert(
        '✅ Submitted',
        'Your book request has been submitted and is pending admin review.'
      );
    } catch {
      Alert.alert('Error', 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Only doctors can see this
  if (role !== 'doctor') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <EmptyState
          icon="lock-closed-outline"
          title="Faculty Only"
          subtitle="This feature is only available for faculty members."
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={[styles.container, { paddingTop: insets.top }]}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <Ionicons name="book-outline" size={28} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>Submit Book Request</Text>
          <Text style={styles.subtitle}>
            Request a book to be added to the library catalog. An admin will review your submission.
          </Text>
        </View>

        {/* Form */}
        <Input
          label="Book Title *"
          value={form.title}
          onChangeText={(v) => setField('title', v)}
          placeholder="Full book title"
          autoCapitalize="words"
          leftIcon={<Ionicons name="book-outline" size={18} color={COLORS.textMuted} />}
        />
        <Input
          label="Author *"
          value={form.author}
          onChangeText={(v) => setField('author', v)}
          placeholder="Author's full name"
          autoCapitalize="words"
          leftIcon={<Ionicons name="person-outline" size={18} color={COLORS.textMuted} />}
        />
        <Input
          label="ISBN"
          value={form.isbn}
          onChangeText={(v) => setField('isbn', v)}
          placeholder="e.g. 978-3-16-148410-0"
          leftIcon={<Ionicons name="barcode-outline" size={18} color={COLORS.textMuted} />}
        />
        <Input
          label="Category / Subject"
          value={form.category}
          onChangeText={(v) => setField('category', v)}
          placeholder="e.g. Computer Science, Physics"
          leftIcon={<Ionicons name="folder-outline" size={18} color={COLORS.textMuted} />}
        />
        <Input
          label="Number of Copies Needed"
          value={form.copies}
          onChangeText={(v) => setField('copies', v)}
          placeholder="1"
          keyboardType="number-pad"
          leftIcon={<Ionicons name="layers-outline" size={18} color={COLORS.textMuted} />}
        />
        <Input
          label="Additional Notes"
          value={form.notes}
          onChangeText={(v) => setField('notes', v)}
          placeholder="Reason for request, course this book is for, etc."
          multiline
          numberOfLines={4}
        />

        <Button
          title="Submit Request"
          onPress={handleSubmit}
          loading={loading}
          style={styles.submitBtn}
          size="lg"
        />

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.xl },
  header: {
    marginBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  title: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: COLORS.textPrimary },
  subtitle: { fontSize: FONTS.sizes.base, color: COLORS.textSecondary, lineHeight: 22 },
  submitBtn: { width: '100%', marginTop: SPACING.md },
});
