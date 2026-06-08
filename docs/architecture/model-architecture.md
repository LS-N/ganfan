# 干饭 · 模型架构

> 管：AI Provider 抽象 / Use Case 注册 / Prompt 版本化 / Context Composer / 评估 / 降级。不管：AI 调用成本监控（→ observability.md）、业务算法实现（→ 业务代码）。

---

## 一、定位与边界

本文档是干饭产品 **AI 服务层的唯一权威定义**。所有 LLM 调用接入点、Prompt 模板、Context 契约、Response Schema、Provider 切换、降级策略，都必须先回到本文档对齐。**任何绕过本文档的"临时 AI 调用 / 散落 Prompt / 自定义 Context"都是架构债，必须立即纠正。**

**本文档管辖范围：**

| 管辖 | 不管辖 |
|---|---|
| AI Provider 抽象层 | AI 调用成本监控（→ observability.md）|
| Use Case 注册与路由 | 业务算法具体实现（→ 业务代码）|
| Prompt 模板与版本化 | 数据库表结构（→ data-architecture.md）|
| Context Composer（TaskContext 组装）| 前端组件（→ 前端代码）|
| 评估指标与降级策略 | 部署与运维（→ infrastructure.md）|

**交叉引用：**

- 单个 UC 的完整契约 → `docs/architecture/use-cases/uc-XX-*.md`
- 新增 UC 的标准流程 → `docs/architecture/use-cases/README.md`
- 文档分层与改动归属决策规则 → `AGENTS.md`「文档分层与改动归属」章节
- 各阶段 UC 实施清单 → `docs/phases/phase-X-*.md`「本阶段 AI UC 实施清单」节

---

## 二、核心原则

1. 算法决定「选什么」，AI 解释「为什么和怎么做」
2. Prompt 必须引用 Insight，不得编造用户规律
3. 所有 AI 调用必须记录 algorithm_decisions（可回放可评估）
4. 每份 Prompt 必须有 prompt_version 字段
5. Context 必须用 TaskContext Composer 组装最小必要上下文，禁止把完整 UserContext 塞进所有 prompt

---

## 三、架构内容

### 3.1 AI 服务层架构

```
UI 层               React Native screens / components
App 逻辑层          Zustand stores / hooks / 状态机
AI 服务层 ◄────── 本文档定义
  - UseCase Registry
  - Context Builders
  - Response Parsers
  - Provider Abstraction
数据层              Supabase tables / 本地 SQLite
基础设施层          FastAPI / Supabase / Storage
                          ↓
                  LLM Provider 池
                  （SiliconFlow / Claude / OpenAI / Mock）
```

**设计目标：**

| 目标 | 含义 |
|---|---|
| **模型不绑定** | 切换 SiliconFlow / Claude / OpenAI / 任何国产模型不影响产品代码 |
| **阶段可加性** | Phase 2-6 新增 AI 能力时纯追加 UC 文件，零修改旧 UC 代码 |
| **数据架构对齐** | 严格区分 Layer 1 生产者 / Layer 3 消费者；consumer 必须引用 insights |
| **契约可机读** | Context 和 Response 都是类型化定义（Pydantic + Zod 双端） |
| **治理预留** | 为后续 AI 自演进留出绿/黄/红区接口（版本、开关、Telemetry、Eval）|
| **降级零中断** | 任何 Provider 故障或 LLM 异常都有结构化兜底，调用方永不拿到非法数据 |
| **履约飞轮闭环** | AI 在 Layer 1 和 Layer 3 同时受益，消费端必须用 insights |

**与数据架构 3 层的对齐：**

| 数据层 | AI 角色 | 是否需要 insights | UC 类型 |
|---|---|---|---|
| **Layer 1** | 数据生产者 | 不需要 | producer（看图识别、餐后份量对比）|
| **Layer 2** | （无 AI）| — | deriveInsights 是纯算法 |
| **Layer 3 AI** | 内容消费者 | 必须 | consumer（饭前建议、抽卡 reason、洞察文案）|
| **Layer 3 非 AI** | 直接渲染 | — | 身体拼图块、统计徽章 |

