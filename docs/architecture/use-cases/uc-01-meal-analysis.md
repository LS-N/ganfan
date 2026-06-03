# UC-01 `meal_analysis` 餐前拍照分析

> 上位架构契约见 `docs/02-master-blueprint.md` 「AI 服务层架构」章节。
> 同级 UC 列表见 [README.md](./README.md)。

## 文档信息

| 字段 | 值 |
|---|---|
| UC ID | UC-01 |
| 文档版本 | v1.0 |
| 状态 | DRAFT（待"进入开发"门控通过后改 ACTIVE） |
| 最小启用 Phase | 1 |
| 关联任务 | `docs/TASK_LOG.md` ##040 ai-service-layer-architecture-design |

## 1. 基本信息

```yaml
name: meal_analysis
version: v1.0
layer: hybrid                  # 内部两阶段：producer (Phase A) + consumer (Phase C)
min_phase: 1
description: 识别餐食照片，输出结构化分析、营养估算和当下吃法建议
requires_image: true
requires_llm: true
requires_insights: true        # Phase C 建议生成必须引用
prompt_version: v1.0
```

## 2. 触发场景

- **用户动作触发**：拍照或选图完成后立即触发
- **入口**：分析页（`s-camera` → 分析结果页）

## 3. Context Schema

### 3.1 Pydantic 定义（FastAPI 端）

```python
class RecentMealRef(BaseModel):
    dish_name: str
    meal_type: Literal["早", "中", "晚", "加餐"]
    structure: str                                  # 一句话结构摘要
    feedback_summary: str | None                    # "舒服" / "困倦" / "胀气" / None
    eaten_at: datetime

class MealAnalysisContext(BaseModel):
    # 必填
    image_url: HttpUrl                              # Supabase signed URL
    meal_type: Literal["早", "中", "晚", "加餐"]

    # 用户档案（来自 profile）
    avoidances: list[str] = Field(default_factory=list, max_length=20)
    common_feelings: list[str] = Field(default_factory=list, max_length=10)

    # 历史上下文
    recent_meals: list[RecentMealRef] = Field(default_factory=list, max_length=5)

    # 洞察上下文（Phase C 建议生成需要，来自客户端 deriveInsights）
    insights: list[Insight] = Field(default_factory=list, max_length=10)
                                                    # 仅 forming + mature，sparse 不传入
```

### 3.2 Zod 定义（App 端）

```typescript
export const mealAnalysisContextSchema = z.object({
  imageUrl: z.string().url(),
  mealType: z.enum(["早", "中", "晚", "加餐"]),
  avoidances: z.array(z.string()).max(20),
  commonFeelings: z.array(z.string()).max(10),
  recentMeals: z.array(recentMealRefSchema).max(5),
  insights: z.array(insightSchema).max(10),
})

export type MealAnalysisContext = z.infer<typeof mealAnalysisContextSchema>
```

### 3.3 字段消费来源

| 字段 | 来源 | 计算方式 |
|---|---|---|
| `image_url` | Supabase Storage signed URL | 拍照上传后生成，10 分钟有效 |
| `meal_type` | 分析页用户选择 | 默认按时间猜测，用户可改 |
| `avoidances` | `profiles.avoid` | 用户档案直接读取 |
| `common_feelings` | `profiles.feeling` | 用户档案直接读取 |
| `recent_meals` | `meals` 表近 5 餐 | 时间倒序，含已反馈的 feedback_summary |
| `insights` | 客户端 `deriveInsights()` 输出 | 过滤 maturity ≠ "sparse" |

## 4. Response Schema

### 4.1 Pydantic 定义

