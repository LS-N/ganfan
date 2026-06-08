# 干饭 · 类型架构

> 管：TypeScript 类型契约（枚举/接口/联合）+ Zustand Store 接口 + 类型同步规则。不管：API 接口契约（→ api-architecture.md）、Schema 物理实现（→ data-architecture.md）。
> **唯一类型源**：所有模块从 src/types/ 统一导入，禁止各自定义同名类型。

---

## 一、定位与边界

本文档是干饭项目 TypeScript 类型系统的权威参考。类型文件（`src/types/index.ts`）作为数据库 Schema 与业务代码之间的**中间合约层**，任何对数据结构的修改必须先经过此层。

- **本文档管辖**：枚举类型、接口定义、联合类型、Zustand Store 接口、类型同步规则
- **不管辖**：API 路由契约（见 api-architecture.md）、Supabase 物理表结构（见 data-architecture.md）

---

## 二、核心原则

1. **类型即合约**——类型文件是数据库 Schema 与业务代码的中间合约层
2. **蓝图 Phase 升级必须先对齐 src/types/ 再改业务代码**（响应 LESSON-0003）
3. **类型 ↔ Schema 同构**——TypeScript 字段名与数据库列名（camelCase vs snake_case）必须可双向映射
4. **禁止用 any 绕过类型检查**
5. **unknown 收窄必须显式 as**（响应 LESSON-0004）：从 `Record<string, unknown>` 赋值字面量联合时必须加 `as Target["field"]`

---

## 三、架构内容

### 3.1 枚举类型

```typescript
// ── 枚举 ──────────────────────────────────────────────
export type MealType = '早饭' | '午饭' | '晚饭' | '加餐'
export type MealMood = '心情不错' | '平静' | '压力有点大' | '有点焦虑' | '疲惫'
export type Fullness  = '撑' | '刚好' | '还饿'
export type Comfort   = '舒服' | '胀气' | '困倦'           // 与原型 QUESTION_SCHEMA 对齐（2026-05-29 修订：删除「有精神」）
export type Satisfaction = '还不错' | '一般' | '有点后悔'  // 与原型 QUESTION_SCHEMA 对齐（2026-05-29 修订：删除「很开心」）
export type ActualIntake = '全吃完' | '吃了3/4' | '吃了一半' | '剩很多'
export type HomeScene = 'DEFAULT' | 'PENDING_FB' | 'DONE'
export type ImageType = 'wide' | 'close' | 'leftover'
export type PlanExecStatus = 'eaten' | 'swapped' | 'skipped'
```

### 3.2 核心数据类型

```typescript
// ── 营养 ─────────────────────────────────────────────
export interface Nutrition {
  calories: number
  protein:  number   // g
  carbs:    number   // g
  fat:      number   // g
}

// ── 用户 ─────────────────────────────────────────────
export interface Profile {
  userId:       string
  goal:         string
  avoid:        string | null
  dailyBudget:  number | null      // 元/天整数，Q3 映射值：50/90/160/250
  feeling:      string | null      // Onboarding Q4
  eatingStyle:  string | null      // Onboarding Q5，后台静默，档案页不展示
  updatedAt:    string
  // @deprecated 以下字段保留兼容旧数据，新建档不写入
  age?:              number | null
  gender?:           string | null
  heightCm?:         number | null
  healthBackground?: string[]
  reminderDelayMin?: number        // 推送延迟已固定 20 分钟，不读取
}

export interface WeightLog {
  id:         string
  userId:     string
  valueKg:    number
  recordedAt: string
}

// ── 餐次 ─────────────────────────────────────────────
export interface Meal {
  id:             string
  userId:         string
  ts:             number           // epoch ms
  mealType:       MealType
  dish:           string | null
  cuisine:        string | null
  province:       string | null
  mood:           MealMood | null
  mealStartedAt:  number | null
  mealDurationMs: number | null
  fromCard:       { dish: string; badge: string; reason: string } | null
  additionals:    Array<{ name: string; estimate: string }>
  dailyCheckinId: string | null
  autoClosedAt:   string | null
  createdAt:      string
}

export interface MealAnalysis {
  mealId:          string
  dish:            string
  nutrition:       Nutrition
  tags:            string[]
  risk:            string | null
  recognizedFoods: Array<{ name: string; weight: string }>
  eatingAdvice:    Array<{ tip: string; type: 'positive' | 'caution' }>
  analysisMeta:    { source: string; phase: string; model: string; latencyMs: number; promptVersion: string }
}

export interface MealCorrection {
  id:          string
  mealId:      string
  field:       string
  aiValue:     string | null
  userValue:   string
  correctedAt: string
}

export interface MealFeedback {
  mealId:       string
  actualIntake: ActualIntake
  intakeRatio:  number        // 0-1
  fullness:     Fullness
  comfort:      Comfort
  satisfaction: Satisfaction
  reactions:    string[]
  submittedAt:  string
}

export interface MealImage {
  id:         string
  mealId:     string
  imageType:  ImageType
  storageUrl: string
  createdAt:  string
}

// ── 回访 ─────────────────────────────────────────────
export interface DailyCheckin {
  id:         string
  userId:     string
  date:       string           // YYYY-MM-DD
  mealIds:    string[]
  dueAt:      number           // epoch ms
  isNextDay:  boolean
  energy:     '精力充沛' | '还好' | '疲惫犯困' | null
  digestion:  '舒适顺畅' | '有点不适' | '明显不舒服' | null
  satiety:    '很耐饿' | '有点饿' | '饿得很快' | null
  answeredAt: string | null
  dismissed:  boolean
}
```

