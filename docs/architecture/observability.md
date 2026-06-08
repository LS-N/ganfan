# 干饭 · 观测架构

> 管：AI 调用成本控制 / 错误报警 / 用户行为埋点 / 盈亏监测接入。不管：Prompt 评估细节（→ model-architecture.md）、业务指标算法（→ 业务方案）。
> **Phase 1 上线红线**：本文档第三节「Phase 1 最小闭环」的 5 件事必须在上线前全部落地。

---

## 一、定位与边界

本文档是干饭所有「知道发生了什么」类能力的唯一权威来源。与以下文档有边界：
- `model-architecture.md`：Prompt 的版本和效果评估在那里；本文档只管调用成本和延迟的监控数据收集
- `security-architecture.md`：错误日志不能含 PII 和 token，由那里定义脱敏规则
- `engineering-architecture.md`：监控 agent 的部署方式在那里
- `docs/business/break-even-monitoring.md`：盈亏指标的定义和仪表盘 UI 在那里；本文档提供数据接入规范

---

## 二、核心原则

1. **观测从 Day 1 开始**：不允许「先上线再加监控」。成本记录和错误报警必须和业务代码同步上线。
   - 为什么：业界教训，AI agent 死循环一天可烧 ¥50 万+，没有电表=裸奔
2. **硬熔断不能用 AI 决策**：成本超限的熔断必须是纯规则代码，不经过任何 LLM。
   - 为什么：用 AI 决定是否关掉 AI，在 AI 不可用时失效
3. **三级预警，只有红色打扰用户**：🟢 静默记录 / 🟡 Agent 自动处理 / 🔴 立即推送用户
   - 为什么：过多打扰让用户屏蔽通知，真正危险时反而看不到
4. **埋点必须分层（响应用户分层策略）**：三类目标用户（轻度量化 / 重度托管 / 健康极客）有独立的分层指标
   - 为什么：不分层的埋点无法验证商业假设
5. **成本透明可追溯**：每笔 AI 调用必须能从 user_id + use_case + 时间追回 token 数和 ¥ 成本
   - 为什么：月底账单出问题时必须能定位到具体 use_case 和用户群

---

## 三、架构内容

### 3.1 AI 调用成本控制