**强制约束：** 声明为 `consumer` 的 UC，Context Schema 必须包含 `insights: list[Insight]`；执行时若 insights 为空，必须走冷启动降级，不得让 LLM 自由发挥。

### 3.2 核心契约 AIRequest / AIResponse

#### UseCase Protocol

```python
class UseCase(Protocol):
    # 元数据
    name: str                                # snake_case，全局唯一
    version: str                             # 语义版本
    layer: Literal["producer", "consumer", "enricher"]
    min_phase: int
    description: str

    # 类型契约
    context_schema: Type[BaseModel]
    response_schema: Type[BaseModel]

    # 能力声明
    requires_image: bool
    requires_llm: bool                       # False = 算法类（如向量检索）
    requires_insights: bool                  # consumer 必须 True

    # Prompt（requires_llm=True 时必填）
    prompt_template: str | None
    prompt_version: str                      # 与 version 解耦

    # 执行入口
    def execute(self, ctx: BaseModel, provider: "LLMProvider") -> BaseModel: ...
    def fallback(self, ctx: BaseModel, error: Exception) -> BaseModel: ...

    # 治理钩子（Phase 4+ 启用）
    def eval_samples(self) -> list[dict]: ...
```

#### LLMProvider Protocol

UC 层只依赖抽象接口，不知道具体模型：

```python
class LLMProvider(Protocol):
    name: str                                # "siliconflow" / "claude" / "openai" / "mock"
    model_id: str

    def call_vision(self, prompt, image_url, text_context, **kwargs) -> dict: ...
    def call_text(self, prompt, text_context, **kwargs) -> dict: ...
    def call_embedding(self, text: str) -> list[float]: ...
    def is_available(self) -> bool: ...
    def cost_estimate(self, prompt_tokens, completion_tokens) -> float: ...
```

Phase 2+ 按需扩展，如 `call_vision_multi()`（UC-04 多图对比）。

**类型化原则：**

**禁止使用 `dict` 或 `Any` 作为 Context / Response 类型。**

- FastAPI 端：Pydantic v2 BaseModel
- App 端：Zod schema + TypeScript 类型
- 字段命名：snake_case（FastAPI）↔ camelCase（App），由 schema 注册时声明映射

### 3.3 Provider 抽象层

**设计原则：**

1. UC 不知道 Provider 是谁
2. Provider 在启动时由 env var 注入
3. MockProvider 永远可用，最后兜底
4. 多 Provider 共存（Phase 3+ A/B）

**Provider 池（当前与规划）：**

| Provider | 实装状态 | 备注 |
|---|---|---|
| `SiliconflowProvider` | Phase 1 默认 | Qwen3-VL-32B-Instruct + BAAI/bge-m3 |
| `MockProvider` | 永远可用 | 结构化兜底 |
| `ClaudeProvider` | 占位 | Phase 2+ 可选实装 |
| `OpenAIProvider` | 占位 | 国际市场扩展时实装 |

**Provider 切换：**

```bash
LLM_PROVIDER=siliconflow    # 当前
LLM_PROVIDER=claude         # 切换
LLM_PROVIDER=mock           # 调试/降级
```

不改 UC 代码、不重新构建 App、不数据迁移。

### 3.4 Use Case 注册表

**完整契约见 `docs/architecture/use-cases/uc-XX-*.md`，本表只放元数据。**

| ID | name | Layer | 最小 Phase | LLM | 触发场景 | 详细契约 |
|---|---|---|---|---|---|---|
| UC-01 | `meal_analysis` | hybrid (producer+consumer) | 1 | Vision | 用户拍照后立即 | `docs/architecture/use-cases/uc-01-meal-analysis.md` |
| UC-02 | `body_insight` | consumer | 1 | Text | 身体页刷新 / 新规律成熟 | `docs/architecture/use-cases/uc-02-body-insight.md` |
| UC-03 | `card_recommend` | consumer | 2 | Text | 用户抽卡 / 夜宵提醒 | `docs/architecture/use-cases/uc-03-card-recommend.md` |
| UC-04 | `leftover_compare` | producer | 1 末/2 | Vision（多图）| 用户上传餐后剩余 | `docs/architecture/use-cases/uc-04-leftover-compare.md` |
| UC-05 | `nutrition_match` | enricher | 1 | 无（pgvector）| UC-01 输出 dish_name 后 | `docs/architecture/use-cases/uc-05-nutrition-match.md` |

