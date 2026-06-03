# UC-03 `card_recommend` 餐前抽卡推荐

> 上位架构契约见 `docs/02-master-blueprint.md` 「AI 服务层架构」章节。
> 同级 UC 列表见 [README.md](./README.md)。

## 文档信息

| 字段 | 值 |
|---|---|
| UC ID | UC-03 |
| 文档版本 | v1.0 |
| 状态 | DRAFT |
| 最小启用 Phase | 2 |
| 关联任务 | `docs/TASK_LOG.md` ##040 |

## 1. 基本信息

```yaml
name: card_recommend
version: v1.0
layer: consumer
min_phase: 2
description: 根据用户状态、历史和身体规律，生成 3 张餐前推荐卡（稳/换/试）
requires_image: false
requires_llm: true
requires_insights: true
prompt_version: v1.0
```

## 2. 触发场景

- **用户动作**：首页主动点"抽卡"
- **场景触发**：餐前固定时段（早 7-9 / 午 11-13 / 晚 17-19 / 夜宵 21-23）的主动推送
- **特殊触发**：夜宵建议——用户在 21 点后还没吃晚饭/还想吃东西时

## 3. Context Schema

### 3.1 Pydantic 定义

```python
class TodayContext(BaseModel):
    hour: int = Field(ge=0, le=23)
    state: Literal["压力大", "很累很困", "想吃清淡", "想吃点好的",
                    "心情不错", "随便都行"] | None = None
    today_spent_estimate: int = 0                   # 今日已消耗预算估算
    today_meal_count: int = 0
    has_had_dinner: bool = False                    # 用于夜宵场景判断

class CardRecommendContext(BaseModel):
    # 用户档案
    user_goal: str
    daily_budget: int                               # 单日预算（唯一消费 budget 的 UC）
    avoidances: list[str] = Field(default_factory=list, max_length=20)

    # 当前场景
    meal_type: Literal["早", "中", "晚", "加餐", "夜宵"]
    today: TodayContext

    # 历史
    recent_meals: list[RecentMealRef] = Field(default_factory=list, max_length=10)

    # 洞察（consumer 强制约束）
    insights: list[Insight] = Field(default_factory=list, max_length=20)
                                                    # 空列表表示冷启动期

    # 阶段路由（由 Dispatcher 的 Stage Router 决定，UC 内部不计算）
    advice_stage: Literal["general", "feedback", "body_puzzle",
                          "body_structure", "fulfillment", "food_memory"]
```

### 3.2 Zod 定义

```typescript
export const cardRecommendContextSchema = z.object({
  userGoal: z.string(),
  dailyBudget: z.number().int().positive(),
  avoidances: z.array(z.string()).max(20),
  mealType: z.enum(["早", "中", "晚", "加餐", "夜宵"]),
  today: z.object({
    hour: z.number().int().min(0).max(23),
    state: z.enum([...]).nullable(),
    todaySpentEstimate: z.number().int().default(0),
    todayMealCount: z.number().int().default(0),
    hasHadDinner: z.boolean().default(false),
  }),
  recentMeals: z.array(recentMealRefSchema).max(10),
  insights: z.array(insightSchema).max(20),
  adviceStage: z.enum(["general", "feedback", "body_puzzle",
                        "body_structure", "fulfillment", "food_memory"]),
})
```

### 3.3 字段消费来源

| 字段 | 来源 | 计算方式 |
|---|---|---|
| `user_goal` | `profiles.goal` | 直接读取 |
| `daily_budget` | `profiles.daily_budget` | 直接读取，整数（元） |
| `avoidances` | `profiles.avoid` | 直接读取 |
| `meal_type` | 当前时段推断 | 7-10 早 / 11-14 中 / 17-20 晚 / 21-23 夜宵 |
| `today.today_spent_estimate` | `meals` + `meal_budget_weights` | 今日已记录餐次按权重折算金额 |
| `today.has_had_dinner` | 今日 `meals` 中是否有 meal_type=晚 | 仅夜宵场景需要 |
| `recent_meals` | `meals` 表近 10 餐 | 时间倒序 |
| `insights` | 客户端 `deriveInsights()` | 过滤 sparse |
| `advice_stage` | Dispatcher Stage Router | 见下方"Stage Router 规则" |