**ai_call_log 表结构**：
```sql
CREATE TABLE ai_call_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id),
  use_case        TEXT NOT NULL,        -- 'meal_analyze' | 'card_draw' | 'insight_generate' 等
  provider        TEXT NOT NULL,        -- 'siliconflow' | 'anthropic' | 'mock'
  model           TEXT NOT NULL,
  prompt_version  TEXT NOT NULL,        -- 对应 model-architecture.md 的 prompt_version
  input_tokens    INT,
  output_tokens   INT,
  cost_cny        NUMERIC(10, 6),       -- 折算人民币，精确到分以下
  latency_ms      INT,
  status          TEXT NOT NULL,        -- 'success' | 'fallback_mock' | 'timeout' | 'error'
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

**成本上限规则**：
| 级别 | 阈值 | 动作 |
|---|---|---|
| 免费用户日上限 | ¥1/天 | 超出自动降级 mock，标注 status=fallback_mock |
| 付费用户日上限 | ¥10/天 | 超出降级 mock + 提示「今日 AI 额度已用完」|
| 平台日上限 Phase 1 | ¥200/天 | 硬熔断：全平台降级 mock + 立即推送用户 🔴 |
| 平台日上限 Phase 2 | ¥500/天 | 同上 |
| 平台日上限 Phase 3+ | ¥2000/天 | 同上 |

**Provider 重试与超时**：
- 单次调用最大等待：25s
- 超时后：跳过向量搜索，保留 AI 估算（nutrition_source = 'ai_estimate'）
- 失败后重试：1 次，再失败降级 mock
- Vision 识别失败：降级关键词匹配，标注 source = 'keyword_match'

### 3.2 错误报警

**报警触发条件**：
| 条件 | 级别 | 处理 |
|---|---|---|
| 任何未捕获异常 / 5xx | 🟡 | Agent 自动分析，记录日志 |
| AI provider 不可用（连续 3 次失败）| 🔴 | 立即推送用户 + 全平台降级 mock |
| Supabase 连接失败 | 🔴 | 推送用户 + 本地 SQLite 继续工作 |
| 用户登录失败率 > 10%（5 分钟窗口）| 🔴 | 推送用户 |
| signed URL 生成失败率 > 5% | 🟡 | Agent 自动重试 |
| 平台日成本超限 | 🔴 | 推送用户 + 附已采取措施 |

**报警去重**：同一错误类型 5 分钟内只推一次。

**报警渠道（Phase 1 选一个即可）**：飞书 webhook / 钉钉 webhook / 邮件。渠道配置在 `.env` 的 `ALERT_WEBHOOK_URL` 环境变量。

**三级预警详细**：
- 🟢 健康：盈亏覆盖率 ≥ 100%，数据 Agent 静默记录，不打扰
- 🟡 预警：覆盖率 80-100% 或非致命错误，Agent 自动响应（收紧限次 / 优化缓存 / 增强钩子），仪表盘标黄，不推送
- 🔴 危险：覆盖率 < 80% 或 AI 账单超限或核心服务不可用，立即推送用户，附已采取措施 + 待拍板项

### 3.3 用户行为埋点

**分层验证指标（P1 F7 核心，对应蓝图「用户分层与产品形态对应」）**：
| 指标 | 说明 | 服务哪个用户层 |
|---|---|---|
| daily_photo_count | 每用户每天拍照记录次数 | 轻度量化派活跃度 |
| delivery_click_count | 从抽卡/计划进入外卖跳转次数 | 重度托管派验证信号 |
| health_auth_rate | 用户授权 Apple/小米/华为健康的占比 | 健康极客派触达率 |

**转化漏斗埋点（对应 subscription-plan.md 转化钩子前移）**：
| 事件 | 触发时机 | 关键属性 |
|---|---|---|
| onboarding_completed | 首次完成建档 | user_id, duration_ms |
| first_meal_analyzed | 首餐分析完成 | user_id, source（vision/mock）|
| day1_hook_shown | 第 1 天首餐后展示钩子 | user_id |
| day3_hook_shown | 第 3 天第 3 餐记录后 | user_id |
| day7_hook_shown | 第 7 天积累 5+ 餐后 | user_id |
| day7_delivery_hook_shown | 第 7 天托管派识别触发 | user_id |
| paywall_viewed | 付费墙展示 | user_id, tier（①②③④）|
| subscription_started | 付费完成 | user_id, tier, amount_cny, period（monthly/yearly）|
| card_drawn | 抽卡翻牌 | user_id, slot, recommendation_stage |
| card_accepted | 选择推荐卡 | user_id, dish, slot |
| feedback_submitted | 饭后反馈提交 | user_id, comfort, fullness, satisfaction |
| body_puzzle_block_unlocked | 身体拼图块解锁 | user_id, block_index |

**埋点实现规范**：
- 写入 `fulfillment_events` 表（见 data-architecture.md 的 Migration 006）
- event_type 使用上表中的 snake_case 名称
- 不在日志中打印 user_id 明文（安全规则见 security-architecture.md）

### 3.4 盈亏监测接入

盈亏指标定义见 `docs/business/break-even-monitoring.md`，本文档只规定数据接入方式：

**数据 Agent 每日跑（复用「营养库巡检」定时机制）**：
```python
# 每天 09:00 执行
def daily_business_metrics():
    mrr = query_mrr()              # 付费用户 × ARPPU
    total_cost = query_ai_costs()  # ai_call_log 本月累计
    paid_users = count_paid_users()
    free_ai_cost = query_free_user_ai_cost()
    
    coverage_rate = mrr / total_cost if total_cost > 0 else 999
    
    if coverage_rate < 0.8:
        send_alert(level='RED', message=f'盈亏覆盖率 {coverage_rate:.0%}，低于 80%')
    elif coverage_rate < 1.0:
        log_warning(f'盈亏覆盖率 {coverage_rate:.0%}，进入预警区间')
```

**四个核心指标（定义来自 break-even-monitoring.md）**：
| 指标 | 健康阈值 | 告警线 |
|---|---|---|
| 盈亏覆盖率 MRR÷月总成本 | ≥ 100% | < 80% 🔴 |
| 单付费用户毛利 | > ¥15 | < ¥5 🔴 |
| 免费用户成本占比 | < 40% | > 60% 🟡 |
| 付费转化率 | 2-5% | < 1.5% 🟡 |

---

## 四、Phase 演进

**Phase 1 最小闭环（上线红线，必须在上线前全部落地）**：
1. ✅ 每笔 AI 调用记成本（ai_call_log 表创建 + 写入逻辑）
2. ✅ 每个用户标 free/paid + 注册日（profiles 表已有 goal 字段，扩展 subscription_tier 字段）
3. ✅ 每天定时 Agent 汇总 → 输出盈亏仪表盘（复用营养库巡检 cron）
4. ✅ AI 月账单超预设上限 → 硬熔断 + 推送用户（ALERT_WEBHOOK_URL 配置好）
5. ✅ 错误报警 webhook 配置（飞书/钉钉选一个）

**Phase 2**：加用户分群分析（按三类用户层分别看转化漏斗）

**Phase 3+**：加预测告警（预测下月成本）、异常自愈（Agent 自动收紧限次）

---

## 五、禁止事项

- 禁止「先上线再加监控」——观测必须和业务代码同步上线
- 禁止用 if-else 硬编码报警阈值在业务代码里——必须从环境变量读
- 禁止用日志代替监控——日志是事后排查，监控是事前预警
- 禁止错误日志含 user_id 明文 / PII / AI raw response（见 security-architecture.md）
- 禁止跳过 ai_call_log 记录——即使是 mock 调用也要记（标 provider=mock）
- 禁止在 AI 熔断逻辑里调用 AI——熔断必须是纯规则代码

---

## 六、变更记录

| 日期 | 任务编号 | 变更 |
|---|---|---|
| 2026-06-03 | ##045 | 初版落盘，纯新增（P1 F7 落地）|
