# 待办积压

## BACKLOG-001 场景字段 Phase 5 接入 AI 个性化建议

- **来源**：2026-05-27
- **说明**：分析页「场景」字段（外卖/堂食/自己做/食堂/路边摊等）目前仅做记录和菜系地图统计，不影响 AI Prompt。Phase 5 算法成熟后打通：同一道菜在不同场景（如食堂 vs 外卖）给出不同饮食建议。
- **当前状态**：未开始，等 Phase 5 排期。

## BACKLOG-002 营养类别高低判断引入科学阈值规则

- **来源**：2026-05-27
- **说明**：当前 `stapleLevel / proteinLevel / vegetableFiberLevel / oilLevel / portionLevel` 的高/中/低完全由视觉 AI 模型目测给出，无数值阈值。后期需建立一套基于科学参考值的判断规则，结合两类用户数据：
  - **基础数据**（Profile）：性别、体重、身高、年龄、每日预算、目标（减脂/增肌/维持）
  - **身体结构数据**（Body Puzzle）：通过反馈积累的 `diet_structure_type`，如碳水敏感、蛋白稳定等
  - 规则示例：蛋白质 > `体重(kg) × 1.2g` 为 high；单餐碳水 > 当日预算 × 0.4 为 high；油脂 > 25g 为 heavy 等
  - AI 估算的 `nutrition.protein/carbs/fat` 数值 + 营养库回填值，共同驱动等级字段，覆盖 AI 原始输出
- **当前状态**：未开始。触发条件：Phase 1 完成、Body Puzzle 数据积累到 mature 阶段（≥21 餐反馈）后优先排期。
