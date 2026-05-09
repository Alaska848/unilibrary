// src/components/ui/Avatar.js
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { FONTS } from '../../utils/theme';

const AVATAR_COLORS = [
  '#6B7FD7', '#5BA4CF', '#9CA3AF', '#A78BFA',
  '#F59E0B', '#34D399', '#F87171',
];

function getInitials(name) {
  if (!name || !String(name).trim()) return '?';
  const parts = String(name).trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function getColor(uid = '') {
  let h = 0;
  for (let i = 0; i < uid.length; i++) h = uid.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

export default function Avatar({ name, uid, photoURL, size = 40 }) {
  const color = getColor(uid || name || '');
  const initials = getInitials(name);

  return (
    <View
      style={[
        styles.container,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
      ]}
    >
      {photoURL ? (
        <Image
          source={{ uri: photoURL }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
        />
      ) : (
        <Text style={[styles.initials, { fontSize: size * 0.35 }]}>{initials}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#fff',
    fontWeight: '700',
  },
});
