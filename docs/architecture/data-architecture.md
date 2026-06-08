# 干饭 · 数据架构

> 本文档是数据层的唯一权威。管：三层数据架构、数据库 Schema、履约智能横向契约、AI 数据复利飞轮。不管：API 接口规范（→ api-architecture.md）、RLS 安全策略（→ security-architecture.md）、TypeScript 类型（→ type-architecture.md）。

---

## 一、定位与边界

### 本文档管什么

- **三层数据架构**：数据源层（Layer 1）/ 洞察引擎层（Layer 2）/ 消费层（Layer 3）的定义、原则、接入规则
- **完整数据库 Schema**：Migration 000–006 全部 SQL，这是产品数据层的核心资产
- **履约智能横向契约**：食物标准身份契约、履约事件契约、任务上下文契约、算法输出契约
- **AI 数据复利飞轮**：飞轮结构、4 条硬约束、按 Phase 的飞轮强度
- **架构污染信号与强制四问**：防止架构腐化的自检工具

### 本文档不管什么

| 关注点 | 归属文档 |
|---|---|
| API 接口定义、请求/响应 Schema | api-architecture.md |
| RLS 策略、用户隔离、加密 | security-architecture.md |
| TypeScript 类型定义、前端类型契约 | type-architecture.md |
| AI Prompt 模板、LLM 调用契约 | ai-service-architecture.md |
| 用例级别的完整设计 | docs/architecture/use-cases/uc-XX-*.md |

### 权威性声明

本节是干饭产品的**唯一数据架构权威定义**。所有 Phase 1–6 的设计、所有新功能新模块的加入、所有 AI 接入点的接入，都必须先回到这张架构上验证位置和接口。**任何绕过本节的"小算法 / 小数据源 / 小洞察"都是架构债，必须立即纠正。**

---

## 二、核心原则

| 原则 | 行业术语 | 在干饭里的实现 | 为什么 |
|---|---|---|---|
| 单一真相源 | Single Source of Truth (SSOT) | 每个数据只在一处写入，所有人引用同一份 | 防止"拼图说一个数字，总结页说另一个"，用户对产品失去信任 |
| 数据不可变 | Immutability | 原值留痕，修改 = 新增一条 correction 记录 | 保留 AI 进化的数据血缘，才能做模型升级前后对比；错误记录本身是有价值的训练信号 |
| 模式可演进 | Schema Evolution | 加字段不破坏旧数据；删字段先废弃再删 | Phase 1 数据在 Phase 4 依然可用；历史用户数据不会因版本升级失效 |
| 数据血缘 | Data Lineage | 任何洞察能 sourceRefs 追到原始 meal_id | 洞察可验证、可审计；AI 消费层引用洞察时有据可查，不是凭空推断 |
| 引擎幂等 | Idempotent | deriveInsights 任意时刻重跑，结果一致 | 算法升级后历史洞察自动迁移，无需数据迁移脚本；任何时刻都能从头重算验证 |
| 隐私设计 | Privacy by Design | RLS 用户级隔离；隐私字段独立加密 | 用户数据天然不可互见，隐私保护不依赖应用层的条件过滤，而是数据库层强制 |
| 横向扩展 | Horizontal Scalability | 加用户加 Phase 不改架构 | 新用户进入、新 Phase 上线都是纯追加，不触碰已有数据和结构 |

---

## 三、架构内容

### 3.1 三层架构

#### 架构总图

```
┌──────────────────────────────────────────────────────────────┐
│  Layer 1: 数据源层（Raw Data）                                │
│  原则：append-only / immutable                               │
│  作用：客观记录"用户做了什么 + AI 看到了什么"                  │
└────────────────────────────┬─────────────────────────────────┘
                             ↓ 派生（不可逆）
┌──────────────────────────────────────────────────────────────┐
│  Layer 2: 洞察引擎层（Insights Engine）                       │
│  原则：idempotent（可重新计算）/ 不持久化为"真相"             │
│  作用：归纳"我们对用户的理解"，每次都从 Layer 1 重新推导      │
└────────────────────────────┬─────────────────────────────────┘
                             ↓ 查询
┌──────────────────────────────────────────────────────────────┐
│  Layer 3: 消费层（Consumer Layer）                           │
│  原则：read-only / 不写洞察                                  │
│  作用：把洞察翻译成用户能感知的内容（文案 / 视觉 / 推荐）      │
└──────────────────────────────────────────────────────────────┘
```

#### Layer 1：数据源层

**所有 Layer 1 表 append-only。** 没有 UPDATE，只有 INSERT。

