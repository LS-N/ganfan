# UC-05 `nutrition_match` 营养库语义匹配

> 上位架构契约见 `docs/02-master-blueprint.md` 「AI 服务层架构」章节。
> 同级 UC 列表见 [README.md](./README.md)。

## 文档信息

| 字段 | 值 |
|---|---|
| UC ID | UC-05 |
| 文档版本 | v1.0 |
| 状态 | DRAFT |
| 最小启用 Phase | 1 |
| 关联任务 | `docs/TASK_LOG.md` ##040 |

## 1. 基本信息

```yaml
name: nutrition_match
version: v1.0
layer: enricher                # 不属于 producer/consumer，是数据增强
min_phase: 1
description: 用 pgvector 在营养库中找最相似的标准营养项，给 UC-01 输出做营养精准化
requires_image: false
requires_llm: false            # ❗ 不是 LLM，使用 embedding + 向量检索
requires_insights: false
prompt_version: null           # 没有 Prompt
```

**关键说明：** 本 UC 是 AI 服务层中**唯一不调用 LLM 的 UC**。但仍属于 AI 服务层，因为：
- 用 AI 生成的 embedding（BAAI/bge-m3）
- 是非确定性的语义匹配
- 与其他 UC 共享 UseCase Protocol 和 Registry 模式

## 2. 触发场景

- **上游 UC 自动触发**：UC-01 输出 `dish_name` 和 `recognized_foods[*].name` 后立即触发
- **App 端可单独调用**：手动查营养库（如用户主动搜索菜品）

## 3. Context Schema

### 3.1 Pydantic 定义

```python
class NutritionMatchContext(BaseModel):
    dish_name: str = Field(min_length=1, max_length=64)
    top_k: int = Field(default=5, ge=1, le=20)
    min_similarity: float = Field(default=0.7, ge=0, le=1)
```

### 3.2 Zod 定义

```typescript
export const nutritionMatchContextSchema = z.object({
  dishName: z.string().min(1).max(64),
  topK: z.number().int().min(1).max(20).default(5),
  minSimilarity: z.number().min(0).max(1).default(0.7),
})
```

### 3.3 字段消费来源

| 字段 | 来源 | 计算方式 |
|---|---|---|
| `dish_name` | UC-01 输出的 `recognized_foods[*].name` 或用户主动输入 | 直接传入 |
| `top_k` | 调用方决定 | 默认 5，UI 展示候选数量 |
| `min_similarity` | 调用方决定 | 默认 0.7，低于此阈值视为未命中 |

## 4. Response Schema

### 4.1 Pydantic 定义

```python
class NutritionMatch(BaseModel):
    id: str                                         # nutrition_items.id (UUID)
    name: str                                       # 营养库标准菜名
    similarity: float = Field(ge=0, le=1)
    nutrition: NutritionEstimate                    # 营养库的标准营养值

class NutritionMatchResponse(BaseModel):
    top_match: NutritionMatch | None = None         # similarity >= min_similarity 的最高分
    candidates: list[NutritionMatch] = Field(default_factory=list, max_length=20)
    source_count: int                               # 营养库总条数（可见性指示）
```

### 4.2 字段下游消费

| 字段 | 谁消费 | 用途 |
|---|---|---|
| `top_match` | UC-01 输出的 `recognized_foods[*].nutrition_source` | 命中时设为 "nutrition_db"，未命中保持 "ai_estimate" |
| `top_match.name` | UC-01 输出的 `recognized_foods[*].matchedNutritionName` | 用户可见的匹配项名称 |
| `top_match.similarity` | UC-01 输出的 `recognized_foods[*].matchConfidence` | 匹配置信度 |
| `top_match.nutrition` | 营养概览精准化 | 替代 UC-01 的 ai_estimate 数值 |
| `candidates[]` | 营养明细弹层"其他候选" | 用户可手动选择更准的匹配项 |
| `source_count` | 状态提示 "营养库已连接" / "营养库未连接" | 营养来源可见性 |

## 5. 实现方式（非 LLM，使用 pgvector）

```python
class NutritionMatchUseCase:
    def execute(self, ctx: NutritionMatchContext, provider: LLMProvider | None):
        # 步骤 1：用 Provider 的 embedding 接口把 dish_name 转向量
        embedding_provider = ProviderRegistry.get_active()
        vector = embedding_provider.call_embedding(ctx.dish_name)  # 1024 维

        # 步骤 2：在 Supabase 做 cosine similarity 查询
        sql = """
        SELECT id, name, nutrition,
               1 - (embedding <=> %s::vector) AS similarity
        FROM nutrition_items
        WHERE 1 - (embedding <=> %s::vector) >= %s
        ORDER BY embedding <=> %s::vector
        LIMIT %s
        """
        rows = supabase.execute(sql, [vector, vector, ctx.min_similarity, vector, ctx.top_k])

        # 步骤 3：组装 Response
        candidates = [NutritionMatch(**row) for row in rows]
        top = candidates[0] if candidates and candidates[0].similarity >= ctx.min_similarity else None
        return NutritionMatchResponse(
            top_match=top,
            candidates=candidates,
            source_count=supabase.execute("SELECT COUNT(*) FROM nutrition_items")[0][0],
        )
```

