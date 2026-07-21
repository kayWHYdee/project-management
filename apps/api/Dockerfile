# Build context is the repo root (see docker-compose.yml).
FROM node:20-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

FROM base AS build
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
# All workspace manifests are copied so the frozen lockfile matches the workspace,
# even though only @water-pm/api and its deps are installed.
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile --filter "@water-pm/api..."
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN pnpm --filter @water-pm/shared build \
  && pnpm --filter @water-pm/api exec prisma generate \
  && pnpm --filter @water-pm/api build

FROM base AS runtime
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
COPY --from=build /app /app
WORKDIR /app/apps/api
EXPOSE 3000
# On start: apply committed migrations, run the idempotent seed, then boot.
CMD ["sh", "-c", "pnpm prisma:migrate:deploy && pnpm prisma:seed && node dist/main.js"]
