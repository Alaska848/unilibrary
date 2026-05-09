// src/screens/main/MyBooksScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { subscribeUserLoans, updateLoan } from '../../services/firestoreService';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { COLORS, SPACING, FONTS, RADIUS, SHADOW } from '../../utils/theme';

function getLoanStatus(loan) {
  if (['Returned', 'Rejected', 'Pending', 'Suspended'].includes(loan.status)) return loan.status;
  const due = loan.dueDate || loan.returnDate;
  if (due) {
    const dueMs =
      typeof due === 'string'
        ? new Date(due + 'T12:00:00').getTime()
        : due?.toDate?.()?.getTime() || due?.seconds * 1000;
    if (dueMs && dueMs < Date.now()) return 'Overdue';
  }
  return 'Active';
}

const TABS = ['All', 'Active', 'Pending', 'Overdue', 'Returned'];

export default function MyBooksScreen({ navigation }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeUserLoans(user.uid, (data) => {
      setLoans(data);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const loansWithStatus = loans.map((l) => ({ ...l, _status: getLoanStatus(l) }));

  const filtered =
    activeTab === 'All' ? loansWithStatus : loansWithStatus.filter((l) => l._status === activeTab);

  const handleReturn = (loan) => {
    Alert.alert(
      'Return Book',
      `Mark "${loan.bookTitle}" as returned?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Return',
          onPress: async () => {
            try {
              await updateLoan(loan.id, { status: 'Returned', returnedAt: serverTimestamp() });
            } catch {
              Alert.alert('Error', 'Failed to update loan status.');
            }
          },
        },
      ]
    );
  };

  if (!user) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <EmptyState
          icon="lock-closed-outline"
          title="Sign in required"
          subtitle="Please sign in to view your borrowed books."
        />
      </View>
    );
  }

  if (loading) return <LoadingSpinner fullScreen message="Loading your books..." />;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>My Books</Text>
        <Text style={styles.subtitle}>{loans.length} total loan{loans.length !== 1 ? 's' : ''}</Text>
      </View>

      {/* Status tabs */}
      <FlatList
        horizontal
        data={TABS}
        keyExtractor={(t) => t}
        contentContainerStyle={styles.tabRow}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item: tab }) => {
          const count = loansWithStatus.filter((l) => tab === 'All' || l._status === tab).length;
          return (
            <TouchableOpacity
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab}
              </Text>
              {count > 0 && (
                <View style={[styles.tabBadge, activeTab === tab && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, activeTab === tab && { color: COLORS.primary }]}>
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState icon="book-outline" title="No loans" subtitle="No books in this category." />
        }
        renderItem={({ item }) => (
          <View style={[styles.loanCard, SHADOW.sm]}>
            <View style={styles.loanTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.bookTitle} numberOfLines={2}>{item.bookTitle || 'Unknown Book'}</Text>
                <Badge status={item._status} />
              </View>
            </View>

            <View style={styles.loanMeta}>
              {[
                { icon: 'calendar-outline', label: 'Requested', value: item.createdAt?.toDate?.()?.toLocaleDateString() || '—' },
                { icon: 'time-outline', label: 'Due Date', value: item.dueDate || item.returnDate || '—' },
              ].map((m) => (
                <View key={m.label} style={styles.metaRow}>
                  <Ionicons name={m.icon} size={14} color={COLORS.textMuted} />
                  <Text style={styles.metaLabel}>{m.label}:</Text>
                  <Text style={styles.metaValue}>{m.value}</Text>
                </View>
              ))}
            </View>

            {item._status === 'Active' && (
              <TouchableOpacity onPress={() => handleReturn(item)} style={styles.returnBtn}>
                <Ionicons name="return-down-back-outline" size={16} color={COLORS.primary} />
                <Text style={styles.returnBtnText}>Mark as Returned</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  title: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: COLORS.textPrimary },
  subtitle: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, marginTop: 2 },
  tabRow: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textSecondary },
  tabTextActive: { color: '#fff' },
  tabBadge: {
    backgroundColor: COLORS.borderLight,
    borderRadius: RADIUS.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  tabBadgeActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  tabBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted },
  listContent: { padding: SPACING.xl, paddingBottom: 100 },
  loanCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: SPACING.md,
  },
  loanTop: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md },
  bookTitle: { fontSize: FONTS.sizes.base, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.xs },
  loanMeta: { gap: SPACING.xs },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  metaLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, fontWeight: '600' },
  metaValue: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  returnBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.accentLight,
    borderRadius: RADIUS.md,
    alignSelf: 'flex-start',
  },
  returnBtnText: { fontSize: FONTS.sizes.sm, color: COLORS.primary, fontWeight: '600' },
});
