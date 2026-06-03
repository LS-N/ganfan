# 流程 04: 首页打开（默认态/待反馈态/超时态）

## 一、流程基本信息

| 字段 | 内容 |
|---|---|
| 流程名 | 首页打开渲染 |
| 触发 | 用户切到 home tab / 应用启动 |
| 涉及页面 | `s-home` |
| 用户耗时 | 即时 |
| 入口动作 ID | ⑭ 首页打开 |
| 出口动作 ID | — (常驻状态) |
| 频率估计 | 每天 5-20 次 |

## 二、四层泳道图

| # | USER | AI 生产 | Layer 1 写入 | Layer 2 触发 | Layer 3 渲染 |
|---|---|---|---|---|---|
| 1 | 进入首页 | — | — | 读 meals 状态机判定（DEFAULT / PENDING_FEEDBACK / OVERDUE_FEEDBACK_HINT） | `renderHome()` |
| 2 | （自动） | — | — | 调 `deriveInsights(meals, 1)`（深夜 advisory + 抽卡 reason 间接） | 状态对应的卡片 |
| 3 | （自动判断） | — | — | `isLateNightWithDinner()` + 读 `late_night_eating_reaction` insight | `renderLateNightAdvisoryCard()` 条件渲染 |

## 三、数据血缘

| 写入字段 | 来源 | 被哪些消费者消费 |
|---|---|---|
| 无写入 | — | — |

本流程纯读，不写。

## 四、触发条件

| 类型 | 条件 |
|---|---|
| 前置 | 已登录或 guestMode |
| 防御 | 状态机判定优先级：PENDING_FEEDBACK > OVERDUE_FEEDBACK_HINT > DEFAULT |
| 降级 | 无 meals 时显示纯默认态 |

## 五、洞察影响

### 读取的 insights
- `late_night_eating_reaction`（用于深夜 advisory 卡）
- 抽卡入口若被点 → 触发流程 06 加载完整 insights

### 写入触发的可能洞察变化
- 无（纯读流程）

## 六、架构检查清单

- [N/A] L1 写入：无
- [✓] L2 重算幂等：每次进首页都重算，与 idempotent 一致
- [✓] L3 消费层从 L2 取数：深夜 advisory 已接 deriveInsights（##027）
- [N/A] AI 调用
- [N/A] 去重
- [✓] 数据血缘：无写入则无血缘问题
- [✓] 无新孤岛

## 七、已知架构债

- 状态机判定纯本地计算，与 L2 无关，正确

## 八、变更记录

- 2026-05-26 初版