**关键约束：**
- App 端**不直连** Supabase 查营养库，必须走 FastAPI 这一层
- 不暴露 service role key 给客户端
- 不让客户端写复杂 RLS 查询

## 6. Provider 需求

| 项 | 值 |
|---|---|
| Provider 类型 | Embedding（不是 LLM） |
| 调用接口 | `provider.call_embedding(text)` |
| 向量维度 | 1024（BAAI/bge-m3） |
| 估算成本（次） | $0.0001 ~ $0.0005（embedding 极便宜） |

**Provider 抽象层要求：** `LLMProvider` Protocol 必须包含 `call_embedding()` 方法。当前 SiliconflowProvider 已支持。

## 7. Fallback 策略

```python
def fallback(self, ctx: NutritionMatchContext, error: Exception) -> NutritionMatchResponse:
    # 多级降级
    # 1. Embedding 服务故障 → 走 SQL ILIKE 全文匹配
    try:
        sql = "SELECT id, name, nutrition FROM nutrition_items WHERE name ILIKE %s LIMIT %s"
        rows = supabase.execute(sql, [f"%{ctx.dish_name}%", ctx.top_k])
        candidates = [
            NutritionMatch(id=r["id"], name=r["name"], similarity=0.5,  # 假定相似度
                            nutrition=r["nutrition"])
            for r in rows
        ]
        return NutritionMatchResponse(
            top_match=candidates[0] if candidates else None,
            candidates=candidates,
            source_count=-1,  # 标记降级模式
        )
    except Exception:
        # 2. 全文匹配也失败 → 返回空
        return NutritionMatchResponse(
            top_match=None,
            candidates=[],
            source_count=0,
        )
```

**调用方收到 `top_match=None` 时：**
- UC-01 输出的 `recognized_foods[*].nutrition_source` 保持 "ai_estimate"
- UI 显示 "AI 估算"，不显示 "营养库匹配"

## 8. 依赖关系

| 依赖类型 | 依赖项 | 说明 |
|---|---|---|
| 上游 UC | UC-01 meal_analysis | 提供 dish_name 触发本 UC |
| 数据源 | `nutrition_items` 表（含 embedding 列） | pgvector 检索目标 |
| 数据源初始化 | 中国食物成分库 1657 条 + 自定义补充 | 已导入到生产 Supabase |
| Embedding Provider | BAAI/bge-m3 通过 SiliconFlow | 已验证可用 |

## 9. Phase 演进路线

| 版本 | Phase | 变化点 | 兼容性 |
|---|---|---|---|
| v1.0 | 1 | 单菜名查询，pgvector cosine similarity | — |
| v1.1 | 2 | 批量查询接口（一次查多个食物） | Context 加 batch_dish_names 字段 |
| v2.0 | 3 | 多模态匹配（结合图片特征） | Context 加 optional image_url |
| v3.0 | 4+ | 个性化营养库（用户校准过的优先） | 加 user_id 维度 |

## 10. 评估样本

```python
eval_samples = [
    {
        "name": "高频菜品精确命中",
        "context": {"dish_name": "红烧肉", "top_k": 5, "min_similarity": 0.7},
        "expected_assertions": [
            {"field": "top_match", "not_null": True},
            {"field": "top_match.name", "equals": "红烧肉"},
            {"field": "top_match.similarity", "gte": 0.95},
        ],
    },
    {
        "name": "近义菜品（东坡肉 → 红烧肉）",
        "context": {"dish_name": "东坡肉", "top_k": 5, "min_similarity": 0.7},
        "expected_assertions": [
            {"field": "top_match.name", "equals": "红烧肉"},
            {"field": "top_match.similarity", "between": [0.85, 0.95]},
        ],
    },
    {
        "name": "营养库未覆盖（生造菜名）",
        "context": {"dish_name": "外星宇宙料理", "top_k": 5, "min_similarity": 0.7},
        "expected_assertions": [
            {"field": "top_match", "is_null": True},
            {"field": "candidates", "length": 0},
        ],
    },
]
```

## 11. 变更记录

| 版本 | 日期 | 变更 | 任务编号 |
|---|---|---|---|
| v1.0 | 2026-05-27 | 初稿 | ##040 |
