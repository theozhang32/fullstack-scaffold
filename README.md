# Fullstack Scaffold

最小全栈脚手架：不含业务逻辑，保留可复用的工程范式。

| 层 | 技术 |
| --- | --- |
| 前端 `apps/web` | Vue 3 + vue-router + pinia，antdv-next（自动按需引入）+ tailwindcss v4 |
| 后端 `apps/server` | NestJS v11 + zod（nestjs-zod）+ MikroORM 7（默认 MySQL，可切 SQLite）+ Swagger + pino 日志 + JWT |
| 契约 `packages/shared` | 前后端同源 zod schema / 类型 / 常量（用户、登录、分页、响应包），tsdown 构建出 ESM + CJS |
| 配置 `packages/config` | env 校验 + web/server 运行时配置（端口、CORS、JWT、分页、日志脱敏） |
| 基础 `packages/tsconfig` | 共享 tsconfig 预设（`base.json` / `nestjs.json`） |

## 快速开始

要求：Node 22、pnpm 11（`corepack enable`）。

```bash
pnpm install

# 后端环境变量（JWT_SECRET 需 ≥32 字符，可用 openssl rand -hex 48 生成）
cp apps/server/.env.example apps/server/.env
$EDITOR apps/server/.env

# 初始化数据库：应用迁移 + 创建初始管理员 admin / admin123456
pnpm --filter @fullstack-scaffold/server db:seed

# 同时起前后端（server:3000 / web:5173，vite 代理 /api）
pnpm dev
```

- 前端：<http://localhost:5173>
- Swagger 文档：<http://localhost:3000/api/docs>（默认开发开启，生产关闭；由 `packages/config` 的 `server.swagger` 控制）

> 端口默认 3000 / 5173，改 `packages/config/src/server.ts` 的 `port` 与 `web.ts` 的 `devPort` 即可，Vite 代理会跟着走。生产 CORS 必须设置 `CORS_ORIGINS`（逗号分隔 Origin），否则服务拒绝启动。

## 目录结构

```
apps/
├── web/                        # 前端（@fullstack-scaffold/web）
│   └── src/
│       ├── api/                # 端口层：http.ts（唯一网络出入口）+ 各模块 API
│       ├── composables/        # feedback 等 UI 助手
│       ├── models/             # 领域类型（JSON 视图）+ BizError + 展示元数据
│       ├── router/             # 路由 + 全局守卫（会话/角色）
│       ├── stores/             # pinia store（session）
│       ├── views/              # 页面（AppLayout 壳 + 各业务页）
│       └── styles/             # tailwind 入口 + antdv 兼容层
└── server/                     # 后端（@fullstack-scaffold/server）
    ├── scripts/seed.ts         # db:seed：迁移 + 初始管理员
    └── src/
        ├── common/             # 统一响应包/过滤器/拦截器/守卫/装饰器/openapi 工具/分页
        ├── config/index.ts     # 薄封装：re-export @fullstack-scaffold/config
        ├── entities/index.ts   # MikroORM 实体注册表
        ├── migrations/         # 数据库迁移（schema 变更唯一途径）
        ├── mikro-orm.config.ts # ORM 配置（app 与 CLI 共用）
        └── modules/            # 业务模块（auth、users 示例）
            └── users/
                ├── user.entity.ts        # 实体定义
                ├── user.repository.ts    # 数据访问层
                ├── user.dto.ts           # createZodDto 包装 shared schema
                ├── user.service.ts       # 业务编排 + DTO 映射
                ├── user.controller.ts    # 路由 + 文档装饰器
                └── users.module.ts
packages/
├── shared/                     # @fullstack-scaffold/shared（zod 契约 + 类型）
├── config/                     # @fullstack-scaffold/config（env + 运行时配置）
└── tsconfig/                   # 共享 tsconfig 预设
```

## 后端范式（严格分层）

请求流向：`controller → service → repository → entity`，全局管道统一处理校验与响应包装：

- **zod 校验**：契约 schema 放在 `@fullstack-scaffold/shared`，服务端 DTO 用 `createZodDto(schema)` 包装，全局 `ZodValidationPipe` 自动校验，失败返回 400 + 字段级 `details`。前端 `z.input` / `z.output` 与后端同源。
- **统一响应包**：成功响应由 `TransformInterceptor` 包装为 `{ code: 0, message: 'ok', data }`；错误由 `HttpExceptionFilter` 统一为 `{ code, message, details }`。文件流接口用 `@SkipTransform()` 跳过包装。
- **认证**：全局 `JwtAuthGuard`（`@Public()` 标记免认证），`JwtAuthGuard` 校验令牌后按 id 加载数据库最新用户挂到 `request.user`。`AuthModule` 显式 `imports: [UsersModule]`，`UsersModule` 不标 `@Global()`。
- **角色**：`@Roles('ADMIN')` 标记 + 全局 `RolesGuard`（任一满足即可）。
- **限流**：全局 `ThrottlerGuard`；`POST /auth/login` 额外限制为每 IP 每分钟 5 次。`/health` 跳过限流。
- **健康检查**：`GET /api/v1/health` 探测进程存活并 `checkConnection()` 数据库，失败返回 503。
- **Swagger**：`common/openapi.ts` 里的 `ZodBody` / `ZodQuery` / `ZodParams` / `ApiOkData` 直接从 zod schema 生成 OpenAPI 3.1 文档，文档与校验同源。

