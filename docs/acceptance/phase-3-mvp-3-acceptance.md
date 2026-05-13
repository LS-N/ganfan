# Phase 3 / MVP 3.0 验收标准

来源：`docs/02-master-blueprint.md` 的 `MVP 3.0 — 目标干预`。

## 最终验收

- `body_patterns` 表有数据。
- 相关性置信度 > 0.6。
- 规律可视化界面数据准确。
- 断食模块可正常使用，计时准确。
- 计划生成排除了已知负向关联菜品。

## Sprint 验收

| Sprint | 验收标准 |
|---|---|
| Sprint 11 | 注入已知相关数据后，算法能检测出正确相关性；第 21 条带回访记录提交后生成 body_patterns |
| Sprint 12 | 断食中拍照弹窗出现；选择打破断食/仅记录/取消均正确处理 |
| Sprint 13 | 体重连续 3 周上升时目标可调整；连续超标触发 interventions |
| Sprint 14 | 有“辛辣 -> 肠胃不适”规律的用户，计划中不再推荐辛辣菜 |

## 必跑检查

```powershell
npm run lint
npm run typecheck
npm test
```
