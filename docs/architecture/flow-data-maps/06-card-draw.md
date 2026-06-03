# 流程 06: 饭前抽卡（选状态 → 翻 3 卡 → 选一张）

## 一、流程基本信息

| 字段 | 内容 |
|---|---|
| 流程名 | 饭前抽卡 |
| 触发 | 首页点击「还没想好吃什么 →」入口 |
| 涉及页面 | `s-camera`（抽卡阶段） |
| 用户耗时 | 约 30-60 秒（选状态 + 翻卡 + 决策） |
| 入口动作 ID | ⑯ 进入抽卡 |
| 出口动作 ID | ⑱ 选定一张 |
| 频率估计 | 每餐前 0-1 次（用户选择性使用） |

## 二、四层泳道图

| # | USER | AI 生产 | Layer 1 写入 | Layer 2 触发 | Layer 3 渲染 |
|---|---|---|---|---|---|
| 1 | 选状态（压力大/想清淡/...） | — | `todayState = '...'` | — | UI 状态 |
| 2 | （自动）抽卡引擎选菜 | `aiGenerateCards(meals, profile, state)` 调 PROMPT_CARD_RECOMMEND，含 insights 上下文硬约束 | — | 读 deriveInsights mature/forming 给 AI prompt | — |
| 3 | （AI 失败时降级） | — | — | 本地 `buildCardPoolForState()` 读 insights 做 avoid 硬过滤 + preference 加权 + reaction 触发词降权 | — |
| 4 | 看 3 张暗牌 | — | — | — | `renderCardDraw()` 翻牌动画 |
| 5 | 点开一张 | — | — | — | Sheet 显示 dish + reason + advice |
| 6 | 点「选这个」 | — | `card_actions` 写入（dish, slot, recommendationStage, reason, action='picked'） | — | — |
| 7 | 跳进拍照页 | — | `drawnCard = card` 临时持有 | — | `renderCamera(); show('camera')` |

## 三、数据血缘

| 写入字段 | 来源 | 被哪些消费者消费 |
|---|---|---|
| `todayState` | UI 选择 | 抽卡 prompt / makeReason 文案 |
| `card_actions.dish` | 翻卡结果 | 历史溯源（"为什么这次吃这个"） |
| `card_actions.slot/slotLabel` | stable/alt/explore | 后续统计三槽位的命中率 |
| `card_actions.recommendationStage` | general/feedback/body_puzzle | 后续可分析各阶段质量 |
| `card_actions.action` | picked/skipped | **应作为偏好信号但当前未消费**（架构债） |
| `drawnCard` 临时持有 | 翻卡选择 | 拍照流程的 fromCard 字段写入 |

## 四、触发条件

| 类型 | 条件 |
|---|---|
| 前置 | 首页处于 DEFAULT 状态（无待反馈餐） |
| 防御 | 深夜 advisory 不阻塞，但 startMealDecision 先确认进入抽卡意图 |
| 降级 | AI 失败 → buildCardPoolForState 本地降级 |

## 五、洞察影响

### 读取的 insights
- AI prompt：mature + forming，按 category 格式化为列表（##030 完成）
- 本地降级：
  - preference mature → 偏好菜系 +5 评分
  - avoid mature → 直接过滤候选
  - reaction mature → 触发词菜降 3 分
- makeReason in body_puzzle stage：优先引用 preference insight 或避开 reaction trigger

### 写入触发的可能洞察变化
- **当前不触发**
- **架构应该：card_actions.action='picked' 是强偏好信号，应被 deriveInsights 消费**（修 4）

## 六、架构检查清单

- [✓] L1 写入 append-only：card_actions 每次新增
- [✓] L2 重算幂等：deriveInsights 调用
- [✓] L3 消费层从 L2 取数：AI prompt + 本地降级都接入 ##030
- [✓] AI 调用引用 insights：##030 已加硬约束
- [N/A] 去重：抽卡不去重，每次都新一次
- [✓] 数据血缘：card_actions 关联具体 meal_id 和 stage
- [⚠] **card_actions.action 不进 deriveInsights**（架构债）

## 七、已知架构债

| # | 债 | 优先级 | 关联 |
|---|---|---|---|
| 1 | `card_actions` 写入后不被 deriveInsights 消费，用户"用脚投票"信号被丢弃 | **P1** | 修 4 |

## 八、变更记录

- 2026-05-26 初版