### 新增一个模块（示例：article）

1. **entity**：`src/modules/article/article.entity.ts`（`defineEntity`，指定 `repository: () => ArticleRepository`），并在 `src/entities/index.ts` 登记。
2. **repository**：继承 `EntityRepository<Article>`，查询条件组装与持久化（`add` / `flush` / `delete`，内部走 `getEntityManager()`）收敛在此。
3. **dto**：在 `packages/shared` 定义 zod schema 并 `z.infer` 出类型；服务端 `createZodDto` 包装，前端 API 端口直接引用类型。
4. **service**：业务编排、唯一性校验、抛 HTTP 语义异常，实体 → DTO 映射（不泄露 passwordHash 之类的内部字段）。
5. **controller**：装饰器组合 `@ApiOperation + @Zod* + @ApiOkData + @Roles`，只做转发。
6. **module**：`MikroOrmModule.forFeature([ArticleEntity])`，在 `app.module.ts` 注册。
7. **migration**：`pnpm --filter @fullstack-scaffold/server migration:create`，重启即自动应用（生产也走同一机制，禁止 `schema:update` 改表）。

## 前端范式

- **http.ts**：统一解包 `{ code, message, data }`（`code !== 0` 抛错）、注入 `Authorization: Bearer`、401 自动跳登录、文件下载/上传。
- **api/**：每个后端模块一个端口文件（如 `users.ts`），请求/响应类型从 `@fullstack-scaffold/shared` 引入，不再手写平行 interface。
- **stores/**：pinia setup store；`session` 持有 token 与当前用户，`bootstrap()` 供路由守卫恢复会话。
- **router**：`meta.public` 免登录；`meta.roles: ['ADMIN']` 角色门禁；守卫内完成会话引导。
- **视图**：antdv-next 组件（自动按需引入，无需 import）+ tailwind 工具类混排；提示统一走 `composables/feedback`；错误统一 `BizError.from(e)`（识别 `ApiError`，保留 code / details）。
- `UsersView.vue` 是完整 CRUD 示例（表格分页/关键字搜索/弹窗表单/删除确认），新页面照抄即可。

## 常用脚本

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` / `dev:web` / `dev:server` | 并行/单独启动前后端 |
| `pnpm build` | 按依赖顺序构建（config/shared → web/server） |
| `pnpm lint` / `lint:fix` | 全仓 ESLint（@antfu/config） |
| `pnpm --filter @fullstack-scaffold/server migration:create` | 生成迁移 |
| `pnpm --filter @fullstack-scaffold/server migration:pending` | 查看待应用迁移 |
| `pnpm --filter @fullstack-scaffold/server db:seed` | 应用迁移 + 初始管理员 |

## Docker

仓库根目录单文件 `Dockerfile`，用 `--target` 分别产出前后端镜像：

```bash
# 前端（nginx:80，静态资源 + /api 反代到 API_UPSTREAM）
docker build --target web -t fullstack-scaffold-web .

# 后端（node:3000，默认 MySQL，需注入 DB_URL）
docker build --target server -t fullstack-scaffold-server .
```

本地联调可用 compose（web 映射 `8080`，server `3000`）：

```bash
export JWT_SECRET="$(openssl rand -hex 48)"
docker compose up --build
# 前端 http://localhost:8080  ·  API http://localhost:3000/api/v1
```

- `web` 镜像通过环境变量 `API_UPSTREAM`（默认 `http://server:3000`）把 `/api` 反代到后端，与前端 `apiBaseUrl: /api/v1` 同域，无需开 CORS。
- `server` 需注入 `JWT_SECRET`（≥32 字符）与 `DB_URL`（compose 默认连同栈 `mysql` 服务）；`DB_DRIVER` 默认 `mysql`，可改为 `sqlite`。

## AI 辅助配置

- `.agents/skills/`：与 AI 编码助手配套的技能参考文档（vue / pinia / vue-router / vite / pnpm / tsdown / antfu eslint / nestjs / antdv-next 等 18 个），助手写代码时可据此对齐本项目的技术栈范式。
- `.agents/mcp.json` 与 `.zcode/config.json`：MCP 服务器配置，默认为空；接入 Apifox 等 MCP 时按结构填入即可。
- `skills-lock.json`：外部技能（如 `nestjs-best-practices`）的来源锁定文件。
