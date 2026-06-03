# 经验教训索引

本文件只收录可复用、已验证、后续 AI 容易再次遇到的问题。普通任务现场复盘写在 `docs/TASK_LOG.md`，不要把每个小报错都放进本索引。

## 使用方式

1. 遇到问题时，先用关键词搜索本文件。
2. 找到候选条目后，对照“适用范围”和“触发症状”。
3. 查看条目状态。只有 `ACTIVE` 条目可直接复用，`SUPERSEDED` / `OBSOLETE` 只能作为历史参考。
4. 只有确认是同类问题，才能复用“已验证解决方案”。
5. 如果症状不一致，只能作为排查参考，不得机械套用。
6. 解决后在 `docs/TASK_LOG.md` END 记录中引用对应 lesson 编号。

## 晋升标准

满足以下至少一项，才允许从 `TASK_LOG` 晋升为 lesson：

- 涉及真实联调、密钥、Supabase、EAS、真机、AI provider、数据库、构建或部署。
- 容易被多个 AI 重复踩坑。
- 已经有明确根因和已验证解决方案。
- 能沉淀为通用 SOP 或下一个项目可复用规则。
- 复用后预计能显著减少排查时间。

不得晋升：

- 一次性拼写、格式、临时网络抖动。
- 没有验证过的猜测。
- 只适用于当前文件局部的小问题。
- 会泄露真实密钥、用户隐私或完整 raw response 的细节。

## 状态定义

- `ACTIVE`：当前仍可复用。
- `SUPERSEDED`：已有替代条目，保留历史但不得优先使用。
- `OBSOLETE`：环境或架构已变化，不再适用。

## 索引

| 编号 | 问题名称 | 关键词 | 状态 | 最后验证时间 | 失效条件 |
|---|---|---|---|---|---|
| LESSON-0001 | 任务复盘只写长日志，后续 AI 难以检索复用 | TASK_LOG, 复盘, SOP, 经验教训, 索引 | ACTIVE | 2026-05-16 | 项目改用自动化知识库或任务系统替代 Markdown 经验索引 |
| LESSON-0002 | Android debug 调试循环默认清缓存导致每次重建很慢 | Metro, Android, adb reverse, --clear, debug, 重启 | ACTIVE | 2026-05-16 | Expo/React Native 调试链路改为无需 Metro 或脚本被新工具替代 |
| LESSON-0003 | 开发进入 L2 后才发现原型/方案/数据合约缺口导致中断 | 原型, 方案, 数据合约, 门控, Pre-Flight, 进入开发, 类型文件, types.ts, 开发中断, 需求阶段, 开发阶段 | ACTIVE | 2026-05-24 | 项目引入自动化合约检查工具或设计系统替代人工门控 |
| LESSON-0004 | TypeScript unknown 类型在三元表达式中收窄失效，结果被推断为 string | TypeScript, unknown, 类型收窄, 三元表达式, 字面量联合, literal union, as, EatingAdviceItem | ACTIVE | 2026-05-24 | TypeScript 升级后改变了 unknown 的控制流收窄行为 |

## LESSON-0001：任务复盘只写长日志，后续 AI 难以检索复用

- 问题名称：任务复盘只写长日志，后续 AI 难以检索复用。
- 状态：ACTIVE。
- 适用范围：多 Agent 接力、长期项目、真实联调项目、需要把项目经验沉淀到后续 SOP 的项目。
- 触发症状：同类问题反复出现；AI 需要在 `docs/TASK_LOG.md` 长日志里翻找历史；日志里有“问题”和“遗留问题”，但缺少可按关键词命中的独立经验条目。
- 根因判断：`TASK_LOG` 适合记录现场上下文，但不适合作为高频经验检索入口；如果没有编号、问题名称、触发症状和已验证方案，后续 AI 很难判断是不是同类问题。
- 已验证解决方案：建立两层机制：每个 END 记录必须写“本次问题-解决方案-经验教训”；只有可复用、已验证、高风险或易重复的问题才新增或更新本索引；`TASK_LOG` 引用 lesson 编号，lesson 反链任务记录。
- 不要做什么：不要把所有小报错都晋升为 lesson；不要只写“环境问题”这类泛化描述；不要在没有对照触发症状时机械复用旧方案；不要记录真实密钥、用户隐私或完整 raw response。
- 经验教训：现场日志负责还原当时发生了什么，经验索引负责让后续 AI 快速识别同类问题并复用已验证路径；轻量分层能提高长期效率，过度收录会降低效率。
- 可复用 SOP 建议：所有长期项目都应保留任务日志和经验索引两个入口；结束记录必须复盘，只有高价值问题进入索引；索引条目必须包含编号、问题名称、关键词、适用范围、触发症状、根因、已验证方案、不要做什么、经验教训、关联任务记录和最后验证时间。
- 关联任务记录：`docs/TASK_LOG.md` 中 `SOP-lessons-index`。
- 最后验证环境：Markdown 文档型长期项目，`AGENTS.md`、`docs/01-ai-working-manual.md`、`docs/development-sop/LATEST.md`、`docs/TASK_LOG.md` 已固化规则。
- 最后验证时间：2026-05-16。
- 失效条件：项目改用自动化知识库、issue tracker 或数据库化经验系统替代 Markdown 经验索引。
- 替代条目：无。

