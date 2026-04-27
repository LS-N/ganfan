import React from "react"
import { StyleSheet, Text, View } from "react-native"
import { EmptyState } from "../components"
import { colors, spacing } from "../styles/tokens"

export function RecordScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>记录一餐</Text>
      <EmptyState title="记录页页面壳" description="原型确认后再开发餐次选择、食物输入和保存流程。" />
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