| Phase | 新增数据源 | 说明 |
|---|---|---|
| 1 | `meals` / `meal_analysis` / `meal_corrections` / `meal_feedback` / `meal_images` / `card_actions` / `profiles` | 餐次主链 + 反馈 + 抽卡 + 档案 |
| 2 | `plans` / `plan_slots` / `plan_executions` / `fulfillment_actions` | 一周计划 + 执行追踪 |
| 3 | `goals` / `goal_progress` / `interventions` | 健康目标 + 干预记录 |
| 4 | `health_signals` (sleep/exercise/glucose/weight/heart_rate) | 健康数据接入 |
| 5 | `purchases` / `shopping_lists` / `meal_prep_logs` / `community_actions` | 履约 + 采购 + 社区 |

**接入规则（每条数据进入 Layer 1 的契约）：**

| 数据类 | 触发时机 | 是否可改 | 留痕规则 |
|---|---|---|---|
| meal_images | 用户拍照 | 不可改 | 永久保留 |
| meal_analysis | AI 识别完成 | 不可改 | 用户修改→写 meal_corrections |
| meal_corrections | 用户修改分析 | 不可改 (append-only) | 每次修改都新增一条 |
| meal_feedback | 用户提交反馈 | 不可改 | 重提交→新增一条 |
| card_actions | 用户抽卡选择 | 不可改 | 每次选择独立记录 |

**存储分层：** 本地 SQLite 离线优先 + Supabase 云端权威。冲突解决：服务端覆盖。

#### Layer 2：洞察引擎层

**唯一的输出契约：**

```typescript
// ── 触发维度（2026-05-29 新增，替换原 triggers: string[]）────────────────
type TriggerDimension = {
  dimension: 'tag'          // meal_analysis.tags 包含某标签
           | 'meal_type'    // 餐次类型：早饭/午饭/晚饭/加餐
           | 'time_slot'    // 进食时段：morning/lunch/dinner/late_night
           | 'scene'        // 就餐场景
           | 'mood'         // 餐前情绪
           | 'fullness'     // 饱腹状态（作为 P1 权重修正，不独立成规律）
           | 'sleep_quality'// Phase 4+：睡眠质量
           | 'hrv'          // Phase 4+：HRV 指标
           | 'plan_slot'    // Phase 2+：计划槽位执行
  value: string
  required: boolean         // true = AND 条件；false = OR 条件
}

type Insight = {
  id: string                    // 稳定哈希，相同 angle 永远同 id
  category: 'preference' | 'avoid' | 'reaction' |
            'fulfillment' | 'health_link'  // Phase 4+ 加新类
  angle: string                 // 可读描述，如"高碳水午饭→困倦"
  triggerDimensions: TriggerDimension[]   // 结构化触发条件（替代原 triggers: string[]）
  triggers: string[]            // 兼容旧字段，保留为 dimension.value 的平铺列表
  outcome?: string              // reaction 类才有
  target?: string               // preference/avoid 类才有
  evidence: {
    sampleSize: number          // 命中样本数
    hitRate: number             // 命中率 0-1
    lastObservedAt: string
    sourceRefs: string[]        // 引用的 meal_id 列表（数据血缘）
    bioSignalRefs?: string[]    // Phase 4+ 预留：health_data id 列表（客观生理证据）
  }
  maturity: 'sparse' | 'forming' | 'mature'
  confidence: number            // 0-1
  confidencePenalty?: number    // AND 条件 ≥ 3 层时的置信度折扣（0-1，乘以 confidence）
  triggerPhase: number          // 该规律最小可激活的 Phase（1-6）；Phase 1 引擎跳过 >1 的规律
  requires: PhaseLevel[]        // 跨 Phase 标注
  computedAt: string
}
```

**maturity 全局统一阈值（不允许各模块自定义）：**

| sampleSize | hitRate | maturity | 含义 |
|---|---|---|---|
| 0-2 | — | `sparse` | 数据不足，不显示 |
| 3-4 | ≥ 50% | `forming` | 形成中，可展示"再记 N 次解锁" |
| ≥ 5 | ≥ 60% | `mature` | 稳定，可作为推荐和预测依据 |

**洞察类别按 Phase 演进：**

| Phase | 新增 category | 说明 |
|---|---|---|
| 1 | preference / avoid / reaction | 食物 × 身体反应 |
| 2 | fulfillment | 计划执行 × 替换偏好 |
| 3 | goal_alignment | 目标偏差模式 |
| 4 | health_link / cross_domain_reaction | 食物 × 健康指标 |
| 5 | fulfillment_obstacle / social | 履约障碍 × 社交模式 |

**部署形态：** Phase 1 客户端 JS 函数；Phase 2+ 服务端 Python 服务，触发式 + 定时双轨。

**关键：引擎幂等。** 永远从 Layer 1 重算，不持久化"中间洞察"。算法升级后历史洞察自动迁移。

