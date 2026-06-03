# UC-XX `use_case_name` 中文名称

> **本文档是单个 AI Use Case 的契约定义。**
> 上位架构契约见 `docs/02-master-blueprint.md` 「AI 服务层架构」章节。
> 同级 UC 列表见本目录 `README.md`。

## 文档信息

| 字段 | 值 |
|---|---|
| UC ID | UC-XX |
| 文档版本 | v1.0 |
| 状态 | DRAFT / ACTIVE / DEPRECATED |
| 最小启用 Phase | 1 / 2 / ... |
| 关联任务 | `docs/TASK_LOG.md` ##XXX |

## 1. 基本信息（元数据）

```yaml
name: use_case_name                    # 全局唯一 snake_case
version: v1.0                          # UC 整体版本
layer: producer | consumer | enricher  # 数据架构层归属
min_phase: 1                           # 最小启用 Phase
description: 一句话说明本 UC 做什么
requires_image: true | false
requires_llm: true | false             # false = 算法类（如向量检索）
requires_insights: true | false        # consumer 必须 true
prompt_version: v1.0                   # Prompt 文本版本，与 version 解耦
```

## 2. 触发场景

描述本 UC 在产品中什么时候被调用：

- 用户动作触发：例如「拍照后立即」
- 系统事件触发：例如「身体页刷新 / 新规律成熟」
- 定时触发：例如「每天 9 点的夜宵提醒」

## 3. Context Schema（输入）

### 3.1 Pydantic 定义（FastAPI 端）

```python
class XxxContext(BaseModel):
    # 必填字段
    field_name: str = Field(...)

    # 可选字段
    optional_field: list[str] = Field(default_factory=list, max_length=N)

    # 类型化枚举
    enum_field: Literal["a", "b", "c"]
```

### 3.2 Zod 定义（App 端）

```typescript
export const xxxContextSchema = z.object({
  fieldName: z.string(),
  optionalField: z.array(z.string()).max(N).default([]),
  enumField: z.enum(["a", "b", "c"]),
})

export type XxxContext = z.infer<typeof xxxContextSchema>
```

### 3.3 字段消费来源说明

| 字段 | 来源 | 计算方式 |
|---|---|---|
| field_name | 用户输入 / profile / deriveInsights | 描述 |

## 4. Response Schema（输出）

### 4.1 Pydantic 定义

```python
class XxxResponse(BaseModel):
    # 必填字段
    result_field: str

    # 元数据
    confidence: Literal["low", "medium", "high"]
    insights_referenced: list[str]  # consumer 必须有，治理审计用
```

### 4.2 Zod 定义

```typescript
export const xxxResponseSchema = z.object({
  resultField: z.string(),
  confidence: z.enum(["low", "medium", "high"]),
  insightsReferenced: z.array(z.string()),
})
```

### 4.3 字段下游消费说明

| 字段 | 谁消费 | 用途 |
|---|---|---|
| result_field | 哪个 screen / store | 用于什么展示或计算 |

## 5. Prompt 模板（requires_llm=true 时必填）

```
你是《干饭》XXX 服务，[一句话角色定义]。

# 输入上下文
- 字段1：{field_1}
- 字段2：{field_2}
- 洞察列表（consumer 必须）：
{insights_block}

# 任务
[一段话描述任务]

# 关键规则
1. [规则1]
2. [规则2]
3. [洞察硬约束] consumer 必须写：所有结论必须引用 insights 列表，不得编造列表外的因果关系

# 输出
严格 JSON，匹配 XxxResponse schema，无 Markdown 无注释。
```

**Prompt 设计原则：**
- Layer 1 producer：禁用 insights，只描述图像或事实
- Layer 3 consumer：必须有「洞察硬约束」段落，禁止 LLM 编造规律

## 6. Provider 需求

| 项 | 值 |
|---|---|
| Provider 类型 | LLM Vision / LLM Text / Embedding / None |
| 调用接口 | `provider.call_vision()` / `call_text()` / `call_embedding()` |
| max_tokens | 900 |
| temperature | 0.2 |
| timeout_seconds | 25 |
| 估算成本（次） | $0.001 ~ $0.01 |

## 7. Fallback 策略

```python
def fallback(self, ctx: XxxContext, error: Exception) -> XxxResponse:
    # 降级返回必须是合法的 Response Schema 实例
    # 推荐策略：
    # 1. 用 ctx 中已有的数据构造合理默认值
    # 2. 不要返回空字段或 null
    # 3. 在元数据字段标注 fallback 原因
    return XxxResponse(...)
```

**降级触发条件：**
- Provider 超时
- Provider HTTP 错误
- LLM 返回 JSON 解析失败
- Response Schema 校验失败
- UC 被开关关闭（env var）

## 8. 依赖关系

| 依赖类型 | 依赖项 | 说明 |
|---|---|---|
| 上游 UC | UC-XX | 本 UC 消费 UC-XX 的输出 |
| 下游 UC | UC-YY | UC-YY 消费本 UC 的输出 |
| 数据源 | meals / profiles / ... | Layer 1 表 |
| 洞察 | Insight category=X | Layer 2 输出 |

## 9. Phase 演进路线

| 版本 | Phase | 变化点 | 兼容性 |
|---|---|---|---|
| v1.0 | 1 | 初版 | — |
| v1.1 | 1 | Prompt 微调 | 完全兼容 |
| v2.0 | 2 | Context 加 optional 字段 | 向后兼容 |
| v3.0 | 4 | Response 字段重命名 | 破坏性，App 同步升级 |

## 10. 评估样本（治理预留，Phase 4+ 启用）

```python
eval_samples = [
    {
        "name": "样本名称描述",
        "context": XxxContext(...).model_dump(),
        "expected_assertions": [
            {"field": "result_field", "equals": "expected_value"},
            {"field": "confidence", "in": ["medium", "high"]},
        ],
    },
    # ... 至少 5 个代表性样本
]
```

## 11. 变更记录

| 版本 | 日期 | 变更 | 任务编号 |
|---|---|---|---|
| v1.0 | YYYY-MM-DD | 初稿 | ##XXX |
