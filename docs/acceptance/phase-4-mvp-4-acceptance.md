# Phase 4 / MVP 4.0 健康整合验收清单

来源：`docs/02-master-blueprint.md` 第 2483-2560 行。

任何 Phase 4 任务结束前，必须逐条标记 `PASS` / `PARTIAL` / `FAIL` / `N/A`，并写入 `docs/TASK_LOG.md`。

## 最终验收

- [ ] Health Connect 数据同步到 `health_data` 表。
- [ ] 有足够数据的用户看到跨维度关联。
- [ ] 饭前预测标签正确显示，置信度 <0.5 时不显示。
- [ ] `prediction_accuracy` 记录存在，confidence 随反馈更新。

## 任务级验收

| 任务 | 验收项 |
|---|---|
| T15-01 | 授权后 `health_data` 能读到睡眠数据 |
| T15-02 | 连接 Health Connect 后，昨天的睡眠/步数有数据 |
| T16-01 | 注入低睡眠 + 低消化评分数据后，关联提示出现 |
| T17-01 | 已知相关性 + 候选菜时预测方向正确 |
| T17-02 | 置信度低不显示，置信度高正确显示 |
| T18-01 | 预测正确时 confidence +0.05，错误时 -0.08；`prediction_accuracy` 写入 |
| T18-02 | 连续触发同类干预时，第 2 次在 72 小时内不显示 |
| T19-01 | 今日计划、精力、体重、断食、预测准确率模块数据准确；空数据状态有占位 |

## 必跑命令

```powershell
npm run lint
npm run typecheck
npm test
```

Health Connect、权限和通知相关验收必须使用真机。
