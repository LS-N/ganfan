import React, { useState } from "react"
import { router } from "expo-router"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { PrimaryButton } from "../components"
import { getMealTypeLabel, useBodyPuzzleStore } from "../stores/bodyPuzzleStore"
import { colors, radius, spacing } from "../styles/tokens"
import type { MealType } from "../types/meal"

type LoginMode = "role" | "new" | "returning"

export function HomeScreen() {
  const profile = useBodyPuzzleStore((state) => state.profile)
  const meals = useBodyPuzzleStore((state) => state.meals)
  const feedbacks = useBodyPuzzleStore((state) => state.feedbacks)
  const loadSeedScenario = useBodyPuzzleStore((state) => state.loadSeedScenario)
  const createMockMeal = useBodyPuzzleStore((state) => state.createMockMeal)
  const startActiveMeal = useBodyPuzzleStore((state) => state.startActiveMeal)
  const [loginMode, setLoginMode] = useState<LoginMode>("role")
  const [agreed, setAgreed] = useState(false)
  const recentMeal = meals[0]
  const homeStatus = getHomeStatus(recentMeal)

  function enterReturningUser() {
    loadSeedScenario(7)
    router.replace("/")
  }

  function enterNewUserProfile() {
    if (!agreed) return
    router.push("/profile")
  }

  function startBackfillFromHome() {
    createMockMeal(guessMealType(), "backfill")
    startActiveMeal()
    router.push("/feedback")
  }

  if (!profile) {
    return (
      <View style={styles.loginShell}>
        <View style={styles.loginHero}>
          <Text style={styles.loginIcon}>🍽️</Text>
          <Text style={styles.loginTitle}>干饭</Text>
          <Text style={styles.loginSub}>好好吃饭</Text>
          <Text style={styles.loginText}>用 AI 识别每一餐{"\n"}看见身体的反馈</Text>
        </View>
        <View style={styles.loginPanel}>
          {loginMode === "role" ? (
            <>
              <Pressable style={styles.primaryRole} onPress={() => setLoginMode("new")}>
                <Text style={styles.primaryRoleTitle}>我是新用户</Text>
                <Text style={styles.primaryRoleText}>先登录或注册，再完成建档和第一餐记录。</Text>
              </Pressable>
              <Pressable style={styles.secondaryRole} onPress={() => setLoginMode("returning")}>
                <Text style={styles.secondaryRoleTitle}>我是老用户</Text>
                <Text style={styles.secondaryRoleText}>带历史记录进入首页，直接查看身体拼图、周报和继续记录。</Text>
              </Pressable>
              <Text style={styles.prototypeHint}>1.0 原型演示入口 · 先选身份，再进入对应路径</Text>
            </>
          ) : loginMode === "new" ? (
            <>
              <Text style={styles.authTitle}>新用户登录</Text>
              <Text style={styles.authDesc}>登录后完成身体档案，开始记录第一餐。</Text>
              <Pressable disabled={!agreed} style={[styles.wechatButton, !agreed && styles.disabledButton]} onPress={enterNewUserProfile}>
                <Text style={styles.wechatButtonText}>💬 微信登录</Text>
              </Pressable>
              <Pressable disabled={!agreed} style={[styles.phoneButton, !agreed && styles.disabledButton]} onPress={enterNewUserProfile}>
                <Text style={styles.phoneButtonText}>手机号登录</Text>
              </Pressable>
              <Pressable style={styles.agreementRow} onPress={() => setAgreed((value) => !value)}>
                <Text style={[styles.checkbox, agreed && styles.checkboxChecked]}>{agreed ? "✓" : ""}</Text>
                <Text style={styles.agreementText}>我已阅读并同意用户协议与隐私政策</Text>
              </Pressable>
              <Pressable style={styles.returnButton} onPress={() => setLoginMode("role")}>
                <Text style={styles.returnButtonText}>返回身份选择</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.authTitle}>老用户演示登录</Text>
              <Text style={styles.authDesc}>进入带历史记录的演示账号，查看身体拼图、周报和继续记录。</Text>
              <Pressable style={styles.wechatButton} onPress={enterReturningUser}>
                <Text style={styles.wechatButtonText}>💬 微信登录</Text>
              </Pressable>
              <Pressable style={styles.phoneButton} onPress={enterReturningUser}>
                <Text style={styles.phoneButtonText}>手机号登录</Text>
              </Pressable>
              <Pressable style={styles.returnButton} onPress={() => setLoginMode("role")}>
                <Text style={styles.returnButtonText}>返回身份选择</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    )
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {homeStatus === "analyzing" ? (
        <View style={styles.pendingCard}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.greenLabel}>正在识别</Text>
              <Text style={styles.cardTitle}>这餐快好了</Text>
            </View>
            <Text style={styles.statusPill}>分析中</Text>
          </View>
          <Text style={styles.cardDesc}>正在整理餐图结构。结果只用于轻判断，不做精确热量承诺。</Text>
          <View style={styles.eatingVisual}>
            <Text style={styles.eatingIcon}>🔍</Text>
          </View>
          <PrimaryButton title="查看分析" onPress={() => router.push("/analysis")} />
        </View>
      ) : homeStatus === "ready_to_eat" ? (
        <View style={styles.pendingCard}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.greenLabel}>可以开吃</Text>
              <Text style={styles.cardTitle}>{recentMeal ? getMealTypeLabel(recentMeal.mealType) : "这餐"}先慢慢吃</Text>
            </View>
            <Text style={styles.statusPill}>已分析</Text>
          </View>
          <Text style={styles.cardDesc}>{recentMeal?.mealCategory ?? "这一餐"} · 先吃蛋白和菜，再吃主食，吃完回来打分。</Text>
          <View style={styles.eatingVisual}>
            <Text style={styles.eatingIcon}>🍱</Text>
          </View>
          <PrimaryButton
            title="好的，去吃了"
            onPress={() => {
              startActiveMeal()
              router.push("/")
            }}
          />
          <Pressable style={styles.ghostButton} onPress={() => router.push("/analysis")}>
            <Text style={styles.ghostButtonText}>再看一眼分析 →</Text>
          </Pressable>
        </View>
      ) : homeStatus === "eating" || homeStatus === "pending_feedback" ? (
        <View style={styles.pendingCard}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.greenLabel}>{homeStatus === "pending_feedback" ? "待反馈" : "刚才那顿"}</Text>
              <Text style={styles.cardTitle}>{recentMeal ? getMealTypeLabel(recentMeal.mealType) : "这餐"}慢慢吃</Text>
            </View>
            <Text style={styles.statusPill}>已拍照</Text>
          </View>
          <Text style={styles.cardDesc}>{recentMeal?.mealCategory ?? "这一餐"} · 吃完回来打分，身体拼图才会更准。</Text>
          <View style={styles.eatingVisual}>
            <Text style={styles.eatingIcon}>🥢</Text>
          </View>
          <PrimaryButton title={homeStatus === "pending_feedback" ? "去打分 →" : "我吃完了"} onPress={() => router.push("/feedback")} />
          <Pressable style={styles.ghostButton} onPress={() => router.push("/record")}>
            <Text style={styles.ghostButtonText}>刚刚又吃/喝了别的 →</Text>
          </Pressable>
        </View>
      ) : homeStatus === "done" && recentMeal && feedbacks.length > 0 ? (
        <View style={styles.doneCard}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.greenLabel}>好好吃饭</Text>
              <Text style={styles.cardTitle}>记下来了</Text>
            </View>
            <Text style={styles.donePill}>已记录</Text>
          </View>
          <View style={styles.doneVisual}>
            <Text style={styles.doneIcon}>🍽️</Text>
            <Text style={styles.plusOne}>+1</Text>
          </View>
          <Text style={styles.cardDesc}>{meals.length < 7 ? `身体会记住这一餐。再记 ${7 - meals.length} 餐，身体洞察就出来了。` : "身体洞察已解锁，看看今天的提醒。"}</Text>
          <PrimaryButton title="看看身体洞察" onPress={() => router.push("/report")} />
          <Pressable style={styles.ghostButton} onPress={() => router.push("/record")}>
            <Text style={styles.ghostButtonText}>又吃/喝了点别的？记一笔加餐</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.todayCard}>
          <Text style={styles.kicker}>{meals.length === 0 ? "新用户第一步" : getGreeting()}</Text>
          <Text style={styles.todayTitle}>{meals.length === 0 ? "记录第一餐，身体拼图才会开始" : `${guessMealLabel()}吃点什么好？`}</Text>

          {meals.length < 3 && (
            <View style={styles.unlockBox}>
              <View style={styles.unlockRow}>
                <Text style={styles.unlockText}>{meals.length === 0 ? "拍下第一餐，开始建立你的身体反馈" : `再记 ${3 - meals.length} 餐解锁第一份身体洞察`}</Text>
                <Text style={styles.unlockCount}>{meals.length}/3</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressBar, { width: `${Math.round((meals.length / 3) * 100)}%` }]} />
              </View>
            </View>
          )}

          <Pressable style={styles.recordHero} onPress={() => router.push("/record?mode=shoot")}>
            <Pressable style={styles.backfillPill} onPress={startBackfillFromHome}>
              <Text style={styles.backfillText}>补录</Text>
            </Pressable>
            <View style={styles.plateCircle}>
              <Text style={styles.plateIcon}>🍽️</Text>
            </View>
            <Text style={styles.recordText}>{meals.length === 0 ? "记录第一餐" : "记录这一餐"}</Text>
          </Pressable>

          <Pressable style={styles.thinkButton} onPress={() => router.push("/draw-card")}>
            <Text style={styles.thinkButtonText}>还没想好吃什么 →</Text>
          </Pressable>
        </View>
      )}

      {meals.length >= 3 && (
        <View style={styles.mirrorCard}>
          <Text style={styles.kicker}>你的身体说</Text>
          <Text style={styles.mirrorText}>记录了 {meals.length} 餐，规律正在浮现。再记几天，洞察会更准确。</Text>
        </View>
      )}
    </ScrollView>
  )
}

