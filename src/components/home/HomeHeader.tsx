import { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, Animated } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { SPACING, RADII, TYPOGRAPHY, FONTS } from '../../constants';
import { router } from 'expo-router';
import { useDrawer } from '../../contexts/DrawerContext';
import type { ThemeColors } from '../../theme';
import type { User } from '../../db/types';
import { getGreeting, formatDate } from '../../utils/dateHelpers';

interface Props {
  colors: ThemeColors;
  user?: User | null;
}

export default function HomeHeader({ colors, user }: Props) {
  const { openDrawer } = useDrawer();
  const hasName = !!user?.name && user.name.trim().length > 0 && user.name.trim() !== 'You';
  const firstName = hasName ? user!.name.trim().split(' ')[0] : '';
  const initials = hasName ? user!.name.trim().slice(0, 1).toUpperCase() : null;
  const chaiScrolls = user?.chai_scrolls ?? 0;
  const [showScrollInfo, setShowScrollInfo] = useState(false);
  const scale = useRef(new Animated.Value(0.88)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const handleOpenDrawer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    openDrawer();
  };

  const openScrollInfo = () => {
    setShowScrollInfo(true);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 260 }),
      Animated.timing(opacity, { toValue: 1, duration: 140, useNativeDriver: true })
    ]).start();
  };

  const closeScrollInfo = () => {
    scale.setValue(0.88);
    opacity.setValue(0);
    setShowScrollInfo(false);
  };

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Pressable
          style={({ pressed }) => [
            styles.menuBtn,
            { backgroundColor: colors.card, borderColor: colors.border },
            pressed && { opacity: 0.7 }
          ]}
          onPress={handleOpenDrawer}
          hitSlop={8}
        >
          <Text style={[styles.menuIcon, { color: colors.text }]}>☰</Text>
        </Pressable>
        <View>
          <Text style={[styles.greeting, { color: colors.text }]}>{getGreeting(firstName)}</Text>
          <Text style={[styles.date, { color: colors.textSecondary }]}>
            {formatDate(new Date())}
          </Text>
        </View>
      </View>
      <View style={styles.headerRight}>
        <Pressable
          style={({ pressed }) => [
            styles.scrollBadge,
            {
              backgroundColor: colors.warning + '1A',
              borderColor: colors.warning + '55',
              opacity: pressed ? 0.7 : chaiScrolls === 0 ? 0.7 : 1
            }
          ]}
          onPress={openScrollInfo}
        >
          <Text style={[styles.scrollBadgeText, { color: colors.warning }]}>📜 {chaiScrolls}</Text>
        </Pressable>
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
            <Image
              source={{ uri: user.avatar_uri }}
              style={styles.avatarImage}
              contentFit="cover"
            />
          ) : initials ? (
            // Named but no photo — show their initial instead of a generic icon.
            <Text style={[styles.avatarInitials, { color: colors.primary }]}>{initials}</Text>
          ) : (
            // No user set up at all — genuinely a guest.
            <Text style={{ fontSize: 22 }}>👤</Text>
          )}
        </Pressable>
      </View>

      {/* Chai Scroll Info Modal */}
      <Modal transparent visible={showScrollInfo} animationType="none" statusBarTranslucent>
        <Pressable
          style={[styles.modalBackdrop, { backgroundColor: colors.overlay }]}
          onPress={closeScrollInfo}
        >
          <Animated.View
            style={[
              styles.modalBox,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                transform: [{ scale }],
                opacity
              }
            ]}
          >
            <View
              style={[
                styles.iconRing,
                { backgroundColor: colors.warning + '18', borderColor: colors.warning + '44' }
              ]}
            >
              <Text style={styles.icon}>📜</Text>
            </View>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Chai Scrolls</Text>
            <Text style={[styles.modalMsg, { color: colors.textSecondary }]}>
              Chai Scrolls are a streak-recovery currency. Earn one every 7-day block with a 60%+
              completion rate. Spend one to freeze a missed day and keep your streak alive.
            </Text>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Pressable
              style={({ pressed }) => [
                styles.modalBtn,
                {
                  backgroundColor: colors.primary,
                  opacity: pressed ? 0.85 : 1
                }
              ]}
              onPress={closeScrollInfo}
            >
              <Text style={[styles.modalBtnText, { color: '#fff' }]}>Got it</Text>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm
  },

  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: RADII.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },

  menuIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 20
  },

  greeting: {
    fontFamily: FONTS.wavy,
    fontSize: 24,
    letterSpacing: 0.2
  },

  date: {
    fontFamily: FONTS.handwritten,
    fontSize: 14,
    marginTop: 1
  },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm
  },

  scrollBadge: {
    borderRadius: RADII.full,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 6,
    paddingHorizontal: SPACING.sm
  },

  scrollBadgeText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.bold
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
  },

  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING['2xl']
  },

  modalBox: {
    width: '100%',
    maxWidth: 340,
    borderRadius: RADII['2xl'],
    borderWidth: 1,
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.md
  },

  iconRing: {
    width: 56,
    height: 56,
    borderRadius: RADII.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center'
  },

  icon: {
    fontSize: 24
  },

  modalTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.bold,
    textAlign: 'center'
  },

  modalMsg: {
    fontSize: TYPOGRAPHY.base,
    textAlign: 'center',
    lineHeight: 22
  },

  divider: {
    width: '100%',
    height: StyleSheet.hairlineWidth
  },

  modalBtn: {
    width: '100%',
    paddingVertical: SPACING.md,
    borderRadius: RADII.lg,
    alignItems: 'center'
  },

  modalBtnText: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.semibold
  }
});
