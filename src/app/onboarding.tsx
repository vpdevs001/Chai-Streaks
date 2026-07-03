import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import OnboardingSlide from '../components/OnboardingSlide';
import OnboardingProfileStep from '../components/OnboardingProfileSetup';
import { RADII, SLIDES, SPACING, TYPOGRAPHY } from '../constants';
import { useTheme } from '../contexts/ThemeContext';
import { setOnboarded, createUser, setActiveUserId } from '../db';

const { width } = Dimensions.get('window');

export default function Onboarding() {
  const { colors } = useTheme();
  const db = useSQLiteContext();
  const scrollRef = useRef<ScrollView>(null);
  const [current, setCurrent] = useState(0);
  const [step, setStep] = useState<'slides' | 'profile'>('slides');
  const streakAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (current === 1) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(streakAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(streakAnim, { toValue: 0, duration: 800, useNativeDriver: true })
        ])
      ).start();
    } else {
      streakAnim.setValue(0);
    }
  }, [current, streakAnim]);

  const goNext = () => {
    if (current < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: (current + 1) * width, animated: true });
      setCurrent(current + 1);
    }
  };

  // Slides are just the marketing intro — the profile step (name + avatar)
  // is a separate screen shown after them so it doesn't have to fit into
  // the horizontal slide pager's layout.
  const goToProfile = () => setStep('profile');

  const completeOnboarding = async (name: string, avatarUri: string | null) => {
    const user = await createUser(db, { name, avatar_uri: avatarUri ?? undefined });
    await setActiveUserId(user.id);
    await setOnboarded();
    router.replace('/(tabs)/home');
  };

  const slide = SLIDES[current];

  if (step === 'profile') {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
        <OnboardingProfileStep
          colors={colors}
          onComplete={completeOnboarding}
          onSkip={() => completeOnboarding('You', null)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        {SLIDES.map((s, i) => (
          <OnboardingSlide key={i} slide={s} colors={colors} streakAnim={streakAnim} />
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
              i === current && { width: 24 }
            ]}
          />
        ))}
      </View>

      {/* CTA */}
      <View style={styles.bottom}>
        {slide.isFinal ? (
          <Pressable
            style={({ pressed }) => [
              styles.btn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }
            ]}
            onPress={goToProfile}
          >
            <Text style={styles.btnText}>Start Building Habits ☕</Text>
          </Pressable>
        ) : (
          <View style={styles.navRow}>
            <Pressable
              style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
              onPress={goToProfile}
            >
              <Text style={[styles.skip, { color: colors.textMuted }]}>Skip</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.btn,
                styles.btnSmall,
                { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }
              ]}
              onPress={goNext}
            >
              <Text style={styles.btnText}>Next →</Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1
  },

  dots: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingBottom: SPACING.lg
  },

  dot: {
    height: 6,
    width: 6,
    borderRadius: 3
  },

  bottom: {
    paddingHorizontal: SPACING['2xl'],
    paddingBottom: Platform.OS === 'ios' ? 48 : SPACING['2xl']
  },

  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },

  skip: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.medium,
    padding: SPACING.sm
  },

  btn: {
    paddingVertical: SPACING.base,
    paddingHorizontal: SPACING['2xl'],
    borderRadius: RADII.full,
    alignItems: 'center'
  },

  btnSmall: {
    paddingHorizontal: SPACING.xl
  },

  btnText: {
    color: '#FFF',
    fontSize: TYPOGRAPHY.md,
    fontWeight: TYPOGRAPHY.bold
  }
});
