import React, { useEffect, useState } from "react"
import { router } from "expo-router"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { Input, PrimaryButton } from "../components"
import { getMealTypeLabel, useBodyPuzzleStore } from "../stores/bodyPuzzleStore"
import { colors, radius, size, spacing, typography } from "../theme"
import type { MealType } from "../types/meal"

export function HomeScreen() {
  const profile = useBodyPuzzleStore((state) => state.profile)
  const authUserId = useBodyPuzzleStore((state) => state.authUserId)
  const authLoading = useBodyPuzzleStore((state) => state.authLoading)
  const authError = useBodyPuzzleStore((state) => state.authError)
  const meals = useBodyPuzzleStore((state) => state.meals)
  const feedbacks = useBodyPuzzleStore((state) => state.feedbacks)
  const dailyCheckins = useBodyPuzzleStore((state) => state.dailyCheckins)
  const hydratePersistedData = useBodyPuzzleStore((state) => state.hydratePersistedData)
  const sendPhoneOtp = useBodyPuzzleStore((state) => state.sendPhoneOtp)
  const verifyPhoneOtp = useBodyPuzzleStore((state) => state.verifyPhoneOtp)
  const enterGuestMode = useBodyPuzzleStore((state) => state.enterGuestMode)
  const createMockMeal = useBodyPuzzleStore((state) => state.createMockMeal)
  const startActiveMeal = useBodyPuzzleStore((state) => state.startActiveMeal)
  const [authMethod, setAuthMethod] = useState<"select" | "phone">("phone")
  const [phone, setPhone] = useState("")
  const [token, setToken] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [loginError, setLoginError] = useState<string>()
  const recentMeal = meals[0]
  const homeStatus = getHomeStatus(recentMeal)
  const needsCheckin = feedbacks.length > 0 && !dailyCheckins.some((item) => item.date === new Date().toISOString().slice(0, 10))
  const authMessage = loginError || authError ? formatAuthError(loginError ?? authError, "验证码发送失败") : undefined

  useEffect(() => {
    void hydratePersistedData()
  }, [hydratePersistedData])

  async function handleSendOtp() {
    if (!agreed || !phone.trim()) return
    setLoginError(undefined)
    try {
      await sendPhoneOtp(phone)
      setOtpSent(true)
    } catch (error) {
      setLoginError(formatAuthError(error, "验证码发送失败"))
    }
  }

  async function handleVerifyOtp() {
    if (!phone.trim() || !token.trim()) return
    setLoginError(undefined)
    try {
      await verifyPhoneOtp(phone, token)
      const nextProfile = useBodyPuzzleStore.getState().profile
      router.replace(nextProfile ? "/" : "/profile")
    } catch (error) {
      setLoginError(formatAuthError(error, "验证码校验失败"))
    }
  }

  function handleSelectPhoneAuth() {
    setLoginError(undefined)
    if (!agreed) {
      setLoginError("请先阅读并同意用户协议与隐私政策")
      return
    }
    setAuthMethod("phone")
    setOtpSent(false)
    setToken("")
  }

  function handleWechatPlaceholder() {
    setLoginError("微信登录需要开放平台 AppID、Universal Link 和后端换绑逻辑，本轮先占位")
  }

  function resetAuthSelection() {
    setAuthMethod("select")
    setOtpSent(false)
    setToken("")
    setLoginError(undefined)
  }

  function handleSkipLogin() {
    enterGuestMode()
    router.replace("/")
  }

  function startBackfillFromHome() {
    createMockMeal(guessMealType(), "backfill")
    startActiveMeal()
    router.push("/feedback")
  }

  if (!profile) {
    return (
      <ScrollView style={styles.loginShell} contentContainerStyle={styles.loginShellContent} keyboardShouldPersistTaps="handled">
        <View style={styles.loginHero}>
          <Text style={styles.loginIcon}>🍽️</Text>
          <Text style={styles.loginTitle}>干饭</Text>
          <Text style={styles.loginSub}>好好吃饭</Text>
          <Text style={styles.loginText}>用 AI 识别每一餐{"\n"}看见身体的反馈</Text>
        </View>
        <View style={styles.loginPanel}>
          <Pressable style={styles.skipLoginPrimaryButton} onPress={handleSkipLogin}>
            <Text style={styles.skipLoginPrimaryText}>跳过登录，先体验</Text>
            <Text style={styles.skipLoginPrimaryHint}>临时测试入口，不写入真实账号</Text>
          </Pressable>
          {authUserId ? (
            <>
              <Text style={styles.authTitle}>继续完成建档</Text>
              <Text style={styles.authDesc}>已登录手机号账号，完成身体档案后就能开始记录第一餐。</Text>
              <PrimaryButton title="去建档 →" onPress={() => router.push("/profile")} />
            </>
          ) : authMethod === "select" ? (
            <>
              <Text style={styles.authTitle}>手机号验证即登录</Text>
              <Text style={styles.authDesc}>未注册手机号验证后会自动创建干饭账号，后续饮食记录才会写入你的云端档案。</Text>
              <View style={styles.maskedPhoneBlock}>
                <Text style={styles.maskedPhone}>手机号</Text>
                <Text style={styles.maskedPhoneDesc}>验证码会发送到手机号；未注册会自动创建账号。</Text>
              </View>
              {authMessage ? <Text style={styles.authError}>{authMessage}</Text> : null}
              <PrimaryButton title="手机号验证码登录" disabled={!agreed || authLoading} loading={authLoading} size="lg" onPress={handleSelectPhoneAuth} />
              <Pressable style={styles.skipLoginButton} onPress={handleSkipLogin}>
                <Text style={styles.skipLoginText}>跳过登录，先体验</Text>
              </Pressable>
              <Pressable style={({ pressed }) => [styles.wechatAuthButton, pressed && styles.pressedButton]} onPress={handleWechatPlaceholder}>
                <Text style={styles.wechatIcon}>💬</Text>
                <Text style={styles.wechatAuthText}>微信登录</Text>
              </Pressable>
              <Pressable style={styles.agreementRow} onPress={() => setAgreed((value) => !value)}>
                <Text style={[styles.checkbox, agreed && styles.checkboxChecked]}>{agreed ? "✓" : ""}</Text>
                <Text style={styles.agreementText}>我已阅读并同意《用户协议》、《隐私政策》和《手机号认证服务条款》，未注册手机号验证后将创建干饭账号</Text>
              </Pressable>
              <View style={styles.loginFooterRow}>
                <Pressable onPress={handleSelectPhoneAuth}>
                  <Text style={styles.loginFooterText}>其他登录方式</Text>
                </Pressable>
                <Text style={styles.loginFooterDivider}>|</Text>
                <Pressable onPress={() => setLoginError("请联系测试管理员检查短信配置或 Supabase Auth 状态")}>
                  <Text style={styles.loginFooterText}>登录遇到问题</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.authTitle}>输入手机号</Text>
              <Text style={styles.authDesc}>手机号验证码校验通过即登录；如果这个手机号还没有账号，后台会自动创建。</Text>
              <Input
                label="手机号"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="输入手机号，国内号码可直接填 11 位"
                editable={!authLoading}
              />
              {otpSent ? (
                <Input
                  label="验证码"
                  value={token}
                  onChangeText={setToken}
                  keyboardType="number-pad"
                  placeholder="输入短信验证码"
                  editable={!authLoading}
                />
              ) : null}
              {authMessage ? <Text style={styles.authError}>{authMessage}</Text> : null}
              <Pressable style={styles.agreementRow} onPress={() => setAgreed((value) => !value)}>
                <Text style={[styles.checkbox, agreed && styles.checkboxChecked]}>{agreed ? "✓" : ""}</Text>
                <Text style={styles.agreementText}>我已阅读并同意用户协议与隐私政策</Text>
              </Pressable>
              {otpSent ? (
                <PrimaryButton title={authLoading ? "校验中..." : "登录并继续 →"} disabled={!agreed || !token.trim() || authLoading} onPress={handleVerifyOtp} />
              ) : (
                <PrimaryButton title={authLoading ? "发送中..." : "获取验证码"} disabled={!agreed || !phone.trim() || authLoading} onPress={handleSendOtp} />
              )}
              {otpSent ? (
                <Pressable style={styles.returnButton} onPress={() => setOtpSent(false)}>
                  <Text style={styles.returnButtonText}>重新填写手机号</Text>
                </Pressable>
              ) : null}
              <Pressable style={styles.returnButton} onPress={resetAuthSelection}>
                <Text style={styles.returnButtonText}>返回登录方式</Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
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
      ) : needsCheckin ? (
        <View style={styles.pendingCard}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.greenLabel}>待回访</Text>
              <Text style={styles.cardTitle}>补一下今天的身体反馈</Text>
            </View>
            <Text style={styles.statusPill}>回访</Text>
          </View>
          <Text style={styles.cardDesc}>这一步会把今天的餐次和精力、消化、饱腹节奏关联起来。</Text>
          <PrimaryButton title="去每日回访" onPress={() => router.push("/checkin")} />
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
          <Text style={styles.cardDesc}>{meals.length < 7 ? `身体会记住这一餐。再记 ${7 - meals.length} 餐，首批身体洞察就出来了。` : "身体洞察已解锁，看看今天的提醒。"}</Text>
          <PrimaryButton title="看看身体洞察" onPress={() => router.push("/report")} />
          <Pressable style={styles.ghostButton} onPress={() => router.push("/record")}>
            <Text style={styles.ghostButtonText}>又吃/喝了点别的？记一笔加餐</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.todayCard}>
          <Text style={styles.kicker}>{meals.length === 0 ? "新用户第一步" : getGreeting()}</Text>
          <Text style={styles.todayTitle}>{meals.length === 0 ? "记录第一餐，身体拼图才会开始" : `${guessMealLabel()}吃点什么好？`}</Text>

          {meals.length < 7 && (
            <View style={styles.unlockBox}>
              <View style={styles.unlockRow}>
                <Text style={styles.unlockText}>{meals.length === 0 ? "拍下第一餐，开始建立你的身体反馈" : `再记 ${7 - meals.length} 餐解锁第一份身体洞察`}</Text>
                <Text style={styles.unlockCount}>{meals.length}/7</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressBar, { width: `${Math.round((meals.length / 7) * 100)}%` }]} />
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

function formatAuthError(error: unknown, fallback: string) {
  const message = typeof error === "string" ? error : error instanceof Error ? error.message : fallback
  if (/unsupported phone provider/i.test(message)) return "短信通道未配置或不可达，请联系管理员检查 Supabase Send SMS Hook"
  if (/phone_otp_send_failed/i.test(message)) return "验证码发送失败，请稍后重试"
  if (/phone_otp_verify_failed/i.test(message)) return "验证码校验失败，请确认短信验证码后重试"
  if (/sms_provider_failed/i.test(message)) return "短信发送失败，请检查 Spug 发送地址"
  if (/unauthorized_auth_hook/i.test(message)) return "短信回调鉴权失败，请检查 Hook token"
  if (/auth_required/i.test(message)) return "请先完成手机号登录"
  return message
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
    maxWidth: size.mobileMaxWidth,
    width: "100%",
    alignSelf: "center",
    backgroundColor: colors.brandSurface
  },
  loginShellContent: {
    flexGrow: 1
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
    fontSize: typography.size.displaySm,
    fontWeight: typography.weight.bold
  },
  loginSub: {
    marginTop: spacing.md,
    color: colors.textSecondary,
    fontSize: typography.size.xl
  },
  loginText: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    fontSize: typography.size.md,
    lineHeight: typography.lineHeight.md,
    textAlign: "center"
  },
  loginPanel: {
    gap: spacing.md,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
    backgroundColor: colors.surfaceRaised
  },
  primaryRole: {
    borderRadius: 22,
    padding: spacing.xl,
    backgroundColor: colors.brand
  },
  primaryRoleTitle: {
    color: colors.textInverse,
    fontSize: typography.size.titleSm,
    fontWeight: typography.weight.black
  },
  primaryRoleText: {
    marginTop: spacing.sm,
    color: colors.overlayLight,
    fontSize: typography.size.sm,
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
    fontSize: typography.size.titleSm,
    fontWeight: typography.weight.black
  },
  secondaryRoleText: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: typography.size.sm,
    lineHeight: 19
  },
  prototypeHint: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    fontSize: typography.size.xs,
    lineHeight: 18,
    textAlign: "center"
  },
  authTitle: {
    color: colors.textPrimary,
    fontSize: typography.size.titleMd,
    fontWeight: typography.weight.black
  },
  authDesc: {
    color: colors.textSecondary,
    fontSize: typography.size.md,
    lineHeight: 20
  },
  authError: {
    color: colors.danger,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    lineHeight: 18
  },
  maskedPhoneBlock: {
    alignItems: "center",
    gap: spacing.xs,
    marginVertical: spacing.md
  },
  maskedPhone: {
    color: colors.textPrimary,
    fontSize: typography.size.displaySm,
    fontWeight: typography.weight.regular,
    letterSpacing: 0
  },
  maskedPhoneDesc: {
    color: colors.textMuted,
    fontSize: typography.size.sm,
    textAlign: "center"
  },
  wechatAuthButton: {
    minHeight: size.controlLg,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    borderRadius: radius.pill,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.surfaceRaised
  },
  pressedButton: {
    opacity: 0.86
  },
  wechatIcon: {
    fontSize: 22
  },
  wechatAuthText: {
    color: colors.textPrimary,
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold
  },
  wechatButton: {
    minHeight: 54,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.textPrimary
  },
  wechatButtonText: {
    color: colors.textInverse,
    fontSize: typography.size.lg,
    fontWeight: typography.weight.black
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
    fontSize: typography.size.lg,
    fontWeight: typography.weight.black
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
    color: colors.textInverse,
    fontSize: typography.size.sm,
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
    fontSize: typography.size.sm,
    lineHeight: 18
  },
  loginFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    marginTop: spacing.md
  },
  loginFooterText: {
    color: colors.textSecondary,
    fontSize: typography.size.md
  },
  loginFooterDivider: {
    color: colors.borderStrong,
    fontSize: typography.size.md
  },
  returnButton: {
    alignItems: "center",
    padding: spacing.sm
  },
  returnButtonText: {
    color: colors.textSecondary,
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold
  },
  skipLoginButton: {
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.pill,
    padding: spacing.md,
    backgroundColor: colors.surface
  },
  skipLoginText: {
    color: colors.textSecondary,
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold
  },
  skipLoginPrimaryButton: {
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.brand,
    borderRadius: radius.pill,
    padding: spacing.md,
    backgroundColor: colors.brandSurface
  },
  skipLoginPrimaryText: {
    color: colors.brand,
    fontSize: typography.size.lg,
    fontWeight: typography.weight.black
  },
  skipLoginPrimaryHint: {
    marginTop: spacing.xs,
    color: colors.textMuted,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold
  },
  container: {
    flexGrow: 1,
    gap: spacing.lg,
    maxWidth: size.mobileMaxWidth,
    width: "100%",
    alignSelf: "center",
    padding: spacing.lg,
    paddingBottom: size.bottomChrome,
    backgroundColor: colors.background
  },
  todayCard: {
    borderRadius: radius.xl,
    padding: 22,
    backgroundColor: colors.surface
  },
  kicker: {
    color: colors.textSecondary,
    fontSize: typography.size.sm,
    marginBottom: spacing.xs
  },
  todayTitle: {
    color: colors.textPrimary,
    fontSize: typography.size.displayMd,
    fontWeight: typography.weight.semibold,
    lineHeight: typography.lineHeight.titleLg
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
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold
  },
  unlockCount: {
    color: colors.success,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold
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
    backgroundColor: colors.surfaceRaised
  },
  backfillText: {
    color: colors.brand,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.black
  },
  plateCircle: {
    width: 104,
    height: 104,
    borderWidth: 10,
    borderColor: "rgba(232,93,38,.18)",
    borderRadius: 52,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceRaised
  },
  plateIcon: {
    fontSize: 42
  },
  recordText: {
    position: "absolute",
    bottom: spacing.lg,
    color: colors.textInverse,
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
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
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold
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
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.xs
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: typography.size.displayMd,
    fontWeight: typography.weight.semibold,
    lineHeight: typography.lineHeight.titleLg
  },
  statusPill: {
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.brand,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.black,
    backgroundColor: colors.surfaceRaised
  },
  donePill: {
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.success,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.black,
    backgroundColor: colors.surfaceRaised
  },
  cardDesc: {
    marginTop: spacing.md,
    color: colors.textSecondary,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.md,
    textAlign: "center"
  },
  eatingVisual: {
    height: 140,
    borderRadius: radius.xl,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: spacing.lg,
    backgroundColor: colors.surfaceRaised
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
    color: colors.textInverse,
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold
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
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold
  },
  mirrorCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    backgroundColor: colors.brand
  },
  mirrorText: {
    color: colors.textInverse,
    fontSize: typography.size.xl,
    lineHeight: 27,
    fontWeight: typography.weight.semibold
  },
})