**Registry 模式：**

```python
class UseCaseRegistry:
    @classmethod
    def register(cls, uc): ...                       # 启动时强制校验
    @classmethod
    def get(cls, name): ...
    @classmethod
    def list_metadata(cls): ...                      # GET /v1/uc 元数据列表

class ProviderRegistry:
    @classmethod
    def get_active(cls) -> LLMProvider:
        # 按 env LLM_PROVIDER 选 Provider，故障时 fallback 到 MockProvider
        ...
```

**注册校验强制约束（启动时执行）：**

1. `name` 全局唯一
2. `layer == "consumer"` 时 `requires_insights` 必须为 True
3. `requires_llm == True` 时 `prompt_template` 必填
4. `context_schema` / `response_schema` 必须是 `BaseModel` 子类

**新增 UC 流程**：见 `docs/architecture/use-cases/README.md`「新增 UC 的标准流程」章节。

### 3.5 调用通道

**唯一业务路由：**

```
POST /v1/uc/{uc_name}    ← 所有 UC 走这一个路由
GET  /v1/uc              ← 元数据列表，App 启动时自检
```

**旧路由 `/v1/meal/analyze` 已废弃**，Phase 1 重构时直接删除，不保留兼容包装。

**Dispatcher 职责：**

```
1. 输入 Schema 校验
2. 调 Provider 执行（或非 LLM 直接走算法）
3. 输出 Schema 校验
4. Telemetry 记录
5. 异常时调 UC.fallback() 返回降级响应
6. consumer 类 UC 加 Stage Router 计算 advice_stage
```

**四种调用通道：**

| 通道 | 触发方式 | 适用 UC |
|---|---|---|
| 在线同步 | 用户操作立即触发，等待响应 | UC-01（拍照识别）、UC-02（即时建议）|
| 异步队列 | 触发后后台处理，推送结果 | UC-04（餐后对比）Phase 2+ |
| 定时批量 | Cron 定时触发，批量生成 | 周报（UC 扩展）|
| 流式 | SSE 逐步返回 | 长文本洞察 Phase 3+ |

**App 客户端统一调用入口：**

```typescript
// 统一调用入口
await executeUseCase<MealAnalysisResponse>("meal_analysis", ctx)
await executeUseCase<BodyInsightResponse>("body_insight", ctx)
```

每个 UC 在 `src/services/ai/useCases/xxx.ts` 提供：

- `buildContext(input)` — 从本地数据组装类型化 Context
- `parseResponse(raw)` — Zod 解析 + 安全过滤
- `fallback(ctx)` — 离线/无 endpoint 时的客户端兜底

### 3.6 横切机制

**版本管理：**

| 版本号 | 升级触发 | 兼容性 |
|---|---|---|
| `version` | Context/Response Schema 变化 | 可能破坏兼容 |
| `prompt_version` | 仅 Prompt 文本调整 | 完全兼容 |

升级路径：`v1.0 → v1.1`（绿区）→ `v2.0`（黄区，向后兼容）→ `v3.0`（红区，App 同步升级）。

**治理区域：**

| 区域 | 允许改动 | Phase 1-3 | Phase 4+ |
|---|---|---|---|
| 绿区 | Prompt 文本微调 | 人工 PR | AI 提交 + Eval 通过自动 deploy |
| 黄区 | 新 UC / Schema 加 optional | 人工 PR | AI 生成 PR + 人工 review |
| 红区 | 跨 UC 改动 / 安全字段 / Provider 切换 | 永远人工 | 永远人工 |

