import { useEffect, useRef } from 'react';
import { Modal, Animated, StyleSheet, View, Text, Pressable } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, RADII, TYPOGRAPHY } from '../constants';

export default function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(0.88)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 260 }),
        Animated.timing(opacity, { toValue: 1, duration: 140, useNativeDriver: true })
      ]).start();
    } else {
      scale.setValue(0.88);
      opacity.setValue(0);
    }
  }, [visible, scale, opacity]);

  const confirmBg = destructive ? colors.danger : colors.primary;

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      <Pressable style={[styles.backdrop, { backgroundColor: colors.overlay }]} onPress={onCancel}>
        <Animated.View
          style={[
            styles.box,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              transform: [{ scale }],
              opacity
            }
          ]}
        >
          <View
            style={[
              styles.iconRing,
              { backgroundColor: confirmBg + '18', borderColor: confirmBg + '44' }
            ]}
          >
            <Text style={styles.icon}>{destructive ? '⚠️' : '💬'}</Text>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.msg, { color: colors.textSecondary }]}>{message}</Text>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.btnRow}>
            <Pressable
              style={({ pressed }) => [
                styles.btn,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: colors.border,
                  opacity: pressed ? 0.75 : 1
                }
              ]}
              onPress={onCancel}
            >
              <Text style={[styles.btnTxt, { color: colors.textSecondary }]}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.btn,
                {
                  backgroundColor: confirmBg,
                  opacity: pressed ? 0.85 : 1
                }
              ]}
              onPress={onConfirm}
            >
              <Text style={[styles.btnTxt, { color: '#fff', fontWeight: TYPOGRAPHY.bold }]}>
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING['2xl']
  },

  box: {
    width: '100%',
    maxWidth: 340,
    borderRadius: RADII['2xl'],
    borderWidth: 1,
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.md
  },

  iconRing: {
    width: 56,
    height: 56,
    borderRadius: RADII.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center'
  },

  icon: {
    fontSize: 24
  },

  title: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.bold,
    textAlign: 'center'
  },

  msg: {
    fontSize: TYPOGRAPHY.base,
    textAlign: 'center',
    lineHeight: 22
  },

  divider: {
    width: '100%',
    height: StyleSheet.hairlineWidth
  },

  btnRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    width: '100%'
  },

  btn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADII.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent'
  },

  btnTxt: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.semibold
  }
});
