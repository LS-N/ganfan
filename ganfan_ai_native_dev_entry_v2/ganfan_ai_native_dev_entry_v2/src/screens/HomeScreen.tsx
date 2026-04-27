import React from "react"
import { StyleSheet, Text, View } from "react-native"
import { BaseCard, PrimaryButton } from "../components"
import { colors, spacing } from "../styles/tokens"

export function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>干饭</Text>
      <BaseCard>
        <Text style={styles.cardTitle}>今日饮食状态</Text>
        <Text style={styles.cardText}>MVP 0.0 页面壳：等待 MVP 0.1 原型确认后开发真实业务。</Text>
      </BaseCard>
      <PrimaryButton title="记录一餐" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.background
  },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: "700"
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "600"
  },
  cardText: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: 14
  }
})
