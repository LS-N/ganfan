# 干饭 App 全栈开发实施方案

**版本：** v1.1 | **适用：** Codex 自主开发 | **覆盖：** MVP 1.0 → 6.0

---

# 产品最高原则

《干饭》不是单纯的饮食记录 App，而是以饮食为首个垂直场景的履约率优化 Agent。App 是第一客户端，长期能力形态是可被多端和外部系统调用的履约决策引擎。

所有功能都必须服务于同一个北极星：

```text
有效履约率 = 用户接受建议后，实际完成饮食 / 采购 / 配餐 / 反馈 / 复购 / 会员闭环的比例
```

产品取舍规则：

- 不能提升履约率的功能，不做。
- 不能解释如何提升履约率的功能，先不做。
- 能提升履约率但增加用户负担的功能，优先让 AI、规则和后台任务承担负担。
- 用户动作必须拆到可度量颗粒度；每个关键动作都要能进入事件链，最终用于验证是否提升履约率。
- 架构可以有平台野心，但产品必须从单人饮食履约这个极窄场景打穿。

## 产品形态战略：App 抢心智 + MCP 拿曝光

蓝图最高原则已声明「可被多端和外部系统调用」。这不是 Phase 5+ 才考虑的事，而是 Phase 1 真实联调时就要预留接口边界的事。**等完整 App 做完再回头抽 API，付出的代价是 10 倍**（行业共识）。2026 年 MCP 已成事实标准（97M 月下载量），通用 AI 助理（Siri / ChatGPT / Apple Intelligence）正在抢占用户层 Agent 位置；垂直 App 的自然增长窗口在快速收窄。

干饭从 Phase 1 起就以两个形态并行存在：

| 形态 | 角色 | 拿什么 |
|---|---|---|
| **App** | 第一客户端，用户身份 + 数据所有权 + 商业转化主入口 | 用户心智、付费转化、完整用户画像 |
| **MCP Server** | 可被通用 AI 助理调用的饮食能力提供商 | 生态曝光、流量分发、能力沉淀 |

**绑定姿势（Spotify 模式）**：用户必须先在 App 注册才能在通用助理里调用干饭能力。MCP 暴露的是能力，账号和数据归属仍在 App。这样既不让通用助理截胡用户心智，又能享受生态分发红利。类比：你可以在 Siri 里说"播放周杰伦"，但播放历史和会员仍归 Spotify 所有。

**Phase 1 工程约束**：

- **不实现完整 MCP Server**，但 FastAPI 的对外能力 API 必须按 MCP 协议规范设计接口边界，预留 capability 暴露形状。
- **OAuth scope 从第 1 天就定义最小授权颗粒度**：只读当次咨询所需数据 + Layer 3 摘要，不暴露 Layer 1 原始数据（包括 meal_images、原始 meal_analysis、修正记录）。
- **内外能力同源**：App 内 UI 调用的 capability 和外部 Agent 调用的 capability 必须用同一套 API，不允许为 App 专设私有路由再为 MCP 暴露公开路由。

**禁止事项**：

- 禁止把 MCP Server 推迟到 Phase 5+ 才考虑——接口边界 Phase 1 真实联调时必须出。
- 禁止为 App 专用接口和 MCP 接口设计两套契约——必须同源。
- 禁止把 Layer 1 原始字段通过 MCP 直接暴露给外部 Agent。

**与履约飞轮的关系**：MCP 不是飞轮的替代，是飞轮的扩散通道。用户主流量仍来自 App 直接获客；MCP 是「让外部 Agent 帮我们触达没听过干饭的人」的渠道。两者收益不冲突。

## 用户分层与产品形态对应

「模块独立」和「身体洞察横切」回答了「我们做什么」，但没回答「我们为谁做」。用户群体不是均质的，不同用户的痛点、使用阻力和付费意愿差距极大。蓝图必须明确目标用户分层与对应产品形态，避免「产品形态服务的不是付费用户」的战略错配。

### 三类目标用户

| 用户层 | 核心痛点 | 使用阻力 | 付费意愿 | 真实付费角色 |
|---|---|---|---|---|
| **轻度量化派** | "想了解我吃了什么" | 中（每顿拍照成本高） | 低-中（¥19-29/月） | ⚠️ 流量背景，留存差但贡献训练数据 |
| **重度托管派** | "我懒得想，给我送过来" | 低（接受配送即可） | 高（¥99-199/月） | ✅ 真实付费支柱 |
| **健康极客派** | "我要生理证据掌控身体" | 高（接入健康数据 + 长期反馈） | 中-高（¥45-99/月，依赖 Phase 4） | ⚠️ 长期价值，短期变现少 |

### 各用户层对应的产品形态

| 用户层 | 产品入口 | 核心功能 | 付费档（详见 `docs/business/subscription-plan.md`） | 解锁 Phase |
|---|---|---|---|---|
| 轻度量化派 | App 拍照记录 + 抽卡 + 身体拼图 | 记录 → 反馈 → 身体洞察 | ① 了解自己 | Phase 1 |
| 重度托管派 | App 简化入口 + 配送对接 | 告诉目标 → AI 配套餐 → 自动接外卖/配送 | ② 托管饮食（新增档） | Phase 2 验证，Phase 5 完整 |
| 健康极客派 | App + 健康设备授权 | 健康信号 × 饮食因果 + 干预 | ③ 掌控自己 | Phase 4+ |

### 战略含义

1. **Phase 1-2 表面在做"记录 + 计划"，本质是在筛选「重度托管派」用户并采集训练数据**。轻度量化派的留存差是已知的，不必为了挽留这一层让 MVP 过重。
2. **「托管饮食」档必须在 Phase 2 就尝试上线**，哪怕只接美团/饿了么的轻量配送，也要在 6 个月内验证「愿意外包饮食」这个核心商业假设。不能等到 Phase 5 完整履约链路才验证——验证失败的代价是整个商业模式重审。
3. **健康极客派是 Phase 4+ 才能完整服务的群体**，短期内不必为这一层做大量 UI 投入，但 Schema 留扩展位（按「阶段独立完整性」的 JSONB 原则）。
4. **不暴露分层名称给用户**。三档付费在 UI 上对用户表达为「了解 / 托管 / 掌控」三层价值，不写「轻度派 / 重度派」这类内部分类，符合「不在 UI 上暴露 Phase 号」原则的同精神。

### 工程约束

- `docs/business/subscription-plan.md` 必须有覆盖三层用户的三档付费结构（轻度 / 托管 / 健康极客）。
- 任何新功能立项前必须回答「这服务哪一层用户？」——服务轻度量化派的功能在 Phase 1-2 不要过度堆叠。
- Phase 1 真实联调上线第一天起，必须埋点三个分层指标：①使用拍照记录的频次（轻度派活跃度）②主动选择配送/外卖的频次（托管派验证）③健康数据授权率（极客派触达）。
- 「托管档」对应的产品形态（自动接外卖）在原型上必须有一个最小可点击的入口设计，**Phase 2 启动门控前必须出原型方案**。

## 履约飞轮

《干饭》的可持续增长来自同一个飞轮：

```
低使用成本 → 高履约率（每顿都记）→ 数据连续性 → 算法优化 → 高质量反馈 → 用户感受到价值 → 继续履约
```

**飞轮的唯一脆弱点：任何一个环节让用户觉得"麻烦"，飞轮从这里断掉。**

数据的连续性（每顿都愿意记）比单次数据精度（这顿记得特别准）更有价值。在基础误差已有 ±20% 的营养估算体系里，把填写精度从粗粒度提升到细粒度的边际收益，低于因为增加操作步骤而损失的履约频次。

## 功能取舍过滤器

任何新字段、新追问、新功能，必须同时通过以下两条才能进入主流程：

1. **用户有动机填**：用户理解为什么被问，填写阻力低（≤5 秒，无需思考）。
2. **算法有增益用**：这条数据能直接改善推荐或洞察质量，且当前 Phase 已经可以消费。

| 满足条件 | 处理方式 |
|---|---|
| 两条都满足 | 进入主流程固定字段 |
| 只满足一条 | 个性化触发（仅在相关场景出现，不进入主流程） |
| 两条都不满足 | 不做，或等数据积累后重新评估 |

## 阶段独立完整性

每个 Phase（1.0–6.0）必须作为完整产品独立成立，不能依赖未来 Phase 才能为用户提供完整价值。产品迭代是一层层叠加的：也许我们永远迭代不到 3.0，但每个已发布的版本都必须是用户当下能用、用着不残的完整产品。

判定标准：如果某个功能在 Phase N 必须假设 Phase N+1 会落地才合理，那这个功能不该在 Phase N 出现。

工程约束：

- **不在 UI 上暴露 Phase 号或 Stage 枚举名**。例如不向用户写「身体结构推荐 - 4.0 解锁」「计划履约推荐」这种带阶段名的标签；标签只能描述当前数据来源（如「基于你的 47 餐 + 12 晚睡眠」）。
- **不显示"未来解锁"占位 UI**。当依赖的数据没有时，使用降级或隐藏，不要做灰色锁定卡来暗示「产品没做完」。身体拼图块在数据不足时显示「再积累几次就出来了」是合理的（依赖的是用户自己的数据积累，不是产品版本），但「健康集成功能将在 4.0 解锁」这类占位禁止出现。
- **Schema 不为未来 Phase 预留具体字段**。每个 Phase 只建该 Phase 真正用得上的字段；扩展性通过 JSONB 类型留扩展位实现，不预先定义未来字段名。这样即使 4.0–6.0 永远不来，1.0–3.0 的代码也不背技术债。
- **横切系统在每个 Phase 内部都是完整版本**。身体洞察、推荐理由等横切产物，在 1.0 就是完整的当前版本，只是基于的数据更薄；不要让 1.0 用户觉得「现在的洞察是临时版，4.0 才有真的」。

## 模块独立 + 横切层架构

产品由两类东西组成：纵向独立的功能模块，加横向沉淀的身体洞察。两者**独立又相关**——模块负责解决具体生活问题，身体洞察作为副产品被持续沉淀，反过来让模块算法更准。

### 纵向独立的功能模块

| Phase | 模块 | 主目标 |
|---|---|---|
| 1.0 | 记录感知 | 捕获食物 + 反馈 |
| 2.0 | 计划推荐 | 给出下一餐建议 |
| 3.0 | 目标干预 | 让用户达成目标 |
| 4.0 | 健康集成 | 接入真实生理信号 |
| 5.0 | 履约 | 让计划真正执行 |
| 6.0 | 食材记忆 | 管食材生命周期 |

每个模块有自己的主功能、入口和 UI，独立可用；模块之间不互相依赖才能成立。

### 横向沉淀的身体洞察

身体洞察是从每个模块运行数据中持续提炼出「身体 × 食物」因果关系的横切层。它不是某个 Phase 的独立功能，而是产品长大过程中自然累积的"记忆系统"。

每个模块的运行数据会同时被两个地方消费——模块自己的算法（用于优化主功能），和身体洞察（用于沉淀因果）：

| 模块 | 副产品信号 | 反哺身体洞察的什么 |
|---|---|---|
| 1.0 记录 | comfort / fullness / energy 反馈 | 食物特征 ↔ 身体反应 |
| 2.0 计划 | 接受 / 跳过 / 替换 | 用户对食物的真实偏好（用脚投票） |
| 3.0 目标 | 体重 / 围度趋势 | 某类餐对目标的因果权重 |
| 4.0 健康集成 | 睡眠 / HRV / 活动 | 比主观反馈更硬的生理证据 |
| 5.0 履约 | 执行 / 失守模式 | 场景 × 食物的关联 |
| 6.0 食材记忆 | 消耗速度 / 剩余 | 用户合适饭量的反推 |

举例：用户总不按计划来 → 计划模块视角是「推荐算法要优化」；身体洞察视角是「他在用脚投票，告诉我们这类食物不适合他」。同一个信号，对模块自己是「待优化」，对身体洞察是「新证据」。

### 身体洞察的唯一对外表达：身体拼图（4 块切面）

身体洞察对外只有一个家——身体拼图页。4 块拼图不是 4 个并列功能，而是「身体 × 食物」关系的四个认知切面：

