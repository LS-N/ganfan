# Phase 1: MVP 1.0 记录感知

来源：`docs/02-master-blueprint.md` 第 1920-2282 行。

本文件是蓝图任务映射，不得改写任务编号。开发时只能在对应任务下补充执行说明，不能新增脱离蓝图的任务。

## 本阶段必须引用的蓝图章节

开发 Phase 1 前必须同时读取 `docs/02-master-blueprint.md` 中这些章节：

- `完整数据库 Schema`
  - `Migration 000：营养向量库（pgvector）`
  - `Migration 001：1.0 核心表`（特别注意 `card_actions` 表扩展字段和 `meals.from_card` 注释）
- `API 接口规范`：`/v1/meal/analyze`、`/v1/nutrition/search`、`/v1/insight/generate` 等 1.0 相关接口。
- `饭前抽卡功能规范`：三阶段解锁、三槽位设计、状态过滤规则、算法与 AI 分工、数据流全貌。**实现 T5-01/T5-02/T5-03 前必须阅读此章节。**
- `功能解锁阈值`：DRAW_CARD 三阶段阈值（0/3/7）、身体拼图、洞察解锁等门槛。
- `省份数据常量`：菜系地图和 `meals.province` 映射。
- `算法与大模型分工`：Vision 识别、营养匹配、规则引擎、首批洞察边界。
- `核心 TypeScript 类型`：Meal、MealAnalysis、Feedback、Checkin、Profile 等类型。
- `Zustand Store 接口定义`：meal/profile/checkin 等 store 约束。
- `完整 RLS 策略`：1.0 表必须受用户隔离保护。
- `FastAPI 安全规范`：JWT、速率限制、输入验证。
- `UserContext 构建逻辑（builder.py）`：AI 分析和建议必须使用的上下文。
- `Claude Prompt 模板`
  - `Prompt 1：Vision 识别`
  - `Prompt 2：个性化建议生成`
  - `Prompt 3：首批洞察生成（T5-05）`
- `环境变量规范`：移动端只使用 `EXPO_PUBLIC_*`，客户端不得保存 AI provider secret。
- `CI/CD 流水线`：移动端质量门禁和 EAS 构建边界。

不得把本章节内容复制成新的权威；如有冲突，以 `docs/02-master-blueprint.md` 为准。

## 本阶段 AI UC 实施清单

本节是 Phase 1 在 AI 服务层架构下的具体实装清单。**架构契约见蓝图「AI 服务层架构」章节，每个 UC 的完整契约见 `docs/architecture/use-cases/`**。

### Phase 1 必装 UC

| UC | name | Layer | 关联任务 | 实施备注 |
|---|---|---|---|---|
| UC-01 | `meal_analysis` | producer+consumer 混合 | T2-05、T2-06 | v1.0 单次 LLM 调用版本；Phase 2 升级 v2.0 两阶段 |
| UC-02 | `body_insight` | consumer | T5-05、T5-06 | 需 ≥3 条 meal_feedback 数据触发；Phase 1 至少要把"我发现了一规律"通知打通 |
| UC-05 | `nutrition_match` | enricher（非 LLM） | T2-05 | UC-01 输出后自动触发；FastAPI 内部调用 pgvector |

### Phase 1 可选 UC

| UC | name | 是否纳入 Phase 1 | 决定 |
|---|---|---|---|
| UC-04 | `leftover_compare` | 暂不纳入 | 推到 Phase 1 末期或 Phase 2；需要 Provider 抽象扩展 `call_vision_multi()` |
| UC-03 | `card_recommend` | 不纳入 | Phase 2 必装，本阶段只建空骨架文件占位 |

### 框架基础设施（必须本阶段建好）

不实装具体 UC 之前，必须先把 AI 服务层框架建好。这部分对应一个独立任务（建议编号 T2-04a「AI 服务层脚手架」）：

```
services/ai/
├── core/                       ← Phase 1 必须完成
│   ├── base.py                 UseCase Protocol + 异常类
│   ├── registry.py             UseCaseRegistry
│   ├── dispatcher.py           dispatch() + Stage Router 接口
│   └── telemetry.py            v1 日志记录
├── providers/
│   ├── base.py                 LLMProvider Protocol
│   ├── registry.py             ProviderRegistry
│   ├── siliconflow.py          已有，改造实现 Protocol
│   └── mock.py                 已有，改造实现 Protocol
├── routers/
│   └── use_cases.py            /v1/uc/{name} 唯一路由
└── use_cases/
    ├── __init__.py             自动 import uc_*.py
    ├── uc_01_meal_analysis.py
    ├── uc_02_body_insight.py
    └── uc_05_nutrition_match.py

src/services/ai/
├── core/
│   ├── types.ts                AiUseCase 接口
│   ├── client.ts               executeUseCase()
│   └── registry.ts             客户端注册
├── useCases/
│   ├── index.ts                显式注册所有 UC
│   ├── mealAnalysis.ts
│   ├── bodyInsight.ts
│   └── nutritionMatch.ts
└── schemas/
    ├── common.ts               跨 UC 共享类型 (Insight, RecentMealRef)
    ├── mealAnalysis.ts
    ├── bodyInsight.ts
    └── nutritionMatch.ts
```

### 现有代码改造

| 现有文件 | 处置 | 关联任务 |
|---|---|---|
| `services/ai/routers/analyze.py` | **删除**，逻辑挪到 `use_cases/uc_01_meal_analysis.py` | T2-05 重构 |
| `services/ai/providers/siliconflow.py` | **改造**实现 `LLMProvider` Protocol，业务逻辑留在 UC 内 | T2-05 重构 |
| `src/services/aiMealAnalysisService.ts` | **删除**，调用方改用 `executeUseCase("meal_analysis", ctx)` | T2-05 重构 |
| `src/services/aiSchema.ts` | **拆分**，UC-01 解析移到 `useCases/mealAnalysis.ts`，通用工具留在 `core/` | T2-05 重构 |

### 实施顺序

```
Step 1: 建框架（先不实装 UC）
  - core/base.py + registry.py + dispatcher.py（FastAPI）
  - core/types.ts + client.ts + registry.ts（App）
  - 验收：MockProvider 跑通空 UC，registry 校验生效

Step 2: 把 UC-01 重构进新框架
  - 删 routers/analyze.py
  - 新 use_cases/uc_01_meal_analysis.py
  - App 端切换调用
  - 验收：拍照 → 真实分析全链路打通，无回归

Step 3: 加 UC-05（pgvector）进框架
  - 新 use_cases/uc_05_nutrition_match.py
  - UC-01 内部触发 UC-05 回填 nutrition_source
  - 验收：营养库匹配命中率与现状一致

Step 4: 实装 UC-02（身体洞察）
  - 新 use_cases/uc_02_body_insight.py
  - 客户端 deriveInsights → 首页"我发现了一规律"通知 → 调 UC-02 生成文案
  - 验收：≥3 条 feedback 后能看到自然语言洞察
```

### 不在本阶段做

- ❌ UC-03 `card_recommend` 实装（Phase 2）
- ❌ UC-04 `leftover_compare` 实装（Phase 1 末期或 Phase 2 决定）
- ❌ UC-01 两阶段拆分优化（Phase 2 v2.0）
- ❌ 多 Provider A/B（Phase 3）
- ❌ Eval 自动化（Phase 4）
- ❌ Canary 灰度（Phase 4+）

详细架构契约和每个 UC 的完整规范，见 `docs/architecture/use-cases/`。

## 阶段目标

用户能完整记录餐次：拍照 -> 分析 -> 反馈 -> 回访，连续 7 天后看到第一条个人规律。

## 周期与完成判定

- 周期：6 Sprint x 2 周 = 12 周。
- 完成判定：用户连续 7 天记录，每天至少 1 餐，回访完整率 > 60%，首页出现第一条洞察。

## 前置条件

- Sprint 0 全部完成。
- 涉及 `expo-sqlite`、`expo-camera`、`expo-image-manipulator`、`expo-notifications`、Supabase migrations、FastAPI、真实 AI secret 时，必须先得到用户明确批准。

## 主原型同步修订（2026-05-18）

本节单独记录 `docs/prototype/meal-agent-product-prototype.html` 已确认但尚未进入 App 开发的主原型口径。后续 Phase 1 工程实现必须优先对照本节，避免继续沿用任务表中的旧字段或旧文案。

### 首页状态机

- 首页主状态收敛为三类：`DEFAULT`、`PENDING_FEEDBACK`、`OVERDUE_FEEDBACK_HINT`。
- `DEFAULT` 触发：今天第一餐，或上一条待反馈餐已超过 30 分钟让出首页主卡。
- `PENDING_FEEDBACK` 触发：用户在分析页点击“好的，去吃了”后立即生成一条待反馈餐次；30 分钟内这条记录占首页主卡。
- `OVERDUE_FEEDBACK_HINT` 触发：当天存在超过 30 分钟未反馈的餐次；首页主卡恢复默认，同时下方展示“你还有 X 餐没反馈”提示，点击后进入饮食日历并定位最近一条未反馈餐。
- 不再保留旧的“已分析待开始”首页状态，也不再保留“已反馈收据主卡”；分析结果页点“好的，去吃了”就是创建待反馈餐次。

### 餐次与加餐数据口径

- 每次拍照/选图代表一次独立摄入记录；再次点餐、喝饮品、吃小食都生成新的 `加餐` 餐次。
- 待反馈状态下点击“刚刚又吃/喝了别的”不再写入 `meals.additionals`，而是进入新的加餐拍照/分析/记录链路。
- 未反馈餐次和后续加餐分别反馈，不做“合并反馈”或“同餐多次摄入”。
- 后续真实开发不得继续实现旧 `additionals` 合并模型；如数据库历史字段仍存在，只作为旧数据兼容读取，不作为新增写入路径。

### 分析结果页

