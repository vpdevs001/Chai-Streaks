import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { RADII, SPACING } from '../../constants';

export default function TabIcon({
  emoji,
  label,
  focused
}: {
  emoji: string;
  label: string;
  focused: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.wrapper,
        focused && { backgroundColor: colors.primary + '1A', borderRadius: RADII.lg }
      ]}
    >
      <Text style={[styles.emoji, { opacity: focused ? 1 : 0.55 }]}>{emoji}</Text>
      <Text
        style={[
          styles.label,
          { color: focused ? colors.primary : colors.textMuted },
          focused && styles.labelFocused
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: SPACING.xs
  },

  emoji: {
    fontSize: 24
  },

  label: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3
  },

  labelFocused: {
    fontWeight: '800'
  }
});
