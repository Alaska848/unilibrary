// src/screens/admin/AdminBorrowingLogScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { subscribeLoans, updateLoan, getBorrowerDisplayName } from '../../services/firestoreService';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { COLORS, SPACING, FONTS, RADIUS, SHADOW } from '../../utils/theme';

const STATUS_TABS = ['All', 'Pending', 'Active', 'Overdue', 'Returned', 'Rejected'];

export default function AdminBorrowingLogScreen() {
  const insets = useSafeAreaInsets();
  const [loans, setLoans] = useState([]);
  const [enriched, setEnriched] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [query, setQuery] = useState('');

  useEffect(() => {
    const unsub = subscribeLoans(async (data) => {
      setLoans(data);
      // Enrich with display names
      const enrichedData = await Promise.all(
        data.map(async (l) => ({
          ...l,
          displayName: await getBorrowerDisplayName(l.userId, l.userEmail),
          _status: getEffectiveStatus(l),
        }))
      );
      setEnriched(enrichedData);
      setLoading(false);
    });
    return unsub;
  }, []);

  function getEffectiveStatus(loan) {
    if (['Returned', 'Rejected', 'Pending', 'Suspended'].includes(loan.status)) return loan.status;
    const due = loan.dueDate || loan.returnDate;
    if (due) {
      const dueMs = typeof due === 'string'
        ? new Date(due + 'T12:00:00').getTime()
        : due?.toDate?.()?.getTime() || due?.seconds * 1000;
      if (dueMs && dueMs < Date.now()) return 'Overdue';
    }
    return 'Active';
  }

  const handleStatusChange = (loan, newStatus) => {
    Alert.alert(
      `Set to ${newStatus}`,
      `Change "${loan.bookTitle}" status to ${newStatus}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await updateLoan(loan.id, { status: newStatus });
            } catch {
              Alert.alert('Error', 'Failed to update status.');
            }
          },
        },
      ]
    );
  };

  const filtered = enriched.filter((l) => {
    const matchTab = activeTab === 'All' || l._status === activeTab;
    const matchQ = query
      ? l.bookTitle?.toLowerCase().includes(query.toLowerCase()) ||
        l.displayName?.toLowerCase().includes(query.toLowerCase())
      : true;
    return matchTab && matchQ;
  });

  if (loading) return <LoadingSpinner fullScreen message="Loading borrowing log..." />;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Borrowing Log</Text>
        <Text style={styles.subtitle}>{loans.length} total records</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search book or borrower..."
            placeholderTextColor={COLORS.textMuted}
            value={query}
            onChangeText={setQuery}
          />
        </View>
      </View>

      <FlatList
        horizontal
        data={STATUS_TABS}
        keyExtractor={(t) => t}
        contentContainerStyle={styles.tabRow}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item: tab }) => {
          const count = enriched.filter((l) => tab === 'All' || l._status === tab).length;
          return (
            <TouchableOpacity
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab} {count > 0 ? `(${count})` : ''}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState icon="list-outline" title="No records" />}
        renderItem={({ item }) => (
          <View style={[styles.card, SHADOW.sm]}>
            <View style={styles.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.bookTitle} numberOfLines={2}>{item.bookTitle || '—'}</Text>
                <Text style={styles.borrower}>{item.displayName}</Text>
              </View>
              <Badge status={item._status} />
            </View>

            <View style={styles.meta}>
              <Text style={styles.metaText}>Due: {item.dueDate || item.returnDate || '—'}</Text>
              <Text style={styles.metaText}>
                Requested: {item.createdAt?.toDate?.()?.toLocaleDateString() || '—'}
              </Text>
            </View>

            {/* Admin actions */}
            {item._status === 'Pending' && (
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.approveBtn]}
                  onPress={() => handleStatusChange(item, 'Active')}
                >
                  <Ionicons name="checkmark-outline" size={16} color="#fff" />
                  <Text style={styles.actionBtnText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.rejectBtn]}
                  onPress={() => handleStatusChange(item, 'Rejected')}
                >
                  <Ionicons name="close-outline" size={16} color="#fff" />
                  <Text style={styles.actionBtnText}>Reject</Text>
                </TouchableOpacity>
              </View>
            )}
            {item._status === 'Active' && (
              <TouchableOpacity
                style={[styles.actionBtn, styles.returnedBtn]}
                onPress={() => handleStatusChange(item, 'Returned')}
              >
                <Ionicons name="return-down-back-outline" size={16} color={COLORS.primary} />
                <Text style={[styles.actionBtnText, { color: COLORS.primary }]}>Mark Returned</Text>
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
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  title: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: COLORS.textPrimary },
  subtitle: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, marginBottom: SPACING.md },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: { flex: 1, fontSize: FONTS.sizes.base, color: COLORS.textPrimary },
  tabRow: { paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, gap: SPACING.sm },
  tab: {
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
  list: { padding: SPACING.xl, paddingBottom: 100 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: SPACING.sm,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md },
  bookTitle: { fontSize: FONTS.sizes.base, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  borrower: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  meta: { gap: 2 },
  metaText: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted },
  actions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  approveBtn: { backgroundColor: COLORS.success },
  rejectBtn: { backgroundColor: COLORS.error },
  returnedBtn: {
    backgroundColor: COLORS.accentLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignSelf: 'flex-start',
  },
  actionBtnText: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: '#fff' },
});