- 拍照或选图后直接进入分析，不在分析完成后提供“重拍/换图”主路径。
- 分析页必须显示餐次选择：早饭、午饭、晚饭、加餐；AI 可默认判断，用户可手动改。
- 分析页主信息结构收敛为五块：餐次选择、图片、分析结果+建议、营养概览、打卡提示和按钮。饭前页面只服务“看懂这一餐并决定怎么吃”，不得恢复报告型长页面。
- “分析结果+建议”必须合并展示菜名、AI/结构点评、当前建议、餐食组成；菜系、地区、场景和食物数量只在餐食组成里表达，不再在标题摘要区重复显示。
- 原独立“进食建议”卡不再实现；饭前页面不得展示“可能的饭后反应”。饭后反应只能作为反馈/回访问卷或后续验证项出现，不能在饭前当成结论展示。
- 单食物标题显示菜名，例如“白切鸡饭”。
- 多食物标题显示“菜系名称 + 组合餐”，例如“川菜组合餐”；餐食组成中拆分图片内食物类别、份量和热量，例如水煮鱼、白菜豆腐汤、麻椒兔。
- 每一餐必须有 `cuisine` 和 `province`；营养概览点击后能看到各食物对热量、碳水、蛋白、脂肪等指标的贡献明细。
- 主原型营养库链路必须按真实接口验收：分析结果渲染后调用 FastAPI `GET /v1/nutrition/search?q=食物名&limit=5`，用返回的真实营养库候选更新 `recognizedFoods[].nutritionSource`、`matchedNutritionName`、`matchConfidence`、`nutritionContribution` 和汇总 `nutritionEstimate`。
- 原型与真实 App 共用同一条服务边界：客户端只调用 FastAPI，不直接连接 Supabase `nutrition_items`，避免在 HTML 原型或移动端暴露 service role、数据库权限或复杂 RLS 查询。
- 营养来源状态必须可见且不可伪装：查询中显示“连接营养库”；命中显示“营养库匹配”；接口不可用显示“营养库未连接”；未命中显示“AI估算”；规格/份量不足显示“待确认”。
- FastAPI 为本地原型和 Expo 调试提供 CORS：默认允许 `localhost/127.0.0.1` 调试源和 `file://` 的 `null` origin；生产环境必须通过 `AI_SERVICE_CORS_ORIGINS` 收紧允许源。
- 主原型真实链路中可复用到 App 的部分是 API 契约、字段映射、营养匹配状态机、份量换算算法、失败降级口径和 UI 信息架构；HTML `fetch`、DOM 更新和内联样式不能直接复制到 React Native。

### 建议来源与递增能力

- 分析结果卡的建议区域必须显示轻量来源标签，当前主原型字段为 `adviceStage` / `advice_stage`，并允许按当前身体拼图状态降级推断。标签只展示当前建议来源，不展开完整产品架构说明。
- Phase 1 真实 App 至少需要承接 `adviceStage` 枚举和展示口径：`general`（通用建议）、`feedback`（反馈建议）、`body_puzzle`（身体拼图建议）、`body_structure`（身体结构建议）、`fulfillment`（计划履约建议）、`food_memory`（食材记忆建议）。Phase 1 可只实际产生 `general` / `feedback` / `body_puzzle`，但字段和降级逻辑必须兼容后续阶段。
- `general` 来源于本餐照片结构和营养库事实；`feedback` 来源于少量饭后反馈片段；`body_puzzle` 来源于稳定身体拼图规律；`body_structure` 来源于已授权身体信号；`fulfillment` 来源于计划执行、跳过、替换和预算；`food_memory` 来源于订单、剩余量、保质期和食材消耗推断。
- 当前 Phase 1 不实现 5.0/6.0 计划履约和食材记忆算法，只保留字段、标签和上下文边界，避免后续迁移时重新设计建议来源。
- 产品架构图中的“建议能力递增”横向滑动卡片属于跨阶段说明资产，可复用为后续设计/开发文档中的枚举、解锁条件、示例文案和验收口径；其 HTML 横向滚动实现不能直接复制到 React Native，App 应用 `FlatList horizontal` 或等效组件实现。
- 建议能力递增循环固定为：记录 -> 反馈 -> 规律 -> 结构 -> 计划 -> 履约 -> 食材记忆 -> 下一轮建议。后续进入 2.0+ 计划、4.0 身体结构和 6.0 食材记忆时，必须沿用这条链路，不得另起独立推荐系统。

### 历史记录与反馈口径

- 历史页统一使用“反馈”口径，不再出现“未打分”。
- 有反馈的餐次显示身体状态，例如舒服、胀气、困倦。
- 没有反馈的餐次只显示“补录反馈”动作，不额外叠加“未打分/未反馈”缩略图角标。
- 首页未反馈提示进入饮食日历时，默认定位当天最近一条未反馈餐；多条未反馈时仍只定位最近一条，其余留在当日列表中通过“补录反馈”动作处理。

### 饮食日历

- 历史页第一个 Tab 命名为“饮食日历”，不再使用“打卡日历”。
- 饮食日历顶部应有总览卡，表达“累计记录了 X 次餐食”；该卡是全量累计，不随月份或餐次筛选变化。
- 日历主体默认展示当前年月；年月标题可点击打开时间选择器，时间选择器只负责选择年份和该年份下有记录/可用的月份，不提供日期宫格；具体日期只能在下方正式月历中点选。
- 月历左侧固定展示当前年月的两个统计：`饮食餐次`（当月总餐次数）和 `记录天数`（当月有记录的自然日数）。
- 旧的日历上方横排 `全部 / 早饭 / 午饭 / 晚饭 / 加餐` 统计 Tab 必须删除；餐次筛选改为年月标题右侧的一级 Tab，默认显示 `全部`，点击展开 `早饭 / 午饭 / 晚饭 / 加餐 / 重置`。
- 餐次筛选只影响月历有记录日期、当日列表和当日记录标题；`重置` 恢复 `全部`。
- 日历日期格视觉规则：无记录日期为灰色弱态；有记录日期只用当天已反馈餐次的综合反馈状态决定色块；待反馈不单独改变日期格颜色，应在下方记录卡片中通过“补录反馈”呈现。
- 当天反馈状态算法：只统计当天已反馈餐次；若当天没有已反馈餐次，日期格使用中性已记录态；若存在强负向反馈（困倦、胀气、反酸、口渴、撑、不舒服等）或负向总分小于 0，则判为不适；正向总分大于 0 判为良好；其余为一般。
- 当日记录标题使用数量语义：未筛选时显示 `D日 · Y 餐记录`；筛选后显示 `D日 · X / Y 餐记录`。未反馈状态不进入标题，仍由记录卡片动作表达。

### 菜系地图

- 菜系地图应升级为真实中国省级轮廓视觉，而不是矩形省份占位图，也不得继续使用已废弃的手绘示意轮廓。
- 主原型当前使用 ECharts 4.0.2 `map/json/china.json` 本地资产：`docs/prototype/assets/china-echarts-4.0.2.json` 和 `docs/prototype/assets/china-echarts-4.0.2.js`；资源来源为 `https://github.com/apache/echarts/blob/4.0.2/map/json/china.json`，license 记录为 BSD-3-Clause，进入 App 前仍需做一次 license/合规复核。
- 地图应解码 ECharts `UTF8Encoding` GeoJSON，按经纬度投影生成省级 path，按 `meal.province` 聚合点亮已吃过的省份/菜系归属地；未解锁区域浅色，已解锁区域高亮。
- 原型和真实 App 应尽量复用同一份结构化地图资产和算法：`provinceId`、省份名、菜系名、GeoJSON/path、中心点 `cp`、点击区域、投影/缩放、聚合统计规则。
- 菜系地图 Tab 内不再单独渲染顶部标题区：删除“美食版图”和“已解锁 X / 34 个省份菜系”两行；页面已由顶部 Tab 表达当前位置。
- 菜系地图页不再展示公共餐次筛选行；三个统计块（已解锁菜系、待探索、总记录餐）移动到地图上方。
- 地图不再使用圆圈标点；点亮省份使用省级色块，并在省份中心显示对应菜系 icon；地图中必须展示省份名称，已解锁省份名称与 icon 共同辅助识别。
- 已解锁菜系列表点击后，应在同一容器内无感切换为该菜系下的时间轴记录，不跳新页面、不在容器外追加详情块；返回入口放在菜系卡片右侧。
- 菜系时间轴筛选使用两个一级 Tab：`全部时间` 与 `全部餐次`。时间 Tab 展开后先展示年份，再在所选年份下展示月份；展开内容不重复展示“全部时间 / 全部月份”。餐次 Tab 展开后只展示早饭、午饭、晚饭、加餐，不重复展示“全部餐次”。
- 菜系记录计数语义：未筛选时卡片显示 `省份 · Y 餐记录`；有任一筛选条件时显示 `省份 · X / Y 餐记录`。
- 真实 App 推荐使用 `react-native-svg` 渲染同一份 path 数据；该方案新增原生依赖，需要用户单独批准并重新打包。若暂不新增原生依赖，只能降级为静态底图 + 绝对定位点位，必须在任务记录中说明不可完全复用省份 path 高亮，阶段验收不得写成完整 PASS。

### 饭前抽卡（主原型同步修订 2026-05-21）

- 饭前抽卡无硬锁门槛。旧版"不足 7 餐显示锁定页"已废弃，改为三阶段渐进升级（`general` → `feedback` → `body_puzzle`），每个阶段可正常抽卡，阶段决定推荐质量，不决定能否使用。
- 三阶段解锁阈值：0-2 条有效反馈 = `general`；3-6 条 = `feedback`；≥7 条 = `body_puzzle`（**有效反馈** = `meal_feedback.comfort` 非空的餐次）。
- 界面入口为"饭前抽卡"选项，显示三阶段进度 badge（通用 → 反馈 → 身体，当前阶段高亮）+ 右侧"再记 X 餐 → 下一阶段"或"✓ 满血状态"。
- 三槽位设计：`stable`（常规款，● STANDARD，橙红）/ `alt`（特别款，◆ LIMITED，金黄）/ `explore`（隐藏款，★ RARE，深紫）。暗牌翻开前不知道是哪道菜，翻开后 Sheet 展示"你抽到了 [槽位名]"。
- 过滤和加权规则只基于用户自己的 `meal_feedback.comfort` 和 `meal_analysis.tags` 历史，**不调用营养库**（营养库只有原料级数据，无饭后感受标签）。
- 算法（Python）选菜，Claude 写 reason 和 advice，Claude 不自主决定推荐哪道菜。
- `card_actions` 写入字段已扩展：`slot`、`slot_label`、`card_state`、`recommendation_stage`、`source`（旧字段 `dish/badge/risk/action/ts` 保留）。
- `meals.from_card` JSONB 已扩展：新增 `slot`、`slot_label`、`card_state`、`recommendation_stage`、`recommendation_stage_label`、`advice`。
- 原型实现可复用到 App 的内容：三阶段状态机、状态 × 过滤规则映射、槽位配置（颜色/稀有度/文案）、`buildCardPoolForState` 算法逻辑；HTML DOM 和内联样式不能直接复制，App 应用 React Native 组件实现。
- 权威规范见 `docs/02-master-blueprint.md` 章节 `## 饭前抽卡功能规范`。

### 原型到工程复用要求

- 原型新增交互时必须同时评估真实 App 能否复用：能复用的写成数据配置、状态机、常量或算法；不能直接复用的明确写出原因和工程替代方案。
- 对 React Native App，HTML DOM 和浏览器事件不能直接复制；但 SVG path、坐标、菜系映射、状态机枚举、字段定义、文案和计算逻辑必须尽量保持一致。
- 如果后续真实开发选择与主原型不同的技术实现，必须先回写本文件和验收文档，再进入代码实现。

## 主原型同步修订（2026-05-27 菜系/场景选择器）

> 背景：分析结果页菜系和场景字段原为自由文本输入，无法枚举管控，数据无法聚合用于菜系地图统计。本次改为底部面板枚举选择器。

### 菜系修改交互

**【业务规格】** ← 工程实现依据，平台无关

