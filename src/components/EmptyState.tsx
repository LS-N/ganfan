import React from "react"
import { StyleSheet, Text, View } from "react-native"
import { colors, spacing, typography } from "../theme"
import { PrimaryButton } from "./PrimaryButton"

type EmptyStateProps = {
  title: string
  description?: string
  actionText?: string
  onAction?: () => void
}

export function EmptyState({ title, description, actionText, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {actionText ? <PrimaryButton title={actionText} onPress={onAction} /> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.size.titleSm,
    fontWeight: typography.weight.semibold
  },
  description: {
    color: colors.textSecondary,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.md,
    textAlign: "center"
  }
})
