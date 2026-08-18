import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { SPACING, RADII, TYPOGRAPHY } from '../../constants';
import Section from './Section';
import Label from './Label';

const CATEGORIES = [
  { key: 'general', label: 'General', emoji: '✨' },
  { key: 'health', label: 'Health', emoji: '💪' },
  { key: 'mindfulness', label: 'Mindfulness', emoji: '🧘' },
  { key: 'productivity', label: 'Productivity', emoji: '⚡' },
  { key: 'learning', label: 'Learning', emoji: '📚' },
  { key: 'hobby', label: 'Hobby', emoji: '🎨' },
  { key: 'social', label: 'Social', emoji: '❤️' },
  { key: 'finance', label: 'Finance', emoji: '💰' },
  { key: 'work', label: 'Work', emoji: '💼' }
];

export default function HabitFormCategory({
  category,
  onChange
}: {
  category: string;
  onChange: (cat: string) => void;
}) {
  const { colors } = useTheme();

  return (
    <Section title="Category" colors={colors}>
      <Label label="Group this habit" colors={colors} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: SPACING.sm }}
      >
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat.key}
            style={[
              styles.chip,
              {
                backgroundColor: category === cat.key ? colors.primary + '22' : colors.inputBg,
                borderColor: category === cat.key ? colors.primary : colors.border
              }
            ]}
            onPress={() => onChange(cat.key)}
          >
            <Text style={styles.chipEmoji}>{cat.emoji}</Text>
            <Text
              style={[
                styles.chipText,
                { color: category === cat.key ? colors.primary : colors.textSecondary }
              ]}
            >
              {cat.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </Section>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADII.full,
    borderWidth: 1
  },
  chipEmoji: {
    fontSize: 16
  },
  chipText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold
  }
});