- 用户点击餐食组成行"菜系"旁编辑 icon，弹出底部分组选择面板。
- 选项来源：`CUISINE_OPTIONS`（5 组 35+ 项，权威定义在 `src/constants/provinces.ts`）：
  - 常见：家常菜 / 粤菜 / 川菜 / 鲁菜 / 苏菜 / 沪菜 / 浙菜 / 湘菜 / 徽菜 / 闽菜
  - 北方：京菜 / 津菜 / 晋菜 / 冀菜 / 豫菜 / 东北菜
  - 西部：陕菜 / 渝菜 / 黔菜 / 滇菜 / 西北菜 / 新疆菜 / 藏菜 / 青海菜 / 清真菜 / 蒙古菜
  - 其他地区：桂菜 / 琼菜 / 鄂菜 / 赣菜 / 台湾菜
  - 境外 / 其他：日料 / 韩餐 / 西餐 / 快餐 / 轻食
- 选中后 `province` 按 `CUISINE_TO_PROVINCE` 自动回填，无需用户手动修改；家常菜/轻食 → `全国`，日料/韩餐/西餐/快餐 → `境外`。
- 修改写入 `meal_corrections`（field=`cuisine`，ai_value，user_value，corrected_at）；province 连带变化时同时写一条 field=`province` 的记录。
- 不使用自由文本输入框；当前值在面板中高亮显示。

**【原型参考】** ← 仅供理解交互意图，不得照搬

- 原型用 `showSelectorSheet(title, groups, currentValue, onSelect)` 渲染底部面板（原型专用函数）。
- 分组 chip 样式：`padding:8px 14px; border-radius:100px`，当前值橙色高亮（原型 CSS，不可复制）。
- App 对应：`BottomSheet` 组件 + 分组 `FlatList` + chip 样式 `TouchableOpacity`；选项常量直接复用 `src/constants/provinces.ts`。

---

### 场景修改交互

**【业务规格】** ← 工程实现依据，平台无关

- 用户点击餐食组成行"场景"旁编辑 icon，弹出底部平铺选择面板。
- 选项（固定 8 项）：外卖 / 堂食 / 自己做 / 食堂 / 路边摊 / 便利店 / 快餐店 / 其他。
- 修改写入 `meal_corrections`（field=`scene`，ai_value，user_value，corrected_at）。
- 不使用自由文本输入框；当前值在面板中高亮显示。
- **Phase 5 前约束**：scene 字段只用于记录和菜系地图统计，**不影响 AI Prompt**（见 `docs/BACKLOG.md` BACKLOG-001）。

**【原型参考】** ← 仅供理解交互意图，不得照搬

- 原型用同一 `showSelectorSheet` 函数，传入平铺字符串数组渲染全宽列表（原型专用）。
- 列表按钮样式：`padding:15px 0`，全宽（原型 CSS，不可复制）。
- App 对应：`BottomSheet` + 全宽 `TouchableOpacity` 列表；选项数组直接内联。

---

### 底部面板通用交互规则

**【业务规格】** ← 工程实现依据，平台无关

- 点击遮罩或关闭按钮：收起面板，不改变当前值。
- 面板高度自适应内容，超出部分可滚动；最高不超过屏幕 70%。
- 选中即关闭，无需额外确认按钮。

**【原型参考】** ← 仅供理解交互意图，不得照搬

- 原型用 `window.__selectorPick` 作为全局回调桥接选中事件（原型专用，浏览器 JS 机制）。
- App 对应：改为组件 prop `onSelect: (value: string) => void` 回调，无需全局变量。

## 主原型同步修订（2026-06-04 首页状态机重构）

> 本节优先级高于 2026-05-18 节中关于首页状态机的所有描述。

### 首页状态机（4 态，权威规格）

**【业务规格】** ← 工程实现依据，平台无关

首页由 `getHomeScene()` 决定渲染内容，共 4 个互斥/叠加状态，优先级从高到低：

| 状态 | 触发条件 | 时间窗口 |
|---|---|---|
| `DONE` | 反馈刚提交 | `justCompletedAt` 起 30 分钟内 |
| `PENDING_FB` | 今日有无反馈餐 & 距记录 < 30min | < 30min |
| `DEFAULT` | 其余所有情况 | 永久 |
| `OVERDUE`（叠加） | 今日有无反馈餐 & ≥ 30min | 当日持续，叠加在 DEFAULT 下方 |

**DONE 态（已反馈，30 分钟窗口）**

- 内容：图片/占位 + 菜名 + 菜系 + 心情标签（图片右上角 overlay）+ 身体反应预测
- 身体反应预测数据必须与反馈页「本餐反应预测」完全同源，A/B/C 三档降级逻辑一致：
  - A 档（拼图未解锁）：通用建议 + "再记 N 餐解锁身体拼图"
  - B 档（拼图已解锁，血糖未解锁）：基于历史 reaction 洞察的方向性预测；无 mature reaction 时退回通用建议 + "继续积累反应类记录，预测会越来越精准"
  - C 档（Phase 4 血糖精确预测）：当前 stub，不显示
- 禁止：不得直接展示 `analysis.advice` 原始字段，该字段不等于身体反应预测
- 过期：`justCompletedAt` 起满 30 分钟后，状态机自动清除 `justCompletedMealId` 并回到 DEFAULT
- 次级操作行（卡片下方）：「+ 记录新一餐」描边按钮 + 「还没想好吃什么」文字链

**PENDING_FB 态（待反馈，< 30min）**

- 内容：图片/占位 + 菜名 + 菜系 + 「记录感受 →」主按钮
- 仅显示上述内容，不展示身体预测、建议、营养详情
- 次级操作行（卡片下方）：「+ 记录新一餐」描边按钮 + 「还没想好吃什么」文字链

**OVERDUE 叠加提示（≥ 30min 无反馈）**

- 叠加在 DEFAULT 主卡下方，不替代主卡
- **单条**：菜系 emoji 或圆形缩略图 + 菜名 + 「未反馈」橙色胶囊按钮；点击「未反馈」直接进该餐反馈页，不经「我的记录」
- **多条**：默认收起显示「X 餐未反馈 ▾」，点击展开每条行，每条独立显示缩略图 + 菜名 + 「未反馈」按钮
- 缩略图规则：有图 → 圆形裁剪（36pt）；无图 → 直接显示菜系 emoji，**不加盒子背景**
- App 实现：`overdueExpanded` 对应 Zustand `useHomeStore.overdueExpanded: boolean`，toggle 触发 `setOverdueExpanded()`；「未反馈」按钮调用 `openFeedbackForMeal(mealId)` 或等效 navigation action

**DEFAULT 态（默认）**

- 大点击区「记录这一餐」（主操作）
- **全宽描边圆角按钮「还没想好吃什么 →」**（次操作，`border:1.5px solid`，圆角 100px，浅色背景区分卡片）
- **首页默认卡不得出现「补录」按钮**
- 每餐独立，无"新餐补录"入口，无"合并餐次"逻辑

**无图占位规则**

- 必须渲染带菜系 emoji 的浅橙色背景区域，高度与有图时一致（约 180–200pt）
- 菜系 emoji 映射：川菜🌶️ / 粤菜🐟 / 鲁菜🥩 / 沪菜/本帮菜🦀 / 京菜🥟 / 快餐🍔 / 家常菜🥘 / 其他🍽️
- 禁止：不得渲染纯文字头部替代图片区

**生命周期标志位管理（Bug 防御）**

- `_backfillMealId`（对应 App 端的补录 mealId ref）：必须在 `renderHome()` 入口和 `startDirectMealRecord()` 入口清空，防止新餐反馈误覆盖历史记录
- `justCompletedMealId` / `justCompletedAt`：仅在反馈提交成功时设置，在 DONE 态过期后清空，导航离开不清空（用户回到首页时按时间窗口自然过期）

**废弃的 UI 入口（不得在 App 中实现）**

- ~~首页「补录」按钮~~（旧：跳过分析直接打反馈）
- ~~PENDING_FB 卡「我吃完了」按钮~~（现改为「记录感受 →」）
- ~~PENDING_FB 卡「刚刚又吃/喝了别的 →」按钮~~（现改为 DEFAULT 态的「+ 记录新一餐」独立入口）

**受影响任务修订**

- **T2-07 进食计时与自动关闭**：验收新增 DONE 态 30 分钟窗口；`justCompletedAt` 需随 `justCompletedMealId` 一同写入。
- **T2-08 加餐独立记录**：「刚刚又吃/喝了别的」入口已从 PENDING_FB 卡移除；加餐入口改为：用户返回首页 → PENDING_FB/DEFAULT 次级操作行「+ 记录新一餐」→ 正常记录流程，`meal_type` 选"加餐"。
- **T5-04 首页状态机**：状态枚举从 3 态升级为 4 态（DEFAULT / PENDING_FB / DONE / OVERDUE），Zustand Store `useHomeScene()` 需增加 `justCompletedAt: number | null` 字段。

**【原型参考】** ← 仅供理解交互意图，不得照搬

- 原型用 `justCompletedMealId` + `justCompletedAt` 全局变量控制 DONE 态生命周期（原型浏览器 JS 机制）。
- `getMealReactionText(meal)` 提取 A/B/C 降级文本，`renderHomeDone()` 消费；App 对应：在 `useHomeScene()` 里调用同逻辑的 `getMealReactionText(meal, insights)` 纯函数。
- 调试时间条（`debugTimeOffsetMs`）为原型专用，不进 App。
- App 对应组件：`HomeDefaultCard` / `HomePendingCard` / `HomeDoneCard` / `HomeOverdueHint`，均接受 `meal: Meal | null` 和 `scene: HomeScene` 作为 props；次级操作行抽为 `HomeSecondaryActions` 组件复用。

## 主原型同步修订（2026-06-04 三状态页面重构）

> 本节优先级高于上文「分析结果页」「历史记录与反馈口径」中与本节冲突的描述。核心原则：**餐次的三个页面是同一份数据的三个视角，不得各自造字段**。

### 三状态分工（权威）

| 状态 | 页面 | 用户意图 | 内容 |
|---|---|---|---|
| 饭前 | 分析页 | 我该怎么吃 | 建议 + 营养预估（预测视角） |
| 饭后 | 总结页 | 我吃了多少 + 身体反应 | 实际摄入 + 反应预测（结算视角） |
| 回看 | 记录页 | 吃了什么 + 反馈 + 分析 | 基础信息 + 实际摄入 + 反应预测（归档视角，复用饭后总结，不新增字段） |

### 饭前·分析页

- 渲染顺序固定为：图片 → 餐食名称 → 副标题（结构点评）→ 餐食组成 → 建议 → 营养概览。
- 建议卡为三个固定锚点，各管一件事、互不重复、不机械拼接截断：`eatingAdvice.howMuch`（吃多少）/ `howToEat`（怎么吃·顺序，≤2 步）/ `reduceOrAvoid`（少碰，单独一行）。
- 餐食组成在单食物且 `recognizedFoods[0].name === 标题` 时不重复印菜名，主行直接显示「类别 · 份量」。
- **分析页不渲染**：`detail`（结构观察三条）、`expectedReaction`（可能饭后反应）。反应只在饭后总结/记录页出现。
- `advice` 字段废弃为 `eatingAdvice` 缺失时的兜底文本，不再作为独立卡片渲染。

