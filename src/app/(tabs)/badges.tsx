import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import { useHabits } from '../../hooks/useHabits';
import { SPACING, RADII, TYPOGRAPHY, FONTS } from '../../constants';
import {
  BADGE_DEFINITIONS,
  getUserBadges,
  markBadgesSeen,
  type BadgeDefinition,
  type UserBadge
} from '../../db';
import ScreenHeader from '../../components/progress/ScreenHeader';

export default function BadgesScreen() {
  const { colors } = useTheme();
  const db = useSQLiteContext();
  const { userId } = useHabits();
  const [earnedBadges, setEarnedBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBadge, setSelectedBadge] = useState<BadgeDefinition | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const badges = await getUserBadges(db, userId);
      setEarnedBadges(badges);
      await markBadgesSeen(db, userId);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [db, userId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const earnedMap = useMemo(() => {
    const map = new Map<string, UserBadge>();
    earnedBadges.forEach((b) => map.set(b.badge_key, b));
    return map;
  }, [earnedBadges]);

  const earnedKeys = useMemo(() => new Set(earnedBadges.map((b) => b.badge_key)), [earnedBadges]);

  const unlockedBadgeObjects = useMemo(() => {
    return BADGE_DEFINITIONS.filter((b) => earnedKeys.has(b.key));
  }, [earnedKeys]);

  // Group badges by category
  const categories = [
    {
      key: 'streak',
      label: '🔥 Streaks',
      badges: BADGE_DEFINITIONS.filter((b) => b.category === 'streak')
    },
    {
      key: 'completions',
      label: '✅ Completions',
      badges: BADGE_DEFINITIONS.filter((b) => b.category === 'completions')
    },
    {
      key: 'habits',
      label: '🌱 Habit Milestones',
      badges: BADGE_DEFINITIONS.filter((b) => b.category === 'habits')
    },
    {
      key: 'tasks',
      label: '📋 Daily Tasks',
      badges: BADGE_DEFINITIONS.filter((b) => b.category === 'tasks')
    },
    {
      key: 'score',
      label: '☕ Chai Score',
      badges: BADGE_DEFINITIONS.filter((b) => b.category === 'score')
    },
    {
      key: 'perfect',
      label: '⭐ Perfect Days',
      badges: BADGE_DEFINITIONS.filter((b) => b.category === 'perfect')
    },
    {
      key: 'scrolls',
      label: '📜 Chai Scrolls',
      badges: BADGE_DEFINITIONS.filter((b) => b.category === 'scrolls')
    },
    {
      key: 'time',
      label: '⏱️ Time Tracking',
      badges: BADGE_DEFINITIONS.filter((b) => b.category === 'time')
    }
  ];

  const totalEarned = earnedBadges.length;
  const totalBadges = BADGE_DEFINITIONS.length;

  const handleBadgePress = (badge: BadgeDefinition) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedBadge(badge);
  };

  const selectedEarnedInfo = selectedBadge ? earnedMap.get(selectedBadge.key) : null;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />
        }
      >
        <ScreenHeader
          title="Badges & Trophies"
          subtitle={`${totalEarned} of ${totalBadges} trophies unlocked`}
          colors={colors}
        />

        {/* Progress Card */}
        <View
          style={[
            styles.progressCard,
            { backgroundColor: colors.card, borderColor: colors.border }
          ]}
        >
          <View style={styles.progressHeader}>
            <View>
              <Text style={[styles.progressLabel, { color: colors.text }]}>
                Collection Progress
              </Text>
              <Text style={[styles.progressSub, { color: colors.textSecondary }]}>
                {totalEarned === totalBadges
                  ? '🏆 Grandmaster! All trophies unlocked'
                  : `${totalBadges - totalEarned} trophies left to achieve`}
              </Text>
            </View>
            <Text style={[styles.progressValue, { color: colors.primary }]}>
              {Math.round((totalEarned / totalBadges) * 100)}%
            </Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: colors.border + '55' }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: colors.primary,
                  width: `${(totalEarned / totalBadges) * 100}%`
                }
              ]}
            />
          </View>
        </View>

        {/* Unlocked Badges Showcase */}
        <View style={styles.showcaseSection}>
          <View style={styles.showcaseHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              🏆 Unlocked Badges ({totalEarned})
            </Text>
          </View>

          {unlockedBadgeObjects.length === 0 ? (
            <View
              style={[
                styles.emptyShowcase,
                { backgroundColor: colors.card, borderColor: colors.border }
              ]}
            >
              <Text style={styles.emptyShowcaseEmoji}>🌱</Text>
              <Text style={[styles.emptyShowcaseTitle, { color: colors.text }]}>
                No badges unlocked yet
              </Text>
              <Text style={[styles.emptyShowcaseSub, { color: colors.textSecondary }]}>
                Complete your daily habits and tasks to earn your first trophy!
              </Text>
            </View>
          ) : (
            <View style={styles.showcaseGrid}>
              {unlockedBadgeObjects.map((badge) => {
                const userBadge = earnedMap.get(badge.key);
                return (
                  <Pressable
                    key={`unlocked_${badge.key}`}
                    style={({ pressed }) => [
                      styles.unlockedBadgeCard,
                      {
                        backgroundColor: colors.primary + '14',
                        borderColor: colors.primary + '66'
                      },
                      pressed && { opacity: 0.8 }
                    ]}
                    onPress={() => handleBadgePress(badge)}
                  >
                    <View style={styles.unlockedEmojiBox}>
                      <Text style={styles.unlockedBadgeEmoji}>{badge.emoji}</Text>
                    </View>
                    <Text
                      style={[styles.unlockedBadgeTitle, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {badge.title}
                    </Text>
                    <Text style={[styles.unlockedDate, { color: colors.primary }]}>
                      {userBadge?.earned_at
                        ? new Date(userBadge.earned_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })
                        : 'Unlocked'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* All Badges Categorized */}
        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: SPACING.md }]}>
          🎯 All Milestones & Categories
        </Text>

        {loading ? (
          <View style={{ height: 200, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          categories.map((cat) => (
            <View key={cat.key} style={styles.categorySection}>
              <Text style={[styles.categoryTitle, { color: colors.textSecondary }]}>
                {cat.label}
              </Text>
              <View style={styles.badgeGrid}>
                {cat.badges.map((badge) => {
                  const earned = earnedKeys.has(badge.key);
                  return (
                    <Pressable
                      key={badge.key}
                      style={({ pressed }) => [
                        styles.badgeCard,
                        {
                          backgroundColor: earned ? colors.card : colors.card + '88',
                          borderColor: earned ? colors.primary + '66' : colors.border
                        },
                        !earned && { opacity: 0.5 },
                        pressed && { opacity: 0.8 }
                      ]}
                      onPress={() => handleBadgePress(badge)}
                    >
                      <Text style={styles.badgeEmoji}>{earned ? badge.emoji : '🔒'}</Text>
                      <Text
                        style={[
                          styles.badgeTitle,
                          { color: earned ? colors.text : colors.textMuted }
                        ]}
                        numberOfLines={1}
                      >
                        {badge.title}
                      </Text>
                      <Text
                        style={[styles.badgeDesc, { color: colors.textMuted }]}
                        numberOfLines={2}
                      >
                        {badge.description}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))
        )}

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Badge Inspector Detail Modal */}
      <Modal transparent visible={!!selectedBadge} animationType="fade">
        <Pressable
          style={[styles.modalBackdrop, { backgroundColor: colors.overlay }]}
          onPress={() => setSelectedBadge(null)}
        >
          {selectedBadge && (
            <View
              style={[
                styles.modalBox,
                { backgroundColor: colors.surface, borderColor: colors.border }
              ]}
            >
              <View
                style={[
                  styles.modalIconRing,
                  {
                    backgroundColor: selectedEarnedInfo ? colors.primary + '22' : colors.inputBg,
                    borderColor: selectedEarnedInfo ? colors.primary : colors.border
                  }
                ]}
              >
                <Text style={styles.modalEmoji}>
                  {selectedEarnedInfo ? selectedBadge.emoji : '🔒'}
                </Text>
              </View>

              <Text style={[styles.modalTitle, { color: colors.text }]}>{selectedBadge.title}</Text>

              <View
                style={[
                  styles.statusTag,
                  {
                    backgroundColor: selectedEarnedInfo ? colors.success + '22' : colors.inputBg,
                    borderColor: selectedEarnedInfo ? colors.success : colors.border
                  }
                ]}
              >
                <Text
                  style={[
                    styles.statusTagText,
                    { color: selectedEarnedInfo ? colors.success : colors.textMuted }
                  ]}
                >
                  {selectedEarnedInfo ? '✓ Unlocked' : '🔒 Locked'}
                </Text>
              </View>

              <Text style={[styles.modalDesc, { color: colors.textSecondary }]}>
                {selectedBadge.description}
              </Text>

              {selectedEarnedInfo && selectedEarnedInfo.earned_at && (
                <Text style={[styles.modalEarnedAt, { color: colors.textMuted }]}>
                  Earned on{' '}
                  {new Date(selectedEarnedInfo.earned_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </Text>
              )}

              <Pressable
                style={[styles.modalCloseBtn, { backgroundColor: colors.primary }]}
                onPress={() => setSelectedBadge(null)}
              >
                <Text style={styles.modalCloseBtnText}>Close</Text>
              </Pressable>
            </View>
          )}
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1
  },
  scroll: {
    padding: SPACING.base,
    paddingTop: Platform.OS === 'ios' ? 60 : 40
  },
  progressCard: {
    borderRadius: RADII.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: SPACING.lg,
    marginBottom: SPACING.lg
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm
  },
  progressLabel: {
    fontFamily: FONTS.wavy,
    fontSize: 16
  },
  progressSub: {
    fontFamily: FONTS.handwritten,
    fontSize: 13,
    marginTop: 2
  },
  progressValue: {
    fontFamily: FONTS.sketch,
    fontSize: 26
  },
  progressTrack: {
    height: 8,
    borderRadius: RADII.full,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    borderRadius: RADII.full
  },
  showcaseSection: {
    marginBottom: SPACING.lg
  },
  showcaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md
  },
  sectionTitle: {
    fontFamily: FONTS.wavy,
    fontSize: 18,
    marginBottom: SPACING.md
  },
  emptyShowcase: {
    borderRadius: RADII.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.xs
  },
  emptyShowcaseEmoji: {
    fontSize: 36
  },
  emptyShowcaseTitle: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.bold
  },
  emptyShowcaseSub: {
    fontSize: TYPOGRAPHY.xs,
    textAlign: 'center',
    maxWidth: 220
  },
  showcaseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm
  },
  unlockedBadgeCard: {
    width: '31%',
    aspectRatio: 0.9,
    borderRadius: RADII.lg,
    borderWidth: 1.5,
    padding: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4
  },
  unlockedEmojiBox: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  unlockedBadgeEmoji: {
    fontSize: 28
  },
  unlockedBadgeTitle: {
    fontFamily: FONTS.wavy,
    fontSize: 12,
    textAlign: 'center'
  },
  unlockedDate: {
    fontFamily: FONTS.sketch,
    fontSize: 12
  },
  categorySection: {
    marginBottom: SPACING.lg
  },
  categoryTitle: {
    fontFamily: FONTS.sketch,
    fontSize: 16,
    marginBottom: SPACING.sm
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm
  },
  badgeCard: {
    width: '31%',
    aspectRatio: 0.85,
    borderRadius: RADII.lg,
    borderWidth: 1,
    padding: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4
  },
  badgeEmoji: {
    fontSize: 26
  },
  badgeTitle: {
    fontFamily: FONTS.wavy,
    fontSize: 11,
    textAlign: 'center'
  },
  badgeDesc: {
    fontFamily: FONTS.handwritten,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 13
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING['2xl']
  },
  modalBox: {
    width: '100%',
    maxWidth: 320,
    borderRadius: RADII['2xl'],
    borderWidth: 1,
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.md
  },
  modalIconRing: {
    width: 68,
    height: 68,
    borderRadius: RADII.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalEmoji: {
    fontSize: 34
  },
  modalTitle: {
    fontFamily: FONTS.wavy,
    fontSize: 22,
    textAlign: 'center'
  },
  statusTag: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: RADII.full,
    borderWidth: 1
  },
  statusTagText: {
    fontFamily: FONTS.sketch,
    fontSize: 14
  },
  modalDesc: {
    fontFamily: FONTS.handwritten,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22
  },
  modalEarnedAt: {
    fontSize: 11
  },
  modalCloseBtn: {
    width: '100%',
    paddingVertical: SPACING.md,
    borderRadius: RADII.lg,
    alignItems: 'center',
    marginTop: SPACING.xs
  },
  modalCloseBtnText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.bold
  }
});
