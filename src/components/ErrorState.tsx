import React from "react"
import { StyleSheet, Text, View } from "react-native"
import { colors, spacing, typography } from "../theme"
import { PrimaryButton } from "./PrimaryButton"

type ErrorStateProps = {
  title: string
  description?: string
  actionText?: string
  onAction?: () => void
  secondaryActionText?: string
  onSecondaryAction?: () => void
  children?: React.ReactNode
}

export function ErrorState({ actionText, children, description, onAction, onSecondaryAction, secondaryActionText, title }: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>!</Text>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {actionText ? <PrimaryButton title={actionText} onPress={onAction} /> : null}
      {secondaryActionText ? <PrimaryButton title={secondaryActionText} onPress={onSecondaryAction} variant="secondary" /> : null}
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
    alignItems: "stretch",
    justifyContent: "center",
    padding: spacing.xl
  },
  icon: {
    alignSelf: "center",
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: "hidden",
    color: colors.danger,
    backgroundColor: colors.dangerSurface,
    fontSize: typography.size.titleMd,
    fontWeight: typography.weight.black,
    lineHeight: 36,
    textAlign: "center"
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.size.titleSm,
    fontWeight: typography.weight.semibold,
    textAlign: "center"
  },
  description: {
    color: colors.textSecondary,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.md,
    textAlign: "center"
  }
})