### 3.3 饭前抽卡相关类型

```typescript
// ── 饭前抽卡 ─────────────────────────────────────────
export type RecommendationStage =
  | 'general'         // 通用：无反馈数据，基于状态 fallback
  | 'feedback'        // 反馈：≥3 条有效反馈，过滤+加权历史
  | 'body_puzzle'     // 身体拼图：≥7 条反馈，关联身体感受
  | 'body_structure'  // 身体结构：已授权健康数据（4.0+）
  | 'fulfillment'     // 计划履约：餐饮计划执行率可追踪（5.0+）
  | 'food_memory'     // 食材记忆：订单/剩余量可推断（6.0+）

export type CardSlot = 'stable' | 'alt' | 'explore'
export type CardSlotLabel = '常规款' | '特别款' | '隐藏款'
export type PreMealState =
  | '压力有点大' | '心情不错' | '很累很困'
  | '想吃点好的' | '想吃点清淡' | '随便都行'

export interface DrawCard {
  id?:                    string
  slot:                   CardSlot
  slotLabel:              CardSlotLabel
  slotSublabel:           string            // '今天最稳的选择' 等
  emoji?:                 string            // 槽位装饰 emoji：'⭐'(stable) | '✨'(alt) | '🎲'(explore)
  dish:                   string
  type:                   'repeat' | 'safe' | 'explore'
  badge:                  string
  tags:                   string[]
  risk:                   'low' | 'medium' | 'high'
  reason:                 string
  advice:                 string
  recommendationStage:    RecommendationStage
  recommendationStageLabel?: string         // 翻牌后由 openCardSheet 注入
  recommendationReason?:  string            // 翻牌后由 openCardSheet 注入（=reason）
  recommendationSources?: string            // 翻牌后由 openCardSheet 注入
  unlockRequirement?:     string            // 翻牌后由 openCardSheet 注入
  confidenceLevel?:       string            // 翻牌后由 openCardSheet 注入（中文描述）
  accepted?:              boolean
  decidedAt?:             string
  description?:           string
}

export interface CardAction {
  id:                        string
  userId:                    string
  dish:                      string
  badge:                     string | null
  risk:                      string | null
  slot:                      CardSlot
  slotLabel:                 CardSlotLabel
  cardState:                 PreMealState | null  // 用户选择的餐前状态
  recommendationStage:       RecommendationStage
  recommendationStageLabel:  string              // 阶段显示名，如'身体拼图推荐'
  recommendationReason:      string              // 推荐理由文案
  recommendationSources:     string              // 数据来源描述
  unlockRequirement:         string              // 解锁条件描述
  confidenceLevel:           '低' | '低到中' | '中' | '中到高' | '高'
  source:                    'card_draw' | 'homepage'
  action:                    'accepted' | 'skipped'
  // 注意：翻牌行为（'seen'）仅存于前端 cardStates 本地状态，不持久化到 card_actions
  ts:                        number
}
```

### 3.4 聚合视图类型

```typescript
// ── 完整餐次（聚合视图，供 UI 层使用）────────────────
export interface MealFull extends Meal {
  analysis:    MealAnalysis | null
  feedback:    MealFeedback | null
  images:      MealImage[]
  corrections: MealCorrection[]
  checkin:     DailyCheckin | null
}
```

