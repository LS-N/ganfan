# Phase 2 全自动执行 Prompt

```text
进入自主执行模式。

当前阶段：Phase 2 Real Data And AI。

目标：
把 Phase 1 的 mock 闭环替换为真实 Supabase 数据、真实图片存储和真实 AI 结构分析，同时保留 mock fallback。

必须先阅读：
1. AGENTS.md
2. docs/02-master-spec.md
3. docs/03-phase-1-closed-loop.md
4. docs/04-phase-2-real-data.md
5. docs/07-archive-index.md
6. docs/prototype/meal-agent-product-prototype.html

执行规则：
- 先看现有代码实现方式，再输出简短执行计划。
- 从 Phase 2 Sprint 1 开始执行。
- 每个 Sprint 完成后运行 npm run lint、npm run typecheck、npm test。
- 每个 Sprint 完成后报告：完成内容、修改文件、剩余风险、如何运行、如何测试、Android/iOS 影响、热更新影响、是否需要重新打包。
- 完成一个 Sprint 后继续下一个 Sprint，直到 Phase 2 完成或遇到阻塞。

禁止事项：
- 不重新讨论产品方向。
- 不做 Phase 3/4 功能。
- 不改工程架构。
- 不迁移 monorepo。
- 不把 Supabase 查询散落到 screen。
- 不直接在客户端写 AI secret。
- 不提交 .env。
- 不打印用户隐私、图片、完整 AI raw。
- 不输出医学诊断、恐吓、羞辱、精确热量承诺。
- 不新增原生依赖，除非暂停并明确询问。
- 不删除旧文档总纲。

Phase 2 Sprint 顺序：

Sprint 1：
- 补 Phase 1 store/service 最小测试。
- 抽出 service/repository 接口。
- 增加 service mode：mock、real、hybrid。
- 保证 npm test 有真实用例。

Sprint 2：
- 增加 Supabase client。
- 实现 Auth 最小路径。
- 实现 Profile repository。
- 缺 env 时自动 mock fallback。

Sprint 3：
- 实现 Meal repository。
- 实现 Storage service。
- 记录页上传图片并创建 meal。
- History/Detail 可读真实数据。

Sprint 4：
- 实现 AI meal analysis service。
- 增加 AI JSON schema 校验。
- 保存 analysis。
- 处理失败、低置信度、mock fallback。

Sprint 5：
- Feedback、Report、Draw Card 持久化。
- Correction diff 持久化。
- 刷新后数据仍可查看。

Sprint 6：
- RLS/隐私/文案安全检查。
- 补充验收说明。
- 最终运行 lint/typecheck/test。

如果需要以下任一事项，必须暂停问我：
- 新增原生依赖。
- 接入真实 AI secret 的客户端方案。
- 修改 app 原生权限。
- 修改工程架构。
- 删除或重写旧文档总纲。
- 引入 FastAPI、pgvector、SQLite、Health Connect、推送通知。
```

