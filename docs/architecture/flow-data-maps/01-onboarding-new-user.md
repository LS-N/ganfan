# 流程 01: 新用户登录 + Onboarding 建档

## 一、流程基本信息

| 字段 | 内容 |
|---|---|
| 流程名 | 新用户登录 + Onboarding |
| 触发 | 用户在身份选择页点「我是新用户」 |
| 涉及页面 | `s-login` → `s-onboard` → `s-home` |
| 用户耗时 | 约 90-180 秒（含 5 步问卷） |
| 入口动作 ID | ② 选身份 |
| 出口动作 ID | ⑬ 完成跳首页 |
| 频率估计 | 每用户 1 次（首次安装） |

## 二、四层泳道图

| # | USER | AI 生产 | Layer 1 写入 | Layer 2 触发 | Layer 3 渲染 |
|---|---|---|---|---|---|
| 1 | 选「我是新用户」 | — | — | — | `renderLogin('new')` |
| 2 | 输入手机号 + 验证码 / 选微信 | — | — | — | UI 校验 |
| 3 | 勾选用户协议 | — | — | — | `authAgreementChecked=true` |
| 4 | 点击「登录」 | — | `saveUserSession(user)`：userId/phone/loginType/loginAt 写入；`profile={}`；`meals=[]`；`correctionHistory=[]` | — | `startOnboardingFlow()` |
| 5 | 跳转 onboarding | — | — | — | `renderOnboard()` |
| 6 | Q1: 改善目标（4 选 1） | — | `profile.goal` 写入 | — | obStep 推进 |
| 7 | Q2: 忌口（4 选 1） | — | `profile.avoid` 写入 | — | obStep 推进 |
| 8 | Q3: 单日预算（4 选 1） | — | `profile.daily_budget`（整数，元）写入；同时初始化 `meal_budget_weights` 默认权重（早20%/午35%/晚40%/加餐5%） | — | obStep 推进 |
| 9 | Q4: 饭后常见感受（4 选 1） | — | `profile.feeling` 写入 | — | obStep 推进 |
| 10 | Q5: 吃饭意义（4 选 1） | — | `profile.eatingStyle` 写入（后台静默标注，档案页不展示，用于 AI 个性化建议风格） | — | obStep 推进 |
| 11 | 点击「开始记录」 | — | `setUserDataForCurrent(meals, profile)` 持久化 | — | `renderHome(); show('home')` |

## 三、数据血缘

| 写入字段 | 来源 | 被哪些消费者消费 |
|---|---|---|
| `session.userId/phone/loginType/loginAt` | 登录方式 | RLS 隔离 / 后续所有数据查询 |
| `profile.goal` | Onboarding Q1 | 抽卡 reason 文案 / 总结页通用建议 / 深夜 advisory / deriveInsights goal_alignment |
| `profile.avoid` | Onboarding Q2 | AI 分析 prompt / 抽卡过滤 |
| `profile.daily_budget`（整数，元） | Onboarding Q3 | 抽卡候选过滤 / PlanContext / PurchaseContext / SubscriptionContext |
| `meal_budget_weights`（初始默认值） | Onboarding Q3 完成后写入 | Phase 2+ 计划生成每餐预算分配；后台周任务学习更新 |
| `profile.feeling` | Onboarding Q4 | deriveInsights / 个性化追问初始触发 |
| `profile.eatingStyle` | Onboarding Q5 | AI 个性化建议风格（后台静默，不在档案页展示） |

## 四、触发条件

| 类型 | 条件 |
|---|---|
| 前置 | 用户在身份选择页选「新用户」 |
| 防御 | 必须勾选协议；手机号 ≥ 11 位；每题必答才能推进 |
| 降级 | 如果用户中途退出，下次进入回到当前 obStep |

## 五、洞察影响

### 读取的 insights
- 无（冷启动期，引擎还没数据）

### 写入触发的可能洞察变化
- **当前实现：不触发**
- **架构应该：profile 写入应作为 deriveInsights 输入之一**，归纳"声明 vs 行为差异"类洞察（修 1）

## 六、架构检查清单

- [✓] L1 写入 append-only：profile 字段每次设置都是新值
- [N/A] L2 重算幂等：本流程不触发
- [⚠] L3 消费层从 L2 取数：**profile 数据被 L3 多处直接消费，绕过了 L2**（架构债）
- [N/A] AI 调用：本流程无 AI 调用
- [✓] 去重：onboarding 只走一次
- [✓] 数据血缘：profile 字段消费者可追溯
- [⚠] **profile 是孤立的 L1 数据源，不进入洞察引擎**

## 七、已知架构债

| # | 债 | 优先级 | 关联 |
|---|---|---|---|
| 1 | profile 字段（goal/avoid/feeling 等）被 L3 多处直接消费，绕过 L2；**部分修复**：goal 已进 deriveInsights goal_alignment（##034）、diet_structure_type 角度归纳干饭风格（##035） | P1 | 后续推进更多 profile 字段进入引擎 |
| 2 | `meal_budget_weights` 学习算法（根据用餐频率/计划执行率动态更新权重）为 Phase 2+；当前 Onboarding Q3 完成后只写入固定初始默认值 | P2 | Phase 2 实现 |

## 八、变更记录

- 2026-05-26 初版
- 2026-05-26 ##035 更新：
  - Q3 题目改为「单日预算」，四选项映射为整数中点值（60元以内→50，60~120元→90，120~200元→160，200元以上→250）；同时初始化 meal_budget_weights 默认权重
  - Q5 eatingStyle 明确为后台静默标注，不在档案页展示，用于 AI 个性化建议风格
  - 数据血缘补 meal_budget_weights 行；profile.budget 消费路径更新为 daily_budget