### 3.4 Stage Router 规则（Dispatcher 调 UC 前计算）

```python
def compute_advice_stage(ctx: CardRecommendContext, available_phases: set[int]) -> str:
    insights = ctx.insights
    has_mature = any(i.maturity == "mature" for i in insights)
    has_forming = any(i.maturity == "forming" for i in insights)

    # 按数据成熟度倒序选最高可用阶段
    if 6 in available_phases and _has_food_memory_data(ctx):
        return "food_memory"
    if 5 in available_phases and _has_fulfillment_data(ctx):
        return "fulfillment"
    if 4 in available_phases and _has_health_signals(ctx):
        return "body_structure"
    if has_mature:
        return "body_puzzle"
    if has_forming:
        return "feedback"
    return "general"
```

## 4. Response Schema

### 4.1 Pydantic 定义

```python
class Card(BaseModel):
    slot: Literal["stable", "alt", "explore"]
    slot_label: Literal["稳", "换", "试"]
    slot_sublabel: str                              # "当下最优解" / "换口味也稳" / "适度探索"
    dish: str                                       # 具体菜品名
    cuisine: str | None = None
    tags: list[str] = Field(max_length=3)
    risk: Literal["low", "medium", "high"]
    reason: str = Field(max_length=40)
    advice: str = Field(max_length=30)
    confidence: Literal["low", "medium", "high"]
    insights_referenced: list[str]                  # 本卡引用的 insight ID

class CardRecommendResponse(BaseModel):
    cards: list[Card] = Field(min_length=3, max_length=3)  # 严格 3 张
    advice_stage: Literal["general", "feedback", "body_puzzle",
                          "body_structure", "fulfillment", "food_memory"]
    stage_label: str                                # "通用推荐" / "反馈推荐" / ...
```

### 4.2 字段下游消费

| 字段 | 谁消费 | 用途 |
|---|---|---|
| `cards[].slot` | 抽卡 UI 三槽位 | stable / alt / explore 固定顺序 |
| `cards[].dish` | 卡面菜名 | 具体菜品 |
| `cards[].reason` | 卡面推荐理由 | 个性化文案 |
| `cards[].risk` | 卡面风险标签 | 颜色提示 |
| `advice_stage` | 推荐来源标签 | "通用推荐" / "拼图推荐" |
| `insights_referenced` | 治理审计 + `card_actions` 表记录 | 验证推荐依据 |

## 5. Prompt 模板（v1.0）

```
你是《干饭》用户的饮食伙伴，生成 3 张推荐卡。

# 输入
- 用户目标：{user_goal}
- 单日预算：{daily_budget} 元
- 忌口：{avoidances}
- 当前餐次：{meal_type}，时间：{today.hour} 点
- 今日状态：{today.state}
- 今日已消耗预算估算：{today.today_spent_estimate} 元
- 今日是否已吃晚饭：{today.has_had_dinner}
- 近 10 餐记录：
{recent_meals_block}
- 用户已发现的身体规律：
{insights_block}
- 推荐阶段：{advice_stage}

# 三张卡固定职责
1. 稳（stable）：当前状态下置信度最高的历史最优解
2. 换（alt）：换口味但仍稳的第二方向
3. 试（explore）：历史较少出现、适合现在尝试，诚实说明不确定性

# 状态对应方向
- 压力大：优先吃过多次且反馈舒服的熟悉菜
- 很累很困：排除历史困倦菜，优先精力好的，避免重油高碳
- 想吃清淡：过滤重油高碳，优先清淡历史好评
- 想吃点好的：满足感和满意度高的记录优先
- 心情不错：可适度探索
- 随便都行：纯历史综合评分

# 夜宵场景特殊规则（meal_type=夜宵 且 has_had_dinner=true）
- 三张卡都偏向"轻"——汤、粥、水果、酸奶、清淡小食
- 禁止推油炸 / 重口烧烤 / 高碳主食
- explore 卡可以提"今晚就喝点水算了"作为合理选项

# 关键约束（洞察硬约束）
1. 所有推荐理由必须基于 insights 列表，不得编造列表外的因果关系
2. "你吃 X 会困"这种因果断言，只在 insights 中明确列出才能说
3. 若 insights 列表为空（advice_stage=general）：理由只能基于状态和通用规律，不得伪装个性化
4. reason 中"上次吃是 X 天前"必须用 recent_meals 真实日期
5. 试这张卡要诚实说明这是探索，不假装个性化

# 预算约束
- 若 today_spent_estimate > daily_budget × 0.7，stable 卡优先推荐低预算选项
- 若 today_spent_estimate < daily_budget × 0.3 且 state=想吃点好的，可适度放宽

# 输出
严格 3 张卡，顺序：稳 → 换 → 试。匹配 CardRecommendResponse schema。
```