### 3.5 2.0 计划类型

```typescript
// ── 2.0 计划 ─────────────────────────────────────────
export interface MealPlan {
  id:            string
  userId:        string
  weekOf:        string   // YYYY-MM-DD（周一）
  goalAlignment: number   // 0-1
  createdAt:     string
}

export interface PlanSlot {
  id:              string
  planId:          string
  slotDate:        string
  mealType:        MealType
  suggested:       { dish: string; reason: string; alternatives: string[] }
  swappedTo:       { dish: string; reason: string } | null
  executionStatus: PlanExecStatus | null
  executedMealId:  string | null
}

export interface DishScore {
  id:              string
  userId:          string
  dishKey:         string
  energyAvg:       number
  digestionAvg:    number
  satietyAvg:      number
  satisfactionAvg: number
  sampleSize:      number
  confidence:      number
  lastUpdated:     string
}
```

### 3.6 横向履约智能契约类型

```typescript
// ── 横向履约智能契约 ─────────────────────────────────
export type CanonicalFoodType = 'dish' | 'ingredient' | 'sku' | 'meal_kit'
export type FulfillmentEventType =
  | 'plan_generated'
  | 'plan_viewed'
  | 'suggestion_accepted'
  | 'suggestion_swapped'
  | 'suggestion_skipped'
  | 'purchase_clicked'
  | 'purchase_completed'
  | 'subscription_started'
  | 'meal_recorded'
  | 'feedback_submitted'
  | 'food_memory_inferred'
  | 'weekly_report_viewed'
  | 'weekly_report_corrected'
  | 'membership_offer_viewed'
  | 'membership_purchased'

export interface CanonicalFood {
  key:             string
  type:            CanonicalFoodType
  displayName:     string
  aliases:         string[]
  parentKey:       string | null
  nutritionItemId: string | null
}

export interface FulfillmentEvent {
  id:                       string
  userId:                   string
  eventType:                FulfillmentEventType
  objectType:               string
  objectId:                 string | null
  source:                   string
  contextVersion:           string | null
  confidence:               number | null
  expectedFulfillmentLift:  number | null
  actualOutcome:            Record<string, unknown> | null
  createdAt:                string
}

export interface AlgorithmDecision {
  id:                       string
  userId:                   string
  algorithm:                string
  algorithmVersion:         string
  contextSnapshotId:        string
  decision:                 Record<string, unknown>
  confidence:               number
  reasons:                  string[]
  targetMetric:             'effective_fulfillment_rate' | string
  expectedFulfillmentLift:  number | null
  fallback:                 Record<string, unknown> | null
}
```

### 3.7 6.0 食材记忆类型

```typescript
// ── 6.0 食材记忆 ─────────────────────────────────────
export interface FoodMemoryItem {
  id:                      string
  userId:                  string
  canonicalFoodKey:         string
  sourceOrderItemId:        string | null
  estimatedRemainingRatio:  number | null
  estimatedQuantity:        number | null
  unit:                    string | null
  expiryRisk:              'none' | 'soon' | 'expired' | 'unknown'
  confidence:              number
  lastInferredAt:          string | null
}

export interface WeeklyFulfillmentReport {
  id:                  string
  userId:              string
  weekOf:              string
  fulfillmentStats:    Record<string, unknown>
  foodMemorySummary:   Record<string, unknown>
  corrections:         Array<Record<string, unknown>>
  nextWeekStrategy:    Record<string, unknown>
}
```

### 3.8 Zustand Store 接口

