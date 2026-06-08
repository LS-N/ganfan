# 干饭 · 安全/权限架构

> 管：Supabase Auth + 完整 RLS 策略 + FastAPI 安全（JWT/速率限制/CORS）+ 密钥管理规则 + MCP OAuth scope。不管：业务级权限（付费用户可见功能 → 业务方案）、隐私文案（→ 法务）。
> **安全红线**：真实密钥永不入仓库；Layer 1 原始数据永不对外暴露；RLS 必须覆盖所有表。

---

## 一、定位与边界

本文档描述干饭项目的安全与权限架构，覆盖以下范围：

- **Supabase Auth**：用户身份体系（Phone OTP / Email / Guest / OAuth）
- **RLS 行级安全策略**：所有 Supabase 数据表的访问控制 SQL
- **FastAPI 安全规范**：JWT 验证中间件 + slowapi 速率限制 + Pydantic 输入校验
- **密钥管理规范**：各类密钥的存放位置与可见性规则
- **MCP OAuth scope**：外部 Agent 调用的最小授权清单

不在本文档范围内：
- 付费用户可见功能的业务级权限逻辑（见产品方案）
- 隐私政策文案与用户告知文本（见法务）
- 具体加密算法选型与合规认证（见未来 Phase 4 专题）

---

## 二、核心原则

1. **默认拒绝**：RLS 默认拒绝所有访问，只允许明确授权的操作
2. **最小授权**：每个 OAuth scope 只给完成当次任务所需的最小权限
3. **用户级隔离**：所有含 user_id 的表必须启用 RLS，`auth.uid() = user_id`
4. **密钥不进客户端**：Supabase service role key / AI provider key 只在 FastAPI 中使用
5. **Layer 1 不对外**：MCP capability 只暴露 Layer 3 摘要，绝不暴露 Layer 1 原始数据
6. **限速即安全**：FastAPI 所有接口必须有 per-user 速率限制

---

## 三、架构内容

### 3.1 用户身份体系

| 身份类型 | 实现 | 说明 |
|---|---|---|
| 手机号用户 | Supabase Phone OTP | 主要注册方式，OTP 自动建号 |
| 邮件用户 | Supabase Email | 备用 |
| Guest 模式 | guestMode=true，mock profile | 跳过登录体验，不写 Supabase |
| 外部 Agent 调用 | OAuth2 access token + scope | MCP capability 调用身份 |

---

### 3.2 完整 RLS 策略

> 所有表必须启用 RLS。直接拥有 `user_id` 的表用直接策略；通过外键关联的表用子查询策略。

