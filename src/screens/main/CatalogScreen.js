// src/screens/main/CatalogScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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

export default function CatalogScreen({ navigation }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [books, setBooks] = useState([]);
  const [loans, setLoans] = useState([]);
  const [wishlistMap, setWishlistMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    const unsub = subscribeBooks((data) => { setBooks(data); setLoading(false); });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = subscribeLoans((data) => setLoans(data));
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeWishlist(user.uid, (items) => {
      const map = {};
      items.forEach((i) => { map[i.bookId] = i.id; });
      setWishlistMap(map);
    });
    return unsub;
  }, [user]);

  const categories = ['All', ...new Set(books.map((b) => b.category).filter(Boolean))];

  const unavailableIds = new Set(
    loans.filter((l) => l.status === 'Active' || l.status === 'Pending').map((l) => l.bookId)
  );
  const myPendingIds = new Set(
    user
      ? loans.filter((l) => l.userId === user.uid && l.status === 'Pending').map((l) => l.bookId)
      : []
  );

  const filtered = books.filter((b) => {
    const matchQ = query
      ? b.title?.toLowerCase().includes(query.toLowerCase()) ||
        b.author?.toLowerCase().includes(query.toLowerCase())
      : true;
    const matchC = selectedCategory === 'All' || b.category === selectedCategory;
    return matchQ && matchC;
  });

  const handleWishlist = async (book) => {
    if (!user) { navigation.navigate('Login'); return; }
    const docId = wishlistMap[book.id];
    if (docId) await removeFromWishlist(docId);
    else await addToWishlist(user.uid, book.id, book.title);
  };

  if (loading) return <LoadingSpinner fullScreen message="Loading catalog..." />;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Search header */}
      <View style={styles.header}>
        <Text style={styles.title}>Book Catalog</Text>
        <Text style={styles.subtitle}>{books.length} books available</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search title or author..."
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
      </View>

      {/* Category filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryRow}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            onPress={() => setSelectedCategory(cat)}
            style={[styles.catChip, selectedCategory === cat && styles.catChipActive]}
          >
            <Text
              style={[styles.catChipText, selectedCategory === cat && styles.catChipTextActive]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Book list */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="search-outline"
            title="No books found"
            subtitle="Try a different search or category"
          />
        }
        renderItem={({ item }) => (
          <BookCard
            book={item}
            onPress={() => navigation.navigate('BookDetail', { book: item })}
            onWishlist={() => handleWishlist(item)}
            isWishlisted={!!wishlistMap[item.id]}
            isUnavailable={unavailableIds.has(item.id)}
            isPending={myPendingIds.has(item.id)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.lg,
    paddingTop: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  title: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONTS.sizes.base,
    color: COLORS.textPrimary,
  },
  categoryRow: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  catChip: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  catChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  catChipText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  catChipTextActive: {
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    paddingBottom: 100,
  },
});
