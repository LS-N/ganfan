# 干饭 App 全栈开发实施方案

**版本：** v1.0 | **适用：** Codex 自主开发 | **覆盖：** MVP 1.0 → 5.0

---

# 总体架构设计

## 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                  React Native App (Expo)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │  Home    │  │  Camera  │  │ History  │  │  Profile  │  │
│  └──────────┘  └──────────┘  └──────────┘  └───────────┘  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │ Feedback │  │ Checkin  │  │  Plan    │  │  Insight  │  │
│  └──────────┘  └──────────┘  └──────────┘  └───────────┘  │
│                                                             │
│  stores/ (Zustand)          db/ (expo-sqlite)              │
│  useMealStore               本地优先写入                    │
│  useProfileStore            后台同步 Supabase               │
│  usePlanStore                                               │
└──────────────┬──────────────────────────┬───────────────────┘
               │ Supabase JS SDK          │ HTTPS
               ↓                          ↓
┌──────────────────────┐    ┌─────────────────────────────────┐
│      Supabase        │    │      FastAPI AI Service          │
│  PostgreSQL          │    │  POST /v1/meal/analyze  ←──┐    │
│  Auth (phone/email)  │    │  POST /v1/plan/generate    │    │
│  Storage (images)    │    │  POST /v1/pattern/compute  │    │
│  Realtime            │    │  POST /v1/predict/meal     │    │
│  Row Level Security  │    │  POST /v1/insight/generate │    │
│  pgvector (营养库)   │◄───│  nutrition/search.py    ───┘    │
└──────────────────────┘    │                                 │
                            │  ↕ Anthropic Claude API         │
                            └─────────────────────────────────┘

餐次分析两阶段流程：
  阶段1（识别）: 图片 → Claude Vision → 结构化菜品名称 + 估算营养
  阶段2（精准化）: 菜品名称 → pgvector向量搜索营养库 → 合并精准营养值
  合并输出 + UserContext → Claude 生成个性化建议
```

## 最终技术栈

| 层级 | 技术 | 版本 | 用途 |
|------|------|------|------|
| 移动端框架 | React Native | 0.74+ | 跨平台基础 |
| 构建工具 | Expo SDK | 51+ | Android/iOS构建 |
| 路由导航 | Expo Router | 3.x | 文件路由 |
| 状态管理 | Zustand | 4.x | 全局状态 |
| 本地数据库 | expo-sqlite | 13+ | 离线存储 |
| 网络请求 | @supabase/supabase-js | 2.x | 后端通信 |
| | axios | 1.x | AI服务通信 |
| 图片处理 | expo-image-manipulator | 12+ | 压缩/裁剪 |
| 相机 | expo-camera | 15+ | 拍照 |
| 通知 | expo-notifications | 0.28+ | 本地+推送 |
| 后端平台 | Supabase | cloud | DB+Auth+Storage |
| AI服务 | FastAPI | 0.111+ | Python AI逻辑 |
| AI模型 | Claude API | claude-sonnet-4-6 | 图像识别+推理 |
| 部署平台 | Railway | - | FastAPI托管 |
| 代码语言 | TypeScript | 5.x | 移动端 |
| | Python | 3.11+ | AI服务 |
| 数据库 | PostgreSQL | 15+ | 云端主库 |
| 向量搜索 | pgvector | 0.7+ | 营养库语义检索（Supabase内置） |
| 包管理 | pnpm | 9+ | Monorepo |

## 仓库结构（完整）

```
ganfan/
├── .github/
│   └── workflows/
│       ├── mobile-build.yml             ← EAS Build CI
│       └── ai-service-deploy.yml        ← Railway 部署
├── apps/
│   └── mobile/                          ← React Native App
│       ├── app/                         ← Expo Router 页面
│       │   ├── (tabs)/
│       │   │   ├── _layout.tsx          ← 底部导航配置
│       │   │   ├── index.tsx            ← 首页
│       │   │   ├── camera.tsx           ← 拍照记录
│       │   │   ├── history.tsx          ← 历史记录
│       │   │   └── profile.tsx          ← 个人档案
│       │   ├── onboarding/
│       │   │   ├── index.tsx            ← 欢迎页
│       │   │   ├── basic-info.tsx       ← 基础信息填写
│       │   │   └── goals.tsx            ← 目标设置
│       │   ├── feedback.tsx             ← 饭后反馈
│       │   ├── checkin.tsx              ← 每日回访
│       │   ├── meal-detail.tsx          ← 餐次详情
│       │   ├── plan.tsx                 ← 餐饮计划(2.0)
│       │   ├── insight.tsx              ← 身体洞察(3.0)
│       │   └── _layout.tsx              ← 根布局+Auth守卫
│       ├── components/
│       │   ├── MealCard.tsx
│       │   ├── RecoCard.tsx
│       │   ├── CheckinCard.tsx
│       │   ├── BodyPuzzle.tsx
│       │   ├── NutritionBar.tsx
│       │   └── WeightChart.tsx
│       ├── stores/
│       │   ├── useMealStore.ts
│       │   ├── useProfileStore.ts
│       │   ├── useCheckinStore.ts
│       │   └── usePlanStore.ts
│       ├── db/
│       │   ├── schema.ts                ← SQLite表定义
│       │   ├── migrations/              ← 版本化迁移
│       │   ├── meals.ts                 ← 餐次查询函数
│       │   └── sync.ts                  ← 本地↔Supabase同步
│       ├── api/
│       │   ├── supabase.ts              ← Supabase客户端
│       │   └── ai-service.ts            ← FastAPI客户端
│       ├── utils/
│       │   ├── imageCompress.ts
│       │   ├── dateHelpers.ts
│       │   └── nutritionCalc.ts
│       ├── constants/
│       │   ├── cuisineMap.ts
│       │   └── unlockThresholds.ts      ← 功能解锁条件
│       ├── app.json
│       ├── eas.json
│       └── package.json
├── services/
│   └── ai/                              ← FastAPI AI Service
│       ├── main.py                      ← 应用入口
│       ├── config.py                    ← 环境变量
│       ├── routers/
│       │   ├── analyze.py               ← 餐次图像分析
│       │   ├── plan.py                  ← 计划生成
│       │   ├── pattern.py               ← BodyPattern计算
│       │   ├── predict.py               ← 预测引擎
│       │   └── insight.py               ← 洞察生成
│       ├── models/
│       │   ├── meal.py                  ← Pydantic模型
│       │   ├── pattern.py
│       │   └── prediction.py
│       ├── algorithms/
│       │   ├── rules.py                 ← 1.0规则引擎
│       │   ├── dish_score.py            ← 2.0偏好模型
│       │   ├── body_pattern.py          ← 3.0规律模型
│       │   ├── predictor.py             ← 4.0预测模型
│       │   └── collaborative.py         ← 5.0协同过滤
│       ├── nutrition/
│       │   ├── search.py                ← pgvector语义搜索营养库
│       │   └── embedder.py              ← 菜品名称→向量（text-embedding-3-small）
│       ├── context/
│       │   └── builder.py               ← 个人上下文包构建
│       ├── requirements.txt
│       ├── Dockerfile
│       └── railway.json
├── supabase/
│   ├── migrations/
│   │   ├── 000_pgvector_nutrition.sql   ← 营养向量库（最先执行）
│   │   ├── 001_core_tables.sql          ← 1.0表
│   │   ├── 002_planning_tables.sql      ← 2.0表
│   │   ├── 003_pattern_tables.sql       ← 3.0表
│   │   ├── 004_prediction_tables.sql    ← 4.0表
│   │   └── 005_community_tables.sql     ← 5.0表
│   ├── seed.sql                         ← 测试数据
│   └── nutrition_seed/
│       └── cn_nutrition_db.csv          ← 中国食物营养数据（待采购/整理）
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── ALGORITHMS.md
│   └── DEVELOPMENT.md
├── CLAUDE.md                            ← AI开发规范
└── package.json                         ← pnpm workspace
```

## 完整数据库 Schema

### Migration 000：营养向量库（pgvector）

```sql
-- 开启 pgvector 扩展（Supabase 已内置，无需额外安装）
CREATE EXTENSION IF NOT EXISTS vector;

-- 中国食物营养数据库主表
CREATE TABLE nutrition_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dish_name     TEXT NOT NULL,               -- 标准菜品名，如"红烧肉"
  aliases       TEXT[] DEFAULT '{}',          -- 别名/地方叫法，如["东坡肉","毛氏红烧肉"]
  cuisine       TEXT,                         -- 菜系，如"徽菜"|"湘菜"
  category      TEXT,                         -- 分类，如"肉类"|"主食"|"汤类"
  nutrition_per_100g JSONB NOT NULL,          -- {calories, protein_g, fat_g, carb_g, fiber_g, sodium_mg}
  typical_serving_g  INT,                     -- 典型单份重量（克）
  data_source   TEXT,                         -- 数据来源：'cfc2019'|'manual'|'usda'
  embedding     vector(1536),                 -- OpenAI text-embedding-3-small 向量
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- 向量相似度索引（IVFFlat，适合<100万条数据规模）
CREATE INDEX nutrition_embedding_idx
  ON nutrition_items
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- 精确名称索引（快速精准匹配优先于向量搜索）
CREATE INDEX nutrition_dish_name_idx ON nutrition_items (dish_name);
CREATE INDEX nutrition_aliases_idx   ON nutrition_items USING GIN (aliases);

-- meal_analysis 表新增字段（记录营养来源）
ALTER TABLE meal_analysis
  ADD COLUMN nutrition_source TEXT DEFAULT 'ai_estimate',
  -- 'ai_estimate': Claude估算  'vector_matched': 向量库命中  'user_corrected': 用户修正
  ADD COLUMN matched_nutrition_id UUID REFERENCES nutrition_items(id),
  ADD COLUMN match_confidence      NUMERIC;  -- 向量相似度得分 0~1
```

**营养库搜索策略（两阶段）：**
```
阶段1 精确匹配（< 1ms）：
  SELECT * FROM nutrition_items WHERE dish_name = :dish_name
  OR :dish_name = ANY(aliases)

阶段2 语义向量搜索（< 50ms，精确匹配未命中时）：
  SELECT *, 1 - (embedding <=> :query_vec) AS score
  FROM nutrition_items
  ORDER BY embedding <=> :query_vec
  LIMIT 5

