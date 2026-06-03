# 流程 03: Guest Mode（跳过登录先体验）

## 一、流程基本信息

| 字段 | 内容 |
|---|---|
| 流程名 | Guest Mode |
| 触发 | 登录页点击「跳过登录，先体验」 |
| 涉及页面 | `s-login` → `s-home` |
| 用户耗时 | < 3 秒 |
| 入口动作 ID | ⑦ 跳过登录 (guestMode) |
| 出口动作 ID | ⑭ 首页打开 |
| 频率估计 | 试用用户 1 次 |

## 二、四层泳道图

| # | USER | AI 生产 | Layer 1 写入 | Layer 2 触发 | Layer 3 渲染 |
|---|---|---|---|---|---|
| 1 | 点击「跳过登录」 | — | `guestMode = true`；mock profile（最小默认值）；mock meals = `[]`；不写真实 Auth/Supabase | — | `renderHome(); show('home')` |
| 2 | 进入首页 | — | — | deriveInsights 输入为空 → 输出空 insights[] | 首页冷启动态：默认抽卡入口 + 无规律提示 |

## 三、数据血缘

| 写入字段 | 来源 | 被哪些消费者消费 |
|---|---|---|
| `guestMode = true` | 跳过登录入口 | 各页面判断是否真实写云端 |
| mock profile | 内置默认值 | 与真实 profile 同样消费链路（但内容为默认值） |

## 四、触发条件

| 类型 | 条件 |
|---|---|
| 前置 | 用户拒绝登录 |
| 防御 | 不写云端，所有写入只在本地 sessionStorage |
| 降级 | 退出页面即丢失所有数据（设计上接受） |

## 五、洞察影响

### 读取的 insights
- 全空。首页深夜 advisory 显示通用建议；抽卡 reason 显示冷启动文案

### 写入触发的可能洞察变化
- guest mode 期间记录的餐次也能触发 deriveInsights，但**数据不入云**

## 六、架构检查清单

- [✓] L1 写入 append-only：guest 期间 in-memory 数据也只增不改
- [✓] L2 重算幂等：与正常模式一致
- [✓] L3 消费层从 L2 取数：冷启动态正确降级
- [N/A] AI 调用（除非用户进入抽卡/拍照流程）
- [✓] 去重：guestMode flag 单一
- [⚠] 数据血缘：guest mode 数据没有真实 userId，跨设备无法恢复
- [✓] 无新孤岛

## 七、已知架构债

- 同流程 01：profile 默认值不进 deriveInsights（修 1 一并解决）
- guest 用户转为真实用户时，本地 meals 是否迁移到云端未明确（产品决策，非架构债）

## 八、变更记录

- 2026-05-26 初版
