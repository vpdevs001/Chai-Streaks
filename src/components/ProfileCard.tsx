import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useSQLiteContext } from 'expo-sqlite';
import { useTheme } from '../contexts/ThemeContext';
import { updateUser } from '../db';
import { SPACING, RADII, TYPOGRAPHY } from '../constants';
import type { User } from '../db/types';

interface Props {
  user: User;
  onUserUpdated: (user: User) => void;
}

export default function ProfileCard({ user, onUserUpdated }: Props) {
  const { colors } = useTheme();
  const db = useSQLiteContext();
  const [editName, setEditName] = useState(user.name);

  // Sync local state when the parent passes a fresh user object
  useEffect(() => {
    setEditName(user.name);
  }, [user.name]);

  // ── Avatar picker ──────────────────────────────────────────────────────────
  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7
    });

    if (!result.canceled && result.assets[0]) {
      Haptics.selectionAsync();
      const uri = result.assets[0].uri;
      const updated = await updateUser(db, user.id, { avatar_uri: uri });
      onUserUpdated(updated);
    }
  };

  // ── Name save ──────────────────────────────────────────────────────────────
  const saveName = async () => {
    const trimmed = editName.trim();
    if (trimmed.length === 0 || trimmed === user.name) {
      setEditName(user.name); // revert if empty
      return;
    }
    const updated = await updateUser(db, user.id, { name: trimmed });
    onUserUpdated(updated);
    setEditName(updated.name);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const hasAvatar = !!user.avatar_uri;
  const initials = user.name?.trim().slice(0, 1).toUpperCase() ?? '';

  return (
    <View
      style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      {/* Big tappable avatar */}
      <View style={styles.avatarWrap}>
        <Pressable
          onPress={pickAvatar}
          style={({ pressed }) => [
            styles.profileAvatar,
            {
              backgroundColor: colors.inputBg,
              borderColor: colors.primary + '55',
              opacity: pressed ? 0.85 : 1
            }
          ]}
        >
          {hasAvatar ? (
            <Image
              source={{ uri: user.avatar_uri! }}
              style={styles.profileAvatarImage}
              contentFit="cover"
            />
          ) : initials ? (
            <Text style={[styles.profileInitials, { color: colors.primary }]}>{initials}</Text>
          ) : (
            <Text style={styles.profileEmoji}>👤</Text>
          )}
        </Pressable>
        {/* Camera badge — sits outside the clipped avatar */}
        <View style={[styles.cameraBadge, { backgroundColor: colors.primary }]}>
          <Text style={styles.cameraBadgeIcon}>📷</Text>
        </View>
      </View>

      {/* Name input */}
      <View style={styles.profileInfo}>
        <Text style={[styles.profileLabel, { color: colors.textMuted }]}>Display Name</Text>
        <TextInput
          style={[
            styles.profileNameInput,
            {
              backgroundColor: colors.inputBg,
              borderColor: colors.border,
              color: colors.text
            }
          ]}
          value={editName}
          onChangeText={setEditName}
          onBlur={saveName}
          onSubmitEditing={saveName}
          placeholder="Your name"
          placeholderTextColor={colors.textMuted}
          maxLength={40}
          autoCapitalize="words"
          returnKeyType="done"
        />
        <Pressable onPress={pickAvatar} hitSlop={8}>
          <Text style={[styles.changePhotoLink, { color: colors.primary }]}>
            {hasAvatar ? 'Change photo' : 'Add a photo'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: RADII.xl,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: SPACING.sm
  },

  avatarWrap: {
    position: 'relative',
    width: 88,
    height: 88
  },

  profileAvatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },

  profileAvatarImage: {
    width: '100%',
    height: '100%'
  },

  profileInitials: {
    fontSize: 32,
    fontWeight: TYPOGRAPHY.heavy
  },

  profileEmoji: {
    fontSize: 32
  },

  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },

  cameraBadgeIcon: {
    fontSize: 14
  },

  profileInfo: {
    flex: 1,
    gap: SPACING.xs
  },

  profileLabel: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },

  profileNameInput: {
    borderRadius: RADII.lg,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    fontSize: TYPOGRAPHY.md,
    fontWeight: TYPOGRAPHY.medium
  },

  changePhotoLink: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.semibold,
    marginTop: 2
  }
});
