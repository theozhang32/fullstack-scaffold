# Fullstack Scaffold

从 `apps-resources-management` 抽离的最小全栈脚手架：去掉全部业务逻辑，保留可复用的工程范式。

| 层 | 技术 |
| --- | --- |
| 前端 `packages/app` | Vue 3 + vue-router + pinia，antdv-next（自动按需引入）+ tailwindcss v4 |
| 后端 `packages/server` | NestJS v11 + zod（nestjs-zod）+ MikroORM 7（默认 SQLite）+ Swagger + pino 日志 + JWT |
| 共享 `packages/shared` | 前后端同源类型/常量，tsdown 构建出 ESM + CJS |
| 基础 `packages/tsconfig` | 共享 tsconfig 预设（`base.json` / `nestjs.json`） |

## 快速开始

要求：Node 22、pnpm 11（`corepack enable`）。

```bash
pnpm install

# 后端环境变量（JWT_SECRET 需 ≥32 字符，可用 openssl rand -hex 48 生成）
cp packages/server/.env.example packages/server/.env
$EDITOR packages/server/.env

# 初始化数据库：应用迁移 + 创建初始管理员 admin / admin123456
pnpm --filter @fullstack-scaffold/server db:seed

# 同时起前后端（server:3100 / web:5173，vite 代理 /api）
pnpm dev
```

- 前端：<http://localhost:5173>
- Swagger 文档：<http://localhost:3100/api/docs>（默认开发开启，生产关闭，`SWAGGER_ENABLED` 可显式控制）

> 端口默认 3100（3000 常被本机工具占用）；如需修改，同步改 `packages/server/.env` 的 `PORT` 与 `packages/app/vite.config.ts` 的 `nestTarget`。

## 目录结构

```
packages/
├── app/                        # 前端（@fullstack-scaffold/web）
│   └── src/
│       ├── api/                # 端口层：http.ts（唯一网络出入口）+ 各模块 API
│       ├── composables/        # feedback 等 UI 助手
│       ├── models/             # 领域类型（JSON 视图）+ BizError + 展示元数据
│       ├── router/             # 路由 + 全局守卫（会话/角色）
│       ├── stores/             # pinia store（session）
│       ├── views/              # 页面（AppLayout 壳 + 各业务页）
│       └── styles/             # tailwind 入口 + antdv 兼容层
├── server/                     # 后端（@fullstack-scaffold/server）
│   ├── scripts/seed.ts         # db:seed：迁移 + 初始管理员
│   └── src/
│       ├── common/             # 统一响应包/过滤器/拦截器/守卫/装饰器/openapi 工具/分页
│       ├── config/env.ts       # zod 环境变量校验（启动即失败）
│       ├── entities/index.ts   # MikroORM 实体注册表
│       ├── migrations/         # 数据库迁移（schema 变更唯一途径）
│       ├── mikro-orm.config.ts # ORM 配置（app 与 CLI 共用）
│       └── modules/            # 业务模块（auth、users 示例）
│           └── users/
│               ├── user.entity.ts        # 实体定义
│               ├── user.repository.ts    # 数据访问层
│               ├── user.dto.ts           # zod schema + DTO
│               ├── user.service.ts       # 业务编排 + DTO 映射
│               ├── user.controller.ts    # 路由 + 文档装饰器
│               └── users.module.ts
├── shared/                     # @fullstack-scaffold/shared（tsdown 构建）
└── tsconfig/                   # 共享 tsconfig 预设
```

## 后端范式（严格分层）

请求流向：`controller → service → repository → entity`，全局管道统一处理校验与响应包装：

- **zod 校验**：DTO 用 `createZodDto(schema)` 定义，全局 `ZodValidationPipe` 自动校验，失败返回 400 + 字段级 `details`。
- **统一响应包**：成功响应由 `TransformInterceptor` 包装为 `{ code: 0, message: 'ok', data }`；错误由 `HttpExceptionFilter` 统一为 `{ code, message, details }`。文件流接口用 `@SkipTransform()` 跳过包装。
- **认证**：全局 `JwtAuthGuard`（`@Public()` 标记免认证），`JwtAuthGuard` 校验令牌后按 id 加载数据库最新用户挂到 `request.user`。
- **角色**：`@Roles('ADMIN')` 标记 + 全局 `RolesGuard`（任一满足即可）。
- **Swagger**：`common/openapi.ts` 里的 `ZodBody` / `ZodQuery` / `ZodParams` / `ApiOkData` 直接从 zod schema 生成 OpenAPI 3.1 文档，文档与校验同源。

