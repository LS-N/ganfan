import React from "react"
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native"
import { colors, radius, spacing } from "../styles/tokens"

type PrimaryButtonProps = {
  title: string
  disabled?: boolean
  loading?: boolean
  onPress?: () => void
}

export function PrimaryButton({ title, disabled, loading, onPress }: PrimaryButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={[styles.button, (disabled || loading) && styles.disabled]}
    >
      {loading ? <ActivityIndicator /> : <Text style={styles.text}>{title}</Text>}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.brand
  },
  disabled: {
    opacity: 0.48
  },
  text: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600"
  }
})
