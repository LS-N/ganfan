# 流程 05: 首页深夜进食 Advisory 卡

## 一、流程基本信息

| 字段 | 内容 |
|---|---|
| 流程名 | 深夜进食 Advisory |
| 触发 | 首页打开 + 时间 ≥21:00（或 < 5:00）+ 当天已记晚饭 |
| 涉及页面 | `s-home`（inline 卡片，非阻塞） |
| 用户耗时 | 浏览 < 10 秒 |
| 入口动作 ID | ⑮ 首页深夜 advisory 卡 |
| 出口动作 ID | — |
| 频率估计 | 深夜进食用户每天 1 次 |

## 二、四层泳道图

| # | USER | AI 生产 | Layer 1 写入 | Layer 2 触发 | Layer 3 渲染 |
|---|---|---|---|---|---|
| 1 | 进入首页 | — | — | `isLateNightWithDinner()` 时间+晚饭检查 | — |
| 2 | （条件触发） | — | — | `deriveInsights(meals, 1).find(i => i.id === 'late_night_eating_reaction')` | — |
| 3 | （按 maturity 渲染） | — | — | — | `renderLateNightAdvisoryCard()` inline 卡<br>- mature: 强建议「今晚不吃了」<br>- forming: 方向性「选清淡的」<br>- sparse/null: 通用「这是通用提示」 |
| 4 | 用户浏览/忽略 | — | — | — | 不阻塞抽卡入口 |

## 三、数据血缘

| 写入字段 | 来源 | 被哪些消费者消费 |
|---|---|---|
| 无写入 | — | — |

## 四、触发条件

| 类型 | 条件 |
|---|---|
| 前置 | 时间 ≥ 21:00 或 < 5:00 + 当天已记一餐晚饭 |
| 防御 | `late_night_eating_reaction` insight 即使为空也降级展示通用建议 |
| 降级 | sparse → 通用建议 + 明确标"还在了解你" |

## 五、洞察影响

### 读取的 insights
- `late_night_eating_reaction`（reaction 类，专属 angle）

### 写入触发的可能洞察变化
- 无（纯展示）
- 用户深夜实际吃 → 流程 07/09 写入 → 间接影响下次此 insight 的 sampleSize

## 六、架构检查清单

- [N/A] L1 写入
- [✓] L2 重算幂等
- [✓] L3 消费层从 L2 取数：##027 完成后已纯走 deriveInsights
- [N/A] AI 调用
- [✓] 去重：非阻塞展示，无去重需求
- [✓] 数据血缘：insight.evidence.sourceRefs 引用具体深夜餐
- [✓] 无新孤岛

## 七、已知架构债

- 无（##027 已完成迁移）

## 八、变更记录

- 2026-05-26 初版（##027 完成后定稿）