| 块 | 切面 | 回答用户的问题 |
|---|---|---|
| 喜欢吃这个 😋 | 偏好 | 我喜欢什么？ |
| 我的吃法 🥢 | 因果规律 | 我吃什么会舒服 / 不舒服？ |
| 口味探索 🗺️ | 边界 | 我尝试过什么？ |
| 越来越舒服 ✨ | 趋势 | 我在变好吗？ |

四块合在一起构成完整的自我认知闭环——「我是谁、我适合什么、我去过哪、我在变好吗」。1.0–6.0 不新增拼图块，只让每块内容随数据变厚而变锋利。

### UI 边界

- 模块界面**可以引用**身体洞察作为推荐理由（如「基于你的身体规律」），但不重复展示洞察内容。
- 身体拼图页**不嵌入**模块入口或推荐功能，它只展示沉淀下来的「我是谁」。
- 首页、分析页等任何位置的洞察展示，都是**身体拼图同一份数据的不同密度切片**，不是独立计算的另一份洞察。

## 产品数据架构（Data Architecture Specification）

> 本节技术细节已迁移至 [`docs/architecture/data-architecture.md`](../architecture/data-architecture.md)。该文档是对应架构的唯一权威来源，开发时请直接查阅该文档。
> 蓝图保留产品视角：**做什么 + 为什么**；架构文档回答：**怎么实现**。

---

# AI 服务层架构

> 本节技术细节已迁移至 [`docs/architecture/model-architecture.md`](../architecture/model-architecture.md)。该文档是对应架构的唯一权威来源，开发时请直接查阅该文档。
> 蓝图保留产品视角：**做什么 + 为什么**；架构文档回答：**怎么实现**。

---

# 履约智能横向契约

> 本节技术细节已迁移至 [`docs/architecture/data-architecture.md`](../architecture/data-architecture.md)。该文档是对应架构的唯一权威来源，开发时请直接查阅该文档。
> 蓝图保留产品视角：**做什么 + 为什么**；架构文档回答：**怎么实现**。

---

# 总体架构设计

> 本节技术细节已迁移至 [`docs/architecture/engineering-architecture.md`](../architecture/engineering-architecture.md)。该文档是对应架构的唯一权威来源，开发时请直接查阅该文档。
> 蓝图保留产品视角：**做什么 + 为什么**；架构文档回答：**怎么实现**。

---

## 完整数据库 Schema

> 本节技术细节已迁移至 [`docs/architecture/data-architecture.md`](../architecture/data-architecture.md)。该文档是对应架构的唯一权威来源，开发时请直接查阅该文档。
> 蓝图保留产品视角：**做什么 + 为什么**；架构文档回答：**怎么实现**。

---

## API 接口规范

> 本节技术细节已迁移至 [`docs/architecture/api-architecture.md`](../architecture/api-architecture.md)。该文档是对应架构的唯一权威来源，开发时请直接查阅该文档。
> 蓝图保留产品视角：**做什么 + 为什么**；架构文档回答：**怎么实现**。

---

## 功能解锁阈值

```typescript
// apps/mobile/constants/unlockThresholds.ts
export const UNLOCK_THRESHOLDS = {
  // 产品阶段解锁
  STAGE_2: {
    complete_meals: 7,
    description: '个性化推荐解锁'
  },
  STAGE_3: {
    complete_meals: 21,
    checkin_rate: 0.6,
    description: '身体规律解锁'
  },
  STAGE_4: {
    high_confidence_correlations: 3,
    description: '饭前预测解锁'
  },
  STAGE_5: {
    platform_users: 1000,
    personal_accuracy: 0.65,
    description: '社区协同解锁'
  },

  // 饭前抽卡三阶段（无门槛直接可用，阶段决定推荐质量）
  DRAW_CARD: {
    general: 0,      // 0 条有效反馈：通用推荐，基于状态 fallback 菜品
    feedback: 3,     // ≥3 条有效反馈：按历史反馈过滤+加权
    body_puzzle: 7,  // ≥7 条有效反馈：深度关联身体感受，引用身体记录
  },

  // 身体拼图各块独立解锁条件（2026-05-29 修订：条件收紧为有意义的数据门槛）
  BODY_PUZZLE: {
    show_section: 0,                // 无整体门槛；各块按自身条件独立解锁，未解锁块灰色显示
    block_0_liked_dishes: 3,        // 「喜欢吃这个」：正向反馈（comfort=舒服 OR 有精神）≥ 3 餐
    block_1_my_way_feedback: 7,     // 「我的吃法」：总反馈 ≥ 7，且正向 ≥ 1、负向 ≥ 1（需要对比度）
    block_2_explore: 3,             // 「口味探索」：有反馈的 distinct 菜系 ≥ 3（排除家常菜/全国）
    block_3_getting_better: 14,     // 「越来越舒服」：总反馈 ≥ 14，且后7餐正向比例 ≥ 前7餐 + 10%
    block_3_trend_delta: 0.10,      // block_3 趋势门槛：后7餐正向率需超出前7餐至少10个百分点
    // block_3 语义：产品价值证明——接受建议（抽卡/饭前建议/餐饮计划）后身体越来越舒服
    // Phase 1 正向餐等权；Phase 2 起接受过建议的餐可加权；Phase 3 起追加餐饮计划执行信号
    timeline_lookback_days: 60,     // 成长时间轴⏱按钮：最早记录超过60天前时出现
  },

  // 美食版图（菜系地图）
  CUISINE_MAP: {
    show_map: 1,                 // 有1餐记录即可看地图（未解锁省份灰显）
  },

  // 周报生成
  WEEKLY_REPORT: {
    min_meals_in_week: 1,        // 过去7天至少1餐才生成周报
  }
}
```

## 省份数据常量

> 文件：`src/constants/provinces.ts`，美食版图 SVG 地图直接使用此数据，禁止在组件内硬编码。

```typescript
export interface Province {
  id:    string   // 省份名（也用作 meal.province 的值）
  x:     number   // SVG viewBox="0 0 400 340" 坐标
  y:     number
  w:     number
  h:     number
  emoji: string   // 代表菜系的 emoji
  desc:  string   // 菜系名称
}

export const PROVINCES: Province[] = [
  { id:'黑龙江', x:310, y:30,  w:90, h:80, emoji:'🫙', desc:'东北菜' },
  { id:'吉林',   x:300, y:105, w:70, h:45, emoji:'🫕', desc:'东北菜' },
  { id:'辽宁',   x:280, y:145, w:65, h:40, emoji:'🍲', desc:'东北菜' },
  { id:'内蒙古', x:160, y:50,  w:180,h:70, emoji:'🥩', desc:'蒙古菜' },
  { id:'新疆',   x:20,  y:60,  w:140,h:110,emoji:'🍖', desc:'新疆菜' },
  { id:'西藏',   x:50,  y:175, w:120,h:80, emoji:'🧆', desc:'藏菜'   },
  { id:'青海',   x:140, y:165, w:80, h:65, emoji:'🫙', desc:'青海菜' },
  { id:'甘肃',   x:170, y:120, w:90, h:70, emoji:'🍜', desc:'西北菜' },
  { id:'宁夏',   x:210, y:130, w:30, h:35, emoji:'🥙', desc:'清真菜' },
  { id:'陕西',   x:220, y:155, w:40, h:65, emoji:'🫔', desc:'陕菜'   },
  { id:'山西',   x:245, y:130, w:40, h:55, emoji:'🍝', desc:'晋菜'   },
  { id:'河北',   x:262, y:110, w:50, h:40, emoji:'🥘', desc:'冀菜'   },
  { id:'北京',   x:278, y:108, w:18, h:16, emoji:'🦆', desc:'京菜'   },
  { id:'天津',   x:285, y:120, w:14, h:12, emoji:'🥟', desc:'津菜'   },
  { id:'山东',   x:268, y:148, w:60, h:40, emoji:'🥜', desc:'鲁菜'   },
  { id:'河南',   x:245, y:175, w:55, h:40, emoji:'🫓', desc:'豫菜'   },
  { id:'四川',   x:185, y:190, w:70, h:60, emoji:'🌶️',desc:'川菜'   },
  { id:'重庆',   x:228, y:205, w:22, h:22, emoji:'🔥', desc:'渝菜'   },
  { id:'云南',   x:175, y:245, w:65, h:60, emoji:'🌿', desc:'滇菜'   },
  { id:'贵州',   x:220, y:235, w:45, h:40, emoji:'🫙', desc:'黔菜'   },
  { id:'湖南',   x:248, y:215, w:50, h:45, emoji:'🌶', desc:'湘菜'   },
  { id:'湖北',   x:248, y:183, w:55, h:35, emoji:'🐟', desc:'鄂菜'   },
  { id:'安徽',   x:278, y:183, w:42, h:45, emoji:'🦞', desc:'徽菜'   },
  { id:'江苏',   x:288, y:163, w:45, h:30, emoji:'🦀', desc:'苏菜'   },
  { id:'上海',   x:310, y:185, w:14, h:12, emoji:'🥟', desc:'沪菜'   },
  { id:'浙江',   x:295, y:200, w:42, h:35, emoji:'🦐', desc:'浙菜'   },
  { id:'江西',   x:268, y:215, w:42, h:42, emoji:'🍵', desc:'赣菜'   },
  { id:'福建',   x:288, y:238, w:42, h:35, emoji:'🦪', desc:'闽菜'   },
  { id:'广东',   x:255, y:265, w:65, h:45, emoji:'🍵', desc:'粤菜'   },
  { id:'广西',   x:210, y:265, w:55, h:48, emoji:'🍜', desc:'桂菜'   },
  { id:'海南',   x:248, y:308, w:28, h:22, emoji:'🥥', desc:'琼菜'   },
  { id:'台湾',   x:318, y:248, w:20, h:30, emoji:'🧋', desc:'台湾菜' },
]

// meal.province 的合法值：PROVINCES[n].id，或以下两个特殊值
// '全国' — 不明确省份来源的菜系
// '境外' — 外国菜系（日料/韩餐/西餐等）
// 两者均不计入美食版图解锁数量

// ── 菜系选择器选项（分析结果页底部面板，5 组 35+ 项）──────────────────
export const CUISINE_OPTIONS: { group: string; items: string[] }[] = [
  { group: '常见',    items: ['家常菜','粤菜','川菜','鲁菜','苏菜','沪菜','浙菜','湘菜','徽菜','闽菜'] },
  { group: '北方',    items: ['京菜','津菜','晋菜','冀菜','豫菜','东北菜'] },
  { group: '西部',    items: ['陕菜','渝菜','黔菜','滇菜','西北菜','新疆菜','藏菜','青海菜','清真菜','蒙古菜'] },
  { group: '其他地区', items: ['桂菜','琼菜','鄂菜','赣菜','台湾菜'] },
  { group: '境外 / 其他', items: ['日料','韩餐','西餐','快餐','轻食'] },
]

// ── 菜系 → 省份反向映射（选完菜系后自动回填 province）────────────────
export const CUISINE_TO_PROVINCE: Record<string, string> = {
  '粤菜':'广东','川菜':'四川','鲁菜':'山东','苏菜':'江苏','沪菜':'上海',
  '浙菜':'浙江','湘菜':'湖南','徽菜':'安徽','闽菜':'福建','京菜':'北京',
  '津菜':'天津','晋菜':'山西','冀菜':'河北','豫菜':'河南','东北菜':'辽宁',
  '陕菜':'陕西','渝菜':'重庆','黔菜':'贵州','滇菜':'云南','西北菜':'甘肃',
  '新疆菜':'新疆','藏菜':'西藏','青海菜':'青海','清真菜':'宁夏','蒙古菜':'内蒙古',
  '桂菜':'广西','琼菜':'海南','鄂菜':'湖北','赣菜':'江西','台湾菜':'台湾',
  '家常菜':'全国','轻食':'全国',
  '日料':'境外','韩餐':'境外','西餐':'境外','快餐':'境外',
}
// 选中菜系后：province = CUISINE_TO_PROVINCE[cuisine] ?? '全国'

// ── 就餐场景选项（分析结果页底部面板，8 项平铺）─────────────────────────
export const SCENE_OPTIONS: string[] = [
  '外卖','堂食','自己做','食堂','路边摊','便利店','快餐店','其他',
]
// Phase 5 前 scene 只用于记录和菜系地图统计，不影响 AI Prompt
```