```sql
-- ══ 直接含 user_id 的表（直接策略）══════════════════
-- profiles / weight_logs / meals / card_actions / meal_plans / body_patterns / weekly_reports
-- predictions / interventions / health_data / user_similarity
-- fulfillment_orders / fulfillment_events / context_snapshots
-- algorithm_decisions / food_memory_items / food_memory_events
-- meal_ingredient_links / weekly_fulfillment_reports

-- 以 profiles 为示例，其余表替换表名即可：
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON profiles
  FOR ALL USING (auth.uid() = user_id);

-- ══ 通过 meal_id 关联的表（子查询策略）══════════════
-- meal_analysis / meal_corrections / meal_feedback / meal_images

ALTER TABLE meal_analysis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own meal analysis" ON meal_analysis
  FOR ALL USING (
    EXISTS (SELECT 1 FROM meals WHERE meals.id = meal_analysis.meal_id AND meals.user_id = auth.uid())
  );

ALTER TABLE meal_corrections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own meal corrections" ON meal_corrections
  FOR ALL USING (
    EXISTS (SELECT 1 FROM meals WHERE meals.id = meal_corrections.meal_id AND meals.user_id = auth.uid())
  );

ALTER TABLE meal_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own meal feedback" ON meal_feedback
  FOR ALL USING (
    EXISTS (SELECT 1 FROM meals WHERE meals.id = meal_feedback.meal_id AND meals.user_id = auth.uid())
  );

ALTER TABLE meal_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own meal images" ON meal_images
  FOR ALL USING (
    EXISTS (SELECT 1 FROM meals WHERE meals.id = meal_images.meal_id AND meals.user_id = auth.uid())
  );

-- ══ 通过 plan_id 关联的表 ══════════════════════════
-- plan_slots

ALTER TABLE plan_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own plan slots" ON plan_slots
  FOR ALL USING (
    EXISTS (SELECT 1 FROM meal_plans WHERE meal_plans.id = plan_slots.plan_id AND meal_plans.user_id = auth.uid())
  );

-- ══ 通过 prediction_id 关联的表 ═══════════════════
-- prediction_accuracy

ALTER TABLE prediction_accuracy ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own prediction accuracy" ON prediction_accuracy
  FOR ALL USING (
    EXISTS (SELECT 1 FROM predictions WHERE predictions.id = prediction_accuracy.prediction_id AND predictions.user_id = auth.uid())
  );

-- ══ 社区表（全平台共享，只读；写操作由后台服务账号执行）
ALTER TABLE community_dishes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read community dishes" ON community_dishes
  FOR SELECT USING (true);

ALTER TABLE professional_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read templates" ON professional_templates
  FOR SELECT USING (true);

-- contributions 由用户提交
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own contributions" ON contributions
  FOR ALL USING (auth.uid() = user_id);

-- dish_scores / nutrition_targets / plan_slots 也需 user_id 直接策略
ALTER TABLE dish_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own dish scores" ON dish_scores
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE nutrition_targets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own nutrition targets" ON nutrition_targets
  FOR ALL USING (auth.uid() = user_id);

-- ══ 6.0 履约智能用户私有表 ═══════════════════════
ALTER TABLE fulfillment_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own fulfillment orders" ON fulfillment_orders
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE fulfillment_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own fulfillment events" ON fulfillment_events
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE context_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own context snapshots" ON context_snapshots
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE algorithm_decisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own algorithm decisions" ON algorithm_decisions
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE food_memory_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own food memory items" ON food_memory_items
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE food_memory_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own food memory events" ON food_memory_events
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE meal_ingredient_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own meal ingredient links" ON meal_ingredient_links
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE weekly_fulfillment_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own weekly fulfillment reports" ON weekly_fulfillment_reports
  FOR ALL USING (auth.uid() = user_id);

-- canonical_foods / food_identity_mappings 是平台级标准库：
-- 用户只读，写入由后台服务账号或人工审核流程执行。
ALTER TABLE canonical_foods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read canonical foods" ON canonical_foods
  FOR SELECT USING (true);

ALTER TABLE food_identity_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read food identity mappings" ON food_identity_mappings
  FOR SELECT USING (true);
```

---

### 3.3 FastAPI 安全规范

#### 请求鉴权（JWT 验证）

移动端每次请求 FastAPI 时，在 Header 携带 Supabase JWT Token：

```
Authorization: Bearer <supabase_access_token>
```

FastAPI 验证流程（`middleware/auth.py`）：
1. 从 Authorization Header 提取 Bearer token
2. 用 `SUPABASE_JWT_SECRET` 本地验证 JWT 签名（无需调用 Supabase API，纯离线验证）
3. 从 JWT payload 提取 `sub` 字段 → user_id
4. 将 user_id 注入 `request.state`，路由层直接使用

实现（`services/ai/middleware/auth.py`）：

```python
from fastapi import Request, HTTPException
from jose import jwt, JWTError
from config import settings

async def auth_middleware(request: Request, call_next):
    if request.url.path in ["/health", "/docs"]:
        return await call_next(request)
    
    token = request.headers.get("Authorization", "").removeprefix("Bearer ")
    if not token:
        raise HTTPException(401, "Missing token")
    
    try:
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated"
        )
        request.state.user_id = payload["sub"]
    except JWTError:
        raise HTTPException(401, "Invalid token")
    
    return await call_next(request)
```

错误返回：
- `401 Unauthorized`：token 无效/过期
- `403 Forbidden`：请求 body 中的 user_id 与 JWT 中的 sub 不一致（防越权）

#### 速率限制（slowapi）

```python
# 安装: pip install slowapi
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

# 各接口限制（per user_id）
@router.post("/v1/meal/analyze")
@limiter.limit("10/minute")   # 防止 Claude API 费用滥用
async def analyze_meal(...): ...

@router.post("/v1/plan/generate")
@limiter.limit("3/day")       # 计划生成成本较高
async def generate_plan(...): ...
```

各接口速率限制汇总：

| 接口 | 限制 | 原因 |
|---|---|---|
| `POST /v1/meal/analyze` | 10/minute | 防止 AI API 费用滥用 |
| `POST /v1/plan/generate` | 3/day | 计划生成成本较高 |

#### 输入验证（Pydantic）

