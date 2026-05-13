# AI 工作手册

## 工作原则

任何开发任务都必须先回到 `docs/02-master-blueprint.md`，再进入对应阶段开发文档和验收文档。不得绕过蓝图单独发明页面、字段、服务、任务或阶段。

## 阅读顺序

1. `docs/00-INDEX.md`
2. `docs/02-master-blueprint.md`
3. 当前阶段开发文档：`docs/phases/phase-*.md`
4. 当前阶段验收文档：`docs/acceptance/phase-*.md`
5. 默认原型：`docs/prototype/meal-agent-product-prototype.html`
6. 当前用户指令

## 开发前确认

执行代码修改前必须完成：

- 读取现有代码实现方式。
- 判断任务属于哪个 MVP / Sprint / 任务编号。
- 明确是否需要原生依赖、数据库 migration、AI secret、FastAPI、Supabase 或部署配置。
- 若涉及新增原生依赖、迁移 monorepo、接真实 AI secret、创建 FastAPI 服务、创建 Supabase migrations，必须先得到用户明确批准。

## 阶段文档使用规则

- 阶段开发文档只定义目标、范围、任务和交付物。
- 阶段验收文档只定义完成标准、检查命令、数据验收和风险。
- 当阶段文档与总蓝图冲突时，以 `docs/02-master-blueprint.md` 为准，并先修正文档，不直接写代码。
- `_archive/` 只能作为历史参考。

## 交付要求

每次完成任务后必须说明：

- 改了哪些文件。
- 为什么这样改。
- 如何运行。
- 如何测试。
- 是否影响 Android/iOS。
- 是否影响热更新。
- 是否需要重新打包。

## 当前工程边界

当前正式工作区是 `F:\ganfan`。正式代码只在根目录 `app/` 和 `src/` 开发，除非用户批准迁移到蓝图中的 `apps/mobile/ + services/ai/ + supabase/` 结构。