```typescript
// ── useMealStore ──────────────────────────────────────
// src/stores/useMealStore.ts
interface MealState {
  meals:       MealFull[]       // 当前加载的餐次（内存缓存）
  isLoading:   boolean
  homeScene:   HomeScene
  // actions
  loadMeals:        (userId: string) => Promise<void>
  addMeal:          (meal: Meal, analysis: MealAnalysis | null) => Promise<void>
  submitFeedback:   (mealId: string, fb: Omit<MealFeedback, 'mealId' | 'submittedAt'>) => Promise<void>
  submitCorrection: (mealId: string, field: string, aiValue: string, userValue: string) => Promise<void>
  getHomeScene:     () => HomeScene   // 纯计算，不触发网络请求
}

// ── useProfileStore ───────────────────────────────────
// src/stores/useProfileStore.ts
interface ProfileState {
  profile:     Profile | null
  weightLogs:  WeightLog[]
  isLoading:   boolean
  // actions
  loadProfile:   (userId: string) => Promise<void>
  updateProfile: (patch: Partial<Profile>) => Promise<void>
  addWeightLog:  (valueKg: number) => Promise<void>
  getWeightTrend: () => number | null   // kg/week，不足2条数据返回null
}

// ── useCheckinStore ───────────────────────────────────
// src/stores/useCheckinStore.ts
interface CheckinState {
  checkins:     DailyCheckin[]
  pendingCheckin: DailyCheckin | null   // 当前到期未答的回访
  // actions
  loadCheckins:    (userId: string) => Promise<void>
  scheduleCheckin: (meal: Meal) => Promise<void>   // 调度逻辑见 T3-02
  submitCheckin:   (checkinId: string, answers: Pick<DailyCheckin, 'energy' | 'digestion' | 'satiety'>) => Promise<void>
  dismissCheckin:  (checkinId: string) => Promise<void>
}

// ── usePlanStore ──────────────────────────────────────
// src/stores/usePlanStore.ts
interface PlanState {
  currentPlan:  MealPlan | null
  slots:        PlanSlot[]
  dishScores:   DishScore[]
  isGenerating: boolean
  // actions
  loadCurrentPlan: (userId: string) => Promise<void>
  generatePlan:    (weekOf: string) => Promise<void>
  swapSlot:        (slotId: string, newDish: string, reason: string) => Promise<void>
  markSlot:        (slotId: string, status: PlanExecStatus) => Promise<void>
}
```

### 3.9 类型 ↔ Schema 对齐表

| TypeScript 接口 | 对应 DB 表 | 关键字段映射 |
|---|---|---|
| `Meal` | `meals` | `ts`↔`ts`, `mealType`↔`meal_type`, `fromCard`↔`from_card`, `dailyCheckinId`↔`daily_checkin_id`, `autoClosedAt`↔`auto_closed_at`, `createdAt`↔`created_at` |
| `MealAnalysis` | `meal_analysis` | `mealId`↔`meal_id`, `recognizedFoods`↔`recognized_foods`, `eatingAdvice`↔`eating_advice`, `analysisMeta`↔`analysis_meta` |
| `MealFeedback` | `meal_feedback` | `mealId`↔`meal_id`, `actualIntake`↔`actual_intake`, `intakeRatio`↔`intake_ratio`, `submittedAt`↔`submitted_at` |
| `MealCorrection` | `meal_corrections` | `mealId`↔`meal_id`, `aiValue`↔`ai_value`, `userValue`↔`user_value`, `correctedAt`↔`corrected_at` |
| `MealImage` | `meal_images` | `mealId`↔`meal_id`, `imageType`↔`image_type`, `storageUrl`↔`storage_url`, `createdAt`↔`created_at` |
| `Profile` | `profiles` | `userId`↔`user_id`, `dailyBudget`↔`daily_budget`, `eatingStyle`↔`eating_style`, `updatedAt`↔`updated_at`, `heightCm`↔`height_cm`, `healthBackground`↔`health_background` |
| `WeightLog` | `weight_logs` | `userId`↔`user_id`, `valueKg`↔`value_kg`, `recordedAt`↔`recorded_at` |
| `DailyCheckin` | `daily_checkins` | `userId`↔`user_id`, `mealIds`↔`meal_ids`, `dueAt`↔`due_at`, `isNextDay`↔`is_next_day`, `answeredAt`↔`answered_at` |
| `CardAction` | `card_actions` | `userId`↔`user_id`, `cardState`↔`card_state`, `recommendationStage`↔`recommendation_stage`, `recommendationStageLabel`↔`recommendation_stage_label` |
| `MealPlan` | `meal_plans` | `userId`↔`user_id`, `weekOf`↔`week_of`, `goalAlignment`↔`goal_alignment`, `createdAt`↔`created_at` |
| `PlanSlot` | `plan_slots` | `planId`↔`plan_id`, `slotDate`↔`slot_date`, `mealType`↔`meal_type`, `swappedTo`↔`swapped_to`, `executionStatus`↔`execution_status`, `executedMealId`↔`executed_meal_id` |
| `DishScore` | `dish_scores` | `userId`↔`user_id`, `dishKey`↔`dish_key`, `energyAvg`↔`energy_avg`, `digestionAvg`↔`digestion_avg`, `satietyAvg`↔`satiety_avg`, `satisfactionAvg`↔`satisfaction_avg`, `sampleSize`↔`sample_size`, `lastUpdated`↔`last_updated` |
| `FulfillmentEvent` | `fulfillment_events` | `userId`↔`user_id`, `eventType`↔`event_type`, `objectType`↔`object_type`, `objectId`↔`object_id`, `contextVersion`↔`context_version`, `expectedFulfillmentLift`↔`expected_fulfillment_lift`, `actualOutcome`↔`actual_outcome`, `createdAt`↔`created_at` |
| `AlgorithmDecision` | `algorithm_decisions` | `userId`↔`user_id`, `algorithmVersion`↔`algorithm_version`, `contextSnapshotId`↔`context_snapshot_id`, `targetMetric`↔`target_metric`, `expectedFulfillmentLift`↔`expected_fulfillment_lift` |
| `FoodMemoryItem` | `food_memory_items` | `userId`↔`user_id`, `canonicalFoodKey`↔`canonical_food_key`, `sourceOrderItemId`↔`source_order_item_id`, `estimatedRemainingRatio`↔`estimated_remaining_ratio`, `estimatedQuantity`↔`estimated_quantity`, `expiryRisk`↔`expiry_risk`, `lastInferredAt`↔`last_inferred_at` |
| `WeeklyFulfillmentReport` | `weekly_fulfillment_reports` | `userId`↔`user_id`, `weekOf`↔`week_of`, `fulfillmentStats`↔`fulfillment_stats`, `foodMemorySummary`↔`food_memory_summary`, `nextWeekStrategy`↔`next_week_strategy` |