### 饭后·总结页

- 删除「这一餐记完了 ✓」标题；主标题 = 菜名，副标题 = `场景 · 餐次 · 时间`。
- 实际摄入必须包含四项：蛋白 / 碳水 / 脂肪 / **纤维**；数值 = 营养预估中值 × 实际摄入比例（`actualIntakeAnalysis.intakeRatio` 优先，否则 `fb.actualIntakeValue` / `actualIntake` 映射比例）。拍照补图时用 AI 图比例，未拍照按「吃了多少」选项比例计算。
- 本餐反应预测沿用 A/B/C 三档降级（`renderMealReactionPrediction` / `getMealReactionText`），与首页 DONE 态同源。

### 回看·记录页（单卡 + 分界线）

- 整页为**一张卡**，内部用 1px 浅色分界线分区，不得拆成多个独立背景卡片。
- 分区顺序：① 基础信息（图片 + 菜名 + 风险 + `场景·餐次·时间` + 饭后感受 + 实际吃了多少）② 实际摄入（含纤维，复用饭后总结内容）③ 本餐反应预测（复用饭后总结）④ 当时的饭前建议（折叠，复用建议卡）。
- 饭后感受作为副标题下的一行直接显示，**只显示值 + emoji、不显示字段名**：饱腹 / 身体 / 满意度（`😮‍💨 撑 · 🥵 困倦 · 😞 后悔`）。
- 记录页**不再显示**饭前的「三条洞察」（与实际摄入重复）；不再有独立 `advice` 橙卡。
- 反馈字段**移除「价格」**，记录页与反馈展示均不再出现价格项。

### App 复用边界

- 可复用：三状态分工、各页字段映射与渲染顺序、实际摄入 = 预估 × 比例的换算、单卡分界线信息架构、`summaryNutritionInner` 内容/外壳拆分思路。
- 不可直接复制：HTML `<details>` 折叠、内联样式、DOM 拼接。App 用 `View`+`Text`，折叠用受控状态或 `Accordion` 组件。

## Sprint 1: 用户体系与数据层

| 任务 | 产出 | 关键逻辑 | 验收 |
|---|---|---|---|
| T1-01 执行 Supabase Migration 001 | `supabase/migrations/001_core_tables.sql` 执行成功 | 创建 1.0 核心表并启用完整 RLS | Supabase Dashboard 中存在所有 1.0 表，完整 RLS 策略已启用 |
| T1-02 Supabase Auth 集成 | `api/supabase.ts`、登录/注册界面、`app/onboarding/index.tsx` | 手机号 OTP 注册/登录，验证码发送后自动建号，token 持久化 | 能注册新账户，登录后跳转主界面 |
| T1-03 用户建档流程 | `app/onboarding/basic-info.tsx`、`goals.tsx` | 写入 `profiles` 表并同步本地 SQLite；字段：goal / avoid / daily_budget（整数，元/天）/ feeling / eatingStyle（后台静默，不在档案页展示）；Q3 选项映射整数中点值（60元以内→50 / 60\~120元→90 / 120\~200元→160 / 200元以上→250）；Q3 完成后同时写入 `meal_budget_weights` 初始默认权重（早20% / 午35% / 晚40% / 加餐5%）；不收集 age/gender/height/weight（档案页按需填写） | 首次登录后进入建档流程；完成后 `profiles` 表有 goal / avoid / daily_budget / feeling / eatingStyle；`meal_budget_weights` 有初始4行；Q3选项正确映射为整数 |
| T1-04 本地 SQLite 初始化 | `db/schema.ts`、`db/migrations/001.ts` | App 启动自动创建 SQLite，表结构与 Supabase 一致 | App 启动时 SQLite 数据库自动创建 |
| T1-05 营养向量库初始化 | `supabase/migrations/000_pgvector_nutrition.sql`、`nutrition_seed/cn_nutrition_db.csv`、`services/ai/nutrition/embedder.py` | 建 nutrition_items + pgvector 索引；导入 >=1000 条数据；OpenAI `text-embedding-3-small` 批量生成向量 | nutrition_items >=1000 条；embedding 非空；红烧肉精确查询有结果；东坡肉向量搜索命中红烧肉且 score >= 0.8 |

## Sprint 2: 餐次记录与 AI 分析

| 任务 | 产出 | 关键逻辑 | 验收 |
|---|---|---|---|
| T2-01 FastAPI 项目初始化 | `services/ai/`、`requirements.txt`、`main.py` | 依赖 fastapi、uvicorn、anthropic、python-dotenv、pydantic | `uvicorn main:app --reload` 在本地 8000 端口启动 |
| T2-02 Claude API 餐次分析接口 | `routers/analyze.py`、`nutrition/search.py`、`nutrition/embedder.py`、`POST /v1/meal/analyze`、`GET /v1/nutrition/search` | Vision 识别 -> 营养库精准化 -> 个性化建议；总超时 25 秒；失败降级不影响整体返回；`/v1/nutrition/search` 支持本地原型跨源调用和 `limit` 参数 | curl 返回 `nutrition_source`；红烧肉命中向量库；生僻菜 fallback；营养搜索返回 top5；主原型从 FastAPI 获取真实候选并能显示命中/未命中/接口不可用状态 |
| T2-03 移动端相机模块 | 拍照入口组件（记录入口处），集成 `expo-image-picker`（已安装，无新增依赖） | ActionSheet 弹出"拍照 / 从相册选择 / 取消"，直接调用系统相机或相册，无自定义相机预览页；提示文案"正上方俯拍食物，识别更精准"放在 ActionSheet 副标题；不使用 `expo-camera` | ActionSheet 弹出正确；选"拍照"调用系统相机（`launchCameraAsync`）；选"从相册选择"打开系统相册（`launchImageLibraryAsync`）；取消后回到上级页面；图片选定后进入分析流程 |
| T2-04 图片压缩与上传 | `utils/imageCompress.ts` | 压缩到 480px 最长边，JPEG 0.65，上传 Supabase Storage；写入 `meal_images`，image_type 为 wide/close/leftover | 压缩后 <100KB；`meal_images` 有记录且 image_type 正确 |
| T2-05 分析结果展示界面 | `camera.tsx` 分析结果区 | 按五块结构显示餐次选择、图片、分析结果+建议、营养概览、打卡提示和按钮；”分析结果+建议”合并菜名、结构点评、建议和餐食组成；菜系/地区/场景/食物数量只在餐食组成表达；根据 `nutrition_source` 显示营养来源；根据 `adviceStage` / `advice_stage` 显示轻量建议来源标签；食物组成展示单项营养库匹配状态；营养明细展示匹配项、置信度、每100g来源和按份量换算结果；支持修改并写 `meal_corrections`；当 `recognizedFoods` 中任一食物 `confidence === 'low'` 时，在”好的，去吃了”按钮上方显示黄色俯拍提示：”部分食物识别置信度较低，下次试试正上方俯拍，效果会更准。” | 分析结果显示正确；不出现顶部重复营养摘要和独立进食建议卡；饭前不展示可能饭后反应；单食物/多食物标题正确；菜系/省份存在；营养来源标签正确；建议来源标签正确降级；真实营养库接口可用时原型和 App 均能展示命中状态；接口不可用时明确降级为 AI估算；修改后 corrections 有记录；有 low confidence 食物时黄色提示条可见，全为 medium/high 时不显示 |
| T2-06 餐次保存到数据库 | `db/meals.ts`、`insertMeal()`、`insertMealAnalysis()` | 先写 SQLite，后台写 Supabase，失败加入重试队列 | `meals` 和 `meal_analysis` 均有记录 |
| T2-07 进食计时与自动关闭 | `camera.tsx` 计时逻辑 | 确认分析后写 `meal_started_at` 并创建待反馈餐次；反馈时写 `meal_duration_ms`；30 分钟未反馈写 `auto_closed_at`，首页主卡恢复默认并显示今日未反馈提示 | `meal_started_at` 有值；30 分钟内首页显示待反馈主卡；超 30 分钟首页显示默认卡 + 今日未反馈提示 |
| T2-08 加餐独立记录 | 待反馈主卡“刚刚又吃/喝了别的？”入口、反馈页后续记录入口 | 不再写 `meals.additionals`；再次吃/喝/点餐统一创建新的 `加餐` 餐次，拥有独立图片、分析、餐次、反馈状态 | 新加餐独立写入 meals；上一餐未反馈状态保留；详情页不显示同餐合并块 |
| T2-09 就餐心情记录 | 保存餐次前情绪快选 | 心情不错/平静/压力有点大/有点焦虑/疲惫；可跳过 | 选择后 `meals.mood` 有值；跳过为 null 且不影响保存 |

## Sprint 3: 反馈与通知

| 任务 | 产出 | 关键逻辑 | 验收 |
|---|---|---|---|
| T3-01 饭后即时反馈界面 | `app/feedback.tsx` | 4 个固定题 + 最多 1 个个性化追问（可跳过）；固定题：实际吃掉多少（单选 3 档）、饱腹状态（单选 3 档）、身体感受（**多选**：舒服/胀气/困倦）、情绪满意度（单选 3 档：还不错/一般/有点后悔）；个性化追问触发规则见本文件「主原型同步修订（2026-05-24）」节；写 `meal_feedback` | 4 个固定题全选完才能提交；个性化追问可跳过；数据写入正确 |
| T3-04 本地通知（即时反馈提醒） | `utils/notifications.ts`、`schedulePostMealReminder()` | 餐次保存后固定 **20 分钟**延迟推送；推送时间系统固定，不提供用户配置项（不使用 `profile.reminder_delay_min`，该字段已废弃） | Android 真机收到通知，点击跳转 feedback |

## Sprint 4: 历史记录与个人档案