命中条件：score >= 0.85 视为有效匹配
未命中：保留 Claude 估算值，nutrition_source='ai_estimate'
```

**初始数据规模目标：**
- MVP 1.0 上线前录入：1000 条常见中国菜
  数据来源：github.com/Sanotsu/china-food-composition-data（第六版OCR CSV，可直接用）
- 持续扩充：用户搜不到 → 人工补录（后台工具），目标3.0上线前达5000条

### Migration 001：1.0 核心表

```sql
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone       TEXT UNIQUE,
  email       TEXT UNIQUE,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE profiles (
  user_id            UUID PRIMARY KEY REFERENCES users(id),
  age                INT,
  gender             TEXT,
  height_cm          NUMERIC,
  goal               TEXT DEFAULT '越来越舒服',
  health_background  TEXT[] DEFAULT '{}',
  avoid              TEXT,
  feeling            TEXT,
  reminder_delay_min INT,
  updated_at         TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE weight_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id),
  value_kg    NUMERIC NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE meals (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES users(id),
  ts               BIGINT NOT NULL,
  meal_type        TEXT NOT NULL,          -- '早饭'|'午饭'|'晚饭'|'加餐'
  dish             TEXT,
  cuisine          TEXT,
  province         TEXT,
  mood             TEXT,                   -- 就餐时的情绪/压力状态，如'压力有点大'|'心情不错'|'平静'
  meal_started_at  BIGINT,                 -- 用户点"开始吃"时的时间戳（ms）
  meal_duration_ms BIGINT,                 -- 进食时长（结束-开始），用于后续节律分析
  from_card        JSONB,                  -- 来源推荐卡信息 {dish, badge, reason}
  additionals      JSONB,                  -- 额外加的食物列表 [{name, estimate}]
  daily_checkin_id UUID,                   -- 关联的每日回访ID（回访提交后回写）
  auto_closed_at   TIMESTAMPTZ,            -- 超过30分钟未完成分析时自动关闭的时间
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE meal_analysis (
  meal_id              UUID PRIMARY KEY REFERENCES meals(id),
  dish                 TEXT,
  nutrition            JSONB,
  tags                 TEXT[],
  risk                 TEXT,
  recognized_foods     JSONB,
  eating_advice        JSONB,
  analysis_meta        JSONB,
  source               TEXT DEFAULT 'ai'
);

CREATE TABLE meal_corrections (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id    UUID REFERENCES meals(id),
  field      TEXT NOT NULL,
  ai_value   TEXT,
  user_value TEXT,
  corrected_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE meal_feedback (
  meal_id          UUID PRIMARY KEY REFERENCES meals(id),
  actual_intake    TEXT,
  intake_ratio     NUMERIC,
  fullness         TEXT,
  comfort          TEXT,
  satisfaction     TEXT,
  reactions        JSONB,
  submitted_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE meal_images (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id     UUID REFERENCES meals(id),
  image_type  TEXT NOT NULL,   -- 'wide'（整体环境）| 'close'（菜品特写）| 'leftover'（剩余量）
  storage_url TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE daily_checkins (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES users(id),
  date         DATE NOT NULL,
  meal_ids     UUID[],
  due_at       BIGINT,
  is_next_day  BOOLEAN DEFAULT false,
  energy       TEXT,
  digestion    TEXT,
  satiety      TEXT,
  answered_at  TIMESTAMPTZ,
  dismissed    BOOLEAN DEFAULT false,
  UNIQUE(user_id, date)
);

CREATE TABLE card_actions (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  dish    TEXT,
  badge   TEXT,
  risk    TEXT,
  action  TEXT NOT NULL,
  ts      BIGINT NOT NULL
);

-- Row Level Security
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own meals"
  ON meals FOR ALL USING (auth.uid() = user_id);
-- (其余表类似配置)
```

### Migration 002：2.0 计划表

```sql
CREATE TABLE meal_plans (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES users(id),
  week_of          DATE NOT NULL,
  goal_alignment   NUMERIC,
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE plan_slots (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id          UUID REFERENCES meal_plans(id),
  slot_date        DATE NOT NULL,
  meal_type        TEXT NOT NULL,
  suggested        JSONB,                  -- 原始推荐菜品及备选列表
  swapped_to       JSONB,                  -- 用户手动换菜后的新菜品（非null表示已替换）
  execution_status TEXT,                   -- null（未到）|'eaten'（按计划吃了）|'swapped'（换了别的）|'skipped'（没吃）
  executed_meal_id UUID REFERENCES meals(id)  -- 实际记录的餐次ID（eaten/swapped时写入）
);

CREATE TABLE dish_scores (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES users(id),
  dish_key         TEXT NOT NULL,
  energy_avg       NUMERIC,
  digestion_avg    NUMERIC,
  satiety_avg      NUMERIC,
  satisfaction_avg NUMERIC,
  sample_size      INT DEFAULT 0,
  confidence       NUMERIC DEFAULT 0,
  last_updated     TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, dish_key)
);

CREATE TABLE nutrition_targets (
  user_id    UUID REFERENCES users(id),
  date       DATE NOT NULL,
  target     JSONB,
  consumed   JSONB,
  PRIMARY KEY(user_id, date)
);
```

### Migration 003：3.0 模式表

```sql
CREATE TABLE body_patterns (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID UNIQUE REFERENCES users(id),
  generated_at   TIMESTAMPTZ DEFAULT now(),
  correlations   JSONB DEFAULT '[]',
  sample_size    INT DEFAULT 0,
  data_range     JSONB,
  version        INT DEFAULT 1
);

CREATE TABLE weekly_reports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES users(id),
  week_of      DATE NOT NULL,
  stats        JSONB,
  top_insight  JSONB,
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, week_of)
);
```

### Migration 004：4.0 预测表

```sql
CREATE TABLE predictions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id),
  generated_at    TIMESTAMPTZ DEFAULT now(),
  candidate_dish  TEXT,
  context         JSONB,
  predicted       JSONB,
  derived_from    JSONB,
  linked_meal_id  UUID REFERENCES meals(id),
  user_response   TEXT
);

CREATE TABLE prediction_accuracy (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id    UUID REFERENCES predictions(id),
  meal_id          UUID REFERENCES meals(id),
  checkin_id       UUID REFERENCES daily_checkins(id),
  dimensions       JSONB,
  overall_accuracy NUMERIC,
  feedback_signal  TEXT,
  applied_at       TIMESTAMPTZ
);

CREATE TABLE interventions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id),
  type          TEXT NOT NULL,
  trigger_desc  TEXT,
  message       TEXT,
  user_response TEXT,
  ts            TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE health_data (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES users(id),
  date           DATE NOT NULL,
  sleep_hours    NUMERIC,
  sleep_quality  TEXT,
  steps          INT,
  exercise_min   INT,
  blood_glucose  JSONB,
  source         TEXT DEFAULT 'manual',
  UNIQUE(user_id, date)
);
```

### Migration 005：5.0 社区表

```sql
CREATE TABLE community_dishes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dish         TEXT NOT NULL,
  cuisine      TEXT,
  segments     JSONB DEFAULT '[]',
  pop_scores   JSONB,
  sample_size  INT DEFAULT 0,
  updated_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(dish)
);

CREATE TABLE user_similarity (
  user_id       UUID PRIMARY KEY REFERENCES users(id),
  neighbors     JSONB DEFAULT '[]',
  cluster_label TEXT,
  feature_vec   JSONB,
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE professional_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_profile  JSONB,
  week_plan       JSONB,
  evidence_level  TEXT,
  exec_stats      JSONB,
  published_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE contributions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES users(id),
  type             TEXT,
  subject          JSONB,
  field            TEXT,
  value            TEXT,
  evidence_meal_ids UUID[],
  verified         BOOLEAN DEFAULT false,
  ts               TIMESTAMPTZ DEFAULT now()
);
```

## API 接口规范

**FastAPI AI Service 基础路径：`/v1`**

```
POST /v1/meal/analyze
  Request:  { image_base64: str, meal_type: str, user_context: UserContext }
  Response: { dish, nutrition, tags, risk, recognized_foods, eating_advice,
              nutrition_source, match_confidence }
  Timeout:  25s（含向量搜索，向量搜索超过2s则跳过，保留AI估算）
  Fallback: 返回 mock_analysis 并标记 source='mock'

  内部两阶段流程：
    Step 1: Claude Vision 识别 → { dish_name, ai_nutrition_estimate, tags, risk, eating_advice }
    Step 2: nutrition/search.py 精确+向量搜索营养库
            命中（score≥0.85）→ 用库中数值替换 ai_nutrition_estimate
                               写 nutrition_source='vector_matched', match_confidence
            未命中 → 保留 ai_nutrition_estimate，nutrition_source='ai_estimate'
    Step 3: 合并营养值 + UserContext → Claude 生成 eating_advice（个性化建议）

GET /v1/nutrition/search?q=红烧肉&limit=5
  Response: { items: [{ id, dish_name, nutrition_per_100g, score }] }
  用途: 用户手动修正菜品时的搜索建议

POST /v1/plan/generate
  Request:  { user_id: str, week_of: str, user_context: UserContext }
  Response: { slots: PlanSlot[], goal_alignment: float }
  Requires: dish_scores 存在（2.0解锁后调用）

POST /v1/pattern/compute
  Request:  { user_id: str }
  Response: { correlations: Correlation[], version: int, sample_size: int }
  Trigger:  meal_count >= 21 AND checkin_rate >= 0.6

POST /v1/predict/meal
  Request:  { candidate_dish: str, user_context: UserContext }
  Response: { predicted: Predictions, confidence: float, dominant_source: str }
  Requires: body_pattern.correlations >= 3 高置信度项

POST /v1/insight/generate
  Request:  { user_id: str, trigger: str }
  Response: { insights: Insight[], generated_at: str }
```

**UserContext 结构（个人上下文包）：**

```json
{
  "profile": { "goal": "", "health_background": [], "age": 0, "gender": "" },
  "body_pattern": { "correlations": [], "version": 1 },
  "dish_scores": { "<dish_key>": { "energy_avg": 0, "confidence": 0 } },
  "recent_meals": [],
  "recent_checkins": [],
  "health_data": {},
  "weight_trend": 0.0,
  "correction_history": [],
  "unlock_stage": 1
}
```

## 功能解锁阈值

```typescript
// apps/mobile/constants/unlockThresholds.ts
export const UNLOCK_THRESHOLDS = {
  // 产品阶段解锁
  STAGE_2: {
    complete_meals: 7,
    description: '个性化推荐解锁'
  },
  STAGE_3: {
    complete_meals: 21,
    checkin_rate: 0.6,
    description: '身体规律解锁'
  },
  STAGE_4: {
    high_confidence_correlations: 3,
    description: '饭前预测解锁'
  },
  STAGE_5: {
    platform_users: 1000,
    personal_accuracy: 0.65,
    description: '社区协同解锁'
  },

  // 身体拼图各块独立解锁条件
  BODY_PUZZLE: {
    show_section: 7,             // 整个身体拼图区域出现所需最少餐次
    block_0_liked_dishes: 1,     // 「喜欢吃这个」：有1餐即显示
    block_1_my_way: 3,           // 「我的吃法」：3餐
    block_2_explore: 2,          // 「口味探索」：2种不同菜系
    block_3_getting_better: 10,  // 「越来越舒服」：10餐
  },

  // 美食版图（菜系地图）
  CUISINE_MAP: {
    show_map: 1,                 // 有1餐记录即可看地图（未解锁省份灰显）
  },

  // 周报生成
  WEEKLY_REPORT: {
    min_meals_in_week: 1,        // 过去7天至少1餐才生成周报
  }
}
```

## 省份数据常量

> 文件：`src/constants/provinces.ts`，美食版图 SVG 地图直接使用此数据，禁止在组件内硬编码。

```typescript
export interface Province {
  id:    string   // 省份名（也用作 meal.province 的值）
  x:     number   // SVG viewBox="0 0 400 340" 坐标
  y:     number
  w:     number
  h:     number
  emoji: string   // 代表菜系的 emoji
  desc:  string   // 菜系名称
}

export const PROVINCES: Province[] = [
  { id:'黑龙江', x:310, y:30,  w:90, h:80, emoji:'🫙', desc:'东北菜' },
  { id:'吉林',   x:300, y:105, w:70, h:45, emoji:'🫕', desc:'东北菜' },
  { id:'辽宁',   x:280, y:145, w:65, h:40, emoji:'🍲', desc:'东北菜' },
  { id:'内蒙古', x:160, y:50,  w:180,h:70, emoji:'🥩', desc:'蒙古菜' },
  { id:'新疆',   x:20,  y:60,  w:140,h:110,emoji:'🍖', desc:'新疆菜' },
  { id:'西藏',   x:50,  y:175, w:120,h:80, emoji:'🧆', desc:'藏菜'   },
  { id:'青海',   x:140, y:165, w:80, h:65, emoji:'🫙', desc:'青海菜' },
  { id:'甘肃',   x:170, y:120, w:90, h:70, emoji:'🍜', desc:'西北菜' },
  { id:'宁夏',   x:210, y:130, w:30, h:35, emoji:'🥙', desc:'清真菜' },
  { id:'陕西',   x:220, y:155, w:40, h:65, emoji:'🫔', desc:'陕菜'   },
  { id:'山西',   x:245, y:130, w:40, h:55, emoji:'🍝', desc:'晋菜'   },
  { id:'河北',   x:262, y:110, w:50, h:40, emoji:'🥘', desc:'冀菜'   },
  { id:'北京',   x:278, y:108, w:18, h:16, emoji:'🦆', desc:'京菜'   },
  { id:'天津',   x:285, y:120, w:14, h:12, emoji:'🥟', desc:'津菜'   },
  { id:'山东',   x:268, y:148, w:60, h:40, emoji:'🥜', desc:'鲁菜'   },
  { id:'河南',   x:245, y:175, w:55, h:40, emoji:'🫓', desc:'豫菜'   },
  { id:'四川',   x:185, y:190, w:70, h:60, emoji:'🌶️',desc:'川菜'   },
  { id:'重庆',   x:228, y:205, w:22, h:22, emoji:'🔥', desc:'渝菜'   },
  { id:'云南',   x:175, y:245, w:65, h:60, emoji:'🌿', desc:'滇菜'   },
  { id:'贵州',   x:220, y:235, w:45, h:40, emoji:'🫙', desc:'黔菜'   },
  { id:'湖南',   x:248, y:215, w:50, h:45, emoji:'🌶', desc:'湘菜'   },
  { id:'湖北',   x:248, y:183, w:55, h:35, emoji:'🐟', desc:'鄂菜'   },
  { id:'安徽',   x:278, y:183, w:42, h:45, emoji:'🦞', desc:'徽菜'   },
  { id:'江苏',   x:288, y:163, w:45, h:30, emoji:'🦀', desc:'苏菜'   },
  { id:'上海',   x:310, y:185, w:14, h:12, emoji:'🥟', desc:'沪菜'   },
  { id:'浙江',   x:295, y:200, w:42, h:35, emoji:'🦐', desc:'浙菜'   },
  { id:'江西',   x:268, y:215, w:42, h:42, emoji:'🍵', desc:'赣菜'   },
  { id:'福建',   x:288, y:238, w:42, h:35, emoji:'🦪', desc:'闽菜'   },
  { id:'广东',   x:255, y:265, w:65, h:45, emoji:'🍵', desc:'粤菜'   },
  { id:'广西',   x:210, y:265, w:55, h:48, emoji:'🍜', desc:'桂菜'   },
  { id:'海南',   x:248, y:308, w:28, h:22, emoji:'🥥', desc:'琼菜'   },
  { id:'台湾',   x:318, y:248, w:20, h:30, emoji:'🧋', desc:'台湾菜' },
]