```python
class StructureScore(BaseModel):
    staple: Literal["low", "medium", "high"]
    protein: Literal["low", "medium", "high"]
    vegetable_fiber: Literal["low", "medium", "high"]
    oil: Literal["light", "medium", "heavy"]
    portion: Literal["low", "medium", "high"]

class NutritionEstimate(BaseModel):
    calories: float
    protein_g: float
    fat_g: float
    carb_g: float
    fiber_g: float
    sodium_mg: float

class RecognizedFood(BaseModel):
    name: str
    weight: str                                     # "约 300g"
    confidence: Literal["low", "medium", "high"]
    nutrition_source: Literal["nutrition_db", "ai_estimate", "pending"]

class ExpectedReaction(BaseModel):
    name: str                                       # "饭后困倦" / "口渴"
    reason: str                                     # "碳水占比较高"
    evidence: str                                   # "碳水约80-110g"

class MealAnalysisResponse(BaseModel):
    # 识别层（Layer 1 producer）
    dish_name: str
    food_type: Literal["meal", "drink", "snack", "dessert", "fruit", "soup", "alcohol", "unknown"]
    cuisine: str                                    # "粤菜"
    province: str                                   # "广东"
    recognized_foods: list[RecognizedFood] = Field(max_length=10)

    # 评估层（Layer 1 producer）
    structure: StructureScore
    nutrition: NutritionEstimate
    risk: Literal["low", "medium", "high"]

    # 建议层（Layer 3 consumer，必须引用 insights）
    eating_advice: list[str] = Field(max_length=3)
    feedback_focus: list[str] = Field(max_length=3)
    expected_reactions: list[ExpectedReaction] = Field(max_length=3)
    advice_stage: Literal["general", "feedback", "body_puzzle",
                          "body_structure", "fulfillment", "food_memory"]

    # 元数据
    confidence: Literal["low", "medium", "high"]
    image_quality_note: str
    insights_referenced: list[str]                  # 实际引用的 insight ID
```

### 4.2 字段下游消费

| 字段 | 谁消费 | 用途 |
|---|---|---|
| `dish_name` / `cuisine` / `province` | 分析结果卡 | 菜名展示 + 菜系地图打卡 |
| `structure` | 营养概览卡 | 五维评分可视化 |
| `nutrition` | 营养明细弹层 + UC-05 触发 | 营养库匹配的 baseline |
| `recognized_foods[]` | 食物组成行 | 单项展示 + 营养库逐项匹配 |
| `eating_advice[]` | 建议区域 | 三条以内当下吃法 |
| `feedback_focus[]` | 饭后反馈问卷题目 | 个性化关注点 |
| `expected_reactions[]` | 饭后反馈预填 | 校验预测准确性 |
| `advice_stage` | 建议来源标签 | "通用建议" / "反馈推荐" / ... |
| `insights_referenced` | 治理审计 | 验证 Layer 3 consumer 是否真的引用了 insights |

## 5. Prompt 模板（v1.0，单次调用版本）

```
你是《干饭》餐前拍照分析服务，不评判，只如实描述。返回严格 JSON，无 Markdown、无注释。

# 输入上下文
- 当前餐次：{meal_type}
- 用户忌口：{avoidances}
- 用户常见感受：{common_feelings}
- 近 5 餐记录：
{recent_meals_block}
- 用户已发现的身体规律（必须引用，不得编造列表外的因果关系）：
{insights_block}

# 任务
分析图片，输出完整 JSON，字段严格匹配 MealAnalysisResponse schema。

# 关键规则
1. food_type 用枚举值之一，不要自由发挥
2. structure 各字段使用 low/medium/high，oil 用 light/medium/heavy
3. nutrition 数值必须给具体数字，confidence 反映估算可信度
4. recognized_foods 拆分图片内可见食物，每项给 name / weight / confidence
5. eating_advice / feedback_focus / expected_reactions：
   - 若 insights 列表为空：advice_stage = "general"，只用通用饮食知识
   - 若 insights 列表非空：advice_stage 反映最高可用阶段，理由必须引用 insights 具体 angle
   - 禁止断言"你吃 X 一定会困"，除非 insights 中明确列出
6. risk: low=蛋白足油轻均衡；medium=结构一般有空间；high=高油高碳/甜饮替正餐/空腹刺激
7. insights_referenced 列出实际引用的 insight ID
8. 不出现禁用词：医学诊断、一定、必然、精确热量、长胖（这些词被 App 端 sanitize 拦截）
```

**洞察硬约束（v1.0 关键规则）：**
- consumer 部分（eating_advice / feedback_focus / expected_reactions）必须把 insights 作为推理依据
- 冷启动期（insights 空）只能给通用建议，advice_stage 必须是 "general"

## 6. Provider 需求

| 项 | 值 |
|---|---|
| Provider 类型 | LLM Vision |
| 调用接口 | `provider.call_vision(prompt, image_url, text_context)` |
| max_tokens | 900 |
| temperature | 0.2 |
| timeout_seconds | 25 |
| 估算成本（次） | $0.005 ~ $0.015（SiliconFlow Qwen3-VL-32B） |

## 7. Fallback 策略