| 任务 | 产出 | 关键逻辑 | 验收 |
|---|---|---|---|
| T4-01 饮食日历视图 | `app/history.tsx`、日历视图组件、`screens/WeeklyHistoryScreen.tsx` | 历史页第一个 Tab 为”饮食日历”；顶部为**饮食记录沉淀 + 我的一周合并卡**（详见本文件「主原型同步修订 2026-05-22」节）；其余：当月饮食餐次/记录天数；年月选择器只选年份和该年份下月份；日期由正式月历点选；右上餐次 Tab 展开早饭/午饭/晚饭/加餐/重置；日期格按已反馈状态显示色块，无记录灰色弱态，待反馈由下方列表卡片表达 | 能看到当月记录；切换年月后月份联动；餐次筛选后月历和当日列表同步；点击日期展开当天餐次列表；当日标题按 `Y 餐记录` 或 `X / Y 餐记录` 展示；**周日晚7点至周一0点期间合并卡下半显示「我的一周」子卡；点击整卡进入历史周汇总页，按ISO周分组、每周显示舒服率/餐次/主要口味** |
| T4-01b 菜系地图 | 历史页第二个 Tab“菜系地图” | 按 `meal.province` 聚合；优先复用 ECharts 4.0.2 中国 GeoJSON 资产、UTF8 解码、投影、省级 path、中心点和省份名称；Tab 内不渲染“美食版图”和“已解锁 X / 34 个省份菜系”标题区；统计块在地图上方；已解锁省份用色块 + 中心 icon；点击已解锁菜系在同一容器切换时间轴，支持年份/月/餐次筛选和 X/Y 计数 | 记录 2 个不同省份菜系后地图高亮；点击省份/path/icon 或菜系列表进入同容器时间轴；筛选和计数语义正确；地图资产来源、license、App 复用方式和降级边界已记录 |
| T4-02 餐次详情页 | `app/meal-detail.tsx` | 显示餐前图、营养、反馈、回访；未反馈可补录 | 所有已记录字段正确显示，无 null 崩溃 |
| T4-03 历史筛选 | 饮食日历餐次 Tab、菜系时间轴筛选 | 饮食日历筛选入口在年月标题右侧，默认全部，展开早饭/午饭/晚饭/加餐/重置；菜系时间轴用全部时间/全部餐次两个一级 Tab，展开项不重复“全部”选项；有反馈显示状态，无反馈显示补录反馈动作 | 筛选后列表和日历同步更新；计数使用 X/Y 语义；历史页不出现“未打分” |
| T4-04 体重记录 | `components/WeightLogger.tsx` | 追加 `weight_logs`；显示趋势；超过 7 天未录入提醒 | `weight_logs` 有时序数据，趋势计算正确 |
| T4-05 个人档案页 | `app/profile.tsx` | **3 块结构**：① 干饭目标（goal flex 垂直列，可编辑）；② 身体拼图（4 块独立解锁，同 T5-06）；③ 干饭档案（由 `deriveInsights` 驱动，三字段：偏好餐次/干饭风格/忌口偏好，均实现 cold→forming→mature 三档渐进，详见「主原型同步修订 2026-05-26」节）；顶部副标题格式 `N 餐记录`（不含阶段名）；移除"记录餐次"独立展示字段；档案页打开时即时重算 deriveInsights，毫秒级响应 | 3 块结构完整显示；顶部副标题只含餐次数；干饭目标为 flex 垂直列；偏好餐次/干饭风格按 cold/forming/mature 三档显示对应文案和 badge；移除"记录餐次"字段；档案字段（goal/avoid/daily_budget）可编辑，修改后 `profiles` 更新 |
| T4-06 数据管理功能 | `confirmClearAllData()`、`confirmDeleteAccount()` | 二次确认，清空本地 SQLite + Supabase 对应数据，注销 auth session | 清空后 `meals` 为空，注销后 session 失效 |

## Sprint 5: 饭前抽卡与首页逻辑

> Sprint 5 标题已由"推荐卡与首页逻辑"更新为"饭前抽卡与首页逻辑"，对齐主原型 2026-05-21 修订。任务编号不变。

| 任务 | 产出 | 关键逻辑 | 验收 |
|---|---|---|---|
| T5-01 饭前抽卡规则引擎 | `services/ai/algorithms/draw_card.py`：`build_card_pool_for_state(user_id, state)` + `get_recommendation_stage(feedback_count)` | 从 `meal_feedback` 取有效反馈（comfort 非空）；按六种状态规则过滤+评分排序+菜名去重；返回 stable/alt/explore 候选；general 阶段无历史时 fallback 菜品表；规则细节见蓝图《饭前抽卡功能规范》 | 单元测试覆盖 6 种状态 × 3 种阶段；general 阶段 0 历史数据不报错；feedback_count 阈值 3/7 正确返回对应阶段 |
| T5-02 饭前抽卡接口 | `POST /v1/insight/generate`（trigger=`draw_card`），响应含三张 `DrawCard`（slot: stable/alt/explore） | 调 `build_card_pool_for_state` 选菜 → 调 Claude 生成 reason/advice（按阶段文案风格）→ 返回含 `slot`/`slot_label`/`recommendation_stage` 的卡片；**Claude 只写文字，不选菜** | 返回 stable/alt/explore 三槽位；general 阶段 reason 不引用个人历史；body_puzzle 阶段 reason 引用身体感受计数；无相同菜品重复 |
| T5-03 饭前抽卡屏 | `screens/DrawCardScreen.tsx` | 状态选择（6 种状态 + 三阶段进度 badge）→ 三张暗牌（常规/特别/隐藏款 Pop Mart 风格）→ 翻牌动画 → Sheet（你抽到了 + 槽位名 + reason + advice）→ 选这个进拍照；card_actions 写入：dish/badge/risk/slot/slot_label/card_state/recommendation_stage/source/action | 三张暗牌颜色和稀有度标识正确（橙/金/紫）；翻牌后显示"你抽到了 常规款/特别款/隐藏款"；选择后 `card_actions` 含 slot/slot_label/card_state/recommendation_stage；进入拍照后 `meals.from_card` 含扩展字段 |
| T5-04 首页状态机 | `stores/useMealStore.ts getHomeScene()` | DEFAULT/PENDING_FEEDBACK/OVERDUE_FEEDBACK_HINT；已反馈后回默认，不保留收据主卡 | 首页三态切换正确，无状态错乱 |
| T5-05 首批洞察生成 | `POST /v1/insight/generate trigger='weekly_first'` | 统计 comfort/energy 负向信号，关联 cuisine/tags，生成 <=3 条洞察 | 有 7 天数据的测试账号首页出现洞察卡片 |
| T5-06 身体拼图 | `components/BodyPuzzle.tsx`、`components/BodyInsight.tsx`、`screens/TimelineScreen.tsx` | 无整体门槛，4 块按各自条件独立解锁；块0解锁：comfort=舒服 OR satisfaction=还不错；块1展示：deriveInsights Phase 1 四个 detector 的 forming/mature 规律（StructureReaction/TimingReaction/MealTypeStructure/PositivePattern）；块3改为月度舒服率柱状图（舒服率=comfort=舒服 OR satisfaction=还不错）；拼图下方显示「你的身体说」（基于 typeFields 结构对比，困倦率=comfort∋困倦/胀气，舒服率=comfort=舒服 OR satisfaction=还不错）；Header 右上角 ⏱ 按钮（有60天+历史时出现）→ 全屏「成长时间轴」 | 各块按自身条件独立显示；块1展示 deriveInsights 返回的 forming/mature insight，不展示 sparse；「你的身体说」文案基于结构类型（高油/清淡等）不使用菜系名；成长时间轴节点按 ts 排序正确；美食地图跳转正确；无 null 崩溃 |

## Sprint 6: 稳定性与上线准备

| 任务 | 产出 | 关键逻辑 | 验收 |
|---|---|---|---|
| T6-01 离线同步机制 | `db/sync.ts syncToSupabase()` | 网络恢复批量上传 pending 队列，冲突服务端覆盖 | 断网记录 3 餐，联网后 Supabase 有完整数据 |
| T6-02 网络状态检测 | 离线横幅、恢复 toast | 断网显示顶部红色横幅，联网自动消失 | 关闭 WiFi 出现横幅，开启 WiFi 横幅消失 |
| T6-03 AI 分析失败处理 | 重试界面 | 重试/换图/用模拟结果继续 | 关闭 AI 服务后出现错误界面，三个选项可用 |
| T6-04 性能优化 | FlatList 虚拟化、图片懒加载、数据库查询加索引 | 历史列表性能优化 | 100 条历史记录滚动流畅，首屏 <2 秒 |
| T6-05 Sentry 错误监控 | Sentry 初始化、关键 catch 上报 | 手动测试错误可上报 | Sentry Dashboard 有记录 |
| T6-06 EAS Build 配置 | `eas.json` development/preview/production | EAS preview 构建 | `eas build --profile preview` 成功，APK 可真机安装 |
| T6-07 内测分发 | EAS Submit 或手动分发 APK | 5 台测试设备安装运行 | 无崩溃 |

## 主原型同步修订（2026-05-22）

本节记录 `docs/prototype/meal-agent-product-prototype.html` 在 2026-05-22 完成的身体拼图相关改动，Phase 1 T5-06 工程实现必须对照本节。

### 身体拼图显示逻辑

- **取消整体门槛**：不再需要 `meals_count >= 7` 才显示拼图区域；4 块各自按条件独立解锁，未解锁块以灰色锁定态显示。
- 蓝图常量 `BODY_PUZZLE.show_section` 设为 `0`（无门槛）。

### 4 块解锁条件与内容（最终口径，2026-05-29 修订）

| 块 | 名称 | 解锁条件 | 内容 |
|---|---|---|---|
| 0 | 喜欢吃这个 | 正向反馈（`comfort=舒服` 或 `有精神`）≥ **3 餐** | 反馈好评最多的菜品/标签 + 历史好评榜；未解锁显示「再打 N 次好评，这块拼图就出来了」 |
| 1 | 我的吃法 | 总反馈 ≥ **7**，且正向 ≥ 1、负向（困倦/胀/不舒服/难受）≥ 1 | 近期吃法规律；好评率最高标签；"这是你的专属吃法，不是通用建议"；未解锁按缺失条件显示对应文案 |
| 2 | 口味探索 | 有反馈的 distinct `cuisine` ≥ **3**（排除家常菜/全国） | 已探索的各菜系记录及好评次数；「看我的美食地图 →」跳转历史页地图 Tab；未解锁显示「再探索 N 种新菜系解锁」 |
| 3 | 越来越舒服 | 总反馈 ≥ **14**，且后 7 餐正向比例 ≥ 前 7 餐正向比例 + **10%** | 月度舒服率柱状图；语义为产品价值证明——接受建议后趋势变好；正向餐信号 Phase 1 含抽卡接受，Phase 2 起扩展 |

### 你的身体说

- 位置：4 块拼图下方，始终显示（有洞察文案时）。
- **数据来源**：`analysis.typeFields`（AI 识别时生成并存入每条餐食记录），字段为 `oil`、`staple`、`protein`、`vegetable`。
- **算法**：从 `typeFields` 推断结构类别（`高油` / `高碳` / `清淡` / `均衡`），与 `meal_feedback.comfort` 关联，统计各类别困倦率和舒服率，找出差距最大的两类结构。
  - 困倦率：`comfort=困倦 OR comfort=胀气` 的餐次比例
  - 舒服率：`comfort=舒服 OR satisfaction=还不错` 的餐次比例
- **精准度按数据量递进**（工程实现须支持这三级输出）：

  | 数据量 | 对应阶段 | 输出内容 |
  |--------|---------|---------|
  | n < 5 | 1.0 积累期 | 「已有 N 餐，继续记录，结构规律会越来越清晰」 |
  | n ≥ 8 | 3.0 初步关联 | 「初步规律：高油餐后困倦概率明显高于清淡餐（X% vs Y%）」 |
  | n ≥ 15 | 4.0–5.0 完整因果 | 「你吃高油食物（如麻辣烫、炸鸡汉堡）后困倦/不舒服概率 X%；清淡食物后是 Y%。差距不是口味偏好——是身体对油脂和碳水负担的真实反应。」 |

