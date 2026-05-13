# Phase 1: V1 产品闭环开发文档

## 1. 阶段目标

Phase 1 的目标是交付一个可运行、可演示、可测试的 7 天身体拼图闭环。

这一阶段先用 mock service 跑通产品，不被真实 AI、真实后端、真实图片上传、推送通知阻塞。

核心用户路径：

```text
新用户打开 App
-> 理解产品价值
-> 完成建档
-> 在 Today 记录一餐
-> 看到 AI 结构分析
-> 修正识别结果
-> 饭后完成 10 秒反馈
-> 查看单餐档案
-> 累积多餐后生成身体拼图
-> 餐前抽卡获得下一餐轻建议
```

## 2. 本阶段做什么

### 页面

| 页面 | 路由建议 | 目标 |
|---|---|---|
| 欢迎/定位 | `app/index.tsx` 或 onboarding 状态 | 让用户理解 7 天身体拼图价值 |
| 建档 | `app/profile.tsx` 或独立 onboarding screen | 收集最小必要信息 |
| Today 首页 | `app/index.tsx` | 承载记录入口、今日状态、待反馈提醒 |
| 记录页 | `app/record.tsx` | 拍照/选图/补记入口 |
| 分析页 | `app/analysis.tsx` | 展示 mock AI 分析、加载、失败、低置信度 |
| 饭后反馈 | `app/feedback.tsx` | 10 秒反馈 |
| 单餐详情 | `app/detail.tsx` | 展示照片、分析、修正、反馈 |
| 历史记录 | `app/history.tsx` | 查看已记录餐次 |
| 身体拼图 | `app/report.tsx` | 展示数据不足、初步洞察、7 天报告 |
| 餐前抽卡 | `app/draw-card.tsx` | 安全牌/风险牌、采纳/跳过 |

### 功能

- Profile 建档和编辑
- Meal 创建和状态流转
- Analysis mock 生成
- Analysis 修正 diff
- Feedback 提交
- Body Puzzle 规则生成
- Draw Card 规则生成
- 本地状态持久化可选，首轮可以先内存 store，之后再加轻量持久化

## 3. 本阶段不做什么

- 不接真实 AI
- 不做 FastAPI
- 不做 pgvector 营养库
- 不做 Supabase Storage 图片上传
- 不做真实 Auth
- 不做 SQLite 离线优先同步
- 不做推送通知
- 不做 Health Connect
- 不做采购履约
- 不做社区/群体推荐
- 不承诺精确卡路里或医学建议

## 4. 工程实现约束

### 目录

优先按现有工程结构扩展：

```text
app/
src/
  components/
  features/
    meal/
    feedback/
    body-puzzle/
    draw-card/
  screens/
  services/
  stores/
  styles/
  types/
  utils/
```

`app/` 只负责路由挂载。

页面主体放在 `src/screens/`。

业务逻辑逐步沉到 `src/features/`、`src/services/`、`src/stores/`。

### 样式

- 必须使用 `src/styles/tokens.ts`。
- 页面可以有局部 `StyleSheet`，但颜色、间距、圆角、字体尺度优先来自 token。
- 不直接复制 HTML 原型里的 CSS 到页面。

### 状态

使用 Zustand。

建议 store：

```text
src/stores/useOnboardingStore.ts
src/stores/useMealStore.ts
src/stores/useBodyPuzzleStore.ts
```

### 服务

Phase 1 使用 mock service：

```text
src/services/mockMealService.ts
src/services/mockAnalysisService.ts
src/services/mockBodyPuzzleService.ts
src/services/mockDrawCardService.ts
```

后续 Phase 2 用 Supabase/AI service 替换，不改变 screen 调用口径。

## 5. 核心类型

### Profile

```ts
export type Profile = {
  id: string
  ageRange?: "under_25" | "25_34" | "35_44" | "45_plus"
  gender?: "female" | "male" | "other" | "unknown"
  heightCm?: number
  weightKg?: number
  goal: "feel_better" | "fat_loss" | "stable_energy" | "eat_regularly"
  budgetLevel?: "low" | "medium" | "high"
  avoidances: string[]
  tastePreferences: string[]
  commonFeelings: string[]
  createdAt: string
  updatedAt: string
}
```

### Meal

```ts
export type MealStatus =
  | "draft"
  | "analyzing"
  | "analysis_failed"
  | "ready_to_eat"
  | "eating"
  | "pending_feedback"
  | "completed"
  | "missed_feedback"

export type Meal = {
  id: string
  mealType: "breakfast" | "lunch" | "dinner" | "snack"
  status: MealStatus
  photoUri?: string
  source: "photo" | "album" | "backfill" | "draw_card"
  createdAt: string
  photoTakenAt?: string
  mealStartedAt?: string
  feedbackDueAt?: string
  completedAt?: string
  analysis?: MealAnalysis
  corrections: AnalysisCorrection[]
  feedback?: MealFeedback
  drawCardId?: string
}
```

### Analysis

```ts
export type MealAnalysis = {
  dishName: string
  structureSummary: string
  stapleLevel: "low" | "medium" | "high" | "unknown"
  proteinLevel: "low" | "medium" | "high" | "unknown"
  vegetableFiberLevel: "low" | "medium" | "high" | "unknown"
  oilLevel: "light" | "medium" | "heavy" | "unknown"
  portionLevel: "low" | "medium" | "high" | "unknown"
  riskHints: string[]
  eatingAdvice: string[]
  feedbackFocus: string[]
  confidence: "high" | "medium" | "low"
  source: "mock" | "ai"
  raw?: unknown
}
```

### Feedback