**Telemetry（每次 UC 执行记录）：**

```
timestamp / request_id / uc_name / uc_version / prompt_version /
provider / duration_ms / status / error_type / estimated_cost
```

Phase 1：本地日志。Phase 2+：专表或观测平台。

**配置开关（每个 UC 单独 env var）：**

```bash
UC_MEAL_ANALYSIS_ENABLED=true
UC_BODY_INSIGHT_ENABLED=false
UC_CARD_RECOMMEND_ENABLED=false
```

关闭的 UC 直接走 fallback，不调 Provider。

**鉴权与 Embedding 缓存：**

- 所有 UC 调用必须携带用户鉴权 token，Dispatcher 在 Schema 校验前先验证
- Embedding 向量结果按 `(dish_name, model_version)` 缓存，TTL 7 天，避免重复计费
- 熔断：同一 Provider 连续 5 次错误触发熔断，熔断期间自动降至 MockProvider

**降级层级：**

```
1. UC.execute() 正常返回             → 用真实结果
2. Provider 超时/HTTP 错误           → UC.fallback()
3. LLM 返回非法 JSON                  → UC.fallback()
4. Response Schema 校验失败           → UC.fallback()
5. UC 开关关闭                         → UC.fallback()
6. 所有 Provider 不可用                → MockProvider
7. App 完全离线                       → 客户端 fallback
```

每层都返回 `response_schema` 合法实例，App 永不拿到非法数据。

### 3.7 算法与大模型分工

```
营养库层（pgvector + Supabase）：
  提供精准数值基础：每100g营养成分（来自《中国食物成分表》等权威数据源）
  作用：修正Claude的估算值，提升营养数据可信度
  输出：nutrition_per_100g JSON，match_confidence float

算法层（FastAPI algorithms/）：
  计算结构化事实：特征相关性、评分均值、营养缺口、预测置信度
  消费营养库精准值，而不是Claude估算值
  输出：numbers, arrays, structured JSON, AlgorithmDecision

上下文层（FastAPI context/）：
  不直接把数据库原始数据塞进模型
  由 context_composer 根据动作组装最小必要上下文
  输出：AnalysisContext / PlanContext / PredictionContext / FulfillmentContext / FoodMemoryContext / WeeklyReportContext

大模型层（Claude API）：
  消费算法输出 + 营养库精准值 + UserContext，生成可读文字
  两次调用：① Vision识别菜品结构  ② 综合上下文生成个性化建议
  输出：自然语言洞察、饮食建议、干预文案

关键原则：
  营养库提供"准确数值"，算法提供"是什么规律"，大模型解释"为什么"和"怎么办"
  每个动作的 TaskContext 不同 → 每次生成内容个性化且不超载
  所有算法决策必须写 algorithm_decisions，关键动作必须写 fulfillment_events
  营养库数据可独立更新，算法迭代不需要 App 发版，FastAPI 独立热更新

饭前抽卡专属分工：
  规则引擎（Python buildCardPoolForState）：
    读 meal_feedback 历史 → 按状态过滤+评分排序 → 返回候选菜（stable/alt/explore）
    规则引擎决定"选哪道菜"，不调用营养库，不让 AI 自主选菜
  
  AI（Claude）：
    输入：{state, stage, stable_candidate, alt_candidate, explore_dish, UserContext}
    输出：每张卡的 reason（个性化理由）和 advice（吃法建议）
    AI 只写文字，不选菜，不改变过滤结果
    reason 文案风格按 stage 区分：
      general：通用语气，不引用个人历史（"熟悉的味道，压力大时稳一点"）
      feedback：引用近期反馈（"上次吃完你精力不错，疲惫时这个靠谱"）
      body_puzzle：引用身体感受关联（"吃了 X 次，Y 次身体舒服，综合评分高"）
  
  营养库（pgvector）：
    饭前抽卡不参与过滤和选菜（营养库只有原料级数据，无饭后感受标签）
    仅在 Prompt 4.0+ 中用于生成吃法建议的营养事实背书
```

