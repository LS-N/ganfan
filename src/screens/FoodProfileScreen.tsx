import React from "react"
import { Link } from "expo-router"
import { ScrollView, StyleSheet, Text, View } from "react-native"
import { BaseCard, PrimaryButton } from "../components"
import { useBodyPuzzleStore } from "../stores/bodyPuzzleStore"
import { colors, spacing } from "../styles/tokens"
import type { TasteFeedback } from "../types/meal"

export function FoodProfileScreen() {
  const profile = useBodyPuzzleStore((state) => state.profile)
  const feedbacks = useBodyPuzzleStore((state) => state.feedbacks)
  const tasteTags = feedbacks.flatMap((feedback) => feedback.tasteFeedback)
  const uniqueTasteTags = Array.from(new Set(tasteTags))

  if (!profile) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.title}>餐饮档案未建立</Text>
        <Text style={styles.description}>先完成建档，记录口味偏好和忌口。</Text>
        <Link href="/profile" asChild>
          <PrimaryButton title="去建档" />
        </Link>
      </View>
    )
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>餐饮档案</Text>
      <Text style={styles.description}>餐饮档案服务于安全牌、满足牌和风险牌，不做复杂食谱管理。</Text>

      <BaseCard>
        <Text style={styles.cardTitle}>口味偏好</Text>
        <Text style={styles.cardText}>{profile.tastePreferences.join("、")}</Text>
      </BaseCard>

      <BaseCard>
        <Text style={styles.cardTitle}>忌口 / 少吃</Text>
        <Text style={styles.cardText}>{profile.avoidFoods.join("、")}</Text>
      </BaseCard>

      <BaseCard>
        <Text style={styles.cardTitle}>最近口味反馈</Text>
        <Text style={styles.cardText}>{uniqueTasteTags.length > 0 ? uniqueTasteTags.map(getTasteLabel).join("、") : "还没有饭后口味反馈。"}</Text>
      </BaseCard>

      <BaseCard>
        <Text style={styles.cardTitle}>价格上下文</Text>
        <Text style={styles.cardText}>
          早饭 {profile.mealBudgets.breakfast} 元，午饭 {profile.mealBudgets.lunch} 元，晚饭 {profile.mealBudgets.dinner} 元。
        </Text>
      </BaseCard>
    </ScrollView>
  )
}

function getTasteLabel(tag: TasteFeedback) {
  const labels: Record<TasteFeedback, string> = {
    tasty: "好吃",
    normal: "一般",
    too_salty: "太咸",
    too_oily: "太油",
    too_spicy: "太辣",
    too_plain: "寡淡"
  }
  return labels[tag]
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    gap: spacing.lg,
    maxWidth: 430,
    width: "100%",
    alignSelf: "center",
    padding: spacing.lg,
    paddingBottom: 90,
    backgroundColor: colors.background
  },
  centerContainer: {
    flex: 1,
    gap: spacing.lg,
    maxWidth: 430,
    width: "100%",
    alignSelf: "center",
    justifyContent: "center",
    padding: spacing.lg,
    backgroundColor: colors.background
  },
  title: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: "700"
  },
  description: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "700"
  },
  cardText: {
    marginTop: spacing.md,
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 22
  }
})