**`deriveInsights` 注册式架构（2026-05-29）：**

引擎由一组 `PatternDetector` 组成，每个 detector 独立注册，Phase 升级时纯追加，不改已有 detector：

```typescript
interface PatternDetector {
  id: string
  category: Insight['category']
  triggerPhase: number          // < 当前 phase 才运行
  maxAndDimensions: number      // AND 条件上限，超出自动降级置信度
  detect(meals: Meal[], feedbacks: Feedback[], checkins?: Checkin[]): Insight[]
}
```

**Phase 1 注册的 detector 集合（仅这些在客户端运行）：**

| Detector | 触发维度上限 | 覆盖规律 |
|---|---|---|
| `StructureReactionDetector` | 2 | tags → comfort/satisfaction |
| `TimingReactionDetector` | 2 | time_slot(+meal_type) → comfort |
| `MealTypeStructureDetector` | 2 | meal_type + 最强 tag → comfort |
| `PositivePatternDetector` | 1 | comfort=舒服 OR satisfaction=还不错 → 菜系/结构偏好 |

**Phase 2+ 追加（服务端）：**

| Detector | triggerPhase | 覆盖规律 |
|---|---|---|
| `MoodAmplifierDetector` | 2 | mood × tag 组合 → reaction 放大 |
| `NextDaySignalDetector` | 2 | 晚饭/夜宵 → 次日 meal_feedback 归因（daily_checkins 已废弃） |
| `FulfillmentPatternDetector` | 2 | plan_slot 执行率 → 行为规律 |
| `HealthLinkDetector` | 4 | health_data × food → 生理关联（主观 comfort 被 HRV/血糖校准） |

**AND 条件 ≥ 3 层的规律禁止在 Phase 1 生成**（样本坍塌风险）。

#### Layer 3：消费层

**消费者分两类：**

```
A. AI 消费者（带 prompt 引用 insights）
   - 输入：insights[] 子集 + 上下文
   - 输出：自然语言文案
   - 约束：必须引用 insights 具体条目，不得编造

B. 非 AI 消费者（纯代码读 insights）
   - 输入：insights[] 子集
   - 输出：图标 / 进度条 / 标签 / 数值
   - 约束：直接渲染，不再二次推导
```

**消费者注册规则：** 任何新功能加入消费层前，必须填写"洞察消费契约表"：

| 字段 | 示例 |
|---|---|
| 消费者名 | 总结页洞察模块 |
| 所属 Phase | 1 |
| 消费 insights 子集 | category='reaction' && relevantToMeal(meal) |
| 输出形式 | AI 文案 / 模板 / 进度条 / 标签 |
| 降级策略 | 无 mature 时显示 forming，无 forming 时不显示 |
| 跨 Phase 依赖 | 无 |

#### AI 在架构中的双重角色

**AI 不是单一角色，它在 Layer 1 和 Layer 3 都出现，但 prompt 完全不同：**

| AI 用途 | 位置 | 输入 | 输出 | 是否引用 insights |
|---|---|---|---|---|
| 看图识别食物 | 进入 Layer 1 | 照片 | 结构化菜名/营养 | 不需要 |
| 看图对比剩余 | 进入 Layer 1 | 两张照片 + 食物列表 | 每项消耗百分比 | 不需要 |
| 写饭前建议 | Layer 3 | 当前餐分析 + insights | 自然语言建议 | 必须，不得编造 |
| 写抽卡 reason | Layer 3 | 候选菜 + insights | 一句话推荐理由 | 必须，引用具体洞察 |
| 写总结洞察 | Layer 3 | 本餐 + 相关 insights | 一句话规律陈述 | 必须，数字真实 |

#### 完整数据流转图

```
USER ACTION (拍照 / 反馈 / 修正 / 抽卡选择)
   ↓
AI 生产者（PROMPT_MEAL_ANALYSIS / PROMPT_LEFTOVER_COMPARE）
   ↓ 把原始照片转结构化数据
LAYER 1: 数据源（SQLite + Supabase append-only）
   ↓ 每次新增触发
LAYER 2: 洞察引擎 deriveInsights()
   ↓ 输出 insights[]
LAYER 3: 消费层
   ├─ AI 消费者：insights[] → AI Prompt 上下文 → 文案 → UI
   └─ 非 AI 消费者：insights[] → 代码渲染 → UI
   ↓ 用户感受到价值
USER 继续记录（履约飞轮闭环）
```

---

### 3.2 完整数据库 Schema

#### Migration 000：营养向量库（pgvector）

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

#### Migration 001：1.0 核心表

