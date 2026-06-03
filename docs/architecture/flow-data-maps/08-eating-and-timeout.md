# 流程 08: 进食中 → 30 分钟超时 / 加餐

## 一、流程基本信息

| 字段 | 内容 |
|---|---|
| 流程名 | 进食状态与超时管理 |
| 触发 | 流程 07 确认开吃后进入 |
| 涉及页面 | `s-home`（PENDING_FEEDBACK 状态卡） |
| 用户耗时 | 0-30 分钟（用户行为决定） |
| 入口动作 ID | ㉑ 确认开吃 |
| 出口动作 ID | ㉒ 超时自动关闭 / ㉓ 加餐 / 转流程 09 |
| 频率估计 | 每餐 1 次 |

## 二、四层泳道图

| # | USER | AI 生产 | Layer 1 写入 | Layer 2 触发 | Layer 3 渲染 |
|---|---|---|---|---|---|
| 1 | （等待中） | — | — | — | 首页 PENDING_FEEDBACK 卡显示「打分反馈」入口 |
| 2A | 点「打分反馈」 | — | — | — | 转流程 09 |
| 2B | 点「刚又吃了别的」 | — | 新增 meals 记录（type='加餐'），独立 mealStartedAt | — | 转流程 07 拍照（新餐次） |
| 2C | 30 分钟内不动 | — | `auto_closed_at` 写入；status='auto_closed' | — | 首页主卡恢复 DEFAULT + OVERDUE_FEEDBACK_HINT 提示卡 |
| 3 | 超时后补反馈 | — | （仍可补打分，进流程 09） | — | OVERDUE_FEEDBACK_HINT 入口 |

## 三、数据血缘

| 写入字段 | 来源 | 被哪些消费者消费 |
|---|---|---|
| `meals[+1] (type='加餐')` | 「刚又吃了别的」入口 | 同主餐次链路 |
| `meals.auto_closed_at` | 30 分钟定时器 | 首页状态机判断 / 历史标记 |
| `meals.status='auto_closed'` | 同上 | 同上 |
| `meals.mealDurationMs` | 反馈时间 - mealStartedAt | **未被消费**（架构债） |

## 四、触发条件

| 类型 | 条件 |
|---|---|
| 前置 | 流程 07 已写入 mealStartedAt 和 activePendingMealId |
| 防御 | 加餐路径独立创建新 meals 记录，不污染原餐 |
| 降级 | 超时不丢数据，只是 status 变化 |

## 五、洞察影响

### 读取的 insights
- 无（纯本地状态机）

### 写入触发的可能洞察变化
- 超时关闭后该餐次无 feedback → deriveInsights 不会把它纳入样本
- 加餐独立餐次进入正常流程，会被洞察消费

## 六、架构检查清单

- [✓] L1 写入 append-only：加餐 INSERT 新记录；auto_closed_at 是状态字段而非数据修改
- [N/A] L2 重算
- [✓] L3 消费层从 L2 取数：状态机不依赖 L2
- [N/A] AI 调用
- [✓] 去重：30 分钟定时器单一
- [✓] 数据血缘：加餐有独立 meal_id
- [⚠] `mealDurationMs` 无人消费

## 七、已知架构债

| # | 债 | 优先级 | 关联 |
|---|---|---|---|
| 1 | `mealDurationMs` 已记录但无消费者，浪费"进食速度→饱腹感"潜在洞察 | P2 | Phase 2+ |

## 八、变更记录

- 2026-05-26 初版