- **不得**使用菜系名称（京菜/川菜等）作为对比维度，必须基于 `typeFields` 推断的结构类别。

### 成长时间轴（⏱）

- 触发条件：有早于 60 天前的历史餐次数据时，拼图 Header 右上角出现 ⏱ 按钮。
- 点击后：全屏页从右侧滑入，标题「成长时间轴」，副标题「N 餐 · N 个月」。
- 时间轴节点（按 `meals.ts` 升序排列）：
  - 🎬 开始记录（第一餐时间 + 菜名）
  - 🗺️ 解锁「口味探索」（探索了 N 种菜系）
  - 🥢 解锁「我的吃法」（积累了 7 餐对比记录）
  - 😋 解锁「喜欢吃这个」（3 次好评 · 发现好吃的：XXX）
  - ✨ 解锁「越来越舒服」（14 餐趋势达成 · 舒服率 X% → Y%）
  - 📍 今天（已拼上 N/4 · N 餐记录 · N 个月旅程）
- 页面底部：月度舒服率柱状图（颜色编码：0% 红 → 50-70% 橙 → 80%+ 绿）。
- 工程产出：`screens/TimelineScreen.tsx`，入口按钮写在 `components/BodyPuzzle.tsx` Header 内。

### 饮食日历「饮食记录沉淀 + 我的一周」

> ⚠️ 本节已于 2026-05-23 更新，以主原型最新确认口径为准，见下方「主原型同步修订（2026-05-23 我的一周）」节。

- **合并为一张卡片**，上半部分为饮食记录沉淀，下半部分为「我的一周」周报卡（`meals.length >= 3` 时显示）。
- 整卡右上角可点击 → 全屏「我的一周 · 历史」页。
- **我的一周卡片 5 字段**（详见 2026-05-23 同步修订节）：口味 chips、感受最好 chips、粗估热量、蛋白质、建议文字。
- **历史页每条与卡片完全一致**，使用相同的 5 字段组件，仅左上角替换为日期范围标签。
- 时间窗口：卡片和历史首条均使用「近 7 天有效记录，兜底最近 7 条」，历史过去周使用自然周（周一~周日）分组，且排除已被首条覆盖的记录。
- 顶部说明：「每周总结在周日晚 7 点生成，周一 0 点后仅在这里查看历史」。
- 工程产出：`src/utils/weeklyReport.ts`（计算逻辑）、`src/components/WeeklyReportCard.tsx`（统一卡片组件）、`src/screens/WeeklyHistoryScreen.tsx`、`app/weekly-history.tsx`（路由）。

### 主原型同步修订（2026-05-23 我的一周）

本节记录 `docs/prototype/meal-agent-product-prototype.html` 于 2026-05-23 确认的「我的一周」卡片与历史页口径，T4-01 工程实现必须对照本节。

#### 卡片 5 字段（口径最终确认）

| 字段 | 内容 | 原型对应 |
|---|---|---|
| 口味 | 近期餐次 cuisine 频次前 2，amber chip；无数据时显示"待观察"chip | `topFlavors.slice(0,2)` |
| 感受最好 | comfort 为 comfortable 的次数，green chip；无数据时显示"待观察"chip | `goodFeelings` |
| 粗估热量 | `analysis.nutritionEstimate.calories.range` 中第一个数字的均值，缺失显示"待确认" | `avgCal` |
| 蛋白质 | `analysis.nutritionEstimate.protein.range` 中第一个数字的均值，缺失显示"待确认" | `avgProtein` |
| 建议文字 | 基于 comfort/fullness 规则推断（见下方逐字稿） | `suggestion` |

**建议文字逐字稿（与原型完全一致，含 emoji）：**

| 条件 | 文案 |
|---|---|
| `feedback.comfort === 'sleepy'` 次数 ≥ 本周餐数 / 2 | `😴 这周午餐后困倦明显，建议减少高碳水组合，增加蛋白质。` |
| `feedback.fullness` 为 `'overfull'` 或 `'too_full'` 的次数 ≥ 2 | `🍽️ 发现容易吃撑的模式，可以提前设定饭量提醒。` |
| 其余情况 | `✨ 保持现在的饮食节奏，身体反馈很稳定！` |

**营养数值解析规则（`firstNumber` 逻辑）：**

`calories.range` / `protein.range` 字段值为形如 `"500-700 kcal"` 或 `"30-40 g"` 的字符串。取**第一个**数字（正则 `/\d+(?:\.\d+)?/` 匹配），而非区间中点。
例：`"500-700 kcal"` → `500`，`"30-40 g"` → `30`。
各餐取到的数字累加后除以有值的餐数，即为显示均值，结果 `Math.round` 取整。

#### 字段映射（prototype → React Native）

| 原型 | RN Meal 字段 |
|---|---|
| `m.ts` | `new Date(m.createdAt).getTime()` |
| `m.cuisine` | `m.cuisine \|\| m.analysis?.cuisine \|\| '其他'` |
| `m.fb?.comfort === '舒服'` | `m.feedback?.comfort === 'comfortable'` |
| `m.fb?.comfort === '困倦'` | `m.feedback?.comfort === 'sleepy'` |
| `m.fb?.comfort === '胀气'` | `m.feedback?.comfort === 'bloated'` |
| `m.fb?.satisfaction === '还不错'` | `m.feedback?.satisfaction === 'good'` |
| `m.fb?.satisfaction === '一般'` | `m.feedback?.satisfaction === 'neutral'` |
| `m.fb?.satisfaction === '有点后悔'` | `m.feedback?.satisfaction === 'regret'` |
| `m.fb?.fullness === '撑'` | `m.feedback?.fullness === 'overfull' \|\| 'too_full'` |
| `m.analysis?.nutritionEstimate` | 需在 `MealAnalysis` 新增可选 `nutritionEstimate?: { calories?: { range: string }, protein?: { range: string } }` |

#### 时间窗口算法

```
currentPeriodMeals:
  1. 过滤 createdAt 在 now-7天 内的记录 → 有则用
  2. 为空则兜底 allMeals.slice(-7)

历史周:
  - 排除 currentPeriodMeals 中已有的记录（Set 判断）
  - 同时排除 createdAt 为空的记录（无时间戳记录仅在当前期兜底中使用）
  - 剩余记录按自然周（周一 00:00 ~ 周日 23:59）分组
  - 倒序排列（最新在前），首条始终是 currentPeriod
```

#### 历史页每条 = 完整卡片

历史页不再使用"日期范围 + 餐次数 + 主要口味 + 舒服率%"三字段布局，改为与「我的一周」卡片完全相同的 5 字段卡片组件（`WeeklyReportCard`），左上角替换为日期范围字符串，不显示"📊 我的一周"标题行。

#### 不可直接复用说明

HTML 渐变背景 `linear-gradient`、`chip` 内联样式和 `position:fixed` Sheet 不能直接搬入 React Native；App 使用 `StyleSheet` + `LinearGradient`（或纯色背景降级）+ 原生组件实现相同视觉效果。

---

## 主原型同步修订（2026-05-23 拍照流程 ActionSheet 改版）

### 变更背景

原 T2-03 方案使用 `expo-camera` 渲染自定义相机预览页（黑色全屏 + 伪快门按钮），存在两个问题：

1. 自定义预览页与系统相机 UI 重复，增加原生依赖和权限维护成本。
2. 顶部"拍照 / 图片"Tab 让用户在看到相机前就要做选择，交互不直观。

### 新方案：ActionSheet + 系统相机/相册

**页面流转变更：**

```
旧：首页 → 伪相机页（expo-camera 全屏预览） → 选图/拍照 → 分析
新：首页 → ActionSheet 弹出 → 系统相机 or 系统相册 → 分析
```

**ActionSheet 内容规格：**

| 元素 | 内容 |
|---|---|
| 副标题（提示） | 正上方俯拍食物，识别更精准 |
| 主按钮 | 📷 拍照 → `ImagePicker.launchCameraAsync({ mediaTypes: 'images', quality: 0.85 })` |
| 次按钮 | 🖼️ 从相册选择 → `ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.85 })` |
| 取消 | 关闭 ActionSheet，返回触发来源页面 |

**权限声明（无新增原生依赖，expo-image-picker 已安装）：**

- `app.json` 需包含：`"NSCameraUsageDescription"` 和 `"NSPhotoLibraryUsageDescription"`（iOS）
- Android 通过 `expo-image-picker` 自动处理，无需手动 `AndroidManifest.xml` 修改

**不使用 `expo-camera`**：该模块从 T2-03 实现中移除，相关页面文件由 `app/camera.tsx` 调整为记录入口组件内 ActionSheet 逻辑（具体文件路径待 L2 任务确认）。

### 低置信度俯拍提示（T2-05 补充）

分析结果页新增条件提示：

```
触发条件：recognizedFoods.some(f => f.confidence === 'low')
位置：营养概览卡片下方、"好的，去吃了"按钮上方
样式：黄色背景提示条（#fff8e1 背景，#ffe082 边框）
文案：部分食物识别置信度较低，下次试试正上方俯拍，效果会更准。
```

**不触发时**（全为 medium/high confidence）：提示条不渲染，不占位。

### 原型复用边界

| 可复用 | 不可直接复用 |
|---|---|
| ActionSheet 三项结构（拍照/从相册/取消）| HTML `<button>` 内联样式 → 用 RN `TouchableOpacity` + `StyleSheet` |
| 低置信度判断逻辑 `f.confidence === 'low'` | HTML 黄色提示 `div` → 用 RN `View` + `Text` 实现 |
| 提示文案（中文逐字稿） | `onclick` 事件绑定 → 用 RN `onPress` |
| `launchCameraAsync` / `launchImageLibraryAsync` 调用方式 | 直接可复用（expo-image-picker API 一致） |

## 主原型同步修订（2026-05-24 饭后打分精简与个性化追问）

### 设计决策背景

本次对饭后打分字段做了系统性评审。核心原则：**履约率 > 单次精度**，数据连续性（每顿都愿意记）比单次精度（这顿记得特别准）更有价值。所有字段必须同时满足"用户有动机填"和"算法有增益用"，否则进入个性化触发或删除。

### 字段精简决定

**删除"困不困"独立题**
- 原因：与"身体即时感受"中的"困倦"选项完全重复，同一维度两次问法，数据冗余且增加用户负担。
- 处理：将"身体即时感受"改为**多选**，"困倦"作为其中一个选项保留采集能力。

**"腻不腻"降级为个性化追问**
- 原因：与"胀气"部分重叠；脂肪偏高的信号 AI 已知，单独追问算法增益低；对大多数用户无新认知。
- 处理：仅当本餐脂肪标注偏高时作为第 5 题出现，不进入固定流程。