## LESSON-0002：Android debug 调试循环默认清缓存导致每次重建很慢

- 问题名称：Android debug 调试循环默认清缓存导致每次重建很慢。
- 状态：ACTIVE。
- 适用范围：Expo / React Native dev client、Android 真机调试、需要频繁重启 App 或查看 JS 改动的阶段。
- 触发症状：用户要求“重启”或查看小改动时，Agent 重新启动 Metro 且默认带 `--clear`；Metro cache 被清空，重新扫描和构建 bundle 很慢；还可能因为 8081 旧进程占用导致二次排查。
- 根因判断：`expo start --dev-client --clear` 适合缓存错乱时兜底，不适合日常热刷新；“重启 App”和“重启 Metro/清缓存”是两件事，混在一个流程会显著拖慢反馈。
- 已验证解决方案：`metro:debug` 默认不带 `--clear`，只在显式 `--clear` 时清缓存；新增 `android:restart` 脚本，只执行 `adb reverse tcp:8081/tcp:8000`、`am force-stop` 和 `monkey` 启动 App；脚本自动查找 Windows Android SDK 的 `adb.exe`。已通过 dry-run、lint、typecheck 和真实 `npm.cmd run android:restart` 验证。
- 不要做什么：不要把日常重启都做成 `expo start --clear`；不要在 8081 被占用时直接切 8082 给 debug 包使用；不要每次都手工拼 adb 命令。
- 经验教训：开发体验里的慢不一定来自原生打包，很多时候是把“清缓存重建”和“重启手机 App”误合并了；把两条路径拆开能立刻缩短反馈时间。
- 可复用 SOP 建议：React Native / Expo 真机调试项目都应提供两个脚本：一个常驻 Metro，不默认清缓存；一个只重启设备 App 并刷新端口映射。
- 关联任务记录：`docs/TASK_LOG.md` 中 `DX / Faster Android debug loop`。
- 最后验证环境：Windows + Android SDK platform-tools + Expo dev client + Android 真机 `PJZ110`。
- 最后验证时间：2026-05-16。
- 失效条件：项目改用不同调试链路、Expo/React Native 不再需要 Metro、adb 启动方式变化，或新脚本替代 `android:restart`。
- 替代条目：无。

## LESSON-0003：开发进入 L2 后才发现原型/方案/数据合约缺口导致中断

- 问题名称：开发进入 L2 后才发现原型/方案/数据合约缺口导致中断。
- 状态：ACTIVE。
- 适用范围：所有在"需求阶段（原型+方案确认）→ 开发阶段（L2）"边界切换的任务；尤其是原型迭代频繁、多 Phase 演进的长期项目。
- 触发症状：L2 开发过程中发现原型有某个页面/状态在方案里没有对应描述；或发现原型引用的数据字段（如 `slot`、`badge`、`fromCard`、`nutrition`）在 `src/types/meal.ts` 中根本不存在；开发被迫中断，回去改原型或补方案，再重新进入开发。
- 根因判断：需求阶段的"原型同步开发" SOP 只负责把原型内容翻译为文档，不验证技术可行性；需求→开发的边界没有显式门控，Agent 和用户都不知道"什么状态才算真正可以开发了"，导致开发中途才踩空。
- 已验证解决方案：定义触发词"进入开发"，强制在 L2 开始前顺序执行两个门控：**门控1（原型↔方案完整性）**——逐页对比原型和方案，输出 ✅/⚠️/❌ 覆盖清单，有缺口先补方案；**门控2（Pre-Flight 技术可行性）**——检查数据合约（`src/types/meal.ts`）、接口合约（FastAPI 路由）、原生能力，列出缺口并排期。两个门控均通过并经用户确认后，才写 TASK_LOG START 进入 L2。规范已固化在 `docs/01-ai-working-manual.md` 和 `AGENTS.md`。
- 不要做什么：不要在方案确认后直接跳进 L2 开发；不要把"用户说好"等同于"技术可行性已验证"；不要把数据字段的存在性检查留到开发中途。
- 经验教训：需求阶段和开发阶段是两个性质不同的工作，需求确认的是"做什么"，开发前需要独立验证"能不能做"。两个阶段之间的边界如果没有显式触发词和门控，就会在开发中途被动暴露缺口，比主动暴露的代价大得多。
- 可复用 SOP 建议：任何有"需求→开发"边界的长期项目，都应定义对称的两个触发词：一个负责需求同步（如"原型同步开发"），一个负责开发前门控（如"进入开发"）；门控要同时覆盖文档完整性和技术可行性，且顺序执行而非并行，因为文档缺口补完后可能引入新的技术依赖。
- 关联任务记录：`docs/TASK_LOG.md` ##012（type-system-alignment）、##013（dev-readiness-gates）。
- 最后验证环境：干饭项目，React Native + TypeScript + Supabase + FastAPI，Phase 1 MVP 1.0 开发阶段。
- 最后验证时间：2026-05-24。
- 失效条件：项目引入自动化合约检查工具（如 Zod schema 生成、OpenAPI codegen、类型同步 CI）能在 PR 阶段自动捕获数据合约缺口，则人工门控可降级为辅助检查。
- 替代条目：无。

