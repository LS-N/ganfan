# 资源与密钥索引

本文件是当前唯一资源索引。它告诉 AI 和开发者“需要什么资源、真实值放哪里、如何验证”，但不记录任何真实密钥。

## 更新记录

| 更新时间 | 更新人员 | 更新背景 | 更新内容 |
|---|---|---|---|
| 2026-05-16 00:14:25 +08:00 | Codex | 机制评审发现资源索引状态落后于 `docs/CURRENT_WORK.md` 和任务日志中的真实联调进度，后续 AI 容易重复判断 Supabase、pgvector、营养库、AI provider、Android 真机仍完全未验证。 | 同步 Phase 1 资源状态：远端 migrations、Storage bucket/policy、nutrition embeddings、SiliconFlow provider、Android adb 和本机 env 均记录为已验证或部分验证；仍保留真机 UI 完整闭环、短信 Hook、iOS 和 24 小时稳定性为待验收。 |
| 2026-05-14 16:11:01 +08:00 | Codex | 开发过程中发现 Supabase、AI Key、营养库、CLI、Android 真机等前置资源没有统一记录位置，导致 AI 开发到一半才发现阻塞。 | 创建第一版资源索引，定义资源记录格式、安全规则、当前 Phase 1 所需资源、存放位置、验证方式和缺失降级策略。 |

## 全局安全规则

- 禁止在本文件记录真实密码、token、API key、service role key、数据库密码、私钥。
- 禁止提交 `.env`、`.env.local`、`.env.*.local`。
- 移动端 Expo 环境只能放公开变量，例如 `EXPO_PUBLIC_SUPABASE_URL` 和 `EXPO_PUBLIC_SUPABASE_ANON_KEY`。
- `SUPABASE_SERVICE_ROLE_KEY`、`ANTHROPIC_API_KEY`、`OPENAI_API_KEY`、数据库密码只能放服务端或本机安全环境，不能进入移动端 Expo 环境。
- AI 需要真实值时，只能要求用户把值写入指定本地文件或 secrets，不得要求用户把真实密钥写进文档。
- 验收时只能写“已配置/未配置/已验证/未验证”，不得回显真实值。

## 本地存放约定

| 资源类型 | 本地位置 | 是否提交 Git | 说明 |
|---|---|---|---|
| 移动端公开环境变量 | `F:\ganfan\.env` | 禁止 | 仅允许 `EXPO_PUBLIC_*`，不得放 service role、AI key、数据库密码。 |
| 移动端示例变量 | `F:\ganfan\.env.example` | 允许 | 只放变量名和空值/安全示例。 |
| AI 服务私密变量 | `F:\ganfan\services\ai\.env` | 禁止 | 放 Supabase service role、Anthropic/OpenAI key 等后端变量。 |
| AI 服务示例变量 | `F:\ganfan\services\ai\.env.example` | 允许 | 只放变量名和空值/安全示例。 |
| Supabase CLI 本地配置 | `F:\ganfan\supabase\config.toml` | 允许，前提是不含真实 secret | CLI 项目配置，不得包含 access token、数据库密码。 |
| 密码管理器 | 用户指定 | 不适用 | 推荐存放真实账号密码和长期 token。 |
| EAS Secrets | Expo/EAS 控制台 | 不适用 | 生产/预览构建需要的 secret 应进入 EAS secrets。 |

## 当前资源清单

### Supabase 项目

| 字段 | 内容 |
|---|---|
| 用途 | Auth、PostgreSQL、Storage、RLS、pgvector、远端 migrations |
| 环境 | development / preview，production 待用户明确确认 |
| 用户需提供 | Project URL、Anon Key、Service Role Key、Project Ref、数据库密码、数据库区域、是否允许执行 migrations、是否允许创建 bucket、是否允许开启 pgvector |
| AI 可准备 | migrations、seed、RLS 检查 SQL、Dashboard 手动执行方案、CLI 验证命令 |
| 真实值位置 | 移动端公开值放根目录 `.env`；service role 和数据库密码放 `services/ai/.env` 或用户密码管理器 |
| 禁止事项 | Service Role Key 不得进入 Expo 环境；不得提交 `.env`；不得在日志中打印完整 key |
| 当前状态 | PARTIAL：远端 direct DB URL 已执行 Phase 1 migrations，真实项目 ref 已用于数据层推进；CLI access token 曾被 CLI 判定格式无效，后续 Management API / linked workflow 仍需重新生成 token 并验收 |

建议变量：

