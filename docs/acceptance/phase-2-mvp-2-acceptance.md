# Phase 2 / MVP 2.0 计划推荐验收清单

来源：`docs/02-master-blueprint.md` 第 2286-2387 行。

任何 Phase 2 任务结束前，必须逐条标记 `PASS` / `PARTIAL` / `FAIL` / `N/A`，并写入 `docs/TASK_LOG.md`。

## 最终验收

- [ ] DishScore 随新数据自动更新。
- [ ] 周计划 7 天 x 3 餐生成完整，无重复菜系同天出现。
- [ ] 记录后 `nutrition_targets.consumed` 实时更新。
- [ ] 有 2 周数据的用户能看到“按计划 vs 不按计划”对比。

## 任务级验收

| 任务 | 验收项 |
|---|---|
| T7-01 | 5 条测试餐次可验证 DishScore 计算正确；`dish_scores` upsert 成功；meal_feedback 提交后异步重算 |
| T7-02 | 有/无 DishScore 的推荐结果存在差异；置信度 <0.3 时回退规则引擎 |
| T7-03 | 不同 profile 的 TDEE 和宏量目标计算符合基础营养规则；`nutrition_targets` 每日自动创建 |
| T8-01 | 7 天 x 3 餐计划完整；同天无重复菜系；满足营养目标；写入 `meal_plans` 和 `plan_slots` |
| T8-02 | 计划界面渲染正确；长按换菜可用；`swapped_to` 持久化；重开 App 仍显示换后的菜 |
| T9-01 | 记录午饭后同日同餐型 plan_slot 的 `executed_meal_id` 有值 |
| T9-01b | 按计划吃为 `eaten`；手动没吃为 `skipped`; 换菜记录为 `swapped`; 执行状态可用于周报 |
| T9-02 | 记录一餐后当日营养进度条更新 |
| T10-01 | 有 7 天数据生成报告；无数据不生成不报错；同一周二次触发返回已有记录不重写 |
| T10-02 | 首页周报卡片内容准确，引用数据与数据库一致 |

## 必跑命令

```powershell
npm run lint
npm run typecheck
npm test
```

涉及 FastAPI 或 Supabase 时，必须补充 API 和数据库验收。