---

## 算法与大模型分工

> 本节技术细节已迁移至 [`docs/architecture/model-architecture.md`](../architecture/model-architecture.md)。该文档是对应架构的唯一权威来源，开发时请直接查阅该文档。
> 蓝图保留产品视角：**做什么 + 为什么**；架构文档回答：**怎么实现**。

---

## 饭前抽卡功能规范

> 饭前抽卡（draw_card）是干饭 1.0 的核心差异化功能：在用户还不知道吃什么时，基于当前状态和历史数据生成三张推荐卡供翻牌。功能质量随数据积累自动升级，不设硬锁门槛阻断体验。

### 核心设计原则

1. **状态决定内容，不仅决定排序** — 用户当前状态（压力/疲惫/清淡/好的/随便）必须同时影响过滤规则和推荐原因，不能只改变排序
2. **三槽位盲盒体验（泡泡玛特风格）** — 三张暗牌翻开，每张有独立稀有度和定位，翻牌前不知道是什么
3. **无门槛渐进升级** — 0 餐也能抽（通用推荐），数据越多质量越高，用户感知是"越用越懂我"，不是"不够 X 餐不让用"
4. **过滤基于用户历史，不依赖外部营养库** — 营养库只有原料级数据（1600+ 条），无饭后感受标签；过滤和加权必须基于用户自己的 `meal_feedback` 历史

### 三阶段渐进解锁

| 阶段 key | 解锁条件（有效反馈数）| 推荐质量 | reason 文案示例 |
|---|---|---|---|
| `general` | 0–2 条 | 通用推荐，基于状态 fallback 菜品 | "熟悉的味道，压力大时稳一点" |
| `feedback` | 3–6 条 | 按历史反馈过滤 + 加权 | "上次吃完你精力不错，疲惫时这个靠谱" |
| `body_puzzle` | ≥7 条 | 身体感受关联，深度个性化 | "吃了 3 次，2 次身体舒服，综合评分高" |

> **有效反馈** = `meal_feedback.comfort` 不为空的餐次记录数。
> `general` 阶段卡片内容来自 fallback 菜品映射表，不做历史过滤；advice 字段固定提示"这是通用推荐，记录更多餐次后会基于你的真实反馈生成。"

### 三槽位设计

| 槽位 key | 显示名 | 稀有度标识 | 定位 | 暗牌背景色 |
|---|---|---|---|---|
| `stable` | 常规款 | ● STANDARD | 今天最稳的选择，历史正向反馈最高分 | 橙红 `#E85D26` |
| `alt` | 特别款 | ◆ LIMITED | 今日限定方向，第二顺位稳定选择 | 金黄 `#B8860B` |
| `explore` | 隐藏款 | ★ RARE | 翻到就赚到，用户历史未记录或低频探索方向 | 深紫 `#5B2D8E` |

### 六种餐前状态 × 过滤 / 加权规则

状态判断**只基于用户自己的 `meal_feedback` 和 `meal_analysis.tags` 历史**，不调用营养库。

| 用户状态 | 硬过滤（exclude） | 加权（boost） |
|---|---|---|
| `压力有点大` | 无 | 重复吃过的菜 ×2（熟悉感），comfort=舒服 +3 |
| `心情不错` | 无 | mood=满足 +2，cuisine 多样性 +1 |
| `很累很困` | comfort=困倦的历史菜；analysis.tags 含"高油/易困倦" | comfort=舒服 +3 |
| `想吃点好的` | 无 | mood=满足 +2 |
| `想吃点清淡` | analysis.tags 含"高油/主食偏多/易困倦" | analysis.tags 含"少油/蛋白质足" +2 |
| `随便都行` | 无 | comfort=舒服 +3（综合最优） |

> `analysis.tags` 来自用户自己的 `meal_analysis.tags`（AI 在餐次分析时生成），不是营养库标签。

### 六阶段完整规则（过滤 + 加权 + AI 分工）

| 阶段 | MVP | 新增数据源 | 新增过滤规则 | 新增加权规则 | AI reason 风格 |
|---|---|---|---|---|---|
| `general` | 1.0 | 状态 fallback 菜品表 | 忌口硬过滤 | 状态基础加权 | 通用，不引用个人历史 |
| `feedback` | 1.0 | `meal_feedback` | 状态×感受过滤（困倦/高油等） | comfort/mood 评分加权 | 引用近期反馈（"上次吃完你..."） |
| `body_puzzle` | 1.0→2.0 | 同上 + `dish_scores` | 高频负向菜系降权 | DishScore 加权；置信度<0.3 回退规则引擎 | 引用身体感受计数（"吃了 X 次，Y 次舒服"） |
| `body_structure` | 4.0 | `health_data`（睡眠/步数/运动）| 睡眠差→排除高油高碳；运动少→降权高热量 | 睡眠≥7h→高蛋白+2；步数≥8000→可接受高碳水；只用已授权且有值字段 | 引用今日身体状态（"昨晚睡眠不足，今天先避开重口"） |
| `fulfillment` | 5.0 | `plan_slots` 执行率、`fulfillment_events` | 近4周复杂菜执行率<60%→排除备餐繁琐菜；跳过率高的菜系降权 | 历史高执行率菜+2；社区同画像高购买率菜+1 | 引用执行可行性（"你这周复杂备餐执行率低，这张更容易完成"） |
| `food_memory` | 6.0 | `food_memory_items`（库存推断） | 无硬过滤 | 可用库存食材关联度高的菜+3；食材临期+2 | 引用手边食材（"家里鸡蛋和番茄大概率还够，今天优先用掉"） |

> 高阶阶段**累加**低阶规则，不替换。`body_structure` 同时包含 `body_puzzle` 的所有过滤和加权。

### `buildCardPoolForState` 算法边界

```python
# services/ai/algorithms/draw_card.py
def build_card_pool_for_state(user_id: str, state: str) -> CardPool:
    """
    1. 从 meal_feedback 取有效反馈餐（comfort 非空）
    2. 按 state 规则过滤候选
    3. 按当前阶段叠加评分（feedback_signal + state_boost + dish_score + health_adjust + execution_rate + food_memory）
    4. 按菜名去重
    5. 返回 stable_candidate, alt_candidate, explore_dish
       explore_dish: 优先选用户历史未记录过的菜（从 fallback 探索库随机）
    """

def get_recommendation_stage(user_id: str) -> RecommendationStage:
    feedback_count = count_valid_feedback(user_id)
    # 高阶优先，但需满足对应 MVP 阶段解锁条件
    if has_food_memory(user_id):             return 'food_memory'
    if has_fulfillment_history(user_id):     return 'fulfillment'
    if has_health_data_authorized(user_id):  return 'body_structure'
    if feedback_count >= 7:                  return 'body_puzzle'
    if feedback_count >= 3:                  return 'feedback'
    return 'general'
```

算法输出给 Claude，Claude 只写 reason 和 advice，不改变菜品选择。

### 卡片数据流

```
用户选择状态 → buildCardPoolForState → 候选池
             ↓
         Claude API → reason / advice（按阶段风格）
             ↓
         三张 DrawCard → 渲染暗牌

用户翻牌 → 前端 cardStates[i] = 'seen'（本地状态，不写 card_actions）
用户选择 → card_actions.action = 'accepted' / 'skipped'
用户记录餐次 → meals.from_card = {dish, badge, risk,
                recommendationStage, recommendationStageLabel,
                recommendationReason, recommendationSources,
                unlockRequirement, confidenceLevel}

效果验证路径：
  card_actions.action = 'accepted' + meals.from_card 非空
  → 关联对应 meal_feedback
  → 验证推荐质量 → 异步更新 DishScore（2.0 起）
```

---

## UI 设计系统

> 本节技术细节已迁移至 [`docs/architecture/ui-system.md`](../architecture/ui-system.md)。该文档是对应架构的唯一权威来源，开发时请直接查阅该文档。
> 蓝图保留产品视角：**做什么 + 为什么**；架构文档回答：**怎么实现**。

---

## 核心 TypeScript 类型

> 本节技术细节已迁移至 [`docs/architecture/type-architecture.md`](../architecture/type-architecture.md)。该文档是对应架构的唯一权威来源，开发时请直接查阅该文档。
> 蓝图保留产品视角：**做什么 + 为什么**；架构文档回答：**怎么实现**。

---

## Zustand Store 接口定义

> 本节技术细节已迁移至 [`docs/architecture/type-architecture.md`](../architecture/type-architecture.md)。该文档是对应架构的唯一权威来源，开发时请直接查阅该文档。
> 蓝图保留产品视角：**做什么 + 为什么**；架构文档回答：**怎么实现**。

---

## 完整 RLS 策略

> 本节技术细节已迁移至 [`docs/architecture/security-architecture.md`](../architecture/security-architecture.md)。该文档是对应架构的唯一权威来源，开发时请直接查阅该文档。
> 蓝图保留产品视角：**做什么 + 为什么**；架构文档回答：**怎么实现**。

---

## 开发规范（CLAUDE.md）

> 本节技术细节已迁移至 [`docs/architecture/engineering-architecture.md`](../architecture/engineering-architecture.md)。该文档是对应架构的唯一权威来源，开发时请直接查阅该文档。
> 蓝图保留产品视角：**做什么 + 为什么**；架构文档回答：**怎么实现**。

---

## 环境变量规范

> 本节技术细节已迁移至 [`docs/architecture/engineering-architecture.md`](../architecture/engineering-architecture.md)（见「3.6 环境变量分层」节）。该文档是对应架构的唯一权威来源，开发时请直接查阅该文档。
> 蓝图保留产品视角：**做什么 + 为什么**；架构文档回答：**怎么实现**。

---

## FastAPI 安全规范

> 本节技术细节已迁移至 [`docs/architecture/security-architecture.md`](../architecture/security-architecture.md)。该文档是对应架构的唯一权威来源，开发时请直接查阅该文档。
> 蓝图保留产品视角：**做什么 + 为什么**；架构文档回答：**怎么实现**。

---

## CI/CD 流水线

> 本节技术细节已迁移至 [`docs/architecture/engineering-architecture.md`](../architecture/engineering-architecture.md)。该文档是对应架构的唯一权威来源，开发时请直接查阅该文档。
> 蓝图保留产品视角：**做什么 + 为什么**；架构文档回答：**怎么实现**。

---

## UserContext 构建逻辑（builder.py）

> 本节技术细节已迁移至 [`docs/architecture/model-architecture.md`](../architecture/model-architecture.md)。该文档是对应架构的唯一权威来源，开发时请直接查阅该文档。
> 蓝图保留产品视角：**做什么 + 为什么**；架构文档回答：**怎么实现**。

---

## TaskContext Composer（2.0 起逐步实现）

> 本节技术细节已迁移至 [`docs/architecture/model-architecture.md`](../architecture/model-architecture.md)。该文档是对应架构的唯一权威来源，开发时请直接查阅该文档。
> 蓝图保留产品视角：**做什么 + 为什么**；架构文档回答：**怎么实现**。

---

## Claude Prompt 模板

> 本节技术细节已迁移至 [`docs/architecture/model-architecture.md`](../architecture/model-architecture.md)。该文档是对应架构的唯一权威来源，开发时请直接查阅该文档。
> 蓝图保留产品视角：**做什么 + 为什么**；架构文档回答：**怎么实现**。

---

# Sprint 0 — 工程底座与基础组件库

**目标：** 搭建可运行的工程环境，建立主题系统和所有基础组件，后续 Sprint 直接复用
**周期：** 1 Sprint（2周）
**完成判定：** App 在模拟器运行，组件预览页展示所有基础组件的所有状态，无 TypeScript 错误

---

## Sprint 0｜工程初始化（必须最先执行）

```
T0-00a 初始化 Monorepo
  产出: ganfan/ 目录结构、pnpm-workspace.yaml、根 package.json
  验收: pnpm install 无报错

T0-00b 初始化 Expo App
  产出: apps/mobile/ 完整 Expo + TypeScript 项目
  命令: npx create-expo-app mobile --template expo-template-blank-typescript
  验收: npx expo start 在模拟器显示空白界面

T0-00c 配置 Expo Router + TabBar
  产出: app/(tabs)/_layout.tsx，4个Tab：首页 / 记录 / 历史 / 我
  验收: 4个Tab可切换，无报错，tabbar吸底显示
```

