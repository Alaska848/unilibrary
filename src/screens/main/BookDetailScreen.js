// src/screens/main/BookDetailScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import {
  subscribeLoans,
  subscribeWishlist,
  addToWishlist,
  removeFromWishlist,
  createLoanRequest,
  getBorrowerDisplayName,
} from '../../services/firestoreService';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { COLORS, SPACING, FONTS, RADIUS, SHADOW } from '../../utils/theme';

export default function BookDetailScreen({ route, navigation }) {
  const { book } = route.params;
  const { user, userProfile, role } = useAuth();
  const insets = useSafeAreaInsets();

  const [loans, setLoans] = useState([]);
  const [wishlistDocId, setWishlistDocId] = useState(null);
  const [borrowModalVisible, setBorrowModalVisible] = useState(false);
  const [borrowDate, setBorrowDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [submitting, setSubmitting] = useState(false);
  const [currentBorrowers, setCurrentBorrowers] = useState([]);

  useEffect(() => {
    const unsub = subscribeLoans((all) => {
      setLoans(all);
      // Resolve borrower names for active loans of this book
      const active = all.filter((l) => l.bookId === book.id && (l.status === 'Active' || l.status === 'Pending'));
      Promise.all(
        active.map(async (l) => ({
          ...l,
          displayName: await getBorrowerDisplayName(l.userId, l.userEmail),
        }))
      ).then(setCurrentBorrowers);
    });
    return unsub;
  }, [book.id]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeWishlist(user.uid, (items) => {
      const found = items.find((i) => i.bookId === book.id);
      setWishlistDocId(found ? found.id : null);
    });
    return unsub;
  }, [user, book.id]);

  const isUnavailable = loans.some(
    (l) => l.bookId === book.id && (l.status === 'Active' || l.status === 'Pending')
  );
  const myPendingLoan = user
    ? loans.find((l) => l.bookId === book.id && l.userId === user.uid && l.status === 'Pending')
    : null;
  const myActiveLoan = user
    ? loans.find((l) => l.bookId === book.id && l.userId === user.uid && l.status === 'Active')
    : null;

  const handleWishlist = async () => {
    if (!user) { navigation.navigate('Login'); return; }
    if (wishlistDocId) await removeFromWishlist(wishlistDocId);
    else await addToWishlist(user.uid, book.id, book.title);
  };

  const handleBorrowRequest = async () => {
    if (!user) { navigation.navigate('Login'); return; }
    if (!borrowDate) {
      Alert.alert('Date Required', 'Please select a return date.');
      return;
    }
    setSubmitting(true);
    try {
      await createLoanRequest({
        bookId: book.id,
        bookTitle: book.title,
        userId: user.uid,
        userEmail: user.email,
        userName: userProfile?.name || user.email,
        returnDate: borrowDate,
        dueDate: borrowDate,
      });
      setBorrowModalVisible(false);
      setBorrowDate('');
      Alert.alert('✅ Request Submitted', 'Your borrow request has been submitted and is pending approval.');
    } catch (err) {
      Alert.alert('Error', 'Failed to submit borrow request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const onDateChange = (event, date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
      const formatted = date.toISOString().split('T')[0];
      setBorrowDate(formatted);
    }
  };

  const coverUrl = book.coverUrl || book.imageUrl || book.cover || null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Nav */}
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleWishlist} style={styles.navBtn}>
          <Ionicons
            name={wishlistDocId ? 'heart' : 'heart-outline'}
            size={22}
            color={wishlistDocId ? COLORS.error : COLORS.primary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cover + Basic info */}
        <View style={styles.heroArea}>
          <View style={styles.coverWrap}>
            {coverUrl ? (
              <Image source={{ uri: coverUrl }} style={styles.cover} resizeMode="cover" />
            ) : (
              <View style={[styles.cover, styles.coverPlaceholder]}>
                <Ionicons name="book" size={56} color={COLORS.primary} style={{ opacity: 0.3 }} />
              </View>
            )}
          </View>
          <Text style={styles.bookTitle}>{book.title}</Text>
          <Text style={styles.bookAuthor}>{book.author || 'Unknown Author'}</Text>
          {book.category && <Badge label={book.category} bgColor={COLORS.accentLight} color={COLORS.accent} />}
        </View>

        {/* Availability */}
        <View style={styles.availRow}>
          <View style={[styles.availDot, isUnavailable && styles.availDotUnavail]} />
          <Text style={styles.availText}>{isUnavailable ? 'Currently Borrowed' : 'Available to Borrow'}</Text>
        </View>

        {/* Meta info */}
        <View style={styles.metaGrid}>
          {[
            { icon: 'layers-outline', label: 'Copies', value: book.copies ?? '—' },
            { icon: 'calendar-outline', label: 'Year', value: book.year || book.publishYear || '—' },
            { icon: 'globe-outline', label: 'Language', value: book.language || '—' },
            { icon: 'barcode-outline', label: 'ISBN', value: book.isbn || '—' },
          ].map((m) => (
            <View key={m.label} style={styles.metaItem}>
              <Ionicons name={m.icon} size={18} color={COLORS.primary} />
              <Text style={styles.metaLabel}>{m.label}</Text>
              <Text style={styles.metaValue}>{String(m.value)}</Text>
            </View>
          ))}
        </View>

        {/* Description */}
        {book.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About this Book</Text>
            <Text style={styles.description}>{book.description}</Text>
          </View>
        )}

        {/* Current borrowers (admin only) */}
        {role === 'admin' && currentBorrowers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Currently Borrowed By</Text>
            {currentBorrowers.map((l) => (
              <View key={l.id} style={styles.borrowerRow}>
                <Ionicons name="person-circle-outline" size={22} color={COLORS.textSecondary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.borrowerName}>{l.displayName}</Text>
                  <Text style={styles.borrowerDate}>Due: {l.dueDate || l.returnDate || '—'}</Text>
                </View>
                <Badge status={l.status} />
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Borrow CTA */}
      {role !== 'admin' && (
        <View style={[styles.ctaBar, { paddingBottom: insets.bottom + SPACING.md }]}>
          {myActiveLoan ? (
            <View style={styles.ctaInfo}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
              <Text style={styles.ctaInfoText}>You have this book. Due: {myActiveLoan.dueDate || '—'}</Text>
            </View>
          ) : myPendingLoan ? (
            <View style={styles.ctaInfo}>
              <Ionicons name="time" size={20} color={COLORS.accent} />
              <Text style={styles.ctaInfoText}>Your request is pending approval.</Text>
            </View>
          ) : (
            <Button
              title={isUnavailable ? 'Currently Unavailable' : 'Request to Borrow'}
              onPress={() => {
                if (!user) { navigation.navigate('Login'); return; }
                if (!isUnavailable) setBorrowModalVisible(true);
              }}
              disabled={isUnavailable}
              style={styles.borrowBtn}
              size="lg"
            />
          )}
        </View>
      )}

      {/* Borrow Modal */}
      <Modal
        visible={borrowModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setBorrowModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Request to Borrow</Text>
            <Text style={styles.modalBook}>{book.title}</Text>

            <TouchableOpacity
              style={styles.datePicker}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
              <Text style={[styles.dateText, !borrowDate && { color: COLORS.textMuted }]}>
                {borrowDate || 'Select return date'}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                minimumDate={new Date(Date.now() + 86400000)}
                onChange={onDateChange}
              />
            )}

            <View style={styles.modalBtns}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setBorrowModalVisible(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Submit Request"
                onPress={handleBorrowRequest}
                loading={submitting}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.sm,
  },
  heroArea: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  coverWrap: {
    ...SHADOW.lg,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
  cover: {
    width: 160,
    height: 220,
    borderRadius: RADIUS.md,
  },
  coverPlaceholder: {
    backgroundColor: COLORS.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  bookAuthor: {
    fontSize: FONTS.sizes.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  availRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  availDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
  },
  availDotUnavail: { backgroundColor: COLORS.error },
  availText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, fontWeight: '600' },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  metaItem: {
    width: '47%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  metaLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, fontWeight: '600' },
  metaValue: { fontSize: FONTS.sizes.base, color: COLORS.textPrimary, fontWeight: '700' },
  section: { paddingHorizontal: SPACING.xl, marginBottom: SPACING.xl },
  sectionTitle: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.md },
  description: { fontSize: FONTS.sizes.base, color: COLORS.textSecondary, lineHeight: 24 },
  borrowerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  borrowerName: { fontSize: FONTS.sizes.base, fontWeight: '600', color: COLORS.textPrimary },
  borrowerDate: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted },
  ctaBar: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  ctaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: COLORS.successLight,
    borderRadius: RADIUS.lg,
  },
  ctaInfoText: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textSecondary, flex: 1 },
  borrowBtn: { width: '100%' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.xl,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: SPACING.xl,
  },
  modalTitle: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SPACING.xs },
  modalBook: { fontSize: FONTS.sizes.base, color: COLORS.textSecondary, marginBottom: SPACING.xl },
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.lg,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: SPACING.xl,
  },
  dateText: { fontSize: FONTS.sizes.base, color: COLORS.textPrimary, fontWeight: '500' },
  modalBtns: { flexDirection: 'row', gap: SPACING.md },
});