### 3.10 类型同步规则（响应 LESSON-0003）

每次蓝图升级 Phase 时，**必须按以下顺序**操作：

1. 先更新 `src/types/index.ts` 中对应接口
2. 再跑 `npm run typecheck` 确认零报错
3. 再修改业务代码
4. 「进入开发」门控 Pre-Flight 检查必须包含类型文件对齐验证

**违例后果**：跳过步骤 1 直接改业务代码，会导致类型错误在运行时才暴露，增加调试成本。

### 3.11 unknown 收窄安全模式（响应 LESSON-0004）

从 `Record<string, unknown>` 或 API 响应读取字段赋值给字面量联合类型时：

```typescript
// ❌ 错误：依赖控制流收窄，TypeScript 无法推断赋值目标类型
const intake: ActualIntake = obj.actualIntake === '全吃完' ? obj.actualIntake : '吃了一半'

// ✅ 正确：显式断言，明确告知编译器类型
const intake = (obj.actualIntake === '全吃完' ? obj.actualIntake : '吃了一半') as MealFeedback['actualIntake']
```

**适用场景**：
- 从 Supabase 查询结果（`data` 对象）读取联合类型字段
- 从 API 响应 JSON 映射到接口字段
- 从 `Record<string, unknown>` 解构字面量联合类型

---

## 四、Phase 演进

| Phase | 新增类型 | 约束 |
|---|---|---|
| Phase 1 | 全部基础类型完整实现：枚举 + Meal 链（Meal/MealAnalysis/MealFeedback/MealCorrection/MealImage）+ DrawCard + Profile + DailyCheckin + MealFull + 4个 Store | 必须全量完整，不允许留空占位 |
| Phase 2 | 增量加 `MealPlan` / `PlanSlot` / `DishScore`，`usePlanStore` | 不破坏 Phase 1 已有类型签名 |
| Phase 3–4 | `AlgorithmDecision` / `FulfillmentEvent` 等履约相关类型 | 按对应 Migration 增量扩展 |
| Phase 5 | `CanonicalFood` / `CanonicalFoodType` / `FulfillmentEventType` | 按对应 Migration 增量扩展 |
| Phase 6 | `FoodMemoryItem` / `WeeklyFulfillmentReport` | 按对应 Migration 增量扩展 |

---

## 五、禁止事项

- 禁止用 `any` 绕过类型
- 禁止先改业务代码再改类型（必须先改 `src/types/index.ts`）
- 禁止在多文件重复定义同名类型（统一从 `@/types` 导入）
- 禁止省略 `unknown` 收窄的显式 `as`

---

## 六、变更记录

| 日期 | 任务编号 | 变更 |
|---|---|---|
| 2026-06-03 | ##045 | 初版落盘，从蓝图 L2070–L2435 迁出，新增类型同步规则和 unknown 收窄安全模式（响应 LESSON-0003/0004）|
