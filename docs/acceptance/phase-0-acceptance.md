# Phase 0 验收标准

来源：`docs/02-master-blueprint.md` 的 `Sprint 0 验收标准`。

## 完成标准

- App 可以在本地启动。
- TypeScript 编译通过。
- lint 通过。
- 基础测试命令可运行。
- 主题 token 和基础组件可被后续页面复用。
- `.env.example` 存在且不包含真实密钥。

## 检查命令

```powershell
npm install
npm run lint
npm run typecheck
npm test
npm run web
```

## 阻断条件

- 存在真实密钥。
- 基础组件没有统一 token。
- 后续页面必须重复定义基础样式才能开发。
