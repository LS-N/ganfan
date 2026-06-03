# UC-02 `body_insight` 身体洞察文案

> 上位架构契约见 `docs/02-master-blueprint.md` 「AI 服务层架构」章节。
> 同级 UC 列表见 [README.md](./README.md)。

## 文档信息

| 字段 | 值 |
|---|---|
| UC ID | UC-02 |
| 文档版本 | v1.0 |
| 状态 | DRAFT |
| 最小启用 Phase | 1 |
| 关联任务 | `docs/TASK_LOG.md` ##040 |

## 1. 基本信息

```yaml
name: body_insight
version: v1.0
layer: consumer
min_phase: 1
description: 把 deriveInsights 产出的结构化规律翻译成自然语言洞察文案
requires_image: false
requires_llm: true
requires_insights: true
prompt_version: v1.0
```

## 2. 触发场景

- **系统事件**：身体页刷新时，若有 forming/mature insight 触发
- **数据成熟事件**：新规律首次达到 mature（用于"我发现了一规律"通知）
- **定时**：每周一次 / 月度汇总（Phase 2+）

**前置约束：** `insights` 必须非空。空 insights 时不应触发本 UC，由调用方直接降级到本地模板。

## 3. Context Schema

### 3.1 Pydantic 定义

```python
class BodyInsightContext(BaseModel):
    # 必填：来自 deriveInsights 的结构化规律
    insights: list[Insight] = Field(min_length=1, max_length=20)
                                                    # forming + mature

    # 用户档案（用于个性化口吻）
    user_goal: str | None = None
    common_feelings: list[str] = Field(default_factory=list, max_length=10)
    eating_style: str | None = None                # 来自 deriveInsights diet_structure_type

    # 触发上下文（影响话术）
    trigger: Literal["puzzle_refresh", "new_insight_matured", "scheduled_summary"]
    newly_matured_insight_ids: list[str] = Field(default_factory=list, max_length=3)
```

### 3.2 Zod 定义

```typescript
export const bodyInsightContextSchema = z.object({
  insights: z.array(insightSchema).min(1).max(20),
  userGoal: z.string().nullable(),
  commonFeelings: z.array(z.string()).max(10),
  eatingStyle: z.string().nullable(),
  trigger: z.enum(["puzzle_refresh", "new_insight_matured", "scheduled_summary"]),
  newlyMaturedInsightIds: z.array(z.string()).max(3),
})
```

### 3.3 字段消费来源

| 字段 | 来源 | 计算方式 |
|---|---|---|
| `insights` | 客户端 `deriveInsights()` | 过滤 sparse，保留 forming + mature |
| `user_goal` | `profiles.goal` | 直接读取 |
| `common_feelings` | `profiles.feeling` | 直接读取 |
| `eating_style` | `deriveInsights` diet_structure_type 输出 | 仅 mature 时传入 |
| `trigger` | 调用方传入 | 区分场景以调整话术 |
| `newly_matured_insight_ids` | 客户端比较前后两次 deriveInsights 输出 | 用于「我发现了一规律」通知聚焦 |

## 4. Response Schema

### 4.1 Pydantic 定义

```python
class BodyInsightResponse(BaseModel):
    has_pattern: bool                              # False 时不展示
    pattern_type: Literal[
        "pattern_sleepy", "pattern_great", "pattern_overfull",
        "pattern_stress", "pattern_cuisine_preference", "insufficient_data"
    ]
    headline: str                                  # "你每次吃麻辣的，下午都会困"
    body: str                                      # 2-3 句具体数据解释
    action: str                                    # 1 句可操作建议
    emoji: str
    color: Literal["amber", "green", "accent"]
    conclusion: str                                # 身体页顶部总结句
    insights_referenced: list[str]                 # 实际引用的 insight ID
```

### 4.2 字段下游消费

| 字段 | 谁消费 | 用途 |
|---|---|---|
| `has_pattern=False` | 调用方 | 不展示，恢复默认拼图状态 |
| `headline` | 身体页顶部 / 首页"我发现了一规律"通知 | 主推语 |
| `body` | 身体页洞察详情 | 解释具体数据 |
| `action` | 行动建议区 | 可点击进入对应推荐 |
| `emoji` / `color` | UI 视觉 | 卡片配色 |
| `conclusion` | 身体页顶部 banner | 长期总结句 |
| `insights_referenced` | 治理审计 | 验证 consumer 真的引用了 insights |

## 5. Prompt 模板（v1.0）

