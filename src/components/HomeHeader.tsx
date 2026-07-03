import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { SPACING, RADII, TYPOGRAPHY } from '../constants';
import { router } from 'expo-router';
import type { ThemeColors } from '../theme';
import type { User } from '../db/types';
import { getGreeting, formatDate } from '../utils/dateHelpers';

interface Props {
  colors: ThemeColors;
  user?: User | null;
}

export default function HomeHeader({ colors, user }: Props) {
  const hasName = !!user?.name && user.name.trim().length > 0 && user.name.trim() !== 'You';
  const firstName = hasName ? user!.name.trim().split(' ')[0] : '';
  const initials = hasName ? user!.name.trim().slice(0, 1).toUpperCase() : null;

  return (
    <View style={styles.header}>
      <View>
        <Text style={[styles.greeting, { color: colors.text }]}>
          {getGreeting(firstName)}
        </Text>
        <Text style={[styles.date, { color: colors.textSecondary }]}>{formatDate(new Date())}</Text>
      </View>
      <Pressable
        style={({ pressed }) => [
          styles.avatarBtn,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            opacity: pressed ? 0.8 : 1
          }
        ]}
        onPress={() => router.push('/settings')}
      >
        {user?.avatar_uri ? (
          // A real photo was set during onboarding/settings — show it.
          <Image source={{ uri: user.avatar_uri }} style={styles.avatarImage} contentFit="cover" />
        ) : initials ? (
          // Named but no photo — show their initial instead of a generic icon.
          <Text style={[styles.avatarInitials, { color: colors.primary }]}>{initials}</Text>
        ) : (
          // No user set up at all — genuinely a guest.
          <Text style={{ fontSize: 22 }}>👤</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg
  },

  greeting: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.heavy,
    lineHeight: 28
  },

  date: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.medium,
    marginTop: 2
  },

  avatarBtn: {
    width: 44,
    height: 44,
    borderRadius: RADII.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },

  avatarImage: {
    width: '100%',
    height: '100%'
  },

  avatarInitials: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: TYPOGRAPHY.heavy
  }
});
