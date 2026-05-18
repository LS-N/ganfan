# 干饭最终产品开发总纲

## 1. 文档地位

本文件是《干饭》进入开发后的最高优先级开发总纲。

后续 AI Agent、开发者、评审者应优先阅读：

1. `docs/02-master-spec.md`
2. 当前阶段文档，例如 `docs/03-phase-1-closed-loop.md`
3. 相关原型与归档索引

旧任务拆解、全栈长方案、原型备份、阶段草案只作为参考资料，不再直接作为开发指令。

## 2. 产品目标

干饭是一款 AI 饮食决策 App。

首要目标不是让用户精确计算热量，而是帮助用户完成这个闭环：

```text
记录一餐
-> 获得结构化判断
-> 饭后快速反馈
-> 累积身体反应数据
-> 生成个人身体拼图
-> 下一餐获得更可执行的轻决策建议
```

当前进入开发时，优先验证：

> 用户是否愿意用一张餐食照和 10 秒饭后反馈，换取连续 7 天后的个人身体洞察。

## 3. 产品原则

1. 决策优先：数据必须服务下一步行动。
2. 记录极简：用户完成一餐记录的心智负担要低。
3. 不假装精确：首版不承诺精确卡路里、精确克数、医学判断。
4. 反馈是核心资产：饭后反馈、修正记录、时间戳比一次 AI 识别更重要。
5. 先验证闭环，再建设重工程：真实 AI、后端、营养库、离线同步按阶段接入。
6. Android 优先，iOS 预留：不得写死 Android-only 业务逻辑。
7. 不提前商业化：采购履约、订阅、社区等必须等记录和信任闭环被验证后再做。

## 4. 工程入场架构

当前工程采用根目录 Expo App，不迁移 monorepo。

```text
app/
  _layout.tsx
  index.tsx
  record.tsx
  analysis.tsx
  feedback.tsx
  detail.tsx
  history.tsx
  report.tsx
  draw-card.tsx
  profile.tsx

src/
  components/
  features/
  screens/
  services/
  stores/
  styles/
  types/
  utils/

.github/
  workflows/
```

### 分层职责

| 层级 | 职责 |
|---|---|
| `app/` | Expo Router 路由入口，只做页面挂载和轻量路由配置 |
| `src/screens/` | 页面级 UI 与页面状态编排 |
| `src/components/` | 可复用基础组件，不绑定具体业务 |
| `src/features/` | 业务模块，后续按 meal、feedback、body-puzzle、draw-card 拆分 |
| `src/services/` | mock service、后续 Supabase service、AI service |
| `src/stores/` | Zustand 状态管理 |
| `src/styles/` | Design Tokens，页面不得散落硬编码主题样式 |
| `src/types/` | Profile、Meal、Analysis、Feedback、Report 等类型 |
| `src/utils/` | 日期、状态计算、格式化、校验等纯函数 |

### 当前技术栈

- React Native + Expo
- TypeScript
- Expo Router
- Zustand
- React Native StyleSheet + Design Tokens
- Mock service first
- Supabase later
- AI service later
- EAS Update for JS/TS OTA
- EAS Build for native package changes

## 5. 阶段规划

### Phase 0: Engineering Entry

目标：保证工程可运行、可测试、可 OTA。

当前状态：基本完成，后续只补设备验证。

交付：

- Expo App 可启动
- 页面壳可跳转
- 基础组件和 tokens 可用
- CI 可跑
- EAS Update preview 可发
- Android preview 包待真机/模拟器最终确认

### Phase 1: V1 Product Closed Loop

目标：先交付可用的 7 天身体拼图产品闭环。

这是当前立即进入开发的阶段。

交付：

- 新用户定位/建档
- 首页 Today 状态
- 拍照/选图记录入口
- AI 即时分析 mock/可替换 service
- 识别结果修正
- 饭后反馈
- 单餐详情
- 历史记录
- 身体拼图
- 餐前抽卡雏形
- 本地 mock 数据闭环
- 页面状态与验收用例

不做：

- 真实 AI 接入
- FastAPI 独立服务
- pgvector 营养库
- SQLite 离线优先同步
- 推送通知
- Health Connect
- 采购履约
- 社区推荐

### Phase 2: Real Data And AI

目标：把 Phase 1 的 mock 闭环替换为真实数据与真实 AI。

交付：

- Supabase Auth / Database / Storage
- 图片上传
- AI 分析 JSON Schema
- AI 失败兜底
- 低置信度展示
- 用户修正 diff 存储
- 数据隔离和隐私保护

### Phase 3: Personalization And Plan

目标：让饭后反馈转化为可解释的个性化建议。

交付：