### 3.8 UserContext 与 TaskContext

#### UserContext 构建逻辑（builder.py）

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
        .select("goal, avoid, daily_budget, feeling, eating_style") \
        .eq("user_id", user_id).single().execute()
    profile = profile_res.data or {}

    # ─── 2. 近期餐次（近21条，只取关键字段，不拉图片）────────
    meals_res = supabase.table("meals") \
        .select("meal_type, dish, cuisine, province, mood, ts") \
        .eq("user_id", user_id) \
        .order("ts", desc=True).limit(21).execute()
    recent_meals = meals_res.data or []

    # ─── 3. DishScores（只传置信度≥0.3的，防止噪声干扰）──────
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
    high_conf_patterns = len([
        c for c in (body_pattern or {}).get("correlations", [])
        if c.get("confidence", 0) >= 0.6
    ])
    unlock_stage = _determine_stage(meal_count, high_conf_patterns)

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

#### TaskContext Composer（2.0 起逐步实现）

`build_user_context()` 是早期兼容入口。2.0 起新增 `services/ai/context/composer.py`，按动作构建轻量任务上下文，并把结果写入 `context_snapshots`。

```python
async def compose_context(user_id: str, context_type: str, object_id: str | None, supabase: Client) -> dict:
    """按任务生成最小必要上下文，不把完整用户历史直接塞进模型。"""

    if context_type == "AnalysisContext":
        return await build_analysis_context(user_id, object_id, supabase)
    if context_type == "PlanContext":
        return await build_plan_context(user_id, object_id, supabase)
    if context_type == "PredictionContext":
        return await build_prediction_context(user_id, object_id, supabase)
    if context_type == "PurchaseContext":
        return await build_purchase_context(user_id, object_id, supabase)
    if context_type == "SubscriptionContext":
        return await build_subscription_context(user_id, object_id, supabase)
    if context_type == "FoodMemoryContext":
        return await build_food_memory_context(user_id, object_id, supabase)
    if context_type == "WeeklyReportContext":
        return await build_weekly_report_context(user_id, object_id, supabase)
    if context_type == "MembershipContext":
        return await build_membership_context(user_id, object_id, supabase)
    raise ValueError("unsupported_context_type")
```

**8 类 TaskContext 最小必要上下文说明：**

| Context 类型 | 最小必要字段 | 触发场景 |
|---|---|---|
| `AnalysisContext` | meal_id, dish_name, nutrition, recent_meals(7条), insights | 拍照识别后建议生成 |
| `PlanContext` | user_goal, avoid, recent_meals(3条), dish_scores(top10) | 饭前抽卡推荐 |
| `PredictionContext` | body_pattern, weight_trend, recent_checkins(14条) | 身体规律预测 |
| `PurchaseContext` | purchase_history, comfort_rate_by_dish | 购买决策辅助 |
| `SubscriptionContext` | subscription_tier, usage_stats | 订阅状态相关 |
| `FoodMemoryContext` | food_memory_entries(top20), emotion_tags | 食物记忆回顾 |
| `WeeklyReportContext` | week_stats, plan_execution_rate, best_day, worst_day | 周报生成 |
| `MembershipContext` | tier, unlock_stage, feature_flags | 会员权益展示 |

**上下文原则：**

- 原始事件和明细先进入数据库，不直接进入 prompt
- 高频统计、偏好、履约率、复购周期和消耗概率优先预计算为特征
- 每次 AI 调用只读取当前动作需要的上下文
- 每个上下文快照必须有 `context_version`，方便回放、A/B 测试和算法回归

### 3.9 Claude Prompt 模板

> **重要变更（2026-05-27）**：本节 Prompt 1/2/3 原散落定义已废弃，所有 Prompt 现归属到各 UC 的契约文档，单文件管理。下方模板为历史参考版本，新增/修改 Prompt **必须改对应 UC 文件**，不得改本节。
>
> | 旧定义 | 现归属 |
> |---|---|
> | Prompt 1：Vision 识别 | UC-01 `meal_analysis` Prompt 模板（v1.0 单次调用，Phase 2 拆为两阶段）|
> | Prompt 2：个性化建议生成 | UC-01 Prompt 内嵌的 Layer 3 consumer 部分（Phase 2 v2.0 拆出独立 Prompt）|
> | Prompt 3：首批洞察生成（T5-05）| UC-02 `body_insight` Prompt 模板 |

