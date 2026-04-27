# Codex 指令：使用已有种子包初始化 GitHub 仓库

## 任务目标

你将收到一个已有种子包目录：

`ganfan_ai_native_dev_entry_v2/`

请不要从零重新编写文档，不要创建空文件。

你的任务是：

1. 读取种子包内已有内容。
2. 保留所有已有文档与配置。
3. 将种子包内所有内容迁移到当前 GitHub 仓库根目录。
4. 删除或忽略多余外层目录。
5. 补齐 Expo + React Native + TypeScript 工程，使仓库具备 MVP 0.0 工程入场能力。
6. 完成后创建 Pull Request。

## 根目录必须存在

最终仓库根目录必须直接看到：

```text
AGENTS.md
README.md
START_HERE.md
package.json
app.json
eas.json
.env.example
.gitignore
.github/
01_product/
02_architecture/
03_prd/
04_prototype/
05_ai-coding/
06_delivery/
docs/
src/
```

## 必须保留

必须保留并尊重以下文档：

- `AGENTS.md`
- `START_HERE.md`
- `01_product/product-north-star.md`
- `02_architecture/technical-architecture.md`
- `02_architecture/ui-design-system.md`
- `02_architecture/component-spec.md`
- `03_prd/mvp-0.1/mvp-0.1-prd-v0-prototype.md`
- `03_prd/mvp-0.1/mvp-0.1-prd-v1-coding.md`
- `04_prototype/mvp-0.1/README.md`
- `05_ai-coding/codex-bootstrap-prompt.md`

## 本次允许做

- 修正仓库目录结构
- 初始化 Expo + React Native + TypeScript 工程
- 创建基础页面壳
- 创建基础组件壳
- 创建 Mock 数据
- 配置 lint / typecheck / test
- 配置 GitHub Actions
- 保留 EAS Update 预留配置
- 更新 README 的运行说明

## 本次禁止做

- 禁止开发完整 MVP 0.1 饮食业务闭环
- 禁止接真实后端
- 禁止接真实 AI 服务
- 禁止接支付
- 禁止新增复杂原生插件
- 禁止覆盖已有文档为简化版
- 禁止创建空文档

## MVP 0.0 验收标准

1. `npm install` 成功。
2. `npm run typecheck` 可执行。
3. `npm run lint` 可执行。
4. `npm test` 可执行。
5. `npm run start` 可启动 Expo。
6. Android 可预览。
7. 仓库根目录结构正确。
8. `04_prototype` 已存在且内容非空。
9. PR 描述包含：变更范围、运行命令、测试结果、下一步建议。
