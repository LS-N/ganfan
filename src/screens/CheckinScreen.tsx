import React, { useState } from "react"
import { router } from "expo-router"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { PrimaryButton, Tag } from "../components"
import { useBodyPuzzleStore } from "../stores/bodyPuzzleStore"
import { colors, radius, spacing, typography } from "../theme"
import type { DailyCheckin } from "../types/meal"

const energyOptions: Array<{ label: string; value: NonNullable<DailyCheckin["energy"]> }> = [
  { label: "低", value: "low" },
  { label: "稳定", value: "stable" },
  { label: "更好", value: "better" }
]

const digestionOptions: Array<{ label: string; value: NonNullable<DailyCheckin["digestion"]> }> = [
  { label: "舒服", value: "comfortable" },
  { label: "胀气", value: "bloated" },
  { label: "不适", value: "upset" }
]

const satietyOptions: Array<{ label: string; value: NonNullable<DailyCheckin["satiety"]> }> = [
  { label: "饿得快", value: "hungry_fast" },
  { label: "刚好", value: "just_right" },
  { label: "太撑", value: "too_full" }
]

export function CheckinScreen() {
  const meals = useBodyPuzzleStore((state) => state.meals)
  const saveDailyCheckin = useBodyPuzzleStore((state) => state.saveDailyCheckin)
  const [energy, setEnergy] = useState<NonNullable<DailyCheckin["energy"]>>()
  const [digestion, setDigestion] = useState<NonNullable<DailyCheckin["digestion"]>>()
  const [satiety, setSatiety] = useState<NonNullable<DailyCheckin["satiety"]>>()
  const ready = Boolean(energy && digestion && satiety)

  function submit() {
    if (!energy || !digestion || !satiety) return
    saveDailyCheckin({ energy, digestion, satiety })
    router.replace("/")
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Tag tone="success">每日回访</Tag>
        <Text style={styles.title}>今天吃完以后，身体怎么说？</Text>
        <Text style={styles.desc}>回访会关联今天的 {todayMealCount(meals)} 餐，用来校准后续洞察。</Text>
      </View>

      <Question title="精力" options={energyOptions} value={energy} onChange={setEnergy} />
      <Question title="消化" options={digestionOptions} value={digestion} onChange={setDigestion} />
      <Question title="饱腹节奏" options={satietyOptions} value={satiety} onChange={setSatiety} />

      <PrimaryButton title="保存今日回访" disabled={!ready} onPress={submit} />
    </ScrollView>
  )
}

function Question<T extends string>({ title, options, value, onChange }: { title: string; options: Array<{ label: string; value: T }>; value?: T; onChange: (value: T) => void }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={styles.optionRow}>
        {options.map((option) => {
          const active = option.value === value
          return (
            <Pressable key={option.value} style={[styles.option, active && styles.optionActive]} onPress={() => onChange(option.value)}>
              <Text style={[styles.optionText, active && styles.optionTextActive]}>{option.label}</Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

function todayMealCount(meals: Array<{ createdAt: string }>) {
  const today = new Date().toISOString().slice(0, 10)
  return meals.filter((meal) => meal.createdAt.slice(0, 10) === today).length
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
  header: {
    gap: spacing.md
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.size.titleLg,
    fontWeight: typography.weight.bold,
    lineHeight: typography.lineHeight.titleMd
  },
  desc: {
    color: colors.textSecondary,
    fontSize: typography.size.md,
    lineHeight: typography.lineHeight.md
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    backgroundColor: colors.surface
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    marginBottom: spacing.md
  },
  optionRow: {
    flexDirection: "row",
    gap: spacing.sm
  },
  option: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background
  },
  optionActive: {
    borderColor: colors.brand,
    backgroundColor: colors.brand
  },
  optionText: {
    color: colors.textSecondary,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold
  },
  optionTextActive: {
    color: colors.textInverse
  }
})
