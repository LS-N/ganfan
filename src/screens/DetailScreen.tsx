import React from "react"
import { StyleSheet, Text, View } from "react-native"
import { EmptyState } from "../components"
import { colors, spacing } from "../styles/tokens"

export function DetailScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>饮食详情</Text>
      <EmptyState title="详情页页面壳" description="原型确认后再展示单餐食物、热量、营养结构和 AI 简评。" />
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
