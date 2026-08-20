import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, usePathname } from 'expo-router';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useDrawer } from '../../contexts/DrawerContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useHabits } from '../../hooks/useHabits';
import { SPACING, RADII, TYPOGRAPHY, FONTS } from '../../constants';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DRAWER_WIDTH = Math.min(320, SCREEN_WIDTH * 0.82);

interface NavItem {
  key: string;
  route: string;
  icon: string;
  label: string;
  description: string;
  badge?: string | number;
}

const NAV_ITEMS: NavItem[] = [
  {
    key: 'home',
    route: '/home',
    icon: '🏠',
    label: 'Home',
    description: "Today's habits & routine"
  },
  {
    key: 'tasks',
    route: '/tasks',
    icon: '📋',
    label: 'Daily Tasks',
    description: 'Task checklist & planning'
  },
  {
    key: 'timer',
    route: '/timer',
    icon: '⏱️',
    label: 'Focus Timer',
    description: 'Track time & focus sessions'
  },
  {
    key: 'progress',
    route: '/progress',
    icon: '📊',
    label: 'Progress & Stats',
    description: 'Analytics, score & heatmaps'
  },
  {
    key: 'badges',
    route: '/badges',
    icon: '🏅',
    label: 'Badges & Trophies',
    description: 'Milestones & achievements'
  },
  {
    key: 'settings',
    route: '/settings',
    icon: '⚙️',
    label: 'Settings',
    description: 'Preferences & backup'
  }
];

function getChaiLevel(
  streak: number,
  scrolls: number
): { level: number; rank: string; nextMilestone: number } {
  const points = streak * 10 + scrolls * 25;
  if (points >= 500) return { level: 5, rank: 'Chai Legend 👑', nextMilestone: 1000 };
  if (points >= 250) return { level: 4, rank: 'Chai Master 🫖', nextMilestone: 500 };
  if (points >= 100) return { level: 3, rank: 'Chai Adept ☕', nextMilestone: 250 };
  if (points >= 30) return { level: 2, rank: 'Chai Apprentice 🍵', nextMilestone: 100 };
  return { level: 1, rank: 'Chai Explorer 🌱', nextMilestone: 30 };
}

