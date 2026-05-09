// src/components/ui/BookCard.js
import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONTS, SHADOW } from '../../utils/theme';

export default function BookCard({
  book,
  onPress,
  onWishlist,
  isWishlisted = false,
  isUnavailable = false,
  isPending = false,
  compact = false,
}) {
  const coverUrl = book.coverUrl || book.imageUrl || book.cover || null;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.card, compact && styles.cardCompact, SHADOW.sm]}
    >
      {/* Cover */}
      <View style={[styles.cover, compact && styles.coverCompact]}>
        {coverUrl ? (
          <Image source={{ uri: coverUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <View style={styles.coverPlaceholder}>
            <Ionicons name="book" size={compact ? 24 : 32} color={COLORS.primary} style={{ opacity: 0.4 }} />
          </View>
        )}
        {/* Availability pill */}
        {(isUnavailable || isPending) && (
          <View style={[styles.pill, isPending && styles.pillPending]}>
            <Text style={styles.pillText}>{isPending ? 'Pending' : 'Borrowed'}</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={compact ? 2 : 3}>
          {book.title || 'Untitled'}
        </Text>
        <Text style={styles.author} numberOfLines={1}>
          {book.author || 'Unknown Author'}
        </Text>
        {!compact && book.category && (
          <View style={styles.categoryRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{book.category}</Text>
            </View>
          </View>
        )}
        {!compact && (
          <View style={styles.metaRow}>
            {book.copies !== undefined && (
              <View style={styles.metaItem}>
                <Ionicons name="layers-outline" size={12} color={COLORS.textMuted} />
                <Text style={styles.metaText}>{book.copies} copies</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Wishlist button */}
      {onWishlist && (
        <TouchableOpacity onPress={onWishlist} style={styles.wishBtn} hitSlop={8}>
          <Ionicons
            name={isWishlisted ? 'heart' : 'heart-outline'}
            size={20}
            color={isWishlisted ? COLORS.error : COLORS.textMuted}
          />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  cardCompact: {
    marginBottom: SPACING.sm,
  },
  cover: {
    width: 80,
    height: 110,
    backgroundColor: COLORS.surfaceAlt,
  },
  coverCompact: {
    width: 64,
    height: 88,
  },
  coverPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accentLight,
  },
  pill: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: COLORS.error,
    borderRadius: RADIUS.full,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  pillPending: {
    backgroundColor: COLORS.accent,
  },
  pillText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  info: {
    flex: 1,
    padding: SPACING.md,
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  title: {
    fontSize: FONTS.sizes.base,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  author: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  categoryRow: {
    flexDirection: 'row',
    marginTop: SPACING.xs,
  },
  categoryBadge: {
    backgroundColor: COLORS.accentLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  categoryText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.accent,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.xs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
  },
  wishBtn: {
    padding: SPACING.md,
    alignSelf: 'flex-start',
  },
});