> ⚠️ 以上三步必须完成后，才能进行组件开发（需要运行环境）

## Sprint 0｜主题 & 组件基础

```
T0-01 主题系统
  产出:
    src/theme/colors.ts      ← 色彩 token（完整对照设计系统）
    src/theme/typography.ts  ← 字体 token
    src/theme/spacing.ts     ← 间距 + 圆角 token
    src/theme/index.ts       ← 统一导出
  验收: 所有 token 可从 @/theme 导入，无硬编码颜色/数字散落在组件中

T0-02 布局组件
  产出: src/components/layout/
    NavBar.tsx        props: title, leftAction?, rightAction?
    TabBar.tsx        由 Expo Router _layout.tsx 驱动，此处只定义样式
    PageContainer.tsx props: children, style?（提供标准页面内边距）
    Section.tsx       props: children（标准分组间距）
  验收: 四个组件渲染正确，符合设计规范尺寸

T0-03 卡片 & 容器组件
  产出: src/components/base/
    Card.tsx          props: children, style?
    CardSoft.tsx      props: children, style?
    Sheet.tsx         props: visible, onClose, children（底部滑出）
  验收: Card白底border，CardSoft cream背景，Sheet动画正确

T0-04 按钮组件
  产出: src/components/base/
    PrimaryButton.tsx   props: label, onPress, loading?, disabled?
    GhostButton.tsx     props: label, onPress
    OutlineButton.tsx   props: label, onPress, color?
    IconButton.tsx      props: icon, onPress, label?
  验收: PrimaryButton loading状态显示spinner；disabled状态透明度0.4；所有按钮有press反馈

T0-05 选择控件
  产出: src/components/base/
    ScoreButton.tsx       props: label, selected, onPress
    OnboardingOption.tsx  props: label, description?, selected, onPress
    SegmentTabs.tsx       props: tabs, activeIndex, onChange
  验收: 选中状态颜色切换正确，SegmentTabs滑块动画流畅

T0-06 展示组件
  产出: src/components/base/
    Label.tsx         props: children（section header样式）
    Chip.tsx          props: label, variant: 'green'|'amber'|'red'|'default'
    RiskBar.tsx       props: level: 'low'|'medium'|'high'
    AdviceBox.tsx     props: text
    MealItemRow.tsx   props: emoji, name, subtitle?, rightText?
    DayDot.tsx        props: label, state: 'default'|'done'|'today'|'partial'
    ProgressBar.tsx   props: value(0-1), color?
  验收: 所有变体在预览页可见

T0-07 反馈 & 状态组件
  产出: src/components/base/
    Toast.tsx           全局单例，通过 useToast() hook 调用
    EmptyState.tsx      props: emoji, title, description, action?, actionLabel?
    LoadingSpinner.tsx  props: size?
    UploadZone.tsx      props: imageUri?, onPress, label?
  验收: Toast.show('xxx') 底部弹出后自动消失；EmptyState居中布局正确

T0-08 组件预览页（仅开发环境）
  产出: app/dev/components.tsx（路由只在 __DEV__ 下注册）
  内容: 列出所有基础组件的所有状态，不需要交互，仅供视觉核查
  验收: 能在开发模式下访问 /dev/components，看到所有组件渲染结果
```

**Sprint 0 验收标准：**
- [ ] 所有 token 从 `@/theme` 统一导入，无魔法数字
- [ ] 基础组件 TypeScript 类型完整，无 any
- [ ] `/dev/components` 页面展示所有组件的所有状态
- [ ] `npm run typecheck` 零错误

---

# MVP 1.0 — 记录感知

**目标：** 用户能完整记录餐次（拍照→分析→反馈→回访），7天后看到第一条个人规律
**周期：** 6 Sprint × 2周 = 12周
**完成判定：** 用户连续7天记录，每天至少1餐，回访完整率>60%，首页出现第一条洞察

---

## Sprint 1｜用户体系与数据层

> 前置：Sprint 0 全部完成（工程已可运行，基础组件已就绪）

```
T1-01 执行 Supabase Migration 001
  产出: supabase/migrations/001_core_tables.sql 执行成功
  验收: Supabase Dashboard中存在所有1.0表，完整RLS策略已启用（见架构文档RLS章节）

T1-02 Supabase Auth 集成（邮箱+密码）
  产出: api/supabase.ts 客户端，登录/注册界面
  文件: app/onboarding/index.tsx（欢迎页）
  验收: 能注册新账户，登录后跳转主界面，token持久化

T1-03 用户建档流程
  产出: app/onboarding/basic-info.tsx, goals.tsx
  存储: profiles表写入，本地SQLite同步；同时写入 meal_budget_weights 初始4行
  字段: goal / avoid / daily_budget（整数，元/天）/ feeling / eating_style（后台静默，档案页不展示）
  Q3选项映射: 60元以内→50 / 60~120元→90 / 120~200元→160 / 200元以上→250
  Q3完成后写入 meal_budget_weights 默认权重: 早饭0.20 / 午饭0.35 / 晚饭0.40 / 加餐0.05
  不收集: age / gender / height_cm / health_background（档案页按需填写）
  验收: 首次登录后进入建档流程；完成后 profiles 表有 goal/avoid/daily_budget/feeling/eating_style；meal_budget_weights 有初始4行；Q3选项正确映射为整数

T1-04 本地 SQLite 初始化
  产出: db/schema.ts（1.0表的SQLite版本），db/migrations/001.ts
  验收: App启动时SQLite数据库自动创建，表结构与Supabase一致

T1-05 营养向量库初始化（Supabase pgvector）
  产出: supabase/migrations/000_pgvector_nutrition.sql 执行成功
        nutrition_seed/cn_nutrition_db.csv（1000条初始数据）
        services/ai/nutrition/embedder.py（批量生成向量的脚本）
  步骤:
    1. 执行 000_pgvector_nutrition.sql 建表+索引
    2. 导入 cn_nutrition_db.csv（菜品名、别名、营养值）
    3. 运行 embedder.py 批量生成并写入 embedding 向量
       向量模型: OpenAI text-embedding-3-small（1536维，性价比最高）
       批量大小: 100条/次，防止API超限
  数据来源（优先级顺序）:
    1. github.com/Sanotsu/china-food-composition-data — 第六版OCR提取JSON/CSV，可直接导入
    2. 公共卫生科学数据中心 phsciencedata.cn — 1506条，政府背书，免费申请导出
    3. CnOpenData cnopendata.com — 1700+食物CSV，覆盖维生素+氨基酸
    优先覆盖：热门100道菜 > 常见快餐 > 常见主食 > 蔬菜 > 水果
  验收:
    - Supabase中 nutrition_items 表存在且有≥1000条数据
    - embedding列非空
    - SELECT * FROM nutrition_items WHERE dish_name='红烧肉' 有结果
    - 向量相似度搜索 "东坡肉" 能命中 "红烧肉"（score≥0.8）
```

**Sprint 1 验收标准：** 能注册登录，能填写个人档案，数据同时写入SQLite和Supabase，营养向量库已初始化

---

## Sprint 2｜餐次记录与AI分析

```
T2-01 FastAPI 项目初始化
  产出: services/ai/ 完整项目，requirements.txt，main.py
  依赖: fastapi, uvicorn, anthropic, python-dotenv, pydantic
  验收: uvicorn main:app --reload 在本地 8000 端口启动

T2-02 Claude API 餐次分析接口（含营养向量库）
  产出: routers/analyze.py，nutrition/search.py，nutrition/embedder.py
        POST /v1/meal/analyze，GET /v1/nutrition/search
  逻辑（两阶段）:
    Step 1 - Claude Vision识别（最长20s）:
      - 接收 image_base64 + meal_type + user_context
      - 构建 Claude Vision prompt（含用户校正历史）
      - 返回: { dish_name, ai_nutrition_estimate, tags, risk, eating_advice_draft }
    Step 2 - 营养库精准化（最长2s，超时直接跳过）:
      - 先做精确名称匹配: SELECT WHERE dish_name=X OR X=ANY(aliases)
      - 精确未命中则向量搜索: embedder.embed(dish_name) → pgvector cosine搜索
      - 命中（score≥0.85）: 用库值替换 ai_nutrition_estimate
        写 nutrition_source='vector_matched', matched_nutrition_id, match_confidence
      - 未命中: nutrition_source='ai_estimate', match_confidence=null
    Step 3 - 个性化建议生成（最长5s）:
      - 合并最终营养值 + UserContext → Claude 生成 eating_advice
    analysis_meta 字段写入：{ source, phase, model, latency_ms, prompt_version,
                              nutrition_source, match_confidence }
      source: 'ai'|'mock'|'timeout_fallback'
      phase: 'instant'（拍完立即）|'deferred'（离线后补）
  总超时: 25秒（三个步骤合计），任一步骤失败降级不影响整体返回
  验收:
    - curl测试分析接口，response包含 nutrition_source 字段
    - "红烧肉"命中向量库（nutrition_source='vector_matched'）
    - 生僻菜品未命中时（nutrition_source='ai_estimate'）正常返回
    - 营养搜索接口 GET /v1/nutrition/search?q=红烧肉 返回top5结果

T2-03 移动端相机模块
  产出: app/camera.tsx，expo-camera集成
  功能: 拍照 + 相册选图 + 拍照预览确认
  验收: 能拍照，图片显示在预览区

T2-04 图片压缩与上传
  产出: utils/imageCompress.ts
  逻辑: 压缩到480px最长边，JPEG 0.65质量，上传 Supabase Storage
  image_type 映射:
    拍照/选图时上传的第一张 → 'wide'（用于AI分析）
    用户可选拍特写 → 'close'（可选，用于更精准识别）
    反馈页"剩余量"拍照 → 'leftover'（可选，用于intake_ratio辅助）
  写入: meal_images表（每张图一行，image_type区分）
  验收: 压缩后文件 < 100KB，meal_images表有对应记录，image_type字段正确

T2-05 分析结果展示界面
  产出: 内嵌在 camera.tsx 的分析结果区
  显示: 菜品名、热量、蛋白质/碳水/脂肪、风险标签、建议
  营养来源标签:
    nutrition_source='vector_matched' → 显示"📊 数据来自营养库"（小字，绿色）
    nutrition_source='ai_estimate'    → 显示"≈ AI估算"（小字，灰色）
  功能: 用户可修改菜品名和营养数值（写入 meal_corrections）；
        菜系修改：底部面板分组 chip 选择器（CUISINE_OPTIONS，5 组 35+ 项），
                  选中后自动按 CUISINE_TO_PROVINCE 回填 province；
        场景修改：底部面板平铺列表（SCENE_OPTIONS，8 项）；
                  两者均不使用自由文本输入框；
                  修改写入 meal_corrections（field/ai_value/user_value/corrected_at）；
                  scene Phase 5 前不影响 AI Prompt
  验收: 分析结果正确显示，营养来源标签根据 source 显示，修改后 meal_corrections 有记录；
        菜系选完后 province 自动更新；场景选项为枚举，不出现自由输入

T2-06 餐次保存到数据库
  产出: db/meals.ts insertMeal(), insertMealAnalysis()
  逻辑: 先写SQLite，后台写Supabase，失败加入重试队列
  验收: 餐次数据在meals + meal_analysis两表均有记录

T2-07 进食计时与自动关闭
  产出: camera.tsx 中的计时逻辑
  流程:
    用户确认分析结果后 → 记录 meal_started_at = Date.now()
    用户提交饭后反馈时 → meal_duration_ms = Date.now() - meal_started_at
    若30分钟内未提交反馈 → auto_closed_at = Date.now()，餐次状态设为'auto_closed'
      首页PENDING_FB卡片仍保留，可补录反馈
  验收: meal_started_at有值；超30分钟未反馈auto_closed_at有值，首页仍显示待反馈卡

T2-08 加料记录
  产出: camera.tsx 分析结果页底部"还吃了别的？"入口
  UI: 点击后弹出输入框，支持文字描述（如"加了一碗汤"）
  存储: meals.additionals = [{ name: str, estimate: str }]
  验收: 加料内容写入additionals字段，详情页能显示

T2-09 就餐心情记录
  产出: camera.tsx 保存餐次前的情绪快选
  选项: 心情不错 / 平静 / 压力有点大 / 有点焦虑 / 疲惫
  存储: meals.mood 字段
  设计原则: 可跳过，不强制填写
  验收: 选了心情后meals.mood有值；跳过时为null，不影响保存流程
```

