// src/screens/admin/AdminFacultyRequestsScreen.js
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
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { subscribeFacultyRequests, getBorrowerDisplayName } from '../../services/firestoreService';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { COLORS, SPACING, FONTS, RADIUS, SHADOW } from '../../utils/theme';

export default function AdminFacultyRequestsScreen() {
  const insets = useSafeAreaInsets();
  const [requests, setRequests] = useState([]);
  const [enriched, setEnriched] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Pending');

  useEffect(() => {
    const unsub = subscribeFacultyRequests(async (data) => {
      setRequests(data);
      const e = await Promise.all(
        data.map(async (r) => ({
          ...r,
          displayName: await getBorrowerDisplayName(r.submittedBy || r.userId, r.email),
        }))
      );
      setEnriched(e);
      setLoading(false);
    });
    return unsub;
  }, []);

  const tabs = ['Pending', 'Approved', 'Rejected', 'All'];

  const filtered =
    activeTab === 'All'
      ? enriched
      : enriched.filter((r) => r.status === activeTab);

  const handleAction = (req, newStatus) => {
    Alert.alert(
      `${newStatus} Request`,
      `${newStatus} the book submission "${req.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: newStatus,
          style: newStatus === 'Rejected' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              await updateDoc(doc(db, 'book_requests', req.id), {
                status: newStatus,
                reviewedAt: serverTimestamp(),
              });
            } catch {
              Alert.alert('Error', 'Failed to update request.');
            }
          },
        },
      ]
    );
  };

  if (loading) return <LoadingSpinner fullScreen message="Loading faculty requests..." />;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Faculty Requests</Text>
        <Text style={styles.subtitle}>Book submission requests from faculty</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {tabs.map((tab) => {
          const count =
            tab === 'All' ? enriched.length : enriched.filter((r) => r.status === tab).length;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab} {count > 0 ? `(${count})` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="document-outline"
            title="No requests"
            subtitle="No faculty book requests in this category."
          />
        }
        renderItem={({ item }) => (
          <View style={[styles.card, SHADOW.sm]}>
            <View style={styles.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.bookTitle} numberOfLines={2}>
                  {item.title || item.bookTitle || '—'}
                </Text>
                <Text style={styles.submittedBy}>By: {item.displayName}</Text>
              </View>
              <Badge status={item.status} />
            </View>

            {/* Book details */}
            <View style={styles.detailGrid}>
              {[
                { label: 'Author', value: item.author },
                { label: 'ISBN', value: item.isbn },
                { label: 'Category', value: item.category },
                { label: 'Copies', value: item.copies },
              ]
                .filter((d) => d.value)
                .map((d) => (
                  <View key={d.label} style={styles.detailItem}>
                    <Text style={styles.detailLabel}>{d.label}</Text>
                    <Text style={styles.detailValue}>{String(d.value)}</Text>
                  </View>
                ))}
            </View>

            {item.notes && (
              <View style={styles.notesBox}>
                <Text style={styles.notesLabel}>Notes</Text>
                <Text style={styles.notesText}>{item.notes}</Text>
              </View>
            )}

            {item.status === 'Pending' && (
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.approveBtn]}
                  onPress={() => handleAction(item, 'Approved')}
                >
                  <Ionicons name="checkmark-outline" size={16} color="#fff" />
                  <Text style={styles.actionBtnText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.rejectBtn]}
                  onPress={() => handleAction(item, 'Rejected')}
                >
                  <Ionicons name="close-outline" size={16} color="#fff" />
                  <Text style={styles.actionBtnText}>Reject</Text>
                </TouchableOpacity>
              </View>
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
  subtitle: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  tab: {
    paddingHorizontal: SPACING.md,
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
    gap: SPACING.md,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md },
  bookTitle: { fontSize: FONTS.sizes.base, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  submittedBy: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  detailItem: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minWidth: '45%',
  },
  detailLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, fontWeight: '600' },
  detailValue: { fontSize: FONTS.sizes.sm, color: COLORS.textPrimary, fontWeight: '600' },
  notesBox: {
    backgroundColor: COLORS.accentLight,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  notesLabel: { fontSize: FONTS.sizes.xs, fontWeight: '700', color: COLORS.accent, marginBottom: 4 },
  notesText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  actions: { flexDirection: 'row', gap: SPACING.sm },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  approveBtn: { backgroundColor: COLORS.success },
  rejectBtn: { backgroundColor: COLORS.error },
  actionBtnText: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: '#fff' },
});
