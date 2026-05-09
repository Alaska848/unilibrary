// src/screens/admin/AdminUsersScreen.js
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
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { getAllStudents, getAllDoctors } from '../../services/firestoreService';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { COLORS, SPACING, FONTS, RADIUS, SHADOW } from '../../utils/theme';

const USER_TABS = ['All', 'Students', 'Faculty'];

export default function AdminUsersScreen() {
  const insets = useSafeAreaInsets();
  const [students, setStudents] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [query, setQuery] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    try {
      const [s, d] = await Promise.all([getAllStudents(), getAllDoctors()]);
      setStudents(s);
      setDoctors(d);
    } catch (err) {
      Alert.alert('Error', 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const allUsers = [
    ...students.map((u) => ({ ...u, _type: 'student' })),
    ...doctors.map((u) => ({ ...u, _type: 'doctor' })),
  ];

  const filtered = allUsers.filter((u) => {
    const matchTab =
      activeTab === 'All' ||
      (activeTab === 'Students' && u._type === 'student') ||
      (activeTab === 'Faculty' && u._type === 'doctor');
    const matchQ = query
      ? u.name?.toLowerCase().includes(query.toLowerCase()) ||
        u.email?.toLowerCase().includes(query.toLowerCase())
      : true;
    return matchTab && matchQ;
  });

  const handleToggleSuspend = (user) => {
    const isSuspended = user.suspended === true || String(user.status || '').toLowerCase() === 'suspended';
    Alert.alert(
      isSuspended ? 'Unsuspend User' : 'Suspend User',
      `${isSuspended ? 'Restore access for' : 'Suspend'} ${user.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isSuspended ? 'Restore' : 'Suspend',
          style: isSuspended ? 'default' : 'destructive',
          onPress: async () => {
            const col = user._type === 'doctor' ? 'doctors' : 'students';
            try {
              await updateDoc(doc(db, col, user.id), {
                suspended: !isSuspended,
                status: isSuspended ? 'active' : 'suspended',
              });
              await loadUsers();
            } catch {
              Alert.alert('Error', 'Failed to update user status.');
            }
          },
        },
      ]
    );
  };

  if (loading) return <LoadingSpinner fullScreen message="Loading users..." />;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>User Management</Text>
        <Text style={styles.subtitle}>{allUsers.length} registered users</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search name or email..."
            placeholderTextColor={COLORS.textMuted}
            value={query}
            onChangeText={setQuery}
          />
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {USER_TABS.map((tab) => {
          const count =
            tab === 'All'
              ? allUsers.length
              : tab === 'Students'
              ? students.length
              : doctors.length;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab} ({count})
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
        ListEmptyComponent={<EmptyState icon="people-outline" title="No users found" />}
        renderItem={({ item }) => {
          const isSuspended =
            item.suspended === true ||
            String(item.status || '').toLowerCase() === 'suspended';
          return (
            <View style={[styles.card, SHADOW.sm]}>
              <View style={styles.cardTop}>
                <Avatar name={item.name} uid={item.id} size={44} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.userName}>{item.name || '—'}</Text>
                  <Text style={styles.userEmail} numberOfLines={1}>{item.email}</Text>
                  <View style={styles.tagRow}>
                    <Badge
                      label={item._type === 'doctor' ? 'Faculty' : 'Student'}
                      bgColor={COLORS.infoLight}
                      color={COLORS.info}
                    />
                    {isSuspended && (
                      <Badge label="Suspended" status="Suspended" />
                    )}
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => handleToggleSuspend(item)}
                  style={[styles.suspendBtn, isSuspended && styles.restoreBtn]}
                >
                  <Ionicons
                    name={isSuspended ? 'lock-open-outline' : 'ban-outline'}
                    size={16}
                    color={isSuspended ? COLORS.success : COLORS.error}
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaText}>ID: {item.Userid || '—'}</Text>
                <Text style={styles.metaText}>Phone: {item.phone || '—'}</Text>
              </View>
            </View>
          );
        }}
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
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
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
  userName: { fontSize: FONTS.sizes.base, fontWeight: '700', color: COLORS.textPrimary },
  userEmail: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, marginBottom: SPACING.xs },
  tagRow: { flexDirection: 'row', gap: SPACING.xs },
  suspendBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restoreBtn: { backgroundColor: COLORS.successLight },
  metaRow: { flexDirection: 'row', gap: SPACING.xl },
  metaText: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted },
});
