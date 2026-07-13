import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SPACING, RADII, TYPOGRAPHY } from '../constants';
import { useTheme } from '../contexts/ThemeContext';

interface Props {
  emoji: string;
  label: string;
  sublabel?: string;
  onPress?: () => void;
  rightEl?: React.ReactNode;
  danger?: boolean;
}

export default function SettingsRow({
  emoji,
  label,
  sublabel,
  onPress,
  rightEl,
  danger = false
}: Props) {
  const { colors } = useTheme();
  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: colors.card, borderColor: colors.border },
        onPress && { opacity: pressed ? 0.7 : 1 }
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View
        style={[
          styles.rowIcon,
          { backgroundColor: (danger ? colors.danger : colors.primary) + '18' }
        ]}
      >
        <Text style={styles.rowEmoji}>{emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, { color: danger ? colors.danger : colors.text }]}>
          {label}
        </Text>
        {sublabel && <Text style={[styles.rowSub, { color: colors.textMuted }]}>{sublabel}</Text>}
      </View>
      {rightEl ?? (onPress && <Text style={{ color: colors.textMuted, fontSize: 18 }}>›</Text>)}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 0
  },

  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: RADII.md,
    alignItems: 'center',
    justifyContent: 'center'
  },

  rowEmoji: {
    fontSize: 18
  },

  rowLabel: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.semibold
  },

  rowSub: {
    fontSize: TYPOGRAPHY.xs,
    marginTop: 1
  }
});
