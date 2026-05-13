# Phase 5 / MVP 5.0 验收标准

来源：`docs/02-master-blueprint.md` 的 `MVP 5.0 — 用户履约`。

## 最终验收

- 90 天回顾报告数据准确。
- 食材清单能从计划正确生成。
- `community_dishes` 表有聚合数据。
- 新用户推荐标注“基于与你相似的用户”。

## Sprint 验收

| Sprint | 验收标准 |
|---|---|
| Sprint 20 | 有 90 天数据的账号报告准确展示趋势和改善幅度 |
| Sprint 21-22 | 5 菜计划能生成正确食材清单和份量；沙盒采购流程完整 |
| Sprint 23-24 | 配餐订阅流程完整，数据写入 Supabase |
| Sprint 25-26 | 注入 100 个用户数据后社区评分正确；新用户推荐来自社区数据并标注来源 |

## 必跑检查

```powershell
npm run lint
npm run typecheck
npm test
```

采购和配餐相关功能必须在沙盒环境验收，不得直接连生产交易链路。
