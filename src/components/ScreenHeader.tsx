import { View, Text, StyleSheet } from 'react-native';
import { SPACING, RADII, TYPOGRAPHY } from '../constants';
import type { ThemeColors } from '../theme';

interface Props {
  title: string;
  subtitle: string;
  colors: ThemeColors;
}

export default function ScreenHeader({ title, subtitle, colors }: Props) {
  return (
    <View style={styles.header}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.sub, { color: colors.textSecondary }]}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: SPACING.lg
  },

  title: {
    fontSize: TYPOGRAPHY['2xl'],
    fontWeight: TYPOGRAPHY.heavy
  },

  sub: {
    fontSize: TYPOGRAPHY.sm,
    marginTop: 2
  }
});