```sql
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone       TEXT UNIQUE,
  email       TEXT UNIQUE,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE profiles (
  user_id            UUID PRIMARY KEY REFERENCES users(id),
  goal               TEXT DEFAULT '越来越舒服',
  avoid              TEXT,
  daily_budget       INT,                        -- 元/天整数，Onboarding Q3 映射：60元以内→50/60~120→90/120~200→160/200以上→250
  feeling            TEXT,                       -- Onboarding Q4
  eating_style       TEXT,                       -- Onboarding Q5，后台静默标注，档案页不展示
  -- 以下字段已废弃（2026-05-26 ##035），保留列兼容旧数据，新建档不写入
  age                INT,                        -- @deprecated 档案页按需填写，Onboarding 不收集
  gender             TEXT,                       -- @deprecated
  height_cm          NUMERIC,                    -- @deprecated
  health_background  TEXT[] DEFAULT '{}',        -- @deprecated
  reminder_delay_min INT,                        -- @deprecated 推送延迟已固定为 20 分钟，不读取此字段
  updated_at         TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE meal_budget_weights (
  user_id     UUID REFERENCES users(id),
  meal_type   TEXT NOT NULL,   -- '早饭'|'午饭'|'晚饭'|'加餐'
  weight      NUMERIC NOT NULL, -- 0~1，四条权重之和=1
  updated_at  TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, meal_type)
);
-- 初始默认权重（Onboarding Q3 完成后写入）：早饭 0.20 / 午饭 0.35 / 晚饭 0.40 / 加餐 0.05
-- 动态学习算法为 Phase 2+

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
  scene            TEXT,                   -- 就餐场景：'外卖'|'堂食'|'自己做'|'食堂'|'路边摊'|'便利店'|'快餐店'|'其他'；Phase 5 前只用于记录和菜系地图统计，不影响 AI Prompt
  mood             TEXT,                   -- 就餐时的情绪/压力状态，如'压力有点大'|'心情不确'|'平静'
  meal_started_at  BIGINT,                 -- 用户点"开始吃"时的时间戳（ms）
  meal_duration_ms BIGINT,                 -- 进食时长（结束-开始），用于后续节律分析
  from_card        JSONB,                  -- 来源推荐卡信息 {dish, badge, risk, recommendationStage, recommendationStageLabel, recommendationReason, recommendationSources, unlockRequirement, confidenceLevel}；slot/slot_label/card_state 记录在 card_actions 表，不重复写此处
  additionals      JSONB,                  -- 额外加的食物列表 [{name, estimate}]
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


CREATE TABLE card_actions (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                    UUID REFERENCES users(id),
  dish                       TEXT,
  badge                      TEXT,
  risk                       TEXT,
  slot                       TEXT,          -- 槽位 key：'stable' | 'alt' | 'explore'
  slot_label                 TEXT,          -- 槽位显示名：'常规款' | '特别款' | '隐藏款'
  card_state                 TEXT,          -- 用户选择的餐前状态，如'压力有点大'|'很累很困'
  recommendation_stage       TEXT,          -- 推荐阶段 key：'general'|'feedback'|'body_puzzle'|...
  recommendation_stage_label TEXT,          -- 推荐阶段显示名：'通用推荐'|'反馈推荐'|'身体拼图推荐'|...
  recommendation_reason      TEXT,          -- 推荐理由文案（card.reason）
  recommendation_sources     TEXT,          -- 数据来源描述，如'稳定饭后反馈、菜系、场景、吃法规律'
  unlock_requirement         TEXT,          -- 解锁条件描述，如'身体拼图已解锁'
  confidence_level           TEXT,          -- 置信度：'低'|'低到中'|'中'|'中到高'|'高'
  source                     TEXT DEFAULT 'card_draw', -- 'card_draw' | 'homepage'
  action                     TEXT NOT NULL, -- 'accepted'（选择）| 'skipped'（跳过）
  -- 注意：翻牌 'seen' 仅记录在前端 cardStates 本地状态，不写入此表
  ts                         BIGINT NOT NULL
);

-- Row Level Security
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own meals"
  ON meals FOR ALL USING (auth.uid() = user_id);
-- (其余表类似配置)
```

#### Migration 002：2.0 计划表

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

#### Migration 003：3.0 模式表

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

#### Migration 004：4.0 预测表

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
  checkin_id       UUID,                                -- 原 daily_checkins 引用，已废弃，保留字段兼容历史数据
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

#### Migration 005：5.0 履约与社区表

