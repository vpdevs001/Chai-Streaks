import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SPACING, RADII, TYPOGRAPHY } from '../constants';
import type { ThemeColors } from '../theme';

interface Props {
  colors: ThemeColors;
  tab: '7' | '30';
  onTabChange: (t: '7' | '30') => void;
}

export default function PeriodTabSwitcher({ colors, tab, onTabChange }: Props) {
  return (
    <View style={[styles.tabRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {(['7', '30'] as const).map((t) => (
        <Pressable
          key={t}
          style={({ pressed }) => [
            styles.tabBtn,
            tab === t && { backgroundColor: colors.primary },
            { opacity: pressed ? 0.8 : 1 }
          ]}
          onPress={() => onTabChange(t)}
        >
          <Text style={[styles.tabBtnText, { color: tab === t ? '#fff' : colors.textSecondary }]}>
            {t === '7' ? 'Last 7 Days' : 'Last 30 Days'}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: 'row',
    borderRadius: RADII.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 4,
    marginBottom: SPACING.base,
    gap: 4
  },

  tabBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADII.md,
    alignItems: 'center'
  },

  tabBtnText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold
  }
});
