# Phase 2 / MVP 2.0 验收标准

来源：`docs/02-master-blueprint.md` 的 `MVP 2.0 — 计划推荐`。

## 最终验收

- DishScore 随新数据自动更新。
- 周计划 7 天 x 3 餐生成完整。
- 同一天计划中不出现重复菜系过载。
- 记录后 `nutrition_targets.consumed` 实时更新。
- 有 2 周数据的用户能看到“按计划 vs 不按计划”对比。

## Sprint 验收

| Sprint | 验收标准 |
|---|---|
| Sprint 7 | 5 条测试餐次可计算 DishScore；有/无评分推荐结果有明确差异；营养目标计算符合基础营养规则 |
| Sprint 8 | 周计划生成完整，满足营养目标；换菜后持久化，重开 App 仍显示 |
| Sprint 9 | 记录餐次后 plan_slot 自动关联；eaten/swapped/skipped 状态正确；营养进度条更新 |
| Sprint 10 | 有 7 天数据生成周报；无数据不生成且不报错；同一周不重复重写 |

## 必跑检查

```powershell
npm run lint
npm run typecheck
npm test
```

涉及后端服务时，必须补充 API 测试和数据库字段验收。
