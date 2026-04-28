# 干饭

干饭是一款 AI 饮食决策 App，目标是帮助用户记录饮食、判断当天饮食状态，并给出下一餐可执行建议。

## Current Status

当前阶段：MVP 0.0 工程入场。

现在不要直接开发完整 MVP 0.1 业务闭环。当前优先目标是完成可运行、可测试、可通过 EAS Update 热更新的移动端工程底座。

开发状态和阶段计划见：

- `docs/PROJECT_STATUS.md`

## Development Entry

1. 先看 `docs/PROJECT_STATUS.md`，确认当前阶段和下一步。
2. 再看 `START_HERE.md` 和 `AGENTS.md`，确认开发约束。
3. 工程任务看 `05_ai-coding/mvp-0.0-engineering-entry.md`。
4. MVP 0.1 业务开发必须等 `03_prd/mvp-0.1/mvp-0.1-prd-v1-coding.md` 回填完成。

## Commands

```powershell
npm install
npm run lint
npm run typecheck
npm test
npm start
```

Preview OTA update:

```powershell
npm run eas:update:preview
```

## Project Map

```text
app/               Expo Router entry files
src/               App code: components, screens, services, styles, types
01_product/        Product north star and roadmap
02_architecture/   Technical architecture and platform strategy
03_prd/            MVP PRDs
04_prototype/      Prototype outputs and page flow
05_ai-coding/      AI coding tasks and task breakdown
06_delivery/       Release checklist and acceptance docs
docs/              Current project status and engineering notes
```

## MVP Direction

- MVP 0.0: engineering entry and release/update pipeline.
- MVP 0.1: diet logging loop after prototype and PRD V1 are confirmed.
- MVP 0.2: AI next-meal advice.
- MVP 0.3: trend review and diet recap.
- MVP 1.0: personal diet decision system.

## Current Blockers Before MVP 0.1

- Stabilize Android emulator or connect a physical Android device for preview verification.
- Expo project is linked as `@ls-n/ganfan`.
- GitHub Actions EAS preview update from `dev` is verified.
- Confirm MVP 0.1 prototypes and fill PRD V1 before business development.