// meal.province 的合法值：PROVINCES[n].id，或以下两个特殊值
// '全国' — 不明确省份来源的菜系
// '境外' — 外国菜系（日料/韩餐/西餐等）
// 两者均不计入美食版图解锁数量
```

---

## 算法与大模型分工

```
营养库层（pgvector + Supabase）：
  提供精准数值基础：每100g营养成分（来自《中国食物成分表》等权威数据源）
  作用：修正Claude的估算值，提升营养数据可信度
  输出：nutrition_per_100g JSON，match_confidence float

算法层（FastAPI algorithms/）：
  计算结构化事实：特征相关性、评分均值、营养缺口、预测置信度
  消费营养库精准值，而不是Claude估算值
  输出：numbers, arrays, structured JSON

大模型层（Claude API）：
  消费算法输出 + 营养库精准值 + UserContext，生成可读文字
  两次调用：① Vision识别菜品结构  ② 综合上下文生成个性化建议
  输出：自然语言洞察、饮食建议、干预文案

关键原则：
  营养库提供"准确数值"，算法提供"是什么规律"，大模型解释"为什么"和"怎么办"
  每个用户的 UserContext 不同 → 每次生成内容个性化
  营养库数据可独立更新，算法迭代不需要 App 发版，FastAPI 独立热更新
```

## UI 设计系统

> 所有 token 来自原型 CSS variables，开发时必须使用这套 token，不得硬编码颜色/尺寸。

### 色彩 Token

```typescript
// src/theme/colors.ts
export const colors = {
  // 背景层次
  cream:    '#FAF7F2',   // 页面背景
  white:    '#FFFEF9',   // 卡片/组件背景

  // 文字层次
  ink:      '#1A1612',   // 主文字
  ink60:    '#7A6E66',   // 次要文字
  ink30:    '#C5BDB5',   // 占位/禁用文字

  // 边框
  border:   '#EDE8E1',

  // 主色（橙红，行动/激活状态）
  accent:   '#E85D26',
  accentS:  '#FFF0E9',   // accent 浅底

  // 辅色（绿，正向/健康）
  green:    '#2D6A4F',
  greenS:   '#EBF5EF',

  // 警示色（琥珀，注意/提醒）
  amber:    '#D4860A',
  amberS:   '#FEF6E4',

  // 危险色
  red:      '#C0392B',
  redS:     '#FDECEA',
}
```

### 字体

```typescript
// src/theme/typography.ts
export const fonts = {
  sans:  "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', sans-serif",
  serif: "Georgia, 'Songti SC', serif",
}

// 字号用途对照
// serif 36px  → 首页大标题（hero-title）
// serif 22-24px → 页面标题、身体拼图标题
// serif 20px  → 弹窗标题
// sans  19px  → NavBar 标题（nav-title）
// sans  15-16px → 正文、按钮
// sans  14px  → 说明文字、建议文字
// sans  13px  → 辅助信息、标签
// sans  12px  → chip、小标签
// sans  11px  → LABEL 大写标题（section header）
// sans  10px  → TabBar 文字
```

### 间距 & 圆角

```typescript
// src/theme/spacing.ts
export const spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 24,
  page: 20,   // 页面左右边距
}

export const radius = {
  sm:   10,   // --rs: 小组件（chip、分析框、小卡片）
  md:   16,   // --r: 标准卡片
  lg:   20,   // 弹窗、底部 sheet
  full: 999,  // 胶囊按钮、tag
}
```

### 基础组件清单 & 样式规范

**布局组件：**

| 组件 | 规范 |
|------|------|
| `NavBar` | 高56px，背景white，底border，标题serif 19px居中，左右各一个操作区 |
| `TabBar` | 高58px（含bottom safe area），背景white，顶border，4 tab，激活accent色 |
| `PageContainer` | 背景cream，paddingHorizontal 20，paddingTop 16 |
| `Section` | margin-bottom 12，子卡片间距8 |

**卡片 & 容器：**

| 组件 | 规范 |
|------|------|
| `Card` | 背景white，border 1px border色，radius 16，padding 18，marginBottom 12 |
| `CardSoft` | 背景cream，无border，radius 16，padding 14（用于嵌套内容区） |
| `Sheet` | 底部滑出弹窗，背景white，radius top 20，padding 28 24，max-height 80vh |

**按钮：**

| 组件 | Props | 规范 |
|------|-------|------|
| `PrimaryButton` | label, onPress, loading, disabled | 背景accent，白字，radius full，height 52，fontSize 15，fontWeight 500，全宽 |
| `GhostButton` | label, onPress | 透明背景，ink60色，fontSize 14，marginTop 8 |
| `OutlineButton` | label, onPress, color | border 1.5px，指定color，radius full，padding 11，fontSize 13 fontWeight 600 |
| `IconButton` | icon, onPress | border 1px border色，背景white，radius full，padding 7 10，fontSize 12 |

**选择控件：**

| 组件 | Props | 规范 |
|------|-------|------|
| `ScoreButton` | label, selected, onPress | border 1.5px，radius 10，高度自适应，未选border/white/ink60，选中accent-s背景+accent字+accent边框 |
| `OnboardingOption` | label, description?, selected, onPress | border 1.5px，radius 10，padding 13 16，fontSize 15，选中同ScoreButton |
| `SegmentTabs` | tabs[], activeIndex, onChange | 背景cream，内部激活项白背景+shadow，radius full |

**展示组件：**

| 组件 | 规范 |
|------|------|
| `Label` | fontSize 11，fontWeight 600，uppercase，letterSpacing 0.07em，ink60色，marginBottom 10 |
| `Chip` | padding 3 10，radius full，fontSize 12，fontWeight 500；green变体/amber变体 |
| `RiskBar` | height 3，radius 2；low=green 33%，medium=amber 66%，high=red 100% |
| `AdviceBox` | 背景accent-s，radius 10，padding 14，fontSize 14，accent色文字，lineHeight 1.6 |
| `MealItemRow` | flex row，高度自适应，padding 13 0，底border；左42px圆角头像区，右文字区 |
| `DayDot` | 28×28，radius 50%；默认border色，done=accent背景，today=accent边框 |
| `Toast` | fixed底部80px，背景ink，白字，radius full，padding 10 20，fontSize 13，动画淡入淡出 |
| `UploadZone` | dashed border 2px，radius 16，padding 28 20，背景cream；有图时显示 cover 图 |
| `EmptyState` | 居中布局，emoji大图，serif标题，ink60说明，可选操作按钮 |
| `LoadingSpinner` | 48px emoji spin动画，2s linear infinite |
| `ProgressBar` | height 3，radius 2，背景border，激活色可配置 |

**页面专用复合组件（Sprint 中实现，不属于基础库）：**

`MealCard`、`RecoCard`、`CheckinCard`、`BodyPuzzle`、`NutritionBar`、`WeightChart`、`ProvinceMap`（SVG地图）

---

## 核心 TypeScript 类型

> 文件：`src/types/index.ts`，所有模块从此统一导入，禁止各自定义同名类型。

```typescript
// ── 枚举 ──────────────────────────────────────────────
export type MealType = '早饭' | '午饭' | '晚饭' | '加餐'
export type MealMood = '心情不错' | '平静' | '压力有点大' | '有点焦虑' | '疲惫'
export type Fullness  = '撑' | '刚好' | '还饿'
export type Comfort   = '舒服' | '胀气' | '困倦' | '有精神'
export type Satisfaction = '很开心' | '还不错' | '一般' | '有点后悔'
export type ActualIntake = '全吃完' | '吃了3/4' | '吃了一半' | '剩很多'
export type HomeScene = 'DEFAULT' | 'PENDING_FB' | 'CHECKIN_DUE' | 'DONE'
export type ImageType = 'wide' | 'close' | 'leftover'
export type PlanExecStatus = 'eaten' | 'swapped' | 'skipped'

// ── 营养 ─────────────────────────────────────────────
export interface Nutrition {
  calories: number
  protein:  number   // g
  carbs:    number   // g
  fat:      number   // g
}