```
你是《干饭》用户身体数据的解读者。任务：把已发现的身体规律翻译成一句让用户感到"哇，原来是这样"的话。

# 输入
- 已发现的身体规律（必须基于此列表，不得编造）：
{insights_block}
- 本次新成熟的规律 ID：{newly_matured_insight_ids}
- 用户目标：{user_goal}
- 常见感受：{common_feelings}
- 干饭风格：{eating_style}
- 触发场景：{trigger}

# 规则
1. 只说有数据支撑的规律，不猜测，不泛泛
2. 语气像了解用户的朋友，不像营养师报告
3. 禁用词：卡路里、BMI、减肥、健康、营养均衡（这些词太套路）
4. headline 必须引用 insights 的具体 angle 或 target，不得自由发挥
5. body 中的"X 次"必须用 insight.evidence.sampleSize 真实值，不得编造
6. 若 newly_matured_insight_ids 非空，优先围绕新成熟的规律展开
7. trigger=new_insight_matured 时语气更兴奋（"哇，我发现……"）
8. trigger=scheduled_summary 时语气更平稳（"这周看下来……"）
9. insights_referenced 列出实际引用的 insight ID

# 输出
严格 JSON，匹配 BodyInsightResponse schema。
```

## 6. Provider 需求

| 项 | 值 |
|---|---|
| Provider 类型 | LLM Text |
| 调用接口 | `provider.call_text(prompt, text_context)` |
| max_tokens | 500 |
| temperature | 0.3 |
| timeout_seconds | 15 |
| 估算成本（次） | $0.001 ~ $0.003 |

## 7. Fallback 策略

```python
def fallback(self, ctx: BodyInsightContext, error: Exception) -> BodyInsightResponse:
    # 用最强的 insight 套模板，不调 LLM
    top_insight = max(ctx.insights, key=lambda i: i.evidence.sampleSize)
    return BodyInsightResponse(
        has_pattern=True,
        pattern_type=self._map_pattern_type(top_insight),
        headline=self._template_headline(top_insight),
        body=f"已经在 {top_insight.evidence.sampleSize} 次记录里看到这个规律了。",
        action="下次吃同类时记得反馈，让规律更准。",
        emoji="📊",
        color="amber",
        conclusion=top_insight.angle,
        insights_referenced=[top_insight.id],
    )
```

**降级触发条件：**
- LLM Provider 超时
- HTTP 错误
- JSON 解析失败
- Schema 校验失败
- UC 被开关关闭

## 8. 依赖关系

| 依赖类型 | 依赖项 | 说明 |
|---|---|---|
| 上游计算 | 客户端 `deriveInsights()` | 提供 insights[] |
| 数据源 | `meals` + `meal_feedback` + `meal_analysis` | deriveInsights 的输入 |
| 下游消费 | 身体页 BodyPuzzle 组件 | 渲染 headline / body / action |
| 下游消费 | 首页通知"我发现了一规律" | 用 trigger=new_insight_matured 的输出 |

## 9. Phase 演进路线

| 版本 | Phase | 变化点 | 兼容性 |
|---|---|---|---|
| v1.0 | 1 | 基于 preference / avoid / reaction 三类 insight | — |
| v1.1 | 1 后期 | Prompt 微调 | 完全兼容 |
| v2.0 | 2 | 扩展 fulfillment 类 insight，pattern_type 加新枚举 | 向后兼容 |
| v3.0 | 4 | 扩展 health_link / cross_domain_reaction（结合生理证据） | Context 加 optional 字段 |

## 10. 评估样本

```python
eval_samples = [
    {
        "name": "用户吃麻辣下午困（典型 reaction 规律）",
        "context": {
            "insights": [{
                "id": "i-spicy-sleepy",
                "category": "reaction",
                "angle": "辣 → 下午困",
                "evidence": {"sampleSize": 5, "hitRate": 0.8},
                "maturity": "mature",
            }],
            "trigger": "new_insight_matured",
            "newly_matured_insight_ids": ["i-spicy-sleepy"],
        },
        "expected_assertions": [
            {"field": "has_pattern", "equals": True},
            {"field": "pattern_type", "equals": "pattern_sleepy"},
            {"field": "insights_referenced", "contains": "i-spicy-sleepy"},
        ],
    },
    # 更多样本：偏好规律、避开规律、forming 阶段、insufficient_data
]
```

## 11. 变更记录

| 版本 | 日期 | 变更 | 任务编号 |
|---|---|---|---|
| v1.0 | 2026-05-27 | 初稿 | ##040 |