```text
# F:\ganfan\.env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=

# F:\ganfan\services\ai\.env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

验证方式：

```powershell
git status --short
npx supabase --version
npx supabase link --project-ref <project-ref>
npx supabase db push
```

验收口径：

- migrations 在真实项目执行成功才可标记 `PASS`。
- 仅生成 SQL 文件但未执行，标记 `PARTIAL`。
- 缺少 project ref、DB password 或 CLI 不可用，标记 `FAIL` 或 `PARTIAL`，并说明阻塞。

### Supabase Storage

| 字段 | 内容 |
|---|---|
| 用途 | 餐食图片上传和后续 AI 识别 |
| 用户需提供 | 是否允许创建 bucket、bucket 命名确认 |
| 目标 bucket | `meal-photos` |
| AI 可准备 | bucket 创建 SQL/脚本、Storage policy、上传验收步骤 |
| 真实值位置 | 不需要额外 secret，依赖 Supabase 项目配置 |
| 当前状态 | PARTIAL：`meal-photos` bucket 和 Storage policies 已在真实项目创建；本机合成餐图上传、signed URL 生成和后端 vision 调用已验证；移动端 UI 内实拍上传和完整保存链路仍待真机验收 |

验收口径：

- bucket 已创建并能按 RLS 上传/读取测试图片才可标记 `PASS`。
- 只写 policy 或脚本但未执行，标记 `PARTIAL`。

### pgvector / vector 扩展

| 字段 | 内容 |
|---|---|
| 用途 | 营养库 embedding 检索和相似菜品召回 |
| 用户需提供 | 是否允许在 Supabase 项目开启 vector / pgvector 扩展 |
| AI 可准备 | extension migration、embedding 表结构、索引、回退检索策略 |
| 当前状态 | PASS：真实数据库已启用 vector，`nutrition_items.embedding` 1660/1660 非空；`东坡肉` pgvector 查询 Top1 命中 `红烧肉`，score 约 0.9314 |

验收口径：

- 真实数据库 `vector` 扩展可用且向量列/索引创建成功才可标记 `PASS`。
- 无 OpenAI key 时可使用 mock embedding，但向量搜索验收只能标记 `PARTIAL`。

### 营养库数据

| 字段 | 内容 |
|---|---|
| 用途 | 常见中国菜营养估算、别名匹配、份量换算、embedding 检索 |
| 用户需提供 | 至少 1000 条常见中国菜营养数据 CSV，或确认先用小 seed / mock 数据跑通 |
| 建议字段 | 菜名、别名、菜系、分类、每 100g 营养、典型份量、数据来源 |
| AI 可准备 | CSV schema、导入脚本、小样本 seed、数据质量检查脚本 |
| 真实值位置 | 数据文件可放 `supabase/seeds/` 或用户指定位置；大体量数据是否提交需单独确认 |
| 当前状态 | PARTIAL：真实项目已导入 1660 条，其中中国食物成分库 1657 条，embedding 已回填；生产使用前仍需确认数据授权、质量和再分发边界 |

验收口径：

- 真实导入 `nutrition_items >= 1000` 且来源字段完整才可标记 `PASS`。
- 小 seed 或 mock 数据只能标记 `PARTIAL`。

### AI Provider 密钥

| 字段 | 内容 |
|---|---|
| 用途 | 真实图片识别、chat completions、embedding |
| 用户需提供 | 当前已按 SiliconFlow OpenAI-compatible provider 推进；如切换 Anthropic/OpenAI，需另行提供对应 key |
| AI 可准备 | `.env.example`、provider 抽象、mock provider、接口验收 |
| 真实值位置 | `F:\ganfan\services\ai\.env` 或后端 secrets；不得进入根目录 `.env` 的 `EXPO_PUBLIC_*` |
| 当前状态 | PARTIAL：本机 `services/ai/.env` 已配置真实 provider 所需变量且不提交；SiliconFlow `/v1/embeddings`、`/v1/chat/completions` 和 vision 分析已验证；移动端 UI 内完整实拍链路仍待验收 |

建议变量：

```text
# F:\ganfan\services\ai\.env
SILICONFLOW_API_KEY=
SILICONFLOW_BASE_URL=
SILICONFLOW_CHAT_MODEL=
SILICONFLOW_EMBEDDING_MODEL=
AI_PROVIDER=
```

验收口径：

- 真实 provider 请求成功且日志不泄露 raw response/图片隐私才可标记 `PASS`。
- mock provider 通过只能标记 `PARTIAL`。

### Android 真机 / adb

| 字段 | 内容 |
|---|---|
| 用途 | 相机、通知、SQLite、离线、APK 安装、24 小时稳定性验收 |
| 用户需提供 | Android 真机，或可用模拟器；如需自动安装，需本机可用 `adb` |
| AI 可准备 | APK 安装命令、验收清单、日志采集命令 |
| 当前状态 | PARTIAL：Android Platform Tools 已定位，真机 `PJZ110` / adb device `4e5d253e` 可见；adb reverse、App 启动、快速重启脚本已验证；相机/通知/SQLite/离线恢复/24 小时稳定性仍待完整验收 |

验证方式：

```powershell
adb devices
adb install path\to\app.apk
adb logcat
```

验收口径：

- 真机安装、权限、相机、通知、SQLite、离线/恢复同步通过才可标记 `PASS`。
- 无真机或无 adb 时只能标记 `PARTIAL`。

### EAS / Expo

| 字段 | 内容 |
|---|---|
| 用途 | Android/iOS preview build、production build、热更新 |
| 用户需提供 | Expo/EAS 登录状态、项目权限、必要 secrets |
| AI 可准备 | build profile 检查、preview build、build 结果记录 |
| 当前状态 | PARTIAL：Android preview build 已有历史产物，EAS update 脚本存在；iOS 构建、生产发布和真实设备矩阵仍待后续验收 |

验证方式：

```powershell
npx eas-cli whoami
npx eas-cli project:info
npx eas-cli build --profile preview --platform android
```

验收口径：

- build 成功只代表云构建通过，不代表真机功能验收通过。

## 阶段开始前资源 Gate 模板

```text
## 前置资源 Gate

### 用户必须提供
- [ ] 资源名称：
- [ ] 真实值存放位置：
- [ ] 是否允许执行真实环境操作：

### AI 可以准备
- [ ] 示例 env：
- [ ] migration / seed / 脚本：
- [ ] mock fallback：
- [ ] 验收命令：

### 当前状态
- [ ] 已配置：
- [ ] 未配置：
- [ ] 已验证：
- [ ] 未验证：

### 缺失降级策略
- 无资源时：
- mock 是否允许：
- 验收标记：
```