- 2 小时回访
- 身体反应规律计算
- 餐前抽卡升级
- 简单日/周计划
- 趋势复盘

### Phase 4: Growth And Fulfillment

目标：在信任闭环成立后做增长和履约。

交付：

- 健康数据整合
- 更强预测
- 食材/外卖/配餐履约
- 群体模型和社区层

## 6. 当前开发计划

当前只执行 Phase 1。

### Sprint 1: 状态模型与服务底座

产出：

- `Profile`、`Meal`、`Analysis`、`Feedback`、`BodyPuzzleReport`、`DrawCard` 类型
- 本地 mock repository/service
- Zustand store
- 页面状态枚举
- mock seed 数据

验收：

- 无真实后端也能完整创建、读取、更新餐次
- 类型可支撑后续 Supabase 映射
- 不记录、不打印隐私数据

### Sprint 2: 首页、建档、记录入口

产出：

- 欢迎/定位页
- 建档页
- Today 首页
- 记录模式：有饭拍照、不知道吃什么、吃完补记

验收：

- 新用户能完成建档进入首页
- 首页能展示未记录、吃饭中、待反馈、已完成状态
- 所有样式使用 tokens

### Sprint 3: 分析与反馈闭环

产出：

- 拍照/选图 UI，可先用 mock 图片占位
- 分析加载、成功、低置信度、失败状态
- 分析结果修正
- 饭后反馈页
- 单餐详情页

验收：

- 用户可完成：记录 -> 分析 -> 修正 -> 反馈 -> 查看详情
- 失败状态可恢复
- 不展示精确卡路里承诺或医学判断

### Sprint 4: 身体拼图与抽卡

产出：

- 历史记录
- 身体拼图数据不足/可生成/已生成状态
- 餐前抽卡安全牌/风险牌
- 采纳/跳过记录

验收：

- 0 餐、1-2 餐、3+ 餐、7 天数据均有合理状态
- 抽卡能说明来源和不确定性
- 身体拼图不是空洞鸡汤，必须引用用户反馈数据

### Sprint 5: 打磨与验收

产出：

- 页面渲染测试
- store/service 单元测试
- 文案安全检查
- Android/iOS 影响说明
- EAS Update 影响说明

验收：

- `npm run lint`
- `npm run typecheck`
- `npm test`
- web/Expo 启动可用
- 不新增原生依赖时无需重新打包

## 7. 数据资产

Phase 1 必须先把以下数据结构稳定下来：

| 对象 | 关键字段 |
|---|---|
| Profile | ageRange、gender、height、weight、goal、avoid、taste、commonFeeling、budget |
| Meal | id、mealType、photoUri、createdAt、photoTakenAt、mealStartedAt、status、source |
| Analysis | structure、stapleLevel、proteinLevel、vegetableFiberLevel、oilLevel、portionLevel、riskHints、confidence |
| Correction | field、aiValue、userValue、correctedAt |
| Feedback | fullness、comfort、sleepiness、bloating、energy、priceSatisfaction、submittedAt |
| BodyPuzzleReport | sampleSize、patterns、safeFoods、riskCombos、nextWeekSuggestion、generatedAt |
| DrawCard | type、title、reason、risk、source、action |

原则：

- 用户修正必须记录 diff，不直接覆盖 AI 原始结果。
- 关键时间戳必须保留，避免后续无法计算进食时长和反馈延迟。
- 所有 AI 输出都必须有 fallback。

## 8. 设计与文案规则

1. 使用 `src/styles/tokens.ts`，不要在页面里散落主题颜色。
2. 页面优先可用，不做营销落地页。
3. 文案克制，不制造焦虑。
4. 不使用“必然长胖”“一定犯困”等绝对表达。
5. AI 结果必须标注不确定性。
6. 反馈选项必须短，默认不要求用户输入长文本。

## 9. 原生能力与发布影响

Phase 1 默认不新增原生插件。

如果引入以下能力，必须单独评估并标记需要重新打包：

- 相机插件
- 图片选择插件
- 推送通知
- Health Connect
- 原生权限
- Expo SDK 升级
- app.json 中影响原生工程的配置

纯 JS/TS 页面、样式、文案、mock service、业务逻辑修改可走 EAS Update。

## 10. 完成定义

任一阶段完成后必须说明：

- 改了哪些文件
- 为什么这样改
- 如何运行
- 如何测试
- 是否影响 Android/iOS
- 是否影响热更新
- 是否需要重新打包

Phase 1 完成的最低标准：

```text
新用户建档
-> 进入 Today
-> 记录一餐
-> 看到结构分析
-> 修正分析
-> 完成饭后反馈
-> 查看单餐档案
-> 累积记录后看到身体拼图
-> 餐前抽卡给出下一餐轻建议
```