**Sprint 2 验收标准：** 拍照→AI分析→看到结果→（可选：加料/心情）→保存，全流程<30秒，数据完整写入

---

## Sprint 3｜反馈与通知

```
T3-01 饭后即时反馈界面
  产出: app/feedback.tsx
  问题（按顺序）:
    Q1: 实际吃掉多少（全吃完/吃了3/4/吃了一半/剩很多）
    Q2: 饱腹状态（撑/刚好/还饿）
    Q3: 身体即时感受（舒服/胀气/困倦）          // 多选；与原型 QUESTION_SCHEMA 对齐
    Q4: 这顿吃得开心吗（还不错/一般/有点后悔）  // 单选；与原型 QUESTION_SCHEMA 对齐
  存储: meal_feedback表
  验收: 4题全答完才能提交，数据写入正确

【已废弃】T3-02/T3-03/T3-05 每日回访已于 2026-05-29 删除，偏离履约率核心链路

T3-04 本地通知（即时反馈提醒）
  产出: utils/notifications.ts schedulePostMealReminder()
  逻辑: 餐次保存后固定 20 分钟延迟推送；系统固定，不读取 profile.reminder_delay_min，不提供用户配置项
  验收: Android真机收到通知（餐次保存后约20分钟触发），点击跳转到feedback页面；不出现推送延迟设置项
```

**Sprint 3 验收标准：** 完整走通一餐：拍照→分析→即时反馈→（当天/次日）回访，数据全链路完整

---

## Sprint 4｜历史记录与个人档案

```
T4-01 餐次历史日历视图（2026-05-23 修订）
  产出: app/history.tsx、日历视图组件、screens/WeeklyHistoryScreen.tsx
        src/utils/weeklyReport.ts、src/components/WeeklyReportCard.tsx
        app/weekly-history.tsx
  逻辑: 按日期聚合meals，有记录的日期显示色点（已反馈=绿，未反馈=橙）
  顶部合并卡（饮食记录沉淀 + 我的一周）:
    上半：饮食记录沉淀（累计餐次全量统计，不随月份/筛选变化）
    下半：我的一周周报卡（meals.length >= 3 时显示，5字段完整卡片）
      5字段: 口味chips（前2菜系，无数据→"待观察"）| 感受最好chips（comfortable次数，无数据→"待观察"）
             粗估热量（range取第一个数字均值，无则"待确认"）| 蛋白质（同上）| 建议文字
      建议文字逐字稿:
        sleepy次数 >= 餐数/2 → "😴 这周午餐后困倦明显，建议减少高碳水组合，增加蛋白质。"
        overfull/too_full次数 >= 2 → "🍽️ 发现容易吃撑的模式，可以提前设定饭量提醒。"
        其余 → "✨ 保持现在的饮食节奏，身体反馈很稳定！"
      营养解析: range字段如"500-700 kcal"，取第一个数字500（非中点），Math.round均值
      时间窗口: 近7天有效记录；为空则兜底 allMeals.slice(-7)
    整卡点击 → 全屏「我的一周·历史」页（screens/WeeklyHistoryScreen.tsx）
      首条: 与卡片使用完全相同的时间窗口算法和数据
      历史条: 自然周（周一~周日）分组，排除首条已覆盖记录，无createdAt的记录不进历史分组，倒序排列
      每条: 使用与「我的一周」卡片完全相同的 WeeklyReportCard 组件
            仅左上角替换为日期范围字符串，不显示「📊 我的一周」标题
      顶部说明: 「每周总结在周日晚7点生成，周一0点后仅在这里查看历史」
  验收:
    - 能看到当月记录，点击日期展开当天餐次列表
    - meals.length >= 3 时合并卡下半显示「我的一周」5字段周报卡
    - 卡片与历史页首条数据完全一致（同一时间窗口算法）
    - 历史页每条与卡片使用相同组件，5字段完整展示，仅日期不同
    - 点击整卡进入历史周汇总页，首条数据与卡片一致

T4-01b 美食版图（菜系地图视图）
  产出: 历史页第二个Tab「🗺️ 菜系地图」
  数据: 按 meal.province 聚合，统计各省份记录餐数
  显示:
    - SVG 中国省份简化地图，已记录省份高亮（accent色），未记录灰色
    - 地图下方：已解锁菜系数 / 总餐次 / 待探索数统计卡
    - 已解锁菜系列表（省份 emoji + 菜系名 + 记录餐数）
    - 点击省份弹出该菜系历史餐次详情
  解锁: 无前置条件，记录第一餐即可看到（未解锁省份灰色显示）
  跳转入口: 身体拼图「口味探索」块的「看我的美食地图 →」按钮
  db依赖: meals.province 字段（已在1.0 schema中）
  验收: 记录2个不同省份菜系后，地图对应省份高亮，点击显示餐次列表

T4-02 餐次详情页
  产出: app/meal-detail.tsx
  显示: 餐前图、营养数据、反馈数据、回访数据（关联显示）
  功能: 未反馈的餐次可点击"补录反馈"进入feedback页面
  验收: 所有已记录字段正确显示，无null崩溃

T4-03 历史筛选
  产出: 历史页顶部筛选栏
  选项: 全部/早饭/午饭/晚饭/加餐/未打分
  验收: 筛选后列表和日历同步更新

T4-04 体重记录
  产出: components/WeightLogger.tsx
  逻辑: 每次输入追加weight_logs表，显示趋势（↑/↓ kg）
  提醒: 超过7天未录入，profile页顶部显示橙色提醒
  验收: weight_logs表有时序数据，趋势计算正确

T4-05 个人档案页
  产出: app/profile.tsx
  三块结构:
    ① 干饭目标 — goal（文字）+ daily_budget（元/天），flex垂直排列，可编辑
    ② 身体拼图 — 4块独立解锁（同 T5-06 规格）
    ③ 干饭档案 — 由 deriveInsights() 驱动，三字段三档渐进：
       · 偏好餐次: cold(<5餐)→forming(5-20餐,积累中badge)→mature(≥21餐,正式标签)
       · 干饭风格: cold(<5 analyzed)→forming(5-20,积累中badge)→mature(≥21 analyzed,正式标签)
       · 忌口偏好: 直接读 profile.avoid，无门控
  顶部副标题: "N 餐记录"（不含阶段名）
  页面打开时即时重算 deriveInsights，<20ms响应
  eating_style 不在档案页展示
  验收: 三块结构完整显示；偏好餐次/干饭风格三档渲染正确；goal/avoid/daily_budget 可编辑，修改后profiles表更新

T4-06 数据管理功能
  产出: confirmClearAllData(), confirmDeleteAccount()
  逻辑: 二次确认弹窗，清空本地SQLite + Supabase对应数据
  验收: 清空后meals表为空，注销后auth session失效
```

**Sprint 4 验收标准：** 能找到任意历史餐次的完整数据，体重有时序记录，档案可完整编辑

---

## Sprint 5｜饭前抽卡与首页逻辑

