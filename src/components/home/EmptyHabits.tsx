import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { SPACING, RADII, TYPOGRAPHY } from '../../constants';

export default function EmptyHabits({ onAdd }: { onAdd: () => void }) {
  const { colors } = useTheme();

  return (
    <View style={styles.empty}>
      <View
        style={[
          styles.emojiRing,
          { backgroundColor: colors.primary + '14', borderColor: colors.primary + '33' }
        ]}
      >
        <Text style={styles.emptyEmoji}>🌱</Text>
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No habits yet</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Start small. One habit changes everything.
      </Text>
      <Pressable
        style={({ pressed }) => [
          styles.emptyBtn,
          {
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            opacity: pressed ? 0.85 : 1,
            transform: [{ scale: pressed ? 0.97 : 1 }]
          }
        ]}
        onPress={onAdd}
      >
        <Text style={styles.emptyBtnText}>Create your first habit</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    alignItems: 'center',
    paddingVertical: SPACING['3xl'],
    gap: SPACING.md
  },

  emojiRing: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs
  },

  emptyEmoji: {
    fontSize: 48
  },

  emptyTitle: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.bold
  },

  emptySubtitle: {
    fontSize: TYPOGRAPHY.base,
    textAlign: 'center',
    lineHeight: 22
  },

  emptyBtn: {
    marginTop: SPACING.sm,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING['2xl'],
    borderRadius: RADII.full,
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10
  },

  emptyBtnText: {
    color: '#fff',
    fontWeight: TYPOGRAPHY.bold,
    fontSize: TYPOGRAPHY.base
  }
});
