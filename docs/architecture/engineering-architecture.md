# 干饭 · 工程架构

> 管：系统架构图 / 技术栈 / 仓库结构 / CI/CD / 开发规范 / 环境变量。不管：安全配置（→ security-architecture.md）、监控（→ observability.md）、UI token（→ ui-system.md）。

---

## 一、定位与边界

本文档是干饭项目工程实现的权威参考，覆盖从代码组织到部署流水线的完整工程决策。安全配置、可观测性、UI 设计系统各有独立文档承载，本文不重复。

---

## 二、核心原则

1. **本地优先**：所有写操作先写 SQLite，再后台同步 Supabase
2. **离线可用**：无网络时拍照记录功能必须正常运行
3. **Schema 稳定**：1.0 建立的表结构不得破坏性修改，只能新增列/表
4. **类型安全**：所有 TypeScript 代码必须无类型错误才能提交
5. **移动端只暴露 EXPO_PUBLIC_***：私密变量只在 FastAPI 和 EAS Secrets 中
6. **不擅自迁移工程目录**：当前根目录 src/ + app/ 过渡态，迁移需用户明确批准

---

## 三、架构内容

### 3.1 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                  React Native App (Expo)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │  Home    │  │  Camera  │  │ History  │  │  Profile  │  │
│  └──────────┘  └──────────┘  └──────────┘  └───────────┘  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │ Feedback │  │ Checkin  │  │  Plan    │  │  Insight  │  │
│  └──────────┘  └──────────┘  └──────────┘  └───────────┘  │
│                                                             │
│  stores/ (Zustand)          db/ (expo-sqlite)              │
│  useMealStore               本地优先写入                    │
│  useProfileStore            后台同步 Supabase               │
│  usePlanStore                                               │
│                                                             │
│  src/services/ai/ ◄── AI 服务层（统一 executeUseCase）      │
└──────────────┬──────────────────────────┬───────────────────┘
               │ Supabase JS SDK          │ HTTPS
               ↓                          ↓
┌──────────────────────┐    ┌─────────────────────────────────┐
│      Supabase        │    │      FastAPI AI Service          │
│  PostgreSQL          │    │  POST /v1/uc/{uc_name}    ←──┐  │
│  Auth (phone/email)  │    │  GET  /v1/uc                  │  │
│  Storage (images)    │    │                               │  │
│  Realtime            │    │  use_cases/ (UC Registry)     │  │
│  Row Level Security  │    │  providers/ (Provider 抽象)   │  │
│  pgvector (营养库)   │◄───│  nutrition/ (pgvector 客户端) ┘  │
└──────────────────────┘    │                                 │
                            │  ↕ LLM Provider 抽象层           │
                            │    （SiliconFlow / Claude /      │
                            │     OpenAI / Mock）              │
                            └─────────────────────────────────┘

餐次分析流程（UC-01 v1.0 单次调用 / Phase 2 升级 v2.0 两阶段）：
  v1.0: 图片 + UserContext + insights → Provider Vision → 完整 MealAnalysisResponse
                                          ↓
                            UC-05 nutrition_match → pgvector 回填精准营养
  v2.0: 拆为 Phase A 快速识别（≤6s 返回核心字段）+ Phase C 异步补全建议

