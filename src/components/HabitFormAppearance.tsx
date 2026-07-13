import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { SPACING, RADII, TYPOGRAPHY } from '../constants';
import { HABIT_COLORS, PRESET_ICONS } from '../theme';
import type { ThemeColors } from '../theme';
import Section from './Section';
import Label from './Label';

interface Props {
  colors: ThemeColors;
  icon: string;
  color: string;
  onIconChange: (icon: string) => void;
  onColorChange: (color: string) => void;
}

export default function HabitFormAppearance({
  colors,
  icon,
  color,
  onIconChange,
  onColorChange
}: Props) {
  return (
    <Section title="Appearance" colors={colors}>
      <Label label="Icon" colors={colors} />
      <FlatList
        horizontal
        data={PRESET_ICONS}
        keyExtractor={(ic) => ic}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.iconRow}
        renderItem={({ item: ic }) => (
          <Pressable
            style={({ pressed }) => [
              styles.iconBtn,
              {
                backgroundColor: icon === ic ? color + '33' : colors.inputBg,
                borderColor: icon === ic ? color : colors.border,
                opacity: pressed ? 0.75 : 1
              }
            ]}
            onPress={() => onIconChange(ic)}
          >
            <Text style={styles.iconBtnText}>{ic}</Text>
          </Pressable>
        )}
      />

      <Label label="Color" colors={colors} />
      <View style={styles.colorGrid}>
        {HABIT_COLORS.map((c) => (
          <Pressable
            key={c}
            style={({ pressed }) => [
              styles.colorDot,
              { backgroundColor: c },
              color === c && styles.colorDotSelected,
              { opacity: pressed ? 0.8 : 1 }
            ]}
            onPress={() => onColorChange(c)}
          >
            {color === c && <Text style={styles.colorCheck}>✓</Text>}
          </Pressable>
        ))}
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  iconRow: {
    gap: SPACING.sm,
    paddingVertical: SPACING.xs
  },

  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: RADII.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center'
  },

  iconBtnText: {
    fontSize: 22
  },

  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm
  },

  colorDot: {
    width: 36,
    height: 36,
    borderRadius: RADII.full,
    alignItems: 'center',
    justifyContent: 'center'
  },

  colorDotSelected: {
    borderWidth: 2.5,
    borderColor: '#fff',
    transform: [{ scale: 1.15 }]
  },

  colorCheck: {
    color: '#fff',
    fontSize: 16,
    fontWeight: TYPOGRAPHY.bold
  }
});
