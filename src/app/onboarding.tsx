import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import { setOnboarded } from '../db';
import { SPACING, RADII, TYPOGRAPHY } from '../constants';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    emoji: '🌱',
    title: 'Build Tiny Habits\nThat Actually Stick',
    subtitle: 'Consistency beats motivation.\nSmall steps, big changes.',
    bg: '#FF8A3D',
  },
  {
    emoji: '🔥',
    title: 'Track Your Streaks',
    subtitle: "Watch your streak grow every day.\nDon't break the chain.",
    bg: '#EF4444',
    streakDemo: true,
  },
  {
    emoji: '☕',
    title: 'One Cup At A Time',
    subtitle: 'Build habits one chai at a time.\nReady to start?',
    bg: '#F59E0B',
    isFinal: true,
  },
];

export default function Onboarding() {
  const { colors, scheme } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const [current, setCurrent] = useState(0);
  const streakAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (current === 1) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(streakAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(streakAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
        ]),
      ).start();
    } else {
      streakAnim.setValue(0);
    }
  }, [current]);

  const goNext = () => {
    if (current < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: (current + 1) * width, animated: true });
      setCurrent(current + 1);
    }
  };

  const finish = async () => {
    await setOnboarded();
    router.replace('/(tabs)/home');
  };

  const slide = SLIDES[current];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        {SLIDES.map((s, i) => (
          <View key={i} style={[styles.slide, { width }]}>
            {/* gradient blob */}
            <View style={[styles.blob, { backgroundColor: s.bg + '22' }]} />

            <View
              style={[
                styles.emojiCircle,
                { backgroundColor: s.bg + '33', borderColor: s.bg + '55' },
              ]}
            >
              <Text style={styles.emojiLarge}>{s.emoji}</Text>
            </View>

            {s.streakDemo && (
              <Animated.View
                style={[
                  styles.streakBadge,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    transform: [
                      {
                        scale: streakAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.05],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Text style={styles.streakBadgeText}>🔥</Text>
                <View>
                  <Text style={[styles.streakNum, { color: '#EF4444' }]}>23</Text>
                  <Text style={[styles.streakLabel, { color: colors.textSecondary }]}>
                    Day Streak
                  </Text>
                </View>
              </Animated.View>
            )}

            <Text style={[styles.title, { color: colors.text }]}>{s.title}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{s.subtitle}</Text>
          </View>
        ))}
      </ScrollView>

      {/* dots */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { backgroundColor: i === current ? colors.primary : colors.border },
              i === current && { width: 24 },
            ]}
          />
        ))}
      </View>

      {/* CTA */}
      <View style={styles.bottom}>
        {slide.isFinal ? (
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.primary }]}
            onPress={finish}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>Start Building Habits ☕</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.navRow}>
            <TouchableOpacity onPress={finish}>
              <Text style={[styles.skip, { color: colors.textMuted }]}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnSmall, { backgroundColor: colors.primary }]}
              onPress={goNext}
              activeOpacity={0.85}
            >
              <Text style={styles.btnText}>Next →</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING['2xl'],
    gap: SPACING.lg,
  },
  blob: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    top: -60,
    opacity: 0.6,
  },
  emojiCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  emojiLarge: { fontSize: 56 },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.base,
    borderRadius: RADII.xl,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  streakBadgeText: { fontSize: 40 },
  streakNum: { fontSize: TYPOGRAPHY['3xl'], fontWeight: TYPOGRAPHY.heavy, lineHeight: 40 },
  streakLabel: { fontSize: TYPOGRAPHY.base, fontWeight: TYPOGRAPHY.medium },
  title: {
    fontSize: TYPOGRAPHY['2xl'],
    fontWeight: TYPOGRAPHY.heavy,
    textAlign: 'center',
    lineHeight: 36,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.md,
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: TYPOGRAPHY.medium,
  },
  dots: { flexDirection: 'row', gap: 6, justifyContent: 'center', paddingBottom: SPACING.lg },
  dot: { height: 6, width: 6, borderRadius: 3 },
  bottom: {
    paddingHorizontal: SPACING['2xl'],
    paddingBottom: Platform.OS === 'ios' ? 48 : SPACING['2xl'],
  },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  skip: { fontSize: TYPOGRAPHY.base, fontWeight: TYPOGRAPHY.medium, padding: SPACING.sm },
  btn: {
    paddingVertical: SPACING.base,
    paddingHorizontal: SPACING['2xl'],
    borderRadius: RADII.full,
    alignItems: 'center',
  },
  btnSmall: { paddingHorizontal: SPACING.xl },
  btnText: { color: '#FFF', fontSize: TYPOGRAPHY.md, fontWeight: TYPOGRAPHY.bold },
});
