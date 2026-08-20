import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useTheme } from '../../contexts/ThemeContext';
import { useHabits } from '../../hooks/useHabits';
import { SPACING, RADII, TYPOGRAPHY } from '../../constants';
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
  const { userId, accountStreak, accountLongestStreak } = useHabits();
  const [earnedBadges, setEarnedBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const badges = await getUserBadges(db, userId);
      setEarnedBadges(badges);
      // Mark all as seen once the user views the screen
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

  const earnedKeys = new Set(earnedBadges.map((b) => b.badge_key));

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
      label: '🌱 Habits',
      badges: BADGE_DEFINITIONS.filter((b) => b.category === 'habits')
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
          title="Badges"
          subtitle={`${totalEarned} of ${totalBadges} earned`}
          colors={colors}
        />

        {/* Progress bar */}
        <View
          style={[
            styles.progressCard,
            { backgroundColor: colors.card, borderColor: colors.border }
          ]}
        >
          <View style={styles.progressHeader}>
            <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
              Collection Progress
            </Text>
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

        {loading ? (
          <View style={{ height: 200, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          categories.map((cat) => (
            <View key={cat.key} style={styles.categorySection}>
              <Text style={[styles.categoryTitle, { color: colors.text }]}>{cat.label}</Text>
              <View style={styles.badgeGrid}>
                {cat.badges.map((badge) => {
                  const earned = earnedKeys.has(badge.key);
                  return (
                    <View
                      key={badge.key}
                      style={[
                        styles.badgeCard,
                        {
                          backgroundColor: earned ? colors.card : colors.card + '88',
                          borderColor: earned ? colors.primary + '44' : colors.border
                        },
                        !earned && { opacity: 0.5 }
                      ]}
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
                    </View>
                  );
                })}
              </View>
            </View>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
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
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.medium
  },
  progressValue: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.heavy
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
  categorySection: {
    marginBottom: SPACING.lg
  },
  categoryTitle: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: TYPOGRAPHY.bold,
    marginBottom: SPACING.md
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
    fontSize: 28
  },
  badgeTitle: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.bold,
    textAlign: 'center'
  },
  badgeDesc: {
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 13
  }
});
