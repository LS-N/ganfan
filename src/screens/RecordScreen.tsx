import React, { useEffect, useRef, useState } from "react"
import { router, useLocalSearchParams } from "expo-router"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { CameraView, useCameraPermissions } from "expo-camera"
import { PrimaryButton } from "../components"
import { prepareMealImage } from "../services/imageService"
import { useBodyPuzzleStore } from "../stores/bodyPuzzleStore"
import { colors, radius, spacing } from "../styles/tokens"
import type { MealType } from "../types/meal"

const mealTypes: Array<{ label: string; value: MealType }> = [
  { label: "早饭", value: "breakfast" },
  { label: "午饭", value: "lunch" },
  { label: "晚饭", value: "dinner" },
  { label: "加餐", value: "snack" }
]

export function RecordScreen() {
  const params = useLocalSearchParams<{ mode?: string }>()
  const createMockMeal = useBodyPuzzleStore((state) => state.createMockMeal)
  const startActiveMeal = useBodyPuzzleStore((state) => state.startActiveMeal)
  const cameraRef = useRef<CameraView>(null)
  const [permission, requestPermission] = useCameraPermissions()
  const [captureMode, setCaptureMode] = useState<"camera" | "gallery">("camera")
  const [mealType, setMealType] = useState<MealType>("lunch")
  const [recordMode, setRecordMode] = useState<"mode" | "shoot" | "selected">(params.mode === "shoot" ? "shoot" : "mode")
  const [photoUri, setPhotoUri] = useState<string>()

  useEffect(() => {
    if (params.mode === "shoot") {
      setRecordMode("shoot")
    }
  }, [params.mode])

  function submit(uri = photoUri) {
    createMockMeal(mealType, uri ? "photo" : "backfill", uri)
    router.push("/analysis")
  }

  function submitWithMode(mode: "low" | "failed") {
    createMockMeal(mode === "low" ? "snack" : mealType)
    router.push(`/analysis?mock=${mode}`)
  }

  async function capturePhoto() {
    if (!permission?.granted) {
      await requestPermission()
      return
    }
    const photo = await cameraRef.current?.takePictureAsync({ quality: 0.8 })
    if (!photo?.uri) return
    const preparedUri = await prepareMealImage(photo.uri)
    setPhotoUri(preparedUri)
    setRecordMode("selected")
  }

  function startBackfill() {
    createMockMeal(mealType, "backfill")
    startActiveMeal()
    router.push("/feedback")
  }

  if (recordMode === "mode") {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.modeHeader}>
          <Text style={styles.modeKicker}>记录这一餐</Text>
          <Text style={styles.modeTitle}>你现在是哪种情况？</Text>
          <Text style={styles.modeSub}>先选入口，路径会更短。</Text>
        </View>
        <View style={styles.modeList}>
          <RecordModeCard index="A" title="我已经有饭了" desc="直接拍照分析这顿饭，吃完再反馈。" action="拍照分析" onPress={() => setRecordMode("shoot")} />
          <RecordModeCard index="B" title="我不知道吃什么" desc="先根据你的状态和历史记录抽一张餐前建议卡。" action="饭前抽卡" onPress={() => router.push("/draw-card")} />
          <RecordModeCard index="C" title="我吃完了补记" desc="跳过餐前分析，先补饭后感受，稍后再完善这餐。" action="饭后反馈" onPress={startBackfill} />
        </View>
      </ScrollView>
    )
  }

  if (recordMode === "selected") {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View>
          <Text style={styles.centerLabel}>这是</Text>
          <View style={styles.mealTypeRow}>
            {mealTypes.map((item) => (
              <Pressable key={item.value} onPress={() => setMealType(item.value)} style={[styles.mealTypeButton, mealType === item.value && styles.mealTypeSelected]}>
                <Text style={[styles.mealTypeText, mealType === item.value && styles.mealTypeTextSelected]}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <View style={styles.previewBox}>
          <Text style={styles.previewIcon}>🍱</Text>
          <Text style={styles.previewTitle}>{photoUri ? "已保存餐食照片" : "无照片记录"}</Text>
          <Pressable style={styles.retakePill} onPress={() => setRecordMode("shoot")}>
            <Text style={styles.retakeText}>重拍/重选</Text>
          </Pressable>
        </View>
        <PrimaryButton title="开始分析" onPress={() => submit()} />
        <View style={styles.demoActions}>
          <Pressable style={styles.demoButton} onPress={() => submitWithMode("low")}>
            <Text style={styles.demoButtonText}>模拟低置信度</Text>
          </Pressable>
          <Pressable style={styles.demoButton} onPress={() => submitWithMode("failed")}>
            <Text style={styles.demoButtonText}>模拟失败</Text>
          </Pressable>
        </View>
      </ScrollView>
    )
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.cameraPanel}>
        <View style={styles.modeSwitch}>
          <Pressable style={[styles.modeButton, captureMode === "camera" && styles.modeButtonActive]} onPress={() => setCaptureMode("camera")}>
            <Text style={[styles.modeText, captureMode === "camera" && styles.modeTextActive]}>拍照</Text>
          </Pressable>
          <Pressable style={[styles.modeButton, captureMode === "gallery" && styles.modeButtonActive]} onPress={() => setCaptureMode("gallery")}>
            <Text style={[styles.modeText, captureMode === "gallery" && styles.modeTextActive]}>图片</Text>
          </Pressable>
        </View>

        <View style={styles.captureCopy}>
          <Text style={styles.captureTitle}>拍图记录</Text>
          <Text style={styles.captureSub}>{captureMode === "camera" ? "打开摄像头拍这一餐" : "从相册选择餐食图片"}</Text>
        </View>

        {captureMode === "camera" && permission?.granted ? (
          <CameraView ref={cameraRef} style={styles.cameraPreview} facing="back" />
        ) : (
          <Pressable style={styles.lensBox} onPress={permission?.granted ? () => setRecordMode("selected") : requestPermission}>
            <View style={styles.lensCircle}>
              <Text style={styles.lensIcon}>{permission?.granted ? "🍽️" : "📷"}</Text>
            </View>
            {!permission?.granted && <Text style={styles.permissionText}>授权相机后拍照记录</Text>}
          </Pressable>
        )}

        <View style={styles.shutterRow}>
          <View />
          <Pressable style={styles.shutter} onPress={capturePhoto} />
          <Text style={styles.galleryIcon}>▧</Text>
        </View>
        <Text style={styles.captureHint}>{captureMode === "camera" ? "拍食物" : "选择后会立即开始分析"}</Text>
      </View>

      <PrimaryButton title="没有照片，先手动记录 →" onPress={() => submit()} />
    </ScrollView>
  )
}

