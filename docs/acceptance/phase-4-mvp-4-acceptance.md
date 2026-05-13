# Phase 4 / MVP 4.0 验收标准

来源：`docs/02-master-blueprint.md` 的 `MVP 4.0 — 健康整合`。

## 最终验收

- Health Connect 数据同步到 `health_data` 表。
- 有足够数据的用户看到跨维度关联。
- 饭前预测标签正确显示。
- 置信度 < 0.5 时不显示预测。
- `prediction_accuracy` 记录存在，confidence 随反馈更新。

## Sprint 验收

| Sprint | 验收标准 |
|---|---|
| Sprint 15 | 授权后能读到睡眠、步数或运动数据，并写入 `health_data` |
| Sprint 16 | 注入低睡眠 + 低消化评分数据后，关联提示出现 |
| Sprint 17 | 已知相关性 + 候选菜能得到正确预测方向；高置信度展示，低置信度隐藏 |
| Sprint 18 | 预测正确时 confidence 上升，错误时下降；72 小时内不重复同类干预 |
| Sprint 19 | 仪表盘所有模块数据准确，空数据状态可用 |

## 必跑检查

```powershell
npm run lint
npm run typecheck
npm test
```

Health Connect 必须使用真机验证。