```
T5-01 饭前抽卡规则引擎
  产出: services/ai/algorithms/draw_card.py
  核心函数:
    build_card_pool_for_state(user_id, state) → CardPool
      从 meal_feedback 取有效反馈（comfort 非空）
      按状态规则过滤+评分排序+菜名去重
      返回 {stable_candidate, alt_candidate, explore_dish}
    get_recommendation_stage(feedback_count) → RecommendationStage
      0-2条 → 'general'，3-6条 → 'feedback'，≥7条 → 'body_puzzle'
  状态过滤规则（详见《饭前抽卡功能规范》章节）:
    R1 忌口硬过滤（profile.avoid）
    R2 状态过滤（很累很困→排除 comfort=困倦/高油/易困倦历史菜）
    R3 状态加权（压力大→熟悉菜 ×2；有精神→推精力好菜 +3 等）
    R4 explore 槽位优先选用户历史未记录的菜
  验收: 单元测试覆盖6种状态×3种阶段，边界情况通过；general阶段无历史数据时 fallback 不报错

T5-02 饭前抽卡接口
  产出: FastAPI POST /v1/insight/generate（trigger='draw_card'）
  请求: { user_id, state: PreMealState, meal_type: MealType }
  流程:
    1. build_card_pool_for_state 选菜
    2. get_recommendation_stage 定阶段
    3. Claude API 生成 reason + advice（按阶段风格，见《算法与大模型分工》）
    4. 返回三张 DrawCard（slot: stable/alt/explore）
  响应: { cards: DrawCard[], stage: RecommendationStage, feedback_count: int }
  验收: 返回 stable/alt/explore 三槽位；reason 引用正确（general不引用个人历史，body_puzzle引用身体感受）；无相同菜品重复

T5-03 饭前抽卡组件
  产出: screens/DrawCardScreen.tsx
  交互:
    1. 状态选择页（6种状态按钮 + 三阶段进度 badge）
    2. 三张暗牌（常规款/特别款/隐藏款，Pop Mart 盲盒风格）
    3. 翻牌动画 → Sheet 展开（你抽到了 + 槽位标签 + 推荐原因 + 吃法建议）
    4. 选这个 → 进入拍照页
  card_actions 写入字段（翻牌仅本地 cardStates='seen'，不写库）:
    dish, badge, risk
    slot, slot_label                 ← 'stable'/'alt'/'explore' / '常规款'/'特别款'/'隐藏款'
    card_state                       ← 用户选择的餐前状态
    recommendation_stage             ← 当前推荐阶段 key
    recommendation_stage_label       ← 阶段显示名
    recommendation_reason            ← 推荐理由文案
    recommendation_sources           ← 数据来源描述
    unlock_requirement               ← 解锁条件描述
    confidence_level                 ← 置信度中文描述
    source = 'card_draw'
    action = 'accepted'（选择）| 'skipped'（跳过，对所有已翻未选的卡统一写入）
  meals.from_card 写入字段（用户选择后进入拍照时写入）:
    dish, badge, risk
    recommendationStage, recommendationStageLabel
    recommendationReason, recommendationSources
    unlockRequirement, confidenceLevel
  验收: 三张暗牌渲染正确；翻牌后显示槽位名称；选择后 card_actions 有完整记录（含 stage_label/reason/sources）；从 card 进入拍照后 meals.from_card 含 recommendationStage/recommendationReason/confidenceLevel 字段

T5-04 首页状态机
  产出: stores/useMealStore.ts getHomeScene()
  状态（4态，优先级从高到低）:
    DONE        → 已反馈态（反馈提交后 30 分钟内）
                  显示: 图片/占位 + 菜名 + 菜系 + 心情标签(图片右上角 overlay) + 身体反应预测
                  数据: 身体反应预测与反馈页「本餐反应预测」同源（A/B/C 三档降级逻辑）
                  过期: justCompletedAt 起 30 分钟后自动过期回 DEFAULT
    PENDING_FB  → 待反馈态（今日有无反馈餐 & 距记录 < 30min）
                  显示: 图片/占位 + 菜名 + 菜系 + 「记录感受 →」
                  次级操作行: 「+ 记录新一餐」描边按钮 + 「还没想好吃什么」文字链
    OVERDUE     → 叠加在 DEFAULT 下方（今日有无反馈餐 & ≥ 30min）
                  单条: 菜系 emoji/圆形缩略图 + 菜名 + 「未反馈」橙色胶囊按钮
                  多条: 收起显示「X 餐未反馈 ▾」，点击展开每条行
                  「未反馈」按钮: 直接进该餐反馈页，不经「我的记录」
                  缩略图规则: 有图→圆形裁剪；无图→直接显示菜系 emoji，无盒子背景
    DEFAULT     → 默认态（其余所有情况）
                  显示: 记录这一餐(大点击区) + 还没想好吃什么(全宽描边圆角按钮)
                  禁止: 首页不得出现补录按钮；每餐独立，无新餐补录概念
  无图占位: 菜系 emoji + 浅橙色背景区，高度与有图时一致
  验收: 4 态切换正确（含 30min 时间窗口），状态不错乱；「补录」不出现在首页默认卡；OVERDUE 多条可展开；「未反馈」点击直达反馈页

T5-05 首批洞察生成（7天后）
  产出: FastAPI POST /v1/insight/generate trigger='weekly_first'
  逻辑:
    统计comfort/energy中高频负向信号
    关联对应餐次的cuisine/tags
    生成≤3条文字洞察
  验收: 有7天数据的测试账号首页出现洞察卡片

T5-06 身体拼图（2026-05-29 修订：解锁条件收紧）
  产出: components/BodyPuzzle.tsx、components/BodyInsight.tsx、screens/TimelineScreen.tsx

  显示块（共4块，无整体门槛，各块独立解锁，未解锁块以灰色锁定态显示）:
    块0「喜欢吃这个」: 解锁条件 正向反馈（comfort=舒服 OR 有精神）≥ 3 餐
      显示反馈好评最多的菜品/标签 + 历史好评榜
      未解锁时显示：「再打 N 次好评，这块拼图就出来了」
    块1「我的吃法」: 解锁条件 总反馈 ≥ 7，且正向 ≥ 1、负向 ≥ 1（需要对比度才能识别规律）
      近期吃法规律，好评率最高标签，满足感均值
      "这是你的专属吃法，不是通用建议"
      未解锁时显示：反馈不足则「还差N次反馈，好评和差评都要有」；有反馈无负向则「还需要至少1次不舒服的反馈，有对比才有规律」
    块2「口味探索」: 解锁条件 有反馈的 distinct_cuisines ≥ 3（排除家常菜/全国）
      已探索的各菜系记录及好评次数
      → 底部按钮「看我的美食地图 →」跳转到历史页菜系地图Tab
      未解锁时显示：「再探索 N 种新菜系解锁」
    块3「越来越舒服」: 解锁条件 总反馈 ≥ 14，且后7餐正向比例 ≥ 前7餐正向比例 + 10%
      语义：产品价值证明——接受建议后身体趋势变好
      正向餐信号来源（分阶段扩展）：
        Phase 1：抽卡后 card.accepted=true 的餐
        Phase 2：抽卡接受 + 饭前建议页采纳
        Phase 3+：以上 + 餐饮计划执行餐
      月度舒服率柱状图（按月分组，颜色：0%红 / 50-70%橙 / 80%+绿）
      未解锁时显示：反馈不足则「还差N次反馈，趋势才看得出来」；反馈够但趋势未达则「反馈够了，但身体舒适度还在提升中，继续保持」

  你的身体说（4块下方，独立组件 BodyInsight.tsx）:
    数据来源: analysis.typeFields（AI识别时生成，字段: oil/staple/protein/vegetable）
    算法:
      1. 从 typeFields 推断结构类别: oil=重→高油; staple=偏多&&oil≠重→高碳; protein=充足||oil=轻→清淡; else→均衡
      2. 按结构类别统计困倦率（comfort=困倦/胀气）和舒服率（comfort=舒服 OR satisfaction=还不错）
      3. 找出困倦率最高 vs 最低的两个类别，若差距≥25%则触发洞察
    精准度按 meals_count 递进:
      n < 5:  积累期文案（「已有N餐，继续记录，结构规律会越来越清晰」）
      n >= 8: 初步关联（「初步规律：X结构餐后困倦率明显高于Y结构（X% vs Y%）」）
      n >= 15: 完整因果（「你吃X食物（如具体菜名）后困倦/不舒服概率N%；吃Y食物后是M%。差距不是口味偏好——是身体对油脂和碳水负担的真实反应。」）
    ⚠️ 禁止使用菜系名称（京菜/川菜等）作为对比维度，必须使用 typeFields 推断的结构类别

  成长时间轴 ⏱（Header右上角按钮）:
    触发条件: 有早于60天前的历史餐次（meals.ts <= now - 60days）
    点击: 全屏页从右滑入，标题「成长时间轴」，副标题「N餐 · N个月」
    时间轴节点（按 meals.ts 升序）:
      🎬 开始记录（第一餐时间+菜名）
      🗺️ 解锁「口味探索」（探索了N种菜系）
      🥢 解锁「我的吃法」（积累了7餐对比记录）
      😋 解锁「喜欢吃这个」（3次好评 · 发现好吃的：XXX）
      ✨ 解锁「越来越舒服」（14餐趋势达成 · 舒服率X%→Y%）
      📍 今天（已拼上N/4 · N餐记录 · N个月旅程）
    页面底部: 月度舒服率柱状图
    工程产出: screens/TimelineScreen.tsx

  饮食日历「饮食记录沉淀 + 我的一周」合并卡（2026-05-23 修订）:
    位置: 历史页「饮食日历」Tab 顶部（原饮食记录沉淀总览卡升级）
    上半：饮食记录沉淀（累计餐次数，全量不随筛选变化）
    下半：我的一周周报卡（meals.length >= 3 时显示）
      5字段: 口味chips（前2菜系，无数据→"待观察"）| 感受最好chips（comfortable，无数据→"待观察"）
             粗估热量（range取第一个数字均值，无→"待确认"）| 蛋白质（同上）| 建议文字
      建议文字: sleepy>=餐数/2→"😴 这周午餐后困倦明显，建议减少高碳水组合，增加蛋白质。"
               overfull/too_full>=2→"🍽️ 发现容易吃撑的模式，可以提前设定饭量提醒。"
               其余→"✨ 保持现在的饮食节奏，身体反馈很稳定！"
      时间窗口: 近7天有效记录；为空则兜底 allMeals.slice(-7)
    整卡点击 → 全屏「我的一周 · 历史」页（screens/WeeklyHistoryScreen.tsx）
      首条与卡片使用完全相同时间窗口算法；历史条按自然周分组、排除首条已覆盖记录
      无createdAt记录不进历史分组；每条使用 WeeklyReportCard 组件（5字段完整），仅左上角替换为日期范围
      顶部说明: 「每周总结在周日晚7点生成，周一0点后仅在这里查看历史」

  验收:
    - 各块按自身条件独立显示，无整体7餐门槛
    - 「你的身体说」文案基于 typeFields 结构类型，不出现菜系名称
    - 成长时间轴节点按 ts 排序，颜色、emoji 与原型一致
    - meals.length >= 3 时合并卡下半显示「我的一周」5字段周报卡
    - 卡片与历史页首条数据完全一致；历史每条使用相同 WeeklyReportCard 组件
    - 数据准确，无 null 崩溃
```

**Sprint 5 验收标准：** 首页逻辑完整，推荐卡功能可用，7天后出现首条身体洞察

---

## Sprint 6｜稳定性与上线准备

```
T6-01 离线同步机制
  产出: db/sync.ts syncToSupabase()
  逻辑: 网络恢复时批量上传pending队列，冲突用服务端覆盖
  验收: 断网记录3餐，联网后Supabase有完整数据

T6-02 网络状态检测
  产出: 断网时顶部红色横幅，联网后自动消失+toast
  验收: 关闭WiFi出现横幅，开启WiFi横幅消失

T6-03 AI分析失败处理
  产出: 分析失败时显示重试界面（重试/换图/用模拟结果继续）
  验收: 关闭AI服务，拍照后出现错误界面，三个选项均可用

T6-04 性能优化
  产出: FlatList虚拟化历史列表，图片懒加载，数据库查询加索引
  验收: 100条历史记录滚动流畅，首屏加载<2秒

T6-05 Sentry 错误监控
  产出: Sentry初始化，关键catch块上报
  验收: 手动触发测试错误，Sentry Dashboard有记录

T6-06 EAS Build 配置
  产出: eas.json（development/preview/production配置）
  验收: eas build --profile preview 构建成功，APK可在真机安装

T6-07 内测分发
  产出: 通过 EAS Submit 或手动分发APK
  验收: 5台测试设备安装运行，无崩溃
```

**1.0 最终验收标准：**
- [ ] 完整走通：注册→建档→拍照→分析→反馈→回访
- [ ] 7天连续记录后首页出现身体洞察
- [ ] 断网可记录，联网后数据完整同步
- [ ] Android真机稳定运行24小时无崩溃
- [ ] meals表数据完整率>95%（所有字段无意外null）

---

# MVP 2.0 — 计划推荐

**前置：** 用户 complete_meals >= 7
**目标：** 基于1.0数据生成个性化周计划，用户能看到计划vs实际对比
**周期：** 4 Sprint（8周）

## Sprint 7｜偏好模型

```
T7-01 DishScore计算算法
  产出: algorithms/dish_score.py compute_dish_score(user_id)
  逻辑: 按cuisine/tags分组，聚合4维度均值+置信度
  写入: dish_scores表（upsert）
  触发: 每次daily_checkin提交后异步重算
  测试: 5条测试餐次，验证分数计算正确

T7-02 推荐卡算法升级（规则→评分）
  产出: 升级 /v1/insight/generate
  逻辑: 有DishScore时按个人评分排序替代规则排序
  fallback: DishScore置信度<0.3时退回规则引擎
  测试: A/B对比有/无评分时的推荐结果差异

T7-03 营养目标计算
  产出: algorithms/nutrition.py compute_daily_target(profile)
  逻辑: 基于年龄/性别/身高/体重/目标计算TDEE和宏量目标
  写入: nutrition_targets表（每日自动创建）
  测试: 不同profile的计算结果符合营养学标准
```

## Sprint 8｜计划生成

```
T8-01 周计划生成接口
  产出: FastAPI POST /v1/plan/generate
  逻辑:
    Step1: 为7天×3餐每个槽位生成候选菜池
    Step2: 按营养缺口+DishScore+多样性综合评分
    Step3: 选最高分作为推荐，次高分作为备选
  写入: meal_plans + plan_slots表，同时写 fulfillment_events(type='plan_generated')
  测试: 生成计划无重复菜系（同天），满足营养目标

T8-02 计划界面
  产出: app/plan.tsx
  显示: 周视图网格（7天×3餐），每格显示菜品+预测评分
  功能: 长按单格可替换（从备选中选）
  换菜持久化:
    用户选择新菜后 → plan_slots.swapped_to = {dish, reason}
    同步更新界面展示为新菜，原推荐保留在 suggested.alternatives 可查看
  事件: 查看计划、接受建议、换菜、跳过建议都写 fulfillment_events
  测试: 界面渲染正确；换菜后plan_slots.swapped_to有值；重开App仍显示换后的菜
```

## Sprint 9｜执行追踪

```
T9-01 记录餐次时关联当日计划
  产出: 修改insertMeal()，自动匹配plan_slots
  逻辑: 同日同餐型的plan_slot.executed_meal_id = meal.id
  事件: 命中计划写 fulfillment_events(type='meal_recorded', object_type='plan_slot')
  测试: 记录午饭后plan_slots的executed_meal_id有值

T9-01b 计划执行状态追踪
  产出: 计划页每个槽位显示「吃了 / 换了别的 / 没吃」三选一按钮
  状态写入规则:
    用户记录了匹配的餐次 → execution_status='eaten'（自动，不需要手动操作）
    用户手动换菜并记录 → execution_status='swapped'（自动）
    用户手动点「没吃」 → execution_status='skipped'
  时效: 当天23:59后未操作的槽位 → 自动标记为'skipped'（后台任务）
  测试:
    按计划吃 → 'eaten'，记录页返回计划页后状态更新
    手动点没吃 → 'skipped'
    execution_status用于T10-01周报中的"计划执行率"计算

T9-02 实时营养缺口显示
  产出: 首页或计划页显示当日已摄入vs目标
  数据: 实时累计当日meals的nutrition
  测试: 记录一餐后营养进度条更新
```

## Sprint 10｜洞察报告

```
T10-01 每周身体报告生成
  产出: FastAPI POST /v1/insight/generate trigger='weekly_report'
  触发条件:
    每周一 App 启动时检查，最近7天内有餐次记录 → 生成上周报告
    若 weekly_reports 表中本周已有记录 → 不重复生成
  内容: 计划执行率（execution_status统计）、履约事件漏斗、按计划日vs不按计划日的4维度对比、本周亮点
  写入: weekly_reports表（week_of = 上周一日期，UNIQUE约束防重复）
  测试:
    有7天内餐次记录 → 生成报告
    无数据 → 不生成，不报错
    同一周二次触发 → 返回已有记录，不重写

T10-02 报告界面
  产出: 首页每周一次性展示周报卡片
  测试: 周报内容准确，引用数据和数据库一致
```