详细 AI 调用规范见「AI 服务层架构」章节。
```

### 3.2 完整技术栈

| 层级 | 技术 | 版本 | 用途 |
|------|------|------|------|
| 移动端框架 | React Native | 0.74+ | 跨平台基础 |
| 构建工具 | Expo SDK | 51+ | Android/iOS构建 |
| 路由导航 | Expo Router | 3.x | 文件路由 |
| 状态管理 | Zustand | 4.x | 全局状态 |
| 本地数据库 | expo-sqlite | 13+ | 离线存储 |
| 网络请求 | @supabase/supabase-js | 2.x | 后端通信 |
| | axios | 1.x | AI服务通信 |
| 图片处理 | expo-image-manipulator | 12+ | 压缩/裁剪 |
| 相机 | expo-camera | 15+ | 拍照 |
| 通知 | expo-notifications | 0.28+ | 本地+推送 |
| 后端平台 | Supabase | cloud | DB+Auth+Storage |
| AI服务 | FastAPI | 0.111+ | Python AI逻辑 |
| AI模型 | LLM Provider 抽象 | 当前实装 SiliconFlow（Qwen3-VL-32B + BAAI/bge-m3） | 图像识别+推理 + Embedding；可切换 Claude/OpenAI/其他 |
| 部署平台 | Railway | - | FastAPI托管 |
| 代码语言 | TypeScript | 5.x | 移动端 |
| | Python | 3.11+ | AI服务 |
| 数据库 | PostgreSQL | 15+ | 云端主库 |
| 向量搜索 | pgvector | 0.7+ | 营养库语义检索（Supabase内置） |
| 包管理 | pnpm | 9+ | Monorepo |

### 3.3 仓库结构（目标态）

```
ganfan/
├── .github/
│   └── workflows/
│       ├── mobile-build.yml             ← EAS Build CI
│       └── ai-service-deploy.yml        ← Railway 部署
├── apps/
│   └── mobile/                          ← React Native App
│       ├── app/                         ← Expo Router 页面
│       │   ├── (tabs)/
│       │   │   ├── _layout.tsx          ← 底部导航配置
│       │   │   ├── index.tsx            ← 首页
│       │   │   ├── camera.tsx           ← 拍照记录
│       │   │   ├── history.tsx          ← 历史记录
│       │   │   └── profile.tsx          ← 个人档案
│       │   ├── onboarding/
│       │   │   ├── index.tsx            ← 欢迎页
│       │   │   ├── basic-info.tsx       ← 基础信息填写
│       │   │   └── goals.tsx            ← 目标设置
│       │   ├── feedback.tsx             ← 饭后反馈
│       │   ├── meal-detail.tsx          ← 餐次详情
│       │   ├── plan.tsx                 ← 餐饮计划(2.0)
│       │   ├── insight.tsx              ← 身体洞察(3.0)
│       │   └── _layout.tsx              ← 根布局+Auth守卫
│       ├── components/
│       │   ├── MealCard.tsx
│       │   ├── RecoCard.tsx
│       │   ├── BodyPuzzle.tsx
│       │   ├── NutritionBar.tsx
│       │   └── WeightChart.tsx
│       ├── stores/
│       │   ├── useMealStore.ts
│       │   ├── useProfileStore.ts
│       │   ├── useCheckinStore.ts
│       │   └── usePlanStore.ts
│       ├── db/
│       │   ├── schema.ts                ← SQLite表定义
│       │   ├── migrations/              ← 版本化迁移
│       │   ├── meals.ts                 ← 餐次查询函数
│       │   └── sync.ts                  ← 本地↔Supabase同步
│       ├── api/
│       │   ├── supabase.ts              ← Supabase客户端
│       │   └── ai-service.ts            ← FastAPI客户端
│       ├── utils/
│       │   ├── imageCompress.ts
│       │   ├── dateHelpers.ts
│       │   └── nutritionCalc.ts
│       ├── constants/
│       │   ├── cuisineMap.ts
│       │   └── unlockThresholds.ts      ← 功能解锁条件
│       ├── app.json
│       ├── eas.json
│       └── package.json
├── services/
│   └── ai/                              ← FastAPI AI Service
│       ├── main.py                      ← 应用入口
│       ├── config.py                    ← 环境变量
│       ├── routers/
│       │   ├── analyze.py               ← 餐次图像分析
│       │   ├── plan.py                  ← 计划生成
│       │   ├── pattern.py               ← BodyPattern计算
│       │   ├── predict.py               ← 预测引擎
│       │   └── insight.py               ← 洞察生成
│       ├── models/
│       │   ├── meal.py                  ← Pydantic模型
│       │   ├── pattern.py
│       │   └── prediction.py
│       ├── algorithms/
│       │   ├── rules.py                 ← 1.0规则引擎
│       │   ├── dish_score.py            ← 2.0偏好模型
│       │   ├── body_pattern.py          ← 3.0规律模型
│       │   ├── predictor.py             ← 4.0预测模型
│       │   └── collaborative.py         ← 5.0协同过滤
│       ├── nutrition/
│       │   ├── search.py                ← pgvector语义搜索营养库
│       │   └── embedder.py              ← 菜品名称→向量（text-embedding-3-small）
│       ├── context/
│       │   └── builder.py               ← 个人上下文包构建
│       ├── requirements.txt
│       ├── Dockerfile
│       └── railway.json
├── supabase/
│   ├── migrations/
│   │   ├── 000_pgvector_nutrition.sql   ← 营养向量库（最先执行）
│   │   ├── 001_core_tables.sql          ← 1.0表
│   │   ├── 002_planning_tables.sql      ← 2.0表
│   │   ├── 003_pattern_tables.sql       ← 3.0表
│   │   ├── 004_prediction_tables.sql    ← 4.0表
│   │   └── 005_community_tables.sql     ← 5.0表
│   ├── seed.sql                         ← 测试数据
│   └── nutrition_seed/
│       └── cn_nutrition_db.csv          ← 中国食物营养数据（待采购/整理）
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── ALGORITHMS.md
│   └── DEVELOPMENT.md
├── CLAUDE.md                            ← AI开发规范
└── package.json                         ← pnpm workspace
```

### 3.4 当前过渡态

**当前实际工作区**：`F:\ganfan`，正式代码在根目录 `app/` 和 `src/`（不是 apps/mobile/）

**过渡态 → 目标态迁移条件**（满足以下全部条件 + 用户明确批准后才迁移）：

- FastAPI 需要独立部署到 Railway（services/ai/ 独立服务）
- Supabase migrations 需要版本化管理（supabase/ 独立目录）
- 引入 pnpm workspace（monorepo 多包管理）
- 当前不迁移，在根目录 src/ + app/ 开发

**禁止**：未经用户批准擅自移动工程目录；不在 .claude/worktrees 或 Codex 临时 worktree 中作为主路径开发。

### 3.5 开发规范

#### 架构原则

1. 本地优先：所有写操作先写 SQLite，再后台同步 Supabase
2. 离线可用：无网络时拍照记录功能必须正常运行
3. Schema 稳定：1.0 建立的表结构不得破坏性修改，只能新增列/表
4. 类型安全：所有 TypeScript 代码必须无类型错误才能提交

#### 文件命名规范

- 组件：`PascalCase.tsx`
- 工具函数：`camelCase.ts`
- 数据库查询：动词+名词（`getMealsByDate`、`insertFeedback`）

#### 算法服务规则

- 所有算法逻辑在 FastAPI `services/ai/` 中实现，禁止在移动端做算法计算
- 每个算法函数必须有单元测试

#### 提交规范

```
feat(scope):  新功能
fix(scope):   修复
chore(scope): 日常维护
docs(scope):  文档变更
data(scope):  数据库变更
algo(scope):  算法变更
```

### 3.6 环境变量分层

| 类型 | 文件/位置 | 用途 | 是否提交 |
|---|---|---|---|
| 本地开发 | `.env`（gitignored） | 移动端调试 + FastAPI 本地 | 否 |
| 移动端公开 | `EXPO_PUBLIC_*` | App 打包时嵌入（受 RLS 保护） | 只提交 .env.example |
| FastAPI 私密 | `services/ai/.env`（gitignored） | AI key / DB password 等 | 否 |
| 生产构建 | EAS Secrets | App Store / Play Store 构建 | — |
| FastAPI 生产 | Railway 环境变量 | 生产 FastAPI 部署 | — |
| 模板 | `.env.example` | 变量名清单，无真实值 | 是 |

#### services/ai/.env.example

```bash
# Anthropic Claude API
ANTHROPIC_API_KEY=sk-ant-api03-xxx

