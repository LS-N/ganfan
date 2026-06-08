# 干饭 · 接口架构

> 管：所有 API/接口契约、MCP Server 设计、capability 清单。不管：RLS 与 OAuth 实现（→ security-architecture.md）、Prompt 设计（→ model-architecture.md）。

---

## 一、定位与边界

本文档是干饭项目接口层的唯一权威来源，覆盖：

- 内部 AI Service API（FastAPI `/v1` 路由）与 Supabase 调用规范
- MCP Server 对外 capability 清单与 OAuth scope 定义
- Webhook 回调接口（Phase 5+ 配送平台）
- UserContext / TaskContext 子契约

不覆盖以下内容（见对应专题文档）：

- Row Level Security 策略、OAuth 实现细节 → `security-architecture.md`
- Prompt 模板、LLM 调用策略、fallback prompt → `model-architecture.md`
- Use Case 详细契约 → `docs/architecture/use-cases/uc-0x-*.md`

---

## 二、核心原则

### 1. 内外能力同源

App 内 UI 调用的接口和外部 Agent（MCP Client）调用的接口必须是同一套 capability API。

**为什么**：若为 App 专设私有路由、再为 MCP 暴露公开路由，两套契约必然漂移，维护成本 10 倍增长，且无法保证外部 Agent 能力与 App 能力等价。行业经验：等 App 做完再回头抽 API，代价是彻底重写。

### 2. Capability-first

先设计对外能力边界，再向内实现。即：在写第一行 FastAPI 路由之前，先确认该能力的 MCP capability 名称、输入输出、OAuth scope。

**为什么**：能力边界一旦在内部实现后再对外抽象，会产生内部概念泄漏（如 `meal_analysis_v2_internal`），对外接口变得不稳定。Phase 1 联调起就预留 capability 形状，Phase 2 上线 MCP 时零改动。

### 3. 不暴露 Layer 1

对外 capability 只暴露 Layer 3 摘要（结构化洞察、推荐结果、周报摘要），不暴露 Layer 1 原始数据（`meal_images`、原始 `meal_analysis` JSON、用户修正记录）。

**为什么**：Layer 1 含隐私原始信号，暴露给外部 Agent 违反最小授权原则，且增加用户信任风险。外部 Agent 需要的是「能吃什么」「本周吃得怎样」，不需要原始图片或逐条记录。

### 4. 接口契约稳定

已发布的 capability（进入 Phase 2+）不可进行破坏性变更（字段删除、类型变更、语义反转）。演进方式：新增 capability 版本（`analyze_meal_v2`）或新增可选字段，保留旧版本至少一个 Phase 周期。

**为什么**：MCP Client（Siri / ChatGPT Plugin / 第三方 Agent）依赖 capability 契约，破坏性变更会导致外部生态静默错误，难以排查，且损害干饭作为能力提供商的信誉。

### 5. OAuth scope 显式

每个对外 capability 必须有对应的最小 OAuth scope，禁止使用 `*` 通配，禁止一个 scope 覆盖读写混合权限。

**为什么**：用户在通用 AI 助理中授权干饭能力时，能看到精确的权限说明（「读取本周饮食洞察」而非「访问所有数据」），降低授权摩擦，符合 Apple / Google 生态的最小授权审核要求。

---

## 三、架构内容

### 3.1 接口分层

```
┌─────────────────────────────────────────────────────┐
│  Layer A：内部 API（Mobile ↔ FastAPI ↔ Supabase）    │
│  POST /v1/uc/{uc_name}  （唯一业务路由）              │
│  GET  /v1/uc            （元数据自检）                 │
│  POST /v1/fulfillment/event                          │
│  POST /v1/food-memory/infer                          │
│  POST /v1/fulfillment/optimize                       │
├─────────────────────────────────────────────────────┤
│  Layer B：对外 Capability API（MCP Server）           │
│  analyze_meal / recommend_meal / check_body_insight  │
│  log_meal_feedback / query_nutrition / get_weekly_report │
│  OAuth scope 颗粒度：meal:read / meal:write / insight:read / public │
├─────────────────────────────────────────────────────┤
│  Layer C：Webhook（Phase 5+ 配送回调）                │
│  POST /webhook/delivery/event  （美团/饿了么/配餐平台）│
└─────────────────────────────────────────────────────┘
```

三层之间的关系：Layer B capability 调用 Layer A 内部路由完成实际业务；Layer C 触发 `POST /v1/fulfillment/event` 写入履约事件。内外能力同源原则保证 Layer A 和 Layer B 不分裂。

### 3.2 内部 API 路径

> **重要变更（2026-05-27）**：原 `/v1/meal/analyze`、`/v1/insight/generate`、`/v1/plan/generate`、`/v1/pattern/compute`、`/v1/predict/meal` 等独立路由**全部废弃**，统一收敛到 `POST /v1/uc/{uc_name}`。下方列出现行有效路由及历史映射关系。

#### 现行有效路由

