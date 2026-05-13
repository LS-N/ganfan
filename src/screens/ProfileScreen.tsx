import React, { useState } from "react"
import { router } from "expo-router"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { PrimaryButton } from "../components"
import { useBodyPuzzleStore } from "../stores/bodyPuzzleStore"
import { colors, radius, spacing } from "../styles/tokens"

const steps = [
  { question: "你最想通过饮食改善什么？", key: "goal", options: ["下午不困", "轻松减脂", "消化更好", "吃得更满足"] },
  { question: "有什么不能吃或不喜欢的？", key: "avoid", options: ["无限制", "不吃辣", "不吃海鲜", "少油少盐"] },
  { question: "三餐预算怎么设？", key: "budget", options: ["早 15 / 午 35 / 晚 45", "早 10 / 午 25 / 晚 35", "早 20 / 午 50 / 晚 60", "先用默认"] },
  { question: "饭后最常出现哪种感受？", key: "feeling", options: ["容易困倦", "胀气不舒服", "吃撑后悔", "基本还好"] }
]

export function ProfileScreen() {
  const completeMockProfile = useBodyPuzzleStore((state) => state.completeMockProfile)
  const [stepIndex, setStepIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const step = steps[stepIndex]
  const selected = answers[step.key]

  function handleNext() {
    if (!selected) return
    if (stepIndex < steps.length - 1) {
      setStepIndex((current) => current + 1)
      return
    }
    completeMockProfile({
      goal: answers.goal,
      avoid: answers.avoid,
      budget: answers.budget,
      feeling: answers.feeling
    })
    router.replace("/")
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.progress}>
        {steps.map((_, index) => (
          <View style={[styles.progressBar, index <= stepIndex && styles.progressBarDone]} key={index} />
        ))}
      </View>
      <Text style={styles.stepText}>{stepIndex + 1} / {steps.length}</Text>
      <Text style={styles.question}>{step.question}</Text>

      <View style={styles.options}>
        {step.options.map((option) => {
          const active = selected === option
          return (
            <Pressable key={option} onPress={() => setAnswers((current) => ({ ...current, [step.key]: option }))} style={[styles.option, active && styles.optionSelected]}>
              <Text style={[styles.optionText, active && styles.optionTextSelected]}>{active ? "●" : "○"} {option}</Text>
            </Pressable>
          )
        })}
      </View>

      <PrimaryButton title={stepIndex < steps.length - 1 ? "继续 →" : "开始记录 →"} disabled={!selected} onPress={handleNext} />
    </ScrollView>
  )
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
  progress: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm
  },
  progressBar: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.border
  },
  progressBarDone: {
    backgroundColor: colors.brand
  },
  stepText: {
    color: colors.textSecondary,
    fontSize: 12
  },
  question: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 36
  },
  options: {
    gap: spacing.md,
    marginBottom: spacing.sm
  },
  option: {
    minHeight: 56,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.sm,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface
  },
  optionSelected: {
    borderColor: colors.brand,
    backgroundColor: colors.brandSurface
  },
  optionText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: "700"
  },
  optionTextSelected: {
    color: colors.brand
  }
})
