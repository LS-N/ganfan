import React from "react"
import { ActivityIndicator, StyleSheet, Text, View } from "react-native"
import { colors, spacing, typography } from "../theme"

type LoadingStateProps = {
  text?: string
}

export function LoadingState({ text = "加载中" }: LoadingStateProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator />
      <Text style={styles.text}>{text}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl
  },
  text: {
    color: colors.textSecondary,
    fontSize: typography.size.base
  }
})