**2.0 验收标准：**
- [ ] DishScore随新数据自动更新
- [ ] 周计划7天×3餐生成完整，无重复菜系同天出现
- [ ] 记录后nutrition_targets.consumed实时更新
- [ ] 有2周数据的用户能看到"按计划vs不按计划"对比

---

# MVP 3.0 — 目标干预

**前置：** complete_meals >= 21 AND checkin_rate >= 0.6
**目标：** 用户看到可解释的个人饮食规律，断食/减重干预可用
**周期：** 4 Sprint（8周）

## Sprint 11｜BodyPattern 计算

```
T11-01 相关性计算算法
  产出: algorithms/body_pattern.py compute_body_pattern(user_id)
  逻辑:
    遍历 FEATURES × METRICS 所有组合
    分有/无该特征的两组checkin，计算均值差
    |delta| > 0.25 且 sample >= 3 时保存
    confidence = min(sample_size, 20) / 20
  写入: body_patterns表（upsert，version递增）
  测试: 注入已知相关的测试数据，验证算法检测到正确相关性

T11-02 BodyPattern 触发机制
  产出: checkin提交后检查是否达到3.0解锁条件
  逻辑: 满足条件则异步调用 /v1/pattern/compute
  测试: 第21条带回访记录提交后，body_patterns表有数据

T11-03 规律可视化
  产出: components/BodyPuzzle.tsx 升级版
  显示: 相关性列表（特征→影响，置信度进度条，样本数量）
  解锁标识: 卡片右上角显示"基于X次记录"
  测试: 显示的置信度与数据库一致
```

## Sprint 12｜断食模块

```
T12-01 断食计划生成
  产出: algorithms/fasting.py recommend_fasting(user_id)
  逻辑: 分析avg_meal_gap、体重趋势、肠胃敏感度，推荐合适方案
  方案: 16:8 / 16:8宽松版 / 先建立规律（不适合断食）
  测试: 不同用户特征对应不同推荐方案

T12-02 断食计时界面
  产出: 断食模块页面（进食窗口计时，禁食剩余时间）
  功能: 开始/结束断食，超出窗口提醒
  测试: 计时准确，状态持久化（App重启后恢复）

T12-03 断食状态嵌入拍照流程
  产出: camera.tsx 拍照保存时检查断食状态
  逻辑:
    用户处于断食禁食期 → 拍照保存前弹出确认弹窗：
      「当前在断食中（距结束还有X小时）」
      选项A：「这餐打破断食，结束本次断食」→ 写入断食结束时间，正常保存餐次
      选项B：「只是记录，不结束断食」→ 正常保存，断食状态不变
      选项C：取消
  测试:
    断食中拍照 → 弹窗出现
    选A → 断食状态变为ended，meal正常写入
    选B → 断食状态不变，meal正常写入
    未处于断食期 → 拍照流程无任何额外步骤
```

## Sprint 13｜体重/目标管理

```
T13-01 热量目标动态调整
  产出: 基于goal+weight_trend动态更新nutrition_targets
  逻辑: 减重目标+体重上升→降低热量目标500kcal
  测试: 体重连续3周上升，热量目标自动降低

T13-02 目标偏离干预
  产出: 干预检测逻辑 + 首页提示卡
  触发: 热量连续3天超标 OR 体重趋势反向
  写入: interventions表
  测试: 注入超标数据，interventions表有记录，首页出现提示
```

## Sprint 14｜规律反哺计划

```
T14-01 规律反哺计划生成
  产出: 升级 /v1/plan/generate，消费body_pattern
  逻辑: 排除与已知负向相关性匹配的菜品
  事件: 因身体规律排除/替换菜品时写 algorithm_decisions 和 fulfillment_events
  测试: 有"辛辣→肠胃不适"规律的用户，计划中无辛辣菜
```

**3.0 验收标准：**
- [ ] body_patterns表有数据，相关性置信度>0.6
- [ ] 规律可视化界面数据准确
- [ ] 断食模块可正常使用，计时准确
- [ ] 计划生成排除了已知负向关联菜品

---

# MVP 4.0 — 健康整合

**前置：** body_pattern.high_confidence_correlations >= 3
**目标：** 健康数据接入，实现饭前预测，用户能看到多维度健康关联
**周期：** 5 Sprint（10周）

## Sprint 15｜Health Connect 接入

```
T15-01 Android Health Connect 权限
  产出: 申请 READ_SLEEP, READ_STEPS, READ_EXERCISE 权限
  UI: 健康数据授权引导页
  测试: 授权后health_data表能读到睡眠数据

T15-02 健康数据同步
  产出: utils/healthSync.ts 每日同步一次
  写入: health_data表（date唯一）
  测试: 连接Health Connect后，昨天的睡眠/步数有数据
```

## Sprint 16｜全维度身体画像

```
T16-01 健康数据关联展示
  产出: app/insight.tsx 升级
  显示: 饮食+睡眠+运动+体重的关联视图
  示例: "昨晚睡眠差→今天消化评分低"（有数据才显示）
  测试: 注入低睡眠+低消化评分数据，关联提示出现
```

## Sprint 17｜预测引擎

```
T17-01 饭前预测算法
  产出: algorithms/predictor.py predict_meal(user_id, candidate_dish, context)
  逻辑:
    提取候选菜品features（tags[]）
    在body_pattern.correlations中查匹配
    健康数据调节（睡眠差→消化敏感性+0.2）
    多证据聚合（同向增强，反向抵消）
  写入: predictions + algorithm_decisions，记录 dominant_source 和 expected_fulfillment_lift
  测试: 已知相关性+候选菜，验证预测方向正确

T17-02 饭前预测展示
  产出: 分析结果页增加预测标签
  显示条件: 有4.0解锁 AND 预测置信度>0.5
  文案: "根据你的X次记录，这类菜后你可能[...]"
  测试: 置信度低时不显示，高时正确显示

T17-03 饭前抽卡升级至 body_structure 阶段
  产出: 升级 draw_card.py buildCardPoolForState + get_recommendation_stage
  逻辑:
    Health Connect 授权后 get_recommendation_stage 返回 'body_structure'
    buildCardPoolForState 叠加健康数据调节层：
      睡眠<6h → 排除高油高碳菜（analysis.tags 含"高油"/"主食偏多"）
      步数≥8000 → 解除高碳水过滤限制
      运动日（当天 exercise > 30min）→ 高蛋白菜 +2
      只使用已授权且当天有值的字段，无数据字段不参与
    card_actions.recommendation_stage 写入 'body_structure'
    reason 文案引用今日身体状态（"昨晚睡眠不足，今天先避开重口"）
  测试: 昨晚睡眠<6h 时 stable/alt 槽无高油高碳菜；无睡眠数据时不触发该过滤；Health Connect 未授权时保持 body_puzzle 阶段
```

## Sprint 18｜预测反馈回路

```
T18-01 PredictionAccuracy 计算
  产出: 每次daily_checkin提交后，对比当天的预测记录
  写入: prediction_accuracy表
  更新: body_pattern.correlations中对应项的confidence
  测试: 预测正确时confidence+0.05，错误时-0.08

T18-02 干预频率控制
  产出: 同类干预72小时内不重复触发
  逻辑: 检查interventions表中同类型的最近记录
  测试: 连续触发同类干预，第2次在72小时内不显示
```

## Sprint 19｜全流程仪表盘

```
T19-01 统一健康仪表盘
  产出: app/insight.tsx 完整版
  模块: 今日计划进度、精力趋势、体重趋势、断食状态、预测准确率
  测试: 所有模块数据准确，空数据状态有占位文案
```

**4.0 验收标准：**
- [ ] Health Connect数据同步到health_data表
- [ ] 有足够数据的用户看到跨维度关联（饮食↔睡眠）
- [ ] 饭前预测标签正确显示，置信度<0.5时不显示
- [ ] prediction_accuracy记录存在，confidence随反馈更新

---

# MVP 5.0 — 用户履约

**前置：** 平台用户>=1000 AND 个人预测准确率>=0.65
**目标：** 用户授权后可通过平台购买食材或订阅配餐
**周期：** 6 Sprint（12周）

## Sprint 20｜信任证明

```
T20-01 健康成果报告生成
  产出: 3个月回顾报告页面
  数据: 精力均值变化、体重变化、肠胃改善率、预测准确率
  触发: 使用满90天后首页出现引导
  测试: 有90天数据的账号报告数据准确
```

## Sprint 21-22｜食材采购

```
T21-01 食材清单从计划生成
  产出: algorithms/grocery.py plan_to_grocery_list(plan_id)
  逻辑: 解析plan_slots的菜品→标准食材列表→按类别聚合；同时写 dish_key / ingredient_key 映射候选
  测试: 5菜计划生成正确的食材清单和份量

T22-01 采购接口对接
  产出: 对接第三方生鲜API（具体平台由人类决策D5确定）
  功能: 一键下单，订单状态追踪
  写入: fulfillment_orders + fulfillment_order_items + fulfillment_events
  测试: 沙盒环境下单流程完整
```

## Sprint 23-24｜配餐订阅

```
T23-01 配餐方案界面
  产出: 周配餐订阅购买页
  功能: 预览菜单、选择份数、设置配送时间
  写入: fulfillment_orders(type='subscription') + fulfillment_events(type='subscription_started')
  测试: 订阅流程完整，数据写入Supabase
```

## Sprint 25-26｜社区层

```
T25-01 CommunityDishProfile 聚合
  产出: 后台定时任务（每日凌晨），聚合所有用户的meal+checkin
  逻辑: 按dish_key分组，按segment（goal+age+health_bg）分层统计
  写入: community_dishes表
  测试: 注入100个不同用户数据，社区评分计算正确

T25-02 协同过滤推荐（冷启动）
  产出: 新用户（<7天数据）使用community_dishes推荐
  逻辑: 按profile匹配最近segment，返回该segment高分菜
  测试: 新注册用户的推荐来自社区数据，有数据来源标注

T25-03 饭前抽卡升级至 fulfillment 阶段
  产出: 升级 draw_card.py buildCardPoolForState + get_recommendation_stage
  逻辑:
    履约历史可追踪后 get_recommendation_stage 返回 'fulfillment'
    buildCardPoolForState 叠加执行率调节层：
      近4周 plan_slots 复杂备餐菜执行率<60% → 降权同类菜
      用户跳过率最高的菜系整体降权
      历史高执行率菜 +2 加权
    general 阶段冷启动 explore 槽改为从 community_dishes 同 segment 高分菜中选
    card_actions.recommendation_stage 写入 'fulfillment'
    reason 文案引用执行可行性（"你这周复杂备餐执行率低，这张更容易完成"）
  测试: 连续跳过某菜系用户该菜系不出现在 stable/alt 槽；新用户 explore 槽菜品来自社区同 segment；高执行率用户 stable 槽为历史执行最稳定的菜之一
```

**5.0 验收标准：**
- [ ] 90天回顾报告数据准确
- [ ] 食材清单从计划正确生成
- [ ] community_dishes表有聚合数据
- [ ] 新用户推荐标注"基于与你相似的用户"

---

# MVP 6.0 — 履约率优化与食材记忆

**前置：** 5.0 已跑通沙盒或真实履约订单 AND 计划执行状态可追踪 AND 周报已成为用户可理解的信任界面
**目标：** 以单人履约链路为核心，用干饭履约数据和 AI 推断优化下一轮计划、采购、配餐和会员转化
**周期：** 4 Sprint（8周）

## Sprint 27｜履约数据资产化

```
T27-01 履约事件链
  产出: fulfillment_events 写入规范 + 客户端/服务端事件入口
  逻辑: 计划生成、查看、接受、替换、跳过、采购、配餐、反馈、周报、会员动作都进入统一事件链
  测试: 关键路径能按 user_id 串出 plan_slot -> order -> meal -> feedback -> report

T27-02 食物身份映射
  产出: canonical_foods + food_identity_mappings 初版
  逻辑: 先覆盖高频食材、常见菜品、5.0 履约 SKU；建立 dish_key / ingredient_key / sku_key / nutrition_item_id 映射
  测试: 番茄炒蛋计划、鸡蛋 SKU、餐图识别鸡蛋能映射到同一 ingredient_key
```

