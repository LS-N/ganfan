# Phase 0: 工程底座与基础组件库

来源：`docs/02-master-blueprint.md` 的 `Sprint 0 — 工程底座与基础组件库`。

## 阶段目标

搭建可运行、可测试、可持续部署的工程底座，建立主题系统和基础组件库，确保后续 MVP 1.0 到 5.0 的开发不再重复搭建基础设施。

## 范围

- 工程初始化。
- 移动端主题 token。
- 基础组件库。
- CI、类型检查、测试基础。
- 环境变量样例。

## 任务拆解

| 任务 | 开发目标 | 交付物 |
|---|---|---|
| Sprint 0-01 | 初始化 Expo / React Native 工程 | 可运行的移动端工程、基础路由、TypeScript 配置 |
| Sprint 0-02 | 建立主题系统 | 色彩、字体、间距、圆角 token |
| Sprint 0-03 | 建立基础组件库 | Button、Card、Input、Tag、Loading、Empty、Error 等基础组件 |
| Sprint 0-04 | 建立测试与质量门禁 | lint、typecheck、test 命令和 CI 基础 |
| Sprint 0-05 | 建立环境变量规范 | `.env.example`，禁止真实密钥进入代码 |

## 非目标

- 不接真实 AI。
- 不创建生产 Supabase migration。
- 不实现业务闭环。
- 不新增蓝图外的页面或服务。

## 关联验收

见 `docs/acceptance/phase-0-acceptance.md`。