```
POST /v1/uc/{uc_name}                              ← 唯一业务路由
  Request:  匹配对应 UC 的 context_schema (Pydantic)
  Response: 匹配对应 UC 的 response_schema
  Timeout:  按 UC 自身声明（UC-01 25s / UC-02 15s / UC-03 20s / UC-05 同步）
  Fallback: 调 UC.fallback() 返回结构化兜底响应

GET /v1/uc                                          ← 元数据自检
  Response: 所有已注册 UC 的元数据列表（name / version / layer / requires_*）
  用途: App 启动时对比客户端注册的 UC，发现版本错配立即报警

POST /v1/fulfillment/event
  Request:  { user_id: str, event_type: str, object_type: str, object_id?: str, metadata?: dict }
  Response: { event_id: str }
  用途: 记录计划、点击、采购、配餐、会员、反馈、复购等履约动作

POST /v1/food-memory/infer
  Request:  { user_id: str, week_of?: str, context_snapshot_id?: str }
  Response: { items: FoodMemoryItem[], events: FoodMemoryEvent[], confidence: float }
  Requires: 5.0 履约订单 + 1.0 餐次记录 + 食物身份映射

POST /v1/fulfillment/optimize
  Request:  { user_id: str, week_of: str, context_snapshot_id?: str }
  Response: { next_week_strategy: dict, expected_fulfillment_lift: float, decisions: AlgorithmDecision[] }
  用途: 6.0 将食材记忆、计划执行、订单和周报纠错反哺下一轮计划/采购/配餐/会员
```

#### 历史路由映射（废弃，仅作理解原设计意图）

| 历史路由 | 现收敛到 | 详细契约 |
|---|---|---|
| `POST /v1/meal/analyze` | UC-01 `meal_analysis` | `docs/architecture/use-cases/uc-01-meal-analysis.md` |
| `POST /v1/insight/generate` | UC-02 `body_insight`（Phase 1）| `docs/architecture/use-cases/uc-02-body-insight.md` |
| `GET /v1/nutrition/search` | UC-05 `nutrition_match` | `docs/architecture/use-cases/uc-05-nutrition-match.md` |
| `POST /v1/plan/generate` | Phase 2+ 新增 UC `plan_generate` | 待创建 |
| `POST /v1/predict/meal` | Phase 4+ 新增 UC `meal_predict` | 待创建 |
| `POST /v1/pattern/compute` | 客户端 `deriveInsights()` 本地算法，不是 LLM 调用 | — |
| `POST /v1/context/compose` | 各 UC 自己的 `buildContext()` | — |

### 3.3 UserContext 与 TaskContext 子契约

#### UserContext 结构（个人上下文包，共享字段集合）

