# 干饭 · Agent 系统蓝图

> 管：产品 Agent 系统三层架构 / Orchestrator-Worker 模式 / Sub-agent 分工 / 渐进路径 / 跨 harness 协作规范。不管：capability 接口规范（→ api-architecture.md）、Agent 成本监控（→ observability.md）、Agent 安全（→ security-architecture.md）。

---

## 一、定位与边界

干饭的最高原则是「履约率优化 Agent，可被多端调用」。这个定位决定了产品从 Phase 1 起就以 Agent 系统形态存在，不是在 App 完成后才加 Agent。

本文档回答：从现在（单 Agent + 工作流文档）到未来（完整三层 Agent 系统）的路径是什么，每一步做什么，不做什么，以及怎么不踩行业已知的坑。

---

## 二、核心原则

1. **单一 Orchestrator**：不允许多个指挥官并存。多 orchestrator 会让任务状态和责任归属崩盘。
2. **Subagent context 隔离**：每个 sub-agent 有独立 context window，不互相读取。避免错误在 agent 之间传播（"Spark to Fire" 效应）。
3. **禁止 peer collaboration**：sub-agent 之间不直接通信，必须经过 orchestrator 中转。行业数据：peer collab 模式（GroupChat 等）在生产中普遍失败——一个原子错误可感染 hub-and-spoke 拓扑里 100% 的 agent。
4. **Scale effort to complexity**：简单任务用 1 个 agent，复杂任务才上 10+ sub-agent。不要为了「感觉更 AI」而过度派发。
5. **Cost & Observability from day one**：第一个 sub-agent 上线就要配成本上限和错误报警（见 observability.md）。
6. **用户面是 ONE assistant**：用户感受到的是一个有人格的饮食助手，不是多个机器人。多 agent 是工程实现细节，对用户完全透明。
7. **加而不改**：Phase 升级 = 注册新 analyzer/agent，不动已有 agent 的边界。

---

## 三、架构内容

### 3.1 三层 Agent 架构

```
┌──────────────────────────────────────────────────────────────┐
│  Layer A · 对外能力层（MCP Server）                            │
│                                                              │
│  被外部 Agent 调用：Siri / ChatGPT / Apple Intelligence       │
│  capabilities: analyze_meal / recommend_meal /               │
│                check_body_insight / log_feedback /           │
│                query_nutrition（详见 api-architecture.md）    │
│                                                              │
│  绑定姿势（Spotify 模式）：外部 Agent 调用能力，               │
│  账号和数据所有权仍归 App                                     │
└─────────────────────────┬────────────────────────────────────┘
                          │ capability API（同一套）
┌─────────────────────────┴────────────────────────────────────┐
│  Layer B · 用户面 Agent（App 内）                              │
│                                                              │
│  形态三合一：                                                  │
│  - 对话式：用户随时问「今天该吃啥」                             │
│  - 任务驱动：餐前抽卡 / 餐后反馈 / 建档 / 建议                  │
│  - 主动推送：洞察成熟通知 / 转化钩子 / 履约提醒                  │
│                                                              │
│  用户感受到的是 ONE assistant，后端多 agent 完全透明            │
└─────────────────────────┬────────────────────────────────────┘
                          │ 内部调用
┌─────────────────────────┴────────────────────────────────────┐
│  Layer C · 后端 Agent 群（组织 AI）                            │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │               Orchestrator（单点指挥官）               │   │
│  │  读 CURRENT_WORK / 分派任务 / 合并结果 / 走门控        │   │
│  └──────────┬──────────────────────────────────────────┘   │
│             │ 分派（不允许 subagent 之间直接通信）              │
│  ┌──────────┴────────────────────────────────────────────┐  │
│  │ 开发 Agents         运维 Agents        运营 Agents      │  │
│  │ Mobile             Monitor           Insight Quality  │  │
│  │ AI Service         Resource          Content          │  │
│  │ Data Layer         Migration         Growth           │  │
│  │ Insight Engine     Cost              Support          │  │
│  │ QA                 Security                          │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                          │
              ┌───────────┴───────────┐
              │  共享层（通信协议）     │
              │  蓝图 / CURRENT_WORK  │
              │  TASK_LOG / LESSONS   │
              │  git / src/ / docs/   │
              └───────────────────────┘
```

### 3.2 当前态 vs 目标态

| 维度 | 当前态（Phase 1）| 目标态（Phase 3-5）|
|---|---|---|
| 开发 Agent | 单 Agent（Claude/Codex 轮班）+ 强工作流文档 | 5 个 sub-agent：Mobile / AI Service / Data / Insight / QA |
| Orchestrator | 你（人类）+ 主 session | 主 session 退居调度，你只拍战略决策 |
| 运维 Agent | 无（手动）| Monitor / Cost / Migration / Security 自动化 |
| 运营 Agent | 无（手动）| Insight Quality / Content / Growth / Support |
| 用户面 Agent | 静态 UI + 推送按钮 | 对话 + 任务 + 推送三合一 ONE assistant |
| 对外能力层 | FastAPI 接口边界已设计（不暴露）| MCP Server 完整对外开放 |

### 3.3 Sub-agent 渐进路径（与 Phase 对齐）

