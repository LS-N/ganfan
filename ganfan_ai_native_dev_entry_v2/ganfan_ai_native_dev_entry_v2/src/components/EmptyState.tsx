import React from "react"
import { StyleSheet, Text, View } from "react-native"
import { colors, spacing } from "../styles/tokens"
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
    fontSize: 18,
    fontWeight: "600"
  },
  description: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: "center"
  }
})