## Sprint 28｜食材记忆推断

```
T28-01 履约后食材记忆生成
  产出: algorithms/food_memory.py create_food_memory_from_order(order_id)
  逻辑: 订单完成后自动生成 food_memory_items，估算数量、保质期和置信度
  测试: 沙盒订单送达后生成食材记忆，不要求用户每日确认

T28-02 食材消耗推断
  产出: algorithms/food_memory.py infer_consumption(user_id, meal_id)
  逻辑: 结合餐图 recognized_foods、plan_slot、历史食量、订单时间和食材身份映射，推断已购食材消耗
  测试: 记录番茄炒蛋后，相关鸡蛋/番茄 food_memory_items 剩余比例下降且有置信度

T28-03 饭前抽卡 food_memory 阶段
  产出: 升级 draw_card.py buildCardPoolForState + get_recommendation_stage
  逻辑:
    food_memory_items 可用时 get_recommendation_stage 返回 'food_memory'
    buildCardPoolForState 新增食材记忆加权层：
      当前有库存的食材关联菜（dish_key ↔ ingredient_key 映射）评分 +3
      临期食材（remaining_ratio < 0.2 且 expiry_date 在 3 天内）关联菜评分 +2
    stable 槽优先选与库存食材高关联度的菜
    explore 槽保持未记录探索方向（不受食材记忆约束）
    card_actions.recommendation_stage 写入 'food_memory'
    reason 文案引用手边食材："家里鸡蛋和番茄大概率还够，今天优先用掉"
  测试: 有鸡蛋+番茄库存时，stable 槽优先出番茄炒蛋类菜；无库存时回退 body_puzzle 加权
```

## Sprint 29｜反哺计划与履约

```
T29-01 计划生成使用食材记忆
  产出: 升级 /v1/plan/generate 的 PlanContext
  逻辑: 优先使用已购且适合用户目标的食材；快过期食材仅在不伤害健康目标时提高排序
  测试: 有高置信剩余鸡蛋时，下周早餐计划更倾向使用鸡蛋

T29-02 采购/配餐/会员履约优化
  产出: /v1/fulfillment/optimize
  逻辑: 根据计划执行率、订单消耗、浪费风险、复购周期，输出补货、减少配餐份数或会员价值触发建议
  测试: 剩余食材过多时减少采购建议；计划执行高且频繁使用高级功能时会员价值触发更自然
```

## Sprint 30｜周报确认与商业验证

```
T30-01 食材记忆周报
  产出: weekly_fulfillment_reports + 周报食材记忆模块
  逻辑: 每周集中展示系统推断：吃完了什么、可能还剩什么、可能浪费什么、下周怎么调整
  用户动作: 只在周报里做低频纠错，不做每日库存维护
  测试: 周报展示食材记忆摘要，纠错写 food_memory_events(type='corrected')

T30-02 履约率归因
  产出: algorithms/fulfillment_attribution.py compute_fulfillment_lift(user_id, week_of)
  逻辑: 对比使用食材记忆前后计划执行率、采购转化率、配餐续订率、周报纠错率
  测试: 周报能输出“哪些动作提升/降低履约率”的结构化结果
```

**6.0 验收标准：**
- [ ] 关键动作都写入 `fulfillment_events`，能串出计划到履约结果链路
- [ ] 高频菜品/食材/SKU/营养库身份映射可用
- [ ] 订单完成后自动生成食材记忆，用户无需每日确认
- [ ] 餐次记录后能推断食材消耗并更新置信度
- [ ] 周计划能使用食材记忆优化排序
- [ ] 周报能集中展示并纠错食材记忆
- [ ] 能计算食材记忆对计划执行、采购转化、配餐续订或会员转化的影响

---

# 人类必须准备的资源清单

## 开发前必须到位（AI无法自行获取）

| 类别 | 资源 | 获取方式 | 优先级 |
|------|------|----------|--------|
| API密钥 | Anthropic API Key | console.anthropic.com | 🔴 必须 |
| | 写入: `services/ai/.env` 变量名: `ANTHROPIC_API_KEY` | | |
| | OpenAI API Key（仅用于 text-embedding-3-small 向量化营养库） | platform.openai.com | 🔴 Sprint1前 |
| | 写入: `services/ai/.env` 变量名: `OPENAI_API_KEY` | | |
| 后端平台 | Supabase 项目（Project URL / Anon Key / Service Role Key） | app.supabase.com 免费计划可用 | 🔴 必须 |
| | 写入: `apps/mobile/.env` → `SUPABASE_URL` / `SUPABASE_ANON_KEY` | | |
| | Supabase 项目需开启 pgvector 扩展（Dashboard → Extensions → vector） | Supabase Dashboard | 🔴 Sprint1前 |
| 营养数据 | 中国食物成分表开源数据（1000条起步） | github.com/Sanotsu/china-food-composition-data 直接下载CSV | 🔴 Sprint1前 |
| | 备选: phsciencedata.cn（政府数据，免费申请导出） | | |
| | 整理为标准 CSV 格式后放入 `supabase/nutrition_seed/cn_nutrition_db.csv` | 约半天整理工作量 | |
| AI服务部署 | Railway 账号，连接GitHub仓库，设置环境变量 | railway.app 免费计划可用 | 🔴 必须 |
| 推送通知 | Firebase 项目，下载 `google-services.json`，放置 `apps/mobile/` | console.firebase.google.com | 🟡 Sprint3前 |
| 应用发布 | Google Play 开发者账号（一次性 $25） | play.google.com/console | 🟡 Sprint6前 |
| 版本控制 | GitHub 仓库，邀请Codex访问权限 | github.com | 🔴 必须 |

## 开发环境（本地机器）

| 工具 | 版本要求 | 验证命令 |
|------|----------|----------|
| Node.js | 20+ | `node --version` |
| Python | 3.11+ | `python --version` |
| pnpm | 9+ | `pnpm --version` |
| Android Studio | 最新稳定版 | 用于模拟器 |
| EAS CLI | 最新版 | `npm i -g eas-cli` |
| Supabase CLI | 最新版 | `npm i -g supabase` |
| Git | 2.40+ | `git --version` |

## 测试设备

| 设备 | 用途 |
|------|------|
| Android 真机 ≥1台 | 通知测试（模拟器收不到FCM推送） |
| Android 版本 ≥ 10 | Health Connect需要Android 10+ |

## 应用资产

| 文件 | 规格 | 用途 |
|------|------|------|
| `icon.png` | 1024×1024 PNG | App图标 |
| `splash.png` | 1242×2436 PNG | 启动画面 |
| `adaptive-icon.png` | 1024×1024 PNG | Android自适应图标 |

## 决策事项（需要人类确认后AI才能继续）

| 序号 | 决策点 | 影响范围 | 何时需要确认 |
|------|--------|----------|------------|
| D1 | 应用包名（建议：`com.ganfan.app`） | 整个生命周期不可改 | 开发开始前 |
| D2 | Supabase区域（建议：ap-northeast-1） | 数据延迟 | 创建项目前 |
| D3 | FastAPI部署区域（建议：Railway ap-northeast） | AI分析延迟 | Sprint2前 |
| D4 | 2.0食材数据库来源：自建菜品→食材映射表 OR 对接第三方食材API | 数据准确性 | Sprint21前 |
| D5 | 5.0采购平台：美团买菜/叮咚买菜/盒马 | 商务合作 | Sprint22前 |
| D6 | 6.0食材记忆使用边界：只使用干饭履约渠道 OR 开放外部库存导入 | 产品负担、隐私、安全和履约数据质量 | Sprint27前 |

---

## Seed 数据规范

> 文件：`supabase/seed.sql`，供本地开发和 CI 自动化测试使用。每个验收场景对应一个测试账号。

```sql
-- ══ 测试账号 ═══════════════════════════════════════
-- 使用固定 UUID，方便跨机器复现

-- 账号 A：新用户（0 餐），用于测试 onboarding 流程
INSERT INTO users (id, email) VALUES
  ('00000000-0000-0000-0000-000000000001', 'seed_new@test.com');
INSERT INTO profiles (user_id, goal, avoid, daily_budget, feeling)
  VALUES ('00000000-0000-0000-0000-000000000001', '越来越舒服', null, 90, null);
INSERT INTO meal_budget_weights (user_id, meal_type, weight) VALUES
  ('00000000-0000-0000-0000-000000000001', '早饭', 0.20),
  ('00000000-0000-0000-0000-000000000001', '午饭', 0.35),
  ('00000000-0000-0000-0000-000000000001', '晚饭', 0.40),
  ('00000000-0000-0000-0000-000000000001', '加餐', 0.05);

-- 账号 B：7 餐完整记录，用于验证身体拼图解锁、首批洞察
INSERT INTO users (id, email) VALUES
  ('00000000-0000-0000-0000-000000000002', 'seed_7meals@test.com');
INSERT INTO profiles (user_id, goal, daily_budget)
  VALUES ('00000000-0000-0000-0000-000000000002', '越来越舒服', 90);
-- 数据特征：
--   7 条 meals + meal_analysis + meal_feedback
--   province 覆盖：四川×3、广东×2、江苏×2（distinct_cuisines=3，口味探索块解锁）
--   comfort 分布：'舒服'×3、'胀气'×2、'困倦'×2

-- 账号 C：21 餐完整记录，用于验证 BodyPattern 解锁
INSERT INTO users (id, email) VALUES
  ('00000000-0000-0000-0000-000000000003', 'seed_21meals@test.com');
INSERT INTO profiles (user_id, goal, daily_budget)
  VALUES ('00000000-0000-0000-0000-000000000003', '越来越舒服', 90);
-- 数据特征：
--   21 条 meals + meal_feedback
--   注入已知相关性：
--     川菜/辛辣 → digestion='有点不适'（至少 5 次，形成统计显著性）
--     粤菜/清淡 → digestion='舒适顺畅'（至少 5 次）
--   用于验证 body_pattern.py 检测出"辛辣→肠胃不适"相关性，confidence > 0.4

-- 账号 D：90 天数据，用于验证 5.0 健康成果报告
INSERT INTO users (id, email) VALUES
  ('00000000-0000-0000-0000-000000000004', 'seed_90days@test.com');
-- 数据特征：
--   90 天跨度约 180 条 meals，体重趋势下降（-2kg），
--   前 30 天 comfort 好评率 40%，后 30 天 60%（可计算改善幅度）
```

> seed 中各行的具体字段值由 Codex 在完成 Migration 001 后生成。
> 上方注释说明了**数据特征约束**，Codex 必须满足这些约束才能通过对应 Sprint 的验收。
>
> 执行方式：
> - 本地：`supabase db reset`（自动执行 seed.sql）
> - CI：GitHub Actions 集成测试步骤前执行 `supabase db reset`
> - 生产环境：禁止执行 seed.sql

---

# 算法部署节奏

| 时间 | 算法上线 | 触发方式 |
|------|----------|----------|
| 1.0 Sprint5 | `rules.py` | App请求 `/v1/insight/generate` |
| 2.0 Sprint7 | `dish_score.py` | `daily_checkin`提交后异步触发 |
| 3.0 Sprint11 | `body_pattern.py` | 第21条完整记录提交后异步触发 |
| 4.0 Sprint17 | `predictor.py` | 拍照后，识别完成时触发 |
| 5.0 Sprint25 | `collaborative.py` | 后台定时任务，每日凌晨运行 |
| 6.0 Sprint27 | `fulfillment_events.py` / `context_composer.py` | 所有关键动作写事件，算法调用前组装任务上下文 |
| 6.0 Sprint28 | `food_memory.py` | 履约订单送达、餐次记录后异步触发 |
| 6.0 Sprint30 | `fulfillment_attribution.py` | 周报生成前后计算履约率归因 |

**关键原则：** 算法在FastAPI服务中，App版本升级不影响算法迭代。算法服务独立部署，可热更新，不需要重新发版App。

---

> 本方案设计为 Codex 可独立执行。每个任务有明确输入、输出、验收标准。
> 人类只需完成资源清单中的准备工作，决策事项在对应时间节点确认，AI可不间断地按阶段推进开发。