```ts
export type MealFeedback = {
  fullness: "hungry" | "just_right" | "full" | "overfull"
  comfort: "comfortable" | "bloated" | "sleepy" | "energetic" | "uncomfortable"
  sleepiness?: "none" | "mild" | "obvious"
  bloating?: "none" | "mild" | "obvious"
  priceSatisfaction?: "good" | "ok" | "bad"
  note?: string
  submittedAt: string
}
```

### Correction

```ts
export type AnalysisCorrection = {
  id: string
  field: string
  aiValue: string
  userValue: string
  correctedAt: string
}
```

## 6. 页面状态机

### Today 首页状态

| 状态 | 条件 | 展示 |
|---|---|---|
| `empty` | 无记录 | 引导记录第一餐 |
| `before_meal` | 当前无待办 | 主记录入口、抽卡入口 |
| `analyzing` | 最近餐次分析中 | 分析进度 |
| `ready_to_eat` | 分析完成未开始吃 | 结构建议、开始吃按钮 |
| `eating` | 已开始吃未到反馈 | 吃饭中、稍后反馈提示 |
| `pending_feedback` | 到反馈时间未反馈 | 10 秒反馈入口 |
| `done` | 今日已有完成餐次 | 今日状态和下一步建议 |

### 记录页状态

| 状态 | 展示 |
|---|---|
| 默认 | 拍照/相册/补记入口 |
| 已选图片 | 图片预览、餐次类型、重选 |
| 上传/分析中 | loading |
| 分析失败 | 重试、换图、使用 mock 继续 |

### 分析页状态

| 状态 | 展示 |
|---|---|
| loading | 分析进度、非精确提示 |
| success | 结构判断、轻建议、反馈关注点 |
| low_confidence | 明确提示图片不清或结果仅供参考 |
| failed | 可恢复错误界面 |
| editable | 菜名/结构可修正，保存 correction diff |

### 反馈页状态

| 状态 | 展示 |
|---|---|
| not_due | 未到反馈时间，可返回 |
| available | 饱腹、舒服/困/胀、有精神、价格满意 |
| submitted | 即时小洞察 |
| missed | 允许补填，标记为补录 |

### 身体拼图状态

| 状态 | 条件 | 展示 |
|---|---|---|
| no_data | 0 餐 | 引导记录 |
| warming_up | 1-2 餐 | 说明还需要更多反馈 |
| first_signal | 3-6 餐 | 初步规律，不做强断言 |
| weekly_report | 7+ 餐或 7 天 | 规律、风险组合、安全食物、下周建议 |

## 7. Sprint 开发计划

### Sprint 1: 类型、store、mock service

任务：

- 整理 `src/types/meal.ts`，补齐 Profile、Meal、Analysis、Feedback、Correction、Report、DrawCard。
- 建立或扩展 Zustand store。
- 建立 mock analysis、body puzzle、draw card service。
- 准备 0 餐、3 餐、7 餐 seed 数据。

验收：

- 不依赖网络即可创建和读取餐次。
- 7 餐 seed 能生成身体拼图。
- `npm run typecheck` 通过。

### Sprint 2: 建档与 Today 首页

任务：

- 实现欢迎/定位视图。
- 实现建档表单和基础校验。
- 实现 Today 首页状态卡。
- 实现记录入口。

验收：

- 新用户路径能进入首页。
- 首页在空状态、待反馈、已完成状态下展示正确。

### Sprint 3: 记录、分析、修正

任务：

- 实现记录页拍照/选图 UI，占位 mock 即可。
- 实现分析页 loading/success/low_confidence/failed。
- 实现修正 diff。
- 实现开始吃/进入反馈流。

验收：

- 记录一餐后能进入分析结果。
- 修正不会覆盖原始分析，而是保存 diff。
- 失败状态可恢复。

### Sprint 4: 饭后反馈与详情

任务：

- 实现反馈页。
- 实现反馈提交后的即时小洞察。
- 实现单餐详情页。
- 实现历史记录页。

验收：

- 反馈提交后餐次状态变为 completed。
- 详情页能完整展示分析、修正、反馈。
- 历史记录可进入详情。

### Sprint 5: 身体拼图与抽卡

任务：

- 实现身体拼图数据不足/初步规律/7 天报告。
- 实现餐前抽卡。
- 实现采纳/跳过记录。
- 增加验收测试。

验收：

- 0/3/7 餐状态都可演示。
- 抽卡能基于历史反馈和当前状态给出安全牌/风险牌。
- 文案没有医学化、恐吓化、精确热量承诺。

## 8. 验收清单

### 功能验收

- [ ] 新用户能完成建档。
- [ ] 用户能记录一餐。
- [ ] 分析页有 loading、成功、低置信、失败状态。
- [ ] 用户能修正分析结果。
- [ ] 用户能完成饭后反馈。
- [ ] 单餐详情可查看。
- [ ] 历史记录可查看。
- [ ] 身体拼图能从数据不足逐步进入初步规律。
- [ ] 餐前抽卡可采纳/跳过。

### 工程验收

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] Expo 本地可启动
- [ ] 不新增原生插件，或已明确标记需要重新打包

### 产品安全验收

- [ ] 不输出医学诊断。
- [ ] 不承诺精确卡路里。
- [ ] 不使用羞辱、恐吓、惩罚式表达。
- [ ] AI/分析结果有不确定性提示。
- [ ] 用户隐私数据不打印到日志。

## 9. 开发完成后必须说明

每次完成任务后，必须说明：

- 改了哪些文件
- 为什么这样改
- 如何运行
- 如何测试
- 是否影响 Android/iOS
- 是否影响热更新
- 是否需要重新打包