```json
{
  "profile": { "goal": "", "avoid": null, "daily_budget": 90, "feeling": null },
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

> **约束**：禁止把上方完整包原样塞入所有 prompt。`UserContext` 只是共享字段集合，实际调用必须由 `context_composer` 按任务生成轻量上下文（见下方 8 类 TaskContext）。

#### 8 类 TaskContext 清单

| TaskContext 类型 | 包含字段 | 对应 UC |
|---|---|---|
| `AnalysisContext` | 档案、忌口、最近 5 餐、修正历史 | UC-01 meal_analysis |
| `PlanContext` | 目标、营养缺口、DishScore、身体规律、近期吃腻程度、履约率摘要 | UC-03 plan_generate（Phase 2+）|
| `PredictionContext` | 候选菜、身体规律、健康数据、预测准确率 | UC meal_predict（Phase 4+）|
| `PurchaseContext` | 计划食材缺口、预算、转化历史、履约渠道状态 | 履约类 UC |
| `SubscriptionContext` | 计划执行率、外卖/配餐倾向、预算、取消/跳过原因 | 会员类 UC |
| `FoodMemoryContext` | 履约订单、订单项、计划槽位、实际餐次、食材映射、历史食量 | food-memory/infer |
| `WeeklyReportContext` | 本周事件汇总、计划执行、交易、食材记忆和纠错候选 | UC-02 body_insight（周报模式）|
| `MembershipContext` | 高价值功能使用、付费触发、打扰频控和续费风险 | 会员付费 UC |

### 3.4 MCP Server 对外能力清单（P1 F6）

> Phase 1 不实现完整 MCP Server，但以下 capability 的接口边界、输入输出、OAuth scope 在 Phase 1 联调时必须已设计完毕，预留在 FastAPI 路由中。

| Capability | 输入 | 输出 | OAuth scope | 解锁 Phase |
|---|---|---|---|---|
| `analyze_meal` | `photo_url`, `user_token` | 营养结构化 + 健康建议（Layer 3 摘要） | `meal:write` | Phase 1 |
| `recommend_meal` | `state`, `user_token` | 三张抽卡推荐结果 | `meal:read` | Phase 1 |
| `check_body_insight` | `user_token` | 身体拼图摘要（≥7 餐解锁） | `insight:read` | Phase 1（≥7 餐解锁）|
| `log_meal_feedback` | `meal_id`, `feedback`, `user_token` | confirmation | `meal:write` | Phase 1 |
| `query_nutrition` | `dish_name` | 营养库查询结果（公开数据库） | `public` | Phase 1 |
| `get_weekly_report` | `user_token`, `week_of` | 周报摘要（Layer 3） | `insight:read` | Phase 3 |

**字段说明**：

- `user_token`：用户在干饭 App 完成注册后颁发的 OAuth access token，外部 Agent 必须携带此 token 才能调用需要用户身份的 capability（Spotify 绑定模式）。
- `state`：当前用户场景状态，含时段、近期偏好信号，由 MCP Client 组装传入。
- `feedback`：用户对一餐的满意度信号（`liked / disliked / skipped`）。
- 输出均为 Layer 3 摘要，不含原始 `meal_images`、逐条 `meal_analysis`、`correction_history`。

### 3.5 Spotify 绑定模式

用户必须先在干饭 App 完成注册，才能在通用 AI 助理（Siri / ChatGPT / Apple Intelligence）中调用干饭能力。

绑定流程：

1. 用户在 App 内「连接外部助理」入口发起 OAuth 授权流程
2. 用户选择授权的 scope（如 `meal:read`、`insight:read`）
3. App 颁发 access token，外部助理存储并在后续 MCP 调用中携带
4. MCP Server 校验 token，按 scope 决定 capability 可访问范围

**设计意图**：

- capability 返回结果（推荐、洞察、报告），但账号和数据归属仍在干饭 App
- 通用助理无法绕过干饭 App 直接读取用户原始数据
- 类比：在 Siri 里说「播放周杰伦」，播放历史和会员仍归 Spotify 所有

**与履约飞轮的关系**：MCP 不是飞轮的替代，是飞轮的扩散通道。用户主流量仍来自 App 直接获客；MCP 是「让外部 Agent 帮干饭触达没听过本产品的人」的渠道，两者收益不冲突。

### 3.6 Phase 1 工程约束

- **不实现完整 MCP Server**：Phase 1 联调目标是内部 API 通路跑通，MCP Server 是 Phase 2 的工作。
- **FastAPI 路由必须按 MCP 协议规范设计接口边界**：capability 的 request/response schema 在 Phase 1 就以 Pydantic 模型定义好，Phase 2 上 MCP 时直接复用，零重构。
- **内外能力同源**：`POST /v1/uc/meal_analysis` 和 MCP capability `analyze_meal` 必须共用同一个 Use Case 实现，不允许分叉。
- **OAuth scope 从第 1 天就定义**：即使 Phase 1 没有外部调用方，scope 枚举值必须在代码库中存在（`scopes.py` 或等价文件），避免后期补定义时引发契约不一致。
- **禁止暴露 Layer 1**：Phase 1 的内部 API 返回结构中，凡涉及对外 capability 的响应字段，必须已经是 Layer 3 摘要格式，不能等 Phase 2 才做「脱敏处理」。

---

## 四、Phase 演进

| Phase | 接口层里程碑 |
|---|---|
| **Phase 1** | 内部 API 联调通路跑通（`/v1/uc/{uc_name}` + 履约事件路由）；MCP capability 接口边界已设计（Pydantic schema 落盘），OAuth scope 枚举定义完毕，**不实现 MCP Server** |
| **Phase 2** | MCP Server 实现并上线 `analyze_meal` / `recommend_meal` 两个 capability；App 内「连接外部助理」OAuth 授权流程上线 |
| **Phase 3** | 补齐 `check_body_insight` / `log_meal_feedback` / `query_nutrition` / `get_weekly_report` capability；MCP capability 版本化机制建立 |
| **Phase 4** | `PredictionContext` 类 capability 上线（依赖健康数据接入）；`meal_predict` UC 发布对应 MCP capability |
| **Phase 5+** | Webhook 回调接入外卖/配送平台（Layer C 正式启用）；`fulfillment/optimize` 与配送平台事件联通 |

---

## 五、禁止事项

- **禁止为 App 专设私有路由再为 MCP 另设公开路由**：必须内外能力同源，共用同一 Use Case 实现
- **禁止 MCP 对外暴露 Layer 1 原始数据**：包括 `meal_images`、原始 `meal_analysis` JSON、`correction_history` 逐条记录
- **禁止 OAuth scope 使用 `*` 通配**：每个 capability 必须对应精确的最小 scope
- **禁止把 MCP Server 设计推迟到 Phase 5+ 才启动**：接口边界必须在 Phase 1 联调时就已定义
- **禁止破坏性变更已发布 capability**：字段删除、类型变更、语义反转均属破坏性变更，必须通过新版本 capability 演进
- **禁止完整 UserContext 包直接塞入 prompt**：必须由 `context_composer` 按任务类型生成对应 TaskContext

---

## 六、变更记录

| 日期 | 任务编号 | 变更 |
|---|---|---|
| 2026-06-03 | \#\#045 | 初版落盘，从蓝图 L1534-L1628 迁出内部 API 规范 + MCP 形态战略（L25-L51）+ 新增 MCP capability 清单（P1 F6 落地）|
