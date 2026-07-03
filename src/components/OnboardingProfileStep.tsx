import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SPACING, RADII, TYPOGRAPHY } from '../constants';
import type { ThemeColors } from '../theme';

interface Props {
  colors: ThemeColors;
  onComplete: (name: string, avatarUri: string | null) => void | Promise<void>;
  onSkip: () => void | Promise<void>;
}

export default function OnboardingProfileStep({ colors, onComplete, onSkip }: Props) {
  const [name, setName] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleContinue = async () => {
    if (saving) return;
    setSaving(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      await onComplete(name.trim() || 'You', avatarUri);
    } finally {
      setSaving(false);
    }
  };

  const initials = name.trim().slice(0, 1).toUpperCase();

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <Animated.Text
          entering={FadeInDown.duration(450)}
          style={[styles.title, { color: colors.text }]}
        >
          What should we call you?
        </Animated.Text>
        <Animated.Text
          entering={FadeInDown.duration(450).delay(80)}
          style={[styles.subtitle, { color: colors.textSecondary }]}
        >
          Add a name and photo so ChaiStreaks feels like yours.
        </Animated.Text>

        <Animated.View entering={FadeInUp.duration(500).delay(150)} style={styles.avatarWrap}>
          <Pressable
            onPress={pickAvatar}
            style={({ pressed }) => [
              styles.avatarCircle,
              {
                backgroundColor: colors.card,
                borderColor: colors.primary + '55',
                opacity: pressed ? 0.85 : 1
              }
            ]}
          >
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} contentFit="cover" />
            ) : initials ? (
              <Text style={[styles.avatarInitials, { color: colors.primary }]}>{initials}</Text>
            ) : (
              <Text style={styles.avatarEmoji}>☕</Text>
            )}
          </Pressable>
          <Pressable onPress={pickAvatar} hitSlop={8}>
            <Text style={[styles.avatarLabel, { color: colors.primary }]}>
              {avatarUri ? 'Change photo' : 'Add a photo'}
            </Text>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(450).delay(220)} style={styles.field}>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }
            ]}
            placeholder="Your name"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
            maxLength={40}
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={handleContinue}
          />
        </Animated.View>
      </View>

      <Animated.View entering={FadeInUp.duration(450).delay(280)} style={styles.bottom}>
        <Pressable
          style={({ pressed }) => [
            styles.btn,
            { backgroundColor: colors.primary, opacity: pressed || saving ? 0.85 : 1 }
          ]}
          onPress={handleContinue}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Let's Go ☕</Text>
          )}
        </Pressable>
        <Pressable
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, marginTop: SPACING.md }]}
          onPress={onSkip}
        >
          <Text style={[styles.skip, { color: colors.textMuted }]}>Skip for now</Text>
        </Pressable>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'space-between'
  },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING['2xl'],
    gap: SPACING.md
  },

  title: {
    fontSize: TYPOGRAPHY['2xl'],
    fontWeight: TYPOGRAPHY.heavy,
    textAlign: 'center'
  },

  subtitle: {
    fontSize: TYPOGRAPHY.md,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: TYPOGRAPHY.medium,
    marginBottom: SPACING.md
  },

  avatarWrap: {
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md
  },

  avatarCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },

  avatarImage: {
    width: '100%',
    height: '100%'
  },

  avatarInitials: {
    fontSize: 36,
    fontWeight: TYPOGRAPHY.heavy
  },

  avatarEmoji: {
    fontSize: 36
  },

  avatarLabel: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold
  },

  field: {
    width: '100%'
  },

  input: {
    borderRadius: RADII.lg,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.base,
    fontSize: TYPOGRAPHY.md,
    fontWeight: TYPOGRAPHY.medium,
    textAlign: 'center'
  },

  bottom: {
    paddingHorizontal: SPACING['2xl'],
    paddingBottom: Platform.OS === 'ios' ? 48 : SPACING['2xl'],
    alignItems: 'center'
  },

  btn: {
    width: '100%',
    paddingVertical: SPACING.base,
    paddingHorizontal: SPACING['2xl'],
    borderRadius: RADII.full,
    alignItems: 'center'
  },

  btnText: {
    color: '#FFF',
    fontSize: TYPOGRAPHY.md,
    fontWeight: TYPOGRAPHY.bold
  },

  skip: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.medium,
    padding: SPACING.sm
  }
});
