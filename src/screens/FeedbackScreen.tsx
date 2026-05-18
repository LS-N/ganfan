import React, { useState } from "react"
import { router } from "expo-router"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { PrimaryButton } from "../components"
import { useBodyPuzzleStore } from "../stores/bodyPuzzleStore"
import { colors, radius, spacing } from "../styles/tokens"
import type { Analysis, ComfortTag, Fullness, PriceSatisfaction, TasteFeedback } from "../types/meal"

type FeedbackQuestion = {
  key: string
  label: string
  options: string[]
}

const baseQuestions: FeedbackQuestion[] = [
  { key: "actualIntake", label: "实际吃掉多少", options: ["全吃完", "吃了3/4", "吃了一半", "剩很多"] },
  { key: "fullness", label: "饱腹状态", options: ["撑", "刚好", "还饿"] },
  { key: "comfort", label: "身体即时感受", options: ["舒服", "胀气", "困倦", "有精神"] },
  { key: "satisfaction", label: "这顿吃得开心吗", options: ["很开心", "还不错", "一般", "有点后悔"] }
]

export function FeedbackScreen() {
  const activeMealId = useBodyPuzzleStore((state) => state.activeMealId)
  const analysis = useBodyPuzzleStore((state) => state.analyses.find((item) => item.mealId === state.activeMealId))
  const saveFeedback = useBodyPuzzleStore((state) => state.saveFeedback)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [leftoverSelected, setLeftoverSelected] = useState(false)
  const feedbackQuestions = buildFeedbackQuestions(analysis)
  const allAnswered = feedbackQuestions.every((question) => answers[question.key])

  function handleSave() {
    if (!activeMealId) {
      router.replace("/record")
      return
    }

    saveFeedback({
      fullness: mapFullness(answers.fullness),
      comfortTags: [mapComfort(answers.comfort)],
      tasteFeedback: [mapTaste(answers.satisfaction)],
      priceSatisfaction: mapPrice(answers.satisfaction)
    })
    router.push("/checkin")
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>吃完了？</Text>
      <Text style={styles.subtitle}>拍剩余或空盘，AI 对比计算实际摄入。没拍默认用餐前数据。</Text>

      <Pressable style={[styles.leftoverBox, leftoverSelected && styles.leftoverSelected]} onPress={() => setLeftoverSelected(true)}>
        <Text style={styles.leftoverIcon}>{leftoverSelected ? "🍽️" : "📷"}</Text>
        <Text style={styles.leftoverTitle}>{leftoverSelected ? "已选择模拟空盘照片" : "拍剩余 / 空盘照片"}</Text>
        <Text style={styles.leftoverHint}>可选 · 没拍默认用餐前估算数据</Text>
      </Pressable>

      <View style={styles.estimateCard}>
        <Text style={styles.label}>本餐实际摄入</Text>
        <Text style={styles.estimateTitle}>{analysis?.dishName ?? "这一餐"}</Text>
        <Text style={styles.estimateText}>约 650-850 kcal · 蛋白中等 · 脂肪中等 · 碳水偏高</Text>
        <Text style={styles.estimateAccent}>
          {answers.actualIntake ? `实际摄入按${answers.actualIntake}估算，后续反馈会用来校验这次预测。` : "先选择实际吃掉多少，系统会按饭量修正本餐摄入。"}
        </Text>
        <Text style={styles.estimateMuted}>{leftoverSelected ? "已上传饭后照片，后续用于校准剩余量" : "未拍剩余，暂按饭前估算"}</Text>
      </View>

      {feedbackQuestions.map((question) => (
        <View key={question.key}>
          <Text style={styles.label}>{question.label}</Text>
          <View style={styles.scoreRow}>
            {question.options.map((option) => {
              const active = answers[question.key] === option
              return (
                <Pressable key={option} onPress={() => setAnswers((current) => ({ ...current, [question.key]: option }))} style={[styles.scoreButton, active && styles.scoreSelected]}>
                  <Text style={[styles.scoreText, active && styles.scoreTextSelected]}>{option}</Text>
                </Pressable>
              )
            })}
          </View>
        </View>
      ))}

      <PrimaryButton title="提交 ✓" disabled={!allAnswered} onPress={handleSave} />
    </ScrollView>
  )
}

function buildFeedbackQuestions(analysis?: Analysis): FeedbackQuestion[] {
  const focusQuestions =
    analysis?.feedbackFocus
      ?.slice(0, 2)
      .map((focus, index) => ({
        key: `focus-${index}`,
        label: focus,
        options: ["没有", "有一点", "明显"]
      })) ?? []

  return [...baseQuestions, ...focusQuestions]
}

function mapFullness(value?: string): Fullness {
  if (value === "撑") return "too_full"
  if (value === "还饿") return "hungry"
  return "just_right"
}

function mapComfort(value?: string): ComfortTag {
  if (value === "胀气") return "bloated"
  if (value === "困倦") return "sleepy"
  if (value === "有精神") return "energetic"
  return "comfortable"
}

function mapTaste(value?: string): TasteFeedback {
  if (value === "有点后悔") return "normal"
  if (value === "一般") return "normal"
  return "tasty"
}

function mapPrice(value?: string): PriceSatisfaction {
  if (value === "很开心") return "worth_it"
  if (value === "有点后悔") return "expensive"
  return "normal"
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
  title: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: "700"
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21
  },
  leftoverBox: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: "dashed",
    borderRadius: radius.lg,
    alignItems: "center",
    padding: spacing.lg,
    backgroundColor: colors.surface
  },
  leftoverSelected: {
    borderStyle: "solid",
    borderColor: colors.brand,
    backgroundColor: colors.brandSurface
  },
  leftoverIcon: {
    fontSize: 24
  },
  leftoverTitle: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "700"
  },
  leftoverHint: {
    marginTop: spacing.xs,
    color: colors.textMuted,
    fontSize: 11
  },
  estimateCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    backgroundColor: colors.surface
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: spacing.sm
  },
  estimateTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 21
  },
  estimateText: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 21
  },
  estimateAccent: {
    marginTop: spacing.sm,
    color: colors.brand,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 18
  },
  estimateMuted: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 17
  },
  scoreRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  scoreButton: {
    minHeight: 42,
    minWidth: 76,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface
  },
  scoreSelected: {
    borderColor: colors.brand,
    backgroundColor: colors.brand
  },
  scoreText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "700"
  },
  scoreTextSelected: {
    color: "#FFFFFF"
  }
})
