import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing
} from 'react-native-reanimated';
import { useTheme } from '../contexts/ThemeContext';
import { TYPOGRAPHY } from '../constants';

export default function ProgressRing({
  rate,
  size = 120,
  stroke = 10,
  color
}: {
  rate: number;
  size?: number;
  stroke?: number;
  color: string;
}) {
  const { colors } = useTheme();
  const pct = Math.round(rate * 100);
  const progress = useSharedValue(rate);

  useEffect(() => {
    progress.value = withTiming(rate, { duration: 500, easing: Easing.out(Easing.cubic) });
  }, [rate, progress]);

  const arcStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${-90 + progress.value * 360}deg` }]
  }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Track */}
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: stroke,
          borderColor: colors.border
        }}
      />
      {/* Progress arc — use rotation trick */}
      {pct > 0 && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: stroke,
              borderColor: color,
              borderTopColor: pct > 75 ? color : 'transparent',
              borderRightColor: pct > 25 ? color : 'transparent',
              borderBottomColor: pct > 50 ? color : 'transparent',
              borderLeftColor: color
            },
            arcStyle
          ]}
        />
      )}
      <Text style={[styles.pctText, { color: colors.text }]}>{pct}%</Text>
      <Text style={[styles.todayText, { color: colors.textSecondary }]}>Today</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pctText: {
    fontSize: TYPOGRAPHY['2xl'],
    fontWeight: TYPOGRAPHY.heavy
  },

  todayText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.medium
  }
});
