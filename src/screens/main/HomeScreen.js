// src/screens/main/HomeScreen.js
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import {
  subscribeBooks,
  subscribeLoans,
  subscribeWishlist,
  addToWishlist,
  removeFromWishlist,
} from '../../services/firestoreService';
import BookCard from '../../components/ui/BookCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { COLORS, SPACING, FONTS, RADIUS, SHADOW } from '../../utils/theme';

export default function HomeScreen({ navigation }) {
  const { user, userProfile, role } = useAuth();
  const insets = useSafeAreaInsets();

  const [books, setBooks] = useState([]);
  const [allLoans, setAllLoans] = useState([]);
  const [wishlistMap, setWishlistMap] = useState({}); // bookId -> wishlistDocId
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');

  // Subscribe to books
  useEffect(() => {
    const unsub = subscribeBooks((data) => {
      setBooks(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  // Subscribe to all loans (to know availability)
  useEffect(() => {
    const unsub = subscribeLoans((data) => setAllLoans(data));
    return unsub;
  }, []);

  // Subscribe to user wishlist
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeWishlist(user.uid, (items) => {
      const map = {};
      items.forEach((i) => { map[i.bookId] = i.id; });
      setWishlistMap(map);
    });
    return unsub;
  }, [user]);

  const unavailableBookIds = new Set(
    allLoans
      .filter((l) => l.status === 'Active' || l.status === 'Pending')
      .map((l) => l.bookId)
  );

  const myPendingBookIds = new Set(
    user
      ? allLoans
          .filter((l) => l.userId === user.uid && l.status === 'Pending')
          .map((l) => l.bookId)
      : []
  );

  const filteredBooks = query.trim()
    ? books.filter(
        (b) =>
          b.title?.toLowerCase().includes(query.toLowerCase()) ||
          b.author?.toLowerCase().includes(query.toLowerCase()) ||
          b.category?.toLowerCase().includes(query.toLowerCase())
      )
    : books;

  const featuredBooks = books.slice(0, 6);

  const handleWishlist = async (book) => {
    if (!user) {
      navigation.navigate('Login');
      return;
    }
    const docId = wishlistMap[book.id];
    if (docId) {
      await removeFromWishlist(docId);
    } else {
      await addToWishlist(user.uid, book.id, book.title);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  if (loading) return <LoadingSpinner fullScreen message="Loading library..." />;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient
        colors={[COLORS.primaryDark, COLORS.primary]}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>
              {user ? `Hello, ${userProfile?.name?.split(' ')[0] || 'Reader'} 👋` : 'Welcome 👋'}
            </Text>
            <Text style={styles.headerSub}>What would you like to read?</Text>
          </View>
          {user && (
            <TouchableOpacity
              onPress={() => navigation.navigate('Profile')}
              style={styles.profileBtn}
            >
              <View style={styles.profileAvatar}>
                <Text style={styles.profileInitial}>
                  {userProfile?.name?.[0]?.toUpperCase() || '?'}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Search bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search books, authors, categories..."
            placeholderTextColor={COLORS.textMuted}
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats bar for user */}
        {user && role !== 'admin' && (
          <View style={styles.statsRow}>
            <TouchableOpacity
              style={styles.statCard}
              onPress={() => navigation.navigate('MyBooks')}
            >
              <Ionicons name="book" size={22} color={COLORS.primary} />
              <Text style={styles.statNum}>
                {allLoans.filter((l) => l.userId === user.uid && l.status === 'Active').length}
              </Text>
              <Text style={styles.statLabel}>Active Loans</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.statCard}
              onPress={() => navigation.navigate('MyBooks')}
            >
              <Ionicons name="time-outline" size={22} color={COLORS.accent} />
              <Text style={styles.statNum}>
                {allLoans.filter((l) => l.userId === user.uid && l.status === 'Pending').length}
              </Text>
              <Text style={styles.statLabel}>Pending</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.statCard}
              onPress={() => navigation.navigate('Catalog')}
            >
              <Ionicons name="heart-outline" size={22} color={COLORS.error} />
              <Text style={styles.statNum}>{Object.keys(wishlistMap).length}</Text>
              <Text style={styles.statLabel}>Wishlist</Text>
            </TouchableOpacity>
          </View>
        )}

        {query.trim() ? (
          // Search results
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {filteredBooks.length} result{filteredBooks.length !== 1 ? 's' : ''} for "{query}"
            </Text>
            {filteredBooks.length === 0 ? (
              <EmptyState icon="search-outline" title="No books found" subtitle="Try a different keyword" />
            ) : (
              filteredBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onPress={() => navigation.navigate('BookDetail', { book })}
                  onWishlist={() => handleWishlist(book)}
                  isWishlisted={!!wishlistMap[book.id]}
                  isUnavailable={unavailableBookIds.has(book.id)}
                  isPending={myPendingBookIds.has(book.id)}
                />
              ))
            )}
          </View>
        ) : (
          <>
            {/* Featured */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Featured Books</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Catalog')}>
                  <Text style={styles.seeAll}>See All</Text>
                </TouchableOpacity>
              </View>
              {featuredBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onPress={() => navigation.navigate('BookDetail', { book })}
                  onWishlist={() => handleWishlist(book)}
                  isWishlisted={!!wishlistMap[book.id]}
                  isUnavailable={unavailableBookIds.has(book.id)}
                  isPending={myPendingBookIds.has(book.id)}
                />
              ))}
            </View>

            {/* Quick actions for admin */}
            {role === 'admin' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Admin Quick Actions</Text>
                <View style={styles.adminGrid}>
                  {[
                    { label: 'Manage Books', icon: 'book-outline', screen: 'AdminBooks' },
                    { label: 'Borrowing Log', icon: 'list-outline', screen: 'AdminBorrowingLog' },
                    { label: 'Users', icon: 'people-outline', screen: 'AdminUsers' },
                    { label: 'Faculty Requests', icon: 'document-outline', screen: 'AdminFacultyRequests' },
                  ].map((a) => (
                    <TouchableOpacity
                      key={a.screen}
                      style={styles.adminCard}
                      onPress={() => navigation.navigate(a.screen)}
                    >
                      <Ionicons name={a.icon} size={26} color={COLORS.primary} />
                      <Text style={styles.adminCardLabel}>{a.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
    paddingTop: SPACING.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  greeting: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '800',
    color: '#fff',
  },
  headerSub: {
    fontSize: FONTS.sizes.sm,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  profileBtn: {},
  profileAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  profileInitial: {
    color: '#fff',
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    gap: SPACING.sm,
    ...SHADOW.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONTS.sizes.base,
    color: COLORS.textPrimary,
  },
  scroll: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.xs,
    ...SHADOW.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  statNum: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  seeAll: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  adminGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  adminCard: {
    width: '47%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.sm,
    ...SHADOW.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  adminCardLabel: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
});
