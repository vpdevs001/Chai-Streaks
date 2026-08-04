import { View, Text, StyleSheet } from 'react-native';
import { CircularProgressBase } from 'react-native-circular-progress-indicator';
import { useTheme } from '../../contexts/ThemeContext';
import { TYPOGRAPHY } from '../../constants';

interface ProgressRingProps {
  /** Completion rate as a fraction between 0 and 1 */
  rate: number;
  size?: number;
  stroke?: number;
  color: string;
  /** Text shown below the ring */
  label?: string;
  /** Animation duration in ms */
  duration?: number;
}

export default function ProgressRing({
  rate,
  size = 120,
  stroke = 14,
  color,
  label = 'Today',
  duration = 700
}: ProgressRingProps) {
  const { colors } = useTheme();
  const pct = Math.round(Math.min(Math.max(rate, 0), 1) * 100);
  const radius = size / 2 - stroke / 2;

  return (
    <View style={{ alignItems: 'center', gap: 6 }}>
      {/* Ring + centered text overlay */}
      <View style={{ width: radius * 2, height: radius * 2 }}>
        <CircularProgressBase
          value={pct}
          initialValue={0}
          radius={radius}
          maxValue={100}
          duration={duration}
          activeStrokeWidth={stroke}
          inActiveStrokeWidth={stroke}
          activeStrokeColor={color}
          inActiveStrokeColor={colors.border}
          inActiveStrokeOpacity={0.4}
          strokeLinecap="round"
        />
        {/* Value absolutely centered over the ring */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={styles.center}>
            <Text
              style={[styles.value, { color: colors.text }]}
              allowFontScaling={false}
            >
              {pct}%
            </Text>
          </View>
        </View>
      </View>

      {/* Label below the ring */}
      {label ? (
        <Text
          style={[styles.label, { color: colors.textSecondary }]}
          allowFontScaling={false}
        >
          {label}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  value: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.heavy,
    textAlign: 'center'
  },
  label: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.medium,
    textAlign: 'center'
  }
});
