# 流程 02: 老用户登录（带历史进入）

## 一、流程基本信息

| 字段 | 内容 |
|---|---|
| 流程名 | 老用户登录 |
| 触发 | 用户在身份选择页点「我是老用户」 |
| 涉及页面 | `s-login` → `s-home` |
| 用户耗时 | < 5 秒（demo 演示快速进入） |
| 入口动作 ID | ⑥ 老用户带历史进入 |
| 出口动作 ID | ⑭ 首页打开 |
| 频率估计 | 每用户每个 session 1 次 |

## 二、四层泳道图

| # | USER | AI 生产 | Layer 1 写入 | Layer 2 触发 | Layer 3 渲染 |
|---|---|---|---|---|---|
| 1 | 选「我是老用户」 | — | — | — | `openReturningUserAuth()` |
| 2 | 点击进入 | — | `saveUserSession(user)` 写入；`profile = {...RETURNING_USER_PROFILE}`；`meals = demoRichSeedMeals()` 加载历史 30+ 餐；`correctionHistory=[]` | — | `resetMealFlowState()` |
| 3 | 跳转首页 | — | `setUserDataForCurrent(meals, profile)` 持久化 | 隐含：下游消费者首次调用 `deriveInsights` 时重算 | `renderHome(); show('home')` |
| 4 | 首页常驻态 | — | — | 各消费者读 deriveInsights | 首页状态机、深夜 advisory 卡 |

## 三、数据血缘

| 写入字段 | 来源 | 被哪些消费者消费 |
|---|---|---|
| `meals[]`（30+ 条 seed 餐） | `demoRichSeedMeals()` 内置数据集 | 所有 L3 消费者 |
| `profile`（RETURNING_USER_PROFILE） | 常量 | 同新用户 profile 字段消费者 |

## 四、触发条件

| 类型 | 条件 |
|---|---|
| 前置 | 演示模式下任意进入 |
| 防御 | 无 |
| 降级 | 无 |

## 五、洞察影响

### 读取的 insights
- 首页深夜 advisory 卡读 `late_night_eating_reaction`
- 抽卡 reason 隐式读 insights（如果用户进抽卡）

### 写入触发的可能洞察变化
- 加载 seed meals 不写新数据，只是把 idempotent 引擎的输入"准备好"
- 后续任意一次 deriveInsights 调用都会基于完整 seed 数据出洞察

## 六、架构检查清单

- [✓] L1 写入 append-only：seed meals 一次性加载，不更新
- [✓] L2 重算幂等：依赖 deriveInsights idempotent
- [✓] L3 消费层从 L2 取数：渲染时正确读引擎
- [N/A] AI 调用
- [✓] 去重：登录一次进入一次
- [✓] 数据血缘：seed 数据有固定 id，sourceRefs 可追溯
- [✓] 无新孤岛

## 七、已知架构债

- 同流程 01：`profile.goal/avoid/...` 不进 deriveInsights（修 1）

## 八、变更记录

- 2026-05-26 初版
