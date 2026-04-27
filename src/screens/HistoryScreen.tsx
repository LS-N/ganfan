import React from "react"
import { StyleSheet, Text, View } from "react-native"
import { EmptyState } from "../components"
import { colors, spacing } from "../styles/tokens"

export function HistoryScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>历史记录</Text>
      <EmptyState title="暂无历史记录" description="MVP 0.1 完成后，这里会展示历史饮食记录。" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.background
  },
  title: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: "700"
  }
})
