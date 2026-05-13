# Phase 2: Real Data And AI 开发文档

## 1. 阶段目标

Phase 2 的目标是把 Phase 1 的 mock 闭环替换为真实数据和真实 AI，同时保持 Phase 1 已验证的产品路径不变。

核心路径不变：

```text
新用户建档
-> 进入 Today
-> 记录一餐并上传图片
-> AI 返回结构化分析
-> 用户可修正识别结果
-> 饭后反馈
-> 单餐详情
-> 历史记录
-> 身体拼图
-> 餐前抽卡
```

Phase 2 不是重做产品，也不是进入计划订阅、健康数据、采购履约。它只做真实数据和真实 AI 的替换层。

## 2. 本阶段做什么

### 必做

- Supabase Auth：匿名/手机号/第三方登录方案择一落地，先满足用户隔离。
- Supabase Database：落地 Profile、Meal、Analysis、Correction、Feedback、Report、DrawCard 数据。
- Supabase Storage：上传餐前图片，预留饭后剩余图片。
- AI meal analysis service：输入图片和用户上下文，输出严格 JSON。
- AI fallback：网络失败、模型失败、JSON 解析失败、低置信度都能回退。
- 数据隔离：所有用户数据必须按 `user_id` 隔离。
- 隐私保护：不在日志中打印图片、用户隐私、完整 AI 原始响应。
- Phase 1 mock fallback：真实服务不可用时，演示闭环仍可跑。
- 最小测试：service、schema mapper、store 关键路径有测试。

### 不做

- 不做 FastAPI 独立后端。
- 不做 pgvector 营养库。
- 不做 SQLite 离线优先同步。
- 不做推送通知。
- 不做 Health Connect。
- 不做真实购买、外卖、食材履约。
- 不做社区/群体推荐。
- 不做医学诊断。
- 不承诺精确卡路里、精确克数。

## 3. 阶段边界

Phase 2 的正确交付是：

```text
真实用户
真实图片
真实 AI 结构判断
真实持久化
真实数据隔离
mock fallback 仍可用
```

Phase 2 的错误交付是：

```text
为了接真实服务重写页面
为了上传图片新增原生依赖但未评估重打包
把 AI 输出直接透传到页面
把 Supabase 查询散落在 screen 中
把隐私数据打到 console
把 Phase 3/4 功能提前做进来
```

## 4. 工程原则

1. 保持现有 `app/ + src/` 结构。
2. `app/` 仍只做路由挂载。
3. `src/screens/` 不直接调用 Supabase 或 AI SDK。
4. 真实服务放在 `src/services/`。
5. mock service 保留，作为 fallback 和测试替身。
6. store 调用 repository/service，不知道底层是真实还是 mock。
7. 所有环境变量只读 `EXPO_PUBLIC_*` 或安全后端代理，不写死密钥。
8. 不新增原生依赖，除非先暂停并确认重打包影响。

## 5. 建议目录

```text
src/
  services/
    supabaseClient.ts
    authService.ts
    mealRepository.ts
    profileRepository.ts
    analysisRepository.ts
    feedbackRepository.ts
    storageService.ts
    aiMealAnalysisService.ts
    aiSchema.ts
    serviceMode.ts
  utils/
    privacy.ts
    validation.ts
```

说明：

- `supabaseClient.ts`：只初始化客户端。
- `storageService.ts`：只负责图片上传、路径生成、签名 URL 或 public URL 策略。
- `aiMealAnalysisService.ts`：只负责 AI 调用、schema 校验、fallback。
- `*Repository.ts`：负责 Supabase 表读写和类型映射。
- `serviceMode.ts`：控制 mock/real/fallback 模式。

## 6. 环境变量

建议使用：

```text
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_SERVICE_MODE=mock | real | hybrid
EXPO_PUBLIC_AI_ANALYSIS_ENDPOINT=
```

注意：

- 不在客户端放 OpenAI 或其他模型 provider 的 secret key。
- 如果 AI 需要 secret key，必须通过安全服务端 endpoint 代理。
- Phase 2 可以先使用 `EXPO_PUBLIC_AI_ANALYSIS_ENDPOINT`，由外部安全 endpoint 执行模型调用。

## 7. Supabase 数据模型

### profiles