# OpenAI（仅用于 embedder.py 批量生成营养库向量，其余 AI 功能不使用）
OPENAI_API_KEY=sk-xxx

# Supabase（后端服务账号，绕过 RLS，只在 FastAPI 中使用，绝不暴露给客户端）
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxx
SUPABASE_JWT_SECRET=your-jwt-secret   # Supabase Dashboard → Settings → API → JWT Secret

# 服务配置
AI_ENV=development                    # development | production
PORT=8000
ALLOWED_ORIGINS=http://localhost:8081,exp://localhost:8081
```

#### apps/mobile/.env.example

```bash
# Supabase（前端只用 Anon Key，受 RLS 保护）
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxx

# FastAPI AI 服务地址
EXPO_PUBLIC_AI_SERVICE_URL=http://localhost:8000   # 本地开发
# 生产环境改为: EXPO_PUBLIC_AI_SERVICE_URL=https://ai.your-domain.railway.app

# 错误监控（Sprint 6 后填入）
EXPO_PUBLIC_SENTRY_DSN=https://xxx@o0.ingest.sentry.io/xxx
```

**安全原则：**
- `SERVICE_ROLE_KEY` 和 `JWT_SECRET` 只在 FastAPI 后端使用，永远不写入移动端
- 移动端只持有 `ANON_KEY`，所有数据访问受 RLS 限制
- CI/CD 中通过 GitHub Secrets 注入，变量名与 `.env.example` 一致

### 3.7 CI/CD 流水线

#### .github/workflows/mobile-ci.yml

```yaml
name: Mobile CI

