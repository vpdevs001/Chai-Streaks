import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SPACING, RADII, FONTS } from '../../constants';
import { useDrawer } from '../../contexts/DrawerContext';
import type { ThemeColors } from '../../theme';

interface Props {
  title: string;
  subtitle: string;
  colors: ThemeColors;
  showBack?: boolean;
  rightAction?: React.ReactNode;
}

export default function ScreenHeader({
  title,
  subtitle,
  colors,
  showBack = false,
  rightAction
}: Props) {
  const { openDrawer } = useDrawer();

  const handleOpenDrawer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    openDrawer();
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <View style={styles.header}>
      <View style={styles.topRow}>
        <View style={styles.leftControls}>
          <Pressable
            style={({ pressed }) => [
              styles.iconBtn,
              { backgroundColor: colors.card, borderColor: colors.border },
              pressed && { opacity: 0.7 }
            ]}
            onPress={handleOpenDrawer}
            hitSlop={8}
          >
            <Text style={[styles.menuIcon, { color: colors.text }]}>☰</Text>
          </Pressable>

          {showBack && (
            <Pressable
              style={({ pressed }) => [
                styles.iconBtn,
                { backgroundColor: colors.card, borderColor: colors.border },
                pressed && { opacity: 0.7 }
              ]}
              onPress={handleBack}
              hitSlop={8}
            >
              <Text style={[styles.backIcon, { color: colors.text }]}>←</Text>
            </Pressable>
          )}
        </View>

        {rightAction && <View style={styles.rightAction}>{rightAction}</View>}
      </View>

      <View style={styles.titleBlock}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.sub, { color: colors.textSecondary }]}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: SPACING.lg,
    gap: SPACING.sm
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },

  leftControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs
  },

  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: RADII.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },

  menuIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 20
  },

  backIcon: {
    fontSize: 18,
    fontWeight: 'bold'
  },

  rightAction: {
    flexDirection: 'row',
    alignItems: 'center'
  },

  titleBlock: {
    gap: 1
  },

  title: {
    fontFamily: FONTS.wavy,
    fontSize: 26,
    letterSpacing: 0.3
  },

  sub: {
    fontFamily: FONTS.handwritten,
    fontSize: 14,
    letterSpacing: 0.2
  }
});
