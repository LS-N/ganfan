# AI 餐食分析模型架构说明

## 1. 文档目的

本文用于说明《干饭》餐食 AI 分析的目标架构，给后续开发实施方案做注释。

当前产品原型可以为了展示终局效果，使用强多模态模型一次性返回完整分析结果。但正式开发不能把完整营养分析长期依赖在单次视觉大模型输出上。

## 2. 核心结论

餐食分析的正式架构应采用分层流水线：

```text
餐食照片
→ 视觉识别层
→ 食物标准化层
→ 营养计算层
→ 风险判断层
→ 建议生成层
→ Analysis 完整对象
```

视觉模型只负责“看见了什么”和“份量大概多少”。营养数据、风险规则和建议生成应由结构化系统补全，避免让大模型凭图片直接编完整营养报告。

## 3. 原型阶段策略

原型目标是展示终局体验，因此允许：

- 使用强视觉模型直接分析餐图。
- 一次性返回完整 Analysis JSON。
- 使用较高成本模型换取演示效果。
- 允许结果为范围估算，不承诺精确克数和医学结论。

原型推荐模型选择原则：

- 必须明确支持视觉输入。
- 优先选择 Instruct / Vision-Language 模型。
- 避免普通文本模型。
- 避免 Thinking 模型作为默认分析模型，因为响应通常更慢。
- 避免只因参数更大而选择模型，餐图分析更看重视觉稳定性和结构化输出能力。

SiliconFlow 原型优先候选：

```text
Qwen/Qwen3-VL-32B-Instruct
Qwen/Qwen3-VL-8B-Instruct
Qwen/Qwen3-VL-30B-A3B-Instruct
```

## 4. 正式开发目标架构

### 4.1 视觉识别层

输入：

- 餐食图片
- 餐次
- 用户可选上下文，例如目标、忌口、常见感受

输出只包含可见事实：

```json
{
  "foodType": "meal",
  "dish": "水煮鱼 + 青菜汤",
  "scene": "堂食",
  "recognizedFoods": [
    {
      "name": "水煮鱼",
      "category": "蛋白质/主菜",
      "quantityText": "1大盆",
      "estimatedWeightGrams": 600,
      "confidence": "medium",
      "visibleBasis": ["红油汤底", "鱼片可见"]
    }
  ],
  "imageQuality": {
    "clarity": "medium",
    "occlusion": "low",
    "note": "多人份餐食，份量估计不确定"
  }
}
```

视觉层禁止直接输出：

- 精确热量
- 精确营养克数
- 医疗结论
- 没有依据的个人化断言

### 4.2 食物标准化层

目标：

把视觉模型识别出的自然语言食物名转成系统可计算的标准食物或菜品模板。

第一阶段使用本地规则，不立即上向量库：

- alias 匹配
- category 匹配
- 常见菜品模板拆解
- 置信度排序

示例：

```text
黄焖鸡米饭 → 鸡肉 + 米饭 + 酱汁
酸菜鱼 → 鱼肉 + 酸菜 + 重盐汤底
麻辣香锅 → 蛋白质/蔬菜/豆制品 + 重油调味
奶茶 → 甜饮 + 乳制品 + 咖啡因可选
```

后续当用户纠错数据足够时，再引入向量检索：

```text
识别食物名 / 用户修正名
→ embedding
→ 检索标准食物、菜品模板、商家菜品
→ 返回候选
```

向量库用于“匹配候选”，不作为营养真值来源。

### 4.3 营养计算层

营养真值来自结构化数据表，而不是视觉模型自由生成。

基础数据结构：

```ts
type NutritionFoodItem = {
  id: string;
  name: string;
  aliases: string[];
  category: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g?: number;
  sodiumPer100g?: number;
  sugarPer100g?: number;
};
```

计算方式：

```text
标准食物 + 估计重量
→ 每项营养范围
→ 总热量范围
→ 主食/蛋白/蔬菜/油脂/钠/糖等范围判断
```

MVP 阶段不承诺精确值，只输出范围：