// ── 用户 ─────────────────────────────────────────────
export interface Profile {
  userId:           string
  age:              number | null
  gender:           string | null
  heightCm:         number | null
  goal:             string
  healthBackground: string[]
  avoid:            string | null
  feeling:          string | null
  reminderDelayMin: number
  updatedAt:        string
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

// ── 推荐卡 ───────────────────────────────────────────
export interface CardAction {
  id:     string
  userId: string
  dish:   string
  badge:  string | null
  risk:   string | null
  action: 'accept' | 'skip'
  ts:     number
}

// ── 完整餐次（聚合视图，供 UI 层使用）────────────────
export interface MealFull extends Meal {
  analysis:    MealAnalysis | null
  feedback:    MealFeedback | null
  images:      MealImage[]
  corrections: MealCorrection[]
  checkin:     DailyCheckin | null
}

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

---

## Zustand Store 接口定义

> 文件：`src/stores/`，类型从 `@/types` 导入。

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

---

## 完整 RLS 策略

> 所有表必须启用 RLS。直接拥有 `user_id` 的表用直接策略；通过外键关联的表用子查询策略。

```sql
-- ══ 直接含 user_id 的表（直接策略）══════════════════
-- profiles / weight_logs / meals / daily_checkins
-- card_actions / meal_plans / body_patterns / weekly_reports
-- predictions / interventions / health_data / user_similarity

-- 以 profiles 为示例，其余表替换表名即可：
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON profiles
  FOR ALL USING (auth.uid() = user_id);

-- ══ 通过 meal_id 关联的表（子查询策略）══════════════
-- meal_analysis / meal_corrections / meal_feedback / meal_images

ALTER TABLE meal_analysis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own meal analysis" ON meal_analysis
  FOR ALL USING (
    EXISTS (SELECT 1 FROM meals WHERE meals.id = meal_analysis.meal_id AND meals.user_id = auth.uid())
  );

ALTER TABLE meal_corrections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own meal corrections" ON meal_corrections
  FOR ALL USING (
    EXISTS (SELECT 1 FROM meals WHERE meals.id = meal_corrections.meal_id AND meals.user_id = auth.uid())
  );

ALTER TABLE meal_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own meal feedback" ON meal_feedback
  FOR ALL USING (
    EXISTS (SELECT 1 FROM meals WHERE meals.id = meal_feedback.meal_id AND meals.user_id = auth.uid())
  );

ALTER TABLE meal_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own meal images" ON meal_images
  FOR ALL USING (
    EXISTS (SELECT 1 FROM meals WHERE meals.id = meal_images.meal_id AND meals.user_id = auth.uid())
  );

-- ══ 通过 plan_id 关联的表 ══════════════════════════
-- plan_slots

ALTER TABLE plan_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own plan slots" ON plan_slots
  FOR ALL USING (
    EXISTS (SELECT 1 FROM meal_plans WHERE meal_plans.id = plan_slots.plan_id AND meal_plans.user_id = auth.uid())
  );

-- ══ 通过 prediction_id 关联的表 ═══════════════════
-- prediction_accuracy

ALTER TABLE prediction_accuracy ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own prediction accuracy" ON prediction_accuracy
  FOR ALL USING (
    EXISTS (SELECT 1 FROM predictions WHERE predictions.id = prediction_accuracy.prediction_id AND predictions.user_id = auth.uid())
  );

-- ══ 社区表（全平台共享，只读；写操作由后台服务账号执行）
ALTER TABLE community_dishes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read community dishes" ON community_dishes
  FOR SELECT USING (true);

ALTER TABLE professional_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read templates" ON professional_templates
  FOR SELECT USING (true);

-- contributions 由用户提交
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own contributions" ON contributions
  FOR ALL USING (auth.uid() = user_id);

-- dish_scores / nutrition_targets / plan_slots 也需 user_id 直接策略
ALTER TABLE dish_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own dish scores" ON dish_scores
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE nutrition_targets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own nutrition targets" ON nutrition_targets
  FOR ALL USING (auth.uid() = user_id);
```

---

## 开发规范（CLAUDE.md）

```markdown
## 架构原则
1. 本地优先：所有写操作先写 SQLite，再后台同步 Supabase
2. 离线可用：无网络时拍照记录功能必须正常运行
3. Schema 稳定：1.0建立的表结构不得破坏性修改，只能新增列/表
4. 类型安全：所有 TypeScript 代码必须无类型错误才能提交

## 文件命名
- 组件：PascalCase.tsx
- 工具函数：camelCase.ts
- 数据库查询：动词+名词（getMealsByDate, insertFeedback）

## 算法服务规则
- 所有算法逻辑在 FastAPI services/ai/ 中实现，禁止在移动端做算法计算
- 每个算法函数必须有单元测试

## 提交规范
feat(scope): 新功能
fix(scope): 修复
data(scope): 数据库变更
algo(scope): 算法变更
```

---

## 环境变量规范

> 两个服务各维护一份 `.env.example`，提交到仓库。`.env` 本身加入 `.gitignore`，不得提交。

### services/ai/.env.example

```bash
# Anthropic Claude API
ANTHROPIC_API_KEY=sk-ant-api03-xxx

# OpenAI（仅用于 embedder.py 批量生成营养库向量，其余 AI 功能不使用）
OPENAI_API_KEY=sk-xxx

# Supabase（后端服务账号，绕过 RLS，只在 FastAPI 中使用，绝不暴露给客户端）
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxx
SUPABASE_JWT_SECRET=your-jwt-secret   # Supabase Dashboard → Settings → API → JWT Secret

# 服务配置
AI_ENV=development                    # development | production
PORT=8000
ALLOWED_ORIGINS=http://localhost:8081,exp://localhost:8081
```

### apps/mobile/.env.example

```bash
# Supabase（前端只用 Anon Key，受 RLS 保护）
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxx

# FastAPI AI 服务地址
EXPO_PUBLIC_AI_SERVICE_URL=http://localhost:8000   # 本地开发
# 生产环境改为: EXPO_PUBLIC_AI_SERVICE_URL=https://ai.your-domain.railway.app

# 错误监控（Sprint 6 后填入）
EXPO_PUBLIC_SENTRY_DSN=https://xxx@o0.ingest.sentry.io/xxx
```

> **安全原则：**
> - `SERVICE_ROLE_KEY` 和 `JWT_SECRET` 只在 FastAPI 后端使用，永远不写入移动端
> - 移动端只持有 `ANON_KEY`，所有数据访问受 RLS 限制
> - CI/CD 中通过 GitHub Secrets 注入，变量名与 `.env.example` 一致

---

## FastAPI 安全规范

### 请求鉴权（JWT 验证）

```
问题：FastAPI 如何知道请求来自合法的已登录用户？

方案：移动端每次请求 FastAPI 时，在 Header 携带 Supabase JWT Token
  Authorization: Bearer <supabase_access_token>

FastAPI 验证流程（middleware/auth.py）：
  1. 从 Authorization Header 提取 Bearer token
  2. 用 SUPABASE_JWT_SECRET 本地验证 JWT 签名（无需调用 Supabase API，纯离线验证）
  3. 从 JWT payload 提取 sub 字段 → user_id
  4. 将 user_id 注入 request.state，路由层直接使用

实现（services/ai/middleware/auth.py）：
```

```python
from fastapi import Request, HTTPException
from jose import jwt, JWTError
from config import settings

async def auth_middleware(request: Request, call_next):
    if request.url.path in ["/health", "/docs"]:
        return await call_next(request)
    
    token = request.headers.get("Authorization", "").removeprefix("Bearer ")
    if not token:
        raise HTTPException(401, "Missing token")
    
    try:
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated"
        )
        request.state.user_id = payload["sub"]
    except JWTError:
        raise HTTPException(401, "Invalid token")
    
    return await call_next(request)
```

```
错误返回：
  401 Unauthorized：token 无效/过期
  403 Forbidden：请求 body 中的 user_id 与 JWT 中的 sub 不一致（防越权）
```

### 速率限制

```python
# 安装: pip install slowapi
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

# 各接口限制（per user_id）
@router.post("/v1/meal/analyze")
@limiter.limit("10/minute")   # 防止 Claude API 费用滥用
async def analyze_meal(...): ...

@router.post("/v1/plan/generate")
@limiter.limit("3/day")       # 计划生成成本较高
async def generate_plan(...): ...
```

### 输入验证（Pydantic）

```python
class AnalyzeRequest(BaseModel):
    image_base64: str = Field(..., max_length=8_000_000)   # base64 限 6MB 原图
    meal_type: Literal["早饭", "午饭", "晚饭", "加餐"]
    user_context: UserContext

class UserContext(BaseModel):
    profile: dict
    recent_meals: list = Field(default=[], max_items=21)
    body_pattern: dict | None = None
    dish_scores: dict = {}
    correction_history: list = Field(default=[], max_items=20)
    unlock_stage: int = Field(default=1, ge=1, le=5)
    # ... 其他字段
```

---

## CI/CD 流水线

### .github/workflows/mobile-ci.yml

```yaml
name: Mobile CI

on:
  push:
    branches: [main, dev]
  pull_request:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: apps/mobile
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: apps/mobile/package-lock.json
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm test -- --watchAll=false --passWithNoTests

  eas-preview-update:
    needs: check
    if: github.ref == 'refs/heads/dev' && github.event_name == 'push'
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: apps/mobile
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install -g eas-cli
      - run: npm ci
      - run: |
          eas update \
            --branch preview \
            --message "${{ github.event.head_commit.message }}" \
            --non-interactive
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
          EXPO_PUBLIC_SUPABASE_URL: ${{ secrets.EXPO_PUBLIC_SUPABASE_URL }}
          EXPO_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.EXPO_PUBLIC_SUPABASE_ANON_KEY }}
          EXPO_PUBLIC_AI_SERVICE_URL: ${{ secrets.EXPO_PUBLIC_AI_SERVICE_URL }}
```

### .github/workflows/ai-service-deploy.yml

```yaml
name: AI Service Deploy

on:
  push:
    branches: [main]
    paths:
      - 'services/ai/**'

jobs:
  test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: services/ai
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'
      - run: pip install -r requirements.txt
      - run: pytest tests/ -v --tb=short
        env:
          AI_ENV: test
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Railway
        run: |
          curl -fsSL https://railway.app/install.sh | sh
          railway up --service ai-service --detach
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

### GitHub Secrets 需要配置的变量

| Secret 名称 | 用途 | 来源 |
|------------|------|------|
| `EXPO_TOKEN` | EAS Update 鉴权 | expo.dev → Access Tokens |
| `EXPO_PUBLIC_SUPABASE_URL` | 移动端 Supabase 地址 | Supabase Dashboard |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | 移动端 Supabase 公钥 | Supabase Dashboard |
| `EXPO_PUBLIC_AI_SERVICE_URL` | 生产环境 FastAPI 地址 | Railway 部署后获取 |
| `SUPABASE_URL` | AI 服务 Supabase 地址 | Supabase Dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | AI 服务管理员密钥 | Supabase Dashboard → API |
| `RAILWAY_TOKEN` | Railway 部署凭证 | railway.app → Account Settings |

---

## UserContext 构建逻辑（builder.py）

> 文件：`services/ai/context/builder.py`
> 每次调用 AI 接口前执行，将用户个人数据聚合成结构化上下文，注入 Claude prompt。

```python
# services/ai/context/builder.py
from supabase import Client
from typing import Optional

async def build_user_context(user_id: str, supabase: Client) -> dict:
    """构建用户个人上下文包，用于注入所有 Claude prompt"""

    # ─── 1. 基础档案 ──────────────────────────────────────
    profile_res = supabase.table("profiles") \
        .select("age, gender, height_cm, goal, health_background, avoid, feeling") \
        .eq("user_id", user_id).single().execute()
    profile = profile_res.data or {}

    # ─── 2. 近期餐次（近21条，只取关键字段，不拉图片）────────
    meals_res = supabase.table("meals") \
        .select("meal_type, dish, cuisine, province, mood, ts") \
        .eq("user_id", user_id) \
        .order("ts", desc=True).limit(21).execute()
    recent_meals = meals_res.data or []

    # ─── 3. 近7天回访（关联信号）────────────────────────────
    checkins_res = supabase.table("daily_checkins") \
        .select("date, energy, digestion, satiety") \
        .eq("user_id", user_id) \
        .order("date", desc=True).limit(7).execute()
    recent_checkins = checkins_res.data or []

    # ─── 4. DishScores（只传置信度≥0.3的，防止噪声干扰）──────
    scores_res = supabase.table("dish_scores") \
        .select("dish_key, energy_avg, digestion_avg, satisfaction_avg, confidence, sample_size") \
        .eq("user_id", user_id) \
        .gte("confidence", 0.3) \
        .order("confidence", desc=True).limit(20).execute()
    dish_scores = {s["dish_key"]: s for s in (scores_res.data or [])}

    # ─── 5. BodyPattern（3.0解锁后才有数据）──────────────────
    pattern_res = supabase.table("body_patterns") \
        .select("correlations, version, sample_size") \
        .eq("user_id", user_id).maybe_single().execute()
    body_pattern = pattern_res.data  # 未解锁时为 None

    # ─── 6. 体重趋势（最近4次记录计算斜率）──────────────────
    weight_res = supabase.table("weight_logs") \
        .select("value_kg, recorded_at") \
        .eq("user_id", user_id) \
        .order("recorded_at", desc=True).limit(4).execute()
    weight_trend = _compute_weight_trend(weight_res.data or [])

    # ─── 7. 用户校正历史（提升识别准确率）────────────────────
    # 通过 meal_ids 关联，取近20条用户修正的字段
    correction_res = supabase.rpc("get_user_corrections", {
        "p_user_id": user_id, "p_limit": 20
    }).execute()
    correction_history = correction_res.data or []

    # ─── 8. 解锁阶段判断 ──────────────────────────────────
    meal_count = len(recent_meals)
    checkin_rate = _compute_checkin_rate(recent_checkins, meal_count)
    high_conf_patterns = len([
        c for c in (body_pattern or {}).get("correlations", [])
        if c.get("confidence", 0) >= 0.6
    ])
    unlock_stage = _determine_stage(meal_count, checkin_rate, high_conf_patterns)

    # ─── 9. 健康数据（4.0解锁后）──────────────────────────
    health_data = {}
    if unlock_stage >= 4:
        health_res = supabase.table("health_data") \
            .select("date, sleep_hours, sleep_quality, steps, exercise_min") \
            .eq("user_id", user_id) \
            .order("date", desc=True).limit(7).execute()
        health_data = {h["date"]: h for h in (health_res.data or [])}