| 优先级 | 引入哪个 | 解决什么 | 时机 | 引入条件 |
|---|---|---|---|---|
| 1 | **QA Agent** | 自动跑 lint/typecheck/test/验收，把质量门自动化 | Phase 1 真实联调期 | 立刻可做（.claude/agents/ganfan-qa.md）|
| 2 | **Insight Engine Agent** | 算法模块独立，上下文最自洽 | Phase 2 启动 | Insight 算法稳定后 |
| 3 | **AI Service Agent** | FastAPI 独立维护，边界清晰 | Phase 2-3 | FastAPI 迁到 services/ai/ 后 |
| 4 | **Mobile Agent** | RN 模块最大，最后拆 | Phase 3 | Mobile 代码量稳定后 |
| 5 | **Orchestrator 升级** | 主 session 退居二线，专做调度 | Phase 3-4 | 前 4 个 sub-agent 稳定后 |
| 6 | **运维 Agent 群** | 真实用户 > 100 后才值得 | Phase 3-4 | 用户量达标 |
| 7 | **运营 Agent 群** | 真实用户 > 1000 后才值得 | Phase 4-5 | 用户量达标 |

### 3.4 每个 Sub-agent 的标准定义格式

每个 sub-agent 在 `.claude/agents/<name>.md` 中定义，frontmatter 必须包含：

```yaml
---
name: ganfan-<模块>
description: 一句话：这个 agent 的职责和触发条件
tools: [只允许访问的工具列表]
model: sonnet  # 默认 sonnet，除非需要 Opus 深度推理
---

# 职责边界
[管什么、不管什么]

# 必读文档
[只读与本模块相关的架构文档和 Phase 文档]

# 触发条件
[什么任务会被派发到这个 agent]

# Escalate 条件
[什么情况下必须停下来报告主 session，不自作主张]

# 禁止事项
[这个 agent 绝对不能做的事]
```

### 3.5 跨 harness 协作（Claude Code + Codex）

干饭当前使用两个 harness：Claude Code（主要）和 Codex（辅助）。两者无法直接互相调用 sub-agent（独立进程、独立 context、独立工具协议）。

**实际协作机制**：共享文档作为通信协议
- `docs/CURRENT_WORK.md`：任何 harness 接手前必读，任何 harness 完成后必更新
- `docs/TASK_LOG.md`：任何 harness 写 START/END 记录
- `docs/lessons/LESSONS_INDEX.md`：任何 harness 遇到问题先查，有解决方案后晋升
- `git`：代码变更是两个 harness 的共同语言

**不建议做的事**：跨 harness 自动调度（搭 LangGraph/CrewAI 层）。ROI 太低——节省的切换成本远低于搭建维护成本，且引入新故障点。**人当跨 harness 的指挥官，比让 AI 互相调度更可靠**。

### 3.6 业界已知失败模式（来自 2026 年调研）

| 失败模式 | 占比 | 干饭对应防线 |
|---|---|---|
| 协调失败（agent 之间状态不同步）| 37% | 单一 Orchestrator + 共享文档作为通信协议 |
| 验证缺口（QA 未拦住合约缺口）| 21% | QA Agent 作为第一个 sub-agent |
| 因果遗忘（错误静默传播）| 高频 | Subagent context 隔离 + 禁止 peer collab |
| 错误传播雪崩（Spark to Fire）| 灾难级 | Orchestrator 作为唯一中转 |
| 成本失控（runaway agent loop）| 单次最大 | Cost monitoring from day one（见 observability.md）|

---

## 四、Phase 演进

**Phase 1（当前）**：
- 单 Agent（Claude/Codex）+ 强工作流文档 + 你当 Orchestrator
- 可选：启动 QA Agent（.claude/agents/ganfan-qa.md），验证 orchestrator-worker 模式

**Phase 2**：
- 引入 QA Agent（如 Phase 1 未做）
- 引入 Insight Engine Agent
- MCP Server 第一批 capability 上线（对应 api-architecture.md Phase 2）

**Phase 3**：
- 引入 AI Service Agent + Mobile Agent
- 用户面 Agent 升级为对话 + 任务 + 推送三合一
- 主 session 开始退居调度角色

**Phase 4-5**：
- 完整运维 Agent 群上线
- MCP Server 全量 capability
- 运营 Agent 群（用户 1000+ 后）

---

## 五、禁止事项

- **禁止多 Orchestrator**：只能有一个指挥官，不允许两个 agent 同时调度同一任务
- **禁止 peer collaboration**：sub-agent 之间不直接通信，必须经过 orchestrator
- **禁止跳过 Cost monitoring**：第一个 sub-agent 上线就配成本上限
- **禁止早期就上 100+ sub-agent**：先一个，看收益，再扩展
- **禁止把「全自动 agent」当目标**：行业数据完全自主 agent 仍有 10%+ 失败率；可预测部分用编排，AI 只在必要处用
- **禁止搭跨 harness 自动调度**：ROI 太低，引入不必要的故障点
- **禁止在 sub-agent 中做战略决策**：战略（做不做 X、改不改架构）必须 escalate 给人

---

## 六、变更记录

| 日期 | 任务编号 | 变更 |
|---|---|---|
| 2026-06-03 | ##045 | 初版落盘，纯新增（P2 F10 落地），结合 2026 年业界调研 + ##044 蓝图新增「产品形态战略」|