**饭量：用户自填，不做餐前+餐后双分析**
- 原因：双分析成本翻倍；视觉估算剩余量误差与用户自估相当；连拍两次行为习惯难建立，会显著降低履约率。
- 处理：4 档自填（全吃完 / 吃了3/4 / 吃了一半 / 剩很多）直接修正营养计算。餐后拍照保留可选，仅做轻量一致性校验，不替代自填。

### 固定字段（4 题）

| 字段 | 类型 | 选项 | 数据用途 |
|---|---|---|---|
| 实际吃掉多少 | 单选 | 全吃完 / 吃了3/4 / 吃了一半 / 剩很多 | 修正营养计算，核心行为数据 |
| 饱腹状态 | 单选 | 撑 / 刚好 / 还饿 | 能量状态信号，驱动下一餐建议 |
| 身体即时感受 | **多选** | 舒服 / 胀气 / 困倦 | 餐后生理反应，食物-身体关联（与原型 QUESTION_SCHEMA 对齐） |
| 这顿吃得开心吗 | 单选 | 还不错 / 一般 / 有点后悔 | 情绪-食物关联，影响 DishScore 权重（与原型 QUESTION_SCHEMA 对齐） |

### 个性化追问触发规则（最多 1 题，可跳过）

| 触发条件 | 追问内容 | Phase 优先级 | 价值说明 |
|---|---|---|---|
| `dish_key` 首次出现（首次记录这道菜） | 合口味吗？（很合 / 还行 / 一般 / 不太合） | **立即做** | DishScore 核心数据来源；首次记录的口味反馈只能获取一次，算法增益最高 |
| 本餐 `tags` 包含高碳水 / AI 标注碳水偏高 | 吃完困不困？（没有 / 有一点 / 明显） | **Phase 1 加入** | 建立用户碳水敏感度个人模型；洞察价值高（"下午犯困与午饭有关"用户常不知道） |
| 与历史某餐同一 `dish_key`，且历史有不适标注 | 今天有没有同样感觉？（没有 / 有一点 / 明显） | Phase 1 后期 | 验证食物-不适相关性，区分偶发与系统性，降低该食物推荐权重 |
| 本餐 `tags` 包含脂肪偏高 | 腻不腻？（没有 / 有一点 / 明显） | Phase 2 | 算法增益低（AI 已知高脂信号），不单独追问 |
| 蛋白质偏低 + 用户有蛋白目标 | 还想吃点什么吗？ | Phase 2 | 场景窄，仅对有健身目标的用户有价值 |

### 多题冲突：同时触发多条时只展示 1 题

按以下优先级取最高项：

1. 首次吃这道菜 → 合口味吗（数据稀缺性最高，只有一次机会）
2. 上次不适 → 今天有没有同样感觉
3. 碳水偏高 → 困不困

### 原型复用边界

| 可复用 | 不可直接复用 |
|---|---|
| 4 题固定字段定义、选项文案 | HTML 内联样式 → RN StyleSheet |
| 身体感受多选逻辑 | HTML `<div>` 结构 → RN `View` + `FlatList` |
| 个性化追问触发规则和优先级 | `onclick` 事件 → `onPress` |
| `dish_key` 首次判断逻辑 | 直接可复用（纯数据查询逻辑） |

## 主原型同步修订（2026-05-26 洞察引擎统一与消费层收敛）

本节记录 ##027～##030 完成后，主原型 `docs/prototype/meal-agent-product-prototype.html` 的架构统一状态。Phase 1 T5-01～T5-06 工程实现必须对照本节，优先级高于同名旧字段和旧任务描述。

### deriveInsights 引擎架构（Layer 2，统一洞察入口）

原型已将所有"对用户的判断"统一到 `deriveInsights(meals, phase)` 单一函数。Phase 1 App 必须遵循同样的 3 层架构，禁止孤岛算法。

**Layer 1（原始数据层）**：`meals[]` 数组，每条含 `analysis`、`fb`（反馈）、`ts`（时间戳）、`type`（餐次类型）等字段。

**Layer 2（洞察引擎层）**：`deriveInsights(meals, currentPhase)` 纯函数，幂等，永远从 Layer 1 重算，不持久化中间洞察。

> 完整 `Insight` 类型定义见 `docs/02-master-blueprint.md` Layer 2 章节（含 `TriggerDimension`、`triggerPhase`、`bioSignalRefs` 预留字段）。

**Phase 1 注册的 Detector 集合（客户端 JS 运行，仅这 4 个）：**

| Detector | 触发维度上限 | angle 示例 | id 格式 |
|---|---|---|---|
| `StructureReactionDetector` | 2（tag + 可选 meal_type） | 高油→胀气 / 高碳→困倦 / 均衡→舒服 | `ins_structure-{tag}-{outcome}` |
| `TimingReactionDetector` | 2（time_slot + 可选 meal_type） | 深夜进食→胀气/困倦 / 午饭高碳→困倦 | `ins_timing-{slot}-{outcome}` |
| `MealTypeStructureDetector` | 2（meal_type + 最强 tag） | 晚饭+高油→胀气 / 早饭+高碳→困倦 | `ins_mealtype-{type}-{tag}-{outcome}` |
| `PositivePatternDetector` | 1（cuisine 或 tag） | 粤菜→舒服/满意 / 均衡搭配→舒服 | `ins_偏好-{cuisine}` / `ins_positive-{tag}` |

**信号定义（与原型字段严格对齐）：**

```typescript
// 正向信号
const POSITIVE = (fb: Feedback) =>
  fb.comfort === 'comfortable' || fb.satisfaction === 'good'

// 负向信号（胀气）
const BLOATED = (fb: Feedback) => fb.comfort === 'bloated'

// 负向信号（困倦）
const DROWSY = (fb: Feedback) => fb.comfort === 'sleepy'

// 负向信号（后悔）
const REGRET = (fb: Feedback) => fb.satisfaction === 'regret'
```

**每个 Detector 的 angle 触发规则（Phase 1 精简版）：**

```
StructureReactionDetector:
  触发池: tags 含 ['高油','高碳水','主食偏多','搭配均衡','蛋白质足'] 之一
  规律1: tags∋高油 AND comfort∋胀气        → id: ins_structure-highfat-bloated
  规律2: tags∋高碳水 AND comfort∋困倦      → id: ins_structure-highcarb-drowsy
  规律3: tags∋主食偏多 AND fullness=撑     → id: ins_structure-heavystaple-overfull  ★fullness 作修正权重
  规律4: tags∋(搭配均衡 OR 蛋白质足)
         AND (comfort∋舒服 OR satisfaction=还不错)
                                            → id: ins_structure-balanced-positive

TimingReactionDetector:
  规律1: time_slot=late_night(21:00-05:00)
         AND (comfort∋困倦 OR comfort∋胀气) → id: ins_timing-latenight-discomfort
  规律2: time_slot=lunch AND tags∋高碳水
         AND comfort∋困倦                   → id: ins_timing-lunch-highcarb-drowsy
         ⚠️ 与 StructureReactionDetector 规律2 有重叠，优先展示 timing 版（信息更丰富）

MealTypeStructureDetector:
  规律1: meal_type=晚饭 AND tags∋高油
         AND (comfort∋胀气 OR comfort∋困倦) → id: ins_mealtype-dinner-highfat-discomfort
  规律2: meal_type=早饭 AND tags∋高碳水
         AND comfort∋困倦                   → id: ins_mealtype-breakfast-highcarb-drowsy

PositivePatternDetector:
  规律1: comfort∋舒服 OR satisfaction=还不错
         → 按 cuisine 分组，取满意率 ≥ 60% 且出现 ≥ 3 次的菜系
         → id: ins_偏好-{cuisine}
  规律2: tags∋(搭配均衡 OR 蛋白质足)
         AND positive(fb) → id: ins_positive-balanced
```

**Phase-gated 规律（Phase 1 引擎跳过，Phase 2+ 追加）：**

```
MoodAmplifierDetector      (triggerPhase=2)：mood × tag → 情绪放大效应
NextDaySignalDetector      (triggerPhase=2)：晚饭/夜宵 → 次日 meal_feedback 归因（daily_checkins 已废弃）
FulfillmentPatternDetector (triggerPhase=2)：plan_slot 执行率 → 行为规律
HealthLinkDetector         (triggerPhase=4)：health_data × food → 生理关联
```

> ⚠️ AND 条件 ≥ 3 层的规律禁止在 Phase 1 生成（样本坍塌：20 餐场景下三条件组合 sampleSize ≈ 1，永远 sparse）。

**maturity 三档全局规则**：`n ≥ 5 && hitRate ≥ 0.6` → mature；`n ≥ 3 && hitRate ≥ 0.5` → forming；其余 → sparse。

**Layer 3（消费层）**：所有对用户的判断均从 deriveInsights 取数，禁止孤岛算法：

- `renderMealReactionPrediction(meal)` → 总结页本餐反应预测（3 档降级）
- `getInsightsForPreferenceBlock(meals)` / `getInsightsForReactionBlock(meals)` → 身体拼图 4 块数据来源
- `renderLateNightAdvisoryCard()` → 首页深夜进食建议卡（##027）
- `buildCardPoolForState` 过滤/评分 + `aiGenerateCards` prompt 上下文 → 饭前抽卡 reason（##030）
- 身体拼图页叙事区块 + 洞察成熟弹窗（##029）
- 成长时间轴洞察生命周期节点（##028）

**React Native 可复用内容**：`deriveInsights` 算法逻辑（无浏览器依赖，直接翻译为 TypeScript）；maturity 三档阈值常量；Insight 接口定义；各 angle 筛选逻辑和统计计算。

**不可直接复用**：HTML 渲染函数、DOM 操作、内联样式；App 用 React Native 组件实现对应 UI。

---

### 首页深夜进食建议卡（非阻塞 advisory，##027）

- **取消旧 modal 拦截**：`startMealDecision` 和 `startDirectMealRecord` 不再通过 `isLateNightWithDinner` 拦截用户进入抽卡/直接记录流程；旧函数 `getLateNightMealAdvice`、`openLateNightAdviceSheet` 已从原型删除。
- **新增 `renderLateNightAdvisoryCard()`**：当 `isLateNightWithDinner() === true`（当前时间 21:00–5:00 且当天已有晚饭/晚餐记录）时，在首页顶部渲染非阻塞建议卡，否则返回空字符串不占位。
- **3 档降级渲染**（与总结页 `renderMealReactionPrediction` 同阈值同语义）：

  | maturity | 标题 | 说明 | 额外内容 |
  |---|---|---|---|
  | mature（n≥5，hitRate≥60%） | 根据你的数据建议今晚不吃了 | 过去 N 次深夜进食中，M 次之后你感到不舒服 | 无 |
  | forming（n≥3，hitRate≥50%） | 晚上再吃选轻的 | 规律正在显现，深夜进食对你的身体可能有影响 | 无 |
  | sparse（n<3） | 晚上再吃选轻的 | 还没有足够数据，这是通用建议 | 3 个食物参考选项 |

