# UC-04 `leftover_compare` 餐后份量对比

> 上位架构契约见 `docs/02-master-blueprint.md` 「AI 服务层架构」章节。
> 同级 UC 列表见 [README.md](./README.md)。

## 文档信息

| 字段 | 值 |
|---|---|
| UC ID | UC-04 |
| 文档版本 | v1.0 |
| 状态 | DRAFT |
| 最小启用 Phase | 1 末期或 Phase 2（可选） |
| 关联任务 | `docs/TASK_LOG.md` ##040 |

## 1. 基本信息

```yaml
name: leftover_compare
version: v1.0
layer: producer
min_phase: 1                   # Phase 1 末期可选实装，可延后到 Phase 2
description: 对比餐前餐后两张照片，估算实际摄入比例
requires_image: true
requires_llm: true
requires_insights: false       # producer，不需要 insights
prompt_version: v1.0
```

## 2. 触发场景

- **用户动作**：饭后反馈时上传餐后剩余照片（可选行为，非必填）
- **前置条件**：必须已有 UC-01 输出（即同一餐的餐前分析已完成）

## 3. Context Schema

### 3.1 Pydantic 定义

```python
class FoodRef(BaseModel):
    name: str                                       # 必须与 UC-01 输出的 recognized_foods[].name 一致
    estimated_weight_grams: float | None = None

class LeftoverCompareContext(BaseModel):
    before_image_url: HttpUrl                       # 餐前图（来自 UC-01 用的图）
    after_image_url: HttpUrl                        # 餐后剩余图（用户新上传）
    recognized_foods: list[FoodRef] = Field(min_length=1, max_length=10)
                                                    # 来自 UC-01 输出
                                                    # 严格约束：不得推断列表外的食物
    baseline_nutrition: NutritionEstimate           # 来自 UC-01 输出
```

### 3.2 Zod 定义

```typescript
export const leftoverCompareContextSchema = z.object({
  beforeImageUrl: z.string().url(),
  afterImageUrl: z.string().url(),
  recognizedFoods: z.array(foodRefSchema).min(1).max(10),
  baselineNutrition: nutritionEstimateSchema,
})
```

### 3.3 字段消费来源

| 字段 | 来源 | 计算方式 |
|---|---|---|
| `before_image_url` | `meal_images` 表 | 同一餐的餐前图 signed URL |
| `after_image_url` | 用户新上传 | Storage 上传后生成 signed URL |
| `recognized_foods` | UC-01 输出 | 字段一一对应，禁止推断列表外食物 |
| `baseline_nutrition` | UC-01 输出 | 餐前估算的营养基准 |

## 4. Response Schema

### 4.1 Pydantic 定义

```python
class ConsumedItem(BaseModel):
    name: str                                       # 必须与输入 recognized_foods 完全一致
    consumed_pct: float = Field(ge=0, le=1)
    confidence: Literal["high", "medium", "low"]

class LeftoverCompareResponse(BaseModel):
    consumed_items: list[ConsumedItem]
    intake_ratio: float = Field(ge=0, le=1)         # 按 baseline_nutrition 权重加权平均
    leftover_desc: str                              # "米饭剩约一半，肉全吃完"
    actual_calories: str                            # "约 260-340 kcal"
    actual_carbs: str
    actual_protein: str
    actual_fat: str
    intake_insight: str                             # 一句话总结
```

### 4.2 字段下游消费

| 字段 | 谁消费 | 用途 |
|---|---|---|
| `intake_ratio` | `meal_feedback.afterPhotoCalibration` | 实际摄入校准 |
| `consumed_items[]` | 反馈页"吃了多少"明细 | 单项消耗百分比展示 |
| `leftover_desc` | 反馈页文案区 | 给用户的描述性反馈 |
| `actual_*` | 营养实际值展示 | 取代 baseline 显示 |
| `intake_insight` | 反馈洞察区 | 一句话总结 |

## 5. Prompt 模板（v1.0）

