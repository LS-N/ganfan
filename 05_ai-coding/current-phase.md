# 当前开发入口

## 唯一工作区

正式开发只在仓库根目录进行：

```text
F:\ganfan
```

以下路径只作为工具缓存、历史工作树或参考资料，不作为正式开发路径：

```text
F:\ganfan\.claude\worktrees\*
C:\Users\a\.codex\worktrees\*
```

## 权威总纲

当前唯一产品和工程总纲：

```text
05_ai-coding/ganfan-full-implementation-plan.md
```

任何阶段拆解、任务 prompt、代码实现和验收报告都必须服从该文件。

## 当前状态

当前仓库处于工作区治理阶段：

1. 统一主路径为 `F:\ganfan`。
2. 将真实总纲从 `.claude/worktrees` 迁回主路径。
3. 更新入口文档，避免 Agent 继续读取旧 MVP 0.0 / mock Phase 1 口径。
4. 暂停继续扩展业务代码，先把当前未提交变更按阶段拆分。

## 待决策事项

在继续全量开发前，需要确认：

- 是否按总纲迁移为 `apps/mobile + services/ai + supabase` monorepo。
- 是否立即引入原生依赖：`expo-sqlite`、`expo-camera`、`expo-image-manipulator`、`expo-notifications`。
- 是否将当前根目录 Expo App 作为临时过渡实现保留。
- 如何处理已产生的轻量 Phase 1 / Phase 2 代码。

在这些决策确认前，禁止进行以下操作：

- 迁移工程架构。
- 新增原生依赖。
- 接真实 AI secret。
- 创建 FastAPI 服务。
- 创建 Supabase migrations。
- 删除旧文档或大规模移动文件。

## 推荐下一步

1. 对当前未提交变更做分组：
   - 工作区治理文档。
   - 可保留的 Phase 1 App 代码。
   - 已开始的 Phase 2 service/test 代码。
   - 旧文档、原型备份、工具产物。
2. 先提交工作区治理文档。
3. 再决定是否迁移到总纲指定的完整工程架构。

