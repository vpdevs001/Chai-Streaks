import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

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
    <View style={styles.wrapper}>
      <Text style={[styles.emoji, { opacity: focused ? 1 : 0.5 }]}>{emoji}</Text>
      <Text style={[styles.label, { color: focused ? colors.primary : colors.textMuted }]}>
        {label}
      </Text>
      {focused && <View style={[styles.dot, { backgroundColor: colors.primary }]} />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: 2
  },

  emoji: {
    fontSize: 22
  },

  label: {
    fontSize: 7,
    fontWeight: '600'
  },

  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2
  }
});
