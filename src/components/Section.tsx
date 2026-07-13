import { View, Text, StyleSheet } from 'react-native';
import { SPACING, RADII, TYPOGRAPHY } from '../constants';

export default function Section({
  title,
  children,
  colors
}: {
  title: string;
  children: React.ReactNode;
  colors: any;
}) {
  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, { color: colors.textMuted }]}>{title.toUpperCase()}</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: SPACING.lg
  },

  title: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.bold,
    letterSpacing: 1,
    marginBottom: SPACING.sm,
    marginLeft: 4
  },

  card: {
    borderRadius: RADII.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: SPACING.base,
    gap: SPACING.sm
  }
});
