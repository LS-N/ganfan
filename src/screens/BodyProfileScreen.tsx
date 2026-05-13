import React from "react"
import { Link } from "expo-router"
import { ScrollView, StyleSheet, Text, View } from "react-native"
import { PrimaryButton } from "../components"
import { useBodyPuzzleStore } from "../stores/bodyPuzzleStore"
import { colors, radius, spacing } from "../styles/tokens"

export function BodyProfileScreen() {
  const profile = useBodyPuzzleStore((state) => state.profile)
  const meals = useBodyPuzzleStore((state) => state.meals)

  if (!profile) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.title}>我的档案未建立</Text>
        <Text style={styles.description}>先完成建档，再生成身体拼图判断上下文。</Text>
        <Link href="/profile" asChild>
          <PrimaryButton title="去建档" />
        </Link>
      </View>
    )
  }

  const stage = meals.length < 8 ? "看见阶段" : meals.length < 21 ? "行动阶段" : "成就阶段"

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.avatarBlock}>
        <View style={styles.avatar}><Text style={styles.avatarIcon}>🍚</Text></View>
        <Text style={styles.name}>好好吃饭的人</Text>
        <Text style={styles.meta}>{meals.length} 餐记录 · {stage}</Text>
      </View>

      <Card title="基础信息">
        <Info label="身高" value={`${profile.height} cm`} />
        <Info label="体重" value={`${profile.weight} kg`} />
        <Info label="年龄" value={`${profile.age} 岁`} />
        <Info label="性别" value={profile.gender === "unknown" ? "未填" : profile.gender ?? "未填"} />
      </Card>

      <Card title="身体档案">
        <Info label="目标" value="越来越舒服" />
        <Info label="饭后感受" value={profile.commonFeelings.map(getFeelingLabel).join("、")} />
        <Info label="健康背景" value="无特殊情况" />
        <Info label="反馈提醒" value="未设置" />
      </Card>

      <Card title="餐饮档案">
        <Info label="忌口" value={profile.avoidFoods.join("、")} />
        <Info label="每日预算" value="早 15 / 午 35 / 晚 45" />
        <Info label="偏好菜系" value="家常菜" />
        <Info label="已探索菜系" value="3 种" />
      </Card>

      <View style={styles.dataBlock}>
        <Text style={styles.dataLabel}>数据管理</Text>
        <View style={styles.dangerRow}><Text style={styles.dangerText}>🗑️  清空所有饮食记录</Text></View>
        <View style={[styles.dangerRow, styles.deleteRow]}><Text style={styles.deleteText}>⚠️  注销账户 & 删除全部数据</Text></View>
      </View>
    </ScrollView>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={styles.infoGrid}>{children}</View>
    </View>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoBox}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  )
}

function getFeelingLabel(feeling: string) {
  const labels: Record<string, string> = {
    sleepy: "容易困倦",
    bloated: "胀气不舒服",
    hungry_fast: "饿得快",
    energetic: "有精神"
  }
  return labels[feeling] ?? feeling
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
  avatarBlock: {
    alignItems: "center",
    paddingVertical: spacing.xl
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.border
  },
  avatarIcon: {
    fontSize: 36
  },
  name: {
    marginTop: spacing.md,
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "700"
  },
  meta: {
    marginTop: spacing.xs,
    color: colors.textSecondary,
    fontSize: 12
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    backgroundColor: colors.surface
  },
  cardTitle: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: spacing.md
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  infoBox: {
    width: "48%",
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.background
  },
  infoLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    marginBottom: spacing.xs
  },
  infoValue: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19
  },
  dataBlock: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.lg
  },
  dataLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: spacing.md
  },
  dangerRow: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    backgroundColor: colors.border
  },
  dangerText: {
    color: colors.textSecondary,
    fontSize: 14
  },
  deleteRow: {
    borderColor: "#FFB3B3",
    backgroundColor: "#FFF5F5"
  },
  deleteText: {
    color: colors.danger,
    fontSize: 14
  }
})