export default function AppDrawer() {
  const { isOpen, closeDrawer } = useDrawer();
  const { colors, scheme, setPreference } = useTheme();
  const { user, accountStreak, chaiScrolls } = useHabits();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const badgeScale = useRef(new Animated.Value(0.9)).current;
  const selectedScale = useRef(new Animated.Value(1)).current;

  // Staggered animated values for each navigation item
  const itemAnims = useRef(
    NAV_ITEMS.map(() => ({
      opacity: new Animated.Value(0),
      translateX: new Animated.Value(-24)
    }))
  ).current;

  useEffect(() => {
    if (isOpen) {
      // Reset items
      itemAnims.forEach((anim) => {
        anim.opacity.setValue(0);
        anim.translateX.setValue(-24);
      });
      badgeScale.setValue(0.85);

      // 1. Slide drawer & fade backdrop
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true
        }),
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 260
        }),
        // Pop badge animation
        Animated.spring(badgeScale, {
          toValue: 1,
          useNativeDriver: true,
          damping: 12,
          stiffness: 220
        })
      ]).start();

      // 2. Cascade nav items in sequence
      const itemAnimations = itemAnims.map((anim) =>
        Animated.parallel([
          Animated.timing(anim.opacity, {
            toValue: 1,
            duration: 180,
            useNativeDriver: true
          }),
          Animated.spring(anim.translateX, {
            toValue: 0,
            useNativeDriver: true,
            damping: 18,
            stiffness: 280
          })
        ])
      );

      Animated.stagger(35, itemAnimations).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true
        }),
        Animated.timing(translateX, {
          toValue: -DRAWER_WIDTH,
          duration: 190,
          useNativeDriver: true
        })
      ]).start();
    }
  }, [isOpen, translateX, backdropOpacity, badgeScale, itemAnims]);

  if (!isOpen) return null;

  const handleNavigate = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Interactive button bounce animation
    Animated.sequence([
      Animated.timing(selectedScale, {
        toValue: 0.94,
        duration: 80,
        useNativeDriver: true
      }),
      Animated.spring(selectedScale, {
        toValue: 1,
        useNativeDriver: true,
        damping: 14,
        stiffness: 300
      })
    ]).start();

    // Smooth dismiss & route transition
    setTimeout(() => {
      closeDrawer();
      setTimeout(() => {
        router.push(route as any);
      }, 120);
    }, 100);
  };

  const hasName = !!user?.name && user.name.trim().length > 0 && user.name.trim() !== 'You';
  const firstName = hasName ? user!.name.trim().split(' ')[0] : 'Chai Streaker';
  const initials = hasName ? user!.name.trim().slice(0, 1).toUpperCase() : null;

  const { rank, level } = getChaiLevel(accountStreak, chaiScrolls);

  return (
    <Modal transparent visible={isOpen} animationType="none" onRequestClose={closeDrawer}>
      <View style={styles.modalContainer}>
        {/* Backdrop */}
        <Animated.View
          style={[
            styles.backdrop,
            {
              backgroundColor: colors.overlay,
              opacity: backdropOpacity
            }
          ]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={closeDrawer} />
        </Animated.View>

        {/* Drawer Panel */}
        <Animated.View
          style={[
            styles.drawerPanel,
            {
              width: DRAWER_WIDTH,
              backgroundColor: colors.surface,
              borderRightColor: colors.border,
              paddingTop: insets.top + (Platform.OS === 'ios' ? 12 : 24),
              paddingBottom: Math.max(insets.bottom, 16),
              transform: [{ translateX }]
            }
          ]}
        >
          {/* Header Profile & Gamified Level Area */}
          <View style={[styles.profileSection, { borderBottomColor: colors.border }]}>
            <View style={styles.profileRow}>
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: colors.card, borderColor: colors.primary + '44' }
                ]}
              >
                {user?.avatar_uri ? (
                  <Image
                    source={{ uri: user.avatar_uri }}
                    style={styles.avatarImg}
                    contentFit="cover"
                  />
                ) : initials ? (
                  <Text style={[styles.avatarInitial, { color: colors.primary }]}>{initials}</Text>
                ) : (
                  <Text style={{ fontSize: 24 }}>☕</Text>
                )}
              </View>

              <View style={styles.profileInfo}>
                <View style={styles.nameLevelRow}>
                  <Text style={[styles.profileName, { color: colors.text }]} numberOfLines={1}>
                    {firstName}
                  </Text>
                  <View
                    style={[
                      styles.levelTag,
                      { backgroundColor: colors.primary + '22', borderColor: colors.primary + '55' }
                    ]}
                  >
                    <Text style={[styles.levelTagText, { color: colors.primary }]}>
                      Lvl {level}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.rankText, { color: colors.textSecondary }]} numberOfLines={1}>
                  {rank}
                </Text>

                {/* Animated Streak & Scroll Badges */}
                <Animated.View style={[styles.badgeRow, { transform: [{ scale: badgeScale }] }]}>
                  <View
                    style={[
                      styles.pillBadge,
                      { backgroundColor: '#EF44441A', borderColor: '#EF444455' }
                    ]}
                  >
                    <Text style={[styles.pillBadgeText, { color: '#EF4444' }]}>
                      🔥 {accountStreak}d streak
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.pillBadge,
                      { backgroundColor: colors.warning + '1A', borderColor: colors.warning + '55' }
                    ]}
                  >
                    <Text style={[styles.pillBadgeText, { color: colors.warning }]}>
                      📜 {chaiScrolls}
                    </Text>
                  </View>
                </Animated.View>
              </View>
            </View>

            {/* Quick Action: New Habit with Gamified Shimmer Look */}
            <Pressable
              style={({ pressed }) => [
                styles.quickActionBtn,
                {
                  backgroundColor: colors.primary + '18',
                  borderColor: colors.primary + '44',
                  opacity: pressed ? 0.8 : 1
                }
              ]}
              onPress={() => handleNavigate('/habit/create')}
            >
              <Text style={[styles.quickActionIcon, { color: colors.primary }]}>＋</Text>
              <Text style={[styles.quickActionText, { color: colors.primary }]}>Add New Habit</Text>
            </Pressable>
          </View>

          {/* Navigation Items List with Staggered Cascading Animation */}
          <ScrollView
            style={styles.navScroll}
            contentContainerStyle={styles.navScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>NAVIGATION</Text>
            {NAV_ITEMS.map((item, index) => {
              const isActive = pathname.includes(item.key);
              const anim = itemAnims[index];

              return (
                <Animated.View
                  key={item.key}
                  style={{
                    opacity: anim.opacity,
                    transform: [{ translateX: anim.translateX }]
                  }}
                >
                  <Pressable
                    style={({ pressed }) => [
                      styles.navItem,
                      isActive && {
                        backgroundColor: colors.primary + '1A',
                        borderColor: colors.primary + '44'
                      },
                      pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] }
                    ]}
                    onPress={() => handleNavigate(item.route)}
                  >
                    <View
                      style={[
                        styles.navIconBox,
                        {
                          backgroundColor: isActive ? colors.primary + '28' : colors.card,
                          borderColor: isActive ? colors.primary + '55' : colors.border
                        }
                      ]}
                    >
                      <Text style={styles.navIcon}>{item.icon}</Text>
                    </View>

                    <View style={styles.navTextCol}>
                      <Text
                        style={[
                          styles.navLabel,
                          { color: isActive ? colors.primary : colors.text },
                          isActive && styles.navLabelActive
                        ]}
                      >
                        {item.label}
                      </Text>
                      <Text style={[styles.navDesc, { color: colors.textMuted }]} numberOfLines={1}>
                        {item.description}
                      </Text>
                    </View>

                    {isActive && (
                      <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />
                    )}
                  </Pressable>
                </Animated.View>
              );
            })}
          </ScrollView>

          {/* Footer Controls: Theme Switcher & Version */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Pressable
              style={({ pressed }) => [
                styles.themeToggle,
                { backgroundColor: colors.inputBg, borderColor: colors.border },
                pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] }
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setPreference(scheme === 'dark' ? 'light' : 'dark');
              }}
            >
              <Text style={styles.themeIcon}>{scheme === 'dark' ? '☀️' : '🌙'}</Text>
              <Text style={[styles.themeLabel, { color: colors.text }]}>
                {scheme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </Text>
            </Pressable>

            <Text style={[styles.versionText, { color: colors.textMuted }]}>
              Chai Streaks · v1.0.0
            </Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    flexDirection: 'row'
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  drawerPanel: {
    height: '100%',
    borderRightWidth: StyleSheet.hairlineWidth,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    display: 'flex',
    flexDirection: 'column'
  },
  profileSection: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: SPACING.md
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: RADII.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  avatarImg: {
    width: '100%',
    height: '100%'
  },
  avatarInitial: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.heavy
  },
  profileInfo: {
    flex: 1,
    gap: 3
  },
  nameLevelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  profileName: {
    fontFamily: FONTS.wavy,
    fontSize: 18,
    maxWidth: 130
  },
  levelTag: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADII.full,
    borderWidth: 1
  },
  levelTagText: {
    fontFamily: FONTS.sketch,
    fontSize: 11
  },
  rankText: {
    fontFamily: FONTS.handwritten,
    fontSize: 13
  },
  badgeRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginTop: 2
  },
  pillBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADII.full,
    borderWidth: 1
  },
  pillBadgeText: {
    fontFamily: FONTS.sketch,
    fontSize: 13
  },
  quickActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: RADII.lg,
    borderWidth: 1
  },
  quickActionIcon: {
    fontSize: 16,
    fontWeight: TYPOGRAPHY.bold
  },
  quickActionText: {
    fontFamily: FONTS.wavy,
    fontSize: 15
  },
  navScroll: {
    flex: 1
  },
  navScrollContent: {
    padding: SPACING.md,
    gap: 6
  },
  sectionHeading: {
    fontFamily: FONTS.sketch,
    fontSize: 14,
    letterSpacing: 1,
    paddingHorizontal: SPACING.sm,
    marginBottom: 2
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  navIconBox: {
    width: 38,
    height: 38,
    borderRadius: RADII.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  navIcon: {
    fontSize: 18
  },
  navTextCol: {
    flex: 1,
    gap: 2
  },
  navLabel: {
    fontFamily: FONTS.wavy,
    fontSize: 15
  },
  navLabelActive: {
    fontFamily: FONTS.wavy
  },
  navDesc: {
    fontFamily: FONTS.handwritten,
    fontSize: 12
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: SPACING.sm
  },
  themeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: 10,
    borderRadius: RADII.lg,
    borderWidth: 1
  },
  themeIcon: {
    fontSize: 16
  },
  themeLabel: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold
  },
  versionText: {
    fontSize: 10,
    textAlign: 'center'
  }
});