    return {
        "profile": profile,
        "recent_meals": recent_meals,
        "recent_checkins": recent_checkins,
        "dish_scores": dish_scores,
        "body_pattern": body_pattern,
        "weight_trend": weight_trend,       # kg/week，正数为增重，负数为减重，None为数据不足
        "correction_history": correction_history,
        "health_data": health_data,
        "unlock_stage": unlock_stage,       # 1-5，决定 prompt 中注入哪些额外上下文
    }


def _compute_weight_trend(logs: list) -> Optional[float]:
    """最近4条体重记录计算周变化率，不足2条返回 None"""
    if len(logs) < 2:
        return None
    # 简单线性斜率：(最新 - 最旧) / 周数
    from datetime import datetime
    newest = logs[0]
    oldest = logs[-1]
    days = (datetime.fromisoformat(newest["recorded_at"]) -
            datetime.fromisoformat(oldest["recorded_at"])).days or 1
    return round((newest["value_kg"] - oldest["value_kg"]) / days * 7, 2)


def _compute_checkin_rate(checkins: list, meal_count: int) -> float:
    if meal_count == 0:
        return 0.0
    answered = sum(1 for c in checkins if c.get("satiety"))
    return round(answered / max(meal_count, 1), 2)


def _determine_stage(meal_count: int, checkin_rate: float, high_conf_patterns: int) -> int:
    if high_conf_patterns >= 3:
        return 4
    if meal_count >= 21 and checkin_rate >= 0.6:
        return 3
    if meal_count >= 7:
        return 2
    return 1
```

> **Supabase RPC 函数**（`get_user_corrections`，在 Migration 001 后执行）：
> ```sql
> CREATE OR REPLACE FUNCTION get_user_corrections(p_user_id UUID, p_limit INT)
> RETURNS TABLE(field TEXT, ai_value TEXT, user_value TEXT) AS $$
>   SELECT mc.field, mc.ai_value, mc.user_value
>   FROM meal_corrections mc
>   JOIN meals m ON m.id = mc.meal_id
>   WHERE m.user_id = p_user_id
>   ORDER BY mc.corrected_at DESC
>   LIMIT p_limit;
> $$ LANGUAGE sql SECURITY DEFINER;
> ```

---

## Claude Prompt 模板

> 文件：`services/ai/prompts/` 目录下各模板文件。
> 所有 prompt 用 `prompt_version` 字段追踪版本（格式 `v1.2`），写入 `analysis_meta`。

### Prompt 1：Vision 识别（Step 1 of analyze）

```python
# services/ai/prompts/vision_recognize.py
# prompt_version = "v1.0"

SYSTEM = """你是专业的中国饮食分析助手。分析用户拍摄的食物图片，识别菜品并估算营养。

严格规则：
- 只返回合法 JSON，不附加任何解释文字
- 如图片模糊无法识别，dish_name 填"未知菜品"，nutrition 填保守估算
- nutrition 是这整顿饭的实际摄入量（不是每100g），单位：calories(kcal)、protein/carbs/fat(g)
- tags 只从以下列表选择（可多选）：
  高蛋白 / 高碳水 / 高脂肪 / 高纤维 / 轻食 / 清淡 / 重口 / 辛辣 / 油腻 / 甜食 /
  汤类 / 主食 / 蔬菜为主 / 肉类为主 / 海鲜 / 发酵食品
- risk 只在以下情况填写，无风险时为 null：
  糖分过高 / 嘌呤较高 / 钠含量高 / 高GI / 高饱和脂肪 / 酒精
- recognized_foods 列出图中识别到的每种食材/菜品，weight 为估算克数字符串"""

def build_vision_prompt(meal_type: str) -> list:
    return [
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": f"""餐次类型：{meal_type}

请分析这张食物图片，返回以下 JSON：
{{
  "dish_name": "这顿饭最主要的菜品名称（中文，简洁，如'红烧肉配米饭'）",
  "nutrition": {{
    "calories": 0,
    "protein": 0,
    "carbs": 0,
    "fat": 0
  }},
  "tags": [],
  "risk": null,
  "recognized_foods": [
    {{"name": "具体食材或菜品名", "weight": "约XXg"}}
  ]
}}"""
                },
                {
                    "type": "image",
                    "source": {"type": "base64", "media_type": "image/jpeg", "data": "{{image_base64}}"}
                }
            ]
        }
    ]
```

### Prompt 2：个性化建议生成（Step 3 of analyze）

```python
# services/ai/prompts/eating_advice.py
# prompt_version = "v1.0"

SYSTEM = """你是用户的私人饮食顾问。根据这餐的分析结果和用户的个人健康数据，给出简短具体的建议。

严格规则：
- 每条建议 15-30 字，直接告诉用户"这餐之后/下一餐可以怎么做"
- 不重复已显示的营养数据
- 不给通用建议（不说"多喝水""少吃盐"等废话）
- type: 'positive' = 肯定鼓励，'caution' = 善意提醒
- 最多 3 条，最少 1 条，只说与这顿饭直接相关的
- 只返回 JSON"""

def build_advice_prompt(
    dish_name: str,
    nutrition: dict,
    nutrition_source: str,
    risk: str | None,
    user_context: dict
) -> list:
    profile = user_context.get("profile", {})
    recent_meals = user_context.get("recent_meals", [])
    recent_checkins = user_context.get("recent_checkins", [])
    body_pattern = user_context.get("body_pattern")
    unlock_stage = user_context.get("unlock_stage", 1)

    # 近7天菜系简要
    cuisines = [m.get("cuisine") for m in recent_meals if m.get("cuisine")]
    cuisine_summary = "、".join(list(dict.fromkeys(cuisines))[:5]) if cuisines else "暂无记录"

    # 近3天回访信号
    checkin_signals = []
    for c in recent_checkins[:3]:
        if c.get("digestion") == "明显不舒服":
            checkin_signals.append("最近肠胃不适")
        if c.get("energy") == "疲惫犯困":
            checkin_signals.append("最近精力偏低")
    checkin_hint = "；".join(checkin_signals) if checkin_signals else "近期状态平稳"

    # BodyPattern 信号（3.0解锁后）
    pattern_hint = ""
    if body_pattern and unlock_stage >= 3:
        correlations = body_pattern.get("correlations", [])
        # 找与当前菜品 tags 相关的规律
        relevant = [c for c in correlations if c.get("confidence", 0) >= 0.5]
        if relevant:
            pattern_hint = f"\n用户已发现的个人规律（高置信度）：{relevant[:2]}"

    user_message = f"""【这餐分析】
菜品：{dish_name}
热量：{nutrition.get('calories')}kcal，蛋白质{nutrition.get('protein')}g，碳水{nutrition.get('carbs')}g，脂肪{nutrition.get('fat')}g
数据来源：{"营养数据库（较准确）" if nutrition_source == "vector_matched" else "AI估算（参考值）"}
风险标签：{risk or "无"}

【用户个人情况】
目标：{profile.get('goal', '越来越舒服')}
健康背景：{', '.join(profile.get('health_background', [])) or '无特殊情况'}
忌口：{profile.get('avoid') or '无'}
近7天已吃菜系：{cuisine_summary}
近3天身体信号：{checkin_hint}{pattern_hint}

请返回：
{{
  "eating_advice": [
    {{"tip": "建议文字", "type": "positive 或 caution"}}
  ]
}}"""

    return [{"role": "user", "content": user_message}]
```

### Prompt 3：首批洞察生成（T5-05）

```python
# services/ai/prompts/first_insight.py
# prompt_version = "v1.0"
# 触发时机：用户累计满7天有效记录，首次调用

SYSTEM = """你是用户7天饮食数据的分析师。从数据中找出真实的个人规律，给用户一个有意义的"发现"。

严格规则：
- 只说数据里真实存在的规律，不推测，不泛化
- 每条洞察基于具体数据（"你吃了X次川菜，其中X次感觉不太舒服"）
- 语气温暖、非评判，像朋友分享观察，不像医生诊断
- 最多 3 条，只说最显著的
- 只返回 JSON"""

def build_first_insight_prompt(stats: dict, user_context: dict) -> list:
    """
    stats 由算法层预先计算，包含：
      - comfort_rate_by_cuisine: {cuisine: rate}
      - energy_patterns: [(signal, cuisine, count)]
      - top_comfort_dish: str
      - worst_comfort_cuisine: str
      - meal_time_distribution: {early/mid/late: count}
    """
    user_message = f"""用户7天饮食数据分析结果：

{stats}

用户档案：
目标：{user_context['profile'].get('goal')}
健康背景：{user_context['profile'].get('health_background')}

请生成洞察，返回格式：
{{
  "insights": [
    {{
      "title": "短标题（10字内）",
      "body": "具体描述（30-60字，引用真实数据）",
      "type": "pattern 或 suggestion"
    }}
  ]
}}"""
    return [{"role": "user", "content": user_message}]
```

### Prompt 4：周报生成（T10-01）

```python
# services/ai/prompts/weekly_report.py
# prompt_version = "v1.0"

SYSTEM = """你是用户的私人周报助理。用温暖、非评判的语气，把这一周的饮食数据转化成有意义的回顾。

严格规则：
- 以用户实际做到的事开头（肯定），再提改进点
- 数字要具体（"按计划吃了5天"比"大部分时间按计划"好）
- 不说通用健康科普，只说这个用户这一周的具体情况
- top_insight 是这周最值得记住的一件事（一句话）
- 只返回 JSON"""

def build_weekly_report_prompt(week_stats: dict, user_context: dict) -> list:
    """
    week_stats 由算法层计算，包含：
      - plan_execution_rate: float（计划执行率）
      - avg_energy: str
      - avg_digestion: str
      - total_meals: int
      - best_day: str（最舒服那天）
      - worst_day: str（最不舒服那天）
      - with_plan_comfort_rate: float
      - without_plan_comfort_rate: float
    """
    user_message = f"""本周数据摘要：
{week_stats}

用户目标：{user_context['profile'].get('goal')}

请生成周报，返回：
{{
  "summary": "2-3句话的整体描述",
  "highlights": ["亮点1", "亮点2"],
  "suggestion": "下周可以尝试的一件事（具体，可执行）",
  "top_insight": "这周最重要的一个发现（一句话，带数据）"
}}"""
    return [{"role": "user", "content": user_message}]
```

### Prompt 使用规范

```
1. 所有 prompt 注入 UserContext 前，先过滤掉 None/空值，不把"null"字符串传给 Claude
2. prompt_version 随 prompt 内容变更而递增（v1.0 → v1.1），写入 analysis_meta
3. 每次 Claude 调用都记录延迟：latency_ms = int((time.time() - start) * 1000)
4. Token 估算：Vision prompt ≈ 500 tokens，Advice prompt ≈ 300 tokens，
   响应 ≈ 200 tokens；每次分析约消耗 1000 tokens（含图片约 1500 tokens）
5. 禁止在 prompt 中包含用户密码、完整手机号等敏感信息
6. 生产环境启用 prompt caching（相同 SYSTEM 部分的 API 调用启用 cache_control）
   可节省约 40% 的 SYSTEM 部分 token 费用
```

---

# Sprint 0 — 工程底座与基础组件库

**目标：** 搭建可运行的工程环境，建立主题系统和所有基础组件，后续 Sprint 直接复用
**周期：** 1 Sprint（2周）
**完成判定：** App 在模拟器运行，组件预览页展示所有基础组件的所有状态，无 TypeScript 错误

---

## Sprint 0｜工程初始化（必须最先执行）

```
T0-00a 初始化 Monorepo
  产出: ganfan/ 目录结构、pnpm-workspace.yaml、根 package.json
  验收: pnpm install 无报错

T0-00b 初始化 Expo App
  产出: apps/mobile/ 完整 Expo + TypeScript 项目
  命令: npx create-expo-app mobile --template expo-template-blank-typescript
  验收: npx expo start 在模拟器显示空白界面

T0-00c 配置 Expo Router + TabBar
  产出: app/(tabs)/_layout.tsx，4个Tab：首页 / 记录 / 历史 / 我
  验收: 4个Tab可切换，无报错，tabbar吸底显示
```

> ⚠️ 以上三步必须完成后，才能进行组件开发（需要运行环境）

## Sprint 0｜主题 & 组件基础

```
T0-01 主题系统
  产出:
    src/theme/colors.ts      ← 色彩 token（完整对照设计系统）
    src/theme/typography.ts  ← 字体 token
    src/theme/spacing.ts     ← 间距 + 圆角 token
    src/theme/index.ts       ← 统一导出
  验收: 所有 token 可从 @/theme 导入，无硬编码颜色/数字散落在组件中

T0-02 布局组件
  产出: src/components/layout/
    NavBar.tsx        props: title, leftAction?, rightAction?
    TabBar.tsx        由 Expo Router _layout.tsx 驱动，此处只定义样式
    PageContainer.tsx props: children, style?（提供标准页面内边距）
    Section.tsx       props: children（标准分组间距）
  验收: 四个组件渲染正确，符合设计规范尺寸

T0-03 卡片 & 容器组件
  产出: src/components/base/
    Card.tsx          props: children, style?
    CardSoft.tsx      props: children, style?
    Sheet.tsx         props: visible, onClose, children（底部滑出）
  验收: Card白底border，CardSoft cream背景，Sheet动画正确

T0-04 按钮组件
  产出: src/components/base/
    PrimaryButton.tsx   props: label, onPress, loading?, disabled?
    GhostButton.tsx     props: label, onPress
    OutlineButton.tsx   props: label, onPress, color?
    IconButton.tsx      props: icon, onPress, label?
  验收: PrimaryButton loading状态显示spinner；disabled状态透明度0.4；所有按钮有press反馈

T0-05 选择控件
  产出: src/components/base/
    ScoreButton.tsx       props: label, selected, onPress
    OnboardingOption.tsx  props: label, description?, selected, onPress
    SegmentTabs.tsx       props: tabs, activeIndex, onChange
  验收: 选中状态颜色切换正确，SegmentTabs滑块动画流畅

T0-06 展示组件
  产出: src/components/base/
    Label.tsx         props: children（section header样式）
    Chip.tsx          props: label, variant: 'green'|'amber'|'red'|'default'
    RiskBar.tsx       props: level: 'low'|'medium'|'high'
    AdviceBox.tsx     props: text
    MealItemRow.tsx   props: emoji, name, subtitle?, rightText?
    DayDot.tsx        props: label, state: 'default'|'done'|'today'|'partial'
    ProgressBar.tsx   props: value(0-1), color?
  验收: 所有变体在预览页可见

T0-07 反馈 & 状态组件
  产出: src/components/base/
    Toast.tsx           全局单例，通过 useToast() hook 调用
    EmptyState.tsx      props: emoji, title, description, action?, actionLabel?
    LoadingSpinner.tsx  props: size?
    UploadZone.tsx      props: imageUri?, onPress, label?
  验收: Toast.show('xxx') 底部弹出后自动消失；EmptyState居中布局正确

T0-08 组件预览页（仅开发环境）
  产出: app/dev/components.tsx（路由只在 __DEV__ 下注册）
  内容: 列出所有基础组件的所有状态，不需要交互，仅供视觉核查
  验收: 能在开发模式下访问 /dev/components，看到所有组件渲染结果
```

**Sprint 0 验收标准：**
- [ ] 所有 token 从 `@/theme` 统一导入，无魔法数字
- [ ] 基础组件 TypeScript 类型完整，无 any
- [ ] `/dev/components` 页面展示所有组件的所有状态
- [ ] `npm run typecheck` 零错误

---

# MVP 1.0 — 记录感知

**目标：** 用户能完整记录餐次（拍照→分析→反馈→回访），7天后看到第一条个人规律
**周期：** 6 Sprint × 2周 = 12周
**完成判定：** 用户连续7天记录，每天至少1餐，回访完整率>60%，首页出现第一条洞察

---

## Sprint 1｜用户体系与数据层

> 前置：Sprint 0 全部完成（工程已可运行，基础组件已就绪）

```
T1-01 执行 Supabase Migration 001
  产出: supabase/migrations/001_core_tables.sql 执行成功
  验收: Supabase Dashboard中存在所有1.0表，完整RLS策略已启用（见架构文档RLS章节）

T1-02 Supabase Auth 集成（邮箱+密码）
  产出: api/supabase.ts 客户端，登录/注册界面
  文件: app/onboarding/index.tsx（欢迎页）
  验收: 能注册新账户，登录后跳转主界面，token持久化

T1-03 用户建档流程
  产出: app/onboarding/basic-info.tsx, goals.tsx
  存储: profiles表写入，本地SQLite同步
  字段: age, gender, height_cm, goal, health_background[], avoid
  验收: 首次登录后进入建档流程，完成后profiles表有数据

T1-04 本地 SQLite 初始化
  产出: db/schema.ts（1.0表的SQLite版本），db/migrations/001.ts
  验收: App启动时SQLite数据库自动创建，表结构与Supabase一致

T1-05 营养向量库初始化（Supabase pgvector）
  产出: supabase/migrations/000_pgvector_nutrition.sql 执行成功
        nutrition_seed/cn_nutrition_db.csv（1000条初始数据）
        services/ai/nutrition/embedder.py（批量生成向量的脚本）
  步骤:
    1. 执行 000_pgvector_nutrition.sql 建表+索引
    2. 导入 cn_nutrition_db.csv（菜品名、别名、营养值）
    3. 运行 embedder.py 批量生成并写入 embedding 向量
       向量模型: OpenAI text-embedding-3-small（1536维，性价比最高）
       批量大小: 100条/次，防止API超限
  数据来源（优先级顺序）:
    1. github.com/Sanotsu/china-food-composition-data — 第六版OCR提取JSON/CSV，可直接导入
    2. 公共卫生科学数据中心 phsciencedata.cn — 1506条，政府背书，免费申请导出
    3. CnOpenData cnopendata.com — 1700+食物CSV，覆盖维生素+氨基酸
    优先覆盖：热门100道菜 > 常见快餐 > 常见主食 > 蔬菜 > 水果
  验收:
    - Supabase中 nutrition_items 表存在且有≥1000条数据
    - embedding列非空
    - SELECT * FROM nutrition_items WHERE dish_name='红烧肉' 有结果
    - 向量相似度搜索 "东坡肉" 能命中 "红烧肉"（score≥0.8）
```

**Sprint 1 验收标准：** 能注册登录，能填写个人档案，数据同时写入SQLite和Supabase，营养向量库已初始化

---

## Sprint 2｜餐次记录与AI分析

```
T2-01 FastAPI 项目初始化
  产出: services/ai/ 完整项目，requirements.txt，main.py
  依赖: fastapi, uvicorn, anthropic, python-dotenv, pydantic
  验收: uvicorn main:app --reload 在本地 8000 端口启动

T2-02 Claude API 餐次分析接口（含营养向量库）
  产出: routers/analyze.py，nutrition/search.py，nutrition/embedder.py
        POST /v1/meal/analyze，GET /v1/nutrition/search
  逻辑（两阶段）:
    Step 1 - Claude Vision识别（最长20s）:
      - 接收 image_base64 + meal_type + user_context
      - 构建 Claude Vision prompt（含用户校正历史）
      - 返回: { dish_name, ai_nutrition_estimate, tags, risk, eating_advice_draft }
    Step 2 - 营养库精准化（最长2s，超时直接跳过）:
      - 先做精确名称匹配: SELECT WHERE dish_name=X OR X=ANY(aliases)
      - 精确未命中则向量搜索: embedder.embed(dish_name) → pgvector cosine搜索
      - 命中（score≥0.85）: 用库值替换 ai_nutrition_estimate
        写 nutrition_source='vector_matched', matched_nutrition_id, match_confidence
      - 未命中: nutrition_source='ai_estimate', match_confidence=null
    Step 3 - 个性化建议生成（最长5s）:
      - 合并最终营养值 + UserContext → Claude 生成 eating_advice
    analysis_meta 字段写入：{ source, phase, model, latency_ms, prompt_version,
                              nutrition_source, match_confidence }
      source: 'ai'|'mock'|'timeout_fallback'
      phase: 'instant'（拍完立即）|'deferred'（离线后补）
  总超时: 25秒（三个步骤合计），任一步骤失败降级不影响整体返回
  验收:
    - curl测试分析接口，response包含 nutrition_source 字段
    - "红烧肉"命中向量库（nutrition_source='vector_matched'）
    - 生僻菜品未命中时（nutrition_source='ai_estimate'）正常返回
    - 营养搜索接口 GET /v1/nutrition/search?q=红烧肉 返回top5结果

T2-03 移动端相机模块
  产出: app/camera.tsx，expo-camera集成
  功能: 拍照 + 相册选图 + 拍照预览确认
  验收: 能拍照，图片显示在预览区

T2-04 图片压缩与上传
  产出: utils/imageCompress.ts
  逻辑: 压缩到480px最长边，JPEG 0.65质量，上传 Supabase Storage
  image_type 映射:
    拍照/选图时上传的第一张 → 'wide'（用于AI分析）
    用户可选拍特写 → 'close'（可选，用于更精准识别）
    反馈页"剩余量"拍照 → 'leftover'（可选，用于intake_ratio辅助）
  写入: meal_images表（每张图一行，image_type区分）
  验收: 压缩后文件 < 100KB，meal_images表有对应记录，image_type字段正确

T2-05 分析结果展示界面
  产出: 内嵌在 camera.tsx 的分析结果区
  显示: 菜品名、热量、蛋白质/碳水/脂肪、风险标签、建议
  营养来源标签:
    nutrition_source='vector_matched' → 显示"📊 数据来自营养库"（小字，绿色）
    nutrition_source='ai_estimate'    → 显示"≈ AI估算"（小字，灰色）
  功能: 用户可点击修改菜品名和营养数值（写入meal_corrections）
  验收: 分析结果正确显示，营养来源标签根据source显示，修改后corrections表有记录

T2-06 餐次保存到数据库
  产出: db/meals.ts insertMeal(), insertMealAnalysis()
  逻辑: 先写SQLite，后台写Supabase，失败加入重试队列
  验收: 餐次数据在meals + meal_analysis两表均有记录

T2-07 进食计时与自动关闭
  产出: camera.tsx 中的计时逻辑
  流程:
    用户确认分析结果后 → 记录 meal_started_at = Date.now()
    用户提交饭后反馈时 → meal_duration_ms = Date.now() - meal_started_at
    若30分钟内未提交反馈 → auto_closed_at = Date.now()，餐次状态设为'auto_closed'
      首页PENDING_FB卡片仍保留，可补录反馈
  验收: meal_started_at有值；超30分钟未反馈auto_closed_at有值，首页仍显示待反馈卡

T2-08 加料记录
  产出: camera.tsx 分析结果页底部"还吃了别的？"入口
  UI: 点击后弹出输入框，支持文字描述（如"加了一碗汤"）
  存储: meals.additionals = [{ name: str, estimate: str }]
  验收: 加料内容写入additionals字段，详情页能显示

T2-09 就餐心情记录
  产出: camera.tsx 保存餐次前的情绪快选
  选项: 心情不错 / 平静 / 压力有点大 / 有点焦虑 / 疲惫
  存储: meals.mood 字段
  设计原则: 可跳过，不强制填写
  验收: 选了心情后meals.mood有值；跳过时为null，不影响保存流程
```

**Sprint 2 验收标准：** 拍照→AI分析→看到结果→（可选：加料/心情）→保存，全流程<30秒，数据完整写入

---

## Sprint 3｜反馈与每日回访

```
T3-01 饭后即时反馈界面
  产出: app/feedback.tsx
  问题（按顺序）:
    Q1: 实际吃掉多少（全吃完/吃了3/4/吃了一半/剩很多）
    Q2: 饱腹状态（撑/刚好/还饿）
    Q3: 身体即时感受（舒服/胀气/困倦/有精神）
    Q4: 这顿吃得开心吗（很开心/还不错/一般/有点后悔）
  存储: meal_feedback表
  验收: 4题全答完才能提交，数据写入正确

T3-02 每日回访调度逻辑
  产出: utils/checkinScheduler.ts scheduleDailyCheckin(meal)
  规则:
    早饭/午饭/加餐 → dueAt = max(当天17:00, now+3h)
    晚饭 → dueAt = 次日07:00
    同一天多餐 → 合并到同一条checkin记录，更新mealIds[]
  验收: 单元测试覆盖3种餐型的dueAt计算

T3-03 每日回访界面（首页卡片）
  产出: components/CheckinCard.tsx
  显示条件: Date.now() >= dueAt AND !answered
  问题（同时展示，选完提交）:
    精力状态（精力充沛/还好/疲惫犯困）
    肠胃感受（舒适顺畅/有点不适/明显不舒服）
    两餐之间（很耐饿/有点饿/饿得很快）
  提交逻辑:
    1. 更新daily_checkins（energy/digestion/satiety/answered_at）
    2. 回写 meals.daily_checkin_id = checkin.id（当天所有meal_ids中的每条）
  验收: 回访卡到时出现，提交后消失，data写入checkins表，meal.daily_checkin_id有值

T3-04 本地通知（即时反馈提醒）
  产出: utils/notifications.ts schedulePostMealReminder()
  逻辑: 餐次保存后，按profile.reminder_delay_min延迟发推送
  验收: Android真机收到通知，点击跳转到feedback页面

T3-05 本地通知（每日回访提醒）
  产出: scheduleCheckinReminder(dueAt)
  验收: 指定时间Android真机收到回访通知
```

**Sprint 3 验收标准：** 完整走通一餐：拍照→分析→即时反馈→（当天/次日）回访，数据全链路完整

---

## Sprint 4｜历史记录与个人档案

```
T4-01 餐次历史日历视图
  产出: app/history.tsx，日历视图组件
  逻辑: 按日期聚合meals，有记录的日期显示色点（已反馈=绿，未反馈=橙）
  验收: 能看到当月记录，点击日期展开当天餐次列表

T4-01b 美食版图（菜系地图视图）
  产出: 历史页第二个Tab「🗺️ 菜系地图」
  数据: 按 meal.province 聚合，统计各省份记录餐数
  显示:
    - SVG 中国省份简化地图，已记录省份高亮（accent色），未记录灰色
    - 地图下方：已解锁菜系数 / 总餐次 / 待探索数统计卡
    - 已解锁菜系列表（省份 emoji + 菜系名 + 记录餐数）
    - 点击省份弹出该菜系历史餐次详情
  解锁: 无前置条件，记录第一餐即可看到（未解锁省份灰色显示）
  跳转入口: 身体拼图「口味探索」块的「看我的美食地图 →」按钮
  db依赖: meals.province 字段（已在1.0 schema中）
  验收: 记录2个不同省份菜系后，地图对应省份高亮，点击显示餐次列表

T4-02 餐次详情页
  产出: app/meal-detail.tsx
  显示: 餐前图、营养数据、反馈数据、回访数据（关联显示）
  功能: 未反馈的餐次可点击"补录反馈"进入feedback页面
  验收: 所有已记录字段正确显示，无null崩溃

T4-03 历史筛选
  产出: 历史页顶部筛选栏
  选项: 全部/早饭/午饭/晚饭/加餐/未打分
  验收: 筛选后列表和日历同步更新

T4-04 体重记录
  产出: components/WeightLogger.tsx
  逻辑: 每次输入追加weight_logs表，显示趋势（↑/↓ kg）
  提醒: 超过7天未录入，profile页顶部显示橙色提醒
  验收: weight_logs表有时序数据，趋势计算正确

T4-05 个人档案页
  产出: app/profile.tsx
  内容: 基础信息（可编辑）、目标（可编辑）、健康背景（多选）、
        餐饮偏好统计、AI接入状态、数据管理
  验收: 所有字段可编辑，修改后profiles表更新

T4-06 数据管理功能
  产出: confirmClearAllData(), confirmDeleteAccount()
  逻辑: 二次确认弹窗，清空本地SQLite + Supabase对应数据
  验收: 清空后meals表为空，注销后auth session失效
```

**Sprint 4 验收标准：** 能找到任意历史餐次的完整数据，体重有时序记录，档案可完整编辑

---

## Sprint 5｜推荐卡与首页逻辑

```
T5-01 规则引擎实现
  产出: services/ai/algorithms/rules.py
  规则集:
    R1: 菜系多样性（近3天出现的菜系降权）
    R2: 忌口硬过滤（profile.avoid中的词命中则排除）
    R3: 健康背景适配（血糖敏感→高GI警告）
    R4: 时段适配（晚饭偏轻食低热量）
    R5: 营养补偿（近7天蛋白质低→高蛋白菜提权）
  验收: 单元测试覆盖5条规则，边界情况通过

T5-02 推荐卡生成接口
  产出: FastAPI POST /v1/insight/generate
  逻辑: 调用rules.py，返回3张推荐卡（含dish/reason/badge）
  验收: 接口返回正确格式，无相同菜系重复

T5-03 首页推荐卡组件
  产出: components/RecoCard.tsx
  功能: 接受/跳过，写入card_actions表
  显示: 菜品名、菜系、推荐原因、营养亮点
  card_actions字段来源:
    dish    ← 推荐卡的菜品名
    badge   ← 推荐卡的营养标签（如'高蛋白'|'轻食'），来自insight接口返回
    risk    ← 推荐卡的风险标签（如'高GI'），来自insight接口返回，无风险时为null
    action  ← 用户操作：'accept'|'skip'
  验收: 接受/跳过后card_actions表有完整记录，badge/risk字段与展示一致，刷新后不重复展示

T5-04 首页状态机
  产出: stores/useMealStore.ts getHomeScene()
  状态:
    DEFAULT     → 显示推荐卡
    PENDING_FB  → 显示待反馈卡（带餐次图片+去打分按钮）
    DONE        → 今日已完成摘要
    CHECKIN_DUE → 回访卡（优先级最高，覆盖其他状态）
  验收: 4种状态切换正确，不出现状态错乱

T5-05 首批洞察生成（7天后）
  产出: FastAPI POST /v1/insight/generate trigger='weekly_first'
  逻辑:
    统计comfort/energy中高频负向信号
    关联对应餐次的cuisine/tags
    生成≤3条文字洞察
  验收: 有7天数据的测试账号首页出现洞察卡片

T5-06 身体拼图初版
  产出: components/BodyPuzzle.tsx（仅1.0数据版）
  显示块（共4块，按顺序，各有独立解锁条件）:
    块0「喜欢吃这个」: 解锁条件 meals_count >= 1（有记录即显示）
      显示反馈好评最多的菜品/标签（comfort=舒服 OR satisfaction=很开心）
      无好评数据时显示「再记录几餐，规律就出来了」
    块1「我的吃法」: 解锁条件 meals_count >= 3
      近期精力/肠胃负向信号汇总，好评率最高的标签，满足感均值
      "这是你的专属吃法，不是通用建议"
    块2「口味探索」: 解锁条件 distinct_cuisines >= 2
      已探索的各菜系，及各菜系"感觉不错"的次数
      → 底部按钮「看我的美食地图 →」跳转到历史页菜系地图Tab
      未解锁时显示：「再探索 N 种新菜系解锁」
    块3「越来越舒服」: 解锁条件 meals_count >= 10
      近7天 vs 首7天舒服率对比，显示改善百分比
      未解锁时显示：「记录到10餐后解锁（还差N餐）」
  整体解锁条件: meals_count >= 7 才显示整个身体拼图区域
  验收:
    - 满7餐后身体拼图区域出现，不足7餐显示解锁进度
    - 各块按自己的解锁条件独立显示/隐藏
    - 「看我的美食地图 →」按钮正确跳转到history页的map视图Tab
    - 数据准确，无null崩溃
```

**Sprint 5 验收标准：** 首页逻辑完整，推荐卡功能可用，7天后出现首条身体洞察

---

## Sprint 6｜稳定性与上线准备

```
T6-01 离线同步机制
  产出: db/sync.ts syncToSupabase()
  逻辑: 网络恢复时批量上传pending队列，冲突用服务端覆盖
  验收: 断网记录3餐，联网后Supabase有完整数据

T6-02 网络状态检测
  产出: 断网时顶部红色横幅，联网后自动消失+toast
  验收: 关闭WiFi出现横幅，开启WiFi横幅消失

T6-03 AI分析失败处理
  产出: 分析失败时显示重试界面（重试/换图/用模拟结果继续）
  验收: 关闭AI服务，拍照后出现错误界面，三个选项均可用

T6-04 性能优化
  产出: FlatList虚拟化历史列表，图片懒加载，数据库查询加索引
  验收: 100条历史记录滚动流畅，首屏加载<2秒

T6-05 Sentry 错误监控
  产出: Sentry初始化，关键catch块上报
  验收: 手动触发测试错误，Sentry Dashboard有记录

T6-06 EAS Build 配置
  产出: eas.json（development/preview/production配置）
  验收: eas build --profile preview 构建成功，APK可在真机安装

T6-07 内测分发
  产出: 通过 EAS Submit 或手动分发APK
  验收: 5台测试设备安装运行，无崩溃
```

**1.0 最终验收标准：**
- [ ] 完整走通：注册→建档→拍照→分析→反馈→回访
- [ ] 7天连续记录后首页出现身体洞察
- [ ] 断网可记录，联网后数据完整同步
- [ ] Android真机稳定运行24小时无崩溃
- [ ] meals表数据完整率>95%（所有字段无意外null）

---

# MVP 2.0 — 计划推荐

**前置：** 用户 complete_meals >= 7
**目标：** 基于1.0数据生成个性化周计划，用户能看到计划vs实际对比
**周期：** 4 Sprint（8周）

## Sprint 7｜偏好模型

```
T7-01 DishScore计算算法
  产出: algorithms/dish_score.py compute_dish_score(user_id)
  逻辑: 按cuisine/tags分组，聚合4维度均值+置信度
  写入: dish_scores表（upsert）
  触发: 每次daily_checkin提交后异步重算
  测试: 5条测试餐次，验证分数计算正确

T7-02 推荐卡算法升级（规则→评分）
  产出: 升级 /v1/insight/generate
  逻辑: 有DishScore时按个人评分排序替代规则排序
  fallback: DishScore置信度<0.3时退回规则引擎
  测试: A/B对比有/无评分时的推荐结果差异

T7-03 营养目标计算
  产出: algorithms/nutrition.py compute_daily_target(profile)
  逻辑: 基于年龄/性别/身高/体重/目标计算TDEE和宏量目标
  写入: nutrition_targets表（每日自动创建）
  测试: 不同profile的计算结果符合营养学标准
```

## Sprint 8｜计划生成

```
T8-01 周计划生成接口
  产出: FastAPI POST /v1/plan/generate
  逻辑:
    Step1: 为7天×3餐每个槽位生成候选菜池
    Step2: 按营养缺口+DishScore+多样性综合评分
    Step3: 选最高分作为推荐，次高分作为备选
  写入: meal_plans + plan_slots表
  测试: 生成计划无重复菜系（同天），满足营养目标

T8-02 计划界面
  产出: app/plan.tsx
  显示: 周视图网格（7天×3餐），每格显示菜品+预测评分
  功能: 长按单格可替换（从备选中选）
  换菜持久化:
    用户选择新菜后 → plan_slots.swapped_to = {dish, reason}
    同步更新界面展示为新菜，原推荐保留在 suggested.alternatives 可查看
  测试: 界面渲染正确；换菜后plan_slots.swapped_to有值；重开App仍显示换后的菜
```

## Sprint 9｜执行追踪

```
T9-01 记录餐次时关联当日计划
  产出: 修改insertMeal()，自动匹配plan_slots
  逻辑: 同日同餐型的plan_slot.executed_meal_id = meal.id
  测试: 记录午饭后plan_slots的executed_meal_id有值

T9-01b 计划执行状态追踪
  产出: 计划页每个槽位显示「吃了 / 换了别的 / 没吃」三选一按钮
  状态写入规则:
    用户记录了匹配的餐次 → execution_status='eaten'（自动，不需要手动操作）
    用户手动换菜并记录 → execution_status='swapped'（自动）
    用户手动点「没吃」 → execution_status='skipped'
  时效: 当天23:59后未操作的槽位 → 自动标记为'skipped'（后台任务）
  测试:
    按计划吃 → 'eaten'，记录页返回计划页后状态更新
    手动点没吃 → 'skipped'
    execution_status用于T10-01周报中的"计划执行率"计算

T9-02 实时营养缺口显示
  产出: 首页或计划页显示当日已摄入vs目标
  数据: 实时累计当日meals的nutrition
  测试: 记录一餐后营养进度条更新
```

## Sprint 10｜洞察报告

```
T10-01 每周身体报告生成
  产出: FastAPI POST /v1/insight/generate trigger='weekly_report'
  触发条件:
    每周一 App 启动时检查，最近7天内有餐次记录 → 生成上周报告
    若 weekly_reports 表中本周已有记录 → 不重复生成
  内容: 计划执行率（execution_status统计）、按计划日vs不按计划日的4维度对比、本周亮点
  写入: weekly_reports表（week_of = 上周一日期，UNIQUE约束防重复）
  测试:
    有7天内餐次记录 → 生成报告
    无数据 → 不生成，不报错
    同一周二次触发 → 返回已有记录，不重写

T10-02 报告界面
  产出: 首页每周一次性展示周报卡片
  测试: 周报内容准确，引用数据和数据库一致
```

**2.0 验收标准：**
- [ ] DishScore随新数据自动更新
- [ ] 周计划7天×3餐生成完整，无重复菜系同天出现
- [ ] 记录后nutrition_targets.consumed实时更新
- [ ] 有2周数据的用户能看到"按计划vs不按计划"对比

---

# MVP 3.0 — 目标干预

**前置：** complete_meals >= 21 AND checkin_rate >= 0.6
**目标：** 用户看到可解释的个人饮食规律，断食/减重干预可用
**周期：** 4 Sprint（8周）

## Sprint 11｜BodyPattern 计算

```
T11-01 相关性计算算法
  产出: algorithms/body_pattern.py compute_body_pattern(user_id)
  逻辑:
    遍历 FEATURES × METRICS 所有组合
    分有/无该特征的两组checkin，计算均值差
    |delta| > 0.25 且 sample >= 3 时保存
    confidence = min(sample_size, 20) / 20
  写入: body_patterns表（upsert，version递增）
  测试: 注入已知相关的测试数据，验证算法检测到正确相关性

T11-02 BodyPattern 触发机制
  产出: checkin提交后检查是否达到3.0解锁条件
  逻辑: 满足条件则异步调用 /v1/pattern/compute
  测试: 第21条带回访记录提交后，body_patterns表有数据

T11-03 规律可视化
  产出: components/BodyPuzzle.tsx 升级版
  显示: 相关性列表（特征→影响，置信度进度条，样本数量）
  解锁标识: 卡片右上角显示"基于X次记录"
  测试: 显示的置信度与数据库一致
```

## Sprint 12｜断食模块

```
T12-01 断食计划生成
  产出: algorithms/fasting.py recommend_fasting(user_id)
  逻辑: 分析avg_meal_gap、体重趋势、肠胃敏感度，推荐合适方案
  方案: 16:8 / 16:8宽松版 / 先建立规律（不适合断食）
  测试: 不同用户特征对应不同推荐方案

T12-02 断食计时界面
  产出: 断食模块页面（进食窗口计时，禁食剩余时间）
  功能: 开始/结束断食，超出窗口提醒
  测试: 计时准确，状态持久化（App重启后恢复）

T12-03 断食状态嵌入拍照流程
  产出: camera.tsx 拍照保存时检查断食状态
  逻辑:
    用户处于断食禁食期 → 拍照保存前弹出确认弹窗：
      「当前在断食中（距结束还有X小时）」
      选项A：「这餐打破断食，结束本次断食」→ 写入断食结束时间，正常保存餐次
      选项B：「只是记录，不结束断食」→ 正常保存，断食状态不变
      选项C：取消
  测试:
    断食中拍照 → 弹窗出现
    选A → 断食状态变为ended，meal正常写入
    选B → 断食状态不变，meal正常写入
    未处于断食期 → 拍照流程无任何额外步骤
```

## Sprint 13｜体重/目标管理

```
T13-01 热量目标动态调整
  产出: 基于goal+weight_trend动态更新nutrition_targets
  逻辑: 减重目标+体重上升→降低热量目标500kcal
  测试: 体重连续3周上升，热量目标自动降低

T13-02 目标偏离干预
  产出: 干预检测逻辑 + 首页提示卡
  触发: 热量连续3天超标 OR 体重趋势反向
  写入: interventions表
  测试: 注入超标数据，interventions表有记录，首页出现提示
```

## Sprint 14｜规律反哺计划

```
T14-01 规律反哺计划生成
  产出: 升级 /v1/plan/generate，消费body_pattern
  逻辑: 排除与已知负向相关性匹配的菜品
  测试: 有"辛辣→肠胃不适"规律的用户，计划中无辛辣菜
```

**3.0 验收标准：**
- [ ] body_patterns表有数据，相关性置信度>0.6
- [ ] 规律可视化界面数据准确
- [ ] 断食模块可正常使用，计时准确
- [ ] 计划生成排除了已知负向关联菜品

---

# MVP 4.0 — 健康整合

**前置：** body_pattern.high_confidence_correlations >= 3
**目标：** 健康数据接入，实现饭前预测，用户能看到多维度健康关联
**周期：** 5 Sprint（10周）

## Sprint 15｜Health Connect 接入

```
T15-01 Android Health Connect 权限
  产出: 申请 READ_SLEEP, READ_STEPS, READ_EXERCISE 权限
  UI: 健康数据授权引导页
  测试: 授权后health_data表能读到睡眠数据

T15-02 健康数据同步
  产出: utils/healthSync.ts 每日同步一次
  写入: health_data表（date唯一）
  测试: 连接Health Connect后，昨天的睡眠/步数有数据
```

## Sprint 16｜全维度身体画像

```
T16-01 健康数据关联展示
  产出: app/insight.tsx 升级
  显示: 饮食+睡眠+运动+体重的关联视图
  示例: "昨晚睡眠差→今天消化评分低"（有数据才显示）
  测试: 注入低睡眠+低消化评分数据，关联提示出现
```

## Sprint 17｜预测引擎

```
T17-01 饭前预测算法
  产出: algorithms/predictor.py predict_meal(user_id, candidate_dish, context)
  逻辑:
    提取候选菜品features（tags[]）
    在body_pattern.correlations中查匹配
    健康数据调节（睡眠差→消化敏感性+0.2）
    多证据聚合（同向增强，反向抵消）
  测试: 已知相关性+候选菜，验证预测方向正确

T17-02 饭前预测展示
  产出: 分析结果页增加预测标签
  显示条件: 有4.0解锁 AND 预测置信度>0.5
  文案: "根据你的X次记录，这类菜后你可能[...]"
  测试: 置信度低时不显示，高时正确显示
```

## Sprint 18｜预测反馈回路

```
T18-01 PredictionAccuracy 计算
  产出: 每次daily_checkin提交后，对比当天的预测记录
  写入: prediction_accuracy表
  更新: body_pattern.correlations中对应项的confidence
  测试: 预测正确时confidence+0.05，错误时-0.08

T18-02 干预频率控制
  产出: 同类干预72小时内不重复触发
  逻辑: 检查interventions表中同类型的最近记录
  测试: 连续触发同类干预，第2次在72小时内不显示
```

## Sprint 19｜全流程仪表盘

```
T19-01 统一健康仪表盘
  产出: app/insight.tsx 完整版
  模块: 今日计划进度、精力趋势、体重趋势、断食状态、预测准确率
  测试: 所有模块数据准确，空数据状态有占位文案
```

**4.0 验收标准：**
- [ ] Health Connect数据同步到health_data表
- [ ] 有足够数据的用户看到跨维度关联（饮食↔睡眠）
- [ ] 饭前预测标签正确显示，置信度<0.5时不显示
- [ ] prediction_accuracy记录存在，confidence随反馈更新

---

# MVP 5.0 — 用户履约

**前置：** 平台用户>=1000 AND 个人预测准确率>=0.65
**目标：** 用户授权后可通过平台购买食材或订阅配餐
**周期：** 6 Sprint（12周）

## Sprint 20｜信任证明

```
T20-01 健康成果报告生成
  产出: 3个月回顾报告页面
  数据: 精力均值变化、体重变化、肠胃改善率、预测准确率
  触发: 使用满90天后首页出现引导
  测试: 有90天数据的账号报告数据准确
```

## Sprint 21-22｜食材采购

```
T21-01 食材清单从计划生成
  产出: algorithms/grocery.py plan_to_grocery_list(plan_id)
  逻辑: 解析plan_slots的菜品→标准食材列表→按类别聚合
  测试: 5菜计划生成正确的食材清单和份量

T22-01 采购接口对接
  产出: 对接第三方生鲜API（具体平台由人类决策D5确定）
  功能: 一键下单，订单状态追踪
  测试: 沙盒环境下单流程完整
```

## Sprint 23-24｜配餐订阅

```
T23-01 配餐方案界面
  产出: 周配餐订阅购买页
  功能: 预览菜单、选择份数、设置配送时间
  测试: 订阅流程完整，数据写入Supabase
```

## Sprint 25-26｜社区层

```
T25-01 CommunityDishProfile 聚合
  产出: 后台定时任务（每日凌晨），聚合所有用户的meal+checkin
  逻辑: 按dish_key分组，按segment（goal+age+health_bg）分层统计
  写入: community_dishes表
  测试: 注入100个不同用户数据，社区评分计算正确

T25-02 协同过滤推荐（冷启动）
  产出: 新用户（<7天数据）使用community_dishes推荐
  逻辑: 按profile匹配最近segment，返回该segment高分菜
  测试: 新注册用户的推荐来自社区数据，有数据来源标注
```

**5.0 验收标准：**
- [ ] 90天回顾报告数据准确
- [ ] 食材清单从计划正确生成
- [ ] community_dishes表有聚合数据
- [ ] 新用户推荐标注"基于与你相似的用户"

---

# 人类必须准备的资源清单

## 开发前必须到位（AI无法自行获取）

| 类别 | 资源 | 获取方式 | 优先级 |
|------|------|----------|--------|
| API密钥 | Anthropic API Key | console.anthropic.com | 🔴 必须 |
| | 写入: `services/ai/.env` 变量名: `ANTHROPIC_API_KEY` | | |
| | OpenAI API Key（仅用于 text-embedding-3-small 向量化营养库） | platform.openai.com | 🔴 Sprint1前 |
| | 写入: `services/ai/.env` 变量名: `OPENAI_API_KEY` | | |
| 后端平台 | Supabase 项目（Project URL / Anon Key / Service Role Key） | app.supabase.com 免费计划可用 | 🔴 必须 |
| | 写入: `apps/mobile/.env` → `SUPABASE_URL` / `SUPABASE_ANON_KEY` | | |
| | Supabase 项目需开启 pgvector 扩展（Dashboard → Extensions → vector） | Supabase Dashboard | 🔴 Sprint1前 |
| 营养数据 | 中国食物成分表开源数据（1000条起步） | github.com/Sanotsu/china-food-composition-data 直接下载CSV | 🔴 Sprint1前 |
| | 备选: phsciencedata.cn（政府数据，免费申请导出） | | |
| | 整理为标准 CSV 格式后放入 `supabase/nutrition_seed/cn_nutrition_db.csv` | 约半天整理工作量 | |
| AI服务部署 | Railway 账号，连接GitHub仓库，设置环境变量 | railway.app 免费计划可用 | 🔴 必须 |
| 推送通知 | Firebase 项目，下载 `google-services.json`，放置 `apps/mobile/` | console.firebase.google.com | 🟡 Sprint3前 |
| 应用发布 | Google Play 开发者账号（一次性 $25） | play.google.com/console | 🟡 Sprint6前 |
| 版本控制 | GitHub 仓库，邀请Codex访问权限 | github.com | 🔴 必须 |

## 开发环境（本地机器）

| 工具 | 版本要求 | 验证命令 |
|------|----------|----------|
| Node.js | 20+ | `node --version` |
| Python | 3.11+ | `python --version` |
| pnpm | 9+ | `pnpm --version` |
| Android Studio | 最新稳定版 | 用于模拟器 |
| EAS CLI | 最新版 | `npm i -g eas-cli` |
| Supabase CLI | 最新版 | `npm i -g supabase` |
| Git | 2.40+ | `git --version` |

## 测试设备

| 设备 | 用途 |
|------|------|
| Android 真机 ≥1台 | 通知测试（模拟器收不到FCM推送） |
| Android 版本 ≥ 10 | Health Connect需要Android 10+ |

## 应用资产

| 文件 | 规格 | 用途 |
|------|------|------|
| `icon.png` | 1024×1024 PNG | App图标 |
| `splash.png` | 1242×2436 PNG | 启动画面 |
| `adaptive-icon.png` | 1024×1024 PNG | Android自适应图标 |

## 决策事项（需要人类确认后AI才能继续）

| 序号 | 决策点 | 影响范围 | 何时需要确认 |
|------|--------|----------|------------|
| D1 | 应用包名（建议：`com.ganfan.app`） | 整个生命周期不可改 | 开发开始前 |
| D2 | Supabase区域（建议：ap-northeast-1） | 数据延迟 | 创建项目前 |
| D3 | FastAPI部署区域（建议：Railway ap-northeast） | AI分析延迟 | Sprint2前 |
| D4 | 2.0食材数据库来源：自建菜品→食材映射表 OR 对接第三方食材API | 数据准确性 | Sprint21前 |
| D5 | 5.0采购平台：美团买菜/叮咚买菜/盒马 | 商务合作 | Sprint22前 |

---

## Seed 数据规范

> 文件：`supabase/seed.sql`，供本地开发和 CI 自动化测试使用。每个验收场景对应一个测试账号。

```sql
-- ══ 测试账号 ═══════════════════════════════════════
-- 使用固定 UUID，方便跨机器复现

-- 账号 A：新用户（0 餐），用于测试 onboarding 流程
INSERT INTO users (id, email) VALUES
  ('00000000-0000-0000-0000-000000000001', 'seed_new@test.com');
INSERT INTO profiles (user_id, age, gender, height_cm, goal, health_background, avoid)
  VALUES ('00000000-0000-0000-0000-000000000001', 28, '女', 165, '越来越舒服', '{}', null);

-- 账号 B：7 餐完整记录（含回访），用于验证身体拼图解锁、首批洞察
INSERT INTO users (id, email) VALUES
  ('00000000-0000-0000-0000-000000000002', 'seed_7meals@test.com');
INSERT INTO profiles (user_id, age, gender, height_cm, goal)
  VALUES ('00000000-0000-0000-0000-000000000002', 32, '男', 175, '越来越舒服');
-- 数据特征：
--   7 条 meals + meal_analysis + meal_feedback + 3 条 daily_checkins（回访率 43%）
--   province 覆盖：四川×3、广东×2、江苏×2（distinct_cuisines=3，口味探索块解锁）
--   comfort 分布：'舒服'×3、'胀气'×2、'有精神'×2

-- 账号 C：21 餐完整记录，回访率 ≥ 60%，用于验证 BodyPattern 解锁
INSERT INTO users (id, email) VALUES
  ('00000000-0000-0000-0000-000000000003', 'seed_21meals@test.com');
INSERT INTO profiles (user_id, age, gender, height_cm, goal)
  VALUES ('00000000-0000-0000-0000-000000000003', 35, '女', 162, '越来越舒服');
-- 数据特征：
--   21 条 meals + 13 条 daily_checkins（回访率 62%）
--   注入已知相关性：
--     川菜/辛辣 → digestion='有点不适'（至少 5 次，形成统计显著性）
--     粤菜/清淡 → digestion='舒适顺畅'（至少 5 次）
--   用于验证 body_pattern.py 检测出"辛辣→肠胃不适"相关性，confidence > 0.4

-- 账号 D：90 天数据，用于验证 5.0 健康成果报告
INSERT INTO users (id, email) VALUES
  ('00000000-0000-0000-0000-000000000004', 'seed_90days@test.com');
-- 数据特征：
--   90 天跨度约 180 条 meals，体重趋势下降（-2kg），
--   前 30 天 comfort 好评率 40%，后 30 天 60%（可计算改善幅度）
```

> seed 中各行的具体字段值由 Codex 在完成 Migration 001 后生成。
> 上方注释说明了**数据特征约束**，Codex 必须满足这些约束才能通过对应 Sprint 的验收。
>
> 执行方式：
> - 本地：`supabase db reset`（自动执行 seed.sql）
> - CI：GitHub Actions 集成测试步骤前执行 `supabase db reset`
> - 生产环境：禁止执行 seed.sql

---

# 算法部署节奏

| 时间 | 算法上线 | 触发方式 |
|------|----------|----------|
| 1.0 Sprint5 | `rules.py` | App请求 `/v1/insight/generate` |
| 2.0 Sprint7 | `dish_score.py` | `daily_checkin`提交后异步触发 |
| 3.0 Sprint11 | `body_pattern.py` | 第21条完整记录提交后异步触发 |
| 4.0 Sprint17 | `predictor.py` | 拍照后，识别完成时触发 |
| 5.0 Sprint25 | `collaborative.py` | 后台定时任务，每日凌晨运行 |

**关键原则：** 算法在FastAPI服务中，App版本升级不影响算法迭代。算法服务独立部署，可热更新，不需要重新发版App。

---

> 本方案设计为 Codex 可独立执行。每个任务有明确输入、输出、验收标准。
> 人类只需完成资源清单中的准备工作，决策事项在对应时间节点确认，AI可不间断地按阶段推进开发。
