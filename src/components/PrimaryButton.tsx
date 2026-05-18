import React from "react"
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, ViewStyle } from "react-native"
import { colors, opacity, radius, size, spacing, typography } from "../theme"

type PrimaryButtonProps = {
  title: string
  disabled?: boolean
  loading?: boolean
  onPress?: () => void
  size?: "md" | "lg"
  variant?: "primary" | "secondary" | "ghost" | "danger"
  style?: StyleProp<ViewStyle>
}

export function PrimaryButton({ title, disabled, loading, onPress, size: buttonSize = "md", style, variant = "primary" }: PrimaryButtonProps) {
  const inactive = disabled || loading
  return (
    <Pressable
      accessibilityRole="button"
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles[`size_${buttonSize}`],
        styles[`variant_${variant}`],
        pressed && !inactive && styles.pressed,
        inactive && styles.disabled,
        style
      ]}
    >
      {loading ? <ActivityIndicator color={variant === "primary" || variant === "danger" ? colors.textInverse : colors.brand} /> : <Text style={[styles.text, styles[`text_${variant}`]]}>{title}</Text>}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center"
  },
  size_md: {
    minHeight: size.controlMd
  },
  size_lg: {
    minHeight: size.controlLg
  },
  variant_primary: {
    backgroundColor: colors.brand
  },
  variant_secondary: {
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface
  },
  variant_ghost: {
    backgroundColor: "transparent"
  },
  variant_danger: {
    backgroundColor: colors.danger
  },
  pressed: {
    opacity: opacity.pressed
  },
  disabled: {
    opacity: opacity.disabled
  },
  text: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold
  },
  text_primary: {
    color: colors.textInverse
  },
  text_secondary: {
    color: colors.textSecondary
  },
  text_ghost: {
    color: colors.textSecondary
  },
  text_danger: {
    color: colors.textInverse
  }
})