## 6. Provider 需求

| 项 | 值 |
|---|---|
| Provider 类型 | LLM Text |
| 调用接口 | `provider.call_text(prompt, text_context)` |
| max_tokens | 700 |
| temperature | 0.4 |
| timeout_seconds | 20 |
| 估算成本（次） | $0.002 ~ $0.005 |

## 7. Fallback 策略

冷启动期 fallback 使用本地 `buildCardPool` 算法（与原型相同）：
- 按 meal_type + state 查 DISH_MAP 预定义菜品池
- 返回 3 张通用卡
- advice_stage="general"
- 所有 cards[].insights_referenced=[]

```python
def fallback(self, ctx, error):
    pool = LOCAL_DISH_POOL[ctx.meal_type][ctx.today.state or "随便都行"]
    return CardRecommendResponse(
        cards=[
            Card(slot="stable", slot_label="稳", dish=pool[0], ...),
            Card(slot="alt", slot_label="换", dish=pool[1], ...),
            Card(slot="explore", slot_label="试", dish=pool[2], ...),
        ],
        advice_stage="general",
        stage_label="通用推荐",
    )
```

## 8. 依赖关系

| 依赖类型 | 依赖项 | 说明 |
|---|---|---|
| 上游 | 客户端 `deriveInsights()` | 提供 insights |
| 上游 | Dispatcher Stage Router | 计算 advice_stage |
| 数据源 | `profiles` + `meals` + `meal_budget_weights` | Context 字段来源 |
| 下游消费 | `card_actions` 表 | 用户接受/跳过卡的记录 |
| 下游消费 | UC-01（用户接受卡 → 拍照） | from_card 字段串联 |

## 9. Phase 演进路线

| 版本 | Phase | 变化点 | 兼容性 |
|---|---|---|---|
| v1.0 | 2 | general / feedback / body_puzzle 三阶段 | — |
| v2.0 | 4 | body_structure 阶段接入（health_signals） | Context 加 optional 字段 |
| v3.0 | 5 | fulfillment 阶段接入（plan_executions） | 同上 |
| v4.0 | 6 | food_memory 阶段接入（食材记忆） | 同上 |

## 10. 评估样本

```python
eval_samples = [
    {
        "name": "冷启动 + 压力大场景",
        "context": {
            "user_goal": "保持身材",
            "daily_budget": 90,
            "meal_type": "中",
            "today": {"hour": 12, "state": "压力大",
                       "today_spent_estimate": 25, "has_had_dinner": False},
            "insights": [],
            "advice_stage": "general",
        },
        "expected_assertions": [
            {"field": "cards", "length": 3},
            {"field": "advice_stage", "equals": "general"},
            {"field": "cards[0].slot", "equals": "stable"},
            {"field": "cards[2].slot", "equals": "explore"},
            {"field": "cards[*].insights_referenced", "all_empty": True},
        ],
    },
    {
        "name": "夜宵场景 + 已吃晚饭",
        "context": {
            "meal_type": "夜宵",
            "today": {"hour": 22, "has_had_dinner": True},
            "insights": [],
            "advice_stage": "general",
        },
        "expected_assertions": [
            {"field": "cards[*].risk", "none_equals": "high"},
            {"field": "cards[*].tags", "none_contains": "高油"},
        ],
    },
    # Phase 2 加: 有 insights 的样本，验证 insights_referenced 非空
]
```

## 11. 变更记录

| 版本 | 日期 | 变更 | 任务编号 |
|---|---|---|---|
| v1.0 | 2026-05-27 | 初稿 | ##040 |