```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  age_range text,
  gender text,
  height_cm numeric,
  weight_kg numeric,
  goal text not null default 'stable_energy',
  budget_level text,
  avoidances text[] not null default '{}',
  taste_preferences text[] not null default '{}',
  common_feelings text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### meals

```sql
create table meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  meal_type text not null,
  status text not null,
  source text not null,
  photo_path text,
  photo_taken_at timestamptz,
  meal_started_at timestamptz,
  feedback_due_at timestamptz,
  completed_at timestamptz,
  draw_card_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### analyses

```sql
create table analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  meal_id uuid not null references meals(id) on delete cascade,
  dish_name text not null,
  structure_summary text not null,
  staple_level text not null,
  protein_level text not null,
  vegetable_fiber_level text not null,
  oil_level text not null,
  portion_level text not null,
  risk_hints text[] not null default '{}',
  eating_advice text[] not null default '{}',
  feedback_focus text[] not null default '{}',
  confidence text not null,
  source text not null,
  raw jsonb,
  created_at timestamptz not null default now()
);
```

### analysis_corrections

```sql
create table analysis_corrections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  meal_id uuid not null references meals(id) on delete cascade,
  analysis_id uuid references analyses(id) on delete set null,
  field text not null,
  ai_value text not null,
  user_value text not null,
  corrected_at timestamptz not null default now()
);
```

### feedbacks

```sql
create table feedbacks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  meal_id uuid not null references meals(id) on delete cascade,
  fullness text not null,
  comfort text not null,
  sleepiness text,
  bloating text,
  energy text,
  price_satisfaction text,
  taste_feedback text[] not null default '{}',
  note text,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
```

### body_puzzle_reports

```sql
create table body_puzzle_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null,
  start_date timestamptz not null,
  end_date timestamptz not null,
  sample_size integer not null,
  patterns jsonb not null default '[]',
  safe_foods text[] not null default '{}',
  risk_combos text[] not null default '{}',
  next_week_suggestion text[] not null default '{}',
  generated_at timestamptz not null default now()
);
```

### draw_cards

```sql
create table draw_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  report_id uuid references body_puzzle_reports(id) on delete set null,
  type text not null,
  title text not null,
  reason text not null,
  risk text,
  source text not null,
  action text not null,
  accepted boolean,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);
```

## 8. RLS 策略

所有业务表必须启用 RLS：

```sql
alter table profiles enable row level security;
alter table meals enable row level security;
alter table analyses enable row level security;
alter table analysis_corrections enable row level security;
alter table feedbacks enable row level security;
alter table body_puzzle_reports enable row level security;
alter table draw_cards enable row level security;
```

通用策略：

```sql
create policy "Users can read own rows" on meals
for select using (auth.uid() = user_id);

create policy "Users can insert own rows" on meals
for insert with check (auth.uid() = user_id);

create policy "Users can update own rows" on meals
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can delete own rows" on meals
for delete using (auth.uid() = user_id);
```

每张表都要按同样模式建立策略。`profiles.id` 等于 `auth.uid()` 时可读写。

## 9. Storage 设计

Bucket：

```text
meal-photos
```

路径：

```text
{user_id}/meals/{meal_id}/before.jpg
{user_id}/meals/{meal_id}/after.jpg
```

规则：

- 用户只能读写自己路径下的图片。
- 数据库只存 `photo_path`，不存长 base64。
- 图片上传失败时，允许创建无图 backfill 餐次。
- Phase 2 不强制接原生相机插件；如果使用 Web/Expo 可用的已有能力，不新增原生依赖。

## 10. AI 分析输入

```ts
export type AnalyzeMealInput = {
  userId: string
  mealId: string
  imageUrl: string
  mealType: MealType
  profileContext: {
    goal: Profile["goal"]
    avoidances: string[]
    tastePreferences: string[]
    commonFeelings: string[]
  }
  recentSignals: Array<{
    dishName?: string
    structureSummary?: string
    fullness?: string
    comfort?: string
  }>
}
```

## 11. AI JSON Schema

AI 必须返回可解析 JSON，不允许页面直接消费自由文本。

```json
{
  "dishName": "string",
  "structureSummary": "string",
  "stapleLevel": "low | medium | high | unknown",
  "proteinLevel": "low | medium | high | unknown",
  "vegetableFiberLevel": "low | medium | high | unknown",
  "oilLevel": "light | medium | heavy | unknown",
  "portionLevel": "low | medium | high | unknown",
  "riskHints": ["string"],
  "eatingAdvice": ["string"],
  "feedbackFocus": ["string"],
  "confidence": "high | medium | low",
  "imageQualityNote": "string"
}
```

校验规则：