```sql
CREATE TABLE fulfillment_orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id),
  source          TEXT NOT NULL,       -- 'grocery' | 'subscription' | 'partner_redirect'
  channel         TEXT,                -- 美团买菜 / 叮咚买菜 / 盒马 / 配餐合作方等
  status          TEXT NOT NULL,       -- 'clicked' | 'submitted' | 'paid' | 'delivered' | 'cancelled'
  plan_id         UUID REFERENCES meal_plans(id),
  order_payload   JSONB,               -- 平台沙盒订单摘要，不存真实密钥
  total_amount    NUMERIC,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE fulfillment_order_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         UUID REFERENCES fulfillment_orders(id) ON DELETE CASCADE,
  plan_slot_id     UUID REFERENCES plan_slots(id),
  dish_key         TEXT,
  ingredient_key   TEXT,
  sku_key          TEXT,
  name             TEXT NOT NULL,
  quantity         NUMERIC,
  unit             TEXT,
  expected_use_by  DATE,
  created_at       TIMESTAMPTZ DEFAULT now()
);

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

#### Migration 006：6.0 履约智能与食材记忆表

```sql
CREATE TABLE canonical_foods (
  key              TEXT PRIMARY KEY,
  type             TEXT NOT NULL,       -- 'dish' | 'ingredient' | 'sku' | 'meal_kit'
  display_name     TEXT NOT NULL,
  aliases          TEXT[] DEFAULT '{}',
  parent_key       TEXT REFERENCES canonical_foods(key),
  nutrition_item_id UUID REFERENCES nutrition_items(id),
  metadata         JSONB DEFAULT '{}',
  updated_at       TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE food_identity_mappings (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type        TEXT NOT NULL,     -- 'ai_food' | 'plan_dish' | 'partner_sku' | 'nutrition_item'
  source_value       TEXT NOT NULL,
  canonical_food_key TEXT REFERENCES canonical_foods(key),
  confidence         NUMERIC DEFAULT 0,
  verified           BOOLEAN DEFAULT false,
  updated_at         TIMESTAMPTZ DEFAULT now(),
  UNIQUE(source_type, source_value)
);

CREATE TABLE fulfillment_events (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                    UUID REFERENCES users(id),
  event_type                 TEXT NOT NULL,
  object_type                TEXT NOT NULL,
  object_id                  UUID,
  source                     TEXT NOT NULL,
  context_version            TEXT,
  algorithm_decision_id       UUID,
  confidence                 NUMERIC,
  expected_fulfillment_lift  NUMERIC,
  actual_outcome             JSONB,
  metadata                   JSONB DEFAULT '{}',
  created_at                 TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE context_snapshots (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES users(id),
  context_type   TEXT NOT NULL,        -- AnalysisContext / PlanContext / FoodMemoryContext 等
  context_version TEXT NOT NULL,
  payload        JSONB NOT NULL,
  built_from     JSONB DEFAULT '{}',
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE algorithm_decisions (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                    UUID REFERENCES users(id),
  algorithm                  TEXT NOT NULL,
  algorithm_version          TEXT NOT NULL,
  context_snapshot_id         UUID REFERENCES context_snapshots(id),
  object_type                TEXT,
  object_id                  UUID,
  decision                   JSONB NOT NULL,
  confidence                 NUMERIC,
  reasons                    JSONB DEFAULT '[]',
  target_metric              TEXT DEFAULT 'effective_fulfillment_rate',
  expected_fulfillment_lift  NUMERIC,
  fallback                   JSONB,
  created_at                 TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE food_memory_items (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID REFERENCES users(id),
  canonical_food_key     TEXT REFERENCES canonical_foods(key),
  source_order_item_id   UUID REFERENCES fulfillment_order_items(id),
  estimated_remaining_ratio NUMERIC,
  estimated_quantity     NUMERIC,
  unit                   TEXT,
  expiry_risk            TEXT,          -- 'none' | 'soon' | 'expired' | 'unknown'
  confidence             NUMERIC DEFAULT 0,
  last_inferred_at       TIMESTAMPTZ,
  updated_at             TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE food_memory_events (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES users(id),
  food_memory_item_id UUID REFERENCES food_memory_items(id),
  event_type          TEXT NOT NULL,     -- 'created' | 'inferred_consumed' | 'expired' | 'corrected' | 'replenished'
  related_meal_id     UUID REFERENCES meals(id),
  related_plan_slot_id UUID REFERENCES plan_slots(id),
  related_order_item_id UUID REFERENCES fulfillment_order_items(id),
  delta               JSONB,
  confidence          NUMERIC,
  source              TEXT NOT NULL,     -- 'system' | 'weekly_report_correction' | 'order'
  created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE meal_ingredient_links (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID REFERENCES users(id),
  meal_id              UUID REFERENCES meals(id),
  canonical_food_key    TEXT REFERENCES canonical_foods(key),
  food_memory_item_id   UUID REFERENCES food_memory_items(id),
  estimated_used_ratio  NUMERIC,
  confidence            NUMERIC,
  source                TEXT NOT NULL,   -- 'vision' | 'plan_match' | 'food_memory_inference'
  created_at            TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE weekly_fulfillment_reports (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES users(id),
  week_of        DATE NOT NULL,
  fulfillment_stats JSONB NOT NULL,
  food_memory_summary JSONB DEFAULT '{}',
  corrections    JSONB DEFAULT '[]',
  next_week_strategy JSONB DEFAULT '{}',
  created_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, week_of)
);
```

---

### 3.3 履约智能横向契约

以下契约贯穿 MVP 1.0–6.0。它们不是单独页面，而是让记录、计划、预测、采购、配餐、会员和 6.0 食材记忆形成同一条履约率优化链。

#### 食物标准身份契约

AI 识别、计划菜品、采购 SKU、配餐套餐和营养库必须逐步映射到统一食物身份，避免 6.0 才发现"吃了什么"和"买了什么"无法相连。

| 身份 | 说明 | 示例 |
|---|---|---|
| `dish_key` | 菜品或组合餐身份 | `tomato_egg`, `chicken_salad` |
| `ingredient_key` | 原材料身份 | `egg`, `tomato`, `chicken_breast` |
| `sku_key` | 履约平台商品身份 | `hema_egg_10pcs` |
| `nutrition_item_id` | 营养库标准项 | `nutrition_items.id` |
| `meal_ingredient_link` | 某餐可能消耗的原材料 | 一餐番茄炒蛋消耗鸡蛋、番茄 |

V1 只要求覆盖高频食材和履约 SKU；不追求全量配方和克重精确，优先服务计划执行、采购转化和配餐优化。

#### 履约事件契约

所有关键动作都写入统一事件链。事件不是为了埋点好看，而是为了回答：这个动作是否提高了下一次履约率。

```text
推荐生成 -> 用户查看 -> 接受 / 替换 / 跳过 -> 采购 / 配餐 / 会员 -> 实际记录 -> 饭后反馈 -> 周报纠错 -> 下一轮优化
```

每条事件至少包含：

- `user_id`
- `event_type`
- `object_type`
- `object_id`
- `source`
- `confidence`
- `expected_fulfillment_lift`
- `actual_outcome`
- `created_at`

#### 任务上下文契约

不允许把所有用户数据塞进一个超大 prompt。每个关键动作由 `context_composer` 组装最小必要上下文。

| 动作 | 上下文 | 用途 |
|---|---|---|
| 拍照分析 | `AnalysisContext` | 识别这一餐，给即时建议 |
| 生成周计划 | `PlanContext` | 生成更可能执行的计划 |
| 饭前预测 | `PredictionContext` | 判断这餐后可能的身体反应 |
| 采购跳转 | `PurchaseContext` | 判断推荐买什么、为什么现在买 |
| 配餐订阅 | `SubscriptionContext` | 判断几餐、什么类型、什么频率最容易履约 |
| 记录餐次 | `MealExecutionContext` | 判断是否命中计划、是否完成履约 |
| 食材记忆 | `FoodMemoryContext` | 推断已购食材剩余、消耗和置信度 |
| 周报生成 | `WeeklyReportContext` | 复盘本周履约、纠错、训练下周策略 |
| 会员转化 | `MembershipContext` | 判断是否展示会员价值和如何降打扰 |

#### 算法输出契约

所有算法输出必须是结构化、可回放、可评估的决策结果，而不是只返回文案。

每个算法决策至少包含：

- 输入上下文版本：`context_version`
- 决策对象：`object_type` / `object_id`
- 决策结果：`decision`
- 置信度：`confidence`
- 原因：`reasons[]`
- 目标指标：`target_metric`
- 预期履约提升：`expected_fulfillment_lift`
- 降级策略：`fallback`

大模型负责解释和表达，算法层负责事实、评分、约束、置信度和履约率优化。

---

### 3.4 AI 数据复利飞轮

干饭的核心增长引擎不是单一算法，而是 AI 在数据架构两端同时受益形成的复利循环。这是产品"用得越久越值钱"的结构性原因。

#### 飞轮结构

```
USER 拍照 / 反馈
     ↓
AI 生产者 (Layer 0→1) — 看图 → 结构化数据
     ↓
LAYER 1 原始数据累积 + 用户修正
     ↓
LAYER 2 洞察引擎 (deriveInsights) — 归纳跨餐规律
     ↓
AI 消费者 (Layer 2→3) — 拿洞察作 context 生成更准的建议
     ↓
USER 感受到"AI 真的懂我"
     ↓
更愿意记录、更精细反馈
     ↓
（回到 AI 生产者，但样本更多、修正更准、洞察更熟）
↓ 整个链条同步升级 ↓
```

每转一圈，AI 在两个位置同时变强：
- 生产端：见过的样本更多 + 用户修正更多 → 识别更准
- 消费端：洞察 maturity 推进 → 建议更个性化

#### 飞轮的免疫系统：用户修正

**没有用户修正，AI 错误会指数级放大**。识别错的菜 → 错的标签进 Layer 1 → 归纳出错的洞察 → AI 消费基于错洞察给错建议 → 用户反感离开。

用户修正是这条链路的守门员。它必须满足：
- `meal_corrections` 表 append-only（不覆盖原 AI 输出，留痕）
- `deriveInsights` 优先使用修正后的真相
- 修正频次本身是数据（高频修正 = AI 这块需训练）

#### 飞轮成立的 4 条硬约束

| 约束 | 详细要求 | 违反后果 |
|---|---|---|
| **1. AI 生产数据必须 append-only** | 第二次识别新增一条，不覆盖第一次 | 失去 AI 进化的数据血缘，无法做模型升级前后对比 |
| **2. 用户修正必须独立成表** | `meal_corrections` 与 `meal_analysis` 解耦，每次修正新增一条 | 无法分析 AI 错误模式，无法做模型评估 |
| **3. deriveInsights 用修正后的真相** | 优先 corrections 最新值，回落原 analysis | 洞察基于 AI 误识，下游全错 |
| **4. AI 消费 Prompt 必须标注洞察来源** | "基于 N 次记录、命中率 M%（≥阈值才使用）"作为 prompt 上下文，禁止 AI 编造洞察 | AI 自由发挥 → 与拼图/总结页结论冲突 |

#### 飞轮在 5 个 Phase 的强度

| Phase | 飞轮转速 | 关键数据 |
|---|---|---|
| 1 | 启动 | 餐次 + 反馈 + 修正 累积 |
| 2 | 加速 | + 计划执行（用户用脚投票） |
| 3 | 校准 | + 体重/围度（硬证据校准 AI） |
| 4 | 突破 | + 健康信号（生理证据校准主观反馈） |
| 5 | 自维持 | + 履约模式（场景因素纳入推理） |

**Phase 4 是飞轮的拐点**：从主观反馈系统升级为客观+主观双校准系统，AI 消费端的预测能给精确时间点（如"14:30 困倦"）。Phase 4 之前的预测应保守（只给方向，不给时间）。

#### 设计判断标准

当任何功能/Prompt/UI 决策不确定时，回到这个原则：

> **它让飞轮转得更快还是更慢？变快保留，变慢推回。**

- 让用户多答一题 → 飞轮变慢（降履约）
- 让 AI 自由发挥 → 飞轮变慢（错误放大）
- 让用户修正 AI → 飞轮变快（增加真相输入）
- 让洞察被 AI 引用 → 飞轮变快（消费端升级）

---

### 3.5 架构污染信号自检清单

发现任何一条立刻还债：

| 信号 | 污染类型 |
|---|---|
| 同一个判断逻辑出现在两个文件 | 单一真相源被打破 |
| 消费层直接读 Layer 1（绕过洞察引擎） | 层级被穿透 |
| 加新功能要改 Layer 1 表结构 | Schema 演进违反"加而不改" |
| 洞察的统计阈值在不同模块不一致 | 引擎实现不统一 |
| AI Prompt 里有硬编码的用户规律 | AI 越权产生洞察 |
| 同一 angle 在拼图和总结页结论不一致 | 多套引擎并存 |

#### 新功能进入架构的强制四问

每次有人提"加个 XXX 功能"，PM / 架构师必须先问完这 4 个问题，答不上来就不许做：

1. **数据源层**：是否需要新增数据？需要的话用户成本多大？
2. **洞察引擎**：这个功能需要的洞察当前 maturity 够吗？不够要等多少数据？
3. **消费层**：这个功能是 AI 消费者还是非 AI 消费者？现有架构能不能直接插入？
4. **跨 Phase 依赖**：是否依赖未来 Phase 的数据？如果是，Phase 1 怎么降级？

---

## 四、Phase 演进

### Phase 1：核心记录层（Migration 000 + 001）

**激活的表：**
- `nutrition_items`（向量营养库，上线前预填 1000 条）
- `users` / `profiles` / `meal_budget_weights`
- `meals` / `meal_analysis` / `meal_corrections` / `meal_feedback` / `meal_images`
- `card_actions`
- `weight_logs`

**洞察引擎：** 客户端 JS，仅运行 4 个 Phase 1 detector（StructureReaction / TimingReaction / MealTypeStructure / PositivePattern）

**飞轮状态：** 启动期，数据累积阶段，maturity 大部分 sparse→forming

**Schema 约束：** 所有写入 append-only；profiles 废弃字段不写入新用户

---

### Phase 2：计划与执行层（Migration 002）

**新增表：** `meal_plans` / `plan_slots` / `dish_scores` / `nutrition_targets`

**洞察引擎升级：** 服务端 Python 追加 `MoodAmplifierDetector` / `NextDaySignalDetector` / `FulfillmentPatternDetector`

**新增 Insight category：** `fulfillment`（计划执行 × 替换偏好）

**飞轮加速：** 计划执行数据（用户用脚投票）开始喂入洞察引擎

---

### Phase 3：模式与目标层（Migration 003）

**新增表：** `body_patterns` / `weekly_reports`

**新增 Insight category：** `goal_alignment`（目标偏差模式）

**飞轮校准：** 体重/围度作为硬证据，开始校准主观反馈

---

### Phase 4：健康信号层（Migration 004）

**新增表：** `predictions` / `prediction_accuracy` / `interventions` / `health_data`

**洞察引擎升级：** 追加 `HealthLinkDetector`，HRV/血糖开始校准主观 comfort

**新增 Insight category：** `health_link` / `cross_domain_reaction`

**飞轮拐点：** 从主观系统升级为客观+主观双校准；AI 预测可精确到时间点

---

### Phase 5：履约全链路层（Migration 005）

**新增表：** `fulfillment_orders` / `fulfillment_order_items` / `community_dishes` / `user_similarity` / `professional_templates` / `contributions`

**新增 Insight category：** `fulfillment_obstacle` / `social`

**飞轮自维持：** 履约模式（场景因素）纳入推理，社区协同过滤开始工作

---

### Phase 6：履约智能全栈（Migration 006）

**新增表：** `canonical_foods` / `food_identity_mappings` / `fulfillment_events` / `context_snapshots` / `algorithm_decisions` / `food_memory_items` / `food_memory_events` / `meal_ingredient_links` / `weekly_fulfillment_reports`

**核心能力：**
- 食物标准身份统一（dish_key / ingredient_key / sku_key 三层打通）
- 食材记忆推断（剩余量 / 到期风险 / 消耗推断）
- 算法决策全链路可回放、可评估
- context_snapshots 保证每次 AI 调用的上下文版本化

---

## 五、禁止事项

以下行为违反数据架构核心原则，任何 PR 包含此类改动必须拒绝：

### 5.1 数据写入禁区

| 禁止行为 | 违反原则 | 正确做法 |
|---|---|---|
| UPDATE meal_analysis 覆盖 AI 输出 | append-only / 数据不可变 | 新增一条 meal_corrections 记录 |
| UPDATE meals 修改已记录餐次核心字段 | append-only | 新增 correction，前端读最新 correction 值 |
| 删除任何 Layer 1 表的历史行 | 数据不可变 | 加 is_deleted 软删除标记（仅 UI 层过滤） |
| 直接写 AI 自由生成的"洞察"到 Layer 1 | AI 越权 | 洞察只从 deriveInsights 引擎派生 |

### 5.2 查询禁区

| 禁止行为 | 违反原则 | 正确做法 |
|---|---|---|
| 消费层（UI / AI Prompt）直接读 Layer 1 表做聚合推断 | 层级被穿透 | 通过 deriveInsights → insights[] 消费 |
| 在多个模块各自实现 maturity 阈值 | 引擎实现不统一 | 统一使用全局 maturity 阈值表，不允许各模块自定义 |
| AI Prompt 硬编码用户历史规律（如"你以前不喜欢辣"） | AI 越权产生洞察 | 必须引用 insights 具体条目，标注 sampleSize 和 hitRate |

### 5.3 Schema 演进禁区

| 禁止行为 | 违反原则 | 正确做法 |
|---|---|---|
| 删除 Layer 1 字段（哪怕已废弃） | Schema 演进违反"加而不改" | 加 @deprecated 注释，保留列，新建档不写入 |
| 在 Layer 1 加字段强制回填旧数据 | 破坏历史数据稳定性 | 新字段 DEFAULT NULL，旧数据留空 |
| 修改 maturity 阈值未同步全局配置 | 引擎实现不统一 | 修改必须更新全局阈值表并同步本文档 |

### 5.4 飞轮保护禁区

| 禁止行为 | 违反后果 |
|---|---|
| 覆盖写 AI 识别结果（不留原值） | 失去 AI 进化数据血缘，无法评估模型升级效果 |
| AI 消费 Prompt 不标注洞察来源 | AI 自由发挥，与其他模块结论冲突，用户失去信任 |
| 洞察 confidence 低于阈值仍推送给 AI 消费 | 基于不稳定洞察给建议，用户感受到"AI 说错了" |

---

## 六、变更记录

| 日期 | 任务编号 | 变更 |
|---|---|---|
| 2026-06-03 | ##045 | 初版落盘，从蓝图 L177-L490 / L786-L858 / L1032-L1533 迁出 |
