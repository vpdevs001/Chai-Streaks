import { Text, StyleSheet } from 'react-native';
import { TYPOGRAPHY } from '../constants';

export default function Label({ label, colors }: { label: string; colors: any }) {
  return <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>;
}

const styles = StyleSheet.create({
  label: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.medium,
    marginBottom: 2
  }
});