- `dishName` 不能为空，失败时用“这一餐”。
- 数组字段最多 5 条。
- 所有 level 不在枚举内时降级为 `unknown`。
- `confidence=low` 时必须显示低置信度提示。
- 不允许输出医学诊断、绝对化结论、精确克数承诺。

## 12. AI 失败兜底

必须覆盖：

| 场景 | UI | 数据 |
|---|---|---|
| 网络失败 | 展示可恢复失败页 | meal.status = analysis_failed |
| endpoint 500 | 展示重试/换图/用 mock 继续 | 不写入 analysis |
| JSON 解析失败 | 展示“分析结果不可用” | 保存 error code，不保存 raw 隐私 |
| 低置信度 | 展示低置信提示 | analysis.confidence = low |
| 图片缺失 | 允许 backfill | source = backfill |

## 13. Service 接口

Phase 2 开发必须优先稳定以下接口。

```ts
export type MealRepository = {
  createMeal(input: CreateMealInput): Promise<MealRecord>
  updateMealStatus(mealId: string, status: MealStatus): Promise<void>
  listMeals(): Promise<MealRecord[]>
  getMeal(mealId: string): Promise<MealRecord | undefined>
}

export type AnalysisRepository = {
  saveAnalysis(input: Analysis): Promise<Analysis>
  saveCorrection(input: AnalysisCorrection): Promise<AnalysisCorrection>
  getAnalysisByMeal(mealId: string): Promise<Analysis | undefined>
}

export type FeedbackRepository = {
  saveFeedback(input: Feedback): Promise<Feedback>
  listFeedbacks(): Promise<Feedback[]>
}

export type StorageService = {
  uploadMealPhoto(input: { userId: string; mealId: string; uri: string; kind: "before" | "after" }): Promise<{ path: string; url?: string }>
}

export type AiMealAnalysisService = {
  analyzeMeal(input: AnalyzeMealInput): Promise<Analysis>
}
```

## 14. Sprint 计划

### Sprint 1: Phase 1 收口测试和 service 边界

任务：

- 为 mock service 和 store 增加最小单元测试。
- 抽出 repository/service interface。
- 确认 screens 不直接依赖 Supabase。
- 加 service mode：`mock | real | hybrid`。

验收：

- `npm test` 不再是 `No tests found`。
- mock 闭环仍可运行。
- `npm run lint`、`npm run typecheck`、`npm test` 通过。

### Sprint 2: Supabase client、Auth、Profile

任务：

- 增加 `supabaseClient.ts`。
- 实现 Auth 最小路径。
- Profile 从 Supabase 读写。
- 无登录或配置缺失时回退 mock。

验收：

- 用户数据按 auth user 隔离。
- 不提交 `.env`。
- 缺少 Supabase env 时 App 不崩溃。

### Sprint 3: Meal、Storage、History

任务：

- Meal 创建写入 Supabase。
- 图片上传到 Storage。
- History 从 Supabase 拉取。
- Detail 可读取真实 meal。

验收：

- 真实创建餐次后刷新仍存在。
- 图片路径按 user/meal 隔离。
- 上传失败可 backfill。

### Sprint 4: AI Analysis

任务：

- 接 AI endpoint。
- 实现 JSON schema 校验和 mapper。
- 保存 analysis。
- 实现失败、低置信、mock fallback。

验收：

- 真实图片可获得结构化分析。
- AI 失败不会打断闭环。
- 修正 diff 可以保存。

### Sprint 5: Feedback、Report、Draw Card 持久化

任务：

- Feedback 写入 Supabase。
- Report 基于真实反馈生成并保存。
- Draw card 采纳/跳过写入。
- 7 天 seed 或真实数据可演示。

验收：

- 反馈提交后刷新仍可查看。
- 身体拼图引用真实反馈数据。
- 抽卡说明来源和不确定性。

### Sprint 6: 安全、隐私、验收

任务：

- RLS 检查。
- 隐私日志检查。
- AI 文案安全检查。
- Android/iOS/热更新影响说明。
- Phase 2 验收文档。

验收：

- 不打印隐私数据。
- 不输出医学诊断。
- `npm run lint`、`npm run typecheck`、`npm test` 通过。
- Web 可演示。

## 15. 验收清单

### 功能验收