- **卡片标签**：`💡 建议（你可以忽略）`，浅色背景 + 圆角，不带遮罩，无按钮（不是决策器，不阻塞后续操作）。
- **App 实现注意**：`isLateNightWithDinner` 判断逻辑可复用（纯数据查询）；React Native 用 `View`+`Text` 实现卡片，不用 HTML div；首页状态机新增：`lateNightAdvisoryVisible: boolean`。

---

### 身体洞察叙事风格（"你的身体说"，##029）

- **展示位置**：身体拼图页"身体洞察"叙事区块（conclusion 区），仅显示 mature 洞察，forming 洞察不进叙事。
- **叙事结构**：大卡片（橙色渐变）+ "你的身体说"标签 + 多段叙事（细线分隔）。
- **叙事模板**（严格格式）：
  ```
  你吃 [类型 X]（如 [具体食物例子]）后，[反应] 概率是 [百分比]%；
  吃 [类型 Y] 时是 [百分比]%。
  这不是 [表面原因] —— 是 [底层机制]。
  ```
  - 具体食物例子：从 `insight.evidence.sourceRefs` 提取对应 meals 的 dish 名（最多 2 个）
  - 对比基线：reaction 类计算非触发条件下的基线比率（`_baselineRateFor`）
  - preference vs avoid 对比段：偏好菜系与回避菜系对比叙述
  - reaction 独立段：油炸→胀气、午饭高碳→困倦等，各自独立段
- **无 mature 洞察时**：不显示叙事区块，不占位。
- **App 实现注意**：纯算法逻辑（取 sourceRefs → 找 dish 名，计算基线率）可直接翻译为 TypeScript；渲染层用 RN Text/View 替代 HTML；`StyleSheet.create` 替代内联渐变。

---

### 洞察成熟弹窗（一次性，##029）

- **触发时机**：`finishFeedbackSummary`（反馈提交完成后）比对 prev/curr `deriveInsights` 输出，发现新的 forming→mature 洞察。
- **去重**：按 `insight_celebrated_{id}` localStorage key 每个 insight 只弹一次；App 使用 AsyncStorage 同等实现。
- **弹窗内容**：复用 `insightToBodyMirror(insight, meals)` + `showBodyMirrorIfReady(mirror)` → 展示具体规律标题、身体反馈次数、行动建议。
- **与拼图解锁弹窗的错开逻辑**：拼图解锁庆祝先弹（350ms 延迟），洞察成熟弹窗后弹（1800ms 延迟）；无拼图解锁时洞察弹窗 350ms 弹。
- **App 实现注意**：`try/catch` 包裹防 deriveInsights 异常影响主流程；延迟用 `setTimeout` 实现，App 可用同等 JS 定时器。

---

### 成长时间轴洞察生命周期节点（##028）

- 在原有 4 块拼图解锁节点基础上，按需追加洞察生命周期事件，统一 `filter(Boolean) + sort(by ts)` 排序显示。
- **🌱 浮现事件**（amber 色）：该 angle 第 3 个样本餐次时触发，文案按 category 区分：
  - preference：`「X 菜系」偏好浮现（已有 3 次好评记录）`
  - avoid：`「X 菜系」回避信号浮现（已有 3 次不适记录）`
  - reaction：`「X」反应规律浮现（已出现 3 次相关反馈）`
- **✦ 成熟事件**（accent 色）：第 5 个样本且当前 `maturity === 'mature'` 才显示，文案同上风格。
- **无 mature/forming 洞察时**：洞察事件为空数组，不影响原有 5 个拼图节点。
- **App 实现**：`TimelineScreen.tsx` 需支持洞察事件类型节点（新增 `type: 'insight_forming' | 'insight_mature'`），节点数据结构与拼图节点对齐（`ts`、`emoji`、`color`、`label`）。

---

### 饭前抽卡 AI + 本地降级均接入 deriveInsights（##030）

- **AI 推荐 prompt 硬约束**：`PROMPT_CARD_RECOMMEND`（对应 FastAPI `Prompt 2`）必须包含"洞察硬约束"段落：
  1. 推荐理由必须基于上下文"用户已发现的身体规律"列表
  2. 禁止编造列表外的因果关系
  3. 冷启动期（列表为"暂无"）禁止伪装个性化，不得写"根据你的偏好"
- **API 调用传 insights 上下文**：调用 AI 时需传入 `deriveInsights(mealHistory, 1)` 取 mature/forming 洞察，格式化为可读列表（含 "X 次中 Y 次" + maturity 标签）；列表为空显式标注"暂无（冷启动期，禁止伪装个性化）"。
- **`build_card_pool_for_state` 接入 insights（Python 后端）**：
  - mature avoid 类菜系直接硬过滤剔除候选
  - preference 命中 → +5 分；reaction 触发词命中 → -3 分
  - 仅 mature insight 触发，避免冷启动期错误过滤
- **`makeReason` body_puzzle 阶段优先引用 insight**：命中 mature preference → 引用"这是你的稳定偏好"；命中 mature reaction 且推荐规避触发词 → 引用"避开了你已识别的触发词"；无命中时回退原逻辑。
- **与 T5-02 关系**：FastAPI `POST /v1/insight/generate`（trigger=`draw_card`）的 prompt 模板和 insights 上下文传参必须按本节实现；body_puzzle 阶段 reason 文案必须引用 insights，不得自由发挥。
- **App 实现注意**：Python 端 insights 过滤/评分逻辑直接按本节实现；Claude prompt 中的 insights 硬约束段落文案不可删改；`makeReason` 的 insight 引用逻辑需补充到 `draw_card.py`。

---

## 主原型同步修订（2026-05-26 档案页重构 + deriveInsights diet_structure_type）

本节记录 ##035 + ##036 完成后主原型 `docs/prototype/meal-agent-product-prototype.html` 的档案页口径变更。Phase 1 T4-05 工程实现必须对照本节，优先级高于 Sprint 4 任务表中的旧描述。

### 档案页三块结构（最终口径）

个人档案页 `profile.tsx` 改为三块结构，彻底废弃旧的"基础信息/目标/健康背景/偏好统计/AI状态/数据管理"布局：

| 块 | 名称 | 内容 | 说明 |
|---|---|---|---|
| 1 | 干饭目标 | `profile.goal`（文字）+ `profile.daily_budget`（元/天） | **flex 垂直列**，两字段全宽独立展示，不并排 |
| 2 | 身体拼图 | 4 块独立解锁（同 T5-06 完整规格） | 档案页内嵌，同一套解锁逻辑和渲染组件 |
| 3 | 干饭档案 | 由 `deriveInsights()` 驱动的三字段（见下方） | 打开页面时即时重算（<20ms），不持久化中间结果 |

**顶部副标题**：`N 餐记录`（删除旧的"看见阶段"等内部阶段名），仅展示累计餐次数。

**移除字段**：`记录餐次`（原在干饭档案内单独显示餐次数，已移至顶部副标题，档案区不重复）。

---

### 干饭档案三字段（冷/积累/成熟三档）

所有字段均实现 **cold → forming → mature** 三档渐进，**不依赖身体拼图解锁**，各自按自身数据来源门控：

#### 偏好餐次

| 档位 | 条件 | 展示 |
|---|---|---|
| cold | `meals.length < 5` | 再记录 `max(5-n, 0)` 餐解锁 |
| forming | `5 ≤ n < 21` | `倾向 {topMealType}` + `积累中` badge |
| mature | `n ≥ 21` | 正式标签 `{topMealType}`，无 badge |

数据来源：`meals[].type` 统计频次前 1；门控阈值与任何身体拼图字段无关。

#### 干饭风格

| 档位 | 条件 | 展示 |
|---|---|---|
| cold | `analyzedN < 5` | 再记录 `max(5-analyzedN, 0)` 餐解锁（`analyzedN` = 有 analysis 的餐次数） |
| forming | `5 ≤ analyzedN < 21` | `{emoji} {style}` + `积累中` badge + `基于 X 餐 · 还需更多数据确认` |
| mature | `analyzedN ≥ 21` | 正式标签 `{emoji} {style}` + `基于 X 餐记录` |

数据来源：`deriveInsights()` 输出的 `diet_structure_type` angle（见下节）。

#### 忌口偏好

`profile.avoid` 直接读取，无 maturity 门控；空时显示"暂未设置"。

---

### deriveInsights diet_structure_type angle（最终口径）

**作用**：从每条 `meal.analysis` 的结构字段归纳用户的"干饭风格"，六种风格：

| 风格 | emoji | 触发条件 |
|---|---|---|
| 肉食星人 | 🥩 | proteinLevel 高 |
| 素食星人 | 🥦 | vegetableFiberLevel 高 |
| 碳水星人 | 🍚 | stapleLevel 高 |
| 重口派 | 🌶️ | oilLevel 高 |
| 清爽派 | 🥗 | 所有维度均非高 |
| 均衡派 | ⚖️ | 多个维度均衡中等 |

**maturity 阈值**（独立于标准 5-angle 的阈值）：
- `forming`：`analyzedN ≥ 5`（有 analysis 的餐次达 5 条）
- `mature`：`analyzedN ≥ 21`（覆盖约 3 周行为样本，是行为习惯可信的最低阈值）

**数据流**：`meal.analysis.proteinLevel / vegetableFiberLevel / stapleLevel / oilLevel` → 统计占比最高的维度 → `diet_structure_type.target`（风格名）+ `emoji` + `maturity`。

**架构债（Phase 1 已知）**：当前 `meal.analysis` 的结构字段直接来自 AI Vision 识别；营养库 `nutrition_items` 已有每道菜的精确营养数据，理想路径是：营养库命中 + `correctionHistory` → 覆盖 AI 估算的 proteinLevel/stapleLevel/vegetableFiberLevel/oilLevel → deriveInsights 基于更准确数据归纳风格。该 pipeline 连接为 Phase 1 架构债，记录在 `docs/architecture/flow-data-maps/13-profile-management.md`。

---

### 通知固定化（T3-04）

`schedulePostMealReminder()` 推送延迟从 `profile.reminder_delay_min` 改为**系统固定 20 分钟**：

- 不提供用户自定义推送延迟的设置项
- `profile.reminder_delay_min` 字段废弃，不再读取、不再写入
- 20 分钟是"餐后反馈黄金窗口"与"打扰感阈值"的平衡点，系统固定有助于建立用户的反馈节律

---

### 原型复用边界

| 可复用 | 不可直接复用 |
|---|---|
| 三块结构分区逻辑 | HTML `div` 内联样式 → RN `StyleSheet` |
| cold/forming/mature 三档判断逻辑 | HTML `grid-column:1/-1` → RN `width:'100%'` |
| `analyzedN` 计算（filter has analysis） | `积累中` HTML span → RN `Text` + `View` badge |
| diet_structure_type angle 全部算法逻辑 | `deriveInsights` 返回对象可直接翻译为 TypeScript |
| 偏好餐次 topMealType 统计逻辑 | — |

---

## 关联验收

见 `docs/acceptance/phase-1-mvp-1-acceptance.md`。
