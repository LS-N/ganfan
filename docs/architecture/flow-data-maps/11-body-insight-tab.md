# 流程 11: 身体 Tab（拼图 + 身体洞察 + 成长时间轴）

## 一、流程基本信息

| 字段 | 内容 |
|---|---|
| 流程名 | 身体洞察查看 |
| 触发 | 用户切到「身体」tab |
| 涉及页面 | `s-insight` + 成长时间轴 sheet |
| 用户耗时 | 约 30-120 秒 |
| 入口动作 ID | ㉞ 进入身体拼图页 |
| 出口动作 ID | ㊱ 看时间轴 |
| 频率估计 | 每周 2-5 次 |

## 二、四层泳道图

| # | USER | AI 生产 | Layer 1 写入 | Layer 2 触发 | Layer 3 渲染 |
|---|---|---|---|---|---|
| 1 | 切到身体 tab | — | — | — | `renderInsight()` 入口 |
| 2 | （自动）4 块拼图判定 | — | — | **当前用 `getUnlockedPuzzleBlockKeys` 独立算法**（架构债 - 修 2）<br>应该改为读 deriveInsights 各 category 的 mature 数 | 4 块拼图（已解锁/未解锁） |
| 3 | 看 4 块拼图概览 | — | — | — | 进度条 + emoji + 状态 |
| 4 | 点开某块 | — | — | — | Sheet 展开该块详细数据 |
| 5 | 看「身体洞察」叙事 | — | — | `deriveInsights(meals, 1).filter(mature)` + `_buildParagraphs()` | 橙色 gradient 大卡「你的身体说」叙事段落（##029）|
| 6 | 点⏱时光机入口 | — | — | — | `showTimeMachineSheet()` |
| 7 | 看成长时间轴 | — | — | `deriveInsights` 提取生命周期事件（🌱浮现 / ✦成熟） | 时间轴节点 + 月度舒服率柱状图（##028） |

## 三、数据血缘

| 写入字段 | 来源 | 被哪些消费者消费 |
|---|---|---|
| 无写入 | — | — |

本流程纯读。

## 四、触发条件

| 类型 | 条件 |
|---|---|
| 前置 | 任意时刻可进入 |
| 防御 | meals < 2 时身体洞察叙事区块隐藏（无 mature 洞察） |
| 降级 | 冷启动期：4 块全未解锁；展示「再记 N 餐解锁」 |

## 五、洞察影响

### 读取的 insights
- 拼图块状态：**当前由 getUnlockedPuzzleBlockKeys 独立算**（架构债）
- 身体洞察叙事：`filter(mature).sort(confidence).map(narrative template)`
- 成长时间轴：所有 forming/mature insights 的 sourceRefs 转生命周期事件

### 写入触发的可能洞察变化
- 无（纯读）

## 六、架构检查清单

- [N/A] L1 写入
- [✓] L2 重算幂等
- [⚠] **L3 拼图块状态判定走的是平行算法，不是 deriveInsights**（架构债 P0）
- [✓] 身体洞察叙事走 deriveInsights（##029 完成）
- [✓] 成长时间轴走 deriveInsights（##028 完成）
- [N/A] AI 调用
- [N/A] 去重
- [✓] 数据血缘：所有展示能追到具体 meal_id
- [⚠] 拼图块解锁判定是孤岛

## 七、已知架构债

| # | 债 | 优先级 | 关联 |
|---|---|---|---|
| 1 | 4 块拼图解锁判定用 `getUnlockedPuzzleBlockKeys` 平行算法，与 deriveInsights 输出独立 | **P0** | 修 2 |

## 八、变更记录

- 2026-05-26 初版
