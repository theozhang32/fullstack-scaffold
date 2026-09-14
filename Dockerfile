#
# 多 target 构建：
#   docker build --target web    -t fullstack-scaffold-web .
#   docker build --target server -t fullstack-scaffold-server .
#
# 生产默认假设：同域反代（web 镜像内 nginx 将 /api 转到 server），
# 因此 packages/config 生产环境默认不开启 CORS。

ARG NODE_VERSION=22
ARG PNPM_VERSION=11.24.0

# ---------- 公共基础 ----------
FROM node:${NODE_VERSION}-alpine AS base
ARG PNPM_VERSION
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate
WORKDIR /app

# ---------- 安装依赖（前后端共用缓存层） ----------
FROM base AS deps
# better-sqlite3 等原生模块需要编译工具链
RUN apk add --no-cache python3 make g++
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/web/package.json apps/web/
COPY apps/server/package.json apps/server/
COPY packages/shared/package.json packages/shared/
COPY packages/config/package.json packages/config/
COPY packages/tsconfig packages/tsconfig/
# shared/config 的 prepare 依赖源码，延后到 builder 再构建
RUN pnpm install --frozen-lockfile --ignore-scripts

# ---------- 源码 + workspace 包构建 ----------
FROM deps AS builder
COPY . .
RUN pnpm --filter @fullstack-scaffold/shared --filter @fullstack-scaffold/config run build

# ---------- 前端构建 ----------
FROM builder AS builder-web
RUN pnpm --filter @fullstack-scaffold/web run build

# ---------- 后端构建 + 可部署产物 ----------
FROM builder AS builder-server
RUN pnpm --filter @fullstack-scaffold/server run build \
  && pnpm --filter @fullstack-scaffold/server deploy --prod --legacy /deploy

# ---------- target: web（nginx 静态资源 + /api 反代） ----------
FROM nginx:1.27-alpine AS web
COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=builder-web /app/apps/web/dist /usr/share/nginx/html
# 官方 nginx 镜像会对 /etc/nginx/templates/*.template 做 envsubst
ENV API_UPSTREAM=http://server:3000
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1

# ---------- target: server（NestJS 运行时） ----------
FROM base AS server
ENV NODE_ENV=production
WORKDIR /app

RUN apk add --no-cache wget \
  && addgroup -S app && adduser -S app -G app \
  && mkdir -p /data \
  && chown -R app:app /data

COPY --from=builder-server --chown=app:app /deploy ./

USER app
EXPOSE 3000
# 默认 MySQL；编排需注入可用的 mysql:// DB_URL（及 JWT_SECRET / REDIS_URL / CORS_ORIGINS）
ENV DB_DRIVER=mysql
HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/v1/health >/dev/null || exit 1
CMD ["node", "dist/main.js"]