function RecordModeCard({ index, title, desc, action, onPress }: { index: string; title: string; desc: string; action: string; onPress: () => void }) {
  return (
    <Pressable style={styles.modeCard} onPress={onPress}>
      <View style={styles.modeIndex}>
        <Text style={styles.modeIndexText}>{index}</Text>
      </View>
      <View style={styles.modeBody}>
        <Text style={styles.modeCardTitle}>{title}</Text>
        <Text style={styles.modeCardDesc}>{desc}</Text>
        <Text style={styles.modeAction}>{action} →</Text>
      </View>
    </Pressable>
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
  modeHeader: {
    marginBottom: spacing.xs
  },
  modeKicker: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: spacing.xs
  },
  modeTitle: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 35
  },
  modeSub: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22
  },
  modeList: {
    gap: spacing.md
  },
  modeCard: {
    flexDirection: "row",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    backgroundColor: colors.surface
  },
  modeIndex: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.brandSurface
  },
  modeIndexText: {
    color: colors.brand,
    fontSize: 13,
    fontWeight: "800"
  },
  modeBody: {
    flex: 1
  },
  modeCardTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: "800",
    marginBottom: spacing.xs
  },
  modeCardDesc: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20
  },
  modeAction: {
    marginTop: spacing.md,
    color: colors.brand,
    fontSize: 13,
    fontWeight: "700"
  },
  cameraPanel: {
    minHeight: 540,
    borderRadius: 28,
    justifyContent: "space-between",
    padding: 24,
    overflow: "hidden",
    backgroundColor: "#000000"
  },
  modeSwitch: {
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: spacing.xs,
    borderRadius: radius.pill,
    padding: spacing.xs,
    backgroundColor: "rgba(255,255,255,.14)"
  },
  modeButton: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  modeButtonActive: {
    backgroundColor: "#FFFFFF"
  },
  modeText: {
    color: "rgba(255,255,255,.72)",
    fontSize: 11,
    fontWeight: "900"
  },
  modeTextActive: {
    color: "#111111"
  },
  captureCopy: {
    alignItems: "center",
    marginTop: spacing.lg
  },
  captureTitle: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "900",
    marginBottom: spacing.xl
  },
  captureSub: {
    color: "rgba(255,255,255,.82)",
    fontSize: 18,
    lineHeight: 27,
    textAlign: "center"
  },
  lensBox: {
    height: 280,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#151515"
  },
  cameraPreview: {
    height: 280,
    borderRadius: 34,
    overflow: "hidden"
  },
  lensCircle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,.08)"
  },
  lensIcon: {
    fontSize: 48
  },
  permissionText: {
    marginTop: spacing.md,
    color: "rgba(255,255,255,.72)",
    fontSize: 13,
    fontWeight: "700"
  },
  shutterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  shutter: {
    width: 78,
    height: 78,
    borderWidth: 7,
    borderColor: "rgba(255,255,255,.18)",
    borderRadius: 39,
    backgroundColor: "#FFFFFF"
  },
  galleryIcon: {
    color: "#FFFFFF",
    fontSize: 34
  },
  captureHint: {
    color: "rgba(255,255,255,.72)",
    fontSize: 14,
    textAlign: "center"
  },
  centerLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: spacing.sm,
    textAlign: "center"
  },
  mealTypeRow: {
    flexDirection: "row",
    gap: spacing.sm
  },
  mealTypeButton: {
    flex: 1,
    minHeight: 42,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface
  },
  mealTypeSelected: {
    borderColor: colors.brand,
    backgroundColor: colors.brandSurface
  },
  mealTypeText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "800"
  },
  mealTypeTextSelected: {
    color: colors.brand
  },
  previewBox: {
    minHeight: 320,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.brandSurface
  },
  previewIcon: {
    fontSize: 52
  },
  previewTitle: {
    marginTop: spacing.md,
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "700"
  },
  retakePill: {
    position: "absolute",
    left: spacing.md,
    bottom: spacing.md,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: "rgba(255,255,255,.92)"
  },
  retakeText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "900"
  },
  demoActions: {
    flexDirection: "row",
    gap: spacing.sm
  },
  demoButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.pill,
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: colors.surface
  },
  demoButtonText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "800"
  }
})
