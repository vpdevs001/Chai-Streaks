import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { SPACING, RADII, TYPOGRAPHY } from '../../constants';
import { HABIT_COLORS } from '../../theme';

export interface HabitTemplate {
  title: string;
  icon: string;
  color: string;
  category: string;
  description: string;
}

export const HABIT_TEMPLATES: HabitTemplate[] = [
  { title: 'Drink Water', icon: '💧', color: '#3B82F6', category: 'health', description: 'Stay hydrated throughout the day' },
  { title: 'Exercise', icon: '🏃', color: '#EF4444', category: 'health', description: 'Get moving for at least 30 minutes' },
  { title: 'Read', icon: '📚', color: '#8B5CF6', category: 'learning', description: 'Read for 30 minutes' },
  { title: 'Meditate', icon: '🧘', color: '#14B8A6', category: 'mindfulness', description: 'Practice mindfulness or meditation' },
  { title: 'Sleep Early', icon: '😴', color: '#6366F1', category: 'health', description: 'Go to bed before 11pm' },
  { title: 'Eat Healthy', icon: '🥗', color: '#22C55E', category: 'health', description: 'Have a nutritious meal' },
  { title: 'Write Journal', icon: '✍️', color: '#F59E0B', category: 'mindfulness', description: 'Write down your thoughts' },
  { title: 'Learn Something', icon: '🧠', color: '#EC4899', category: 'learning', description: 'Learn a new skill or topic' },
  { title: 'No Social Media', icon: '📵', color: '#64748B', category: 'productivity', description: 'Stay off social media' },
  { title: 'Stretch', icon: '🤸', color: '#F97316', category: 'health', description: 'Do stretching exercises' },
  { title: 'Practice Music', icon: '🎵', color: '#A855F7', category: 'hobby', description: 'Practice an instrument or sing' },
  { title: 'Clean Space', icon: '🧹', color: '#10B981', category: 'productivity', description: 'Tidy up your living space' },
  { title: 'Walk Outside', icon: '🚶', color: '#06B6D4', category: 'health', description: 'Take a walk outdoors' },
  { title: 'Gratitude', icon: '🙏', color: '#F43F5E', category: 'mindfulness', description: 'Write 3 things you\'re grateful for' },
  { title: 'Code/Create', icon: '💻', color: '#0EA5E9', category: 'productivity', description: 'Work on a personal project' },
  { title: 'Call Family', icon: '❤️', color: '#E11D48', category: 'social', description: 'Call or text a family member' },
];

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'health', label: 'Health' },
  { key: 'mindfulness', label: 'Mindfulness' },
  { key: 'productivity', label: 'Productivity' },
  { key: 'learning', label: 'Learning' },
  { key: 'hobby', label: 'Hobby' },
  { key: 'social', label: 'Social' },
];

export default function HabitTemplates({
  onSelect
}: {
  onSelect: (template: HabitTemplate) => void;
}) {
  const { colors } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filtered =
    selectedCategory === 'all'
      ? HABIT_TEMPLATES
      : HABIT_TEMPLATES.filter((t) => t.category === selectedCategory);

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>Quick Add Templates</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Tap a template to pre-fill the form
      </Text>

      {/* Category filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryRow}
        contentContainerStyle={{ gap: SPACING.sm }}
      >
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat.key}
            style={[
              styles.categoryChip,
              {
                backgroundColor:
                  selectedCategory === cat.key ? colors.primary + '22' : colors.inputBg,
                borderColor: selectedCategory === cat.key ? colors.primary : colors.border
              }
            ]}
            onPress={() => setSelectedCategory(cat.key)}
          >
            <Text
              style={[
                styles.categoryText,
                { color: selectedCategory === cat.key ? colors.primary : colors.textSecondary }
              ]}
            >
              {cat.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Templates grid */}
      <View style={styles.grid}>
        {filtered.map((template) => (
          <Pressable
            key={template.title}
            style={({ pressed }) => [
              styles.templateCard,
              {
                backgroundColor: template.color + '12',
                borderColor: template.color + '33',
                opacity: pressed ? 0.7 : 1
              }
            ]}
            onPress={() => onSelect(template)}
          >
            <Text style={styles.templateIcon}>{template.icon}</Text>
            <Text style={[styles.templateTitle, { color: colors.text }]} numberOfLines={1}>
              {template.title}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg
  },
  title: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: TYPOGRAPHY.bold,
    marginBottom: 2
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sm,
    marginBottom: SPACING.md
  },
  categoryRow: {
    marginBottom: SPACING.md
  },
  categoryChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADII.full,
    borderWidth: 1
  },
  categoryText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm
  },
  templateCard: {
    width: '23%',
    aspectRatio: 0.9,
    borderRadius: RADII.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: SPACING.xs
  },
  templateIcon: {
    fontSize: 24
  },
  templateTitle: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.semibold,
    textAlign: 'center'
  }
});