- [ ] 用户可以登录或进入隔离身份。
- [ ] Profile 可真实保存和读取。
- [ ] Meal 可真实创建和读取。
- [ ] 图片可上传并关联 meal。
- [ ] AI 可返回结构化分析。
- [ ] AI 失败可恢复。
- [ ] 低置信度状态可见。
- [ ] Correction diff 可保存。
- [ ] Feedback 可保存。
- [ ] History 刷新后仍有数据。
- [ ] Report 基于真实 feedback。
- [ ] Draw card 决策可保存。
- [ ] mock fallback 仍可演示。

### 工程验收

- [ ] 不新增原生依赖，或已明确确认需要重打包。
- [ ] 不改变 `app/ + src/` 架构。
- [ ] screens 不直接写 Supabase 查询。
- [ ] service 有测试。
- [ ] schema mapper 有测试。
- [ ] `npm run lint` 通过。
- [ ] `npm run typecheck` 通过。
- [ ] `npm test` 有真实用例且通过。

### 安全验收

- [ ] RLS 开启。
- [ ] 用户只能访问自己的 rows。
- [ ] 用户只能访问自己的 storage path。
- [ ] `.env` 不提交。
- [ ] 不在 console 打印用户隐私、图片、完整 AI raw。
- [ ] AI secret 不放客户端。
- [ ] AI 输出不含医学诊断、羞辱、恐吓或绝对化表达。

## 16. Android/iOS 与发布影响

Phase 2 默认可以不新增原生依赖。

以下情况需要暂停并确认：

- 引入相机原生插件。
- 引入图片选择原生插件。
- 修改 app 权限。
- 修改 Expo SDK 或 native config。
- 加推送通知。

如果只改 JS/TS service、screen、schema、Supabase 调用，可走 EAS Update。

## 17. Phase 2 全自动执行 Prompt

下面 prompt 可复制给新的 AI Agent 执行 Phase 2。

```text
进入自主执行模式。

当前阶段：Phase 2 Real Data And AI。

目标：
把 Phase 1 的 mock 闭环替换为真实 Supabase 数据、真实图片存储和真实 AI 结构分析，同时保留 mock fallback。

必须先阅读：
1. AGENTS.md
2. docs/02-master-spec.md
3. docs/03-phase-1-closed-loop.md
4. docs/04-phase-2-real-data.md
5. docs/07-archive-index.md
6. docs/prototype/meal-agent-product-prototype.html

执行规则：
- 先看现有代码实现方式，再输出简短执行计划。
- 从 Phase 2 Sprint 1 开始执行。
- 每个 Sprint 完成后运行 npm run lint、npm run typecheck、npm test。
- 每个 Sprint 完成后报告：完成内容、修改文件、剩余风险、如何运行、如何测试、Android/iOS 影响、热更新影响、是否需要重新打包。
- 完成一个 Sprint 后继续下一个 Sprint，直到 Phase 2 完成或遇到阻塞。

禁止事项：
- 不重新讨论产品方向。
- 不做 Phase 3/4 功能。
- 不改工程架构。
- 不迁移 monorepo。
- 不把 Supabase 查询散落到 screen。
- 不直接在客户端写 AI secret。
- 不提交 .env。
- 不打印用户隐私、图片、完整 AI raw。
- 不输出医学诊断、恐吓、羞辱、精确热量承诺。
- 不新增原生依赖，除非暂停并明确询问。
- 不删除旧文档总纲。

Phase 2 Sprint 顺序：

Sprint 1：
- 补 Phase 1 store/service 最小测试。
- 抽出 service/repository 接口。
- 增加 service mode：mock、real、hybrid。
- 保证 npm test 有真实用例。

Sprint 2：
- 增加 Supabase client。
- 实现 Auth 最小路径。
- 实现 Profile repository。
- 缺 env 时自动 mock fallback。

Sprint 3：
- 实现 Meal repository。
- 实现 Storage service。
- 记录页上传图片并创建 meal。
- History/Detail 可读真实数据。

Sprint 4：
- 实现 AI meal analysis service。
- 增加 AI JSON schema 校验。
- 保存 analysis。
- 处理失败、低置信度、mock fallback。

Sprint 5：
- Feedback、Report、Draw Card 持久化。
- Correction diff 持久化。
- 刷新后数据仍可查看。

Sprint 6：
- RLS/隐私/文案安全检查。
- 补充验收说明。
- 最终运行 lint/typecheck/test。

如果需要以下任一事项，必须暂停问我：
- 新增原生依赖。
- 接入真实 AI secret 的客户端方案。
- 修改 app 原生权限。
- 修改工程架构。
- 删除或重写旧文档总纲。
- 引入 FastAPI、pgvector、SQLite、Health Connect、推送通知。
```