function getHomeStatus(meal?: { status: string; feedbackDueAt?: string }) {
  if (!meal) return "empty"
  if (meal.status === "photo_ready" || meal.status === "analyzing") return "analyzing"
  if (meal.status === "analyzed" || meal.status === "ready_to_eat") return "ready_to_eat"
  if (meal.status === "eating") {
    if (meal.feedbackDueAt && new Date(meal.feedbackDueAt).getTime() <= Date.now()) return "pending_feedback"
    return "eating"
  }
  if (meal.status === "pending_feedback") return "pending_feedback"
  if (meal.status === "feedback_completed" || meal.status === "completed") return "done"
  return "empty"
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 10) return "早上好"
  if (hour >= 10 && hour < 14) return "午安"
  if (hour >= 14 && hour < 18) return "下午好"
  if (hour >= 18 && hour < 22) return "晚上好"
  return "夜深了"
}

function guessMealLabel() {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 10) return "早饭"
  if (hour >= 10 && hour < 14) return "午饭"
  if (hour >= 14 && hour < 17) return "加餐"
  if (hour >= 17 && hour < 21) return "晚饭"
  return "加餐"
}

function guessMealType(): MealType {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 10) return "breakfast"
  if (hour >= 10 && hour < 14) return "lunch"
  if (hour >= 17 && hour < 21) return "dinner"
  return "snack"
}