#### Prompt 1：Vision 识别（vision_recognize v1.0）

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

#### Prompt 2：个性化建议生成（eating_advice v1.0）

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
忌口：{profile.get('avoid') or '无'}
单日预算：{profile.get('daily_budget', '未设置')} 元/天
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

#### Prompt 3：首批洞察生成（first_insight v1.0）

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
忌口：{user_context['profile'].get('avoid') or '无'}

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

#### Prompt 4：周报生成（weekly_report v1.0）

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

**Prompt 使用规范：**

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

### 3.10 Prompt 版本化与评估机制（P1 F8）

**版本化规则：**

- 每份 Prompt 必须在文件顶部声明 `prompt_version = "v1.0"`
- 版本变更必须新增版本，不覆盖旧版
- 调用时把 `prompt_version` 写入 `meal_analysis.analysis_meta.promptVersion`

**评估指标：**

| 指标 | 定义 | 方向 |
|---|---|---|
| accuracy | 用户修正频率（修正次数/调用次数）| 越低越好 |
| cost | 每次调用 token 数 × 单价（折算 ¥）| 越低越好 |
| latency_p50 | P50 响应时间（ms）| 越低越好 |
| latency_p95 | P95 响应时间（ms）| 越低越好 |

以上指标写入 `algorithm_decisions` 表，字段：`uc_name / prompt_version / accuracy / cost_cny / latency_p50_ms / latency_p95_ms / sample_size / evaluated_at`。

每个 UC 必须提供 `eval_samples()`，Phase 4+ 自动跑全部样本通过率才能部署。

### 3.11 降级策略（P1 F8）

| 场景 | 降级方式 |
|---|---|
| Provider 完全不可用 | 降级到 mock（结构化假数据，标注 source=mock）|
| Vision 识别失败 | 降级到关键词匹配 + 营养库模糊查询 |
| 调用超过 25s | 自动跳过向量搜索，保留 AI 估算 |
| 免费用户（默认）| 走 mock + 关键词匹配（不调 Vision，不查向量库）|
| 付费用户 | Vision 高精度 + 营养库精准匹配 |

---

## 四、Phase 演进

| Phase | 必装 UC | 可选 UC | 框架增量 |
|---|---|---|---|
| **1** | UC-01 v1.0, UC-02 v1.0, UC-05 | UC-04 v1.0 | Registry / Dispatcher / Telemetry v1 / SiliconFlow + Mock Provider |
| **2** | UC-01 v2.0（两阶段拆分）, UC-03 v1.0 | — | Stage Router 完整版 / Eval harness v0 |
| **3** | — | — | 多 Provider A/B（验证抽象层）|
| **4** | UC-03 v2.0（body_structure 阶段）| UC-01 v3.0（接入 health_signals）| Eval 自动化 / Canary 部署 |
| **5** | UC-03 v3.0（fulfillment 阶段）| 新 UC：plan_generate / meal_predict | — |
| **6** | UC-03 v4.0（food_memory 阶段）| 新 UC：food_memory_recommend | — |

---

## 五、禁止事项

- 禁止把完整 UserContext 塞进所有 prompt
- 禁止 AI 自主产生用户洞察（必须基于已有 Insight）
- 禁止省略 prompt_version
- 禁止用 Mock 冒充真实结果（必须标注 source=mock）
- 禁止跳过 algorithm_decisions 记录

---

## 六、变更记录

| 日期 | 任务编号 | 变更 |
|---|---|---|
| 2026-06-03 | ##045 | 初版落盘，从蓝图 L491-L785 + L1772-L1819 + L2846-L3251 迁出，新增 Prompt 版本化/评估/降级（P1 F8 落地）|
