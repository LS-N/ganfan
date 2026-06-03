# 流程 13: 个人档案管理（查看 / 修改 / 退出）

## 一、流程基本信息

| 字段 | 内容 |
|---|---|
| 流程名 | 个人档案管理 |
| 触发 | 用户切到「我的」tab |
| 涉及页面 | `s-profile` |
| 用户耗时 | 约 20-60 秒 |
| 入口动作 ID | ㊶ 档案查看 |
| 出口动作 ID | ㊷ 修改 / ㊸ 退出登录 |
| 频率估计 | 每月 1-3 次 |

## 二、四层泳道图

| # | USER | AI 生产 | Layer 1 写入 | Layer 2 触发 | Layer 3 渲染 |
|---|---|---|---|---|---|
| 1 | 切到我的 tab | — | — | — | `renderProfile()` |
| 2 | 浏览档案 | — | — | `deriveInsights()` 计算干饭风格 | **基础信息**（身高/体重/年龄/性别/饭后感受/忌口/健康背景）/ **干饭目标**（目标/单日预算）/ **干饭档案**（记录餐次/偏好餐次/干饭风格）/ 数据管理 |
| 3 | 改某字段（goal/avoid/daily_budget/...） | — | `profiles` 更新对应字段 | — | UI 刷新 |
| 4 | 看产品架构图入口 | — | — | — | `openProductMapFromProfile()` → `s-productmap` |
| 5 | 点「清空所有数据」 | — | 二次确认 → 清空本地 meals + Supabase 对应数据 | — | 回登录页 |
| 6 | 点「退出登录」 | — | session 清理；本地 SQLite session 删除；Supabase signOut | — | 回登录页 |

## 三、数据血缘

| 写入字段 | 来源 | 被哪些消费者消费 |
|---|---|---|
| `profile.goal` 修改 | UI 编辑 | deriveInsights goal_alignment angle / 抽卡 reason 文案 / 深夜 advisory |
| `profile.daily_budget` 修改 | UI 编辑 | 抽卡候选过滤 / PlanContext / PurchaseContext / SubscriptionContext |
| `profile.avoid` / 基础信息字段修改 | UI 编辑 | AI 分析 prompt / 抽卡过滤 |
| `diet_structure_type` insight（L2 输出） | deriveInsights 读取 meal.analysis 结构 | 档案页「干饭风格」区块（L3 渲染） |
| session 清理 | 退出动作 | 所有依赖 userId 的查询 |

## 四、触发条件

| 类型 | 条件 |
|---|---|
| 前置 | 已登录（guest mode 部分功能受限） |
| 防御 | 清空 / 退出二次确认 |
| 降级 | 网络失败：本地更新先于云端 |

## 五、洞察影响

### 读取的 insights
- **干饭档案·干饭风格**：读取 deriveInsights `diet_structure_type` angle 的输出（L2 → L3，已接入）
- 冷启动期（analyzed meals < 5）：干饭风格显示「再记录 X 餐解锁」，不读洞察

### 写入触发的可能洞察变化
- `profile.goal` 变更 → deriveInsights goal_alignment angle 重算（##034 修1 已实现）
- `profile.daily_budget` 变更 → 不触发 deriveInsights 重算（budget 不在 L2 输入，仅 PlanContext 消费）
- 其他基础信息字段变更 → **当前不触发 deriveInsights 重算**（架构债：profile 变更后需重算声明 vs 行为差异类洞察）

## 六、架构检查清单

- [⚠] L1 写入 append-only：profile 更新为字段覆盖，不是 append-only（与原则有偏离；Phase 2+ 加 audit 表）
- [✓] L2 重算（diet_structure_type）：干饭风格由 deriveInsights 计算，档案页渲染时从 insights 读取，已走 L2
- [⚠] L3 消费层从 L2 取数：干饭风格已走 L2；**goal / daily_budget / avoid 等字段仍被 L3 直接消费，绕过 L2**（同流程 01 架构债）
- [N/A] AI 调用
- [✓] 去重：清空 / 退出二次确认
- [⚠] 数据血缘：profile 修改未留 audit，无法溯源「曾经设过什么目标」
- [⚠] priceSatisfaction 字段 @deprecated，Phase 1.1 前需删除

## 七、已知架构债

| # | 债 | 优先级 | 关联 |
|---|---|---|---|
| 1 | profile 修改是字段覆盖，不是 append-only，无法追溯历史声明变化 | P2 | Phase 2+ 加 audit 表 |
| 2 | profile 字段（goal/daily_budget/avoid 等）仍被 L3 直接消费，绕过 L2；**部分修复**：dry 风格走 deriveInsights diet_structure_type（##035），goal_alignment 走引擎（##034） | P1 | 后续推进更多 profile 字段进入引擎 |
| 3 | `priceSatisfaction` 字段 @deprecated，待 Phase 1.1 前正式删除（feedback 不再采集价格满意度，satisfaction_avg 只反映身体感受） | P1 | Phase 1.1 删除 |
| 4 | `meal_budget_weights` 学习算法（根据用餐频率和计划执行率动态更新权重）为 Phase 2+；Phase 1 只有固定初始默认值（早20%/午35%/晚40%/加餐5%） | P2 | Phase 2 实现权重学习 |

## 八、变更记录

- 2026-05-26 初版
- 2026-05-26 ##035 重构：
  - 档案页改为三块结构：基础信息 / 干饭目标 / 干饭档案（AI状态块为原型测试专用，不进真实产品）
  - 单日预算整数替代单次外卖预算；后台 meal_budget_weights 初始默认值（早20%/午35%/晚40%/加餐5%）
  - 干饭风格接入 deriveInsights diet_structure_type angle，从 L2 读取（六种风格：肉食星人/素食星人/碳水星人/重口派/清爽派/均衡派）
  - priceSatisfaction @deprecated；推送改为饭后 20 分钟系统固定，不可用户配置
  - 四层泳道图、数据血缘、洞察影响、架构检查清单全部同步