const styles = StyleSheet.create({
  loginShell: {
    flex: 1,
    maxWidth: 430,
    width: "100%",
    alignSelf: "center",
    backgroundColor: colors.brandSurface
  },
  loginHero: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xxl
  },
  loginIcon: {
    fontSize: 64,
    marginBottom: spacing.xl
  },
  loginTitle: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: "800"
  },
  loginSub: {
    marginTop: spacing.md,
    color: colors.textSecondary,
    fontSize: 16
  },
  loginText: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 21,
    textAlign: "center"
  },
  loginPanel: {
    gap: spacing.md,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
    backgroundColor: "#FFFFFF"
  },
  primaryRole: {
    borderRadius: 22,
    padding: spacing.xl,
    backgroundColor: colors.brand
  },
  primaryRoleTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900"
  },
  primaryRoleText: {
    marginTop: spacing.sm,
    color: "rgba(255,255,255,.78)",
    fontSize: 12,
    lineHeight: 19
  },
  secondaryRole: {
    borderWidth: 1.5,
    borderColor: "rgba(45,106,79,.22)",
    borderRadius: 22,
    padding: spacing.xl,
    backgroundColor: colors.successSurface
  },
  secondaryRoleTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "900"
  },
  secondaryRoleText: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 19
  },
  prototypeHint: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 18,
    textAlign: "center"
  },
  authTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "900"
  },
  authDesc: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20
  },
  wechatButton: {
    minHeight: 54,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.textPrimary
  },
  wechatButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900"
  },
  phoneButton: {
    minHeight: 54,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.brandSurface
  },
  phoneButtonText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "900"
  },
  disabledButton: {
    opacity: 0.45
  },
  agreementRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 6,
    color: "#FFFFFF",
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center"
  },
  checkboxChecked: {
    borderColor: colors.brand,
    backgroundColor: colors.brand
  },
  agreementText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18
  },
  returnButton: {
    alignItems: "center",
    padding: spacing.sm
  },
  returnButtonText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "700"
  },
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
  todayCard: {
    borderRadius: radius.xl,
    padding: 22,
    backgroundColor: colors.surface
  },
  kicker: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: spacing.xs
  },
  todayTitle: {
    color: colors.textPrimary,
    fontSize: 30,
    fontWeight: "700",
    lineHeight: 38
  },
  unlockBox: {
    marginTop: spacing.lg,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.successSurface
  },
  unlockRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md
  },
  unlockText: {
    flex: 1,
    color: colors.success,
    fontSize: 12,
    fontWeight: "700"
  },
  unlockCount: {
    color: colors.success,
    fontSize: 11,
    fontWeight: "700"
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    marginTop: spacing.sm,
    backgroundColor: "rgba(0,0,0,.07)"
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.success
  },
  recordHero: {
    height: 164,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.lg,
    overflow: "hidden",
    backgroundColor: colors.brandSurface
  },
  backfillPill: {
    position: "absolute",
    top: 12,
    right: 12,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: "rgba(255,255,255,.92)"
  },
  backfillText: {
    color: colors.brand,
    fontSize: 12,
    fontWeight: "900"
  },
  plateCircle: {
    width: 104,
    height: 104,
    borderWidth: 10,
    borderColor: "rgba(232,93,38,.18)",
    borderRadius: 52,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF"
  },
  plateIcon: {
    fontSize: 42
  },
  recordText: {
    position: "absolute",
    bottom: spacing.lg,
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    textShadowColor: "rgba(0,0,0,.18)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6
  },
  thinkButton: {
    alignItems: "center",
    marginTop: spacing.md,
    padding: spacing.md
  },
  thinkButtonText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "700"
  },
  pendingCard: {
    borderRadius: radius.xl,
    padding: 22,
    backgroundColor: colors.brandSurface
  },
  doneCard: {
    borderWidth: 2.5,
    borderColor: colors.success,
    borderRadius: radius.xl,
    padding: 22,
    backgroundColor: colors.successSurface
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md
  },
  greenLabel: {
    color: colors.success,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: spacing.xs
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 30,
    fontWeight: "700",
    lineHeight: 38
  },
  statusPill: {
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.brand,
    fontSize: 11,
    fontWeight: "900",
    backgroundColor: "#FFFFFF"
  },
  donePill: {
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.success,
    fontSize: 11,
    fontWeight: "900",
    backgroundColor: "#FFFFFF"
  },
  cardDesc: {
    marginTop: spacing.md,
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center"
  },
  eatingVisual: {
    height: 140,
    borderRadius: radius.xl,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: spacing.lg,
    backgroundColor: "#FFFFFF"
  },
  eatingIcon: {
    fontSize: 42
  },
  doneVisual: {
    width: 118,
    height: 118,
    borderRadius: 30,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: spacing.lg,
    backgroundColor: colors.success
  },
  doneIcon: {
    fontSize: 36
  },
  plusOne: {
    marginTop: spacing.sm,
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700"
  },
  ghostButton: {
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: "dashed",
    borderRadius: radius.pill,
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface
  },
  ghostButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "700"
  },
  mirrorCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    backgroundColor: colors.brand
  },
  mirrorText: {
    color: "#FFFFFF",
    fontSize: 17,
    lineHeight: 27,
    fontWeight: "700"
  },
})
