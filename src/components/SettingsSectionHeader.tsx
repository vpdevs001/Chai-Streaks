import { Text, StyleSheet } from 'react-native';
import { SPACING, TYPOGRAPHY } from '../constants';
import { useTheme } from '../contexts/ThemeContext';

interface Props {
  title: string;
}

export default function SettingsSectionHeader({ title }: Props) {
  const { colors } = useTheme();
  return (
    <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{title.toUpperCase()}</Text>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.bold,
    letterSpacing: 1,
    marginBottom: SPACING.sm,
    marginTop: SPACING.lg,
    marginLeft: 4
  }
});
