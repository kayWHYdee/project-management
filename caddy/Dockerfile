# Build context is the repo root (see docker-compose.yml).
# Stage 1 builds the static web bundle; stage 2 is Caddy serving it + proxying /api.
FROM node:20-slim AS web-build
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app
# All workspace manifests are copied so the frozen lockfile matches the workspace,
# even though only @water-pm/web and its deps are installed.
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/web/package.json apps/web/
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile --filter "@water-pm/web..."
COPY packages/shared packages/shared
COPY apps/web apps/web
RUN pnpm --filter @water-pm/shared build \
  && pnpm --filter @water-pm/web build

FROM caddy:2-alpine
COPY caddy/Caddyfile /etc/caddy/Caddyfile
COPY --from=web-build /app/apps/web/dist /srv