on:
  push:
    branches: [main, dev]
  pull_request:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: apps/mobile
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: apps/mobile/package-lock.json
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm test -- --watchAll=false --passWithNoTests

  eas-preview-update:
    needs: check
    if: github.ref == 'refs/heads/dev' && github.event_name == 'push'
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: apps/mobile
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install -g eas-cli
      - run: npm ci
      - run: |
          eas update \
            --branch preview \
            --message "${{ github.event.head_commit.message }}" \
            --non-interactive
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
          EXPO_PUBLIC_SUPABASE_URL: ${{ secrets.EXPO_PUBLIC_SUPABASE_URL }}
          EXPO_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.EXPO_PUBLIC_SUPABASE_ANON_KEY }}
          EXPO_PUBLIC_AI_SERVICE_URL: ${{ secrets.EXPO_PUBLIC_AI_SERVICE_URL }}
```

#### .github/workflows/ai-service-deploy.yml

```yaml
name: AI Service Deploy

on:
  push:
    branches: [main]
    paths:
      - 'services/ai/**'

jobs:
  test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: services/ai
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'
      - run: pip install -r requirements.txt
      - run: pytest tests/ -v --tb=short
        env:
          AI_ENV: test
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Railway
        run: |
          curl -fsSL https://railway.app/install.sh | sh
          railway up --service ai-service --detach
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

#### GitHub Secrets 需要配置的变量

| Secret 名称 | 用途 | 来源 |
|------------|------|------|
| `EXPO_TOKEN` | EAS Update 鉴权 | expo.dev → Access Tokens |
| `EXPO_PUBLIC_SUPABASE_URL` | 移动端 Supabase 地址 | Supabase Dashboard |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | 移动端 Supabase 公钥 | Supabase Dashboard |
| `EXPO_PUBLIC_AI_SERVICE_URL` | 生产环境 FastAPI 地址 | Railway 部署后获取 |
| `SUPABASE_URL` | AI 服务 Supabase 地址 | Supabase Dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | AI 服务管理员密钥 | Supabase Dashboard → API |
| `RAILWAY_TOKEN` | Railway 部署凭证 | railway.app → Account Settings |

---

## 四、Phase 演进

| Phase | 工作区状态 | 部署状态 |
|---|---|---|
| Phase 1（当前） | 根目录过渡态（app/ + src/）| 本地 FastAPI + Supabase cloud + 真机 ADB 调试 |
| Phase 2 | FastAPI 迁到 services/ai/ | Railway 部署（触发迁移条件①） |
| Phase 3+ | 完整 monorepo（apps/mobile/ + services/ai/） | 视情况迁移（需用户批准） |

---

## 五、禁止事项

- 禁止在 .claude/worktrees 或 Codex 临时 worktree 中写正式代码
- 禁止真实密钥入仓库（.env 已在 .gitignore）
- 禁止跳过 lint/typecheck/test
- 禁止未经用户批准迁移目录
- 禁止写死 Android-only 业务逻辑
- 禁止破坏既有 Schema（只能新增，不能删改）

---

## 六、变更记录

| 日期 | 任务编号 | 变更 |
|---|---|---|
| 2026-06-03 | ##045 | 初版落盘，从蓝图 L859-L1031 + L2568-L2640 + L2732-L2845 迁出，新增过渡态 → 目标态迁移条件 + 环境变量分层表 |
