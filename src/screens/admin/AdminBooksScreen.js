// src/screens/admin/AdminBooksScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ScrollView,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { subscribeBooks } from '../../services/firestoreService';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { COLORS, SPACING, FONTS, RADIUS, SHADOW } from '../../utils/theme';

const EMPTY_BOOK = {
  title: '',
  author: '',
  category: '',
  description: '',
  copies: '',
  isbn: '',
  year: '',
  language: '',
  coverUrl: '',
};

export default function AdminBooksScreen() {
  const insets = useSafeAreaInsets();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBook, setEditingBook] = useState(null); // null = add mode
  const [form, setForm] = useState(EMPTY_BOOK);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = subscribeBooks((data) => { setBooks(data); setLoading(false); });
    return unsub;
  }, []);

  const filtered = query
    ? books.filter(
        (b) =>
          b.title?.toLowerCase().includes(query.toLowerCase()) ||
          b.author?.toLowerCase().includes(query.toLowerCase())
      )
    : books;

  const openAddModal = () => {
    setEditingBook(null);
    setForm(EMPTY_BOOK);
    setModalVisible(true);
  };

  const openEditModal = (book) => {
    setEditingBook(book);
    setForm({
      title: book.title || '',
      author: book.author || '',
      category: book.category || '',
      description: book.description || '',
      copies: String(book.copies ?? ''),
      isbn: book.isbn || '',
      year: String(book.year || ''),
      language: book.language || '',
      coverUrl: book.coverUrl || '',
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.author.trim()) {
      Alert.alert('Required Fields', 'Title and Author are required.');
      return;
    }
    setSaving(true);
    try {
      const data = {
        ...form,
        copies: Number(form.copies) || 0,
        year: Number(form.year) || null,
        updatedAt: serverTimestamp(),
      };
      if (editingBook) {
        await updateDoc(doc(db, 'books', editingBook.id), data);
      } else {
        await addDoc(collection(db, 'books'), { ...data, createdAt: serverTimestamp() });
      }
      setModalVisible(false);
    } catch {
      Alert.alert('Error', 'Failed to save book.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (book) => {
    Alert.alert(
      'Delete Book',
      `Delete "${book.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'books', book.id));
            } catch {
              Alert.alert('Error', 'Failed to delete book.');
            }
          },
        },
      ]
    );
  };

  const setField = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  if (loading) return <LoadingSpinner fullScreen message="Loading books..." />;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Books</Text>
            <Text style={styles.subtitle}>{books.length} books in catalog</Text>
          </View>
          <TouchableOpacity onPress={openAddModal} style={styles.addBtn}>
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search books..."
            placeholderTextColor={COLORS.textMuted}
            value={query}
            onChangeText={setQuery}
          />
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState icon="book-outline" title="No books found" />}
        renderItem={({ item }) => (
          <View style={[styles.card, SHADOW.sm]}>
            <View style={styles.cardRow}>
              {/* Cover thumbnail */}
              <View style={styles.thumb}>
                {item.coverUrl ? (
                  <Image source={{ uri: item.coverUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                ) : (
                  <Ionicons name="book" size={22} color={COLORS.primary} style={{ opacity: 0.3 }} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bookTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.bookAuthor}>{item.author}</Text>
                <View style={styles.metaRow}>
                  {item.category && (
                    <Text style={styles.metaTag}>{item.category}</Text>
                  )}
                  <Text style={styles.metaCopies}>{item.copies ?? 0} copies</Text>
                </View>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity onPress={() => openEditModal(item)} style={styles.iconBtn}>
                  <Ionicons name="pencil-outline" size={18} color={COLORS.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item)} style={styles.iconBtn}>
                  <Ionicons name="trash-outline" size={18} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />

      {/* Add / Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{editingBook ? 'Edit Book' : 'Add New Book'}</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Input label="Title *" value={form.title} onChangeText={(v) => setField('title', v)} placeholder="Book title" autoCapitalize="words" />
              <Input label="Author *" value={form.author} onChangeText={(v) => setField('author', v)} placeholder="Author name" autoCapitalize="words" />
              <Input label="Category" value={form.category} onChangeText={(v) => setField('category', v)} placeholder="e.g. Computer Science" />
              <Input label="Number of Copies" value={form.copies} onChangeText={(v) => setField('copies', v)} placeholder="0" keyboardType="number-pad" />
              <Input label="ISBN" value={form.isbn} onChangeText={(v) => setField('isbn', v)} placeholder="978-..." />
              <Input label="Year Published" value={form.year} onChangeText={(v) => setField('year', v)} placeholder="2024" keyboardType="number-pad" />
              <Input label="Language" value={form.language} onChangeText={(v) => setField('language', v)} placeholder="English" />
              <Input label="Cover Image URL" value={form.coverUrl} onChangeText={(v) => setField('coverUrl', v)} placeholder="https://..." />
              <Input
                label="Description"
                value={form.description}
                onChangeText={(v) => setField('description', v)}
                placeholder="Book description..."
                multiline
                numberOfLines={4}
              />

              <View style={styles.modalBtns}>
                <Button title="Cancel" variant="outline" onPress={() => setModalVisible(false)} style={{ flex: 1 }} />
                <Button title={editingBook ? 'Save Changes' : 'Add Book'} onPress={handleSave} loading={saving} style={{ flex: 1 }} />
              </View>
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  title: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: COLORS.textPrimary },
  subtitle: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  list: { padding: SPACING.xl, paddingBottom: 100 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: 'hidden',
  },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  thumb: {
    width: 60,
    height: 80,
    backgroundColor: COLORS.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookTitle: { fontSize: FONTS.sizes.base, fontWeight: '700', color: COLORS.textPrimary, padding: SPACING.sm, paddingBottom: 2 },
  bookAuthor: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, paddingHorizontal: SPACING.sm },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingHorizontal: SPACING.sm, marginTop: 4 },
  metaTag: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.accent,
    backgroundColor: COLORS.accentLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    fontWeight: '600',
  },
  metaCopies: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted },
  cardActions: { flexDirection: 'column', gap: SPACING.sm, padding: SPACING.md },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.xl,
    maxHeight: '90%',
  },
  modalHandle: {
    width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2,
    alignSelf: 'center', marginBottom: SPACING.xl,
  },
  modalTitle: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SPACING.xl },
  modalBtns: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.md },
});
