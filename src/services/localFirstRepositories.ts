import { decodeJson, encodeJson, getDatabase } from "../db/client"
import type { Analysis, DailyCheckin, Feedback, MealImage, MealRecord, Profile, WeightLog } from "../types/meal"
import type {
  AnalysisRepository,
  DailyCheckinRepository,
  FeedbackRepository,
  MealImageRepository,
  MealRepository,
  ProfileRepository,
  SaveDailyCheckinInput,
  SaveFeedbackInput,
  SaveMealImageInput,
  WeightRepository
} from "./repositoryTypes"
import { authService } from "./authService"
import { mockProfile, mockUserId, nowIso, makeMockId } from "./mockSeedData"
import { createMockMeal, attachFeedbackToMeal, createMockFeedback } from "./mockMealService"

type MealDbRow = {
  id: string
  user_id: string
  meal_type: MealRecord["mealType"]
  status: MealRecord["status"]
  source: MealRecord["source"]
  photo_uri: string | null
  dish: string | null
  cuisine: string | null
  province: string | null
  meal_started_at: string | null
  feedback_due_at: string | null
  completed_at: string | null
  daily_checkin_id: string | null
  created_at: string
  updated_at: string
}

type AnalysisDbRow = {
  id: string
  meal_id: string
  dish: string | null
  tags: string
  risk: string | null
  eating_advice: string
  analysis_meta: string
  source: Analysis["source"]
  created_at: string
}

type FeedbackDbRow = {
  id: string
  meal_id: string
  fullness: Feedback["fullness"]
  comfort: Feedback["comfort"]
  reactions: string
  submitted_at: string
  created_at: string
}

export const localProfileRepository: ProfileRepository = {
  async getCurrentProfile() {
    const db = await getDatabase()
    const userId = await authService.getSessionUserId()
    if (!userId) return undefined
    const row = await db.getFirstAsync<{
      user_id: string
      age_range: Profile["ageRange"] | null
      gender: Profile["gender"] | null
      height_cm: number | null
      weight_kg: number | null
      goal: Profile["goal"]
      budget_level: Profile["budgetLevel"] | null
      avoidances: string
      taste_preferences: string
      common_feelings: string
      created_at: string
      updated_at: string
    }>("SELECT * FROM profiles WHERE user_id = ? LIMIT 1", userId)
    if (!row) return undefined
    const height = row.height_cm ?? mockProfile.height
    const weight = row.weight_kg ?? mockProfile.weight
    return {
      ...mockProfile,
      id: row.user_id,
      ageRange: row.age_range ?? undefined,
      gender: row.gender ?? "unknown",
      heightCm: row.height_cm ?? undefined,
      weightKg: row.weight_kg ?? undefined,
      goal: row.goal,
      budgetLevel: row.budget_level ?? undefined,
      avoidances: decodeJson(row.avoidances, []),
      tastePreferences: decodeJson(row.taste_preferences, []),
      commonFeelings: decodeJson(row.common_feelings, []),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      height,
      weight,
      avoidFoods: decodeJson(row.avoidances, [])
    }
  },
  async saveProfile(profile) {
    const db = await getDatabase()
    const now = nowIso()
    const userId = profile.id || mockUserId
    const saved = { ...mockProfile, ...profile, id: userId, updatedAt: now }
    await db.runAsync(
      `INSERT INTO profiles (user_id, age_range, gender, height_cm, weight_kg, goal, budget_level, avoidances, taste_preferences, common_feelings, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
        age_range=excluded.age_range,
        gender=excluded.gender,
        height_cm=excluded.height_cm,
        weight_kg=excluded.weight_kg,
        goal=excluded.goal,
        budget_level=excluded.budget_level,
        avoidances=excluded.avoidances,
        taste_preferences=excluded.taste_preferences,
        common_feelings=excluded.common_feelings,
        updated_at=excluded.updated_at`,
      userId,
      saved.ageRange ?? null,
      saved.gender ?? "unknown",
      saved.heightCm ?? saved.height,
      saved.weightKg ?? saved.weight,
      saved.goal,
      saved.budgetLevel ?? null,
      encodeJson(saved.avoidances ?? saved.avoidFoods ?? []),
      encodeJson(saved.tastePreferences ?? []),
      encodeJson(saved.commonFeelings ?? []),
      saved.createdAt ?? now,
      now
    )
    return saved
  }
}

