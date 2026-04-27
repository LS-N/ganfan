import React from "react"
import { StyleSheet, Text, View } from "react-native"
import { EmptyState } from "../components"
import { colors, spacing } from "../styles/tokens"

export function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>我的</Text>
      <EmptyState title="我的页页面壳" description="MVP 0.1 完成后，这里会设置目标、身高、体重和每日热量目标。" />
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