## LESSON-0004：TypeScript unknown 类型在三元表达式中收窄失效，结果被推断为 string

- 问题名称：TypeScript `unknown` 类型经 `===` 条件收窄后，在三元表达式中赋值时结果仍被推断为 `string`，导致字面量联合类型赋值报错。
- 状态：ACTIVE。
- 适用范围：TypeScript 项目中，从 `Record<string, unknown>` 或类似结构读取字段，用 `===` 做多值判断，再以三元表达式赋值给字面量联合类型（如 `"positive" | "caution"`）的场景。
- 触发症状：代码形如 `obj.type === "a" || obj.type === "b" ? obj.type : "a"`，TypeScript 报错 `Type 'string' is not assignable to type '"a" | "b"'`；即使条件已经覆盖了所有合法值，编译器仍然拒绝。
- 根因判断：TypeScript 的控制流收窄在 `===` 条件内可以把 `unknown` 收窄为字面量联合，但三元表达式的结果类型由真值分支和假值分支的联合推断，当真值分支来自 `unknown` 的收窄结果时，编译器可能将其宽化为 `string`（而非保留为字面量联合），导致整体结果类型丢失字面量信息。
- 已验证解决方案：在三元表达式赋值点显式加类型断言：`(obj.type === "a" || obj.type === "b" ? obj.type : "a") as TargetType["field"]`。不要依赖控制流分析自动传播字面量类型；对于从 `unknown` 读取并赋值给字面量联合的场景，始终在赋值点加 `as`。已通过 `npm run typecheck` 零错误验证（见 `src/services/aiSchema.ts` `normalizeEatingAdviceItems`）。
- 不要做什么：不要认为 `===` 判断已经"证明了"类型，就省略 `as`；不要用扩大范围的 `as string` 或 `as any` 绕过，应使用精确的目标类型；不要把这类报错归因于"TypeScript bug"，这是有意的推断保守行为。
- 经验教训：TypeScript 的收窄是局部的，不能保证收窄后的类型被保留到表达式外部；对于来自 `unknown` 的值，赋值给精确类型时始终显式标注，不依赖推断传播。
- 可复用 SOP 建议：凡从 `Record<string, unknown>` 读取字段并赋值给字面量联合类型（如枚举值、discriminated union），统一在赋值点加 `as TargetType["field"]`；这类 normalize 函数建议统一写在一处（如 `aiSchema.ts`），便于集中审查。
- 关联任务记录：`docs/TASK_LOG.md` ##012（type-system-alignment）`src/services/aiSchema.ts` `normalizeEatingAdviceItems`。
- 最后验证环境：TypeScript 严格模式，干饭项目 `src/services/aiSchema.ts`，`npm run typecheck` 通过。
- 最后验证时间：2026-05-24。
- 失效条件：TypeScript 未来版本改变了 `unknown` 的控制流收窄传播行为，使三元表达式能正确保留字面量联合类型。
- 替代条目：无。

## 条目模板

```text
## LESSON-0002：问题名称

- 问题名称：
- 状态：ACTIVE / SUPERSEDED / OBSOLETE
- 适用范围：
- 触发症状：
- 根因判断：
- 已验证解决方案：
- 不要做什么：
- 经验教训：
- 可复用 SOP 建议：
- 关联任务记录：
- 最后验证环境：
- 最后验证时间：
- 失效条件：
- 替代条目：
```