export const localMealRepository: MealRepository = {
  async createMeal(input) {
    const db = await getDatabase()
    const meal = createMockMeal({
      userId: input.userId || mockUserId,
      mealType: input.mealType,
      source: input.source,
      photoUri: input.photoUri ?? input.photoPath,
      mealCategory: input.mealCategory,
      cuisine: input.cuisine,
      province: input.province,
      drawCardId: input.drawCardId
    })
    const saved = input.id ? { ...meal, id: input.id } : meal
    await db.runAsync(
      `INSERT OR REPLACE INTO meals (id, user_id, ts, meal_type, status, dish, cuisine, province, source, photo_uri, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      saved.id,
      saved.userId ?? mockUserId,
      new Date(saved.createdAt).getTime(),
      saved.mealType,
      saved.status,
      saved.mealCategory ?? null,
      saved.cuisine ?? null,
      saved.province ?? null,
      saved.source,
      saved.photoUri ?? null,
      saved.createdAt,
      saved.updatedAt
    )
    await enqueue("meal", saved.id, "upsert", saved)
    return saved
  },
  async updateMealStatus(mealId, status) {
    const db = await getDatabase()
    const updatedAt = nowIso()
    const userId = await authService.getSessionUserId()
    if (!userId) return
    await db.runAsync("UPDATE meals SET status = ?, updated_at = ?, sync_status = 'pending' WHERE id = ? AND user_id = ?", status, updatedAt, mealId, userId)
    await enqueue("meal", mealId, "status", { status, updatedAt })
  },
  async updateMeal(meal) {
    const db = await getDatabase()
    const userId = await authService.getSessionUserId()
    if (!userId) return meal
    await db.runAsync(
      `UPDATE meals SET status=?, dish=?, cuisine=?, province=?, photo_uri=?, meal_started_at=?, feedback_due_at=?, completed_at=?, daily_checkin_id=?, updated_at=?, sync_status='pending' WHERE id=? AND user_id=?`,
      meal.status,
      meal.mealCategory ?? meal.analysis?.dishName ?? null,
      meal.cuisine ?? meal.analysis?.cuisine ?? null,
      meal.province ?? meal.analysis?.province ?? null,
      meal.photoUri ?? null,
      meal.mealStartedAt ?? null,
      meal.feedbackDueAt ?? null,
      meal.completedAt ?? null,
      null,
      meal.updatedAt,
      meal.id,
      userId
    )
    await enqueue("meal", meal.id, "upsert", meal)
    return meal
  },
  async listMeals(userIdInput?: string) {
    const db = await getDatabase()
    const userId = userIdInput ?? (await authService.getSessionUserId())
    if (!userId) return []
    const rows = await db.getAllAsync<MealDbRow>("SELECT * FROM meals WHERE user_id = ? ORDER BY created_at DESC", userId)
    const analyses = await localAnalysisRepository.listAnalyses(userId)
    const feedbacks = await localFeedbackRepository.listFeedbacks(userId)
    return rows.map((row) => {
      const analysis = analyses.find((item) => item.mealId === row.id)
      const feedback = feedbacks.find((item) => item.mealId === row.id)
      const base = mealFromDbRow(row, analysis, feedback)
      return feedback ? attachFeedbackToMeal({ ...base, feedback }, feedback.id) : base
    })
  },
  async getMeal(mealId) {
    const db = await getDatabase()
    const userId = await authService.getSessionUserId()
    if (!userId) return undefined
    const row = await db.getFirstAsync<MealDbRow>("SELECT * FROM meals WHERE id = ? AND user_id = ?", mealId, userId)
    if (!row) return undefined
    const analysis = await localAnalysisRepository.getAnalysisByMeal(mealId)
    const feedbacks = await localFeedbackRepository.listFeedbacks(row.user_id)
    return mealFromDbRow(row, analysis, feedbacks.find((item) => item.mealId === mealId))
  }
}

export const localAnalysisRepository: AnalysisRepository = {
  async saveAnalysis(input) {
    const db = await getDatabase()
    await db.runAsync(
      `INSERT OR REPLACE INTO meal_analysis (meal_id, id, dish, tags, risk, eating_advice, analysis_meta, source, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      input.mealId,
      input.id,
      input.dishName,
      encodeJson(input.riskHints),
      input.riskHints[0] ?? null,
      encodeJson(input.eatingAdvice),
      encodeJson({
        structureSummary: input.structureSummary,
        stapleLevel: input.stapleLevel,
        proteinLevel: input.proteinLevel,
        vegetableFiberLevel: input.vegetableFiberLevel,
        oilLevel: input.oilLevel,
        portionLevel: input.portionLevel,
        feedbackFocus: input.feedbackFocus,
        confidence: input.confidence,
        cuisine: input.cuisine,
        province: input.province,
        imageQualityNote: input.imageQualityNote
      }),
      input.source,
      input.createdAt
    )
    const userId = await authService.getSessionUserId()
    if (userId) {
      await db.runAsync(
        "UPDATE meals SET status='analyzed', dish=?, cuisine=?, province=?, updated_at=?, sync_status='pending' WHERE id=? AND user_id=?",
        input.dishName,
        input.cuisine ?? null,
        input.province ?? null,
        nowIso(),
        input.mealId,
        userId
      )
    }
    await enqueue("meal_analysis", input.mealId, "upsert", input)
    return input
  },
  async saveCorrection(input) {
    const db = await getDatabase()
    const correction = { ...input, id: input.id || makeMockId("correction"), correctedAt: input.correctedAt || nowIso() }
    await db.runAsync(
      `INSERT OR REPLACE INTO meal_corrections (id, meal_id, field, ai_value, user_value, corrected_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      correction.id,
      input.mealId,
      correction.field,
      correction.aiValue,
      correction.userValue,
      correction.correctedAt
    )
    await enqueue("meal_correction", correction.id, "upsert", correction)
    return correction
  },
  async listAnalyses(userIdInput?: string) {
    const db = await getDatabase()
    const userId = userIdInput ?? (await authService.getSessionUserId())
    if (!userId) return []
    const rows = await db.getAllAsync<AnalysisDbRow>(
      `SELECT meal_analysis.*
       FROM meal_analysis
       JOIN meals ON meals.id = meal_analysis.meal_id
       WHERE meals.user_id = ?
       ORDER BY meal_analysis.created_at DESC`,
      userId
    )
    return rows.map(analysisFromDbRow)
  },
  async getAnalysisByMeal(mealId) {
    const db = await getDatabase()
    const userId = await authService.getSessionUserId()
    if (!userId) return undefined
    const row = await db.getFirstAsync<AnalysisDbRow>(
      `SELECT meal_analysis.*
       FROM meal_analysis
       JOIN meals ON meals.id = meal_analysis.meal_id
       WHERE meal_analysis.meal_id = ? AND meals.user_id = ?`,
      mealId,
      userId
    )
    return row ? analysisFromDbRow(row) : undefined
  }
}

export const localFeedbackRepository: FeedbackRepository = {
  async saveFeedback(input: SaveFeedbackInput) {
    const db = await getDatabase()
    const feedback = createMockFeedback(input.mealId, {
      fullness: input.fullness,
      comfortTags: input.comfortTags ?? [input.comfort === "uncomfortable" ? "comfortable" : input.comfort],
      tasteFeedback: input.tasteFeedback ?? ["normal"],
      priceSatisfaction: input.priceSatisfaction,
      note: input.note
    })
    await db.runAsync(
      `INSERT OR REPLACE INTO meal_feedback (meal_id, id, fullness, comfort, reactions, submitted_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      feedback.mealId,
      feedback.id,
      feedback.fullness,
      feedback.comfort,
      encodeJson({
        sleepiness: feedback.sleepiness,
        bloating: feedback.bloating,
        energy: feedback.energy,
        priceSatisfaction: feedback.priceSatisfaction,
        comfortTags: feedback.comfortTags,
        tasteFeedback: feedback.tasteFeedback,
        note: feedback.note
      }),
      feedback.submittedAt,
      feedback.createdAt
    )
    const userId = await authService.getSessionUserId()
    if (userId) {
      await db.runAsync(
        "UPDATE meals SET status='feedback_completed', completed_at=?, updated_at=?, sync_status='pending' WHERE id=? AND user_id=?",
        feedback.submittedAt,
        feedback.submittedAt,
        input.mealId,
        userId
      )
    }
    await enqueue("meal_feedback", input.mealId, "upsert", feedback)
    return feedback
  },
  async listFeedbacks(userIdInput?: string) {
    const db = await getDatabase()
    const userId = userIdInput ?? (await authService.getSessionUserId())
    if (!userId) return []
    const rows = await db.getAllAsync<FeedbackDbRow>(
      `SELECT meal_feedback.*
       FROM meal_feedback
       JOIN meals ON meals.id = meal_feedback.meal_id
       WHERE meals.user_id = ?
       ORDER BY meal_feedback.submitted_at DESC`,
      userId
    )
    return rows.map(feedbackFromDbRow)
  }
}

export const localDailyCheckinRepository: DailyCheckinRepository = {
  async saveDailyCheckin(input: SaveDailyCheckinInput) {
    const db = await getDatabase()
    const now = nowIso()
    const checkin: DailyCheckin = {
      id: makeMockId("checkin"),
      userId: input.userId,
      date: input.date,
      mealIds: input.mealIds,
      dueAt: now,
      isNextDay: input.isNextDay ?? false,
      energy: input.energy,
      digestion: input.digestion,
      satiety: input.satiety,
      answeredAt: now,
      dismissed: false,
      createdAt: now,
      updatedAt: now
    }
    await db.runAsync(
      `INSERT INTO daily_checkins (id, user_id, date, meal_ids, due_at, is_next_day, energy, digestion, satiety, answered_at, dismissed, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, date) DO UPDATE SET
        meal_ids=excluded.meal_ids,
        energy=excluded.energy,
        digestion=excluded.digestion,
        satiety=excluded.satiety,
        answered_at=excluded.answered_at,
        dismissed=excluded.dismissed,
        updated_at=excluded.updated_at`,
      checkin.id,
      checkin.userId,
      checkin.date,
      encodeJson(checkin.mealIds),
      checkin.dueAt,
      checkin.isNextDay ? 1 : 0,
      checkin.energy ?? null,
      checkin.digestion ?? null,
      checkin.satiety ?? null,
      checkin.answeredAt ?? null,
      checkin.dismissed ? 1 : 0,
      checkin.createdAt,
      checkin.updatedAt
    )
    await enqueue("daily_checkin", checkin.id, "upsert", checkin)
    return checkin
  },
  async listDailyCheckins(userIdInput?: string) {
    const db = await getDatabase()
    const userId = userIdInput ?? (await authService.getSessionUserId())
    if (!userId) return []
    const rows = await db.getAllAsync<DailyCheckinRow>("SELECT * FROM daily_checkins WHERE user_id = ? ORDER BY date DESC", userId)
    return rows.map(checkinFromRow)
  },
  async getDailyCheckin(date, userIdInput?: string) {
    const db = await getDatabase()
    const userId = userIdInput ?? (await authService.getSessionUserId())
    if (!userId) return undefined
    const row = await db.getFirstAsync<DailyCheckinRow>("SELECT * FROM daily_checkins WHERE user_id = ? AND date = ?", userId, date)
    return row ? checkinFromRow(row) : undefined
  }
}

export const localWeightRepository: WeightRepository = {
  async saveWeightLog(input) {
    const db = await getDatabase()
    const log: WeightLog = { id: makeMockId("weight"), userId: input.userId, valueKg: input.valueKg, recordedAt: input.recordedAt ?? nowIso() }
    await db.runAsync("INSERT OR REPLACE INTO weight_logs (id, user_id, value_kg, recorded_at) VALUES (?, ?, ?, ?)", log.id, log.userId, log.valueKg, log.recordedAt)
    await enqueue("weight_log", log.id, "upsert", log)
    return log
  },
  async listWeightLogs(userIdInput?: string) {
    const db = await getDatabase()
    const userId = userIdInput ?? (await authService.getSessionUserId())
    if (!userId) return []
    return db.getAllAsync<WeightLog>("SELECT id, user_id as userId, value_kg as valueKg, recorded_at as recordedAt FROM weight_logs WHERE user_id = ? ORDER BY recorded_at DESC", userId)
  }
}

export const localMealImageRepository: MealImageRepository = {
  async saveMealImage(input: SaveMealImageInput) {
    const db = await getDatabase()
    const image: MealImage = { id: makeMockId("image"), mealId: input.mealId, imageType: input.imageType, localUri: input.localUri, storageUrl: input.storageUrl, createdAt: nowIso() }
    await db.runAsync(
      "INSERT OR REPLACE INTO meal_images (id, meal_id, image_type, local_uri, storage_url, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      image.id,
      image.mealId,
      image.imageType,
      image.localUri ?? null,
      image.storageUrl ?? null,
      image.createdAt
    )
    await enqueue("meal_image", image.id, "upsert", image)
    return image
  },
  async listMealImages(mealId) {
    const db = await getDatabase()
    const userId = await authService.getSessionUserId()
    if (!userId) return []
    const rows = await db.getAllAsync<{ id: string; meal_id: string; image_type: MealImage["imageType"]; local_uri: string | null; storage_url: string | null; created_at: string }>(
      `SELECT meal_images.*
       FROM meal_images
       JOIN meals ON meals.id = meal_images.meal_id
       WHERE meal_images.meal_id = ? AND meals.user_id = ?
       ORDER BY meal_images.created_at ASC`,
      mealId,
      userId
    )
    return rows.map((row) => ({ id: row.id, mealId: row.meal_id, imageType: row.image_type, localUri: row.local_uri ?? undefined, storageUrl: row.storage_url ?? undefined, createdAt: row.created_at }))
  }
}

type DailyCheckinRow = {
  id: string
  user_id: string
  date: string
  meal_ids: string
  due_at: string
  is_next_day: number
  energy: DailyCheckin["energy"] | null
  digestion: DailyCheckin["digestion"] | null
  satiety: DailyCheckin["satiety"] | null
  answered_at: string | null
  dismissed: number
  created_at: string
  updated_at: string
}

function mealFromDbRow(row: MealDbRow, analysis?: Analysis, feedback?: Feedback): MealRecord {
  return {
    id: row.id,
    userId: row.user_id,
    mealType: row.meal_type,
    status: row.status,
    photoUri: row.photo_uri ?? undefined,
    source: row.source,
    cuisine: row.cuisine ?? analysis?.cuisine,
    province: row.province ?? analysis?.province,
    createdAt: row.created_at,
    photoTakenAt: row.photo_uri ? row.created_at : undefined,
    mealStartedAt: row.meal_started_at ?? undefined,
    feedbackDueAt: row.feedback_due_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
    updatedAt: row.updated_at,
    analysis,
    analysisId: analysis?.id,
    corrections: [],
    feedback,
    feedbackId: feedback?.id,
    mealTime: row.created_at,
    imageId: row.photo_uri ?? undefined,
    mealCategory: row.dish ?? analysis?.dishName ?? "这一餐"
  }
}

function analysisFromDbRow(row: AnalysisDbRow): Analysis {
  const meta = decodeJson<{
    structureSummary?: string
    stapleLevel?: Analysis["stapleLevel"]
    proteinLevel?: Analysis["proteinLevel"]
    vegetableFiberLevel?: Analysis["vegetableFiberLevel"]
    oilLevel?: Analysis["oilLevel"]
    portionLevel?: Analysis["portionLevel"]
    feedbackFocus?: string[]
    confidence?: Analysis["confidence"]
    cuisine?: string
    province?: string
    imageQualityNote?: string
  }>(row.analysis_meta, {})
  const oilLevel = meta.oilLevel ?? "unknown"
  return {
    id: row.id,
    mealId: row.meal_id,
    dishName: row.dish ?? "这一餐",
    cuisine: meta.cuisine,
    province: meta.province,
    structureSummary: meta.structureSummary ?? "已保存本餐分析。",
    stapleLevel: meta.stapleLevel ?? "unknown",
    proteinLevel: meta.proteinLevel ?? "unknown",
    vegetableFiberLevel: meta.vegetableFiberLevel ?? "unknown",
    oilLevel,
    portionLevel: meta.portionLevel ?? "unknown",
    riskHints: decodeJson(row.tags, []),
    eatingAdvice: decodeJson(row.eating_advice, []),
    feedbackFocus: meta.feedbackFocus ?? [],
    confidence: meta.confidence ?? "low",
    source: row.source,
    createdAt: row.created_at,
    oilBurdenLevel: oilLevel === "heavy" ? "high" : oilLevel === "light" ? "low" : "medium",
    lightSuggestions: decodeJson(row.eating_advice, []),
    imageQualityNote: meta.imageQualityNote
  }
}

function feedbackFromDbRow(row: FeedbackDbRow): Feedback {
  const reactions = decodeJson<Partial<Feedback>>(row.reactions, {})
  const comfortTags = reactions.comfortTags ?? [row.comfort === "uncomfortable" ? "comfortable" : row.comfort]
  return {
    id: row.id,
    mealId: row.meal_id,
    fullness: row.fullness,
    comfort: row.comfort,
    sleepiness: reactions.sleepiness,
    bloating: reactions.bloating,
    energy: reactions.energy,
    priceSatisfaction: reactions.priceSatisfaction,
    note: reactions.note,
    submittedAt: row.submitted_at,
    comfortTags,
    tasteFeedback: reactions.tasteFeedback ?? [],
    timingStatus: "on_time",
    createdAt: row.created_at
  }
}

function checkinFromRow(row: DailyCheckinRow): DailyCheckin {
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    mealIds: decodeJson(row.meal_ids, []),
    dueAt: row.due_at,
    isNextDay: row.is_next_day === 1,
    energy: row.energy ?? undefined,
    digestion: row.digestion ?? undefined,
    satiety: row.satiety ?? undefined,
    answeredAt: row.answered_at ?? undefined,
    dismissed: row.dismissed === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

async function enqueue(entityType: string, entityId: string, operation: string, payload: unknown) {
  const db = await getDatabase()
  const now = nowIso()
  await db.runAsync(
    "INSERT OR REPLACE INTO sync_queue (id, entity_type, entity_id, operation, payload, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    `${entityType}-${entityId}-${operation}`,
    entityType,
    entityId,
    operation,
    encodeJson(payload),
    now,
    now
  )
}