```
你是《干饭》摄入分析助手。用户提供两张同一餐照片：第一张餐前，第二张餐后剩余。

# 输入
- 餐前图：[image_1]
- 餐后图：[image_2]
- 本餐已识别食物列表（不得推断列表外的食物）：
{recognized_foods_block}
- 营养基准：
{baseline_nutrition_block}

# 任务
针对每种已知食物估计被吃掉的百分比（0-1）。

# 规则
1. consumed_items 的 name 必须与输入列表完全一致，不得新增、不得改名、不得遗漏
2. consumed_pct 是估算，confidence 反映可信度（餐后图清晰度、剩余对比明显度）
3. intake_ratio 是按 baseline_nutrition 权重的加权平均（不是简单平均）
4. leftover_desc 严格基于图片内容，不要发挥
5. actual_* 数值范围按 baseline × intake_ratio 计算，给出 "约 X-Y" 格式

# 输出
严格 JSON，匹配 LeftoverCompareResponse schema，无 Markdown 无注释。
```

## 6. Provider 需求

| 项 | 值 |
|---|---|
| Provider 类型 | LLM Vision（需要支持多图） |
| 调用接口 | `provider.call_vision_multi(prompt, [image_1, image_2], text_context)` |
| max_tokens | 500 |
| temperature | 0.1 |
| timeout_seconds | 20 |
| 估算成本（次） | $0.008 ~ $0.02（两张图） |

**注意：** 当前 `LLMProvider` Protocol 的 `call_vision()` 只接受单张图。Phase 1 末期实装本 UC 时需扩展 Provider 接口加 `call_vision_multi()` 方法。

## 7. Fallback 策略

```python
def fallback(self, ctx: LeftoverCompareContext, error: Exception) -> LeftoverCompareResponse:
    # 降级：假设全部吃完
    return LeftoverCompareResponse(
        consumed_items=[
            ConsumedItem(name=f.name, consumed_pct=1.0, confidence="low")
            for f in ctx.recognized_foods
        ],
        intake_ratio=1.0,
        leftover_desc="AI 对比不可用，按全吃完估算",
        actual_calories=f"约 {ctx.baseline_nutrition.calories} kcal",
        actual_carbs=f"约 {ctx.baseline_nutrition.carb_g}g",
        actual_protein=f"约 {ctx.baseline_nutrition.protein_g}g",
        actual_fat=f"约 {ctx.baseline_nutrition.fat_g}g",
        intake_insight="按全吃完计算，下次可手动调整。",
    )
```

## 8. 依赖关系

| 依赖类型 | 依赖项 | 说明 |
|---|---|---|
| 上游 UC（强依赖） | UC-01 meal_analysis | 必须先有 UC-01 输出才能调本 UC |
| 数据源（输入） | `meal_images` 表 | before_image_url |
| 数据源（输入） | `meal_analysis` 表 | recognized_foods + baseline_nutrition |
| 数据源（输出） | `meal_feedback` 表 | `afterPhotoCalibration` 字段 |

## 9. Phase 演进路线

| 版本 | Phase | 变化点 | 兼容性 |
|---|---|---|---|
| v1.0 | 1 末期 / 2 | 初版，需 Provider 扩展多图接口 | — |
| v1.1 | 2 | Prompt 微调 | 完全兼容 |
| v2.0 | 4+ | 接入历史摄入模式，预测实际饱腹（不只估算量） | Response 加 optional 字段 |

## 10. 评估样本

```python
eval_samples = [
    {
        "name": "米饭剩一半 + 肉全吃完",
        "context": {
            "before_image_url": "test://meal_before.jpg",
            "after_image_url": "test://meal_after_rice_half.jpg",
            "recognized_foods": [
                {"name": "米饭", "estimated_weight_grams": 200},
                {"name": "红烧肉", "estimated_weight_grams": 150},
            ],
            "baseline_nutrition": {"calories": 800, "protein_g": 30, ...},
        },
        "expected_assertions": [
            {"field": "consumed_items[0].name", "equals": "米饭"},
            {"field": "consumed_items[0].consumed_pct", "between": [0.4, 0.6]},
            {"field": "consumed_items[1].consumed_pct", "between": [0.9, 1.0]},
            {"field": "intake_ratio", "between": [0.6, 0.8]},
        ],
    },
    # 更多样本：全吃完、几乎没动、单品种、多品种
]
```

## 11. 变更记录

| 版本 | 日期 | 变更 | 任务编号 |
|---|---|---|---|
| v1.0 | 2026-05-27 | 初稿 | ##040 |