```python
def fallback(self, ctx: MealAnalysisContext, error: Exception) -> MealAnalysisResponse:
    return MealAnalysisResponse(
        dish_name="这一餐",
        food_type="meal",
        cuisine="家常",
        province="全国",
        recognized_foods=[
            RecognizedFood(name="这一餐", weight="约 300g",
                            confidence="low", nutrition_source="ai_estimate")
        ],
        structure=StructureScore(staple="medium", protein="medium",
                                  vegetable_fiber="medium", oil="medium", portion="medium"),
        nutrition=NutritionEstimate(calories=650, protein_g=28, fat_g=22,
                                     carb_g=78, fiber_g=5, sodium_mg=980),
        risk="medium",
        eating_advice=["先吃蛋白和菜，再吃主食。", "吃完后记录饱腹和消化感受。"],
        feedback_focus=["饭后 1 小时是否困倦", "有没有胀气或太撑"],
        expected_reactions=[],
        advice_stage="general",
        confidence="low",
        image_quality_note=f"AI provider 暂不可用（{type(error).__name__}），已降级为结构化兜底结果",
        insights_referenced=[],
    )
```

**降级触发条件：**
- LLM Provider 超时（>25 秒）
- HTTP 4xx/5xx 错误
- LLM 返回非法 JSON
- Response Schema 校验失败
- UC 被开关关闭（`UC_MEAL_ANALYSIS_ENABLED=false`）

## 8. 依赖关系

| 依赖类型 | 依赖项 | 说明 |
|---|---|---|
| 数据源（输入） | `meal_images` 表 | 提供 image_url |
| 数据源（输入） | `profiles` 表 | 提供 avoidances / common_feelings |
| 数据源（输入） | `meals` + `meal_feedback` 表 | 提供 recent_meals |
| 洞察（输入） | 客户端 deriveInsights 输出 | 提供 insights[] |
| 下游 UC | UC-05 nutrition_match | 本 UC 输出 dish_name 后触发，回填 recognized_foods 的 nutrition_db 来源 |
| 数据源（输出） | `meal_analysis` 表 | 本 UC 输出落库（append-only） |
| 数据源（输出） | `meal_corrections` 表 | 用户修改时新增（不覆盖本 UC 原输出） |

## 9. Phase 演进路线

| 版本 | Phase | 变化点 | 兼容性 |
|---|---|---|---|
| v1.0 | 1 | 单次 LLM 调用，识别 + 评估 + 建议合并输出 | — |
| v1.1 | 1 后期 | Prompt 微调（修禁用词、提高 confidence 准确度） | 完全兼容 |
| v2.0 | 2 | 拆为两阶段——Phase A 快速识别（≤280 tokens, ≤6s）立即返回核心字段；Phase C 异步补全建议层（≤700 tokens），App 端局部刷新 | 向后兼容（App 端可选择不用异步） |
| v3.0 | 4 | 建议层接入 health_signals（睡眠 / HRV），advice_stage 升级到 body_structure | Context 加 optional 字段 |

## 10. 评估样本（治理预留）

```python
eval_samples = [
    {
        "name": "粤菜白切鸡饭（典型低风险餐）",
        "context": {
            "image_url": "test://white_chicken_rice.jpg",
            "meal_type": "中",
            "avoidances": [],
            "common_feelings": [],
            "recent_meals": [],
            "insights": [],
        },
        "expected_assertions": [
            {"field": "food_type", "equals": "meal"},
            {"field": "cuisine", "equals": "粤菜"},
            {"field": "structure.protein", "in": ["medium", "high"]},
            {"field": "risk", "in": ["low", "medium"]},
            {"field": "advice_stage", "equals": "general"},
        ],
    },
    {
        "name": "炸鸡套餐（典型高风险餐 + 冷启动）",
        "context": {
            "image_url": "test://fried_chicken_set.jpg",
            "meal_type": "中",
            "insights": [],
        },
        "expected_assertions": [
            {"field": "structure.oil", "equals": "heavy"},
            {"field": "risk", "equals": "high"},
            {"field": "advice_stage", "equals": "general"},
            {"field": "expected_reactions", "min_length": 1},
        ],
    },
    # Phase 4+ 增加：有 insights 的样本 + 验证 insights_referenced 非空
]
```

## 11. 变更记录

| 版本 | 日期 | 变更 | 任务编号 |
|---|---|---|---|
| v1.0 | 2026-05-27 | 初稿，从 `docs/architecture/ai-service-layer.md` 拆分而来 | ##040 |