```text
约 650-850 kcal
碳水偏高
蛋白质中等
油脂偏高
钠可能偏高
```

### 4.4 风险判断层

风险判断使用规则优先：

```text
高油 + 高碳 → 饭后困倦风险
高钠 + 汤汁多 → 口渴风险
蛋白质不足 + 主食偏多 → 饱腹不稳
蔬菜纤维不足 → 饭后反馈重点关注胀/饿
甜饮替代正餐 → 空腹刺激或能量不稳
```

规则输出必须是可能性表达：

```text
这类组合可能让你饭后犯困，需要饭后反馈验证。
```

禁止：

```text
这顿一定会长胖。
这顿会导致血糖异常。
```

### 4.5 建议生成层

建议可以先用规则生成，后续再使用轻量文本模型润色。

建议生成输入：

- 标准化食物项
- 营养范围
- 风险标签
- 用户目标
- 历史饭后反馈
- 身体拼图状态

输出：

```json
{
  "howMuch": "主食少吃几口，吃到七分饱。",
  "howToEat": ["先吃鱼和青菜", "少喝红油汤", "主食后吃"],
  "reduceOrAvoid": ["少喝汤汁", "不要额外加甜饮"],
  "feedbackFocus": ["困不困", "口渴吗", "撑不撑"]
}
```

## 5. RAG 与营养向量库定位

不建议在 MVP 第一阶段直接建设完整 RAG。

推荐顺序：

1. 本地结构化营养表。
2. 常见菜品模板。
3. alias/category 规则匹配。
4. 用户纠错数据沉淀。
5. 向量检索候选。
6. 商家菜品和地区菜品扩展。

RAG/向量库适合解决：

- 地方菜名和口语菜名匹配。
- 外卖菜品名匹配。
- 用户修正后的标准食物召回。
- 相似菜品模板推荐。

RAG/向量库不适合直接解决：

- 营养数值真值。
- 医学判断。
- 无依据的精确克数。

## 6. Analysis 最终对象

无论内部如何分层，前端最终接收完整 Analysis 对象。

```ts
type Analysis = {
  id: string;
  mealId: string;
  source: "ai" | "mock" | "manual";
  foodType: string;
  dish: string;
  recognizedFoods: RecognizedFood[];
  nutritionEstimate: NutritionEstimate;
  typeFields: {
    staple?: string;
    protein?: string;
    vegetable?: string;
    oil?: string;
    portion?: string;
  };
  risk: "low" | "medium" | "high";
  tags: string[];
  detail: string[];
  advice: string;
  eatingAdvice: EatingAdvice;
  confidence: "high" | "medium" | "low";
  imageQualityNote?: string;
  analysisMeta: {
    pipelineVersion: string;
    visionModel?: string;
    nutritionDbVersion?: string;
    ruleVersion?: string;
    durationMs: number;
  };
};
```

## 7. 实施阶段建议

### 原型阶段

- 使用强视觉模型直出完整 Analysis。
- 目标是展示终局体验。
- 允许成本高，但必须可配置模型和接口。
- 失败态必须可恢复：重新分析、重新选图、模拟结果继续。

### MVP 0.1 开发阶段

- 不在前端直连大模型。
- 新增 AI Service 层。
- Key 只存在服务端环境变量。
- 前端调用内部 API。
- 先做视觉识别 + 本地营养规则补全。
- 30 秒内必须返回结果或兜底。

### MVP 0.2+

- 引入用户纠错闭环。
- 引入标准食物库和菜品模板版本管理。
- 根据真实记录建立用户个人反应规则。
- 评估是否引入向量检索。

## 8. 开发注意事项

- 不记录、不打印用户隐私图片和原始 Key。
- AI 输出必须做 JSON Schema 校验。
- AI 失败必须有兜底，不阻断饭后反馈闭环。
- 所有营养数值使用范围和置信度，不承诺精确。
- preview / production 模型配置必须区分。
- 原型里的前端直连大模型不能进入正式 App。