### 新增一个模块（示例：article）

1. **entity**：`src/modules/article/article.entity.ts`（`defineEntity`，指定 `repository: () => ArticleRepository`），并在 `src/entities/index.ts` 登记。
2. **repository**：继承 `EntityRepository<Article>`，查询条件组装与持久化（`add` / `flush` / `delete`，内部走 `getEntityManager()`）收敛在此。
3. **dto**：`createZodDto` 定义创建/更新/查询 schema。
4. **service**：业务编排、唯一性校验、抛 HTTP 语义异常，实体 → DTO 映射（不泄露 passwordHash 之类的内部字段）。
5. **controller**：装饰器组合 `@ApiOperation + @Zod* + @ApiOkData + @Roles`，只做转发。
6. **module**：`MikroOrmModule.forFeature([ArticleEntity])`，在 `app.module.ts` 注册。
7. **migration**：`pnpm --filter @fullstack-scaffold/server migration:create`，重启即自动应用（生产也走同一机制，禁止 `schema:update` 改表）。

## 前端范式

- **http.ts**：统一解包 `{ code, message, data }`、注入 `Authorization: Bearer`、401 自动跳登录、文件下载/上传。
- **api/**：每个后端模块一个端口文件（如 `users.ts`），类型与后端 DTO 对齐。
- **stores/**：pinia setup store；`session` 持有 token 与当前用户，`bootstrap()` 供路由守卫恢复会话。
- **router**：`meta.public` 免登录；`meta.roles: ['ADMIN']` 角色门禁；守卫内完成会话引导。
- **视图**：antdv-next 组件（自动按需引入，无需 import）+ tailwind 工具类混排；提示统一走 `composables/feedback`；错误统一 `BizError.from(e).message`。
- `UsersView.vue` 是完整 CRUD 示例（表格分页/关键字搜索/弹窗表单/删除确认），新页面照抄即可。

## 常用脚本

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` / `dev:app` / `dev:server` | 并行/单独启动前后端 |
| `pnpm build` | 按依赖顺序构建（shared → server/app） |
| `pnpm lint` / `lint:fix` | 全仓 ESLint（@antfu/config） |
| `pnpm --filter @fullstack-scaffold/server migration:create` | 生成迁移 |
| `pnpm --filter @fullstack-scaffold/server migration:pending` | 查看待应用迁移 |
| `pnpm --filter @fullstack-scaffold/server db:seed` | 应用迁移 + 初始管理员 |

## AI 辅助配置

- `.agents/skills/`：与 AI 编码助手配套的技能参考文档（vue / pinia / vue-router / vite / pnpm / tsdown / antfu eslint / nestjs / antdv-next 等 18 个），助手写代码时可据此对齐本项目的技术栈范式。
- `.agents/mcp.json` 与 `.zcode/config.json`：MCP 服务器配置，默认为空；源项目在此挂了 Apifox API 文档 MCP（含项目专属令牌），接入自己的 Apifox 项目时按原结构填回即可。
- `skills-lock.json`：外部技能（如 `nestjs-best-practices`）的来源锁定文件。

## 与源项目的差异

- 业务模块（资源台账/拓扑/字典/审计/RBAC 权限点/运维 SSO）全部移除，只保留 auth + users 示例。
- MySQL → SQLite（`DB_STORAGE` 文件）；换回 MySQL/PostgreSQL 只需替换 `@mikro-orm/sqlite` 驱动与 `mikro-orm.config.ts` 连接参数。
- 权限模型从「角色 × 权限点矩阵」简化为「角色数组」；需要更细粒度时参照源项目恢复 `common/rbac.ts` + `PermissionsGuard` 即可。
- 移除 Docker、jest 测试与 CSV 导入导出等业务化设施。
- `.agents` 技能文档完整保留；源项目 Apifox MCP 的项目 ID 与访问令牌未迁移（属源项目专属凭证）。
