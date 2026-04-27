# Codex Bootstrap Prompt

请你作为《干饭》项目的开发 Agent 执行工程入场任务。

## 任务目标

搭建一个可运行、可测试、可通过 EAS Update 热更新的 React Native + Expo 工程底座。

注意：本任务不是开发完整 MVP 业务，只做工程入场。

## 必读文件

请先阅读：

1. `AGENTS.md`
2. `START_HERE.md`
3. `01_product/product-north-star.md`
4. `02_architecture/technical-architecture.md`
5. `02_architecture/mobile-platform-strategy.md`
6. `02_architecture/release-update-strategy.md`
7. `02_architecture/devops-cicd.md`
8. `03_prd/mvp-0.1/mvp-0.1-prd-v0-prototype.md`

## 开发范围

请完成：

1. 初始化 Expo + TypeScript 项目
2. 配置 Expo Router
3. 建立 `src/` 分层目录
4. 建立基础 Design Tokens
5. 建立基础通用组件：
   - BaseCard
   - PrimaryButton
   - EmptyState
   - LoadingState
6. 建立 5 个页面壳：
   - 首页
   - 记录页
   - 详情页
   - 历史页
   - 我的页
7. 页面使用 Mock 数据，不接真实后端
8. 配置 `eas.json`
9. 配置 `expo-updates`
10. 配置 GitHub Actions CI
11. 输出运行说明
12. 输出下一步 MVP 0.1 业务开发建议

## 不做范围

禁止做：

1. 完整饮食记录业务
2. 真实 AI 接口
3. 真实支付
4. 复杂用户系统
5. 原生插件扩展
6. 大量 UI 自由发挥

## 验收标准

1. `npm install` 成功
2. `npm run typecheck` 通过
3. `npm run lint` 尽量通过，如需调整说明原因
4. `npm run test` 可执行
5. `expo start` 可启动
6. Android 可预览运行
7. EAS preview channel 配置存在
8. 修改一个页面文案后，可以通过 EAS Update 发布 preview 更新
9. README 中说明如何运行、如何发布 preview update

## 输出要求

完成后请输出：

1. 修改文件清单
2. 架构说明
3. 运行命令
4. 测试命令
5. 热更新命令
6. 当前未完成事项
7. 是否需要人工配置 GitHub Secrets / Expo Project ID


## 种子包迁移要求

如果当前仓库中存在外层目录 `ganfan_ai_native_dev_entry` 或 `ganfan_ai_native_dev_entry_v2`：

1. 读取其中所有已有内容。
2. 保留已有文档。
3. 将其内部内容迁移到仓库根目录。
4. 确保 `AGENTS.md`、`package.json`、`app.json`、`eas.json` 位于仓库根目录。
5. 确保存在 `04_prototype/mvp-0.1/`，且其中说明文件非空。

不要重新生成一套空架构。