```python
class AnalyzeRequest(BaseModel):
    image_base64: str = Field(..., max_length=8_000_000)   # base64 限 6MB 原图
    meal_type: Literal["早饭", "午饭", "晚饭", "加餐"]
    user_context: UserContext

class UserContext(BaseModel):
    profile: dict
    recent_meals: list = Field(default=[], max_items=21)
    body_pattern: dict | None = None
    dish_scores: dict = {}
    correction_history: list = Field(default=[], max_items=20)
    unlock_stage: int = Field(default=1, ge=1, le=5)
    # ... 其他字段
```

---

### 3.4 密钥管理规范

| 密钥类型 | 存放位置 | 客户端可见 | 说明 |
|---|---|---|---|
| Supabase anon key | `.env` / EAS Secrets / `EXPO_PUBLIC_*` | 是（受 RLS 保护）| 移动端用 |
| Supabase service role key | `services/ai/.env` / Railway 环境变量 | 否 | 只在 FastAPI 中使用 |
| AI provider key | `services/ai/.env` / Railway 环境变量 | 否 | 只在 FastAPI 中使用 |
| JWT secret | `services/ai/.env` / Railway 环境变量 | 否 | FastAPI 验证 token |
| 报警 webhook URL | `.env` / EAS Secrets | 否 | 见 observability.md |

真实值存放位置：见 `docs/resources/RESOURCE_REGISTRY.md`（本文档只记录「变量名 + 位置」，不记录真实值）

`.gitignore` 中必须包含：
```
.env
.env.*
services/ai/.env
```

---

### 3.5 数据分类与暴露边界

| 数据层 | 能否对外暴露 | 说明 |
|---|---|---|
| Layer 1 原始数据（meal_images / meal_analysis raw）| 绝不 | 只有用户自己通过 App 能看 |
| Layer 2 洞察（Insight 计算结果）| 仅用户自己 + 脱敏社区只读 | 不暴露给外部 Agent |
| Layer 3 摘要（身体拼图 / 推荐结果）| 可经 OAuth 授权暴露 | MCP capability 的数据来源 |

---

### 3.6 MCP OAuth Scope 清单

> 响应 ##044 F2：MCP capability 调用需明确 scope 边界。

| Scope | 授权内容 | 对应 capability |
|---|---|---|
| `meal:write` | 创建餐次记录 / 提交反馈 | `analyze_meal`, `log_meal_feedback` |
| `meal:read` | 读取餐次摘要（非原始图片）| `recommend_meal` |
| `insight:read` | 读取 Layer 3 洞察摘要 | `check_body_insight`, `get_weekly_report` |
| `public` | 无需登录的公共查询 | `query_nutrition` |

Token 颁发流程：
1. 用户在 App 内授权外部 Agent
2. 生成 access_token（有效期 1h）+ refresh_token（有效期 7天）
3. 外部 Agent 使用 access_token 调用 capability API
4. token 不含用户 PII（手机号、邮箱等）

**禁止**：
- scope 不允许使用 `"*"` 通配符
- 单次 access_token 有效期不超过 1 小时
- token payload 不含用户 PII

---

### 3.7 CORS 配置

| 环境 | 允许来源 |
|---|---|
| 本地开发 | `localhost:8081`（React Native dev）、`127.0.0.1`（原型 HTML）|
| 生产 | 仅 App 域名 + 已注册的外部 Agent 域名（白名单机制）|

生产环境禁止使用 `*` 通配符 CORS。

---

## 四、Phase 演进

| Phase | 安全工作 |
|---|---|
| Phase 1 | RLS 全表覆盖 + Phone OTP + Guest mode + FastAPI JWT + 基础速率限制 |
| Phase 2 | MCP OAuth 实现 + scope 第一批（meal:write / meal:read / insight:read）|
| Phase 4 | 健康数据相关更严合规要求（数据留存周期 / 删除权）|

---

## 五、禁止事项

- 禁止真实密钥入仓库（`.env` 已在 `.gitignore`）
- 禁止跳过 RLS（哪怕测试环境也不能关）
- 禁止在客户端使用 service role key
- 禁止 MCP 暴露 Layer 1 原始数据或图片
- 禁止 OAuth scope 使用通配符
- 禁止在响应、日志、文档中回显完整 token 或 key
- 禁止错误日志含用户手机号 / 邮箱等 PII

---

## 六、变更记录

| 日期 | 任务编号 | 变更 |
|---|---|---|
| 2026-06-03 | ##045 | 初版落盘，从蓝图 L2437-L2567 + L2641-L2731 迁出，新增 MCP OAuth scope 清单（响应 ##044 F2）+ 密钥管理表 + 数据分类暴露边界 |
